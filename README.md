# Research Mind Map Prototype

Local browser-based research mapping and literature-review prototype. The app combines a Cytoscape.js mind map, a linked document editor, Zotero import, local PDF handling, GROBID citation-link suggestions, folder autosaves, and JSON backup.

The core UI is plain HTML/CSS/JavaScript. The local FastAPI backend serves the app and enables local-only integrations such as Zotero, PDF opening/annotation extraction, image saving, GROBID, and file-based autosaves.

## How To Run

Install backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Start the backend:

```powershell
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

If `python` is not the command for your environment, activate your preferred Python environment first, then run the same `python -m ...` commands. Restart Uvicorn after changing `server.py`. Browser cache is versioned in `index.html`, but a hard refresh with `Ctrl+F5` can help if the UI looks stale.

## Current Features

- Visual mind map with circular clickable nodes and directed connections.
- Configurable node types with editable colors.
- Built-in protected node types: `Publication`, `Idea`, and `Unassigned`.
- Add Node and Connection from the toolbar.
- Node type settings for adding custom node types, changing node colors, and deleting custom types.
- Deleting a custom node type preserves its nodes by changing them to `Unassigned`.
- Map legend shows only node types that currently exist as nodes in the map.
- Right-click node menu for editing, connecting, duplicating, opening links, changing type, style copy/paste, bring front/back, and delete.
- Node resize handles and formatting controls for size, font size, font family, and font style.
- Multi-select node formatting support.
- Delete key support, with confirmation before deleting nodes.
- Undo graph edits with `Ctrl+Z` / `Command+Z`.
- Map clustering by tag, author, or number of connections, with spacing adjustment.
- Tag clustering can show generated background circles with configurable circle color, tag text color, and tag text size.
- Single-tag clustering keeps cluster locations stable and places connected cross-cluster nodes closer to the relevant cluster edge.
- Author clustering counts every listed publication author, normalizes names by first and last name, and uses an author-frequency threshold to avoid one-paper author clusters.
- Zoom controls for the map.
- Application-wide search for nodes, connections, note text, citations, URLs, tags, and other saved metadata.
- Project workspaces with per-project autosave folders.
- Lightweight online presence indicator for trusted Tailscale sharing.
- JSON export/import for full backup and restore.

## Views

The top toolbar has three workspace modes:

- `Map` - visual mind map with the right-side details/formatting panel.
- `Document` - linked writing workspace with outline and document page.
- `Multi View` - map and document side by side.

The toolbar also includes a `Project` selector. The current working project is `MMEA`, and the repo includes a `Demo` starter project.

Project controls:

- Select an existing project from the project dropdown.
- Create a new project with `New Project`.
- Each project has its own latest autosave and snapshot folder.
- Switching projects loads that project's latest server autosave when the FastAPI backend is running.

The document outline uses a dropdown to switch between:

- node types that currently exist in the map
- `Connections`

Ideas and publications are grouped by document tag. For nodes with multiple tags, the app uses the selected document group tag, or the first tag by default.

Connections are also grouped by their first tag. Idea/publication and idea/idea connections are shown as short labels like `Connection 1`, `Connection 2`, etc. Publication-to-publication citation edges are labeled `Citation connection`.

## Clustering Behavior

The map supports clustering by:

- `Tags`
- `Authors`
- `Number of connections`

Tag clustering:

- Uses the first tag by default.
- Can draw tag background circles with configurable circle color, text color, and text size.
- In single-tag mode, connected nodes from different tag clusters are nudged toward the relevant cluster edge so cross-cluster links are easier to read.

Author clustering:

- Counts every author position in each publication, not just the first author.
- Normalizes author names by first and last name, so middle names or initials do not split the same person into separate clusters. For example, `Ute M. Fischer` and `Ute Fischer` are treated as the same author.
- Uses the `Author threshold` setting in the cluster settings panel. An author must appear on at least that many publication nodes to become a real author cluster.
- Assigns each publication to the strongest recurring author on that paper.
- If multiple recurring authors on the same paper tie, the publication can be assigned to a combined author cluster.
- Places low-frequency or distinct-author papers in a loose `Other authors` area. This is not intended to represent a meaningful research group; it is a holding area for papers without a recurring author above the threshold.

Connection-count clustering groups nodes by how many map connections they have, which is useful for quickly spotting central or isolated nodes.

## Map Details Panel

Selecting a node opens its details in the right panel:

- Title / label
- Type
- URL
- Citation for publications
- Tags
- Open Notes
- Open Link
- Open PDF
- Open PDF Folder

The formatting tab supports node size, font size, font family, font style, and style copy/paste.

Selecting a connection opens connection details:

- Connection label, such as `Connection 1` or `Citation connection`
- From node
- To node
- Connection notes
- Tags
- Global connection arrow color
- Global connection arrow thickness

When a connection is selected, its two endpoint nodes are highlighted on the map.

## Document Editor

The document editor is a prototype word-processor-style interface linked to map nodes and connections.

It supports:

- Font family and font size
- Selection-aware font size display, including blank/mixed state when selected text has multiple sizes
- Paragraph style
- Bold, italic, underline
- Format painter, with undo support
- Text color and highlight color
- Highlight toggle for applying and removing highlights
- Bulleted and numbered lists
- Up to six visible list indentation levels
- Alignment
- Hyperlinks
- Node links with a confirmation popup before opening
- Image insertion
- Image resize with selected-image handles
- Image copy/paste between node notes
- Table insertion and Word-style table controls for selecting rows/columns/tables, adding/deleting rows or columns, and vertical cell alignment
- URL auto-linking

Publication document pages include notes plus citation and URL metadata. The abstract box was removed from the visible document page because PDFs can now be opened directly.

Idea document pages are plain note pages.

Connection document pages use a short title and show compact `From` / `To` metadata above the editable connection note.

Node links are grouped by tag in the node-link picker. The picker supports search and node-type filters, shows publication citations in smaller text, and colors link text using the linked node type color.

## Zotero Integration

Zotero integration requires the FastAPI backend and Zotero Desktop running locally.

The backend first tries Zotero Desktop's local API:

```text
http://localhost:23119/api/
```

If needed, it can also inspect the local Zotero data directory. On Windows, the usual default is:

```text
C:\Users\<your-username>\Zotero
```

Imported Zotero publication nodes store available metadata such as:

- Zotero item key
- title
- authors
- year
- DOI
- citation
- URL
- abstract
- tags

The Zotero import panel includes select-all and deselect-all controls after items are loaded.

## GROBID Citation Analysis

GROBID is used to find Research Rabbit-style citation relationships between publications already in the map.

Expected local GROBID setup:

```text
Docker image: grobid/grobid:0.9.0-full
Container name: grobid
Service URL: http://127.0.0.1:8070
Health endpoint: GET /api/isalive
Reference endpoint: POST /api/processReferences
```

Workflow:

1. Import publications from Zotero.
2. Make sure the Zotero items have local PDF attachments.
3. Click `GROBID`.
4. Click `Check GROBID`.
5. Click `Analyze All Publications`.
6. Review suggested citation links.
7. Add selected suggestions.

The app shows suggestions first. It does not automatically create citation edges without review.

Added GROBID citation edges include:

- `citation` / `grobid` tags
- connection notes describing the detected citation
- citation relation metadata with confidence and match reason

Existing citation connections are filtered out of the suggestion list to avoid duplicate edges.

The GROBID panel also includes:

- progress reporting for `Analyze All Publications`
- per-publication error logging so one failed PDF does not stop the whole batch
- select-all and deselect-all controls for suggested connections

## Local PDF Workflow

For Zotero-backed publication nodes, the app can copy PDFs from Zotero into:

```text
autosaves/{project}/library_pdfs/
```

For example, the `MMEA` project stores copied PDFs under `autosaves/MMEA/library_pdfs/`.

The copy is done once. If a copied PDF already exists, the app opens the existing copy and does not overwrite it. This protects your highlights and notes.

After the first copy, PDF work happens on the project copy in `autosaves/{project}/library_pdfs/`, not on Zotero's original stored PDF. If you highlight or comment in Adobe after opening a PDF from this app, those annotations are saved into the project copy. `Import PDF Annotations` reads from that project copy. Zotero's original PDF is not changed by this app unless you open and edit the Zotero PDF directly outside the app.

PDF actions:

- `Open PDF` opens the copied/local PDF in the system default PDF viewer.
- `Open PDF Folder` opens the local PDF folder.
- `Import PDF Annotations` extracts highlights, highlight comments, standalone comments, and free-text annotations using PyMuPDF.

Extracted PDF annotations appear in a review popup. Selected annotations can be appended to the publication notes as formatted bullet points with page numbers. Highlight text is inserted as quoted italic text, and comments are inserted as sub-bullets when comment text exists.

PDF annotation extraction depends on how the PDF viewer stores annotations. Adobe-style annotations usually work best.

## Images In Notes

Images inserted into document notes are saved through the backend into:

```text
autosaves/{project}/document_images/
```

For example, the `MMEA` project stores document note images under `autosaves/MMEA/document_images/`.

The document stores links to these saved image files instead of storing large base64 images in browser storage. This avoids localStorage quota problems.

The app also intercepts pasted and dropped images so they use the same save path. If an old embedded image appears as an unsaved placeholder, delete it and reinsert the image.

When a project is loaded, the backend reconciles note images:

- embedded base64 images are saved as files and rewritten to local image paths
- old root-level `document_images/` references are migrated into the active project folder when the source image file still exists
- unused image files are reported as stale but are not deleted automatically
- missing image references are reported instead of silently failing

Deleted note images are archived instead of permanently removed:

```text
autosaves/{project}/document_images_deleted/
```

The previous root-level `document_images/`, `document_images_deleted/`, and `library_pdfs/` folders were legacy fallback folders and are no longer part of the active storage layout.

## Saving And Backups

The app uses several backup layers:

- Browser `localStorage` for lightweight UI/project state and best-effort local fallback.
- A project-specific latest autosave, overwritten on every autosave.
- Project-specific manual snapshots when you click `Save`.
- `Export` to download a JSON backup manually.
- `Import` to restore a JSON backup.

The server-side folder autosave is the main working save path. This avoids browser storage quota problems, especially when notes include many images.

When the FastAPI backend is running, the browser checks:

```text
GET /api/projects/{project}/latest
```

If the selected project has a latest autosave, the app loads that server-side map on startup or when switching projects. This is useful for Tailscale sharing because another trusted device can refresh and receive the latest server-recorded map for the same selected project.

The current project is saved under:

```text
autosaves/MMEA/research-map-latest.json
```

The committed starter demo seed is saved under:

```text
autosaves/Demo/demo-save.json
```

When the `Demo` project is edited, its private working autosave is still written to `autosaves/Demo/research-map-latest.json`.

Manual snapshots are written to:

```text
autosaves/{project}/snapshots/research-map-snapshot-YYYYMMDD-HHMMSS.json
```

Project asset folders live next to the project autosave:

```text
autosaves/{project}/
  research-map-latest.json
  snapshots/
  document_images/
  document_images_deleted/
  library_pdfs/
