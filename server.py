from __future__ import annotations

import json
import os
import re
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import uuid
import xml.etree.ElementTree as ET
import base64
from datetime import datetime, timedelta
from html import unescape
from pathlib import Path
from typing import Any, Optional
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlencode
from urllib.request import Request, urlopen

from fastapi import FastAPI, HTTPException, Query, Response
from pydantic import BaseModel
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles


ROOT = Path(__file__).resolve().parent
LIBRARY_PDFS_DIR = ROOT / "library_pdfs"
DOCUMENT_IMAGES_DIR = ROOT / "document_images"
DOCUMENT_IMAGES_DELETED_DIR = ROOT / "document_images_deleted"
AUTOSAVES_DIR = ROOT / "autosaves"
DEMO_PROJECT_FILE = AUTOSAVES_DIR / "Demo" / "demo-save.json"
ZOTERO_LOCAL_API = "http://localhost:23119/api"
ZOTERO_CONNECTOR_PING = "http://localhost:23119/connector/ping"
ZOTERO_HEADERS = {"Zotero-API-Version": "3"}
GROBID_URL = "http://127.0.0.1:8070"
DEFAULT_PROJECT_NAME = "MMEA"
ZOTERO_PAGE_SIZE = 100

app = FastAPI(title="Research Mind Map Local Backend")
AUTOSAVES_DIR.mkdir(parents=True, exist_ok=True)


def open_with_default_app(path: Path) -> None:
    if sys.platform.startswith("win"):
        os.startfile(str(path))  # type: ignore[attr-defined]
        return
    if sys.platform == "darwin":
        subprocess.run(["open", str(path)], check=True)
        return
    subprocess.run(["xdg-open", str(path)], check=True)


@app.on_event("startup")
def log_server_startup() -> None:
    print(
        f"Research Mind Map backend started. Presence TTL: {PRESENCE_TTL_SECONDS}s. "
        "Debug endpoint: /api/presence/debug"
    )


class MapPublication(BaseModel):
    id: str
    title: str = ""
    doi: str = ""
    year: str = ""
    authors: list[str] = []
    zoteroKey: str = ""


class AnalyzeMapRequest(BaseModel):
    publications: list[MapPublication]


class OpenAlexSimilarRequest(BaseModel):
    publications: list[MapPublication]
    modes: list[str] = ["related"]
    limit: int = 25


class PdfPrepareRequest(BaseModel):
    zoteroKey: str
    title: str = ""
    existingPath: str = ""
    project: str = DEFAULT_PROJECT_NAME


class ImageSaveRequest(BaseModel):
    filename: str = "image"
    contentType: str = "image/png"
    dataUrl: str
    project: str = DEFAULT_PROJECT_NAME


class ImageDeleteRequest(BaseModel):
    relativePath: str
    project: str = DEFAULT_PROJECT_NAME


class ImageReconcileRequest(BaseModel):
    usedImages: list[str] = []
    project: str = DEFAULT_PROJECT_NAME


class AutosaveRequest(BaseModel):
    elements: Any
    nodeTypes: Any = None


class ProjectCreateRequest(BaseModel):
    name: str


class PresenceHeartbeatRequest(BaseModel):
    clientId: str
    project: str
    label: str = ""


PRESENCE_TTL_SECONDS = 45
presence_clients: dict[str, dict[str, Any]] = {}


def safe_project_name(value: str) -> str:
    name = re.sub(r"[^A-Za-z0-9._ -]", "_", value or "")
    name = re.sub(r"\s+", " ", name).strip()
    name = name.strip(" ._")
    if not name:
        raise HTTPException(status_code=400, detail="Project name is required.")
    if name in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid project name.")
    return name[:80]


def project_dir(project: str) -> Path:
    safe_name = safe_project_name(project)
    path = AUTOSAVES_DIR / safe_name
    resolved = path.resolve()
    if AUTOSAVES_DIR.resolve() not in resolved.parents and resolved != AUTOSAVES_DIR.resolve():
        raise HTTPException(status_code=400, detail="Invalid project path.")
    return path


def latest_autosave_path(project: str) -> Path:
    return project_dir(project) / "research-map-latest.json"


def snapshot_dir(project: str) -> Path:
    return project_dir(project) / "snapshots"


def project_document_images_dir(project: str) -> Path:
    return project_dir(project) / "document_images"


def project_deleted_document_images_dir(project: str) -> Path:
    return project_dir(project) / "document_images_deleted"


def project_library_pdfs_dir(project: str) -> Path:
    return project_dir(project) / "library_pdfs"


def read_project_latest(project: str) -> dict[str, Any]:
    safe_name = safe_project_name(project)
    latest_path = latest_autosave_path(project)
    if safe_name == "Demo" and not latest_path.exists() and DEMO_PROJECT_FILE.exists():
        latest_path = DEMO_PROJECT_FILE

    if not latest_path.exists():
        return {"ok": False, "found": False, "project": safe_name}

    try:
        data = json.loads(latest_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=500, detail=f"Latest autosave JSON is invalid: {exc}") from exc

    return {
        "ok": True,
        "found": True,
        "project": safe_name,
        "path": str(latest_path),
        "savedAt": data.get("savedAt", ""),
        "nodeTypes": data.get("nodeTypes"),
        "elements": data.get("elements", data if isinstance(data, list) else []),
    }


def write_project_autosave(project: str, payload: AutosaveRequest) -> dict[str, Any]:
    folder = project_dir(project)
    folder.mkdir(parents=True, exist_ok=True)
    saved_at = datetime.now().astimezone()
    snapshot = {
        "savedAt": saved_at.isoformat(),
        "project": safe_project_name(project),
        "nodeTypes": payload.nodeTypes,
        "elements": payload.elements,
    }
    latest_path = latest_autosave_path(project)
    latest_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    return {
        "ok": True,
        "project": safe_project_name(project),
        "savedAt": snapshot["savedAt"],
        "latestPath": str(latest_path),
    }


def write_project_snapshot(project: str, payload: AutosaveRequest) -> dict[str, Any]:
    folder = snapshot_dir(project)
    folder.mkdir(parents=True, exist_ok=True)
    saved_at = datetime.now().astimezone()
    snapshot = {
        "savedAt": saved_at.isoformat(),
        "project": safe_project_name(project),
        "nodeTypes": payload.nodeTypes,
        "elements": payload.elements,
    }
    timestamp = saved_at.strftime("%Y%m%d-%H%M%S")
    snapshot_path = folder / f"research-map-snapshot-{timestamp}.json"
    snapshot_path.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False), encoding="utf-8")
    return {
        "ok": True,
        "project": safe_project_name(project),
        "savedAt": snapshot["savedAt"],
        "path": str(snapshot_path),
    }


def zotero_get(path: str, params: Optional[dict[str, Any]] = None) -> Any:
    query = f"?{urlencode(params)}" if params else ""
    request = Request(f"{ZOTERO_LOCAL_API}{path}{query}", headers=ZOTERO_HEADERS)
    try:
        with urlopen(request, timeout=8) as response:
            body = response.read().decode("utf-8")
    except HTTPError as exc:
        raise HTTPException(
            status_code=exc.code,
            detail="Zotero is running, but its HTTP local API endpoint is not available.",
        ) from exc
    except URLError as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not reach Zotero Desktop local API. Make sure Zotero is open.",
        ) from exc

    try:
        return json.loads(body)
    except json.JSONDecodeError:
        return body


def zotero_get_all(path: str, params: Optional[dict[str, Any]] = None, max_items: int = 1000) -> list[Any]:
    collected: list[Any] = []
    start = 0
    page_size = min(ZOTERO_PAGE_SIZE, max_items)
    base_params = dict(params or {})
    while len(collected) < max_items:
        page_params = {**base_params, "limit": page_size, "start": start}
        page = zotero_get(path, page_params)
        if not isinstance(page, list):
            break
        collected.extend(page)
        if len(page) < page_size:
            break
        start += page_size
    return collected[:max_items]


def strip_html(value: str) -> str:
    text = value.replace("<br>", "\n").replace("<br/>", "\n").replace("<br />", "\n")
    in_tag = False
    output = []
    for char in text:
        if char == "<":
            in_tag = True
        elif char == ">":
            in_tag = False
        elif not in_tag:
            output.append(char)
    return unescape("".join(output)).strip()


def zotero_connector_is_running() -> bool:
    try:
        with urlopen(ZOTERO_CONNECTOR_PING, timeout=3):
            return True
    except URLError:
        return False


def zotero_data_dir_candidates() -> list[Path]:
    candidates = []
    explicit = os.environ.get("ZOTERO_DATA_DIR")
    if explicit:
        candidates.append(Path(explicit))

    home = Path.home()
    appdata = os.environ.get("APPDATA")
    candidates.extend(
        [
            home / "Zotero",
            Path(appdata) / "Zotero" if appdata else None,
            Path(appdata) / "Zotero" / "Zotero" if appdata else None,
        ]
    )
    return [path for path in candidates if path]


