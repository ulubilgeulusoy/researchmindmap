# Research Mind Map Prototype

Local browser-based research mapping and literature-review prototype. It combines a Cytoscape.js mind map, linked writing notes, Zotero import, local PDF annotation extraction, GROBID citation-link suggestions, project autosaves, and JSON backup/export.

## Version Status

| Track | Stage | Intended audience | Stability | Notes |
| --- | --- | --- | --- | --- |
| Passed | Alpha | Individual Researchers | Functional | Useful for local work and to share via Tailscale with other individuals. |
| Current | Beta Testing | PhD Candidate Testers | Functional | Test all features, identify new features, and find new failure modes. |

## Why Use It

Use this app when you want to organize papers, ideas, notes, citations, and writing structure in one local visual workspace. It is aimed at exploratory literature review work where relationships between publications and concepts matter as much as the individual notes.

## What It Looks Like

The app opens as a visual map with:

- a top toolbar for view modes, project controls, clustering, sources, and file actions
- a large interactive node-link canvas
- a right-side details panel for selected nodes and connections
- a document workspace for notes linked to map items

## Quick Start

Install backend dependencies:

```sh
python -m pip install -r requirements.txt
```

Start the local backend:

```sh
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
- Publication, idea, and connection notes with document-style formatting.
- Zotero Desktop import and local PDF workflows.
- PDF annotation extraction through PyMuPDF.
- GROBID-based citation relationship suggestions.
- Project-scoped autosaves, snapshots, note images, copied PDFs, JSON import/export.
- Lightweight online-session indicator for trusted private sharing.

## Full Documentation

The detailed user guide, integration notes, storage model, Tailscale sharing notes, troubleshooting commands, security limitations, file layout, maturity notes, and roadmap have moved into the in-app documentation page:

```text
http://127.0.0.1:8000/about.html
```

You can also open it from the `?` documentation button in the top toolbar.

## Main Files

- `index.html` - application structure and UI panels
- `style.css` - layout and visual styling
- `app.js` - graph UI, document editor, autosave, import/export, integrations
- `server.py` - FastAPI backend for local files, Zotero, PDFs, GROBID, autosaves
- `requirements.txt` - Python backend dependencies
- `autosaves/` - project workspaces and generated local data

## License

See `LICENSE`.
