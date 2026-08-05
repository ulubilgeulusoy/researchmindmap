# Research Mind Map Prototype

Local browser-based research mapping and literature-review prototype. It combines a Cytoscape.js mind map, Jodit-powered writing notes, OpenAlex paper discovery, Zotero import, local PDF annotation extraction, GROBID citation-link suggestions, project autosaves, and JSON backup/export.

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

Clone the repository and create a virtual environment:

```sh
git clone https://github.com/ulubilgeulusoy/researchmindmap.git
cd researchmindmap
python -m venv .venv
```

Activate the virtual environment:

```powershell
# Windows PowerShell
.venv\Scripts\Activate.ps1
```

```sh
# macOS/Linux
source .venv/bin/activate
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

## Core Features

- Visual research mind map with typed, colored nodes and directed connections.
- Map, document, and split multi-view workspaces.
- Publication, idea, and connection notes with Jodit-powered rich-text editing.
- OpenAlex discovery for related papers, papers that cite selected map publications, and papers cited by selected map publications.
- Zotero Desktop import and local PDF workflows.
- PDF annotation extraction through PyMuPDF.
- GROBID-based citation relationship suggestions.
- Project-scoped autosaves, snapshots, note images, copied PDFs, JSON import/export.
- Lightweight online-session indicator for trusted private sharing.

OpenAlex, Zotero Desktop, and GROBID are optional integrations. The core mapping, note-taking, project, autosave, and JSON import/export features work without them. A common literature-discovery workflow is to use OpenAlex to find candidate papers, open their DOI/source links, save the useful papers into Zotero with Zotero Connector, then import those Zotero items as publication nodes.

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