def find_zotero_database() -> Optional[Path]:
    for directory in zotero_data_dir_candidates():
        database = directory / "zotero.sqlite"
        if database.exists():
            return database

    for directory in zotero_data_dir_candidates():
        if not directory.exists():
            continue
        matches = list(directory.rglob("zotero.sqlite"))
        if matches:
            return matches[0]
    return None


def with_zotero_db() -> sqlite3.Connection:
    database = find_zotero_database()
    if not database:
        raise HTTPException(
            status_code=404,
            detail="Could not find zotero.sqlite. Set ZOTERO_DATA_DIR to your Zotero data directory if it is custom.",
        )

    tmp = Path(tempfile.gettempdir()) / "researchmindmap-zotero.sqlite"
    wal = database.with_name(f"{database.name}-wal")
    shm = database.with_name(f"{database.name}-shm")
    shutil.copy2(database, tmp)
    if wal.exists():
        shutil.copy2(wal, tmp.with_name(f"{tmp.name}-wal"))
    if shm.exists():
        shutil.copy2(shm, tmp.with_name(f"{tmp.name}-shm"))
    connection = sqlite3.connect(tmp)
    connection.row_factory = sqlite3.Row
    return connection


def first_table(connection: sqlite3.Connection, names: list[str]) -> Optional[str]:
    existing = {
        row["name"]
        for row in connection.execute("SELECT name FROM sqlite_master WHERE type = 'table'")
    }
    for name in names:
        if name in existing:
            return name
    return None


def zotero_field_values(connection: sqlite3.Connection, item_id: int) -> dict[str, str]:
    values: dict[str, str] = {}
    for row in connection.execute(
        """
        SELECT fields.fieldName, itemDataValues.value
        FROM itemData
        JOIN fields ON fields.fieldID = itemData.fieldID
        JOIN itemDataValues ON itemDataValues.valueID = itemData.valueID
        WHERE itemData.itemID = ?
        """,
        (item_id,),
    ):
        values[row["fieldName"]] = row["value"]
    return values


def zotero_creators(connection: sqlite3.Connection, item_id: int) -> list[str]:
    creator_table = first_table(connection, ["creators"])
    if not creator_table:
        return []

    try:
        rows = connection.execute(
            """
            SELECT creators.firstName, creators.lastName, creators.fieldMode
            FROM itemCreators
            JOIN creators ON creators.creatorID = itemCreators.creatorID
            WHERE itemCreators.itemID = ?
            ORDER BY itemCreators.orderIndex
            """,
            (item_id,),
        ).fetchall()
    except sqlite3.OperationalError:
        return []

    names = []
    for row in rows:
        first = row["firstName"] or ""
        last = row["lastName"] or ""
        names.append((last if row["fieldMode"] == 1 else f"{first} {last}").strip())
    return [name for name in names if name]


def zotero_tags(connection: sqlite3.Connection, item_id: int) -> list[str]:
    try:
        rows = connection.execute(
            """
            SELECT tags.name
            FROM itemTags
            JOIN tags ON tags.tagID = itemTags.tagID
            WHERE itemTags.itemID = ?
            ORDER BY tags.name
            """,
            (item_id,),
        ).fetchall()
    except sqlite3.OperationalError:
        return []
    return [row["name"] for row in rows if row["name"]]


def apa_like_citation(authors: list[str], year: str, title: str) -> str:
    author_text = ", ".join(authors[:3])
    if len(authors) > 3:
        author_text += ", et al."
    if not author_text:
        author_text = "Unknown author"
    year_text = year or "n.d."
    return f"{author_text} ({year_text}). {title}."


def publication_from_db_row(connection: sqlite3.Connection, row: sqlite3.Row) -> Optional[dict[str, Any]]:
    item_type = row["typeName"]
    if item_type in {"attachment", "note", "annotation"}:
        return None

    values = zotero_field_values(connection, row["itemID"])
    title = values.get("title") or values.get("shortTitle") or "Untitled Zotero Item"
    date = values.get("date", "")
    year = date[:4] if date[:4].isdigit() else ""
    doi = values.get("DOI") or ""
    url = values.get("url") or (f"https://doi.org/{doi}" if doi else "")
    authors = zotero_creators(connection, row["itemID"])

    return {
        "zoteroKey": row["key"],
        "itemType": item_type,
        "title": title,
        "authors": authors,
        "year": year,
        "doi": doi,
        "url": url,
        "abstract": values.get("abstractNote") or "",
        "citation": apa_like_citation(authors, year, title),
        "tags": zotero_tags(connection, row["itemID"]),
    }


def db_collections() -> list[dict[str, Any]]:
    connection = with_zotero_db()
    try:
        rows = connection.execute(
            """
            SELECT collections.key, collections.collectionName, parent.key AS parentKey
            FROM collections
            LEFT JOIN collections parent ON parent.collectionID = collections.parentCollectionID
            JOIN libraries ON libraries.libraryID = collections.libraryID
            LEFT JOIN deletedCollections ON deletedCollections.collectionID = collections.collectionID
            WHERE deletedCollections.collectionID IS NULL
              AND COALESCE(libraries.archived, 0) = 0
            ORDER BY collections.collectionName
            """
        ).fetchall()
        return [
            {"key": row["key"], "name": row["collectionName"], "parentKey": row["parentKey"] or ""}
            for row in rows
        ]
    finally:
        connection.close()


def collection_descendant_keys(collections: list[dict[str, Any]], parent_key: str) -> list[str]:
    children_by_parent: dict[str, list[str]] = {}
    for collection in collections:
        children_by_parent.setdefault(collection.get("parentKey") or "", []).append(collection.get("key") or "")

    keys = []
    stack = [parent_key]
    seen: set[str] = set()
    while stack:
        key = stack.pop()
        if not key or key in seen:
            continue
        seen.add(key)
        keys.append(key)
        stack.extend(children_by_parent.get(key, []))
    return keys


def db_items(collection: Optional[str], limit: int, query: str = "", include_subcollections: bool = False) -> list[dict[str, Any]]:
    connection = with_zotero_db()
    try:
        params: list[Any] = []
        where = ["itemTypes.typeName NOT IN ('attachment', 'note', 'annotation')"]
        joins = ["JOIN itemTypes ON itemTypes.itemTypeID = items.itemTypeID"]

        if collection:
            collection_keys = (
                collection_descendant_keys(db_collections(), collection)
                if include_subcollections
                else [collection]
            )
            joins.extend(
                [
                    "JOIN collectionItems ON collectionItems.itemID = items.itemID",
                    "JOIN collections ON collections.collectionID = collectionItems.collectionID",
                    "JOIN libraries ON libraries.libraryID = collections.libraryID",
                    "LEFT JOIN deletedCollections ON deletedCollections.collectionID = collections.collectionID",
                ]
            )
            placeholders = ",".join("?" for _ in collection_keys)
            where.append(f"collections.key IN ({placeholders})")
            where.append("deletedCollections.collectionID IS NULL")
            where.append("COALESCE(libraries.archived, 0) = 0")
            params.extend(collection_keys)

        sqlite_limit = max(limit, 600) if query else limit
        params.append(sqlite_limit)
        rows = connection.execute(
            f"""
            SELECT items.itemID, items.key, itemTypes.typeName
            FROM items
            {' '.join(joins)}
            WHERE {' AND '.join(where)}
            ORDER BY items.dateModified DESC
            LIMIT ?
            """,
            params,
        ).fetchall()
        publications = [publication_from_db_row(connection, row) for row in rows]
        publications = [publication for publication in publications if publication]
        publications = unique_publications(publications)
        if query:
            terms = [term.lower() for term in re.split(r"\s+", query.strip()) if term.strip()]
            publications = [
                publication for publication in publications
                if zotero_publication_matches_query(publication, terms)
            ]
        return publications[:limit]
    finally:
        connection.close()