```

There are no active root-level asset folders for PDFs or note images. New project data should stay inside `autosaves/{project}/`.

Use `Reset View` only to refit/reset the visible workspace. It does not delete data.

## Demo Project And GitHub Clones

The repo keeps the project folder structure but ignores private generated data. A fresh clone should see the application code and the committed `Demo` starter save, but not your private MMEA autosaves, copied PDFs, note images, exported JSON files, logs, or local environment files.

The starter demo is intentionally small. It includes one example publication node and one example idea node, with notes explaining how to add publications and ideas.

The current `.gitignore` keeps:

- empty folder placeholders such as `.gitkeep`
- `autosaves/Demo/demo-save.json`

It ignores:

- private project latest autosaves and snapshots
- project-scoped copied PDFs in `autosaves/{project}/library_pdfs/`
- project-scoped note images in `autosaves/{project}/document_images/`
- project-scoped deleted-image archives in `autosaves/{project}/document_images_deleted/`
- exported `research-map.json`
- logs and `.env`

## Private Sharing With Tailscale

This app can be shared privately across trusted devices through Tailscale. Tailscale is not configured inside the repo and no Tailscale secrets should be committed.

Start the FastAPI server locally:

```powershell
cd "C:\path\to\ulumindmap"
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

In another PowerShell window, expose it to your Tailnet:

