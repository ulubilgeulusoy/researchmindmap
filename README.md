# Research Mind Map Prototype

Local browser-based research mapping and literature-review prototype. It combines a Cytoscape.js mind map, Jodit-powered writing notes, OpenAlex paper discovery and keyword enrichment, Zotero import, local PDF annotation extraction, GROBID citation-link suggestions, project autosaves, and JSON backup/export.

## Project Status

**Current stage: Beta testing**

The application is functional for individual local research workflows and
trusted Tailscale sharing. It is currently being tested with PhD researchers
to identify usability issues, missing features, and failure cases.

The data format, interface, and backend APIs may still change.

## Why Use It

Use this app when you want to organize papers, ideas, notes, citations, and writing structure in one local visual workspace. It is aimed at exploratory literature review work where relationships between publications and concepts matter as much as the individual notes.

## What It Looks Like

The app opens as a visual map with:

- a top toolbar for view modes, project controls, clustering, sources, and file actions
- a large interactive node-link canvas
- a right-side details panel for selected nodes and connections
- a document workspace for notes linked to map items

## Quick Start

Requirements:

- Python 3 with `venv`
- A modern web browser
- Zotero Desktop installed and running for Zotero import/PDF workflows
- Docker Desktop is recommended for GROBID citation analysis

Clone the repository:

```sh
git clone https://github.com/ulubilgeulusoy/researchmindmap.git
cd researchmindmap
```

If you already have a Python environment you want to use, activate it before installing dependencies. If you need a new environment, create one with a project-specific name:

```sh
python -m venv mindmapenv
```

Activate the environment:

```powershell
# Windows PowerShell
mindmapenv\Scripts\Activate.ps1
```

```sh
# macOS/Linux
source mindmapenv/bin/activate
```

Install dependencies and start the local backend:

```sh
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Open:

```text
http://127.0.0.1:8000
```

If `python` is not the command for your environment, activate your preferred Python environment first. Restart Uvicorn after changing `server.py`. A hard refresh can help after frontend changes because browser assets are cache-versioned in `index.html`.

For the full publication workflow:

- Zotero requires Zotero Desktop installed and running locally. Zotero Connector in the browser is recommended for saving papers found through OpenAlex, DOI, or publisher pages into Zotero before importing them as nodes.
- OpenAlex discovery does not require an API key or local install, but the FastAPI host must have internet access.
- Adding OpenAlex results directly to Zotero requires a Zotero web API key with write access. Enter the key in the OpenAlex Zotero API Access dialog; My Library writes also require your numeric Zotero user ID, while group-library writes use the group ID from Zotero metadata.
- Zotero tags and keyword-style metadata are imported into the app's publication Keywords area. Normal Zotero imports leave app Tags empty; OpenAlex-created nodes keep the app tag `OpenAlex`.
- OpenAlex-to-Zotero imports are metadata-first. To use those nodes with Open PDF, PDF annotations, or GROBID citation analysis, use Zotero Desktop's Find Available PDF/Find Full Text action or manually attach PDFs to the Zotero items.
- GROBID requires a separate local service. Docker Desktop is recommended. With Docker running, use:

```sh
docker pull grobid/grobid:0.9.0-full
docker run --name grobid --rm -p 8070:8070 grobid/grobid:0.9.0-full
```

The app expects GROBID at:

```text
http://127.0.0.1:8070
```

Expected GROBID service details:

```text
Docker image: grobid/grobid:0.9.0-full
Container name: grobid
Service URL: http://127.0.0.1:8070
Health endpoint: GET /api/isalive
Reference endpoint: POST /api/processReferences
```

The app-side GROBID usage is the same on Windows, macOS, and Ubuntu: the FastAPI backend calls the local HTTP service above. Only the GROBID/Docker runtime setup differs by operating system:

- Windows: install Docker Desktop, start it first, then run the same Docker commands in PowerShell or a terminal. CPU mode is fine; do not depend on GPU support for this workflow.
- macOS: install Docker Desktop, then run the same Docker commands. On Apple Silicon, the full image is large and can be slower or more resource-heavy; `grobid/grobid:0.9.0-crf` is a smaller CPU-only alternative if needed.
- Ubuntu/Linux: install Docker Engine or Docker Desktop. The same Docker commands work; GPU use is only relevant if NVIDIA drivers and container GPU support are configured.

`127.0.0.1:8070` assumes `server.py` and GROBID run in the same host environment. If FastAPI is moved into Docker, WSL, a VM, or a remote host, adjust the GROBID service address in `server.py`.

## Core Features

- Visual research mind map with typed, colored nodes and directed connections.
- Map, document, and split multi-view workspaces.
- Publication, idea, and connection notes with Jodit-powered rich-text editing.
- OpenAlex discovery for related papers, papers that cite selected map publications, and papers cited by selected map publications.
- Zotero Desktop import and local PDF workflows.
- Publication keywords from Zotero/OpenAlex, manual keyword editing, keyword recovery, and automatic keyword clustering.
- PDF annotation extraction through PyMuPDF.
- GROBID-based citation relationship suggestions.
- Project-scoped autosaves, snapshots, note images, copied PDFs, JSON import/export.
- Lightweight online-session indicator for trusted private sharing.

## Full Documentation

The detailed user guide, integration notes, storage model, Tailscale sharing notes, troubleshooting commands, security limitations, file layout, maturity notes, and roadmap have moved into the in-app documentation page:

```text
http://127.0.0.1:8000/manual.html
```

You can also open it from the `?` documentation button in the top toolbar.

## Main Files

- `index.html` - application structure and UI panels
- `style.css` - layout and visual styling
- `app.js` - graph UI, document editor, autosave, import/export, integrations
- `server.py` - FastAPI backend for local files, OpenAlex, Zotero, PDFs, GROBID, autosaves
- `requirements.txt` - Python backend dependencies
- `autosaves/` - project workspaces and generated local data
- `vendor/jodit-4.2.47/` - vendored Jodit rich-text editor assets

## License

See `LICENSE`.