def unique_publications(publications: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen = set()
    unique = []
    for publication in publications:
        key = publication.get("zoteroKey") or publication.get("title")
        if key in seen:
            continue
        seen.add(key)
        unique.append(publication)
    return unique


def parse_zotero_library(value: str = "user:0") -> dict[str, Any]:
    if value.startswith("group:"):
        group_id = value.split(":", 1)[1]
        if not group_id.isdigit():
            raise HTTPException(status_code=400, detail="Invalid Zotero group library.")
        return {
            "key": f"group:{group_id}",
            "type": "group",
            "id": int(group_id),
            "name": "",
            "path": f"/groups/{group_id}",
        }
    return {"key": "user:0", "type": "user", "id": 0, "name": "My Library", "path": "/users/0"}


def zotero_publication_matches_query(publication: dict[str, Any], terms: list[str]) -> bool:
    if not terms:
        return True
    haystack = " ".join(
        str(part)
        for part in [
            publication.get("title", ""),
            publication.get("year", ""),
            publication.get("itemType", ""),
            publication.get("url", ""),
            publication.get("doi", ""),
            publication.get("citation", ""),
            " ".join(publication.get("authors", []) or []),
            " ".join(publication.get("tags", []) or []),
        ]
    ).lower()
    return all(term in haystack for term in terms)


def zotero_storage_dir() -> Optional[Path]:
    database = find_zotero_database()
    return database.parent / "storage" if database else None


def zotero_item_id_for_key(connection: sqlite3.Connection, key: str) -> Optional[int]:
    row = connection.execute("SELECT itemID FROM items WHERE key = ?", (key,)).fetchone()
    return int(row["itemID"]) if row else None


def zotero_pdf_for_item_key(item_key: str) -> Optional[Path]:
    connection = with_zotero_db()
    try:
        parent_id = zotero_item_id_for_key(connection, item_key)
        storage_dir = zotero_storage_dir()
        if not parent_id or not storage_dir:
            return None

        direct_attachment = connection.execute(
            """
            SELECT child.key, itemAttachments.path, itemAttachments.contentType, itemAttachments.linkMode
            FROM itemAttachments
            JOIN items child ON child.itemID = itemAttachments.itemID
            WHERE itemAttachments.itemID = ?
            """,
            (parent_id,),
        ).fetchone()
        if direct_attachment:
            pdf_path = resolve_zotero_pdf_attachment(storage_dir, direct_attachment)
            if pdf_path:
                return pdf_path

        rows = connection.execute(
            """
            SELECT child.key, itemAttachments.path, itemAttachments.contentType, itemAttachments.linkMode
            FROM itemAttachments
            JOIN items child ON child.itemID = itemAttachments.itemID
            WHERE itemAttachments.parentItemID = ?
            ORDER BY child.dateModified DESC
            """,
            (parent_id,),
        ).fetchall()

        for row in rows:
            pdf_path = resolve_zotero_pdf_attachment(storage_dir, row)
            if pdf_path:
                return pdf_path
        return None
    finally:
        connection.close()


def zotero_pdf_for_publication(publication: MapPublication) -> Optional[tuple[Path, str]]:
    if publication.zoteroKey:
        pdf_path = zotero_pdf_for_item_key(publication.zoteroKey)
        if pdf_path:
            return pdf_path, publication.zoteroKey

    matched_key = find_zotero_item_key_for_publication(publication)
    if matched_key:
        pdf_path = zotero_pdf_for_item_key(matched_key)
        if pdf_path:
            return pdf_path, matched_key
    return None


def find_zotero_item_key_for_publication(publication: MapPublication) -> Optional[str]:
    title = normalize_title(publication.title)
    doi = normalize_doi(publication.doi)
    if not title and not doi:
        return None

    connection = with_zotero_db()
    try:
        rows = connection.execute(
            """
            SELECT items.itemID, items.key, itemTypes.typeName
            FROM items
            JOIN itemTypes ON itemTypes.itemTypeID = items.itemTypeID
            WHERE itemTypes.typeName NOT IN ('attachment', 'note', 'annotation')
            ORDER BY items.dateModified DESC
            LIMIT 3000
            """
        ).fetchall()

        best_key = None
        best_score = 0
        for row in rows:
            candidate = publication_from_db_row(connection, row)
            if not candidate:
                continue
            candidate_title = normalize_title(candidate.get("title", ""))
            candidate_doi = normalize_doi(candidate.get("doi", ""))
            score = 0
            if doi and candidate_doi and doi == candidate_doi:
                score += 100
            if title and candidate_title:
                if title == candidate_title:
                    score += 80
                elif title in candidate_title or candidate_title in title:
                    score += 50
                else:
                    score += title_similarity_score(title, candidate_title)
            if publication.year and str(candidate.get("year", "")) == str(publication.year):
                score += 8
            if score > best_score:
                best_score = score
                best_key = candidate.get("zoteroKey")
        return best_key if best_score >= 70 else None
    finally:
        connection.close()


def title_similarity_score(left: str, right: str) -> int:
    left_terms = {term for term in left.split() if len(term) > 3}
    right_terms = {term for term in right.split() if len(term) > 3}
    if not left_terms or not right_terms:
        return 0
    overlap = len(left_terms & right_terms)
    ratio = overlap / max(len(left_terms), len(right_terms))
    return int(ratio * 60)


def resolve_zotero_pdf_attachment(storage_dir: Path, row: sqlite3.Row) -> Optional[Path]:
    raw_path = row["path"] or ""
    content_type = (row["contentType"] or "").lower()
    attachment_key = row["key"]
    looks_like_pdf = raw_path.lower().endswith(".pdf") or content_type == "application/pdf"
    candidates = []

    if raw_path:
        candidates.append(resolve_zotero_attachment_path(storage_dir, attachment_key, raw_path))

    storage_folder = storage_dir / attachment_key
    if storage_folder.exists():
        candidates.extend(sorted(storage_folder.glob("*.pdf")))
        if looks_like_pdf:
            candidates.extend(path for path in sorted(storage_folder.iterdir()) if path.is_file())

    for candidate in candidates:
        if candidate and candidate.exists() and candidate.is_file() and is_pdf_path(candidate):
            return candidate
    return None


def is_pdf_path(path: Path) -> bool:
    if path.suffix.lower() == ".pdf":
        return True
    try:
        return path.read_bytes()[:5] == b"%PDF-"
    except OSError:
        return False


def resolve_zotero_attachment_path(storage_dir: Path, attachment_key: str, raw_path: str) -> Optional[Path]:
    path = raw_path.replace("\\", "/")
    if path.startswith("storage:"):
        return storage_dir / attachment_key / path.replace("storage:", "", 1)
    if path.startswith("attachments:"):
        return storage_dir.parent / path.replace("attachments:", "", 1)
    candidate = Path(raw_path)
    if candidate.is_absolute():
        return candidate
    return storage_dir / attachment_key / raw_path


def safe_filename(value: str, fallback: str = "publication") -> str:
    value = re.sub(r"[^A-Za-z0-9._ -]", "_", value or fallback)
    value = re.sub(r"\s+", " ", value).strip()
    return value[:120].strip(" ._") or fallback


def copied_pdf_path(item_key: str, title: str = "", project: str = DEFAULT_PROJECT_NAME) -> Path:
    filename = f"{safe_filename(title, item_key)}__{safe_filename(item_key)}.pdf"
    return project_library_pdfs_dir(project) / filename


def relative_pdf_path(pdf_path: Path) -> str:
    try:
        return str(pdf_path.relative_to(ROOT))
    except ValueError:
        return str(pdf_path)


def existing_copied_pdf_for_key(item_key: str, project: str = DEFAULT_PROJECT_NAME) -> Optional[Path]:
    if not item_key:
        return None
    suffix = f"__{safe_filename(item_key)}.pdf".lower()
    folder = project_library_pdfs_dir(project)
    if not folder.exists():
        return None
    matches = [path for path in folder.glob("*.pdf") if path.name.lower().endswith(suffix)]
    matches = sorted(matches)
    return matches[0] if matches else None


def existing_legacy_copied_pdf_for_key(item_key: str) -> Optional[Path]:
    if not item_key or not LIBRARY_PDFS_DIR.exists():
        return None
    suffix = f"__{safe_filename(item_key)}.pdf".lower()
    matches = sorted(path for path in LIBRARY_PDFS_DIR.glob("*.pdf") if path.name.lower().endswith(suffix))
    return matches[0] if matches else None


def existing_pdf_from_payload(payload: PdfPrepareRequest) -> Optional[Path]:
    if payload.existingPath:
        existing = Path(payload.existingPath)
        if not existing.is_absolute():
            existing = ROOT / existing
        project_pdf_dir = project_library_pdfs_dir(payload.project).resolve()
        resolved = existing.resolve()
        allowed = project_pdf_dir in resolved.parents
        if allowed and existing.exists() and existing.suffix.lower() == ".pdf":
            return existing
    return existing_copied_pdf_for_key(payload.zoteroKey, payload.project)


def prepare_library_pdf(item_key: str, title: str = "", project: str = DEFAULT_PROJECT_NAME) -> dict[str, Any]:
    existing = existing_copied_pdf_for_key(item_key, project)
    if existing:
        return {
            "sourcePath": "",
            "path": str(existing),
            "relativePath": relative_pdf_path(existing),
            "copied": False,
            "reused": True,
        }

    legacy_existing = existing_legacy_copied_pdf_for_key(item_key)
    target_dir = project_library_pdfs_dir(project)
    target_dir.mkdir(parents=True, exist_ok=True)
    target_pdf = copied_pdf_path(item_key, title, project)
    if legacy_existing and legacy_existing.exists():
        copied = not target_pdf.exists()
        if copied:
            shutil.copy2(legacy_existing, target_pdf)
        return {
            "sourcePath": str(legacy_existing),
            "path": str(target_pdf),
            "relativePath": relative_pdf_path(target_pdf),
            "copied": copied,
            "reused": not copied,
            "migrated": True,
        }

    source_pdf = zotero_pdf_for_item_key(item_key)
    if not source_pdf:
        raise HTTPException(status_code=404, detail="No local Zotero PDF attachment found for this publication.")

    copied = not target_pdf.exists()
    if copied:
        shutil.copy2(source_pdf, target_pdf)
    return {
        "sourcePath": str(source_pdf),
        "path": str(target_pdf),
        "relativePath": relative_pdf_path(target_pdf),
        "copied": copied,
        "reused": not copied,
    }


def pdf_for_payload(payload: PdfPrepareRequest) -> tuple[Path, dict[str, Any]]:
    existing = existing_pdf_from_payload(payload)
    if existing:
        return existing, {
            "sourcePath": "",
            "path": str(existing),
            "relativePath": relative_pdf_path(existing),
            "copied": False,
            "reused": True,
        }

    if not payload.zoteroKey:
        raise HTTPException(status_code=400, detail="Missing Zotero item key.")

    result = prepare_library_pdf(payload.zoteroKey, payload.title, payload.project)
    return Path(result["path"]), result


def clean_highlight_text(text: str) -> str:
    text = re.sub(r"(\w)-\s+(\w)", r"\1\2", text or "")
    text = re.sub(r"\s+", " ", text).strip()
    words = text.split()
    if len(words) < 8:
        return text

    cleaned_words = []
    for word in words:
        if cleaned_words[-6:] and word == cleaned_words[-1]:
            continue
        cleaned_words.append(word)
    return " ".join(cleaned_words)


def candidate_quality(text: str, method: str) -> float:
    text = clean_highlight_text(text)
    if not text or text.startswith("[Highlighted text could not"):
        return 0
    words = text.split()
    unique_ratio = len(set(words)) / max(len(words), 1)
    score = min(len(text), 1200) / 1200
    score += min(len(words), 120) / 120
    score += unique_ratio
    if method in {"balanced", "strict"}:
        score += 0.25
    if len(words) >= 12 and unique_ratio < 0.55:
        score -= 0.6
    return score


def confidence_for_text(text: str, method: str) -> str:
    words = clean_highlight_text(text).split()
    if not words:
        return "Low"
    if method in {"strict", "balanced"} and len(words) >= 8:
        return "High"
    if len(words) >= 4:
        return "Medium"
    return "Low"


def textbox_highlight_text(page: Any, quads: list[Any]) -> str:
    texts = []
    for quad in quads:
        text = page.get_textbox(quad.rect).strip()
        if text:
            texts.append(text)
    return clean_highlight_text(" ".join(texts))


def rect_overlap_ratio(word_rect: Any, highlight_rect: Any) -> float:
    x0 = max(float(word_rect.x0), float(highlight_rect.x0))
    y0 = max(float(word_rect.y0), float(highlight_rect.y0))
    x1 = min(float(word_rect.x1), float(highlight_rect.x1))
    y1 = min(float(word_rect.y1), float(highlight_rect.y1))
    if x1 <= x0 or y1 <= y0:
        return 0
    overlap_area = (x1 - x0) * (y1 - y0)
    word_area = max(float(word_rect.width) * float(word_rect.height), 0.001)
    return overlap_area / word_area


def word_center_in_vertical_band(word_rect: Any, highlight_rect: Any, tolerance: float) -> bool:
    center_y = (float(word_rect.y0) + float(word_rect.y1)) / 2
    return (float(highlight_rect.y0) - tolerance) <= center_y <= (float(highlight_rect.y1) + tolerance)


def quad_word_text(page: Any, quads: list[Any], overlap_threshold: float, vertical_tolerance_ratio: float) -> str:
    import fitz

    words = page.get_text("words")
    text_lines = []
    seen_lines: set[str] = set()
    for quad in sorted(quads, key=lambda item: (item.rect.y0, item.rect.x0)):
        quad_rect = quad.rect
        tolerance = max(1.0, float(quad_rect.height) * vertical_tolerance_ratio)
        matched = []
        for word in words:
            word_rect = fitz.Rect(word[:4])
            if not word_center_in_vertical_band(word_rect, quad_rect, tolerance):
                continue
            if rect_overlap_ratio(word_rect, quad_rect) < overlap_threshold:
                continue
            matched.append({
                "x0": float(word[0]),
                "text": str(word[4]),
            })
        if not matched:
            continue
        matched.sort(key=lambda item: item["x0"])
        line = clean_highlight_text(" ".join(item["text"] for item in matched))
        if line and line not in seen_lines:
            seen_lines.add(line)
            text_lines.append(line)
    return clean_highlight_text(" ".join(text_lines))


def strict_highlight_text(page: Any, quads: list[Any]) -> str:
    return quad_word_text(page, quads, overlap_threshold=0.55, vertical_tolerance_ratio=0.15)


def balanced_highlight_text(page: Any, quads: list[Any]) -> str:
    return quad_word_text(page, quads, overlap_threshold=0.35, vertical_tolerance_ratio=0.22)


def loose_highlight_text(page: Any, quads: list[Any]) -> str:
    return quad_word_text(page, quads, overlap_threshold=0.20, vertical_tolerance_ratio=0.35)


def expanded_rect_highlight_text(page: Any, quads: list[Any]) -> str:
    import fitz

    if not quads:
        return ""
    rect = fitz.Rect(quads[0].rect)
    for quad in quads[1:]:
        rect.include_rect(quad.rect)
    rect.x0 -= 1
    rect.y0 -= 1
    rect.x1 += 1
    rect.y1 += 1
    return clean_highlight_text(page.get_textbox(rect))


def best_highlight_candidate(page: Any, quads: list[Any], comment: str) -> dict[str, str]:
    candidates = [
        ("strict", strict_highlight_text(page, quads)),
        ("balanced", balanced_highlight_text(page, quads)),
        ("loose", loose_highlight_text(page, quads)),
        ("textbox", textbox_highlight_text(page, quads)),
    ]
    if comment:
        candidates.append(("annotation-comment", clean_highlight_text(comment)))
    if not any(text for _, text in candidates):
        candidates.append(("expanded-rect", expanded_rect_highlight_text(page, quads)))

    variants = [
        {
            "method": method,
            "text": text,
            "confidence": confidence_for_text(text, method),
        }
        for method, text in candidates
        if text
    ]
    method, text = max(candidates, key=lambda item: candidate_quality(item[1], item[0]))
    if not text:
        text = "[Highlighted text could not be extracted from this PDF viewer's annotation coordinates.]"
        method = "unreadable"
        variants = [{"method": method, "text": text, "confidence": "Low"}]
    return {
        "text": text,
        "method": method,
        "confidence": confidence_for_text(text, method),
        "variants": variants,
    }


def annotation_text(info: dict[str, Any]) -> str:
    return clean_highlight_text(info.get("content") or "")


def format_highlight_annotation_text(highlight_text: str, comment: str) -> str:
    has_extracted_text = bool(highlight_text) and not highlight_text.startswith("[Highlighted text could not")
    if not has_extracted_text:
        return highlight_text
    parts = []
    parts.append(highlight_text)
    if comment:
        parts.append(f"Comment: {comment}")
    return "\n".join(parts)


def extract_pdf_highlights(pdf_path: Path) -> list[dict[str, Any]]:
    try:
        import fitz
    except ImportError as exc:
        raise HTTPException(
            status_code=500,
            detail="PyMuPDF is not installed. Run: pip install -r requirements.txt",
        ) from exc

    annotations_out: list[dict[str, Any]] = []
    try:
        document = fitz.open(pdf_path)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not read PDF: {exc}") from exc

    try:
        for page_index in range(document.page_count):
            page = document[page_index]
            annotations = page.annots() or []
            for annotation_index, annotation in enumerate(annotations, start=1):
                annotation_type_id, annotation_type_name = annotation.type
                info = annotation.info or {}
                comment = annotation_text(info)

                if annotation_type_id == fitz.PDF_ANNOT_HIGHLIGHT:
                    vertices = list(annotation.vertices or [])
                    quads = []
                    if vertices:
                        for vertex_index in range(0, len(vertices), 4):
                            quad_points = vertices[vertex_index:vertex_index + 4]
                            if len(quad_points) != 4:
                                continue
                            quads.append(fitz.Quad(quad_points))

                    candidate = best_highlight_candidate(page, quads, "")
                    text = format_highlight_annotation_text(candidate["text"], comment)
                    has_extracted_text = bool(text) and not text.startswith("[Highlighted text could not")
                    label = "Highlight"
                    variants = [
                        {
                            **variant,
                            "text": format_highlight_annotation_text(variant["text"], comment),
                        }
                        for variant in candidate["variants"]
                    ]

                    annotations_out.append({
                        "id": f"page-{page_index + 1}-annotation-{annotation_index}",
                        "page": page_index + 1,
                        "type": label,
                        "annotationType": annotation_type_name,
                        "text": text,
                        "comment": comment,
                        "method": candidate["method"],
                        "confidence": candidate["confidence"],
                        "variants": variants,
                    })
                    continue

                if annotation_type_id in {
                    fitz.PDF_ANNOT_TEXT,
                    fitz.PDF_ANNOT_FREE_TEXT,
                    fitz.PDF_ANNOT_CARET,
                    fitz.PDF_ANNOT_STAMP,
                    fitz.PDF_ANNOT_UNDERLINE,
                    fitz.PDF_ANNOT_STRIKE_OUT,
                    fitz.PDF_ANNOT_SQUIGGLY,
                } and comment:
                    label = "Free Text" if annotation_type_id == fitz.PDF_ANNOT_FREE_TEXT else "Comment"
                    annotations_out.append({
                        "id": f"page-{page_index + 1}-annotation-{annotation_index}",
                        "page": page_index + 1,
                        "type": label,
                        "annotationType": annotation_type_name,
                        "text": comment,
                        "comment": comment,
                        "method": "annotation-comment",
                        "confidence": "High",
                        "variants": [{
                            "method": "annotation-comment",
                            "text": comment,
                            "confidence": "High",
                        }],
                    })
    finally:
        document.close()

    return annotations_out


def grobid_get(path: str) -> str:
    try:
        with urlopen(f"{GROBID_URL}{path}", timeout=8) as response:
            return response.read().decode("utf-8", errors="replace")
    except URLError as exc:
        raise HTTPException(status_code=503, detail="Could not reach local GROBID at http://127.0.0.1:8070.") from exc


OPENALEX_API = "https://api.openalex.org"
OPENALEX_USER_AGENT = "ResearchMindMap/1.0 (https://github.com/ulubilgeulusoy/researchmindmap)"


def openalex_get(path: str, params: Optional[dict[str, Any]] = None) -> dict[str, Any]:
    query_params = dict(params or {})
    mailto = os.environ.get("OPENALEX_MAILTO", "").strip()
    if mailto:
        query_params["mailto"] = mailto
    query = f"?{urlencode(query_params)}" if query_params else ""
    request = Request(f"{OPENALEX_API}{path}{query}", headers={"User-Agent": OPENALEX_USER_AGENT})
    try:
        with urlopen(request, timeout=12) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=exc.code, detail=f"OpenAlex request failed: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=503, detail="Could not reach OpenAlex.") from exc
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="OpenAlex returned invalid JSON.") from exc