```powershell
tailscale serve http://127.0.0.1:8000
```

Tailscale will print a private HTTPS URL similar to:

```text
https://your-device.your-tailnet.ts.net/
```

Open that URL from another device that is allowed on your Tailnet.

### Recommended Tailscale Access Control

If you share this machine with an external collaborator, add a restrictive Tailscale access-control grant for shared users. The goal is to allow access only to the Tailscale Serve HTTPS endpoint for this app.

Recommended rule shape:

```json
{
  "src": ["autogroup:shared"],
  "dst": ["YOUR_DEVICE_TAILSCALE_IP_OR_DEVICE_SELECTOR"],
  "ip": ["tcp:443"]
}
```

Use the shared device's Tailscale IP address or the device selector accepted by the Tailscale policy editor. You can find the Tailscale IPv4 address on the host machine with:

```powershell
tailscale ip -4
```

Why `443` instead of `8000`:

- FastAPI runs locally on `127.0.0.1:8000`.
- `tailscale serve http://127.0.0.1:8000` exposes that local app as a private HTTPS URL.
- The collaborator reaches the app through HTTPS on TCP `443`.
- Tailscale Serve then forwards that request internally to `127.0.0.1:8000`.

So the collaborator should be allowed to reach TCP `443`, not the internal local port `8000`.