def openalex_short_id(value: str) -> str:
    return (value or "").rstrip("/").split("/")[-1]


def abstract_from_inverted_index(index: Any) -> str:
    if not isinstance(index, dict):
        return ""
    positions: list[tuple[int, str]] = []
    for word, word_positions in index.items():
        if not isinstance(word_positions, list):
            continue
        for position in word_positions:
            if isinstance(position, int):
                positions.append((position, word))
    return " ".join(word for _, word in sorted(positions))


def openalex_authors(work: dict[str, Any]) -> list[str]:
    authors = []
    for authorship in work.get("authorships") or []:
        author = authorship.get("author") or {}
        name = author.get("display_name")
        if name:
            authors.append(name)
    return authors


def openalex_best_url(work: dict[str, Any]) -> str:
    doi = work.get("doi") or ""
    if doi:
        return doi
    primary = work.get("primary_location") or {}
    landing = primary.get("landing_page_url") or ""
    if landing:
        return landing
    return work.get("id") or ""


def openalex_result(work: dict[str, Any], relationships: Optional[list[dict[str, str]]] = None) -> dict[str, Any]:
    primary = work.get("primary_location") or {}
    source = primary.get("source") or {}
    open_access = work.get("open_access") or {}
    doi = work.get("doi") or ""
    return {
        "id": work.get("id") or "",
        "openalexId": openalex_short_id(work.get("id") or ""),
        "title": work.get("display_name") or "Untitled OpenAlex work",
        "authors": openalex_authors(work),
        "year": str(work.get("publication_year") or ""),
        "doi": doi,
        "url": openalex_best_url(work),
        "openalexUrl": work.get("id") or "",
        "landingPageUrl": primary.get("landing_page_url") or "",
        "pdfUrl": (primary.get("pdf_url") or open_access.get("oa_url") or ""),
        "source": source.get("display_name") or "",
        "type": work.get("type") or "",
        "citedByCount": work.get("cited_by_count") or 0,
        "abstract": abstract_from_inverted_index(work.get("abstract_inverted_index")),
        "relationships": relationships or [],
    }


def openalex_resolve_work(publication: MapPublication) -> Optional[str]:
    doi = normalize_doi(publication.doi)
    if doi:
        try:
            work = openalex_get(f"/works/{quote(f'https://doi.org/{doi}', safe=':/')}")
            return openalex_short_id(work.get("id") or "")
        except HTTPException:
            pass

    if publication.title.strip():
        data = openalex_get(
            "/works",
            {"search": publication.title.strip(), "per-page": 1, "select": "id,display_name"},
        )
        results = data.get("results") or []
        if results:
            return openalex_short_id(results[0].get("id") or "")
    return None


def openalex_work_reference_ids(work: dict[str, Any]) -> set[str]:
    return {openalex_short_id(value) for value in work.get("referenced_works") or [] if value}


def openalex_relationships_for_result(
    result_work: dict[str, Any],
    resolved_publications: list[dict[str, Any]],
    known_relationships: Optional[dict[str, str]] = None,
) -> list[dict[str, str]]:
    result_id = openalex_short_id(result_work.get("id") or "")
    result_references = openalex_work_reference_ids(result_work)
    known_relationships = known_relationships or {}
    relationships = []
    for seed in resolved_publications:
        seed_id = seed.get("openalexId", "")
        seed_references = seed.get("referencedWorkIds", set())
        if known_relationships.get(seed_id) == "result-cites-seed":
            relation = "result-cites-seed"
            label = "This found paper cites the selected paper."
        elif known_relationships.get(seed_id) == "seed-cites-result":
            relation = "seed-cites-result"
            label = "The selected paper cites this found paper."
        elif seed_id and seed_id in result_references:
            relation = "result-cites-seed"
            label = "This found paper cites the selected paper."
        elif result_id and result_id in seed_references:
            relation = "seed-cites-result"
            label = "The selected paper cites this found paper."
        else:
            relation = "none"
            label = "No citation relationship found."
        relationships.append({
            "seedTitle": seed.get("title") or "Selected publication",
            "seedOpenAlexId": seed_id,
            "relation": relation,
            "label": label,
        })
    return relationships


def openalex_mode_filter(mode: str, work_id: str) -> Optional[str]:
    if mode == "related":
        return f"related_to:{work_id}"
    if mode == "cites":
        return f"cites:{work_id}"
    if mode == "cited_by":
        return f"cited_by:{work_id}"
    return None


def grobid_process_references(pdf_path: Path) -> str:
    boundary = f"----researchmindmap-{uuid.uuid4().hex}"
    pdf_bytes = pdf_path.read_bytes()
    body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="input"; filename="{pdf_path.name}"\r\n'
        "Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + pdf_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")
    request = Request(
        f"{GROBID_URL}/api/processReferences",
        data=body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            return response.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:500]
        raise HTTPException(status_code=502, detail=f"GROBID reference extraction failed: {detail}") from exc
    except URLError as exc:
        raise HTTPException(status_code=503, detail="Could not reach local GROBID while extracting references.") from exc


def creator_name(creator: dict[str, Any]) -> str:
    if creator.get("name"):
        return creator["name"]
    return " ".join(part for part in [creator.get("firstName"), creator.get("lastName")] if part).strip()


def normalize_doi(value: str) -> str:
    value = (value or "").strip().lower()
    value = value.replace("https://doi.org/", "").replace("http://dx.doi.org/", "")
    return value.rstrip(".,; ")