Do not leave shared users with `All ports and protocols` unless you intentionally want them to reach other services on the shared machine.

Current collaboration model:

- Works well for one-at-a-time shared editing.
- Edits autosave to the selected project folder, such as `autosaves/MMEA/research-map-latest.json`.
- Another device can select the same project and refresh to load the latest server autosave.
- The toolbar presence indicator shows how many browser sessions have the same project open.
- It is not yet true simultaneous collaborative editing.
- If two people edit at the same time, the latest autosave can overwrite earlier work.

Presence model:

- Each browser tab gets a temporary client ID in `sessionStorage`.
- The browser sends a heartbeat to FastAPI about every 15 seconds.
- The backend keeps recent viewers for about 45 seconds.
- Presence is scoped to the active project.

Security and editing risks:

- Tailscale is private networking, not app-level authentication. Anyone you allow into the relevant Tailnet/access path can reach this app URL.
- Sharing a machine is broader than sharing one website. Access controls should restrict shared users to the specific device and TCP `443` for this app.
- This prototype has no login, roles, read-only mode, or edit lock.
- A trusted collaborator can edit and delete nodes, connections, notes, images, imported data, and project autosaves.
- The backend can access local app folders such as `autosaves/{project}/`, including project-scoped note images and copied PDFs.
- Zotero/GROBID/PDF actions run on the host machine where FastAPI is running.
- `Open PDF` opens the PDF on the host machine, not on the remote collaborator's computer.
- Simultaneous editing is last-save-wins. Create a snapshot before a shared session.
- Keep Uvicorn bound to `127.0.0.1:8000` and expose only that local service through Tailscale Serve unless you intentionally choose a broader network setup.

For PDF collaboration, use a shared Zotero library/group for actual PDF syncing and annotation collaboration. This app can then import or read the synced local PDF/annotation state from the host machine.

Future collaborative direction:

- Make FastAPI the full source of truth for map state.
- Add a WebSocket endpoint for live update notifications.
- Broadcast changes to connected browsers over Tailscale.
- Start with safe notifications such as "Map updated elsewhere, reload latest?"
- Later add more granular real-time updates for node moves, note edits, and connection changes.
- Add optional edit locks or a viewer/editor mode before serious simultaneous editing.

## Files And Folders

- `index.html` - page structure, toolbar, panels, document workspace, modals
- `style.css` - layout and visual styling
- `app.js` - Cytoscape graph, UI behavior, document editor, autosave, import/export, Zotero/GROBID frontend logic
- `server.py` - FastAPI backend for serving the app, Zotero, PDFs, images, autosaves, snapshots, and GROBID analysis
- `requirements.txt` - backend Python dependencies
- `autosaves/` - project folders with latest autosaves, snapshots, copied PDFs, note images, and deleted-image archives
- `autosaves/{project}/library_pdfs/` - copied PDFs for that project
- `autosaves/{project}/document_images/` - images inserted into that project's document notes
- `autosaves/{project}/document_images_deleted/` - archived deleted note images for that project

Root-level `library_pdfs/`, `document_images/`, and `document_images_deleted/` are not part of the current folder structure.

These generated folders and private data exports are ignored by Git:

- private contents of `autosaves/`, except committed placeholders and `autosaves/Demo/demo-save.json`
- project-scoped copied PDFs, note images, deleted-image archives, latest autosaves, and snapshots
- `research-map.json`
- `.env`
- `*.log`

## Offline Note

The app currently loads Cytoscape.js from a CDN:

```text
https://unpkg.com/cytoscape@3.29.2/dist/cytoscape.min.js
```

Later, Cytoscape can be vendored locally for fully offline use.

Zotero and GROBID integrations are local-first. GROBID requires the local Docker container to be running, and Zotero/GROBID citation analysis requires local PDF attachments.

## Suggested Next Steps

- Add WebSocket update notifications so a Tailscale collaborator can see that another browser changed the project without manually refreshing.
- Add optional edit locks or read-only viewer mode before serious two-person simultaneous editing.
- Add optional local LLM support through Ollama or LM Studio for summaries, tag suggestions, and drafted connection notes.
- Add safer collaboration conflict handling and per-user edit history.
- Add optional browser-based PDF viewing/download for remote Tailscale users, while keeping Zotero as the preferred shared PDF annotation system.
- Potentially add this "https://github.com/LocalCitationNetwork/LocalCitationNetwork.github.io" for similar publication finding with custom search capabilities with keywords, number of citations, etc.