def normalize_title(value: str) -> str:
    value = (value or "").lower()
    value = re.sub(r"[^a-z0-9\s]", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def parse_grobid_references(tei_xml: str) -> list[dict[str, Any]]:
    root = ET.fromstring(tei_xml)
    ns = {"tei": "http://www.tei-c.org/ns/1.0"}
    refs = []
    for bibl in root.findall(".//tei:listBibl/tei:biblStruct", ns):
        title = first_text(bibl, ".//tei:analytic/tei:title", ns) or first_text(bibl, ".//tei:monogr/tei:title", ns)
        doi = ""
        for idno in bibl.findall(".//tei:idno", ns):
            if (idno.attrib.get("type") or "").lower() == "doi" and idno.text:
                doi = idno.text.strip()
                break
        year = ""
        date = bibl.find(".//tei:date", ns)
        if date is not None:
            year = (date.attrib.get("when") or date.text or "")[:4]
        authors = []
        for author in bibl.findall(".//tei:author", ns):
            name = " ".join(text for text in author.itertext()).strip()
            if name:
                authors.append(re.sub(r"\s+", " ", name))
        raw = " ".join(text for text in bibl.itertext()).strip()
        refs.append({
            "title": title or "",
            "doi": normalize_doi(doi),
            "year": year if year.isdigit() else "",
            "authors": authors,
            "raw": re.sub(r"\s+", " ", raw),
        })
    return refs


def first_text(element: ET.Element, path: str, ns: dict[str, str]) -> str:
    found = element.find(path, ns)
    return " ".join(found.itertext()).strip() if found is not None else ""


def title_similarity(a: str, b: str) -> float:
    from difflib import SequenceMatcher
    return SequenceMatcher(None, normalize_title(a), normalize_title(b)).ratio()


def match_reference(reference: dict[str, Any], candidates: list[MapPublication], citing_id: str) -> Optional[dict[str, Any]]:
    ref_doi = normalize_doi(reference.get("doi", ""))
    ref_title = reference.get("title", "")
    best = None
    for candidate in candidates:
        if candidate.id == citing_id:
            continue
        cand_doi = normalize_doi(candidate.doi)
        if ref_doi and cand_doi and ref_doi == cand_doi:
            score = 0.99
            reason = "DOI exact match"
        else:
            score = title_similarity(ref_title, candidate.title) if ref_title and candidate.title else 0
            if score >= 0.94:
                reason = "Title near-exact match"
            elif score >= 0.86 and reference.get("year") and candidate.year and reference.get("year") == candidate.year:
                reason = "Title and year match"
                score = max(score, 0.88)
            elif score >= 0.82:
                reason = "Fuzzy title match"
            else:
                continue
        if not best or score > best["confidence"]:
            best = {
                "citedNodeId": candidate.id,
                "citedTitle": candidate.title,
                "confidence": round(score, 3),
                "matchReason": reason,
                "reference": reference,
            }
    return best


def publication_from_item(item: dict[str, Any]) -> Optional[dict[str, Any]]:
    data = item.get("data", {})
    library = item.get("library", {})
    item_type = data.get("itemType", "")
    if item_type in {"attachment", "note", "annotation"}:
        return None

    title = data.get("title") or data.get("shortTitle") or "Untitled Zotero Item"
    creators = [creator_name(creator) for creator in data.get("creators", [])]
    creators = [name for name in creators if name]
    year = (data.get("date") or "")[:4]
    doi = data.get("DOI") or ""
    url = data.get("url") or (f"https://doi.org/{doi}" if doi else "")
    citation = item.get("citation") or item.get("bib") or ""

    return {
        "zoteroKey": item.get("key"),
        "libraryType": library.get("type", "user"),
        "libraryId": library.get("id", 0),
        "libraryName": library.get("name", "My Library"),
        "itemType": item_type,
        "title": title,
        "authors": creators,
        "year": year,
        "doi": doi,
        "url": url,
        "abstract": data.get("abstractNote") or "",
        "citation": strip_html(citation),
        "tags": [tag.get("tag") for tag in data.get("tags", []) if tag.get("tag")],
    }


def collection_from_api_item(collection: dict[str, Any]) -> Optional[dict[str, Any]]:
    data = collection.get("data", {})
    library = collection.get("library", {})
    key = collection.get("key")
    if not key or data.get("deleted") or data.get("trashed"):
        return None
    parent = data.get("parentCollection") or ""
    return {
        "key": key,
        "name": data.get("name", "Untitled Collection"),
        "parentKey": parent if isinstance(parent, str) else "",
        "libraryType": library.get("type", "user"),
        "libraryId": library.get("id", 0),
        "libraryName": library.get("name", "My Library"),
    }


def zotero_api_libraries() -> list[dict[str, Any]]:
    libraries = [{"key": "user:0", "type": "user", "id": 0, "name": "My Library"}]
    groups = zotero_get_all("/users/0/groups", max_items=1000)
    for group in groups:
        data = group.get("data", {})
        group_id = data.get("id") or group.get("id")
        if not group_id:
            continue
        libraries.append({
            "key": f"group:{group_id}",
            "type": "group",
            "id": group_id,
            "name": data.get("name") or f"Group {group_id}",
        })
    return libraries


def zotero_api_collections(library_value: str = "user:0", top_only: bool = False) -> list[dict[str, Any]]:
    library = parse_zotero_library(library_value)
    endpoint = "collections/top" if top_only else "collections"
    collections = zotero_get_all(f"{library['path']}/{endpoint}", max_items=5000)
    return [
        parsed for parsed in
        (collection_from_api_item(collection) for collection in collections)
        if parsed
    ]


def zotero_api_items(
    library_value: str,
    collection: Optional[str],
    limit: int,
    query: str,
    style: str,
    include_subcollections: bool = False,
) -> list[dict[str, Any]]:
    library = parse_zotero_library(library_value)
    collection_keys = [collection] if collection else [""]
    if collection and include_subcollections:
        collection_keys = collection_descendant_keys(zotero_api_collections(library_value), collection)

    publications = []
    for collection_key in collection_keys:
        path = (
            f"{library['path']}/collections/{quote(collection_key)}/items/top"
            if collection_key
            else f"{library['path']}/items/top"
        )
        params = {"limit": limit, "format": "json", "include": "data,bib,citation", "style": style}
        if query:
            params["q"] = query
            params["qmode"] = "titleCreatorYear"
        items = zotero_get_all(path, params, max_items=limit)
        publications.extend(publication for publication in (publication_from_item(item) for item in items) if publication)

    return unique_publications(publications)[:limit]


@app.get("/api/zotero/status")
def zotero_status(response: Response) -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    connector_running = zotero_connector_is_running()
    try:
        zotero_get("/users/0/items/top", {"limit": 1})
    except HTTPException as exc:
        database = find_zotero_database()
        if database:
            return {
                "ok": True,
                "message": (
                    "Zotero live local API is not reachable; using read-only local database fallback. "
                    "Recent Zotero edits may not appear immediately."
                ),
                "mode": "sqlite",
                "database": str(database),
            }
        return {
            "ok": False,
            "message": f"{exc.detail} No local zotero.sqlite database was found.",
            "connectorRunning": connector_running,
        }
    return {"ok": True, "message": "Zotero Desktop HTTP local API is reachable.", "mode": "http"}


@app.get("/api/zotero/collections")
def zotero_collections(response: Response, library: str = "user:0") -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    try:
        return {
            "collections": zotero_api_collections(library),
            "topCollections": zotero_api_collections(library, top_only=True),
        }
    except HTTPException:
        if library != "user:0":
            raise
        collections = db_collections()
        return {
            "collections": collections,
            "topCollections": [collection for collection in collections if not collection.get("parentKey")],
        }


@app.get("/api/zotero/libraries")
def zotero_libraries(response: Response) -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    try:
        return {"libraries": zotero_api_libraries(), "mode": "http"}
    except HTTPException:
        return {"libraries": [{"key": "user:0", "type": "user", "id": 0, "name": "My Library"}], "mode": "sqlite"}


@app.get("/api/zotero/items")
def zotero_items(
    response: Response,
    library: str = "user:0",
    collection: Optional[str] = None,
    q: str = "",
    limit: int = Query(default=250, ge=1, le=1000),
    style: str = "apa",
    includeSubcollections: bool = False,
) -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    query = q.strip()
    try:
        return {
            "items": zotero_api_items(library, collection, limit, query, style, includeSubcollections),
            "mode": "http",
        }
    except HTTPException:
        if library != "user:0":
            raise
        return {"items": db_items(collection, limit, query, includeSubcollections), "mode": "sqlite"}


@app.get("/api/grobid/status")
def grobid_status() -> dict[str, Any]:
    try:
        alive = grobid_get("/api/isalive").strip()
        version = grobid_get("/api/version").strip()
    except HTTPException as exc:
        return {"ok": False, "message": exc.detail}
    return {"ok": True, "message": f"GROBID is reachable: {alive}", "version": version}


@app.get("/api/openalex/search")
def openalex_search(
    response: Response,
    q: str = "",
    limit: int = Query(default=25, ge=1, le=50),
) -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    query = q.strip()
    if not query:
        return {"items": []}
    data = openalex_get(
        "/works",
        {
            "search": query,
            "per-page": limit,
            "select": "id,display_name,authorships,publication_year,doi,primary_location,open_access,type,cited_by_count,abstract_inverted_index",
        },
    )
    return {"items": [openalex_result(work) for work in data.get("results") or []]}


@app.post("/api/openalex/similar")
def openalex_similar(payload: OpenAlexSimilarRequest, response: Response) -> dict[str, Any]:
    response.headers["Cache-Control"] = "no-store"
    limit = max(1, min(payload.limit, 50))
    modes = [mode for mode in payload.modes if mode in {"related", "cites", "cited_by"}]
    if not modes:
        modes = ["related"]
    seen: set[str] = set()
    items: list[dict[str, Any]] = []
    item_by_key: dict[str, dict[str, Any]] = {}
    relationship_by_key: dict[str, dict[str, str]] = {}
    resolved: list[dict[str, Any]] = []

    for publication in payload.publications[:8]:
        work_id = openalex_resolve_work(publication)
        if not work_id:
            continue
        seed_work = openalex_get(
            f"/works/{quote(work_id)}",
            {"select": "id,display_name,referenced_works"},
        )
        resolved.append({
            "title": publication.title or seed_work.get("display_name") or "Selected publication",
            "openalexId": work_id,
            "referencedWorkIds": openalex_work_reference_ids(seed_work),
        })

    for seed in resolved:
        work_id = seed.get("openalexId", "")
        for mode in modes:
            filter_value = openalex_mode_filter(mode, work_id)
            if not filter_value:
                continue
            data = openalex_get(
                "/works",
                {
                    "filter": filter_value,
                    "per-page": limit,
                    "sort": "cited_by_count:desc",
                    "select": "id,display_name,authorships,publication_year,doi,primary_location,open_access,type,cited_by_count,abstract_inverted_index,referenced_works",
                },
            )
            for work in data.get("results") or []:
                key = openalex_short_id(work.get("id") or "") or work.get("doi") or work.get("display_name")
                if not key:
                    continue
                known = relationship_by_key.setdefault(key, {})
                if mode == "cites":
                    known[work_id] = "result-cites-seed"
                elif mode == "cited_by":
                    known[work_id] = "seed-cites-result"

                if key in item_by_key:
                    item_by_key[key]["relationships"] = openalex_relationships_for_result(work, resolved, known)
                    continue

                item = openalex_result(work, openalex_relationships_for_result(work, resolved, known))
                seen.add(key)
                item_by_key[key] = item
                items.append(item)
                if len(items) >= limit:
                    return {"items": items, "resolved": [
                        {"title": seed.get("title", ""), "openalexId": seed.get("openalexId", "")}
                        for seed in resolved
                    ], "modes": modes}

    return {"items": items, "resolved": [
        {"title": seed.get("title", ""), "openalexId": seed.get("openalexId", "")}
        for seed in resolved
    ], "modes": modes}


@app.post("/api/pdf/prepare")
def pdf_prepare(payload: PdfPrepareRequest) -> dict[str, Any]:
    if not payload.zoteroKey:
        raise HTTPException(status_code=400, detail="Missing Zotero item key.")
    result = prepare_library_pdf(payload.zoteroKey, payload.title, payload.project)
    return {"ok": True, **result}


@app.post("/api/pdf/open")
def pdf_open(payload: PdfPrepareRequest) -> dict[str, Any]:
    pdf_path, result = pdf_for_payload(payload)

    try:
        open_with_default_app(pdf_path)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise HTTPException(status_code=500, detail=f"Could not open PDF: {exc}") from exc
    return {"ok": True, **result}


@app.post("/api/pdf/highlights")
def pdf_highlights(payload: PdfPrepareRequest) -> dict[str, Any]:
    pdf_path, result = pdf_for_payload(payload)
    annotations = extract_pdf_highlights(pdf_path)
    return {
        "ok": True,
        **result,
        "highlightCount": len(annotations),
        "annotationCount": len(annotations),
        "highlights": annotations,
        "annotations": annotations,
    }


@app.post("/api/pdf/open-folder")
def pdf_open_folder(payload: Optional[PdfPrepareRequest] = None) -> dict[str, Any]:
    project = payload.project if payload else DEFAULT_PROJECT_NAME
    folder = project_library_pdfs_dir(project)
    folder.mkdir(parents=True, exist_ok=True)
    try:
        open_with_default_app(folder)
    except (OSError, subprocess.CalledProcessError) as exc:
        raise HTTPException(status_code=500, detail=f"Could not open PDF folder: {exc}") from exc
    return {"ok": True, "path": str(folder)}


@app.post("/api/images/save")
def image_save(payload: ImageSaveRequest) -> dict[str, Any]:
    if not payload.contentType.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files can be saved.")

    match = re.match(r"^data:(image/[A-Za-z0-9.+-]+);base64,(.+)$", payload.dataUrl, re.DOTALL)
    if not match:
        raise HTTPException(status_code=400, detail="Image payload must be a base64 data URL.")

    content_type = match.group(1)
    if content_type != payload.contentType:
        content_type = payload.contentType

    extension = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/gif": ".gif",
        "image/webp": ".webp",
        "image/svg+xml": ".svg",
    }.get(content_type.lower(), Path(payload.filename).suffix.lower() or ".img")

    try:
        image_bytes = base64.b64decode(match.group(2), validate=True)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Could not decode image data.") from exc

    if len(image_bytes) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is larger than 25 MB.")

    image_dir = project_document_images_dir(payload.project)
    image_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_filename(Path(payload.filename).stem, "image")
    filename = f"{stem}-{uuid.uuid4().hex[:10]}{extension}"
    target = image_dir / filename
    target.write_bytes(image_bytes)
    relative_path = relative_document_image_path(payload.project, filename)
    return {
        "ok": True,
        "path": str(target),
        "relativePath": relative_path,
        "url": f"/{relative_path}",
    }


@app.post("/api/images/delete")
def image_delete(payload: ImageDeleteRequest) -> dict[str, Any]:
    relative_path = normalize_document_image_relative_path(payload.relativePath)
    if not relative_path:
        raise HTTPException(status_code=400, detail="Only document_images files can be deleted.")

    filename = Path(relative_path).name
    if not filename or filename in {".", ".."}:
        raise HTTPException(status_code=400, detail="Invalid image filename.")

    image_dir = project_document_images_dir(payload.project)
    target = resolve_document_image_path(relative_path, payload.project)
    if not target:
        raise HTTPException(status_code=400, detail="Invalid image path.")

    if not target.exists():
        return {"ok": True, "deleted": False, "reason": "Image file was already missing."}
    if not target.is_file():
        raise HTTPException(status_code=400, detail="Image path is not a file.")

    archived_path = archive_document_image(target, payload.project)
    return {
        "ok": True,
        "deleted": True,
        "archived": True,
        "relativePath": relative_path,
        "archivePath": str(archived_path.relative_to(ROOT)),
    }


@app.post("/api/images/reconcile")
def image_reconcile(payload: ImageReconcileRequest) -> dict[str, Any]:
    image_dir = project_document_images_dir(payload.project)
    image_dir.mkdir(parents=True, exist_ok=True)
    used = {path for path in (normalize_document_image_relative_path(item) for item in payload.usedImages) if path}
    migrated: dict[str, str] = {}
    for relative_path in sorted(used):
        if not relative_path.startswith("document_images/"):
            continue
        source = resolve_document_image_path(relative_path, payload.project)
        if not source or not source.exists() or not source.is_file():
            continue
        target_relative = relative_document_image_path(payload.project, source.name)
        target = ROOT / target_relative
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copy2(source, target)
        migrated[relative_path] = target_relative

    used = {migrated.get(path, path) for path in used}
    existing = {
        relative_document_image_path(payload.project, path.name): path
        for path in image_dir.iterdir()
        if path.is_file()
    }

    missing = sorted(path for path in used if path not in existing)
    return {
        "ok": True,
        "used": sorted(used),
        "deleted": [],
        "stale": sorted(path for path in existing if path not in used),
        "missing": missing,
        "migrated": migrated,
    }


def archive_document_image(path: Path, project: str = DEFAULT_PROJECT_NAME) -> Path:
    archive_dir = project_deleted_document_images_dir(project)
    archive_dir.mkdir(parents=True, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    archive_name = f"{path.stem}-{timestamp}{path.suffix}"
    archive_path = archive_dir / archive_name
    counter = 1
    while archive_path.exists():
        archive_path = archive_dir / f"{path.stem}-{timestamp}-{counter}{path.suffix}"
        counter += 1
    shutil.move(str(path), str(archive_path))
    return archive_path


def normalize_document_image_relative_path(value: str) -> str:
    relative_path = (value or "").replace("\\", "/").lstrip("/")
    if relative_path.startswith("autosaves/") and "/document_images/" in relative_path:
        parts = [part for part in relative_path.split("/") if part]
        try:
            image_index = parts.index("document_images")
        except ValueError:
            return ""
        if image_index < 2 or image_index + 1 >= len(parts):
            return ""
        project = safe_project_name("/".join(parts[1:image_index]))
        filename = Path(parts[-1]).name
        if not filename or filename in {".", ".."}:
            return ""
        return f"autosaves/{project}/document_images/{filename}"
    if not relative_path.startswith("document_images/"):
        return ""
    filename = Path(relative_path).name
    if not filename or filename in {".", ".."}:
        return ""
    return f"document_images/{filename}"


def relative_document_image_path(project: str, filename: str) -> str:
    return f"autosaves/{safe_project_name(project)}/document_images/{Path(filename).name}"


def resolve_document_image_path(relative_path: str, project: str = DEFAULT_PROJECT_NAME) -> Optional[Path]:
    normalized = normalize_document_image_relative_path(relative_path)
    if not normalized:
        return None
    if normalized.startswith("autosaves/"):
        project_prefix = f"autosaves/{safe_project_name(project)}/document_images/"
        if not normalized.startswith(project_prefix):
            return None
        target = (ROOT / normalized).resolve()
        project_images_root = project_document_images_dir(project).resolve()
        if project_images_root not in target.parents:
            return None
        return target
    if normalized.startswith("document_images/"):
        target = (DOCUMENT_IMAGES_DIR / Path(normalized).name).resolve()
        if DOCUMENT_IMAGES_DIR.resolve() not in target.parents:
            return None
        return target
    return None


@app.post("/api/autosave")
def autosave_map(payload: AutosaveRequest) -> dict[str, Any]:
    return write_project_autosave("MMEA", payload)


@app.get("/api/autosave/latest")
def latest_autosave() -> dict[str, Any]:
    return read_project_latest("MMEA")


@app.post("/api/snapshot")
def snapshot_map(payload: AutosaveRequest) -> dict[str, Any]:
    return write_project_snapshot("MMEA", payload)


@app.get("/api/projects")
def list_projects() -> dict[str, Any]:
    AUTOSAVES_DIR.mkdir(parents=True, exist_ok=True)
    projects = sorted(
        path.name
        for path in AUTOSAVES_DIR.iterdir()
        if path.is_dir() and not path.name.startswith(".")
    )
    return {"ok": True, "projects": projects}


@app.post("/api/projects")
def create_project(payload: ProjectCreateRequest) -> dict[str, Any]:
    name = safe_project_name(payload.name)
    folder = project_dir(name)
    created = not folder.exists()
    folder.mkdir(parents=True, exist_ok=True)
    snapshot_dir(name).mkdir(parents=True, exist_ok=True)
    return {"ok": True, "project": name, "created": created}


@app.get("/api/projects/{project}/latest")
def project_latest_autosave(project: str) -> dict[str, Any]:
    return read_project_latest(project)


@app.post("/api/projects/{project}/autosave")
def project_autosave_map(project: str, payload: AutosaveRequest) -> dict[str, Any]:
    return write_project_autosave(project, payload)


@app.post("/api/projects/{project}/snapshot")
def project_snapshot_map(project: str, payload: AutosaveRequest) -> dict[str, Any]:
    return write_project_snapshot(project, payload)


@app.post("/api/presence/heartbeat")
def presence_heartbeat(payload: PresenceHeartbeatRequest) -> dict[str, Any]:
    client_id = (payload.clientId or "").strip()
    if not client_id:
        raise HTTPException(status_code=400, detail="Missing presence client ID.")
    project = safe_project_name(payload.project or DEFAULT_PROJECT_NAME)
    now = datetime.now().astimezone()
    presence_clients[client_id] = {
        "clientId": client_id,
        "project": project,
        "label": (payload.label or "Viewer").strip()[:80],
        "lastSeen": now,
    }
    online = get_presence_clients(project)
    print(f"Presence heartbeat: project={project} online={len(online)} clientId={client_id}")
    return {"ok": True, "online": online}


@app.post("/api/presence/leave")
def presence_leave(payload: PresenceHeartbeatRequest) -> dict[str, Any]:
    client_id = (payload.clientId or "").strip()
    if not client_id:
        raise HTTPException(status_code=400, detail="Missing presence client ID.")
    project = safe_project_name(payload.project or DEFAULT_PROJECT_NAME)
    client = presence_clients.get(client_id)
    removed = bool(client and client["project"] == project)
    if removed:
        presence_clients.pop(client_id, None)
    online = get_presence_clients(project)
    print(f"Presence leave: project={project} removed={removed} online={len(online)} clientId={client_id}")
    return {"ok": True, "removed": removed, "online": online}


@app.get("/api/presence")
def presence_list(project: str = Query(default=DEFAULT_PROJECT_NAME)) -> dict[str, Any]:
    safe_name = safe_project_name(project)
    return {"ok": True, "project": safe_name, "online": get_presence_clients(safe_name)}


@app.get("/api/presence/debug")
def presence_debug(project: str = Query(default=DEFAULT_PROJECT_NAME)) -> dict[str, Any]:
    safe_name = safe_project_name(project)
    now = datetime.now().astimezone()
    cutoff = now - timedelta(seconds=PRESENCE_TTL_SECONDS)
    online = get_presence_clients(safe_name)
    all_clients = [
        {
            "clientId": client["clientId"],
            "project": client["project"],
            "label": client["label"],
            "lastSeen": client["lastSeen"].isoformat(),
            "ageSeconds": round((now - client["lastSeen"]).total_seconds(), 1),
        }
        for client in presence_clients.values()
    ]
    return {
        "ok": True,
        "project": safe_name,
        "onlineCount": len(online),
        "online": online,
        "allProjectsClientCount": len(all_clients),
        "allProjectsClients": all_clients,
        "ttlSeconds": PRESENCE_TTL_SECONDS,
        "serverNow": now.isoformat(),
        "expiresBefore": cutoff.isoformat(),
    }


def get_presence_clients(project: str) -> list[dict[str, Any]]:
    now = datetime.now().astimezone()
    cutoff = now - timedelta(seconds=PRESENCE_TTL_SECONDS)
    expired = [
        client_id
        for client_id, client in presence_clients.items()
        if client["lastSeen"] < cutoff
    ]
    for client_id in expired:
        presence_clients.pop(client_id, None)

    return [
        {
            "clientId": client["clientId"],
            "label": client["label"],
            "lastSeen": client["lastSeen"].isoformat(),
        }
        for client in presence_clients.values()
        if client["project"] == project
    ]


@app.post("/api/grobid/analyze-map")
def grobid_analyze_map(payload: AnalyzeMapRequest) -> dict[str, Any]:
    suggestions = []
    analyzed = []
    skipped = []

    for publication in payload.publications:
        if not publication.zoteroKey:
            skipped.append({"nodeId": publication.id, "title": publication.title, "reason": "No Zotero item key on node."})
            continue
        pdf_match = zotero_pdf_for_publication(publication)
        if not pdf_match:
            skipped.append({"nodeId": publication.id, "title": publication.title, "reason": "No local Zotero PDF attachment found."})
            continue
        pdf_path, resolved_zotero_key = pdf_match

        try:
            tei = grobid_process_references(pdf_path)
            references = parse_grobid_references(tei)
        except HTTPException as exc:
            skipped.append({
                "nodeId": publication.id,
                "title": publication.title,
                "reason": str(exc.detail),
                "status": exc.status_code,
                "pdfPath": str(pdf_path),
            })
            continue
        except ET.ParseError as exc:
            skipped.append({
                "nodeId": publication.id,
                "title": publication.title,
                "reason": f"GROBID returned XML that could not be parsed: {exc}",
                "status": 502,
                "pdfPath": str(pdf_path),
            })
            continue
        except OSError as exc:
            skipped.append({
                "nodeId": publication.id,
                "title": publication.title,
                "reason": f"Could not read local PDF: {exc}",
                "status": 500,
                "pdfPath": str(pdf_path),
            })
            continue

        analyzed.append({
            "nodeId": publication.id,
            "title": publication.title,
            "zoteroKey": publication.zoteroKey,
            "resolvedZoteroKey": resolved_zotero_key,
            "pdfPath": str(pdf_path),
            "referenceCount": len(references),
            "references": references,
        })

        for reference in references:
            match = match_reference(reference, payload.publications, publication.id)
            if not match:
                continue
            suggestions.append({
                "id": f"grobid-{publication.id}-{match['citedNodeId']}",
                "sourceNodeId": publication.id,
                "sourceTitle": publication.title,
                "targetNodeId": match["citedNodeId"],
                "targetTitle": match["citedTitle"],
                "confidence": match["confidence"],
                "matchReason": match["matchReason"],
                "reference": match["reference"],
            })

    unique = {}
    for suggestion in suggestions:
        key = (suggestion["sourceNodeId"], suggestion["targetNodeId"])
        if key not in unique or suggestion["confidence"] > unique[key]["confidence"]:
            unique[key] = suggestion

    return {
        "suggestions": sorted(unique.values(), key=lambda item: item["confidence"], reverse=True),
        "analyzed": analyzed,
        "skipped": skipped,
    }


@app.get("/")
def index() -> FileResponse:
    return FileResponse(ROOT / "index.html")


app.mount("/", StaticFiles(directory=ROOT, html=True), name="static")
