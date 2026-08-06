const STORAGE_KEY = "researchMindMapPrototype";
const AUTOSAVE_HISTORY_KEY = "researchMindMapPrototypeAutosaveHistory";
const EDGE_STYLE_KEY = "researchMindMapPrototypeEdgeStyle";
const NODE_TYPES_KEY = "researchMindMapPrototypeNodeTypes";
const CLUSTER_STYLE_KEY = "researchMindMapPrototypeClusterStyle";
const CLUSTER_VIEW_KEY = "researchMindMapPrototypeClusterView";
const ACTIVE_PROJECT_KEY = "researchMindMapPrototypeActiveProject";
const PRESENCE_CLIENT_KEY = "researchMindMapPrototypePresenceClient";
const PDF_ANNOTATION_FORMAT_KEY = "researchMindMapPrototypePdfAnnotationFormat";
const DEFAULT_PROJECT_NAME = "MMEA";
const PRESENCE_INTERVAL_MS = 15000;
const MAX_UNDO_STEPS = 50;
const MAX_AUTOSAVE_HISTORY = 3;
const MAX_AUTOSAVE_HISTORY_BYTES = 1_500_000;
const MAX_OPENALEX_SEED_PUBLICATIONS = 8;
const AUTOSAVE_DELAY_MS = 700;
const DEFAULT_NODE_SIZE = 88;
const MIN_NODE_SIZE = 56;
const MAX_NODE_SIZE = 1000;
const DEFAULT_FONT_SIZE = 13;
const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 96;
const DEFAULT_FONT_FAMILY = "Arial, Helvetica, sans-serif";
const DEFAULT_EDGE_COLOR = "#9aa6b8";
const DEFAULT_EDGE_WIDTH = 3;
const DEFAULT_CLUSTER_STYLE = {
  circleColor: "#dbeafe",
  textColor: "#475569",
  textSize: 22,
  minTagSize: 3,
  useAllTags: false,
  authorThreshold: 2
};
const CLUSTER_BACKGROUND_PREFIX = "cluster-background-";
const BUBBLE_SETS_CDN_URL = "https://esm.run/bubblesets-js@3.0.1";
const DEBUG_BUBBLE_SETS = false;
const BUBBLE_SET_CONFIG = {
  nodePadding: 8,
  obstaclePadding: 5,
  debounceMs: 120,
  fillOpacity: 0.16,
  strokeOpacity: 0.58,
  strokeWidth: 1.6,
  simplifyTolerance: 2,
  minMembers: 1,
  componentDistance: 420,
  maxObstacleRetries: 3,
  obstacleRetryPaddingStep: 14,
  virtualEdgeMaxDistance: 520
};
const DEFAULT_NODE_TYPES = [
  { name: "Publication", color: "#2d7ff9" },
  { name: "Idea", color: "#2f9d68" },
  { name: "Unassigned", color: "#9ca3af" }
];
const TEXT_COLOR_PRESETS = [
  "#111827",
  "#374151",
  "#6b7280",
  "#dc2626",
  "#ea580c",
  "#ca8a04",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed"
];
const HIGHLIGHT_COLOR_PRESETS = [
  "#fff2a8",
  "#fde68a",
  "#fed7aa",
  "#fecaca",
  "#fbcfe8",
  "#ddd6fe",
  "#bfdbfe",
  "#bae6fd",
  "#bbf7d0",
  "#e5e7eb"
];

const demoElements = [
  {
    group: "nodes",
    data: {
      id: "node-example-publication",
      label: "Example Publication",
      type: "Publication",
      url: "",
      tags: ["example"],
      publicationNotes: {
        notes: "",
        notesHtml: "<p>This is an example publication node.</p><ul><li>Use the <strong>Node</strong> button to add a new node.</li><li>Select the node and set its type to <strong>Publication</strong> in the right-side details panel.</li><li>Add a title, URL, citation, tags, and notes for literature review work.</li><li>If imported from Zotero, this node can also connect to a local PDF.</li></ul>",
        citation: "Example citation text can go here.",
        url: "",
        abstract: ""
      },
      documentHtml: ""
    },
    position: { x: 220, y: 220 }
  },
  {
    group: "nodes",
    data: {
      id: "node-example-idea",
      label: "Example Idea",
      type: "Idea",
      url: "",
      tags: ["example"],
      documentHtml: "<p>This is an example idea node.</p><ul><li>Use the <strong>Node</strong> button to add a new node.</li><li>Select the node and set its type to <strong>Idea</strong> in the right-side details panel.</li><li>Use idea nodes for concepts, themes, hypotheses, questions, or synthesis notes.</li><li>Use the <strong>Connection</strong> button to link ideas to publications or other ideas.</li></ul>"
    },
    position: { x: 520, y: 220 }
  },
  { group: "edges", data: { id: "edge-example-publication-idea", source: "node-example-publication", target: "node-example-idea", tags: ["example"], notes: "Example connection between a publication and an idea." } }
];

let selectedNode = null;
let selectedEdge = null;
let connectionMode = false;
let connectionSource = null;
let contextNode = null;
let undoStack = [];
let redoStack = [];
let activeEditSnapshot = null;
let resizeDrag = null;
let autosaveTimer = null;
let publicationNotesNode = null;
let publicationNotesSnapshot = null;
let activeDocumentNodeId = null;
let activeDocumentTarget = null;
let documentEditSnapshot = null;
let currentView = "map";
let notesPanelDrag = null;
let zoteroPanelDrag = null;
let openAlexPanelDrag = null;
let pdfHighlightsPanelDrag = null;
let openAlexPanelResize = null;
let zoteroItemsCache = [];
let zoteroLibrariesCache = [];
let zoteroCollectionsCache = [];
let zoteroTopCollectionsCache = [];
let zoteroMode = "";
let zoteroSearchTimer = null;
let openAlexResultsCache = [];
let openAlexSearchTimer = null;
let grobidSuggestionsCache = [];
let grobidAnalyzedCache = [];
let pdfHighlightsCache = [];
let copiedNodeStyle = null;
let savedDocumentRange = null;
let selectedDocumentImage = null;
let selectedDocumentTable = null;
let selectedDocumentTableCells = null;
let selectedDocumentTableColumn = null;
let selectedDocumentTableRow = null;
let activeDocumentTableCell = null;
let activeDocumentTable = null;
let documentImageResizeDrag = null;
let documentTableSelectionDrag = null;
const useJoditImageResize = true;
let copiedDocumentImage = null;
let copiedDocumentTableCells = null;
let activeOutlineView = "type:Publication";
let isAdditiveSelectKeyDown = false;
let copiedNodesClipboard = [];
let currentDocumentAlignmentCommand = "justifyLeft";
let activeTagAutocompleteInput = null;
let activeTagAutocompleteIndex = -1;
let tagAutocompleteOptions = [];
let tagAutocompleteMenu = null;
const nodeSelectionBeforeTap = new Map();
let zoomControlHideTimer = null;
let mapZoomBase = 1;
let currentClusterMode = "none";
let clusterSpacingFactor = 1;
let clusterBasePositions = null;
let clusterSpacingAnchors = null;
let clusterSpacingEditStarted = false;
let bubbleSetsModule = null;
let bubbleSetsLoadPromise = null;
let bubbleSetsUnavailable = false;
let bubbleSetUpdateTimer = null;
let bubbleSetFallbackWarned = false;
let copiedDocumentFormat = null;
let formatPainterSourceText = "";
let formatPainterSourceRange = null;
let activeProject = localStorage.getItem(ACTIVE_PROJECT_KEY) || DEFAULT_PROJECT_NAME;
let nodeTypes = readNodeTypes();
let presenceTimer = null;
let presenceLeaveSent = false;
const presenceClientId = getPresenceClientId();

const fields = {
  title: document.getElementById("nodeTitle"),
  type: document.getElementById("nodeType"),
  url: document.getElementById("nodeUrl"),
  citation: document.getElementById("nodeCitation"),
  tags: document.getElementById("nodeTags"),
  size: document.getElementById("nodeSize"),
  sizeNumber: document.getElementById("nodeSizeNumber"),
  fontSize: document.getElementById("nodeFontSize"),
  fontFamily: document.getElementById("nodeFontFamily"),
  fontStyle: document.getElementById("nodeFontStyle")
};

const multiFormatFields = {
  size: document.getElementById("multiNodeSize"),
  sizeNumber: document.getElementById("multiNodeSizeNumber"),
  fontSize: document.getElementById("multiNodeFontSize"),
  fontFamily: document.getElementById("multiNodeFontFamily"),
  fontStyle: document.getElementById("multiNodeFontStyle")
};

const statusMessage = document.getElementById("statusMessage");
const autosaveMessage = document.getElementById("autosaveMessage");
const panelMessage = document.getElementById("panelMessage");
const selectedKind = document.getElementById("selectedKind");
const nodeCitationLabel = document.getElementById("nodeCitationLabel");
const panelSwitch = document.querySelector(".panel-switch");
const detailsTabButton = document.getElementById("detailsTabButton");
const formattingTabButton = document.getElementById("formattingTabButton");
const openNotesButton = document.getElementById("openNotesButton");
const openLinkButton = document.getElementById("openLinkButton");
const copyNodeStyleButton = document.getElementById("copyNodeStyleButton");
const pasteNodeStyleButton = document.getElementById("pasteNodeStyleButton");
const multiCopyNodeStyleButton = document.getElementById("multiCopyNodeStyleButton");
const multiPasteNodeStyleButton = document.getElementById("multiPasteNodeStyleButton");
const openPdfButton = document.getElementById("openPdfButton");
const importPdfHighlightsButton = document.getElementById("importPdfHighlightsButton");
const openPdfFolderButton = document.getElementById("openPdfFolderButton");
const importFile = document.getElementById("importFile");
const edgeNotesPanel = document.getElementById("edgeNotesPanel");
const edgeDetailTitle = document.getElementById("edgeDetailTitle");
const edgeFromNode = document.getElementById("edgeFromNode");
const edgeToNode = document.getElementById("edgeToNode");
const edgeNotesText = document.getElementById("edgeNotesText");
const edgeTagsText = document.getElementById("edgeTagsText");
const edgeColorInput = document.getElementById("edgeColorInput");
const edgeWidthInput = document.getElementById("edgeWidthInput");
const edgeWidthNumber = document.getElementById("edgeWidthNumber");
const settingsEdgeColorInput = document.getElementById("settingsEdgeColorInput");
const settingsEdgeWidthInput = document.getElementById("settingsEdgeWidthInput");
const settingsEdgeWidthNumber = document.getElementById("settingsEdgeWidthNumber");
const nodeContextMenu = document.getElementById("nodeContextMenu");
const contextTypeButtons = document.getElementById("contextTypeButtons");
const resizeOverlay = document.getElementById("resizeOverlay");
const tagBubbleOverlay = document.getElementById("tagBubbleOverlay");
const mapLegend = document.getElementById("mapLegend");
const mapZoomControl = document.getElementById("mapZoomControl");
const mapZoomSlider = document.getElementById("mapZoomSlider");
const mapZoomValue = document.getElementById("mapZoomValue");
const zoomOutButton = document.getElementById("zoomOutButton");
const zoomInButton = document.getElementById("zoomInButton");
const clusterModeSelect = document.getElementById("clusterModeSelect");
const clusterSpacingSlider = document.getElementById("clusterSpacingSlider");
const clusterSpacingValue = document.getElementById("clusterSpacingValue");
const clusterSettingsButton = document.getElementById("clusterSettingsButton");
const clusterSettingsPanel = document.getElementById("clusterSettingsPanel");
const closeClusterSettingsButton = document.getElementById("closeClusterSettingsButton");
const clusterCircleColor = document.getElementById("clusterCircleColor");
const clusterTextColor = document.getElementById("clusterTextColor");
const clusterTextSize = document.getElementById("clusterTextSize");
const nodeSettingsButton = document.getElementById("nodeSettingsButton");
const nodeTypeSettingsPanel = document.getElementById("nodeTypeSettingsPanel");
const closeNodeTypeSettingsButton = document.getElementById("closeNodeTypeSettingsButton");
const nodeTypeSettingsList = document.getElementById("nodeTypeSettingsList");
const newNodeTypeName = document.getElementById("newNodeTypeName");
const newNodeTypeColor = document.getElementById("newNodeTypeColor");
const addNodeTypeButton = document.getElementById("addNodeTypeButton");
const projectSelect = document.getElementById("projectSelect");
const newProjectButton = document.getElementById("newProjectButton");
const searchPanel = document.getElementById("searchPanel");
const searchButton = document.getElementById("searchButton");
const closeSearchPanel = document.getElementById("closeSearchPanel");
const appSearchInput = document.getElementById("appSearchInput");
const searchResultsList = document.getElementById("searchResultsList");
const searchPanelStatus = document.getElementById("searchPanelStatus");
const presenceIndicator = document.getElementById("presenceIndicator");
const presenceText = document.getElementById("presenceText");
const mapWorkspace = document.getElementById("mapWorkspace");
const documentWorkspace = document.getElementById("documentWorkspace");
const mapViewButton = document.getElementById("mapViewButton");
const documentViewButton = document.getElementById("documentViewButton");
const multiViewButton = document.getElementById("multiViewButton");
const outlineViewSelect = document.getElementById("outlineViewSelect");
const documentOutlineList = document.getElementById("documentOutlineList");
const documentPrimaryTagControl = document.getElementById("documentPrimaryTagControl");
const documentPrimaryTag = document.getElementById("documentPrimaryTag");

window.addEventListener("error", (event) => {
  const message = event?.message || "Unknown JavaScript error";
  console.error("Unhandled application error.", event.error || event);
  setStatus(`Application error: ${message}`);
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event?.reason;
  const message = reason?.message || String(reason || "Unknown async error");
  console.error("Unhandled application promise rejection.", reason || event);
  setStatus(`Application error: ${message}`);
});
const documentSectionTitle = document.getElementById("documentSectionTitle");
const documentMetadata = document.getElementById("documentMetadata");
const documentCitation = document.getElementById("documentCitation");
const documentUrl = document.getElementById("documentUrl");
const documentAbstract = document.getElementById("documentAbstract");
const documentEditor = document.getElementById("documentEditor");
const documentConnectionContext = document.getElementById("documentConnectionContext");
const documentPage = document.querySelector(".document-page");
const documentPageScroll = document.querySelector(".document-page-scroll");
let joditEditor = null;
let isLoadingDocumentEditor = false;
const docFontFamily = document.getElementById("docFontFamily");
const docFontSize = document.getElementById("docFontSize");
const docLinkButton = document.getElementById("docLinkButton");
const docNodeLinkButton = document.getElementById("docNodeLinkButton");
const docFormatPainterButton = document.getElementById("docFormatPainterButton");
const docApplyTextColor = document.getElementById("docApplyTextColor");
const docPickTextColor = document.getElementById("docPickTextColor");
const docTextColorMenu = document.getElementById("docTextColorMenu");
const docTextColor = document.getElementById("docTextColor");
const docTextColorBar = document.getElementById("docTextColorBar");
const docTextColorSwatch = document.getElementById("docTextColorSwatch");
const docApplyHighlightColor = document.getElementById("docApplyHighlightColor");
const docPickHighlightColor = document.getElementById("docPickHighlightColor");
const docHighlightColorMenu = document.getElementById("docHighlightColorMenu");
const docHighlightColor = document.getElementById("docHighlightColor");
const docHighlightColorBar = document.getElementById("docHighlightColorBar");
const docHighlightColorSwatch = document.getElementById("docHighlightColorSwatch");
const docApplyAlignment = document.getElementById("docApplyAlignment");
const docAlignmentMenuButton = document.getElementById("docAlignmentMenuButton");
const docAlignmentMenu = document.getElementById("docAlignmentMenu");
const docAlignmentIcon = document.getElementById("docAlignmentIcon");
const docTableButton = document.getElementById("docTableButton");
const docImageInput = document.getElementById("docImageInput");
const docImageWidth = document.getElementById("docImageWidth");
const docImageWidthNumber = document.getElementById("docImageWidthNumber");
const documentImageResizeOverlay = document.getElementById("documentImageResizeOverlay");
const docOpenPdfButton = document.getElementById("docOpenPdfButton");
const docImportPdfHighlightsButton = document.getElementById("docImportPdfHighlightsButton");
const documentLinkPopover = document.getElementById("documentLinkPopover");
const documentLinkUrl = document.getElementById("documentLinkUrl");
const openDocumentLink = document.getElementById("openDocumentLink");
const removeDocumentLink = document.getElementById("removeDocumentLink");
const documentNodeLinkPicker = document.getElementById("documentNodeLinkPicker");
const documentNodeLinkList = document.getElementById("documentNodeLinkList");
const documentNodeLinkSearch = document.getElementById("documentNodeLinkSearch");
const documentNodeLinkTypeFilters = document.getElementById("documentNodeLinkTypeFilters");
const closeDocumentNodeLinkPicker = document.getElementById("closeDocumentNodeLinkPicker");
const documentTablePicker = document.getElementById("documentTablePicker");
const closeDocumentTablePicker = document.getElementById("closeDocumentTablePicker");
const documentTableRows = document.getElementById("documentTableRows");
const documentTableColumns = document.getElementById("documentTableColumns");
const insertDocumentTableButton = document.getElementById("insertDocumentTableButton");
const documentTableTools = document.getElementById("documentTableTools");
const publicationNotesModal = document.getElementById("publicationNotesModal");
const closePublicationNotes = document.getElementById("closePublicationNotes");
const publicationNotesDragHandle = document.getElementById("publicationNotesDragHandle");
const publicationNotesSubtitle = document.getElementById("publicationNotesSubtitle");
const pdfHighlightsModal = document.getElementById("pdfHighlightsModal");
const pdfHighlightsDialog = pdfHighlightsModal.querySelector(".pdf-highlights-dialog");
const pdfHighlightsHeader = pdfHighlightsModal.querySelector(".pdf-highlights-header");
const pdfHighlightsStatus = document.getElementById("pdfHighlightsStatus");
const pdfHighlightsList = document.getElementById("pdfHighlightsList");
const pdfAnnotationPrefixStyle = document.getElementById("pdfAnnotationPrefixStyle");
const addPdfAnnotationPrefixButton = document.getElementById("addPdfAnnotationPrefixButton");
const deletePdfAnnotationPrefixButton = document.getElementById("deletePdfAnnotationPrefixButton");
const pdfAnnotationQuoteStyle = document.getElementById("pdfAnnotationQuoteStyle");
const pdfAnnotationListStyle = document.getElementById("pdfAnnotationListStyle");
const pdfAnnotationIncludeComments = document.getElementById("pdfAnnotationIncludeComments");
const pdfAnnotationFormatPreview = document.getElementById("pdfAnnotationFormatPreview");
const savePdfAnnotationDefaultsButton = document.getElementById("savePdfAnnotationDefaultsButton");
const selectAllPdfHighlightsButton = document.getElementById("selectAllPdfHighlightsButton");
const deselectAllPdfHighlightsButton = document.getElementById("deselectAllPdfHighlightsButton");
const appendPdfHighlightsButton = document.getElementById("appendPdfHighlightsButton");
const closePdfHighlightsButton = document.getElementById("closePdfHighlightsButton");
const zoteroPanel = document.getElementById("zoteroPanel");
const zoteroPanelHeader = zoteroPanel.querySelector(".zotero-panel-header");
const zoteroStatusText = document.getElementById("zoteroStatusText");
const zoteroModeBadge = document.getElementById("zoteroModeBadge");
const zoteroLibrarySelect = document.getElementById("zoteroLibrarySelect");
const zoteroCollectionSelect = document.getElementById("zoteroCollectionSelect");
const zoteroSubcollectionSelect = document.getElementById("zoteroSubcollectionSelect");
const zoteroItemsList = document.getElementById("zoteroItemsList");
const zoteroListActions = document.getElementById("zoteroListActions");
const zoteroSearchInput = document.getElementById("zoteroSearchInput");
const zoteroSortSelect = document.getElementById("zoteroSortSelect");
const clearZoteroSearchButton = document.getElementById("clearZoteroSearchButton");
const openAlexPanel = document.getElementById("openAlexPanel");
const openAlexPanelHeader = openAlexPanel.querySelector(".zotero-panel-header");
const openAlexResizeHandle = document.getElementById("openAlexResizeHandle");
const openAlexStatusText = document.getElementById("openAlexStatusText");
const openAlexSearchInput = document.getElementById("openAlexSearchInput");
const openAlexResultsList = document.getElementById("openAlexResultsList");
const openAlexResultsCount = document.getElementById("openAlexResultsCount");
const clearOpenAlexSearchButton = document.getElementById("clearOpenAlexSearchButton");
const openAlexPublicationFilterInput = document.getElementById("openAlexPublicationFilterInput");
const openAlexPublicationTagFilter = document.getElementById("openAlexPublicationTagFilter");
const openAlexPublicationList = document.getElementById("openAlexPublicationList");
const openAlexPublicationCount = document.getElementById("openAlexPublicationCount");
const clearOpenAlexPublicationFilterButton = document.getElementById("clearOpenAlexPublicationFilterButton");
const openAlexModeRelated = document.getElementById("openAlexModeRelated");
const openAlexModeCites = document.getElementById("openAlexModeCites");
const openAlexModeCitedBy = document.getElementById("openAlexModeCitedBy");
const openAlexStrictIntersection = document.getElementById("openAlexStrictIntersection");
const grobidPanel = document.getElementById("grobidPanel");
const grobidStatusText = document.getElementById("grobidStatusText");
const grobidSuggestionsList = document.getElementById("grobidSuggestionsList");
const grobidListActions = document.getElementById("grobidListActions");
const grobidProgress = document.getElementById("grobidProgress");
const grobidProgressText = document.getElementById("grobidProgressText");
const grobidErrorLog = document.getElementById("grobidErrorLog");
const publicationNoteFields = {
  notes: document.getElementById("publicationNotesText"),
  citation: document.getElementById("publicationCitation"),
  url: document.getElementById("publicationUrl"),
  abstract: document.getElementById("publicationAbstract")
};
populateDocumentFontSizes();

const cy = cytoscape({
  container: document.getElementById("cy"),
  elements: loadInitialElements(),
  layout: { name: "preset", fit: true, padding: 70 },
  wheelSensitivity: 0.22,
  minZoom: 0.05,
  maxZoom: 3,
  userZoomingEnabled: false,
  boxSelectionEnabled: true,
  selectionType: "additive",
  style: [
    {
      selector: "node",
      style: {
        "label": "data(label)",
        "width": "data(size)",
        "height": "data(size)",
        "shape": "ellipse",
        "background-color": "data(nodeColor)",
        "color": "#1f2937",
        "font-size": "data(fontSize)",
        "font-family": "data(fontFamily)",
        "font-style": "data(fontStyleValue)",
        "font-weight": "data(fontWeight)",
        "text-valign": "center",
        "text-halign": "center",
        "text-wrap": "wrap",
        "text-max-width": "data(textWidth)",
        "border-width": 3,
        "border-color": "#ffffff",
        "overlay-padding": 8,
        "z-index": "data(zIndex)",
        "z-index-compare": "manual"
      }
    },
    {
      selector: "node[clusterBackground]",
      style: {
        "shape": "ellipse",
        "width": "data(clusterWidth)",
        "height": "data(clusterHeight)",
        "background-color": "data(clusterCircleColor)",
        "background-opacity": "data(clusterBackgroundOpacity)",
        "border-width": 2,
        "border-color": "data(clusterCircleColor)",
        "border-opacity": "data(clusterBorderOpacity)",
        "color": "data(clusterTextColor)",
        "font-size": "data(clusterTextSize)",
        "font-weight": 800,
        "text-valign": "top",
        "text-halign": "center",
        "text-margin-x": "data(clusterTextMarginX)",
        "text-margin-y": "data(clusterTextMarginY)",
        "events": "no",
        "z-index": -1000,
        "z-index-compare": "manual"
      }
    },
    {
      selector: "edge",
      style: {
        "width": DEFAULT_EDGE_WIDTH,
        "line-color": DEFAULT_EDGE_COLOR,
        "target-arrow-color": DEFAULT_EDGE_COLOR,
        "target-arrow-shape": "triangle",
        "curve-style": "bezier",
        "z-index": "data(zIndex)",
        "z-index-compare": "manual"
      }
    },
    {
      selector: ".neighborhood-faded",
      style: {
        "opacity": 0.16,
        "text-opacity": 0.18,
        "background-opacity": 0.16,
        "line-opacity": 0.12,
        "target-arrow-opacity": 0.12
      }
    },
    {
      selector: "edge.neighborhood-focus",
      style: {
        "width": `mapData(width, 1, 12, ${DEFAULT_EDGE_WIDTH + 1}, ${DEFAULT_EDGE_WIDTH + 4})`,
        "line-opacity": 1,
        "target-arrow-opacity": 1
      }
    },
    {
      selector: ":selected",
      style: {
        "border-width": 5,
        "border-color": "#1f2937",
        "line-color": "#1f2937",
        "target-arrow-color": "#1f2937"
      }
    },
    {
      selector: ".connection-source",
      style: {
        "border-width": 6,
        "border-color": "#0f766e"
      }
    },
    {
      selector: "node.connection-endpoint",
      style: {
        "border-width": 7,
        "border-color": "#f59e0b",
        "overlay-color": "#f59e0b",
        "overlay-opacity": 0.12,
        "overlay-padding": 14
      }
    }
  ]
});
installMapContextMenuBlockers();

cy.on("mousedown", "node", (event) => {
  nodeSelectionBeforeTap.set(event.target.id(), event.target.selected());
});

cy.on("tapstart", "node", (event) => {
  nodeSelectionBeforeTap.set(event.target.id(), event.target.selected());
});

cy.on("tap", "node", (event) => {
  const node = event.target;
  hideContextMenu();
  clearConnectionEndpointHighlights();

  if (connectionMode) {
    handleConnectionTap(node);
    return;
  }

  const original = event.originalEvent;
  const additive = Boolean(isAdditiveSelectKeyDown || original?.ctrlKey || original?.metaKey || original?.shiftKey);
  if (additive) {
    const hadSnapshot = nodeSelectionBeforeTap.has(node.id());
    const wasSelected = hadSnapshot ? nodeSelectionBeforeTap.get(node.id()) === true : node.selected();
    if (wasSelected) {
      node.unselect();
    } else {
      node.select();
    }
    nodeSelectionBeforeTap.delete(node.id());
    const selectedNodes = getSelectedNodes();
    const nextPrimary = selectedNodes[selectedNodes.length - 1] || node;
    if (selectedNodes.length) selectNode(nextPrimary);
    else syncNodeSelectionFromGraph();
    return;
  }

  cy.$(":selected").not(node).unselect();
  node.select();
  selectNode(node);
  setActiveDocumentNode(node);
});

cy.on("tap", "edge", (event) => {
  if (connectionMode) return;
  selectEdge(event.target);
  if (!documentWorkspace.hidden) setActiveDocumentEdge(event.target);
});

cy.on("tap", (event) => {
  if (event.target !== cy || connectionMode) return;
  hideContextMenu();
  hideResizeOverlay();
  clearConnectionEndpointHighlights();
  clearNeighborhoodFocus();
  cy.$(":selected").unselect();
  selectedNode = null;
  selectedEdge = null;
  setFormEnabled(false);
  clearForm();
  hideEdgeNotesPanel();
  selectedKind.textContent = "No selection";
  panelMessage.textContent = "Select a node to edit its research metadata.";
});

cy.on("cxttap", "node", (event) => {
  const node = event.target;
  if (event.originalEvent) event.originalEvent.preventDefault();
  clearConnectionEndpointHighlights();
  cy.$(":selected").unselect();
  node.select();
  selectNode(node);
  showContextMenu(node, event);
});

cy.on("cxttap", (event) => {
  if (event.target === cy) hideContextMenu();
});

cy.on("position pan zoom resize", () => {
  updateResizeOverlay();
  scheduleBubbleSetUpdate();
});
cy.on("zoom", updateMapZoomControl);
cy.container().addEventListener("wheel", handleMapWheelZoom, { passive: false });
cy.on("free", "node", (event) => {
  if (event.target.data("clusterBackground")) return;
  clusterBasePositions = null;
  clusterSpacingAnchors = null;
  if (currentClusterMode === "tags") renderTagClusterBackgrounds();
  scheduleAutosave("Autosaved after node move.");
});
cy.on("remove add data style", () => scheduleBubbleSetUpdate());
cy.on("boxselect", "node", () => {
  window.setTimeout(syncNodeSelectionFromGraph, 0);
});

function installMapContextMenuBlockers() {
  const blockNativeContextMenu = (event) => {
    event.preventDefault();
  };
  const blockContextMenuInsideMapBounds = (event) => {
    const canvasWrap = mapWorkspace.querySelector(".canvas-wrap");
    if (!canvasWrap || mapWorkspace.hidden) return;
    const rect = canvasWrap.getBoundingClientRect();
    const insideMap = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (insideMap) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  const blockRightMouseDownInsideMapBounds = (event) => {
    if (event.button !== 2) return;
    const canvasWrap = mapWorkspace.querySelector(".canvas-wrap");
    if (!canvasWrap || mapWorkspace.hidden) return;
    const rect = canvasWrap.getBoundingClientRect();
    const insideMap = event.clientX >= rect.left
      && event.clientX <= rect.right
      && event.clientY >= rect.top
      && event.clientY <= rect.bottom;
    if (insideMap) event.preventDefault();
  };
  const mapElements = [
    document.getElementById("cy"),
    cy.container(),
    mapWorkspace,
    mapWorkspace.querySelector(".canvas-wrap")
  ].filter(Boolean);

  mapElements.forEach((element) => {
    element.addEventListener("contextmenu", blockNativeContextMenu, { capture: true });
  });
  document.addEventListener("contextmenu", blockContextMenuInsideMapBounds, { capture: true });
  document.addEventListener("mousedown", blockRightMouseDownInsideMapBounds, { capture: true });
}

document.querySelectorAll("[data-add-type]").forEach((button) => {
  button.addEventListener("click", () => addNode(getDefaultNodeTypeName()));
});
document.querySelectorAll(".toolbar-menu").forEach((menu) => {
  menu.addEventListener("toggle", () => {
    if (!menu.open) return;
    document.querySelectorAll(".toolbar-menu[open]").forEach((openMenu) => {
      if (openMenu !== menu) openMenu.open = false;
    });
  });
  menu.addEventListener("click", (event) => {
    if (event.target.closest("summary")) return;
    if (event.target.closest("button")) menu.open = false;
  });
});
document.addEventListener("pointerdown", (event) => {
  if (event.target.closest(".toolbar-menu")) return;
  closeToolbarMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeToolbarMenus();
});

document.getElementById("connectionButton").addEventListener("click", startConnectionMode);
projectSelect.addEventListener("change", () => switchProject(projectSelect.value));
newProjectButton.addEventListener("click", createNewProject);
nodeSettingsButton.addEventListener("click", openNodeTypeSettings);
closeNodeTypeSettingsButton.addEventListener("click", closeNodeTypeSettings);
nodeTypeSettingsPanel.addEventListener("click", (event) => {
  if (event.target === nodeTypeSettingsPanel) closeNodeTypeSettings();
});
addNodeTypeButton.addEventListener("click", addNodeTypeFromSettings);
searchButton.addEventListener("click", openSearchPanel);
closeSearchPanel.addEventListener("click", closeSearchPanelView);
searchPanel.addEventListener("click", (event) => {
  if (event.target === searchPanel) closeSearchPanelView();
});
appSearchInput.addEventListener("input", renderSearchResults);
clusterSettingsButton.addEventListener("click", openClusterSettings);
closeClusterSettingsButton.addEventListener("click", closeClusterSettings);
clusterSettingsPanel.addEventListener("click", (event) => {
  if (event.target === clusterSettingsPanel) closeClusterSettings();
});
[clusterCircleColor, clusterTextColor].forEach((field) => {
  field.addEventListener("input", updateClusterStyleFromSettings);
});
clusterTextSize.addEventListener("input", () => updateClusterStyleFromSettings({ clampTextSize: false }));
clusterTextSize.addEventListener("change", updateClusterStyleFromSettings);
clusterTextSize.addEventListener("blur", updateClusterStyleFromSettings);
mapViewButton.addEventListener("click", () => showWorkspace("map"));
documentViewButton.addEventListener("click", () => showWorkspace("document"));
multiViewButton.addEventListener("click", () => showWorkspace("multi"));
mapZoomSlider.addEventListener("input", () => {
  showMapZoomControl();
  setMapZoom(Number(mapZoomSlider.value));
});
mapZoomValue.addEventListener("change", applyTypedMapZoom);
mapZoomValue.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    applyTypedMapZoom();
    mapZoomValue.blur();
  }
});
mapZoomValue.addEventListener("focus", showMapZoomControl);
mapZoomValue.addEventListener("blur", () => {
  applyTypedMapZoom();
  scheduleHideMapZoomControl();
});
zoomOutButton.addEventListener("click", () => {
  showMapZoomControl();
  stepMapZoom(-0.01);
});
zoomInButton.addEventListener("click", () => {
  showMapZoomControl();
  stepMapZoom(0.01);
});
clusterModeSelect.addEventListener("change", () => applyClusterMode(clusterModeSelect.value));
clusterSpacingSlider.addEventListener("pointerdown", () => {
  if (currentClusterMode === "none") return;
  pushUndoState("cluster spacing");
  prepareClusterSpacingLayout();
  clusterSpacingEditStarted = true;
});
clusterSpacingSlider.addEventListener("input", () => {
  clusterSpacingFactor = clampClusterSpacing(clusterSpacingSlider.value);
  updateClusterSpacingValue();
  if (currentClusterMode !== "none") {
    applyClusterSpacing({ animate: false, autosave: false });
    setStatus(`Cluster spacing ${clusterSpacingFactor.toFixed(2)}x.`);
  }
});
clusterSpacingSlider.addEventListener("change", () => {
  clusterSpacingFactor = clampClusterSpacing(clusterSpacingSlider.value);
  updateClusterSpacingValue();
  if (currentClusterMode !== "none") {
    if (!clusterSpacingEditStarted) pushUndoState("cluster spacing");
    if (!clusterSpacingEditStarted) prepareClusterSpacingLayout();
    applyClusterSpacing({ animate: true, autosave: true });
    clusterSpacingEditStarted = false;
  }
});
outlineViewSelect.addEventListener("change", () => {
  activeOutlineView = outlineViewSelect.value;
  updateDocumentPrimaryTagControl();
  renderDocumentOutline();
});
documentPrimaryTag.addEventListener("change", updateActiveDocumentPrimaryTag);
document.getElementById("saveButton").addEventListener("click", saveGraph);
document.getElementById("exportButton").addEventListener("click", exportJson);
document.getElementById("importButton").addEventListener("click", () => importFile.click());
document.getElementById("resetViewButton").addEventListener("click", resetView);
if (presenceIndicator) presenceIndicator.addEventListener("click", refreshPresence);
document.getElementById("zoteroButton").addEventListener("click", openZoteroPanel);
document.getElementById("openAlexButton").addEventListener("click", openOpenAlexPanel);
document.getElementById("grobidButton").addEventListener("click", openGrobidPanel);
document.getElementById("closeZoteroPanel").addEventListener("click", closeZoteroPanel);
document.getElementById("checkZoteroButton").addEventListener("click", checkZotero);
document.getElementById("loadZoteroItemsButton").addEventListener("click", loadZoteroItems);
document.getElementById("selectAllZoteroItemsButton").addEventListener("click", () => setPanelCheckboxes(zoteroItemsList, true));
document.getElementById("deselectAllZoteroItemsButton").addEventListener("click", () => setPanelCheckboxes(zoteroItemsList, false));
document.getElementById("importZoteroItemsButton").addEventListener("click", importSelectedZoteroItems);
zoteroLibrarySelect.addEventListener("change", () => {
  zoteroSearchInput.value = "";
  zoteroItemsCache = [];
  zoteroCollectionsCache = [];
  zoteroTopCollectionsCache = [];
  resetZoteroFolderSelects("Loading main folders...");
  renderZoteroItems();
  loadZoteroCollections();
});
zoteroCollectionSelect.addEventListener("change", () => {
  zoteroSearchInput.value = "";
  zoteroItemsCache = [];
  renderZoteroSubcollectionOptions();
  renderZoteroItems();
  zoteroStatusText.textContent = "Selected Zotero folder. Load items or search.";
});
zoteroSubcollectionSelect.addEventListener("change", () => {
  zoteroSearchInput.value = "";
  zoteroItemsCache = [];
  renderZoteroItems();
  zoteroStatusText.textContent = "Selected Zotero subfolder. Load items or search.";
});
zoteroSortSelect.addEventListener("change", renderZoteroItems);
zoteroSearchInput.addEventListener("input", () => {
  window.clearTimeout(zoteroSearchTimer);
  zoteroSearchTimer = window.setTimeout(() => {
    if (!zoteroPanel.hidden) loadZoteroItems();
  }, 350);
});
clearZoteroSearchButton.addEventListener("click", () => {
  zoteroSearchInput.value = "";
  loadZoteroItems();
});
document.getElementById("closeOpenAlexPanel").addEventListener("click", closeOpenAlexPanel);
document.getElementById("findSimilarOpenAlexButton").addEventListener("click", findSimilarOpenAlexWorks);
document.getElementById("searchOpenAlexButton").addEventListener("click", searchOpenAlexWorks);
document.getElementById("selectAllOpenAlexPublicationsButton").addEventListener("click", () => {
  setOpenAlexPublicationCheckboxes(true);
  updateOpenAlexPublicationCount();
});
document.getElementById("deselectAllOpenAlexPublicationsButton").addEventListener("click", () => {
  setPanelCheckboxes(openAlexPublicationList, false);
  updateOpenAlexPublicationCount();
});
openAlexPublicationList.addEventListener("change", handleOpenAlexPublicationSelectionChange);
openAlexPublicationFilterInput.addEventListener("input", renderOpenAlexPublicationList);
openAlexPublicationTagFilter.addEventListener("change", renderOpenAlexPublicationList);
clearOpenAlexPublicationFilterButton.addEventListener("click", () => {
  openAlexPublicationFilterInput.value = "";
  openAlexPublicationTagFilter.value = "";
  renderOpenAlexPublicationList();
});
openAlexSearchInput.addEventListener("input", () => {
  window.clearTimeout(openAlexSearchTimer);
  openAlexSearchTimer = window.setTimeout(() => {
    if (!openAlexPanel.hidden && openAlexSearchInput.value.trim()) searchOpenAlexWorks();
  }, 450);
});
openAlexSearchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") searchOpenAlexWorks();
});
clearOpenAlexSearchButton.addEventListener("click", () => {
  openAlexSearchInput.value = "";
  openAlexResultsCache = [];
  renderOpenAlexResults();
  openAlexStatusText.textContent = "Find papers, then add them to Zotero before importing nodes.";
});
document.getElementById("closeGrobidPanel").addEventListener("click", closeGrobidPanel);
document.getElementById("checkGrobidButton").addEventListener("click", checkGrobid);
document.getElementById("analyzeGrobidButton").addEventListener("click", analyzeGrobidReferences);
document.getElementById("selectAllGrobidSuggestionsButton").addEventListener("click", () => setPanelCheckboxes(grobidSuggestionsList, true));
document.getElementById("deselectAllGrobidSuggestionsButton").addEventListener("click", () => setPanelCheckboxes(grobidSuggestionsList, false));
document.getElementById("addGrobidConnectionsButton").addEventListener("click", addSelectedGrobidConnections);
importFile.addEventListener("change", importJson);
detailsTabButton.addEventListener("click", () => showDetailsPanel("details"));
formattingTabButton.addEventListener("click", () => showDetailsPanel("formatting"));
openNotesButton.addEventListener("click", openSelectedNodeNotes);
openLinkButton.addEventListener("click", openSelectedLink);
copyNodeStyleButton.addEventListener("click", () => copyNodeStyle(selectedNode));
pasteNodeStyleButton.addEventListener("click", () => pasteNodeStyle(selectedNode));
multiCopyNodeStyleButton.addEventListener("click", () => copyNodeStyle(selectedNode));
multiPasteNodeStyleButton.addEventListener("click", () => pasteNodeStyle(selectedNode));
openPdfButton.addEventListener("click", openSelectedPdf);
importPdfHighlightsButton.addEventListener("click", importSelectedPdfHighlights);
openPdfFolderButton.addEventListener("click", openPdfFolder);
docOpenPdfButton.addEventListener("click", () => openPdfForNode(getActiveDocumentNode()));
docImportPdfHighlightsButton.addEventListener("click", () => importPdfHighlightsForNode(getActiveDocumentNode()));
appendPdfHighlightsButton.addEventListener("click", appendSelectedPdfHighlights);
selectAllPdfHighlightsButton.addEventListener("click", () => setPanelCheckboxes(pdfHighlightsList, true));
deselectAllPdfHighlightsButton.addEventListener("click", () => setPanelCheckboxes(pdfHighlightsList, false));
closePdfHighlightsButton.addEventListener("click", closePdfHighlightsModal);
[pdfAnnotationPrefixStyle, pdfAnnotationQuoteStyle, pdfAnnotationListStyle, pdfAnnotationIncludeComments].forEach((control) => {
  control?.addEventListener("change", updatePdfAnnotationFormatPreview);
});
pdfAnnotationPrefixStyle?.addEventListener("change", syncPdfAnnotationPrefixDeleteButton);
pdfAnnotationPrefixStyle?.addEventListener("keydown", handlePdfAnnotationPrefixKeydown);
addPdfAnnotationPrefixButton?.addEventListener("click", addCustomPdfAnnotationPrefix);
deletePdfAnnotationPrefixButton?.addEventListener("click", deleteSelectedCustomPdfAnnotationPrefix);
savePdfAnnotationDefaultsButton?.addEventListener("click", savePdfAnnotationFormatDefaults);
edgeNotesText.addEventListener("focus", beginEdgeEdit);
edgeNotesText.addEventListener("input", updateSelectedEdgeNotes);
edgeNotesText.addEventListener("blur", commitEdgeEdit);
edgeTagsText.addEventListener("focus", beginEdgeEdit);
edgeTagsText.addEventListener("input", updateSelectedEdgeTags);
edgeTagsText.addEventListener("blur", commitEdgeEdit);
initializeTagAutocomplete(fields.tags);
initializeTagAutocomplete(edgeTagsText);
loadPdfAnnotationFormatDefaults();
edgeColorInput.addEventListener("input", updateGlobalConnectionStyle);
edgeWidthInput.addEventListener("input", updateGlobalConnectionStyle);
edgeWidthNumber.addEventListener("input", updateGlobalConnectionStyle);
edgeWidthNumber.addEventListener("blur", syncGlobalConnectionStyleControls);
settingsEdgeColorInput.addEventListener("input", updateGlobalConnectionStyle);
settingsEdgeWidthInput.addEventListener("input", updateGlobalConnectionStyle);
settingsEdgeWidthNumber.addEventListener("input", updateGlobalConnectionStyle);
settingsEdgeWidthNumber.addEventListener("blur", syncGlobalConnectionStyleControls);
document.addEventListener("click", (event) => {
  if (!nodeContextMenu.contains(event.target)) hideContextMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Control" || event.key === "Meta") {
    isAdditiveSelectKeyDown = true;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    if (event.shiftKey) redoLastAction();
    else undoLastAction();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y") {
    if (isTypingTarget(event.target)) return;
    event.preventDefault();
    redoLastAction();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c") {
    if (copySelectedDocumentTableCells()) {
      event.preventDefault();
      return;
    }
    if (isInsideDocumentEditor(event.target)) return;
    if (copySelectedDocumentImage()) {
      event.preventDefault();
      return;
    }
    if (shouldLetBrowserHandleClipboard(event.target)) return;
    event.preventDefault();
    copySelectedNodesToClipboard();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v") {
    if (pasteCopiedDocumentTableCells()) {
      event.preventDefault();
      return;
    }
    if (isInsideDocumentEditor(event.target)) return;
    if (!useJoditImageResize && copiedDocumentImage && isDocumentImagePasteContext(event.target) && !hasEditableTextSelection()) {
      event.preventDefault();
      pasteCopiedDocumentImage();
      return;
    }
    if (shouldLetBrowserHandleClipboard(event.target)) return;
    event.preventDefault();
    pasteCopiedNodesFromClipboard();
    return;
  }

  if ((event.key === "Delete" || event.key === "Backspace") && !isTypingTarget(event.target)) {
    if (documentEditor.contentEditable === "true" && getSelectedDocumentResizableElement()) {
      event.preventDefault();
      deleteSelectedDocumentResizableElement();
      return;
    }
    if (isInsideDocumentEditor(event.target)) return;
    event.preventDefault();
    deleteSelected();
    return;
  }

  if (event.key === "Escape") {
    closePdfHighlightsModal();
    hideContextMenu();
    closePublicationNotesModal();
    endConnectionMode();
    setStatus("Ready.");
  }
});
document.addEventListener("keyup", (event) => {
  if (event.key === "Control" || event.key === "Meta") {
    isAdditiveSelectKeyDown = event.ctrlKey || event.metaKey;
  }
});
window.addEventListener("blur", () => {
  isAdditiveSelectKeyDown = false;
});
window.addEventListener("pageshow", () => {
  presenceLeaveSent = false;
  startPresenceHeartbeat();
});
window.addEventListener("pagehide", sendPresenceLeave);
window.addEventListener("beforeunload", sendPresenceLeave);
nodeContextMenu.addEventListener("click", handleContextMenuClick);
closePublicationNotes.addEventListener("click", closePublicationNotesModal);
publicationNotesModal.addEventListener("click", (event) => {
  event.stopPropagation();
});
pdfHighlightsModal.addEventListener("click", (event) => {
  if (event.target === pdfHighlightsModal) closePdfHighlightsModal();
});
publicationNotesDragHandle.addEventListener("pointerdown", startNotesPanelDrag);
zoteroPanelHeader.addEventListener("pointerdown", startZoteroPanelDrag);
openAlexPanelHeader.addEventListener("pointerdown", startOpenAlexPanelDrag);
pdfHighlightsHeader.addEventListener("pointerdown", startPdfHighlightsPanelDrag);
openAlexResizeHandle.addEventListener("pointerdown", startOpenAlexPanelResize);
window.addEventListener("pointermove", continueNotesPanelDrag);
window.addEventListener("pointermove", continueZoteroPanelDrag);
window.addEventListener("pointermove", continueOpenAlexPanelDrag);
window.addEventListener("pointermove", continuePdfHighlightsPanelDrag);
window.addEventListener("pointermove", continueOpenAlexPanelResize);
window.addEventListener("pointerup", finishNotesPanelDrag);
window.addEventListener("pointerup", finishZoteroPanelDrag);
window.addEventListener("pointerup", finishOpenAlexPanelDrag);
window.addEventListener("pointerup", finishPdfHighlightsPanelDrag);
window.addEventListener("pointerup", finishOpenAlexPanelResize);
Object.values(publicationNoteFields).forEach((field) => {
  field.addEventListener("input", updatePublicationNotes);
});
resizeOverlay.querySelectorAll("[data-resize-handle]").forEach((handle) => {
  handle.addEventListener("pointerdown", startResizeDrag);
});
window.addEventListener("pointermove", continueResizeDrag);
window.addEventListener("pointerup", finishResizeDrag);
documentImageResizeOverlay.querySelectorAll("[data-image-resize-handle]").forEach((handle) => {
  handle.addEventListener("pointerdown", startDocumentImageResize);
});
window.addEventListener("pointermove", continueDocumentImageResize);
window.addEventListener("pointerup", finishDocumentImageResize);
window.addEventListener("pointermove", continueDocumentTableSelectionDrag);
window.addEventListener("pointerup", finishDocumentTableSelectionDrag);

Object.values(fields).forEach((field) => {
  field.addEventListener("focus", beginNodeEdit);
  field.addEventListener("input", handleFieldInput);
  field.addEventListener("change", handleFieldChange);
  field.addEventListener("blur", handleFieldBlur);
});
Object.values(multiFormatFields).forEach((field) => {
  field.addEventListener("focus", beginNodeEdit);
  field.addEventListener("input", handleMultiFormatInput);
  field.addEventListener("change", handleMultiFormatChange);
  field.addEventListener("blur", handleMultiFormatBlur);
});
documentSectionTitle.addEventListener("focus", beginDocumentEdit);
documentSectionTitle.addEventListener("input", updateDocumentTitle);
documentSectionTitle.addEventListener("blur", commitDocumentEdit);
documentCitation.addEventListener("focus", beginDocumentEdit);
documentCitation.addEventListener("input", updateDocumentCitation);
documentCitation.addEventListener("blur", commitDocumentEdit);
documentUrl.addEventListener("focus", beginDocumentEdit);
documentUrl.addEventListener("input", updateDocumentUrl);
documentUrl.addEventListener("blur", commitDocumentEdit);
documentAbstract.addEventListener("focus", beginDocumentEdit);
documentAbstract.addEventListener("input", updateDocumentAbstract);
documentAbstract.addEventListener("blur", commitDocumentEdit);
documentEditor.addEventListener("focus", beginDocumentEdit);
documentEditor.addEventListener("input", handleDocumentEditorInput);
documentEditor.addEventListener("blur", () => {
  autoLinkDocumentUrls({ preserveSelection: false });
  commitDocumentEdit();
});
documentEditor.addEventListener("pointerdown", handleDocumentEditorPointerDown);
documentEditor.addEventListener("mouseup", handleDocumentSelectionForFormatPainter);
documentEditor.addEventListener("keyup", handleDocumentSelectionForFormatPainter);
documentEditor.addEventListener("mouseup", updateDocumentFontToolbarState);
documentEditor.addEventListener("keyup", updateDocumentFontToolbarState);
documentEditor.addEventListener("click", handleDocumentEditorClick);
documentEditor.addEventListener("keydown", handleDocumentEditorKeydown);
documentEditor.addEventListener("paste", handleDocumentEditorPaste);
documentEditor.addEventListener("dragover", handleDocumentEditorDragOver);
documentEditor.addEventListener("drop", handleDocumentEditorDrop);
document.addEventListener("keydown", handleDocumentSelectionEscape, true);
documentEditor.closest(".document-editor-shell").addEventListener("scroll", () => {
  updateDocumentImageResizeOverlay();
  updateDocumentTableToolsPosition();
});
window.addEventListener("resize", () => {
  updateMapZoomControlPosition();
  updateDocumentImageResizeOverlay();
  if (!documentNodeLinkPicker.hidden) positionDocumentNodeLinkPicker();
  updateDocumentTableToolsPosition();
});
openDocumentLink.addEventListener("click", openActiveDocumentLink);
removeDocumentLink.addEventListener("click", removeActiveDocumentLink);
document.addEventListener("pointerdown", handleDocumentTableToolsOutsidePointerDown, true);
document.addEventListener("click", (event) => {
  const editorRoot = getDocumentEditorRoot();
  if (!documentLinkPopover.hidden && !documentLinkPopover.contains(event.target) && !editorRoot.contains(event.target)) {
    hideDocumentLinkPopover();
  }
  if (!documentNodeLinkPicker.hidden && !documentNodeLinkPicker.contains(event.target) && event.target !== docNodeLinkButton) {
    hideDocumentNodeLinkPicker();
  }
  if (!documentTablePicker.hidden && !documentTablePicker.contains(event.target) && event.target !== docTableButton) {
    hideDocumentTablePicker();
  }
  if (!docAlignmentMenu.hidden && !docAlignmentMenu.contains(event.target) && !docAlignmentMenuButton.contains(event.target)) {
    docAlignmentMenu.hidden = true;
  }
  if (!docTextColorMenu.hidden && !docTextColorMenu.contains(event.target) && !docPickTextColor.contains(event.target)) {
    docTextColorMenu.hidden = true;
  }
  if (!docHighlightColorMenu.hidden && !docHighlightColorMenu.contains(event.target) && !docPickHighlightColor.contains(event.target)) {
    docHighlightColorMenu.hidden = true;
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !documentLinkPopover.hidden) {
    event.preventDefault();
    hideDocumentLinkPopover();
  }
  if (event.key === "Escape" && !documentNodeLinkPicker.hidden) {
    event.preventDefault();
    hideDocumentNodeLinkPicker();
  }
  if (event.key === "Escape" && !documentTablePicker.hidden) {
    event.preventDefault();
    hideDocumentTablePicker();
  }
  if (event.key === "Escape" && !searchPanel.hidden) {
    event.preventDefault();
    closeSearchPanelView();
  }
  if (event.key === "Escape" && !docAlignmentMenu.hidden) {
    event.preventDefault();
    docAlignmentMenu.hidden = true;
  }
  if (event.key === "Escape" && (!docTextColorMenu.hidden || !docHighlightColorMenu.hidden)) {
    event.preventDefault();
    closeDocumentColorMenus();
  }
  if (event.key === "Escape" && copiedDocumentFormat) {
    event.preventDefault();
    clearDocumentFormatPainter();
    setStatus("Format painter canceled.");
  }
});
document.addEventListener("selectionchange", () => {
  const selection = window.getSelection();
  const editorRoot = getDocumentEditorRoot();
  if (!selection || selection.rangeCount === 0 || !editorRoot.contains(selection.anchorNode)) return;
  updateDocumentFontToolbarState();
});
document.querySelectorAll("[data-doc-command]").forEach((button) => {
  button.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
  button.addEventListener("click", () => runDocumentCommand(button.dataset.docCommand));
});
document.querySelectorAll("[data-doc-value-command]").forEach((control) => {
  control.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
  control.addEventListener("change", () => {
    runDocumentValueCommand(control.dataset.docValueCommand, control.value);
    updateDocumentFontToolbarState();
  });
});
docFontSize.addEventListener("change", (event) => {
  applyDocumentFontSize(event.target.value);
});
docFontSize.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docFormatPainterButton.addEventListener("pointerdown", (event) => {
  event.preventDefault();
  preserveDocumentSelectionForToolbar();
});
docFormatPainterButton.addEventListener("click", handleDocumentFormatPainter);
docLinkButton.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docLinkButton.addEventListener("click", addDocumentHyperlink);
docNodeLinkButton.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docNodeLinkButton.addEventListener("click", openDocumentNodeLinkPicker);
docApplyTextColor.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docApplyTextColor.addEventListener("click", () => runDocumentValueCommand("foreColor", docTextColor.value));
docPickTextColor.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docPickTextColor.addEventListener("click", (event) => {
  event.stopPropagation();
  showDocumentColorMenu(docTextColorMenu, docPickTextColor);
});
docTextColor.addEventListener("input", () => setDocumentTextColor(docTextColor.value, true));
docTextColor.addEventListener("change", () => setDocumentTextColor(docTextColor.value, true));
docApplyHighlightColor.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docApplyHighlightColor.addEventListener("click", toggleDocumentHighlightColor);
docPickHighlightColor.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docPickHighlightColor.addEventListener("click", (event) => {
  event.stopPropagation();
  showDocumentColorMenu(docHighlightColorMenu, docPickHighlightColor);
});
docHighlightColor.addEventListener("input", () => setDocumentHighlightColor(docHighlightColor.value, true));
docHighlightColor.addEventListener("change", () => setDocumentHighlightColor(docHighlightColor.value, true));
docApplyAlignment.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docApplyAlignment.addEventListener("click", () => runDocumentCommand(currentDocumentAlignmentCommand));
docAlignmentMenuButton.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docAlignmentMenuButton.addEventListener("click", (event) => {
  event.stopPropagation();
  if (docAlignmentMenu.hidden) {
    showDocumentAlignmentMenu();
  } else {
    docAlignmentMenu.hidden = true;
  }
});
docAlignmentMenu.querySelectorAll("[data-align-command]").forEach((button) => {
  button.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
  button.addEventListener("click", () => {
    setDocumentAlignmentCommand(button.dataset.alignCommand);
    runDocumentCommand(currentDocumentAlignmentCommand);
    docAlignmentMenu.hidden = true;
  });
});
closeDocumentNodeLinkPicker.addEventListener("click", hideDocumentNodeLinkPicker);
documentNodeLinkSearch.addEventListener("input", renderDocumentNodeLinkPicker);
documentNodeLinkTypeFilters.addEventListener("change", renderDocumentNodeLinkPicker);
docTableButton.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
docTableButton.addEventListener("click", openDocumentTablePicker);
closeDocumentTablePicker.addEventListener("click", hideDocumentTablePicker);
insertDocumentTableButton.addEventListener("click", insertDocumentTableFromPicker);
documentTableTools.querySelectorAll("[data-table-action]").forEach((button) => {
  button.addEventListener("pointerdown", (event) => event.preventDefault());
  button.addEventListener("click", () => runDocumentTableAction(button.dataset.tableAction));
});
docImageInput.addEventListener("change", insertSelectedDocumentImage);
docImageWidth.addEventListener("input", updateSelectedDocumentImageWidth);
docImageWidth.addEventListener("change", commitDocumentEdit);
docImageWidthNumber.addEventListener("input", updateSelectedDocumentImageWidth);
docImageWidthNumber.addEventListener("change", updateSelectedDocumentImageWidth);
docImageWidthNumber.addEventListener("blur", commitDocumentEdit);
document.getElementById("docParagraphStyle").addEventListener("change", (event) => {
  runDocumentBlockCommand(event.target.value);
});
initializeJoditEditor();
initializeProjects();
safeStartupStep("render document outline", renderDocumentOutline);
safeStartupStep("render node type controls", renderNodeTypeControls);
safeStartupStep("apply node type colors", applyNodeTypeColors);
safeStartupStep("sync cluster style controls", syncClusterStyleControls);
safeStartupStep("set map zoom base", setMapZoomBaseFromCurrentView);
safeStartupStep("update map zoom control", updateMapZoomControl);
safeStartupStep("restore cluster view", restoreClusterViewState);
safeStartupStep("render document color menus", renderDocumentColorMenus);
safeStartupStep("update document color swatches", updateDocumentColorSwatches);
safeStartupStep("set document alignment command", () => setDocumentAlignmentCommand(currentDocumentAlignmentCommand));
safeStartupStep("sync global connection style controls", syncGlobalConnectionStyleControls);
safeStartupStep("apply global connection style", applyGlobalConnectionStyle);

function initializeJoditEditor() {
  if (joditEditor || !window.Jodit || !documentEditor) return;
  joditEditor = window.Jodit.make(documentEditor, {
    readonly: true,
    minHeight: 460,
    toolbarAdaptive: false,
    toolbarSticky: false,
    askBeforePasteHTML: false,
    askBeforePasteFromWord: false,
    defaultActionOnPaste: "insert_clear_html",
    buttons: [
      "source", "|",
      "bold", "italic", "underline", "strikethrough", "|",
      "ul", "ol", "|",
      "font", "fontsize", "brush", "paragraph", "|",
      "left", "center", "right", "justify", "|",
      "link", "table", "|",
      {
        name: "uluImage",
        tooltip: "Insert project image",
        text: "Image",
        exec: () => openDocumentImagePicker()
      },
      "|", "undo", "redo", "eraser"
    ],
    events: {
      change: () => {
        if (isLoadingDocumentEditor) return;
        handleDocumentEditorInput();
      },
      blur: () => {
        if (isLoadingDocumentEditor) return;
        updateDocumentBody();
        commitDocumentEdit();
      },
      focus: () => beginDocumentEdit()
    }
  });
}

function setDocumentEditorEnabled(enabled) {
  if (joditEditor) {
    joditEditor.setReadOnly(!enabled);
  }
  documentEditor.contentEditable = enabled ? "true" : "false";
}

function setDocumentEditorHtml(html) {
  isLoadingDocumentEditor = true;
  try {
    if (joditEditor) {
      joditEditor.value = html || "";
    } else {
      documentEditor.innerHTML = html || "";
    }
  } finally {
    window.setTimeout(() => {
      isLoadingDocumentEditor = false;
    }, 0);
  }
}

function setDocumentEditorText(text) {
  setDocumentEditorHtml(escapeHtml(text || ""));
}

function getDocumentEditorHtml() {
  return joditEditor ? joditEditor.value : documentEditor.innerHTML;
}

function getDocumentEditorText() {
  if (joditEditor?.editor) return joditEditor.editor.innerText || "";
  return documentEditor.innerText || "";
}

function getDocumentEditorRoot() {
  return joditEditor?.editor || documentEditor;
}

function isInsideDocumentEditor(node) {
  const root = getDocumentEditorRoot();
  return Boolean(node && (root === node || root.contains(node)));
}

function safeStartupStep(label, fn) {
  try {
    return fn();
  } catch (error) {
    console.error(`Startup step failed: ${label}`, error);
    setStatus(`Startup warning: ${label} failed. Check browser console.`);
    return null;
  }
}

function loadInitialElements() {
  const saved = localStorage.getItem(projectStorageKey(activeProject));
  if (!saved) return normalizeElements(cloneElements(demoElements));

  try {
    const parsed = JSON.parse(saved);
    if (parsed && !Array.isArray(parsed) && Array.isArray(parsed.nodeTypes)) {
      nodeTypes = normalizeNodeTypes(parsed.nodeTypes);
      writeNodeTypes();
    }
    return normalizeElements(getElementsFromGraphPayload(parsed));
  } catch (error) {
    console.warn("Could not load saved graph. Falling back to demo.", error);
    return normalizeElements(cloneElements(demoElements));
  }
}

function getElementsFromGraphPayload(payload) {
  return Array.isArray(payload) ? payload : payload?.elements;
}

async function initializeProjects() {
  renderProjectSelect([activeProject, DEFAULT_PROJECT_NAME, "Demo"]);
  setStatus("Loading projects...");
  try {
    let projects = await fetchProjects();
    if (!projects.includes(DEFAULT_PROJECT_NAME)) {
      await postJson("/api/projects", { name: DEFAULT_PROJECT_NAME });
      projects = await fetchProjects();
    }
    if (!projects.includes("Demo")) {
      await postJson("/api/projects", { name: "Demo" });
      projects = await fetchProjects();
    }
    if (!projects.includes(activeProject)) activeProject = projects.includes(DEFAULT_PROJECT_NAME) ? DEFAULT_PROJECT_NAME : projects[0] || DEFAULT_PROJECT_NAME;
    setActiveProject(activeProject);
    renderProjectSelect(projects);
    await loadLatestServerAutosave();
    startPresenceHeartbeat();
  } catch (error) {
    console.error("Could not initialize projects.", error);
    renderProjectSelect([activeProject, DEFAULT_PROJECT_NAME, "Demo"]);
    setStatus(error?.message ? `Project list unavailable: ${error.message}` : "Project list unavailable. Using local browser data.");
    startPresenceHeartbeat();
  }
}

async function fetchProjects() {
  const result = await fetchJson("/api/projects", { timeoutMs: 5000 });
  return Array.isArray(result.projects) ? result.projects : [];
}

function renderProjectSelect(projects) {
  const uniqueProjects = Array.from(new Set(projects.filter(Boolean))).sort((a, b) => a.localeCompare(b));
  projectSelect.innerHTML = "";
  uniqueProjects.forEach((project) => {
    const option = document.createElement("option");
    option.value = project;
    option.textContent = project;
    projectSelect.appendChild(option);
  });
  projectSelect.value = uniqueProjects.includes(activeProject) ? activeProject : uniqueProjects[0] || "";
}

function getPresenceClientId() {
  let clientId = sessionStorage.getItem(PRESENCE_CLIENT_KEY);
  if (!clientId) {
    clientId = `client-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(PRESENCE_CLIENT_KEY, clientId);
  }
  return clientId;
}

function startPresenceHeartbeat() {
  window.clearInterval(presenceTimer);
  sendPresenceHeartbeat();
  presenceTimer = window.setInterval(sendPresenceHeartbeat, PRESENCE_INTERVAL_MS);
}

function sendPresenceLeave() {
  if (presenceLeaveSent) return;
  presenceLeaveSent = true;
  window.clearInterval(presenceTimer);
  const payload = JSON.stringify({
    clientId: presenceClientId,
    project: activeProject,
    label: "Viewer"
  });
  if (navigator.sendBeacon) {
    const body = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/presence/leave", body)) return;
  }
  fetch("/api/presence/leave", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true
  }).catch((error) => {
    console.warn("Presence leave failed.", error);
  });
}

async function sendPresenceHeartbeat() {
  try {
    const data = await postJson("/api/presence/heartbeat", {
      clientId: presenceClientId,
      project: activeProject,
      label: "Viewer"
    });
    updatePresenceIndicator(data.online || []);
  } catch (error) {
    console.warn("Presence heartbeat failed.", error);
    updatePresenceIndicator([], true);
  }
}

async function refreshPresence() {
  if (presenceIndicator) presenceIndicator.disabled = true;
  setStatus("Checking online viewers...");
  try {
    const data = await fetchJson(`/api/presence?project=${encodeURIComponent(activeProject)}&_=${Date.now()}`, { timeoutMs: 5000 });
    const online = data.online || [];
    updatePresenceIndicator(online);
    setStatus(`Presence refreshed: ${Math.max(1, online.length || 1)} browser session(s) online.`);
  } catch (error) {
    console.warn("Presence refresh failed.", error);
    updatePresenceIndicator([], true);
    setStatus(`Presence refresh failed: ${error.message}`);
  } finally {
    if (presenceIndicator) presenceIndicator.disabled = false;
  }
}

function updatePresenceIndicator(online = [], offline = false) {
  if (!presenceIndicator || !presenceText) return;
  presenceIndicator.classList.toggle("offline", offline);
  if (offline) {
    presenceText.textContent = "Online: ?";
    presenceIndicator.title = "Could not reach presence service.";
    return;
  }
  const count = Math.max(1, online.length || 1);
  presenceText.textContent = `Online: ${count}`;
  presenceIndicator.title = `${count} browser session${count === 1 ? "" : "s"} online in ${activeProject}.`;
}

function setActiveProject(project) {
  activeProject = project || DEFAULT_PROJECT_NAME;
  localStorage.setItem(ACTIVE_PROJECT_KEY, activeProject);
  if (projectSelect) projectSelect.value = activeProject;
}

function flushActiveDocumentEdits() {
  if (!activeDocumentTarget || !documentEditor || documentEditor.hidden) return;
  updateDocumentBody();
}

async function switchProject(project) {
  if (!project || project === activeProject) return;
  const previousProject = activeProject;
  window.clearTimeout(autosaveTimer);
  try {
    flushActiveDocumentEdits();
    window.clearTimeout(autosaveTimer);
    await writeGraphToAutosaveFolder(previousProject, { throwOnError: true });
    writeGraphToLocalStorage(previousProject);
  } catch (error) {
    console.warn("Could not save current project before switching.", error);
    setStatus(`Could not save ${previousProject} before switching projects.`);
    renderProjectSelect([previousProject, project, DEFAULT_PROJECT_NAME, "Demo"]);
    projectSelect.value = previousProject;
    return;
  }

  try {
    setActiveProject(project);
    setStatus(`Switching to ${activeProject}...`);
    window.location.reload();
  } catch (error) {
    console.warn("Could not switch project.", error);
    setActiveProject(previousProject);
    renderProjectSelect([previousProject, project, DEFAULT_PROJECT_NAME, "Demo"]);
    setStatus(`Could not load ${project}. Stayed on ${previousProject}.`);
  }
}

async function createNewProject() {
  const name = window.prompt("New project name", "");
  if (!name) return;
  try {
    const result = await postJson("/api/projects", { name });
    const projects = await fetchProjects();
    setActiveProject(result.project);
    renderProjectSelect(projects);
    pushUndoState("create project");
    restoreGraphPayload({ nodeTypes, elements: cloneElements(demoElements) });
    clearDocumentEditor();
    scheduleAutosave(`Autosaved new project ${activeProject}.`);
    setStatus(`Created project ${activeProject}.`);
  } catch (error) {
    console.error("Could not create project.", error);
    setStatus(error?.message || "Could not create project.");
  }
}

async function loadLatestServerAutosave(options = {}) {
  try {
    const latest = await fetchJson(`/api/projects/${encodeURIComponent(activeProject)}/latest`);
    const localLatest = readGraphFromLocalStorage(activeProject);
    if (!latest.found || !Array.isArray(latest.elements)) {
      const fallbackPayload = localLatest || { savedAt: new Date().toISOString(), project: activeProject, nodeTypes, elements: cloneElements(demoElements) };
      restoreGraphPayload(fallbackPayload);
      writeGraphToLocalStorage(activeProject, fallbackPayload);
      await runDocumentImageMaintenance();
      setStatus(`Project ${activeProject} has no autosave yet. Loaded starter demo.`);
      return;
    }

    const payloadToLoad = chooseNewestGraphPayload(latest, localLatest);
    restoreGraphPayload(payloadToLoad);
    writeGraphToLocalStorage(activeProject, payloadToLoad);
    await runDocumentImageMaintenance();
    if (payloadToLoad === localLatest && isLocalNewerThanServer(localLatest, latest)) {
      await writeGraphToAutosaveFolder(activeProject, { throwOnError: true, payload: localLatest });
      setStatus(`Loaded newer ${activeProject} browser save and synced it to folder autosave.`);
      return;
    }
    setStatus(payloadToLoad.savedAt ? `Loaded ${activeProject} autosave from ${new Date(payloadToLoad.savedAt).toLocaleTimeString()}.` : `Loaded ${activeProject} autosave.`);
  } catch (error) {
    console.warn("Could not load latest server autosave.", error);
    if (options.throwOnError) throw error;
  }
}

function restoreGraphPayload(payload) {
  if (payload && !Array.isArray(payload) && Array.isArray(payload.nodeTypes)) {
    nodeTypes = normalizeNodeTypes(payload.nodeTypes);
    writeNodeTypes();
    renderNodeTypeControls();
  }
  restoreGraphState(getElementsFromGraphPayload(payload));
  renderNodeTypeControls();
  applyNodeTypeColors();
  renderMapLegend();
  renderDocumentOutline();
  restoreClusterViewState();
}

function readNodeTypes() {
  try {
    return normalizeNodeTypes(JSON.parse(localStorage.getItem(NODE_TYPES_KEY) || "null"));
  } catch (error) {
    return normalizeNodeTypes(DEFAULT_NODE_TYPES);
  }
}

function writeNodeTypes() {
  localStorage.setItem(NODE_TYPES_KEY, JSON.stringify(nodeTypes));
}

function normalizeNodeTypes(types) {
  const source = Array.isArray(types) && types.length ? types : DEFAULT_NODE_TYPES;
  const normalized = [];
  source.forEach((type) => {
    const name = String(type?.name || type || "").trim();
    if (!name || normalized.some((item) => item.name.toLowerCase() === name.toLowerCase())) return;
    normalized.push({
      name,
      color: isValidHexColor(type?.color) ? type.color : getDefaultNodeTypeColor(name)
    });
  });
  DEFAULT_NODE_TYPES.forEach((type) => {
    if (!normalized.some((item) => item.name === type.name)) normalized.push({ ...type });
  });
  return normalized;
}

function getDefaultNodeTypeName() {
  const ideaType = nodeTypes.find((type) => type.name === "Idea");
  return ideaType?.name || nodeTypes[0]?.name || "Idea";
}

function getDefaultNodeTypeColor(name) {
  return DEFAULT_NODE_TYPES.find((type) => type.name === name)?.color || "#8b5cf6";
}

function getNodeTypeConfig(name) {
  return nodeTypes.find((type) => type.name === name) || { name: getDefaultNodeTypeName(), color: getDefaultNodeTypeColor(name) };
}

function getNodeTypeNames() {
  return nodeTypes.map((type) => type.name);
}

function getNodeColorForType(type) {
  return getNodeTypeConfig(type).color;
}

function renderNodeTypeControls() {
  renderNodeTypeDropdown();
  renderOutlineViewSelect();
  renderMapLegend();
  renderNodeTypeSettings();
  renderContextTypeButtons();
}

function renderNodeTypeDropdown() {
  const current = fields.type.value || getDefaultNodeTypeName();
  fields.type.innerHTML = "";
  getSortedNodeTypes().forEach((type) => {
    const option = document.createElement("option");
    option.value = type.name;
    option.textContent = type.name;
    fields.type.appendChild(option);
  });
  fields.type.value = getNodeTypeNames().includes(current) ? current : getDefaultNodeTypeName();
}

function renderOutlineViewSelect() {
  const current = activeOutlineView || getOutlineViewValueForType("Publication");
  outlineViewSelect.innerHTML = "";
  getNodeTypesUsedInMap().forEach((type) => {
    const option = document.createElement("option");
    option.value = getOutlineViewValueForType(type.name);
    option.textContent = type.name;
    outlineViewSelect.appendChild(option);
  });
  const connections = document.createElement("option");
  connections.value = "connections";
  connections.textContent = "Connections";
  outlineViewSelect.appendChild(connections);
  outlineViewSelect.value = getValidOutlineView(current);
}

function getOutlineViewValueForType(type) {
  return `type:${type}`;
}

function getTypeFromOutlineView(value) {
  return String(value || "").startsWith("type:") ? String(value).slice(5) : "";
}

function getValidOutlineView(value) {
  if (value === "connections") return value;
  const type = getTypeFromOutlineView(value);
  const usedTypes = getNodeTypesUsedInMap().map((item) => item.name);
  if (type && usedTypes.includes(type)) return value;
  if (value === "ideas" && usedTypes.includes("Idea")) return getOutlineViewValueForType("Idea");
  if (value === "publications" && usedTypes.includes("Publication")) return getOutlineViewValueForType("Publication");
  return usedTypes.length ? getOutlineViewValueForType(usedTypes[0]) : "connections";
}

function renderMapLegend() {
  mapLegend.innerHTML = "";
  getNodeTypesUsedInMap().forEach((type) => {
    const item = document.createElement("div");
    item.className = "map-legend-item";
    const swatch = document.createElement("span");
    swatch.className = "map-legend-swatch";
    swatch.style.background = type.color;
    swatch.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = type.name;
    item.append(swatch, label);
    mapLegend.appendChild(item);
  });
}

function getNodeTypesUsedInMap() {
  if (!cy) return [];
  const usedTypes = new Set(getRealNodes().map((node) => node.data("type")).filter(Boolean));
  return getSortedNodeTypes().filter((type) => usedTypes.has(type.name));
}

function renderNodeTypeSettings() {
  nodeTypeSettingsList.innerHTML = "";
  getSortedNodeTypes().forEach((type) => {
    const index = nodeTypes.findIndex((item) => item.name === type.name);
    const row = document.createElement("label");
    row.className = "node-type-settings-row";
    const name = document.createElement("input");
    name.type = "text";
    name.value = type.name;
    name.disabled = true;
    const color = document.createElement("input");
    color.type = "color";
    color.value = type.color;
    color.addEventListener("input", () => updateNodeTypeColor(index, color.value));
    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.className = "node-type-delete-button";
    deleteButton.disabled = isProtectedNodeType(type.name);
    deleteButton.title = deleteButton.disabled ? "Publication and Idea cannot be deleted." : `Delete ${type.name}`;
    deleteButton.addEventListener("click", (event) => {
      event.preventDefault();
      deleteNodeType(type.name);
    });
    row.append(name, color, deleteButton);
    nodeTypeSettingsList.appendChild(row);
  });
}

function getSortedNodeTypes() {
  const protectedOrder = ["Publication", "Idea", "Unassigned"];
  return [...nodeTypes].sort((a, b) => {
    const aIndex = protectedOrder.indexOf(a.name);
    const bIndex = protectedOrder.indexOf(b.name);
    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }
    return a.name.localeCompare(b.name);
  });
}

function isProtectedNodeType(typeName) {
  return typeName === "Publication" || typeName === "Idea" || typeName === "Unassigned";
}

function deleteNodeType(typeName) {
  if (isProtectedNodeType(typeName)) return;
  const nodesUsingType = cy.nodes().filter((node) => node.data("type") === typeName);
  if (nodesUsingType.length) {
    const confirmed = window.confirm(`Delete node type "${typeName}"? ${nodesUsingType.length} existing node(s) will be changed to Unassigned.`);
    if (!confirmed) return;
    pushUndoState("delete node type");
    nodesUsingType.forEach((node) => {
      node.data("type", "Unassigned");
      node.data("nodeColor", getNodeColorForType("Unassigned"));
    });
  }
  nodeTypes = nodeTypes.filter((type) => type.name !== typeName);
  writeNodeTypes();
  renderNodeTypeControls();
  applyNodeTypeColors();
  renderDocumentOutline();
  renderMapLegend();
  setStatus(`Deleted node type ${typeName}.`);
  scheduleAutosave("Autosaved node type deletion.");
}

function renderContextTypeButtons() {
  contextTypeButtons.innerHTML = "";
  nodeTypes.forEach((type) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.menuType = type.name;
    button.textContent = type.name;
    button.style.borderLeftColor = type.color;
    contextTypeButtons.appendChild(button);
  });
}

function openNodeTypeSettings() {
  renderNodeTypeSettings();
  nodeTypeSettingsPanel.hidden = false;
}

function closeNodeTypeSettings() {
  nodeTypeSettingsPanel.hidden = true;
}

function updateNodeTypeColor(index, color) {
  if (!nodeTypes[index] || !isValidHexColor(color)) return;
  nodeTypes[index].color = color;
  writeNodeTypes();
  applyNodeTypeColors();
  renderMapLegend();
  updateDocumentLinks();
  scheduleAutosave("Autosaved node type color change.");
}

function addNodeTypeFromSettings() {
  const name = newNodeTypeName.value.trim();
  if (!name) {
    setStatus("Enter a node type name.");
    return;
  }
  if (nodeTypes.some((type) => type.name.toLowerCase() === name.toLowerCase())) {
    setStatus("That node type already exists.");
    return;
  }
  const color = isValidHexColor(newNodeTypeColor.value) ? newNodeTypeColor.value : "#8b5cf6";
  nodeTypes.push({ name, color });
  newNodeTypeName.value = "";
  writeNodeTypes();
  renderNodeTypeControls();
  setStatus(`Added node type ${name}.`);
  scheduleAutosave("Autosaved node type settings.");
}

function applyNodeTypeColors() {
  if (!cy) return;
  getRealNodes().forEach((node) => {
    node.data("nodeColor", getNodeColorForType(node.data("type")));
  });
  updateDocumentLinks();
}

function addNode(type) {
  pushUndoState("add node");
  const id = makeStableId(type);
  const extent = cy.extent();
  const position = {
    x: (extent.x1 + extent.x2) / 2,
    y: (extent.y1 + extent.y2) / 2
  };

  const node = cy.add({
    group: "nodes",
    data: {
      id,
      label: `New ${type}`,
      type,
      nodeColor: getNodeColorForType(type),
      url: "",
      tags: [],
      size: DEFAULT_NODE_SIZE,
      textWidth: getTextWidth(DEFAULT_NODE_SIZE),
      zIndex: getNextNodeZIndex(),
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontStyle: "bold",
      fontStyleValue: "normal",
      fontWeight: 700,
      publicationNotes: normalizePublicationNotes()
    },
    position
  });

  cy.$(":selected").unselect();
  node.select();
  selectNode(node);
  setActiveDocumentNode(node);
  renderDocumentOutline();
  renderMapLegend();
  setStatus(`Added ${type}.`);
  scheduleAutosave("Autosaved after adding node.");
}

function addPublicationFromZotero(item, index = 0) {
  const id = makeStableId("Publication");
  const extent = cy.extent();
  const position = {
    x: (extent.x1 + extent.x2) / 2 + (index % 5) * 120,
    y: (extent.y1 + extent.y2) / 2 + Math.floor(index / 5) * 120
  };
  const citation = item.citation || "";
  const url = item.url || "";
  const abstract = item.abstract || "";

  return cy.add({
    group: "nodes",
    data: {
      id,
      label: item.title || "Untitled Zotero Item",
      type: "Publication",
      nodeColor: getNodeColorForType("Publication"),
      url,
      tags: item.tags || [],
      size: DEFAULT_NODE_SIZE,
      textWidth: getTextWidth(DEFAULT_NODE_SIZE),
      zIndex: getNextNodeZIndex(),
      fontSize: DEFAULT_FONT_SIZE,
      fontFamily: DEFAULT_FONT_FAMILY,
      fontStyle: "bold",
      fontStyleValue: "normal",
      fontWeight: 700,
      zotero: {
        itemKey: item.zoteroKey,
        libraryType: item.libraryType || "user",
        libraryId: item.libraryId || 0,
        libraryName: item.libraryName || "My Library",
        itemType: item.itemType,
        doi: item.doi,
        authors: item.authors || [],
        year: item.year || ""
      },
      publicationNotes: normalizePublicationNotes({ notes: "", citation, url, abstract }),
      documentHtml: ""
    },
    position
  });
}

function startConnectionMode() {
  connectionMode = true;
  connectionSource = null;
  cy.elements().removeClass("connection-source");
  setStatus("Connection mode: select a source node.");
  panelMessage.textContent = "Connection mode is active. Select a source node, then a target node.";
}

function startConnectionFromNode(node) {
  connectionMode = true;
  connectionSource = node;
  cy.elements().removeClass("connection-source");
  node.addClass("connection-source");
  setStatus("Connection mode: select a target node.");
  panelMessage.textContent = "Connection mode is active. Select or right-click the target node.";
}

function handleConnectionTap(node) {
  if (!connectionSource) {
    connectionSource = node;
    node.addClass("connection-source");
    setStatus("Connection mode: select a target node.");
    return;
  }

  if (connectionSource.id() === node.id()) {
    setStatus("Choose a different target node.");
    return;
  }

  const edgeId = `edge-${connectionSource.id()}-${node.id()}`;
  if (cy.getElementById(edgeId).length) {
    setStatus("That connection already exists.");
    endConnectionMode();
    return;
  }

  pushUndoState("add connection");
  cy.add({
    group: "edges",
    data: {
      id: edgeId,
      source: connectionSource.id(),
      target: node.id(),
      notes: "",
      tags: [],
      zIndex: Math.max(getElementZIndex(connectionSource), getElementZIndex(node)) - 1
    }
  });

  setStatus("Connection added.");
  endConnectionMode();
  scheduleAutosave("Autosaved after adding connection.");
}

function endConnectionMode() {
  connectionMode = false;
  connectionSource = null;
  cy.elements().removeClass("connection-source");
  panelMessage.textContent = selectedNode ? "Editing selected node." : "Select a node to edit its research metadata.";
}

function deleteSelected() {
  let selected = cy.$(":selected");
  if (!selected.length) {
    if (selectedNode && selectedNode.length && !selectedNode.removed()) {
      selected = cy.collection([selectedNode]);
    } else if (selectedEdge && selectedEdge.length && !selectedEdge.removed()) {
      selected = cy.collection([selectedEdge]);
    }
  }

  if (!selected.length) {
    setStatus("Nothing selected.");
    return;
  }

  const selectedNodes = selected.nodes();
  if (selectedNodes.length && !confirmNodeDelete(selectedNodes)) {
    setStatus("Delete canceled.");
    return;
  }

  pushUndoState("delete selection");
  selected.remove();
  selectedNode = null;
  selectedEdge = null;
  activeDocumentNodeId = null;
  activeDocumentTarget = null;
  endConnectionMode();
  hideResizeOverlay();
  clearForm();
  setFormEnabled(false);
  hideEdgeNotesPanel();
  selectedKind.textContent = "No selection";
  setStatus("Deleted selected item.");
  renderDocumentOutline();
  renderMapLegend();
  scheduleAutosave("Autosaved after deletion.");
}

function deleteNode(node) {
  if (!node || node.removed()) return;
  if (!confirmNodeDelete(cy.collection([node]))) {
    setStatus("Delete canceled.");
    return;
  }

  pushUndoState("delete node");
  node.remove();
  selectedNode = null;
  selectedEdge = null;
  clearNeighborhoodFocus();
  endConnectionMode();
  hideResizeOverlay();
  clearForm();
  setFormEnabled(false);
  hideEdgeNotesPanel();
  selectedKind.textContent = "No selection";
  setStatus("Deleted node.");
  renderDocumentOutline();
  renderMapLegend();
  scheduleAutosave("Autosaved after deleting node.");
}

function confirmNodeDelete(nodes) {
  const nodeCount = nodes.length || 0;
  if (!nodeCount) return true;

  if (nodeCount === 1) {
    const label = nodes[0].data("label") || "this node";
    return window.confirm(`Delete node "${label}"?\n\nThis will also remove its connections.`);
  }

  return window.confirm(`Delete ${nodeCount} selected nodes?\n\nThis will also remove their connections.`);
}

function updateNeighborhoodFocus(node) {
  clearNeighborhoodFocus();
  if (!node || !node.length || node.removed() || node.data("clusterBackground")) return;

  const connectedEdges = node.connectedEdges();
  const focusedNodes = node.closedNeighborhood("node").filter((item) => !item.data("clusterBackground"));
  const focusedEdges = connectedEdges;
  const focused = focusedNodes.union(focusedEdges);
  const faded = cy.elements().difference(focused).filter((item) => !item.data("clusterBackground"));

  focused.addClass("neighborhood-focus");
  faded.addClass("neighborhood-faded");
}

function updateConnectionFocus(edge) {
  clearNeighborhoodFocus();
  clearConnectionEndpointHighlights();
  if (!edge || !edge.length || edge.removed()) return;

  const focusedNodes = edge.connectedNodes().filter((node) => !node.data("clusterBackground"));
  const focused = focusedNodes.union(edge);
  const faded = cy.elements().difference(focused).filter((item) => !item.data("clusterBackground"));

  focused.addClass("neighborhood-focus");
  faded.addClass("neighborhood-faded");
}

function clearNeighborhoodFocus() {
  cy.elements(".neighborhood-focus, .neighborhood-faded").removeClass("neighborhood-focus neighborhood-faded");
}

function selectNode(node) {
  if (node && node.length && !node.selected()) {
    node.select();
  }
  selectedNode = node;
  selectedEdge = null;
  const selectedNodes = getSelectedNodes();
  const hasMultipleNodes = selectedNodes.length > 1;
  hideEdgeNotesPanel();
  document.getElementById("detailsForm").hidden = false;
  setFormEnabled(true);
  fields.title.value = node.data("label") || "";
  fields.type.value = node.data("type") || "Idea";
  fields.url.value = node.data("url") || "";
  const publicationNotes = normalizePublicationNotes(node.data("publicationNotes"));
  const isPublication = (node.data("type") || "Idea") === "Publication";
  nodeCitationLabel.hidden = !isPublication;
  fields.citation.disabled = !isPublication;
  fields.citation.value = isPublication ? publicationNotes.citation : "";
  fields.tags.value = Array.isArray(node.data("tags")) ? node.data("tags").join(", ") : "";
  fields.size.value = getNodeSize(node);
  fields.sizeNumber.value = getNodeSize(node);
  fields.fontSize.value = getNodeFontSize(node);
  fields.fontFamily.value = getNodeFontFamily(node);
  fields.fontStyle.value = getNodeFontStyle(node);
  syncMultiFormatFields(node);
  selectedKind.textContent = node.data("type") || "Node";
  panelMessage.textContent = hasMultipleNodes
    ? `Formatting ${selectedNodes.length} selected nodes. Details show the most recent node.`
    : "Editing selected node.";
  if (hasMultipleNodes) showDetailsPanel("formatting");
  else showDetailsPanel("details");
  openLinkButton.disabled = !fields.url.value.trim();
  copyNodeStyleButton.disabled = false;
  pasteNodeStyleButton.disabled = !copiedNodeStyle;
  setMultiFormatEnabled(true);
  updatePdfButtons();
  if (hasMultipleNodes) hideResizeOverlay();
  else updateResizeOverlay();
  if (hasMultipleNodes) clearNeighborhoodFocus();
  else updateNeighborhoodFocus(node);
}

function selectEdge(edge) {
  hideContextMenu();
  hideResizeOverlay();
  closePublicationNotesModal();
  cy.$(":selected").unselect();
  edge.select();
  selectedNode = null;
  selectedEdge = edge;
  setFormEnabled(false);
  setMultiFormatEnabled(false);
  clearForm();
  document.getElementById("detailsForm").hidden = true;
  panelSwitch.hidden = true;
  selectedKind.textContent = "Connection";
  panelMessage.textContent = "Editing selected connection notes. Press Delete or Backspace to remove this connection.";
  edgeNotesPanel.hidden = false;
  updateConnectionFocus(edge);
  edgeDetailTitle.textContent = getConnectionShortTitle(edge);
  edgeFromNode.value = getEdgeEndpointSummary(edge, "source");
  edgeToNode.value = getEdgeEndpointSummary(edge, "target");
  edgeNotesText.value = edge.data("notes") || "";
  edgeTagsText.value = Array.isArray(edge.data("tags")) ? edge.data("tags").join(", ") : "";
  syncGlobalConnectionStyleControls();
}

function hideEdgeNotesPanel() {
  edgeNotesPanel.hidden = true;
  panelSwitch.hidden = false;
  clearConnectionEndpointHighlights();
  edgeDetailTitle.textContent = "Connection";
  edgeFromNode.value = "";
  edgeToNode.value = "";
  edgeNotesText.value = "";
  edgeTagsText.value = "";
  document.getElementById("detailsForm").hidden = false;
}

function highlightConnectionEndpoints(edge) {
  clearConnectionEndpointHighlights();
  if (!edge || edge.removed()) return;
  edge.connectedNodes().addClass("connection-endpoint");
}

function clearConnectionEndpointHighlights() {
  cy.nodes(".connection-endpoint").removeClass("connection-endpoint");
}

function getEdgeEndpointSummary(edge, endpoint) {
  const node = endpoint === "source" ? edge.source() : edge.target();
  if (!node || !node.length) return "";
  const type = node.data("type") || "Node";
  const title = node.data("label") || node.id() || "Untitled";
  return `${type}\n${title}`;
}

function beginEdgeEdit() {
  if (activeEditSnapshot) return;
  activeEditSnapshot = JSON.stringify(getGraphData());
}

function commitEdgeEdit() {
  if (!activeEditSnapshot) return;
  if (JSON.stringify(getGraphData()) !== activeEditSnapshot) pushUndoSnapshot(activeEditSnapshot, "connection edit");
  activeEditSnapshot = null;
}

function updateSelectedEdgeNotes() {
  if (!selectedEdge || selectedEdge.removed()) return;
  selectedEdge.data("notes", edgeNotesText.value);
  selectedEdge.data("notesHtml", escapeHtml(edgeNotesText.value).replace(/\n/g, "<br>"));
  if (activeDocumentTarget?.type === "edge" && activeDocumentTarget.id === selectedEdge.id()) {
    setDocumentEditorHtml(selectedEdge.data("notesHtml"));
  }
  scheduleAutosave("Autosaved connection notes.");
}

function updateSelectedEdgeTags() {
  if (!selectedEdge || selectedEdge.removed()) return;
  selectedEdge.data("tags", parseTags(edgeTagsText.value));
  scheduleAutosave("Autosaved connection tags.");
}

function readGlobalConnectionStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(EDGE_STYLE_KEY) || "{}");
    return {
      color: isValidHexColor(saved.color) ? saved.color : DEFAULT_EDGE_COLOR,
      width: clamp(Number(saved.width) || DEFAULT_EDGE_WIDTH, 1, 12)
    };
  } catch (error) {
    return { color: DEFAULT_EDGE_COLOR, width: DEFAULT_EDGE_WIDTH };
  }
}

function writeGlobalConnectionStyle(style) {
  localStorage.setItem(EDGE_STYLE_KEY, JSON.stringify(style));
}

function syncGlobalConnectionStyleControls() {
  const style = readGlobalConnectionStyle();
  edgeColorInput.value = style.color;
  edgeWidthInput.value = style.width;
  edgeWidthNumber.value = style.width;
  settingsEdgeColorInput.value = style.color;
  settingsEdgeWidthInput.value = style.width;
  settingsEdgeWidthNumber.value = style.width;
}

function updateGlobalConnectionStyle(event) {
  const target = event?.target;
  const widthSource = target === edgeWidthNumber || target === settingsEdgeWidthNumber
    ? target
    : target === settingsEdgeWidthInput
      ? settingsEdgeWidthInput
      : edgeWidthInput;
  const colorSource = target === settingsEdgeColorInput ? settingsEdgeColorInput : edgeColorInput;
  const style = {
    color: isValidHexColor(colorSource.value) ? colorSource.value : DEFAULT_EDGE_COLOR,
    width: clamp(Number(widthSource.value) || DEFAULT_EDGE_WIDTH, 1, 12)
  };
  edgeWidthInput.value = style.width;
  edgeWidthNumber.value = style.width;
  edgeColorInput.value = style.color;
  settingsEdgeWidthInput.value = style.width;
  settingsEdgeWidthNumber.value = style.width;
  settingsEdgeColorInput.value = style.color;
  writeGlobalConnectionStyle(style);
  applyGlobalConnectionStyle(style);
  setStatus("Updated global connection style.");
}

function applyGlobalConnectionStyle(style = readGlobalConnectionStyle()) {
  cy.style()
    .selector("edge")
    .style({
      "width": style.width,
      "line-color": style.color,
      "target-arrow-color": style.color,
      "target-arrow-shape": "triangle",
      "curve-style": "bezier",
      "z-index": "data(zIndex)",
      "z-index-compare": "manual"
    })
    .update();
}

function isValidHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(String(value || ""));
}

function updateSelectedNode(options = {}) {
  if (!selectedNode) return;

  const { clampFontSizeField = true, clampSizeField = true } = options;
  const nextType = getNodeTypeNames().includes(fields.type.value) ? fields.type.value : getDefaultNodeTypeName();
  const nextLabel = fields.title.value.trim() || "Untitled";
  const nextTags = parseTags(fields.tags.value);
  const nextPrimaryTag = getValidPrimaryTag(selectedNode.data("primaryTag"), nextTags);
  const nextSize = getEditedNodeSize({ clampSizeField });
  const nextFontSize = clampFontSizeField ? clampFontSize(fields.fontSize.value) : Number.parseInt(fields.fontSize.value, 10);
  const nextFontFamily = getValidFontFamily(fields.fontFamily.value);
  const nextFontStyle = getValidFontStyle(fields.fontStyle.value);
  const nextFontParts = getFontStyleParts(nextFontStyle);
  fields.size.value = nextSize;
  fields.sizeNumber.value = nextSize;
  if (clampFontSizeField) fields.fontSize.value = nextFontSize;
  fields.fontFamily.value = nextFontFamily;
  fields.fontStyle.value = nextFontStyle;

  selectedNode.data({
    label: nextLabel,
    type: nextType,
    nodeColor: getNodeColorForType(nextType),
    url: fields.url.value.trim(),
    tags: nextTags,
    primaryTag: nextPrimaryTag,
    size: nextSize,
    textWidth: getTextWidth(nextSize),
    fontSize: nextFontSize,
    fontFamily: nextFontFamily,
    fontStyle: nextFontStyle,
    fontStyleValue: nextFontParts.fontStyleValue,
    fontWeight: nextFontParts.fontWeight
  });

  if (nextType === "Publication") {
    const notes = normalizePublicationNotes(selectedNode.data("publicationNotes"));
    notes.url = fields.url.value.trim();
    notes.citation = fields.citation.value;
    selectedNode.data("publicationNotes", notes);
    if (publicationNotesNode && publicationNotesNode.id() === selectedNode.id()) {
      publicationNoteFields.citation.value = notes.citation;
    }
  }
  nodeCitationLabel.hidden = nextType !== "Publication";
  fields.citation.disabled = nextType !== "Publication";
  if (nextType !== "Publication") fields.citation.value = "";
  updateDocumentPrimaryTagControl();

  selectedKind.textContent = nextType;
  openLinkButton.disabled = !fields.url.value.trim();
  syncMultiFormatFields(selectedNode);
  if (activeDocumentNodeId === selectedNode.id()) {
    documentSectionTitle.value = nextLabel;
    resizeDocumentTitle();
    documentUrl.value = fields.url.value.trim();
    if (nextType === "Publication") documentCitation.value = fields.citation.value;
  }
  renderMapLegend();
  renderDocumentOutline();
  updateResizeOverlay();
  scheduleAutosave("Autosaved after node edit.");
}

function updateSelectedNodeFormatting(options = {}) {
  const targets = getFormattingTargetNodes();
  if (!targets.length) return;

  const { clampFontSizeField = true, clampSizeField = true } = options;
  const nextSize = getEditedNodeSize({ clampSizeField });
  const nextFontSize = clampFontSizeField ? clampFontSize(fields.fontSize.value) : Number.parseInt(fields.fontSize.value, 10);
  const nextFontFamily = getValidFontFamily(fields.fontFamily.value);
  const nextFontStyle = getValidFontStyle(fields.fontStyle.value);
  const nextFontParts = getFontStyleParts(nextFontStyle);

  fields.size.value = nextSize;
  fields.sizeNumber.value = nextSize;
  if (clampFontSizeField) fields.fontSize.value = nextFontSize;
  fields.fontFamily.value = nextFontFamily;
  fields.fontStyle.value = nextFontStyle;

  targets.forEach((node) => {
    node.data({
      size: nextSize,
      textWidth: getTextWidth(nextSize),
      fontSize: nextFontSize,
      fontFamily: nextFontFamily,
      fontStyle: nextFontStyle,
      fontStyleValue: nextFontParts.fontStyleValue,
      fontWeight: nextFontParts.fontWeight
    });
  });

  syncMultiFormatFields(selectedNode || targets[0]);
  if (targets.length > 1) hideResizeOverlay();
  else updateResizeOverlay();
  scheduleAutosave(`Autosaved formatting for ${targets.length} node(s).`);
}

function updateDocumentPrimaryTagControl() {
  const node = getActiveDocumentNode();
  const type = node?.data("type");
  const showControl = Boolean(node) && (type === "Idea" || type === "Publication");
  documentPrimaryTagControl.hidden = !showControl;
  documentPrimaryTag.disabled = !showControl;
  if (!showControl) return;

  const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
  const currentPrimary = getValidPrimaryTag(node.data("primaryTag"), tags);
  documentPrimaryTag.innerHTML = "";

  const firstOption = document.createElement("option");
  firstOption.value = "";
  firstOption.textContent = tags.length ? `First tag (${tags[0]})` : "First tag";
  documentPrimaryTag.appendChild(firstOption);

  tags.forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    documentPrimaryTag.appendChild(option);
  });
  documentPrimaryTag.value = currentPrimary;
}

function updateActiveDocumentPrimaryTag() {
  const node = getActiveDocumentNode();
  if (!node) return;
  const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
  const primaryTag = getValidPrimaryTag(documentPrimaryTag.value, tags);
  node.data("primaryTag", primaryTag);
  updateDocumentPrimaryTagControl();
  renderDocumentOutline();
  setStatus(primaryTag ? `Document outline grouping set to ${primaryTag}.` : "Document outline grouping uses first tag.");
  scheduleAutosave("Autosaved document group tag.");
}

function getValidPrimaryTag(primaryTag, tags) {
  const normalizedPrimary = String(primaryTag || "").trim();
  return normalizedPrimary && tags.includes(normalizedPrimary) ? normalizedPrimary : "";
}

function getDocumentGroupTag(node) {
  const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
  const primary = getValidPrimaryTag(node.data("primaryTag"), tags);
  return primary || tags[0] || "Untagged";
}

function getSelectedNodes() {
  let nodes = cy.nodes(":selected").filter((node) => !node.removed() && !node.data("clusterBackground"));
  if ((!nodes || !nodes.length) && selectedNode && !selectedNode.removed() && !selectedNode.data("clusterBackground")) {
    nodes = cy.collection([selectedNode]);
  }
  return nodes;
}

function getFormattingTargetNodes() {
  const selectedNodes = getSelectedNodes();
  if (selectedNodes.length) return selectedNodes;
  return selectedNode && !selectedNode.removed() ? cy.collection([selectedNode]) : cy.collection();
}

function syncNodeSelectionFromGraph() {
  const selectedNodes = getSelectedNodes();
  if (!selectedNodes.length) {
    selectedNode = null;
    clearNeighborhoodFocus();
    setFormEnabled(false);
    clearForm();
    hideResizeOverlay();
    selectedKind.textContent = "No selection";
    panelMessage.textContent = "Select a node to edit its research metadata.";
    return;
  }

  selectNode(selectedNodes[selectedNodes.length - 1]);
}

function isFormattingField(field) {
  return field === fields.size
    || field === fields.sizeNumber
    || field === fields.fontSize
    || field === fields.fontFamily
    || field === fields.fontStyle;
}

function handleFieldInput(event) {
  if (event.target === fields.fontSize && !isValidLiveFontSize(fields.fontSize.value)) return;
  if (event.target === fields.sizeNumber && !isValidLiveNodeSize(fields.sizeNumber.value)) return;
  if (isFormattingField(event.target) && getSelectedNodes().length > 1) {
    updateSelectedNodeFormatting({ clampFontSizeField: false, clampSizeField: event.target !== fields.sizeNumber });
    return;
  }
  updateSelectedNode({ clampFontSizeField: false, clampSizeField: event.target !== fields.sizeNumber });
}

function handleFieldChange(event) {
  if (isFormattingField(event.target) && getSelectedNodes().length > 1) {
    updateSelectedNodeFormatting({ clampFontSizeField: true, clampSizeField: true });
    return;
  }
  updateSelectedNode({ clampFontSizeField: true, clampSizeField: true });
}

function handleFieldBlur(event) {
  if (isFormattingField(event.target) && getSelectedNodes().length > 1) {
    if (event.target === fields.fontSize) updateSelectedNodeFormatting({ clampFontSizeField: true });
    if (event.target === fields.sizeNumber) updateSelectedNodeFormatting({ clampSizeField: true });
    commitNodeEdit();
    return;
  }
  if (event.target === fields.fontSize) updateSelectedNode({ clampFontSizeField: true });
  if (event.target === fields.sizeNumber) updateSelectedNode({ clampSizeField: true });
  commitNodeEdit();
}

function handleMultiFormatInput(event) {
  if (!selectedNode && !getSelectedNodes().length) return;
  if (event.target === multiFormatFields.fontSize && !isValidLiveFontSize(multiFormatFields.fontSize.value)) return;
  if (event.target === multiFormatFields.sizeNumber && !isValidLiveNodeSize(multiFormatFields.sizeNumber.value)) return;
  updateSelectedNodeFromMultiFormat({
    clampFontSizeField: false,
    clampSizeField: event.target !== multiFormatFields.sizeNumber
  });
}

function handleMultiFormatChange() {
  updateSelectedNodeFromMultiFormat({ clampFontSizeField: true, clampSizeField: true });
}

function handleMultiFormatBlur(event) {
  if (event.target === multiFormatFields.fontSize || event.target === multiFormatFields.sizeNumber) {
    updateSelectedNodeFromMultiFormat({ clampFontSizeField: true, clampSizeField: true });
  }
  commitNodeEdit();
}

function updateSelectedNodeFromMultiFormat(options = {}) {
  if (!selectedNode && !getSelectedNodes().length) return;
  fields.size.value = multiFormatFields.size.value;
  fields.sizeNumber.value = multiFormatFields.sizeNumber.value;
  fields.fontSize.value = multiFormatFields.fontSize.value;
  fields.fontFamily.value = multiFormatFields.fontFamily.value;
  fields.fontStyle.value = multiFormatFields.fontStyle.value;
  updateSelectedNodeFormatting(options);
  syncMultiFormatFields(selectedNode || getSelectedNodes()[0]);
}

async function createSnapshot() {
  await writeGraphToAutosaveFolder();
  writeGraphToLocalStorage();
  try {
    const result = await postJson(`/api/projects/${encodeURIComponent(activeProject)}/snapshot`, getGraphPayload());
    setStatus(`Snapshot created: ${result.path || "autosaves folder"}.`);
    setAutosaveMessage(`Snapshot created. ${formatSaveTime(new Date())}`);
  } catch (error) {
    console.error("Snapshot failed.", error);
    setStatus(error?.message || "Snapshot failed.");
    setAutosaveMessage("Snapshot failed. Export JSON backup now.");
  }
}

function saveGraph() {
  createSnapshot();
}

function exportJson() {
  const blob = new Blob([JSON.stringify(getGraphPayload(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "research-map.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  setStatus("Exported research-map.json.");
}

function importJson(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      pushUndoState("import JSON");
      restoreGraphPayload(parsed);
      clearDocumentEditor();
      runDocumentImageMaintenance();
      setStatus("Imported JSON graph.");
      scheduleAutosave("Autosaved imported graph.");
    } catch (error) {
      console.error(error);
      setStatus("Import failed. Check that the file is valid JSON.");
    } finally {
      importFile.value = "";
    }
  };
  reader.readAsText(file);
}

function openZoteroPanel() {
  zoteroPanel.hidden = false;
  if (!zoteroCollectionSelect.dataset.loaded) checkZotero();
}

function closeZoteroPanel() {
  zoteroPanel.hidden = true;
}

async function checkZotero() {
  zoteroStatusText.textContent = "Checking Zotero Desktop...";
  updateZoteroModeBadge("");
  zoteroItemsCache = [];
  zoteroLibrariesCache = [];
  zoteroCollectionsCache = [];
  zoteroTopCollectionsCache = [];
  zoteroMode = "";
  zoteroItemsList.textContent = "";
  zoteroListActions.hidden = true;
  zoteroLibrarySelect.innerHTML = '<option value="user:0">My Library</option>';
  resetZoteroFolderSelects("Load Zotero first");
  zoteroCollectionSelect.dataset.loaded = "";
  try {
    const status = await fetchJson(`/api/zotero/status?_=${Date.now()}`);
    zoteroMode = status.mode || "";
    updateZoteroModeBadge(zoteroMode, status.ok);
    zoteroStatusText.textContent = zoteroStatusMessage(status.message);
    if (status.ok) {
      await loadZoteroLibraries();
      await loadZoteroCollections();
    }
  } catch (error) {
    updateZoteroModeBadge("error");
    zoteroStatusText.textContent = error.message;
  }
}

async function loadZoteroLibraries() {
  const previousSelection = zoteroLibrarySelect.value || "user:0";
  const data = await fetchJson(`/api/zotero/libraries?_=${Date.now()}`);
  zoteroLibrariesCache = data.libraries || [{ key: "user:0", name: "My Library", type: "user", id: 0 }];
  zoteroLibrarySelect.innerHTML = "";
  const seen = new Set();
  zoteroLibrariesCache.forEach((library) => {
    if (!library.key || seen.has(library.key)) return;
    seen.add(library.key);
    const option = document.createElement("option");
    option.value = library.key;
    option.textContent = library.name;
    zoteroLibrarySelect.appendChild(option);
  });
  zoteroLibrarySelect.value = seen.has(previousSelection) ? previousSelection : "user:0";
}

async function loadZoteroCollections() {
  const previousSelection = zoteroCollectionSelect.value;
  resetZoteroFolderSelects("Loading main folders...");
  zoteroStatusText.textContent = "Loading Zotero folders...";
  const params = new URLSearchParams();
  params.set("library", zoteroLibrarySelect.value || "user:0");
  params.set("_", Date.now().toString());
  try {
    const data = await fetchJson(`/api/zotero/collections?${params.toString()}`);
    zoteroCollectionsCache = data.collections || [];
    zoteroTopCollectionsCache = data.topCollections || zoteroCollectionsCache.filter((collection) => !collection.parentKey);
    zoteroCollectionSelect.innerHTML = '<option value="">All main folders</option>';
    const seen = new Set();
    zoteroTopCollectionsCache.forEach((collection) => {
      if (!collection.key || seen.has(collection.key)) return;
      seen.add(collection.key);
      const option = document.createElement("option");
      option.value = collection.key;
      option.textContent = collection.name;
      zoteroCollectionSelect.appendChild(option);
    });
    zoteroCollectionSelect.value = seen.has(previousSelection) ? previousSelection : "";
    zoteroCollectionSelect.disabled = false;
    zoteroCollectionSelect.dataset.loaded = "true";
    renderZoteroSubcollectionOptions();
    zoteroStatusText.textContent = `Loaded ${zoteroTopCollectionsCache.length} main Zotero folder(s).`;
  } catch (error) {
    zoteroStatusText.textContent = error.message;
    resetZoteroFolderSelects("Folder load failed");
  }
}

function resetZoteroFolderSelects(mainLabel = "All main folders") {
  zoteroCollectionSelect.innerHTML = `<option value="">${escapeHtml(mainLabel)}</option>`;
  zoteroCollectionSelect.disabled = true;
  zoteroSubcollectionSelect.innerHTML = '<option value="">All subfolders</option>';
  zoteroSubcollectionSelect.disabled = true;
}

function renderZoteroSubcollectionOptions() {
  const parentKey = zoteroCollectionSelect.value;
  const childCollections = zoteroDescendantCollections(parentKey);
  zoteroSubcollectionSelect.innerHTML = '<option value="">All subfolders</option>';
  zoteroSubcollectionSelect.disabled = !parentKey || !childCollections.length;

  childCollections.forEach((collection) => {
    const option = document.createElement("option");
    option.value = collection.key;
    option.textContent = `${"  ".repeat(collection.depth)}${collection.name}`;
    zoteroSubcollectionSelect.appendChild(option);
  });
}

function zoteroDescendantCollections(parentKey) {
  if (!parentKey) return [];
  const childrenByParent = new Map();
  zoteroCollectionsCache.forEach((collection) => {
    const key = collection.parentKey || "";
    if (!childrenByParent.has(key)) childrenByParent.set(key, []);
    childrenByParent.get(key).push(collection);
  });

  const descendants = [];
  const appendChildren = (key, depth) => {
    (childrenByParent.get(key) || []).forEach((collection) => {
      descendants.push({ ...collection, depth });
      appendChildren(collection.key, depth + 1);
    });
  };
  appendChildren(parentKey, 0);
  return descendants;
}

function zoteroStatusMessage(message) {
  if (zoteroMode === "sqlite" || zoteroMode === "cache") {
    return `${message} Recent Zotero edits may require Zotero sync/idle time or a working local API.`;
  }
  if (zoteroMode === "http") return `${message} Using live Zotero local API.`;
  return message;
}

function updateZoteroModeBadge(mode, ok = false) {
  zoteroModeBadge.classList.remove("live", "backup", "error", "unknown");
  if (mode === "http") {
    zoteroModeBadge.textContent = "Live";
    zoteroModeBadge.classList.add("live");
  } else if (mode === "sqlite" || mode === "cache") {
    zoteroModeBadge.textContent = "Backup";
    zoteroModeBadge.classList.add("backup");
  } else if (mode === "error" || ok === false && mode) {
    zoteroModeBadge.textContent = "Cannot reach";
    zoteroModeBadge.classList.add("error");
  } else {
    zoteroModeBadge.textContent = "Checking...";
    zoteroModeBadge.classList.add("unknown");
  }
}

async function loadZoteroItems() {
  zoteroStatusText.textContent = "Loading Zotero items...";
  const params = new URLSearchParams();
  params.set("library", zoteroLibrarySelect.value || "user:0");
  const selectedCollection = zoteroSubcollectionSelect.value || zoteroCollectionSelect.value;
  if (selectedCollection) params.set("collection", selectedCollection);
  if (zoteroCollectionSelect.value && !zoteroSubcollectionSelect.value) {
    params.set("includeSubcollections", "true");
  }
  const query = zoteroSearchInput.value.trim();
  if (query) params.set("q", query);
  params.set("limit", "500");
  params.set("_", Date.now().toString());

  try {
    const data = await fetchJson(`/api/zotero/items?${params.toString()}`);
    zoteroItemsCache = data.items || [];
    zoteroMode = data.mode || zoteroMode;
    updateZoteroModeBadge(zoteroMode, true);
    renderZoteroItems();
    const sourceNote = data.mode === "sqlite" ? " using database fallback" : data.mode === "cache" ? " using metadata backup" : "";
    zoteroStatusText.textContent = query
      ? `Found ${zoteroItemsCache.length} Zotero item(s) for "${query}"${sourceNote}.`
      : `Loaded ${zoteroItemsCache.length} Zotero items${sourceNote}.`;
  } catch (error) {
    zoteroStatusText.textContent = error.message;
  }
}

function renderZoteroItems() {
  zoteroItemsList.innerHTML = "";
  if (!zoteroItemsCache.length) {
    zoteroItemsList.textContent = "No Zotero items loaded.";
    zoteroListActions.hidden = true;
    return;
  }

  zoteroListActions.hidden = false;
  sortedZoteroItems().forEach(({ item, index }) => {
    const row = document.createElement("label");
    row.className = "zotero-item-row";
    row.innerHTML = `
      <input type="checkbox" value="${index}">
      <span>
        <strong>${escapeHtml(item.title || "Untitled")}</strong>
        <span>${escapeHtml([item.authors?.join(", "), item.year, item.itemType].filter(Boolean).join(" - "))}</span>
      </span>
    `;
    zoteroItemsList.appendChild(row);
  });
}

function sortedZoteroItems() {
  const items = zoteroItemsCache.map((item, index) => ({ item, index }));
  const sortMode = zoteroSortSelect.value || "recent";
  const titleForSort = (item) => (item.title || "Untitled").trim().toLocaleLowerCase();
  if (sortMode === "title-asc") {
    items.sort((left, right) => titleForSort(left.item).localeCompare(titleForSort(right.item)));
  } else if (sortMode === "title-desc") {
    items.sort((left, right) => titleForSort(right.item).localeCompare(titleForSort(left.item)));
  } else {
    items.sort((left, right) => {
      const rightVersion = Number(right.item.version || right.item.dateModified || 0);
      const leftVersion = Number(left.item.version || left.item.dateModified || 0);
      return rightVersion - leftVersion;
    });
  }
  return items;
}

function setPanelCheckboxes(container, checked) {
  container.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.checked = checked;
  });
}

function importSelectedZoteroItems() {
  const selectedIndexes = Array.from(zoteroItemsList.querySelectorAll("input:checked"))
    .map((input) => Number.parseInt(input.value, 10))
    .filter(Number.isFinite);

  if (!selectedIndexes.length) {
    zoteroStatusText.textContent = "Select at least one Zotero item to import.";
    return;
  }

  pushUndoState("import Zotero items");
  let lastNode = null;
  selectedIndexes.forEach((index, offset) => {
    lastNode = addPublicationFromZotero(zoteroItemsCache[index], offset);
  });

  if (lastNode) {
    cy.$(":selected").unselect();
    lastNode.select();
    selectedEdge = null;
    hideEdgeNotesPanel();
    selectNode(lastNode);
    setActiveDocumentNode(lastNode);
  }

  renderDocumentOutline();
  renderMapLegend();
  cy.fit(undefined, 70);
  scheduleAutosave("Autosaved Zotero imports.");
  zoteroStatusText.textContent = `Imported ${selectedIndexes.length} publication nodes.`;
}

function openOpenAlexPanel() {
  openAlexPanel.hidden = false;
  renderOpenAlexPublicationTagFilter();
  renderOpenAlexPublicationList();
  renderOpenAlexResults();
}

function closeOpenAlexPanel() {
  openAlexPanel.hidden = true;
}

function selectedOpenAlexSeedPublications() {
  const checkedIds = Array.from(openAlexPublicationList.querySelectorAll("input:checked")).map((input) => input.value);
  return checkedIds.map((id) => cy.getElementById(id)).filter((node) => node.length && node.data("type") === "Publication").map(openAlexPublicationFromNode);
}

function openAlexPublicationFromNode(node) {
    const zotero = node.data("zotero") || {};
    const notes = normalizePublicationNotes(node.data("publicationNotes"));
    return {
      id: node.id(),
      title: node.data("label") || "",
      doi: zotero.doi || "",
      year: zotero.year || "",
      authors: zotero.authors || [],
      zoteroKey: zotero.itemKey || "",
      citation: notes.citation || ""
    };
}

function getOpenAlexPublicationNodes() {
  const filter = openAlexPublicationFilterInput.value.trim().toLowerCase();
  const tagFilter = openAlexPublicationTagFilter.value.trim().toLowerCase();
  return cy.nodes().filter((node) => {
    if (node.data("type") !== "Publication") return false;
    const tags = publicationTagsForNode(node);
    if (tagFilter && !tags.some((tag) => tag.toLowerCase() === tagFilter)) return false;
    if (!filter) return true;
    const publication = openAlexPublicationFromNode(node);
    const text = [
      publication.title,
      publication.doi,
      publication.year,
      publication.authors.join(" "),
      publication.citation
    ].join(" ").toLowerCase();
    return text.includes(filter);
  }).sort((a, b) => (a.data("label") || "").localeCompare(b.data("label") || ""));
}

function publicationTagsForNode(node) {
  return Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
}

function renderOpenAlexPublicationTagFilter() {
  const previousValue = openAlexPublicationTagFilter.value;
  const tags = new Set();
  cy.nodes().forEach((node) => {
    if (node.data("type") !== "Publication") return;
    publicationTagsForNode(node).forEach((tag) => {
      if (tag) tags.add(tag);
    });
  });
  openAlexPublicationTagFilter.innerHTML = '<option value="">All tags</option>';
  Array.from(tags).sort((a, b) => a.localeCompare(b)).forEach((tag) => {
    const option = document.createElement("option");
    option.value = tag;
    option.textContent = tag;
    openAlexPublicationTagFilter.appendChild(option);
  });
  openAlexPublicationTagFilter.value = tags.has(previousValue) ? previousValue : "";
}

function renderOpenAlexPublicationList() {
  const checked = new Set(Array.from(openAlexPublicationList.querySelectorAll("input:checked")).map((input) => input.value));
  const selected = new Set(cy.$("node:selected").filter((node) => node.data("type") === "Publication").map((node) => node.id()));
  const publications = getOpenAlexPublicationNodes();
  openAlexPublicationList.innerHTML = "";

  if (!publications.length) {
    openAlexPublicationList.textContent = "No matching publication nodes.";
    return;
  }

  let checkedCount = 0;
  publications.forEach((node) => {
    const publication = openAlexPublicationFromNode(node);
    const row = document.createElement("label");
    row.className = "openalex-publication-row";
    row.innerHTML = `
      <input type="checkbox" value="${escapeHtml(publication.id)}">
      <span>
        <strong>${escapeHtml(publication.title || "Untitled publication")}</strong>
        <span>${escapeHtml([publication.authors.slice(0, 4).join(", "), publication.year, publication.doi].filter(Boolean).join(" - "))}</span>
      </span>
    `;
    const checkbox = row.querySelector("input");
    const shouldCheck = checked.has(publication.id) || (!checked.size && selected.has(publication.id));
    checkbox.checked = shouldCheck && checkedCount < MAX_OPENALEX_SEED_PUBLICATIONS;
    if (checkbox.checked) checkedCount += 1;
    openAlexPublicationList.appendChild(row);
  });
  updateOpenAlexPublicationCount();
}

function setOpenAlexPublicationCheckboxes(checked) {
  const checkboxes = Array.from(openAlexPublicationList.querySelectorAll('input[type="checkbox"]'));
  let selectedCount = 0;
  checkboxes.forEach((input) => {
    input.checked = checked && selectedCount < MAX_OPENALEX_SEED_PUBLICATIONS;
    if (input.checked) selectedCount += 1;
  });
}

function handleOpenAlexPublicationSelectionChange(event) {
  if (
    event.target?.matches?.('input[type="checkbox"]')
    && event.target.checked
    && openAlexPublicationList.querySelectorAll("input:checked").length > MAX_OPENALEX_SEED_PUBLICATIONS
  ) {
    event.target.checked = false;
    openAlexStatusText.textContent = `Select up to ${MAX_OPENALEX_SEED_PUBLICATIONS} seed publications.`;
  }
  updateOpenAlexPublicationCount();
}

function updateOpenAlexPublicationCount() {
  const total = openAlexPublicationList.querySelectorAll('input[type="checkbox"]').length;
  const selectedCount = openAlexPublicationList.querySelectorAll("input:checked").length;
  openAlexPublicationCount.textContent = `${selectedCount} selected of ${total} (max ${MAX_OPENALEX_SEED_PUBLICATIONS})`;
}

function selectedOpenAlexModes() {
  const modes = [];
  if (openAlexModeRelated.checked) modes.push("related");
  if (openAlexModeCites.checked) modes.push("cites");
  if (openAlexModeCitedBy.checked) modes.push("cited_by");
  return modes;
}

async function searchOpenAlexWorks() {
  const query = openAlexSearchInput.value.trim();
  if (!query) {
    openAlexStatusText.textContent = "Enter a search term or select publication nodes and find similar papers.";
    return;
  }
  openAlexStatusText.textContent = "Searching OpenAlex...";
  openAlexResultsList.textContent = "";
  openAlexResultsCount.textContent = "Searching...";

  try {
    const params = new URLSearchParams({ q: query, _: Date.now().toString() });
    const data = await fetchJson(`/api/openalex/search?${params.toString()}`);
    openAlexResultsCache = data.items || [];
    renderOpenAlexResults();
    openAlexStatusText.textContent = `Found ${openAlexResultsCache.length} OpenAlex result(s) for "${query}".`;
  } catch (error) {
    openAlexStatusText.textContent = error.message;
  }
}

async function findSimilarOpenAlexWorks() {
  const publications = selectedOpenAlexSeedPublications();
  if (!publications.length) {
    openAlexStatusText.textContent = "Select one or more publication nodes first.";
    return;
  }
  const modes = selectedOpenAlexModes();
  if (!modes.length) {
    openAlexStatusText.textContent = "Select at least one OpenAlex discovery mode.";
    return;
  }
  openAlexStatusText.textContent = `Finding papers for ${publications.length} selected publication(s)...`;
  openAlexResultsList.textContent = "";
  openAlexResultsCount.textContent = "Searching...";

  try {
    const data = await postJson("/api/openalex/similar", {
      publications,
      modes,
      strictIntersection: openAlexStrictIntersection.checked
    });
    openAlexResultsCache = data.items || [];
    renderOpenAlexResults();
    const resolvedCount = (data.resolved || []).length;
    openAlexStatusText.textContent = openAlexStrictIntersection.checked
      ? `Found ${openAlexResultsCache.length} shared paper(s) across ${resolvedCount} OpenAlex match(es).`
      : `Found ${openAlexResultsCache.length} paper(s) from ${resolvedCount} OpenAlex match(es).`;
  } catch (error) {
    openAlexStatusText.textContent = error.message;
  }
}

function renderOpenAlexResults() {
  openAlexResultsList.innerHTML = "";
  if (!openAlexResultsCache.length) {
    openAlexResultsCount.textContent = "No results loaded";
    const empty = document.createElement("div");
    empty.className = "openalex-empty-state";
    empty.innerHTML = `
      <strong>No discovery results yet</strong>
      <span>Search OpenAlex directly, or choose seed publications and one or more discovery modes.</span>
    `;
    openAlexResultsList.appendChild(empty);
    return;
  }

  openAlexResultsCount.textContent = `${openAlexResultsCache.length} result${openAlexResultsCache.length === 1 ? "" : "s"}`;
  openAlexResultsCache.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "zotero-item-row openalex-result-row";
    const meta = [item.authors?.slice(0, 4).join(", "), item.year, item.source, item.type].filter(Boolean).join(" - ");
    row.innerHTML = `
      <div class="openalex-result-index">${index + 1}</div>
      <span>
        <strong>${escapeHtml(item.title || "Untitled")}</strong>
        <span>${escapeHtml(meta)}</span>
        <span>${escapeHtml(openAlexResultDetails(item))}</span>
        <span class="openalex-result-actions"></span>
        <span class="openalex-relationship-list"></span>
      </span>
    `;
    const actions = row.querySelector(".openalex-result-actions");
    appendOpenAlexAction(actions, "DOI", item.doi || item.url);
    appendOpenAlexAction(actions, "OpenAlex", item.openalexUrl);
    appendOpenAlexAction(actions, "Source", item.landingPageUrl);
    appendOpenAlexAction(actions, "PDF", item.pdfUrl);
    appendOpenAlexCopyAction(actions, item.doi || item.title || "");
    renderOpenAlexRelationships(row.querySelector(".openalex-relationship-list"), item.relationships || []);
    openAlexResultsList.appendChild(row);
  });
}

function renderOpenAlexRelationships(container, relationships) {
  if (!container || !relationships.length) return;
  const title = document.createElement("strong");
  title.textContent = "Relationship to selected papers";
  container.appendChild(title);
  relationships.forEach((relationship) => {
    const row = document.createElement("span");
    row.className = `openalex-relationship-row relation-${relationship.relation || "none"}`;
    row.innerHTML = `
      <span>${escapeHtml(relationship.seedTitle || "Selected publication")}</span>
      <span>${escapeHtml(relationship.label || "No citation relationship found.")}</span>
    `;
    container.appendChild(row);
  });
}

function openAlexResultDetails(item) {
  const parts = [];
  if (item.doi) parts.push(item.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, "doi:"));
  if (Number.isFinite(item.citedByCount)) parts.push(`${item.citedByCount} citation${item.citedByCount === 1 ? "" : "s"}`);
  return parts.join(" - ");
}

function appendOpenAlexAction(container, label, url) {
  if (!container || !url) return;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", () => window.open(url, "_blank", "noopener"));
  container.appendChild(button);
}

function appendOpenAlexCopyAction(container, value) {
  if (!container || !value) return;
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Copy DOI";
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(value);
      openAlexStatusText.textContent = "Copied DOI/search text.";
    } catch (error) {
      openAlexStatusText.textContent = "Could not copy to clipboard.";
    }
  });
  container.appendChild(button);
}

function openGrobidPanel() {
  grobidPanel.hidden = false;
  if (!grobidSuggestionsCache.length) {
    grobidProgress.hidden = true;
    renderGrobidSuggestions();
  }
}

function closeGrobidPanel() {
  grobidPanel.hidden = true;
}

async function checkGrobid() {
  grobidStatusText.textContent = "Checking GROBID...";
  try {
    const status = await fetchJson("/api/grobid/status");
    grobidStatusText.textContent = status.ok ? `${status.message} ${status.version || ""}` : status.message;
  } catch (error) {
    grobidStatusText.textContent = error.message;
  }
}

function getPublicationPayload() {
  return cy.nodes()
    .filter((node) => node.data("type") === "Publication")
    .map((node) => {
      const zotero = node.data("zotero") || {};
      return {
        id: node.id(),
        title: node.data("label") || "",
        doi: zotero.doi || "",
        year: zotero.year || "",
        authors: zotero.authors || [],
        zoteroKey: zotero.itemKey || ""
      };
    });
}

async function analyzeGrobidReferences() {
  const publications = getPublicationPayload();
  if (!publications.length) {
    grobidStatusText.textContent = "No publication nodes found.";
    return;
  }

  const analyzeButton = document.getElementById("analyzeGrobidButton");
  analyzeButton.disabled = true;
  setGrobidProgress("running", `Analyzing ${publications.length} publication PDFs. This can take a while...`);
  renderGrobidErrorLog([]);
  grobidStatusText.textContent = `Analyzing ${publications.length} publication PDFs with GROBID...`;
  grobidSuggestionsList.textContent = "This can take a while for many PDFs.";
  try {
    const data = await postJson("/api/grobid/analyze-map", { publications });
    const skipped = data.skipped || [];
    grobidSuggestionsCache = data.suggestions || [];
    grobidAnalyzedCache = data.analyzed || [];
    applyGrobidReferencesToNodes(grobidAnalyzedCache);
    renderGrobidSuggestions();
    renderGrobidErrorLog(skipped);
    const newSuggestionCount = getNewGrobidSuggestions().length;
    grobidStatusText.textContent = `Found ${newSuggestionCount} new citation suggestion(s). Analyzed ${grobidAnalyzedCache.length}; skipped ${skipped.length}.`;
    setGrobidProgress(skipped.length ? "warning" : "complete", `Complete. Found ${newSuggestionCount} new suggestion(s); skipped ${skipped.length}.`);
    scheduleAutosave("Autosaved GROBID extracted references.");
  } catch (error) {
    grobidStatusText.textContent = error.message;
    grobidSuggestionsList.textContent = "";
    renderGrobidErrorLog([{ title: "GROBID analysis failed", reason: error.message }]);
    setGrobidProgress("error", "Analysis failed.");
  } finally {
    analyzeButton.disabled = false;
  }
}

function setGrobidProgress(state, text) {
  grobidProgress.hidden = false;
  grobidProgress.classList.toggle("complete", state === "complete");
  grobidProgress.classList.toggle("error", state === "error");
  grobidProgress.classList.toggle("warning", state === "warning");
  grobidProgressText.textContent = text;
}

function applyGrobidReferencesToNodes(analyzedItems) {
  analyzedItems.forEach((item) => {
    const node = cy.getElementById(item.nodeId);
    if (!node.length) return;
    node.data("grobid", {
      analyzedAt: new Date().toISOString(),
      pdfPath: item.pdfPath,
      referenceCount: item.referenceCount,
      references: item.references || []
    });
  });
}

function renderGrobidSuggestions() {
  grobidSuggestionsList.innerHTML = "";
  const visibleSuggestions = getNewGrobidSuggestions();
  grobidListActions.hidden = !visibleSuggestions.length;
  if (!visibleSuggestions.length) {
    grobidSuggestionsList.textContent = grobidSuggestionsCache.length
      ? "All detected citation links already have connections in the map."
      : "No GROBID suggestions yet.";
    return;
  }

  visibleSuggestions.forEach(({ suggestion, index }) => {
    const row = document.createElement("label");
    row.className = "zotero-item-row";
    const checked = suggestion.confidence >= 0.9 ? "checked" : "";
    row.innerHTML = `
      <input type="checkbox" value="${index}" ${checked}>
      <span>
        <strong>${escapeHtml(suggestion.sourceTitle)} cites ${escapeHtml(suggestion.targetTitle)}</strong>
        <span>${Math.round(suggestion.confidence * 100)}% - ${escapeHtml(suggestion.matchReason)}</span>
      </span>
    `;
    grobidSuggestionsList.appendChild(row);
  });
}

function renderGrobidErrorLog(skipped = []) {
  grobidErrorLog.innerHTML = "";
  grobidErrorLog.hidden = !skipped.length;
  if (!skipped.length) return;

  const title = document.createElement("strong");
  title.textContent = `GROBID skipped ${skipped.length} publication(s)`;
  grobidErrorLog.appendChild(title);
  const list = document.createElement("div");
  list.className = "grobid-error-list";
  skipped.forEach((item) => {
    const row = document.createElement("div");
    row.className = "grobid-error-row";
    row.innerHTML = `
      <span>
        <strong>${escapeHtml(item.title || item.nodeId || "Untitled publication")}</strong>
        <span>${escapeHtml(item.reason || "Unknown reason")}</span>
        ${item.pdfPath ? `<span>${escapeHtml(item.pdfPath)}</span>` : ""}
      </span>
    `;
    list.appendChild(row);
  });
  grobidErrorLog.appendChild(list);
}

function addSelectedGrobidConnections() {
  const selectedIndexes = Array.from(grobidSuggestionsList.querySelectorAll("input:checked"))
    .map((input) => Number.parseInt(input.value, 10))
    .filter(Number.isFinite);
  if (!selectedIndexes.length) {
    grobidStatusText.textContent = "Select at least one citation suggestion.";
    return;
  }

  pushUndoState("add GROBID connections");
  let added = 0;
  selectedIndexes.forEach((index) => {
    const suggestion = grobidSuggestionsCache[index];
    if (!suggestion) return;
    if (hasConnectionBetween(suggestion.sourceNodeId, suggestion.targetNodeId)) return;
    const edgeId = `edge-citation-${suggestion.sourceNodeId}-${suggestion.targetNodeId}`;
    if (cy.getElementById(edgeId).length) return;
    cy.add({
      group: "edges",
      data: {
        id: edgeId,
        source: suggestion.sourceNodeId,
        target: suggestion.targetNodeId,
        notes: `GROBID detected that "${suggestion.sourceTitle}" cites "${suggestion.targetTitle}".`,
        notesHtml: `GROBID detected that "${escapeHtml(suggestion.sourceTitle)}" cites "${escapeHtml(suggestion.targetTitle)}".`,
        tags: ["citation", "grobid"],
        citationRelation: {
          type: "cites",
          source: "grobid",
          confidence: suggestion.confidence,
          matchReason: suggestion.matchReason,
          reference: suggestion.reference
        },
        zIndex: 1
      }
    });
    added += 1;
  });

  renderDocumentOutline();
  renderGrobidSuggestions();
  scheduleAutosave("Autosaved GROBID citation connections.");
  grobidStatusText.textContent = `Added ${added} citation connection(s).`;
}

function getNewGrobidSuggestions() {
  return grobidSuggestionsCache
    .map((suggestion, index) => ({ suggestion, index }))
    .filter(({ suggestion }) => !hasConnectionBetween(suggestion.sourceNodeId, suggestion.targetNodeId));
}

function hasConnectionBetween(sourceId, targetId) {
  return cy.edges().some((edge) => {
    const source = edge.data("source");
    const target = edge.data("target");
    return (source === sourceId && target === targetId) || (source === targetId && target === sourceId);
  });
}

async function fetchJson(url, options = {}) {
  const controller = options.timeoutMs ? new AbortController() : null;
  const timeoutId = controller
    ? window.setTimeout(() => controller.abort(), options.timeoutMs)
    : null;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: controller?.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.detail || `Request failed: ${response.status}`);
    return data;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error(`Request timed out: ${url}`);
    throw error;
  } finally {
    if (timeoutId) window.clearTimeout(timeoutId);
  }
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || `Request failed: ${response.status}`);
  return data;
}

function resetDemo() {
  pushUndoState("reset demo");
  cy.elements().remove();
  cy.add(normalizeElements(cloneElements(demoElements)));
  cy.layout({ name: "preset", fit: true, padding: 70 }).run();
  localStorage.removeItem(projectStorageKey(activeProject));
  selectedNode = null;
  selectedEdge = null;
  activeDocumentNodeId = null;
  activeDocumentTarget = null;
  hideResizeOverlay();
  hideEdgeNotesPanel();
  renderDocumentOutline();
  clearDocumentEditor();
  clearForm();
  setFormEnabled(false);
  setStatus("Demo graph restored.");
  scheduleAutosave("Autosaved demo graph.");
}

function openSelectedLink() {
  if (!selectedNode) return;
  const url = selectedNode.data("url");
  if (url) window.open(url, "_blank", "noopener,noreferrer");
}

function showDetailsPanel(panelName) {
  const activePanel = panelName === "formatting" ? "formatting" : "details";
  document.querySelectorAll("[data-details-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.detailsPanel !== activePanel;
  });
  detailsTabButton.classList.toggle("active-panel-tab", activePanel === "details");
  formattingTabButton.classList.toggle("active-panel-tab", activePanel === "formatting");
}

function getNodeStyleSnapshot(node) {
  if (!node || node.removed()) return null;
  const size = getNodeSize(node);
  const fontStyle = getNodeFontStyle(node);
  const fontParts = getFontStyleParts(fontStyle);
  return {
    size,
    textWidth: getTextWidth(size),
    fontSize: getNodeFontSize(node),
    fontFamily: getNodeFontFamily(node),
    fontStyle,
    fontStyleValue: fontParts.fontStyleValue,
    fontWeight: fontParts.fontWeight
  };
}

function copyNodeStyle(node) {
  copiedNodeStyle = getNodeStyleSnapshot(node);
  if (!copiedNodeStyle) return;
  pasteNodeStyleButton.disabled = !selectedNode;
  multiPasteNodeStyleButton.disabled = !selectedNode;
  setStatus("Copied node style.");
}

function pasteNodeStyle(node) {
  if (!copiedNodeStyle) return;
  const targets = getFormattingTargetNodes();
  if (!targets.length && (!node || node.removed())) return;
  pushUndoState("paste node style");
  const pasteTargets = targets.length ? targets : cy.collection([node]);
  pasteTargets.forEach((target) => {
    target.data({ ...copiedNodeStyle });
  });
  if (selectedNode && pasteTargets.some((target) => target.id() === selectedNode.id())) {
    fields.size.value = copiedNodeStyle.size;
    fields.sizeNumber.value = copiedNodeStyle.size;
    fields.fontSize.value = copiedNodeStyle.fontSize;
    fields.fontFamily.value = copiedNodeStyle.fontFamily;
    fields.fontStyle.value = copiedNodeStyle.fontStyle;
  }
  syncMultiFormatFields(selectedNode || pasteTargets[0]);
  if (pasteTargets.length > 1) hideResizeOverlay();
  else updateResizeOverlay();
  renderDocumentOutline();
  setStatus(`Pasted node style to ${pasteTargets.length} node(s).`);
  scheduleAutosave("Autosaved after pasting node style.");
}

function selectedPublicationZoteroKey() {
  if (!selectedNode || selectedNode.data("type") !== "Publication") return "";
  return selectedNode.data("zotero")?.itemKey || "";
}

function publicationZoteroKeyForNode(node) {
  if (!node || node.data("type") !== "Publication") return "";
  return node.data("zotero")?.itemKey || "";
}

function activeDocumentPublicationZoteroKey() {
  return publicationZoteroKeyForNode(getActiveDocumentNode());
}

function updatePdfButtons() {
  const hasZoteroPdfSource = Boolean(selectedPublicationZoteroKey());
  openPdfButton.disabled = !hasZoteroPdfSource;
  importPdfHighlightsButton.disabled = !hasZoteroPdfSource;

  const hasDocumentZoteroPdfSource = Boolean(activeDocumentPublicationZoteroKey());
  docOpenPdfButton.disabled = !hasDocumentZoteroPdfSource;
  docImportPdfHighlightsButton.disabled = !hasDocumentZoteroPdfSource;
}

function openSelectedNodeNotes() {
  if (!selectedNode) return;
  setActiveDocumentNode(selectedNode);
  showWorkspace("document");
  setStatus("Opened selected node notes.");
}

async function openSelectedPdf() {
  await openPdfForNode(selectedNode);
}

async function openPdfForNode(node) {
  if (!node) return;
  const zoteroKey = publicationZoteroKeyForNode(node);
  if (!zoteroKey) {
    setStatus("Selected publication does not have a Zotero key.");
    return;
  }

  openPdfButton.disabled = true;
  docOpenPdfButton.disabled = true;
  setStatus("Opening PDF...");
  try {
    const data = await postJson("/api/pdf/open", {
      zoteroKey,
      title: node.data("label") || "",
      existingPath: node.data("localPdf")?.relativePath || "",
      project: activeProject
    });
    node.data("localPdf", {
      source: "zotero",
      path: data.path,
      relativePath: data.relativePath,
      sourcePath: data.sourcePath || node.data("localPdf")?.sourcePath || "",
      copiedAt: node.data("localPdf")?.copiedAt || new Date().toISOString(),
      openedAt: new Date().toISOString()
    });
    scheduleAutosave("Autosaved opened PDF path.");
    setStatus(data.copied ? "PDF copied once and opened in default viewer." : "Existing copied PDF opened in default viewer.");
  } catch (error) {
    setStatus(error.message);
    if (/No local Zotero PDF/i.test(error.message)) {
      window.alert(`No Zotero PDF was found for this publication.\n\n${error.message}`);
    }
  } finally {
    updatePdfButtons();
  }
}

async function importSelectedPdfHighlights() {
  await importPdfHighlightsForNode(selectedNode);
}

async function importPdfHighlightsForNode(node) {
  if (!node) return;
  const zoteroKey = publicationZoteroKeyForNode(node);
  if (!zoteroKey) {
    setStatus("Selected publication does not have a Zotero key.");
    return;
  }

  importPdfHighlightsButton.disabled = true;
  docImportPdfHighlightsButton.disabled = true;
  setStatus("Importing PDF annotations...");
  try {
    const data = await postJson("/api/pdf/highlights", {
      zoteroKey,
      title: node.data("label") || "",
      existingPath: node.data("localPdf")?.relativePath || "",
      project: activeProject
    });

    node.data("localPdf", {
      source: "zotero",
      path: data.path,
      relativePath: data.relativePath,
      sourcePath: data.sourcePath || node.data("localPdf")?.sourcePath || "",
      copiedAt: node.data("localPdf")?.copiedAt || new Date().toISOString(),
      annotationsImportedAt: new Date().toISOString()
    });
    node.data("pdfHighlights", {
      importedAt: new Date().toISOString(),
      sourcePath: data.relativePath,
      items: data.annotations || data.highlights || []
    });

    pdfHighlightsCache = data.annotations || data.highlights || [];
    renderPdfHighlights();
    scheduleAutosave("Autosaved imported PDF annotations.");
    setStatus(`Imported ${pdfHighlightsCache.length} PDF annotation(s).`);
  } catch (error) {
    setStatus(error.message);
    if (/No local Zotero PDF/i.test(error.message)) {
      window.alert(`No Zotero PDF was found for this publication.\n\n${error.message}`);
    }
  } finally {
    updatePdfButtons();
  }
}

function renderPdfHighlights() {
  pdfHighlightsModal.hidden = false;
  pdfHighlightsList.innerHTML = "";
  pdfHighlightsStatus.textContent = pdfHighlightsCache.length
    ? `${pdfHighlightsCache.length} annotation(s) found. Review and append selected items.`
    : "No supported annotations were found in this PDF.";
  appendPdfHighlightsButton.disabled = !pdfHighlightsCache.length;
  selectAllPdfHighlightsButton.disabled = !pdfHighlightsCache.length;
  deselectAllPdfHighlightsButton.disabled = !pdfHighlightsCache.length;
  syncPdfAnnotationPrefixDeleteButton();
  updatePdfAnnotationFormatPreview();

  pdfHighlightsCache.forEach((highlight, index) => {
    const row = document.createElement("div");
    row.className = "pdf-highlight-row";
    const variants = Array.isArray(highlight.variants) && highlight.variants.length
      ? highlight.variants
      : [{ method: highlight.method || "textbox", confidence: highlight.confidence || "Medium", text: highlight.text || "" }];
    const options = variants.map((variant, variantIndex) => {
      const label = `${variant.method || "method"} - ${variant.confidence || "Medium"}`;
      const selected = (variant.method || "") === (highlight.method || "") ? "selected" : "";
      return `<option value="${variantIndex}" ${selected}>${escapeHtml(label)}</option>`;
    }).join("");
    row.innerHTML = `
      <input type="checkbox" value="${index}" checked>
      <span>
        <strong>Page ${escapeHtml(String(highlight.page || "?"))} - ${escapeHtml(highlight.type || "Annotation")}</strong>
        <select data-highlight-variant="${index}" aria-label="Extraction method">${options}</select>
        <textarea data-highlight-text="${index}" rows="3">${escapeHtml(highlight.text || "")}</textarea>
      </span>
    `;
    pdfHighlightsList.appendChild(row);
  });

  pdfHighlightsList.querySelectorAll("[data-highlight-variant]").forEach((select) => {
    select.addEventListener("change", updateHighlightVariantText);
  });
}

function updateHighlightVariantText(event) {
  const index = Number.parseInt(event.target.dataset.highlightVariant, 10);
  const variantIndex = Number.parseInt(event.target.value, 10);
  const variant = pdfHighlightsCache[index]?.variants?.[variantIndex];
  const textarea = pdfHighlightsList.querySelector(`[data-highlight-text="${index}"]`);
  if (variant && textarea) textarea.value = variant.text || "";
}

function closePdfHighlightsModal() {
  pdfHighlightsModal.hidden = true;
  pdfHighlightsList.innerHTML = "";
  pdfHighlightsStatus.textContent = "No annotations imported yet.";
}

function readPdfAnnotationFormatSettings() {
  return {
    prefixStyle: pdfAnnotationPrefixStyle?.value || "compact",
    quoteStyle: pdfAnnotationQuoteStyle?.value || "italic",
    listStyle: pdfAnnotationListStyle?.value || "bullet",
    includeComments: pdfAnnotationIncludeComments?.checked !== false
  };
}

function getCustomPdfAnnotationPrefixValues() {
  return Array.from(pdfAnnotationPrefixStyle?.options || [])
    .map((option) => option.value)
    .filter((value) => value.startsWith("custom:"));
}

function addPdfAnnotationPrefixOption(value) {
  if (!pdfAnnotationPrefixStyle || !value?.startsWith("custom:")) return null;
  let option = Array.from(pdfAnnotationPrefixStyle.options).find((item) => item.value === value);
  if (option) return option;
  option = document.createElement("option");
  option.value = value;
  option.textContent = value.slice("custom:".length);
  pdfAnnotationPrefixStyle.insertBefore(option, pdfAnnotationPrefixStyle.querySelector('option[value="none"]'));
  return option;
}

function loadPdfAnnotationFormatDefaults() {
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(PDF_ANNOTATION_FORMAT_KEY) || "null");
  } catch (error) {
    console.warn("Could not load PDF annotation format defaults.", error);
    return;
  }
  if (!saved || typeof saved !== "object") return;

  (Array.isArray(saved.customPrefixes) ? saved.customPrefixes : []).forEach(addPdfAnnotationPrefixOption);
  if (saved.prefixStyle?.startsWith("custom:")) addPdfAnnotationPrefixOption(saved.prefixStyle);
  if (pdfAnnotationPrefixStyle && saved.prefixStyle && Array.from(pdfAnnotationPrefixStyle.options).some((option) => option.value === saved.prefixStyle)) {
    pdfAnnotationPrefixStyle.value = saved.prefixStyle;
  }
  if (pdfAnnotationQuoteStyle && saved.quoteStyle) pdfAnnotationQuoteStyle.value = saved.quoteStyle;
  if (pdfAnnotationListStyle && saved.listStyle) pdfAnnotationListStyle.value = saved.listStyle;
  if (pdfAnnotationIncludeComments && typeof saved.includeComments === "boolean") {
    pdfAnnotationIncludeComments.checked = saved.includeComments;
  }
  syncPdfAnnotationPrefixDeleteButton();
  updatePdfAnnotationFormatPreview();
}

function savePdfAnnotationFormatDefaults() {
  const settings = {
    ...readPdfAnnotationFormatSettings(),
    customPrefixes: getCustomPdfAnnotationPrefixValues()
  };
  localStorage.setItem(PDF_ANNOTATION_FORMAT_KEY, JSON.stringify(settings));
  pdfHighlightsStatus.textContent = "Saved PDF annotation formatting defaults.";
}

function getPdfAnnotationPrefix(highlight, settings) {
  const page = highlight.page || "?";
  const type = highlight.type || "Annotation";
  if (settings.prefixStyle === "page-type-bracket") return `Page ${page} [${type}]:`;
  if (settings.prefixStyle === "page-type") return `Page ${page} - ${type}:`;
  if (settings.prefixStyle === "short-page-type") return `p. ${page} - ${type}:`;
  if (settings.prefixStyle === "page-word") return `Page ${page}:`;
  if (settings.prefixStyle === "page-short") return `p. ${page}`;
  if (settings.prefixStyle === "none") return "";
  if (settings.prefixStyle?.startsWith("custom:")) {
    return settings.prefixStyle
      .slice("custom:".length)
      .replace(/\{page\}|X/g, page)
      .replace(/\{type\}|Type/g, type);
  }
  return `p. ${page} [${type}]:`;
}

function addCustomPdfAnnotationPrefix() {
  if (!pdfAnnotationPrefixStyle) return;
  const rawPrefix = window.prompt("Custom prefix. Use X or {page} for page, and Type or {type} for annotation type.", "Page X [Type]:");
  const prefix = String(rawPrefix || "").trim();
  if (!prefix) return;
  const value = `custom:${prefix}`;
  addPdfAnnotationPrefixOption(value);
  pdfAnnotationPrefixStyle.value = value;
  updatePdfAnnotationFormatPreview();
  syncPdfAnnotationPrefixDeleteButton();
}

function handlePdfAnnotationPrefixKeydown(event) {
  if (event.key !== "Delete" && event.key !== "Backspace") return;
  if (!isCustomPdfAnnotationPrefixSelected()) return;
  event.preventDefault();
  deleteSelectedCustomPdfAnnotationPrefix();
}

function isCustomPdfAnnotationPrefixSelected() {
  return Boolean(pdfAnnotationPrefixStyle?.value?.startsWith("custom:"));
}

function syncPdfAnnotationPrefixDeleteButton() {
  if (deletePdfAnnotationPrefixButton) {
    deletePdfAnnotationPrefixButton.disabled = !isCustomPdfAnnotationPrefixSelected();
  }
}

function deleteSelectedCustomPdfAnnotationPrefix() {
  const selectedOption = pdfAnnotationPrefixStyle?.selectedOptions?.[0];
  if (!selectedOption || !selectedOption.value.startsWith("custom:")) return;
  selectedOption.remove();
  pdfAnnotationPrefixStyle.value = "compact";
  updatePdfAnnotationFormatPreview();
  syncPdfAnnotationPrefixDeleteButton();
}

function formatAnnotationQuoteText(text, settings) {
  if (settings.quoteStyle === "blockquote") return `> ${text}`;
  return settings.quoteStyle === "italic" ? `"${text}"` : text;
}

function formatAnnotationQuoteHtml(text, settings) {
  const escaped = escapeHtml(text);
  if (settings.quoteStyle === "blockquote") return `<blockquote>${escaped}</blockquote>`;
  if (settings.quoteStyle === "italic") return `<em>&quot;${escaped}&quot;</em>`;
  return escaped;
}

function formatAnnotationForNotes(highlight, editedText, settings = readPdfAnnotationFormatSettings()) {
  const [mainText, ...commentParts] = editedText.split(/\nComment:\s*/);
  const commentText = commentParts.join("\nComment: ").trim();
  const quoteText = mainText.trim();
  const prefix = getPdfAnnotationPrefix(highlight, settings);
  const textPrefix = prefix ? `${prefix} ` : "";
  const textLines = [`${textPrefix}${formatAnnotationQuoteText(quoteText, settings)}`];
  if (settings.includeComments && commentText) textLines.push(`  - Comment: ${commentText}`);

  const html = `
    ${prefix ? `${escapeHtml(prefix)} ` : ""}${formatAnnotationQuoteHtml(quoteText, settings)}
    ${settings.includeComments && commentText ? `<ul><li><strong>Comment:</strong> ${escapeHtml(commentText)}</li></ul>` : ""}
  `;
  return { text: textLines.join("\n"), html };
}

function wrapFormattedPdfAnnotations(annotations, settings) {
  if (settings.listStyle === "paragraph") {
    return {
      text: annotations.map((annotation) => annotation.text).join("\n\n"),
      html: annotations.map((annotation) => `<p>${annotation.html}</p>`).join("")
    };
  }

  const isNumbered = settings.listStyle === "numbered";
  const listTag = isNumbered ? "ol" : "ul";
  const text = annotations
    .map((annotation, index) => `${isNumbered ? `${index + 1}.` : "-"} ${annotation.text}`)
    .join("\n");
  const html = `<${listTag}>${annotations.map((annotation) => `<li>${annotation.html}</li>`).join("")}</${listTag}>`;
  return { text, html };
}

function updatePdfAnnotationFormatPreview() {
  if (!pdfAnnotationFormatPreview) return;
  const settings = readPdfAnnotationFormatSettings();
  const sample = formatAnnotationForNotes(
    { page: 12, type: "Highlight" },
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nComment: Optional reviewer comment.",
    settings
  );
  pdfAnnotationFormatPreview.innerHTML = wrapFormattedPdfAnnotations([sample], settings).html;
}

function appendSelectedPdfHighlights() {
  const targetNode = publicationNotesNode || selectedNode || getActiveDocumentNode();
  if (!targetNode || targetNode.data("type") !== "Publication") return;

  const selectedIndexes = Array.from(pdfHighlightsList.querySelectorAll("input:checked"))
    .map((input) => Number.parseInt(input.value, 10))
    .filter(Number.isFinite);
  if (!selectedIndexes.length) {
    pdfHighlightsStatus.textContent = "Select at least one annotation to append.";
    return;
  }

  pushUndoState("append PDF annotations");
  const notes = normalizePublicationNotes(targetNode.data("publicationNotes"));
  const formatSettings = readPdfAnnotationFormatSettings();
  const annotations = selectedIndexes
    .map((index) => {
      const highlight = pdfHighlightsCache[index];
      const editedText = pdfHighlightsList.querySelector(`[data-highlight-text="${index}"]`)?.value.trim();
      return highlight && editedText ? formatAnnotationForNotes(highlight, editedText, formatSettings) : "";
    })
    .filter(Boolean);
  const section = wrapFormattedPdfAnnotations(annotations, formatSettings);
  notes.notes = [notes.notes, section.text].filter(Boolean).join("\n\n");
  notes.notesHtml = [notes.notesHtml, section.html].filter(Boolean).join("<br>");
  targetNode.data("publicationNotes", notes);

  if (publicationNotesNode && publicationNotesNode.id() === targetNode.id()) {
    publicationNoteFields.notes.value = notes.notes;
  }
  if (activeDocumentNodeId === targetNode.id()) {
    setDocumentEditorHtml(notes.notesHtml);
  }

  scheduleAutosave("Autosaved appended PDF annotations.");
  pdfHighlightsStatus.textContent = `Appended ${annotations.length} annotation(s) to notes.`;
  closePdfHighlightsModal();
}

async function openPdfFolder() {
  setStatus("Opening PDF folder...");
  try {
    await postJson("/api/pdf/open-folder", {
      zoteroKey: "",
      title: "",
      existingPath: "",
      project: activeProject
    });
    setStatus("PDF folder opened.");
  } catch (error) {
    setStatus(error.message);
  }
}

function showWorkspace(view) {
  currentView = view;
  const showMap = view === "map" || view === "multi";
  const showDocument = view === "document" || view === "multi";
  const showMulti = view === "multi";

  if (showMulti || view === "document") closePublicationNotesModal();
  document.querySelector(".app-shell").classList.toggle("multi-view", showMulti);
  mapWorkspace.hidden = !showMap;
  documentWorkspace.hidden = !showDocument;
  mapViewButton.classList.toggle("active-view", view === "map");
  documentViewButton.classList.toggle("active-view", view === "document");
  multiViewButton.classList.toggle("active-view", showMulti);

  if (showDocument) {
    renderDocumentOutline();
    loadActiveDocumentSection();
  }

  if (showMap) {
    cy.resize();
    window.setTimeout(() => {
      cy.resize();
      updateResizeOverlay();
      updateMapZoomControlPosition();
      if (currentView !== "map") closePublicationNotesModal();
    }, 0);
  }
}

function resetView() {
  if (!mapWorkspace.hidden) {
    cy.resize();
    cy.fit(undefined, 70);
    setMapZoomBaseFromCurrentView();
    updateResizeOverlay();
    updateMapZoomControl();
  }

  if (!documentWorkspace.hidden) {
    documentWorkspace.querySelector(".document-editor-shell").scrollTop = 0;
    documentEditor.scrollTop = 0;
  }

  setStatus("View reset.");
}

function setMapZoomBaseFromCurrentView() {
  mapZoomBase = clamp(cy.zoom() || 1, cy.minZoom(), cy.maxZoom());
}

function setMapZoom(zoom) {
  const nextZoom = getAbsoluteZoomFromRelative(zoom);
  setMapZoomAtRenderedPosition(nextZoom, getMapRenderedCenter());
}

function setMapZoomAtRenderedPosition(zoom, renderedPosition) {
  const nextZoom = clamp(zoom, cy.minZoom(), cy.maxZoom());
  cy.zoom({ level: nextZoom, renderedPosition });
  updateResizeOverlay();
  updateMapZoomControl();
}

function stepMapZoom(delta) {
  setMapZoom(getRelativeMapZoom() + delta);
}

function getMapRenderedCenter() {
  const rect = cy.container().getBoundingClientRect();
  return {
    x: rect.width / 2,
    y: rect.height / 2
  };
}

function getRelativeMapZoom() {
  return clamp((cy.zoom() || mapZoomBase) / (mapZoomBase || 1), Number(mapZoomSlider.min), Number(mapZoomSlider.max));
}

function getAbsoluteZoomFromRelative(relativeZoom) {
  const nextRelativeZoom = clamp(Number(relativeZoom), Number(mapZoomSlider.min), Number(mapZoomSlider.max));
  return clamp((mapZoomBase || 1) * nextRelativeZoom, cy.minZoom(), cy.maxZoom());
}

function handleMapWheelZoom(event) {
  if (event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  showMapZoomControl();
  const direction = event.deltaY > 0 ? -1 : 1;
  const wheelUnits = Math.max(1, Math.min(6, Math.abs(event.deltaY) / 100));
  const zoomStep = direction * 0.08 * wheelUnits;
  const containerRect = cy.container().getBoundingClientRect();
  setMapZoomAtRenderedPosition(getAbsoluteZoomFromRelative(getRelativeMapZoom() + zoomStep), {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top
  });
}

function updateMapZoomControl() {
  const zoom = getRelativeMapZoom();
  mapZoomSlider.value = zoom.toFixed(2);
  if (document.activeElement !== mapZoomValue) {
    mapZoomValue.value = String(Math.round(zoom * 100));
  }
}

function applyTypedMapZoom() {
  const typedPercent = Number(mapZoomValue.value);
  if (!Number.isFinite(typedPercent)) {
    updateMapZoomControl();
    return;
  }

  const minPercent = Number(mapZoomValue.min);
  const maxPercent = Number(mapZoomValue.max);
  const nextPercent = clamp(typedPercent, minPercent, maxPercent);
  mapZoomValue.value = String(Math.round(nextPercent));
  setMapZoom(nextPercent / 100);
}

function showMapZoomControl() {
  updateMapZoomControlPosition();
  mapZoomControl.classList.add("visible");
  scheduleHideMapZoomControl();
}

function updateMapZoomControlPosition() {
  if (!mapZoomControl || !cy) return;
  const rect = cy.container().getBoundingClientRect();
  const margin = 14;
  const left = Math.max(margin, rect.left + margin);
  const bottom = Math.max(margin, window.innerHeight - rect.bottom + margin);
  mapZoomControl.style.setProperty("--map-zoom-control-left", `${left}px`);
  mapZoomControl.style.setProperty("--map-zoom-control-bottom", `${bottom}px`);
}

function scheduleHideMapZoomControl() {
  window.clearTimeout(zoomControlHideTimer);
  zoomControlHideTimer = window.setTimeout(() => {
    if (document.activeElement === mapZoomValue) {
      scheduleHideMapZoomControl();
      return;
    }
    mapZoomControl.classList.remove("visible");
  }, 2200);
}

function applyClusterMode(mode, options = {}) {
  const autosave = options.autosave !== false;
  const restore = options.restore === true;
  const nextMode = ["none", "tags", "authors", "connections"].includes(mode) ? mode : "none";
  const tagIntersectionMode = nextMode === "tags" && readClusterStyle().useAllTags;
  if (tagIntersectionMode && !restore && clusterSpacingFactor > 1.35) {
    clusterSpacingFactor = 1.1;
  }
  clusterSpacingFactor = clampClusterSpacing(clusterSpacingFactor);
  clusterSpacingSlider.value = String(clusterSpacingFactor);
  updateClusterSpacingValue();
  clusterModeSelect.value = nextMode;
  if (nextMode === "none") {
    currentClusterMode = "none";
    clusterBasePositions = null;
    clusterSpacingAnchors = null;
    removeClusterBackgrounds();
    if (!restore) writeClusterViewState();
    setStatus("Clustering off. Current node positions are unchanged.");
    return;
  }

  if (autosave) pushUndoState("cluster layout");
  currentClusterMode = nextMode;
  if (nextMode !== "tags") removeClusterBackgrounds();

  const layout = getLayoutForClusterMode(nextMode);
  clusterBasePositions = layout.positions;
  clusterSpacingAnchors = layout.anchors;
  const positions = getScaledClusterPositions();
  animateNodesToPositions(positions);
  if (nextMode === "tags") {
    window.setTimeout(() => renderTagClusterBackgrounds(), 520);
  }
  const label = nextMode === "tags" ? "tags" : nextMode === "authors" ? "authors" : "connection count";
  setStatus(`Clustered by ${label}. Spacing ${clusterSpacingFactor.toFixed(2)}x.`);
  if (!restore) writeClusterViewState();
  if (autosave) scheduleAutosave("Autosaved clustered layout.");
}

function clampClusterSpacing(value) {
  const min = Number(clusterSpacingSlider.min) || 1.1;
  const max = Number(clusterSpacingSlider.max) || 3;
  return clamp(Number(value) || 1.4, min, max);
}

function updateClusterSpacingValue() {
  clusterSpacingValue.textContent = `${clusterSpacingFactor.toFixed(2)}x`;
}

function readClusterViewState() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLUSTER_VIEW_KEY) || "{}");
    return {
      mode: ["none", "tags", "authors", "connections"].includes(saved.mode) ? saved.mode : "none",
      spacing: clampClusterSpacing(saved.spacing || 1)
    };
  } catch (error) {
    return { mode: "none", spacing: 1 };
  }
}

function writeClusterViewState() {
  localStorage.setItem(CLUSTER_VIEW_KEY, JSON.stringify({
    mode: currentClusterMode,
    spacing: clusterSpacingFactor
  }));
}

function restoreClusterViewState() {
  const state = readClusterViewState();
  clusterSpacingFactor = state.spacing;
  clusterSpacingSlider.value = String(clusterSpacingFactor);
  updateClusterSpacingValue();
  try {
    applyClusterMode(state.mode, { autosave: false, restore: true });
  } catch (error) {
    console.warn("Could not restore cluster view. Turning clustering off.", error);
    currentClusterMode = "none";
    clusterModeSelect.value = "none";
    clusterBasePositions = null;
    clusterSpacingAnchors = null;
    removeClusterBackgrounds();
    writeClusterViewState();
    setStatus("Loaded project, but clustering was reset because the saved cluster view could not be restored.");
  }
}

function readClusterStyle() {
  try {
    const saved = JSON.parse(localStorage.getItem(CLUSTER_STYLE_KEY) || "{}");
    return normalizeClusterStyle(saved);
  } catch (error) {
    return { ...DEFAULT_CLUSTER_STYLE };
  }
}

function normalizeClusterStyle(style = {}) {
  return {
    circleColor: isValidHexColor(style.circleColor) ? style.circleColor : DEFAULT_CLUSTER_STYLE.circleColor,
    textColor: isValidHexColor(style.textColor) ? style.textColor : DEFAULT_CLUSTER_STYLE.textColor,
    textSize: clamp(Number(style.textSize) || DEFAULT_CLUSTER_STYLE.textSize, 8, 72),
    minTagSize: clamp(Number(style.minTagSize) || DEFAULT_CLUSTER_STYLE.minTagSize, 1, 50),
    useAllTags: false,
    authorThreshold: clamp(Number(style.authorThreshold) || DEFAULT_CLUSTER_STYLE.authorThreshold, 2, 50)
  };
}

function writeClusterStyle(style) {
  localStorage.setItem(CLUSTER_STYLE_KEY, JSON.stringify(normalizeClusterStyle(style)));
}

function syncClusterStyleControls() {
  const style = readClusterStyle();
  clusterCircleColor.value = style.circleColor;
  clusterTextColor.value = style.textColor;
  clusterTextSize.value = style.textSize;
}

function openClusterSettings() {
  syncClusterStyleControls();
  clusterSettingsPanel.hidden = false;
}

function closeClusterSettings() {
  clusterSettingsPanel.hidden = true;
}

function updateClusterStyleFromSettings(options = {}) {
  const { clampTextSize = true } = options;
  const typedTextSize = Number(clusterTextSize.value);
  const textSize = clampTextSize
    ? clamp(typedTextSize || DEFAULT_CLUSTER_STYLE.textSize, 8, 72)
    : typedTextSize;
  if (!Number.isFinite(textSize)) return;
  const previousStyle = readClusterStyle();
  const style = normalizeClusterStyle({
    ...previousStyle,
    circleColor: clusterCircleColor.value,
    textColor: clusterTextColor.value,
    textSize,
    useAllTags: false
  });
  if (clampTextSize) clusterTextSize.value = style.textSize;
  writeClusterStyle(style);
  applyClusterStyleToBackgrounds(style);
  if (currentClusterMode === "tags") {
    if (previousStyle.useAllTags !== style.useAllTags || previousStyle.minTagSize !== style.minTagSize) {
      applyClusterMode("tags", { autosave: false });
      return;
    }
    renderTagClusterBackgrounds();
  }
  if (currentClusterMode === "authors" && previousStyle.authorThreshold !== style.authorThreshold) {
    applyClusterMode("authors", { autosave: false });
  }
}

function applyClusterStyleToBackgrounds(style = readClusterStyle()) {
  cy.nodes("[clusterBackground]").forEach((node) => {
    node.data({
      clusterCircleColor: style.circleColor,
      clusterTextColor: style.textColor,
      clusterTextSize: style.textSize
    });
  });
}

function applyClusterSpacing({ animate = false, autosave = false } = {}) {
  if (currentClusterMode !== "none" && !clusterBasePositions) {
    prepareClusterSpacingLayout();
  } else if (!clusterBasePositions) {
    clusterBasePositions = captureCurrentNodePositions();
    clusterSpacingAnchors = getUniformAnchors(clusterBasePositions, getPositionsCenter(clusterBasePositions));
  }

  const viewport = captureMapViewport();
  const positions = getScaledClusterPositions();
  if (animate) {
    animateNodesToPositions(positions);
    restoreMapViewport(viewport);
    if (currentClusterMode === "tags") {
      window.setTimeout(() => {
        restoreMapViewport(viewport);
        renderTagClusterBackgrounds();
      }, 520);
    }
  } else {
    setNodesToPositions(positions);
    restoreMapViewport(viewport);
    if (currentClusterMode === "tags") renderTagClusterBackgrounds();
  }
  if (autosave) scheduleAutosave("Autosaved cluster spacing.");
  writeClusterViewState();
}

function prepareClusterSpacingLayout() {
  if (currentClusterMode === "none") return;
  if (currentClusterMode === "tags" && readClusterStyle().useAllTags) {
    clusterBasePositions = captureCurrentNodePositions();
    clusterSpacingAnchors = getCurrentTagIntersectionAnchors(clusterBasePositions);
    return;
  }
  const layout = getLayoutForClusterMode(currentClusterMode);
  clusterBasePositions = layout.positions;
  clusterSpacingAnchors = layout.anchors;
}

function getLayoutForClusterMode(mode) {
  if (mode === "connections") return getConnectionClusterLayout();
  if (mode === "tags" && readClusterStyle().useAllTags) return getTagIntersectionClusterLayout();
  return getGroupedClusterLayout(mode);
}

function getRealNodes() {
  return cy.nodes().filter((node) => !node.removed() && !node.data("clusterBackground"));
}

function groupNodesForCluster(mode) {
  const grouped = new Map();

  getRealNodes().forEach((node) => {
    let key = "All nodes";
    if (mode === "tags") {
      key = getPrimaryTagClusterKey(node);
    } else if (mode === "authors") {
      key = getPrimaryAuthorClusterKey(node);
    }

    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(node);
  });

  return Array.from(grouped.entries())
    .map(([key, nodes]) => ({ key, nodes }))
    .sort((a, b) => {
      if (a.key === "Other authors") return 1;
      if (b.key === "Other authors") return -1;
      if (a.key === "Untagged") return 1;
      if (b.key === "Untagged") return -1;
      return b.nodes.length - a.nodes.length || a.key.localeCompare(b.key);
    });
}

function captureCurrentNodePositions() {
  const positions = {};
  getRealNodes().forEach((node) => {
    positions[node.id()] = { ...node.position() };
  });
  return positions;
}

function getPositionsCenter(positions) {
  const values = Object.values(positions);
  if (!values.length) return { x: 0, y: 0 };
  return {
    x: values.reduce((sum, position) => sum + position.x, 0) / values.length,
    y: values.reduce((sum, position) => sum + position.y, 0) / values.length
  };
}

function getUniformAnchors(positions, anchor) {
  return Object.fromEntries(Object.keys(positions).map((id) => [id, { ...anchor }]));
}

function getCurrentTagIntersectionAnchors(positions) {
  const tagGroups = groupNodesForTagBackgrounds();
  const tagCenters = {};
  tagGroups.forEach((group) => {
    const groupPositions = group.nodes
      .map((node) => positions[node.id()] || node.position())
      .filter(Boolean);
    tagCenters[group.key] = getPositionsCenter(Object.fromEntries(groupPositions.map((position, index) => [index, position])));
  });

  const anchors = {};
  getRealNodes().forEach((node) => {
    const keys = getTagClusterKeys(node);
    const centers = keys.map((key) => tagCenters[key]).filter(Boolean);
    anchors[node.id()] = centers.length
      ? {
          x: centers.reduce((sum, center) => sum + center.x, 0) / centers.length,
          y: centers.reduce((sum, center) => sum + center.y, 0) / centers.length
        }
      : { ...node.position() };
  });
  return anchors;
}

function getVisibleTagKeysForIntersection() {
  const style = readClusterStyle();
  if (!style.useAllTags) return null;
  const counts = new Map();
  let hasOtherTags = false;
  getRealNodes().forEach((node) => {
    const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
    tags.map(normalizeClusterLabel).filter(Boolean).forEach((tag) => {
      counts.set(tag, (counts.get(tag) || 0) + 1);
    });
  });
  const visible = new Set(
    Array.from(counts.entries())
      .filter(([key, count]) => key === "Untagged" || count >= style.minTagSize)
      .map(([key]) => key)
  );
  getRealNodes().forEach((node) => {
    const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
    const normalizedTags = tags.map(normalizeClusterLabel).filter(Boolean);
    if (normalizedTags.length && !normalizedTags.some((tag) => visible.has(tag))) hasOtherTags = true;
  });
  if (hasOtherTags) visible.add("Other tags");
  if (!visible.size) visible.add("Untagged");
  return visible;
}

function getScaledClusterPositions() {
  const positions = {};
  Object.entries(clusterBasePositions || {}).forEach(([id, position]) => {
    const anchor = clusterSpacingAnchors?.[id] || position;
    positions[id] = {
      x: anchor.x + (position.x - anchor.x) * clusterSpacingFactor,
      y: anchor.y + (position.y - anchor.y) * clusterSpacingFactor
    };
  });
  return positions;
}

function getTagIntersectionClusterLayout() {
  return getGroupedClusterLayout("tags");
}

function captureMapViewport() {
  return {
    zoom: cy.zoom(),
    pan: { ...cy.pan() }
  };
}

function restoreMapViewport(viewport) {
  if (!viewport) return;
  cy.viewport({
    zoom: viewport.zoom,
    pan: viewport.pan
  });
  updateMapZoomControl();
}

function animateNodesToPositions(positions) {
  cy.batch(() => {
    getRealNodes().forEach((node) => {
      const position = positions[node.id()];
      if (!position) return;
      node.stop(true, true);
      node.animate({ position }, { duration: 450, easing: "ease-in-out" });
    });
  });
  window.setTimeout(() => {
    updateResizeOverlay();
    updateMapZoomControl();
  }, 480);
}

function setNodesToPositions(positions) {
  cy.batch(() => {
    getRealNodes().forEach((node) => {
      const position = positions[node.id()];
      if (!position) return;
      node.stop(true, true);
      node.position(position);
    });
  });
  updateResizeOverlay();
  updateMapZoomControl();
}

function getGroupedClusterLayout(mode) {
  const groups = groupNodesForCluster(mode);
  const centers = getClusterCenters(groups.length);
  const positions = {};
  const anchors = {};
  const centerByGroupKey = Object.fromEntries(groups.map((group, index) => [group.key, centers[index]]));
  groups.forEach((group, index) => {
    const center = centers[index];
    const radius = Math.max(120, Math.min(280, 46 * Math.sqrt(group.nodes.length) + 48));
    if (mode === "authors" && group.key === "Other authors") {
      const otherPositions = getLooseOtherAuthorPositions(group, center);
      Object.assign(positions, otherPositions);
      group.nodes.forEach((node) => {
        anchors[node.id()] = { ...otherPositions[node.id()] };
      });
      return;
    }
    if (mode === "authors") {
      const authorPositions = getCoauthorAwareAuthorPositions(group, center, radius, centerByGroupKey);
      Object.assign(positions, authorPositions);
      group.nodes.forEach((node) => {
        anchors[node.id()] = { ...center };
      });
      return;
    }
    group.nodes.forEach((node, nodeIndex) => {
      const angle = group.nodes.length === 1 ? 0 : (Math.PI * 2 * nodeIndex) / group.nodes.length;
      positions[node.id()] = {
        x: center.x + Math.cos(angle) * radius,
        y: center.y + Math.sin(angle) * radius
      };
      anchors[node.id()] = { ...center };
    });
  });
  return { positions, anchors };
}

function getLooseOtherAuthorPositions(group, center) {
  const positions = {};
  const nodes = group.nodes.slice().sort((a, b) => (a.data("label") || "").localeCompare(b.data("label") || ""));
  const count = nodes.length;
  if (!count) return positions;

  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const spacingX = 560;
  const spacingY = 460;
  const startX = center.x - ((columns - 1) * spacingX) / 2;
  const startY = center.y - ((rows - 1) * spacingY) / 2;

  nodes.forEach((node, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    positions[node.id()] = {
      x: startX + column * spacingX,
      y: startY + row * spacingY
    };
  });

  return positions;
}

function findNearestOpenAngleSlot(targetAngle, slotAngles, assignedSlots) {
  let bestSlot = 0;
  let bestDistance = Number.POSITIVE_INFINITY;
  slotAngles.forEach((angle, index) => {
    if (assignedSlots.has(index)) return;
    const distance = angleDistance(targetAngle, angle);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestSlot = index;
    }
  });
  return bestSlot;
}

function normalizeAngle(angle) {
  const full = Math.PI * 2;
  return ((angle % full) + full) % full;
}

function angleDistance(a, b) {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return Math.min(diff, Math.PI * 2 - diff);
}

function getCoauthorAwareAuthorPositions(group, center, radius, centerByGroupKey) {
  const groupKey = group.key;
  const count = group.nodes.length;
  const positions = {};
  if (count === 1) {
    positions[group.nodes[0].id()] = { ...center };
    return positions;
  }

  const slotAngles = Array.from({ length: count }, (_, index) => (Math.PI * 2 * index) / count);
  const assignedSlots = new Set();
  const nodePlans = group.nodes.map((node, nodeIndex) => {
    const externalVector = getExternalAuthorVector(node, groupKey, center, centerByGroupKey);
    const hasExternalAuthors = Math.abs(externalVector.x) + Math.abs(externalVector.y) > 0.001;
    return {
      node,
      nodeIndex,
      hasExternalAuthors,
      targetAngle: hasExternalAuthors ? normalizeAngle(Math.atan2(externalVector.y, externalVector.x)) : null,
      strength: Math.sqrt(externalVector.x * externalVector.x + externalVector.y * externalVector.y)
    };
  });

  nodePlans
    .filter((plan) => plan.hasExternalAuthors)
    .sort((a, b) => b.strength - a.strength)
    .forEach((plan) => {
      const slot = findNearestOpenAngleSlot(plan.targetAngle, slotAngles, assignedSlots);
      assignedSlots.add(slot);
      plan.slot = slot;
    });

  let nextOpenSlot = 0;
  nodePlans
    .filter((plan) => !plan.hasExternalAuthors)
    .sort((a, b) => a.nodeIndex - b.nodeIndex)
    .forEach((plan) => {
      while (assignedSlots.has(nextOpenSlot) && nextOpenSlot < count) nextOpenSlot += 1;
      plan.slot = nextOpenSlot;
      assignedSlots.add(nextOpenSlot);
    });

  nodePlans.forEach((plan) => {
    const angle = slotAngles[plan.slot] ?? ((Math.PI * 2 * plan.nodeIndex) / count);
    positions[plan.node.id()] = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
  });
  return positions;
}

function getExternalAuthorVector(node, groupKey, center, centerByGroupKey) {
  const vector = { x: 0, y: 0 };
  const authors = new Set(getAuthorClusterKeys(node));
  if (!authors.size) return vector;

  getRealNodes().forEach((other) => {
    if (other.id() === node.id() || other.data("type") !== "Publication") return;
    const otherPrimaryAuthor = getPrimaryAuthorClusterKey(other);
    if (!otherPrimaryAuthor || otherPrimaryAuthor === groupKey) return;
    const sharedAuthors = getAuthorClusterKeys(other).filter((author) => authors.has(author));
    if (!sharedAuthors.length) return;
    const otherCenter = centerByGroupKey[otherPrimaryAuthor];
    if (!otherCenter) return;
    const dx = otherCenter.x - center.x;
    const dy = otherCenter.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    vector.x += (dx / distance) * sharedAuthors.length;
    vector.y += (dy / distance) * sharedAuthors.length;
  });

  return vector;
}


function renderTagClusterBackgrounds(positions = captureCurrentNodePositions()) {
  const style = readClusterStyle();
  const useIntersectionMode = Boolean(style.useAllTags);
  if (useIntersectionMode) {
    removeClusterBackgrounds();
    if (bubbleSetsUnavailable) {
      renderEllipseTagClusterBackgrounds(positions, style, useIntersectionMode);
      return;
    }
    scheduleBubbleSetUpdate(positions);
    return;
  }
  removeBubbleSets();
  renderEllipseTagClusterBackgrounds(positions, style, useIntersectionMode);
}

function renderEllipseTagClusterBackgrounds(positions = captureCurrentNodePositions(), style = readClusterStyle(), useIntersectionMode = false) {
  const groups = getRenderableTagBackgroundGroups(groupNodesForTagBackgrounds(), positions, useIntersectionMode);
  const activeIds = new Set();
  const singleNodeGroupSlots = getSingleNodeGroupSlots(groups);

  cy.batch(() => {
    groups.forEach((group, index) => {
      const groupPositions = group.nodes
        .map((node) => positions[node.id()] || node.position())
        .filter(Boolean);
      if (!groupPositions.length) return;

      const bounds = getClusterBounds(groupPositions);
      const maxNodeSize = Math.max(...group.nodes.map((node) => getNodeSize(node)), DEFAULT_NODE_SIZE);
      const isSingleNodeGroup = group.nodes.length === 1;
      const padding = isSingleNodeGroup
        ? Math.max(useIntersectionMode ? 18 : 44, maxNodeSize * (useIntersectionMode ? 0.16 : 0.42))
        : Math.max(useIntersectionMode ? 30 : 105, (useIntersectionMode ? 16 : 48) * Math.sqrt(group.nodes.length));
      const minSize = isSingleNodeGroup
        ? Math.max(useIntersectionMode ? 104 : 170, maxNodeSize + padding * 2)
        : Math.max(useIntersectionMode ? 150 : 230, (useIntersectionMode ? 76 : 120) + (useIntersectionMode ? 26 : 48) * Math.sqrt(group.nodes.length));
      const position = isSingleNodeGroup
        ? { ...groupPositions[0] }
        : {
            x: (bounds.minX + bounds.maxX) / 2,
            y: (bounds.minY + bounds.maxY) / 2
          };
      const width = isSingleNodeGroup
        ? minSize
        : Math.max(minSize, bounds.maxX - bounds.minX + maxNodeSize + padding * 2);
      const height = isSingleNodeGroup
        ? minSize
        : Math.max(minSize, bounds.maxY - bounds.minY + maxNodeSize + padding * 2);
      const requiredRadius = groupPositions.reduce((maxDistance, groupPosition) => {
        const dx = groupPosition.x - position.x;
        const dy = groupPosition.y - position.y;
        return Math.max(maxDistance, Math.sqrt(dx * dx + dy * dy));
      }, 0) + maxNodeSize * (useIntersectionMode ? 0.46 : 0.62) + padding;
      const size = Math.max(width, height, requiredRadius * 2);
      const insideMargin = useIntersectionMode ? Math.max(16, maxNodeSize * 0.24) : 0;
      const clusterWidth = useIntersectionMode && !isSingleNodeGroup
        ? Math.max(width + insideMargin * 2, requiredRadius * 1.18)
        : size;
      const clusterHeight = useIntersectionMode && !isSingleNodeGroup
        ? Math.max(height + insideMargin * 2, requiredRadius * 1.18)
        : size;
      const id = `${CLUSTER_BACKGROUND_PREFIX}${makeSlug(group.key)}-${group.componentIndex || 0}-${index}`;
      activeIds.add(id);
      const existing = cy.getElementById(id);
      const labelOffset = getClusterLabelOffset(group, singleNodeGroupSlots);
      const data = {
        id,
        label: group.key,
        clusterBackground: true,
        size,
        clusterWidth,
        clusterHeight,
        textWidth: labelOffset.total > 1 ? 120 : Math.max(120, size - (useIntersectionMode ? 24 : 40)),
        nodeColor: style.circleColor,
        clusterCircleColor: style.circleColor,
        clusterBackgroundOpacity: useIntersectionMode ? 0.11 : 0.38,
        clusterBorderOpacity: useIntersectionMode ? 0.24 : 0.7,
        clusterTextColor: style.textColor,
        clusterTextSize: style.textSize,
        clusterTextMarginX: labelOffset.x,
        clusterTextMarginY: labelOffset.y,
        zIndex: -1000 - index
      };
      if (existing.length) {
        existing.unlock();
        existing.data(data);
        existing.position(position);
        existing.lock();
      } else {
        const background = cy.add({ group: "nodes", data, position });
        background.lock();
        background.unselectify();
        background.ungrabify();
      }
    });

    cy.nodes().filter((node) => node.data("clusterBackground") && !activeIds.has(node.id())).remove();
  });
}

function getRenderableTagBackgroundGroups(groups, positions, useIntersectionMode) {
  return groups.map((group) => ({ ...group, componentIndex: 0 }));
}

function splitTagGroupIntoSpatialComponents(nodes, positions) {
  const sortedNodes = nodes.slice().sort((a, b) => {
    const aPosition = positions[a.id()] || a.position();
    const bPosition = positions[b.id()] || b.position();
    return aPosition.x - bPosition.x || aPosition.y - bPosition.y;
  });
  const components = [];

  sortedNodes.forEach((node) => {
    const nodePosition = positions[node.id()] || node.position();
    const nodeSize = getNodeSize(node);
    const threshold = Math.max(760, nodeSize * 6.5);
    let bestComponent = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    components.forEach((component) => {
      const distance = getDistanceToComponent(nodePosition, component, positions);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestComponent = component;
      }
    });

    if (bestComponent && bestDistance <= threshold) {
      bestComponent.push(node);
    } else {
      components.push([node]);
    }
  });

  return components;
}

function getDistanceToComponent(position, component, positions) {
  return component.reduce((minDistance, node) => {
    const otherPosition = positions[node.id()] || node.position();
    const dx = position.x - otherPosition.x;
    const dy = position.y - otherPosition.y;
    return Math.min(minDistance, Math.sqrt(dx * dx + dy * dy));
  }, Number.POSITIVE_INFINITY);
}

function getSingleNodeGroupSlots(groups) {
  const counts = new Map();
  groups.forEach((group) => {
    if (group.nodes.length !== 1) return;
    const nodeId = group.nodes[0].id();
    counts.set(nodeId, (counts.get(nodeId) || 0) + 1);
  });

  const seen = new Map();
  const slots = new Map();
  groups.forEach((group) => {
    if (group.nodes.length !== 1) return;
    const nodeId = group.nodes[0].id();
    const slot = seen.get(nodeId) || 0;
    seen.set(nodeId, slot + 1);
    slots.set(group.key, { slot, total: counts.get(nodeId) || 1 });
  });
  return slots;
}

function getClusterLabelOffset(group, slots) {
  if (group.nodes.length !== 1) return { x: 0, y: -18, total: 1 };
  const slotInfo = slots.get(group.key) || { slot: 0, total: 1 };
  if (slotInfo.total <= 1) return { x: 0, y: -18, total: 1 };

  const center = (slotInfo.total - 1) / 2;
  return {
    x: (slotInfo.slot - center) * 145,
    y: -22 - Math.abs(slotInfo.slot - center) * 10,
    total: slotInfo.total
  };
}

function getClusterBounds(positions) {
  return positions.reduce((bounds, position) => ({
    minX: Math.min(bounds.minX, position.x),
    maxX: Math.max(bounds.maxX, position.x),
    minY: Math.min(bounds.minY, position.y),
    maxY: Math.max(bounds.maxY, position.y)
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY
  });
}

function removeClusterBackgrounds() {
  cy.nodes().filter((node) => node.data("clusterBackground")).remove();
  removeBubbleSets();
}

function scheduleBubbleSetUpdate(positionOverride = null) {
  if (!isBubbleSetModeActive()) {
    if (bubbleSetUpdateTimer) window.clearTimeout(bubbleSetUpdateTimer);
    bubbleSetUpdateTimer = null;
    removeBubbleSets();
    return;
  }
  if (bubbleSetsUnavailable) return;
  if (bubbleSetUpdateTimer) window.clearTimeout(bubbleSetUpdateTimer);
  bubbleSetUpdateTimer = window.setTimeout(() => {
    bubbleSetUpdateTimer = null;
    updateBubbleSets(positionOverride);
  }, BUBBLE_SET_CONFIG.debounceMs);
}

function isBubbleSetModeActive() {
  return currentClusterMode === "tags" && Boolean(readClusterStyle().useAllTags);
}

async function loadBubbleSetsModule() {
  if (bubbleSetsModule) return bubbleSetsModule;
  if (bubbleSetsUnavailable) return null;
  if (!bubbleSetsLoadPromise) {
    bubbleSetsLoadPromise = import(BUBBLE_SETS_CDN_URL)
      .then((module) => {
        bubbleSetsModule = module.default || module;
        return bubbleSetsModule;
      })
      .catch((error) => {
        bubbleSetsLoadPromise = null;
        bubbleSetsUnavailable = true;
        if (!bubbleSetFallbackWarned) {
          console.warn("Bubble Sets library could not be loaded. Falling back to ellipse tag backgrounds.", error);
          bubbleSetFallbackWarned = true;
        }
        return null;
      });
  }
  return bubbleSetsLoadPromise;
}

async function updateBubbleSets(positionOverride = null) {
  if (!isBubbleSetModeActive() || !tagBubbleOverlay) {
    removeBubbleSets();
    return;
  }

  const module = await loadBubbleSetsModule();
  if (!isBubbleSetModeActive()) return;
  if (!module) {
    renderEllipseTagClusterBackgrounds(positionOverride || captureCurrentNodePositions(), readClusterStyle(), true);
    return;
  }

  const contours = buildTagBubbleContours(module);
  if (!contours.length) {
    removeBubbleSets();
    return;
  }
  renderTagBubblePaths(contours);
}

function buildTagBubbleContours(module) {
  const membership = buildTagMembershipMap();
  const allNodes = getVisibleBubbleNodes();
  const contours = [];
  membership.forEach((memberNodes, tag) => {
    if (memberNodes.length < BUBBLE_SET_CONFIG.minMembers) return;
    const memberIds = new Set(memberNodes.map((node) => node.id()));
    const obstacleNodes = allNodes.filter((node) => !memberIds.has(node.id()));
    const memberRects = memberNodes.map((node) => getNodeRenderedRect(node, BUBBLE_SET_CONFIG.nodePadding)).filter(Boolean);
    if (!memberRects.length) return;
    const pathData = generateValidatedBubbleContourPath(module, memberRects, memberNodes, obstacleNodes);
    if (!pathData) return;
    contours.push({
      tag,
      componentIndex: 0,
      pathData,
      color: getClusterTagColor(tag, memberNodes)
    });
  });
  return contours;
}

function splitBubbleMemberComponents(memberNodes) {
  if (memberNodes.length <= 1) return [memberNodes];
  const nodeEntries = memberNodes
    .map((node) => ({ node, center: getNodeRenderedCenter(node), size: getNodeSize(node) }))
    .filter((entry) => entry.center);
  const remaining = new Set(nodeEntries.map((entry) => entry.node.id()));
  const byId = new Map(nodeEntries.map((entry) => [entry.node.id(), entry]));
  const components = [];

  nodeEntries.forEach((entry) => {
    if (!remaining.has(entry.node.id())) return;
    const queue = [entry];
    const component = [];
    remaining.delete(entry.node.id());

    while (queue.length) {
      const current = queue.shift();
      component.push(current.node);
      Array.from(remaining).forEach((candidateId) => {
        const candidate = byId.get(candidateId);
        if (!candidate) return;
        const threshold = BUBBLE_SET_CONFIG.componentDistance + Math.max(current.size, candidate.size) * 1.15;
        if (getPointDistance(current.center, candidate.center) > threshold) return;
        remaining.delete(candidateId);
        queue.push(candidate);
      });
    }

    components.push(component);
  });

  return components.length ? components : [memberNodes];
}

function getNodeRenderedCenter(node) {
  const rect = getNodeRenderedRect(node, 0);
  if (!rect) return null;
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

function getPointDistance(left, right) {
  const dx = right.x - left.x;
  const dy = right.y - left.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildTagMembershipMap() {
  const membership = new Map();
  const visibleTagKeys = getVisibleTagKeysForIntersection();
  getVisibleBubbleNodes().forEach((node) => {
    getTagClusterKeys(node).forEach((tag) => {
      if (!visibleTagKeys.has(tag) || tag === "Untagged" || tag === "Other tags") return;
      if (!membership.has(tag)) membership.set(tag, []);
      membership.get(tag).push(node);
    });
  });
  return membership;
}

function getVisibleBubbleNodes() {
  return getRealNodes().filter((node) => node.visible() && !node.removed()).toArray();
}

function getNodeRenderedRect(node, padding = 0) {
  if (!node || !node.length || node.removed() || !node.visible()) return null;
  const box = node.renderedBoundingBox({ includeLabels: true, includeOverlays: false });
  if (!Number.isFinite(box.x1) || !Number.isFinite(box.y1) || !Number.isFinite(box.w) || !Number.isFinite(box.h)) return null;
  return {
    x: box.x1 - padding,
    y: box.y1 - padding,
    width: box.w + padding * 2,
    height: box.h + padding * 2
  };
}

function generateValidatedBubbleContourPath(module, memberRects, memberNodes, obstacleNodes) {
  let lastPath = "";
  for (let retry = 0; retry <= BUBBLE_SET_CONFIG.maxObstacleRetries; retry += 1) {
    const obstaclePadding = BUBBLE_SET_CONFIG.obstaclePadding + retry * BUBBLE_SET_CONFIG.obstacleRetryPaddingStep;
    const obstacleRects = obstacleNodes.map((node) => getNodeRenderedRect(node, obstaclePadding)).filter(Boolean);
    const virtualEdges = buildBubbleVirtualEdges(memberNodes, memberRects);
    const pathData = generateBubbleContourPath(module, memberRects, obstacleRects, virtualEdges);
    if (!pathData) continue;
    lastPath = pathData;
    if (!contourContainsNonmemberFootprints(pathData, obstacleNodes)) return pathData;
  }
  if (lastPath && !contourContainsNonmemberFootprints(lastPath, obstacleNodes)) return lastPath;
  return generateStrictMemberEnvelopePath(memberRects);
}

function generateBubbleContourPath(module, memberRects, obstacleRects, virtualEdges = []) {
  return generateModernBubbleSetPath(module, memberRects, obstacleRects, virtualEdges)
    || generateLegacyBubbleSetPath(module, memberRects, obstacleRects, virtualEdges)
    || generateFallbackHullPath(memberRects);
}

function generateModernBubbleSetPath(module, memberRects, obstacleRects, virtualEdges = []) {
  const BubbleSetCtor = module.BubbleSet || module.default?.BubbleSet;
  if (!BubbleSetCtor) return "";
  try {
    const bubbleSet = new BubbleSetCtor();
    const outline = bubbleSet.createOutline(memberRects, obstacleRects, virtualEdges);
    return bubbleOutlineToPath(module, outline);
  } catch (error) {
    if (DEBUG_BUBBLE_SETS) console.warn("Modern Bubble Sets contour failed.", error);
    return "";
  }
}

function generateLegacyBubbleSetPath(module, memberRects, obstacleRects, virtualEdges = []) {
  const namespace = module.BubbleSets ? module : module.default || module;
  const BubbleSetsCtor = namespace.BubbleSets;
  const rectFactory = namespace.rect || namespace.Rect;
  if (!BubbleSetsCtor || !rectFactory) return "";
  try {
    const bubbleSets = new BubbleSetsCtor();
    memberRects.forEach((rect) => bubbleSets.pushMember(rectFactory(rect.x, rect.y, rect.width, rect.height)));
    obstacleRects.forEach((rect) => {
      if (typeof bubbleSets.pushNonMember === "function") {
        bubbleSets.pushNonMember(rectFactory(rect.x, rect.y, rect.width, rect.height));
      } else if (typeof bubbleSets.pushObstacle === "function") {
        bubbleSets.pushObstacle(rectFactory(rect.x, rect.y, rect.width, rect.height));
      }
    });
    virtualEdges.forEach((edge) => {
      if (typeof bubbleSets.pushEdge === "function") bubbleSets.pushEdge(edge);
    });
    const outline = bubbleSets.compute();
    return bubbleOutlineToPath(namespace, outline);
  } catch (error) {
    if (DEBUG_BUBBLE_SETS) console.warn("Legacy Bubble Sets contour failed.", error);
    return "";
  }
}

function buildBubbleVirtualEdges(memberNodes, memberRects) {
  if (memberRects.length <= 1) return [];
  const entries = memberNodes
    .map((node, index) => ({ node, rect: memberRects[index], center: getRectCenter(memberRects[index]) }))
    .filter((entry) => entry.rect && entry.center);
  if (entries.length <= 1) return [];

  const connected = [entries[0]];
  const remaining = entries.slice(1);
  const edges = [];
  while (remaining.length) {
    let best = null;
    connected.forEach((left) => {
      remaining.forEach((right, index) => {
        const distance = getPointDistance(left.center, right.center);
        if (!best || distance < best.distance) best = { left, right, index, distance };
      });
    });
    if (!best) break;
    if (best.distance <= BUBBLE_SET_CONFIG.virtualEdgeMaxDistance) {
      edges.push(makeBubbleVirtualEdge(best.left.center, best.right.center));
    }
    connected.push(best.right);
    remaining.splice(best.index, 1);
  }
  return edges;
}

function getRectCenter(rect) {
  if (!rect) return null;
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  };
}

function makeBubbleVirtualEdge(source, target) {
  return {
    x1: source.x,
    y1: source.y,
    x2: target.x,
    y2: target.y,
    source,
    target
  };
}

function contourContainsNonmemberFootprints(pathData, obstacleNodes) {
  const path = getReusableBubbleProbePath();
  if (!path || typeof path.isPointInFill !== "function") return false;
  path.setAttribute("d", pathData);
  return obstacleNodes.some((node) => {
    const rect = getNodeRenderedRect(node, 2);
    if (!rect) return false;
    return getRectProbePoints(rect).some((point) => {
      const domPoint = typeof DOMPoint === "function" ? new DOMPoint(point.x, point.y) : tagBubbleOverlay.createSVGPoint();
      if (!("x" in domPoint)) return false;
      domPoint.x = point.x;
      domPoint.y = point.y;
      return path.isPointInFill(domPoint);
    });
  });
}

function getRectProbePoints(rect) {
  const insetX = Math.min(10, rect.width * 0.22);
  const insetY = Math.min(10, rect.height * 0.22);
  return [
    { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 },
    { x: rect.x + insetX, y: rect.y + insetY },
    { x: rect.x + rect.width - insetX, y: rect.y + insetY },
    { x: rect.x + insetX, y: rect.y + rect.height - insetY },
    { x: rect.x + rect.width - insetX, y: rect.y + rect.height - insetY }
  ];
}

function getReusableBubbleProbePath() {
  if (!tagBubbleOverlay) return null;
  let path = tagBubbleOverlay.querySelector("[data-bubble-probe]");
  if (!path) {
    path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("data-bubble-probe", "true");
    path.setAttribute("fill", "black");
    path.setAttribute("opacity", "0");
    tagBubbleOverlay.appendChild(path);
  }
  return path;
}

function bubbleOutlineToPath(module, outline) {
  if (!outline) return "";
  if (typeof outline === "string") return outline;
  if (typeof outline.sample === "function" || typeof outline.bSplines === "function") {
    try {
      let path = outline;
      if (typeof path.sample === "function") path = path.sample(8);
      if (typeof path.simplify === "function") path = path.simplify(BUBBLE_SET_CONFIG.simplifyTolerance);
      if (typeof path.bSplines === "function") path = path.bSplines();
      if (typeof path.simplify === "function") path = path.simplify(BUBBLE_SET_CONFIG.simplifyTolerance);
      const pathString = path.toString();
      if (/^[MLCQZmlcqz]/.test(pathString.trim())) return pathString;
    } catch (error) {
      if (DEBUG_BUBBLE_SETS) console.warn("Bubble Sets path object conversion failed.", error);
    }
  }
  if (typeof outline.toString === "function") {
    const asString = outline.toString();
    if (/^[MLCQZmlcqz]/.test(asString.trim())) return asString;
  }

  try {
    const PointPath = module.PointPath || module.default?.PointPath;
    if (PointPath && Array.isArray(outline)) {
      let path = typeof PointPath.fromlist === "function" ? PointPath.fromlist(outline) : new PointPath(outline);
      if (typeof path.sample === "function") path = path.sample(8);
      if (typeof path.simplify === "function") path = path.simplify(BUBBLE_SET_CONFIG.simplifyTolerance);
      if (typeof path.bSplines === "function") path = path.bSplines();
      if (typeof path.simplify === "function") path = path.simplify(BUBBLE_SET_CONFIG.simplifyTolerance);
      const pathString = path.toString();
      if (/^[MLCQZmlcqz]/.test(pathString.trim())) return pathString;
    }
  } catch (error) {
    if (DEBUG_BUBBLE_SETS) console.warn("Bubble Sets path conversion failed.", error);
  }

  return pointsToSvgPath(normalizeBubblePoints(outline));
}

function normalizeBubblePoints(outline) {
  if (!Array.isArray(outline)) return [];
  return outline
    .map((point) => {
      if (Array.isArray(point)) return { x: Number(point[0]), y: Number(point[1]) };
      return { x: Number(point.x ?? point.px ?? point.X), y: Number(point.y ?? point.py ?? point.Y) };
    })
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function pointsToSvgPath(points) {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return `M ${first.x.toFixed(1)} ${first.y.toFixed(1)} ${rest.map((point) => `L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ")} Z`;
}

function generateFallbackHullPath(rects) {
  const points = rects.flatMap((rect) => [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ]);
  return pointsToSvgPath(getConvexHull(points));
}

function generateStrictMemberEnvelopePath(rects) {
  if (!rects.length) return "";
  if (rects.length === 1) {
    const rect = expandRect(rects[0], 18);
    return roundedRectPath(rect, Math.min(26, Math.max(12, Math.min(rect.width, rect.height) * 0.24)));
  }
  const center = getRectsCenter(rects);
  const points = rects.flatMap((rect) => getExpandedRectCornerPoints(rect, center, 24));
  return pointsToSvgPath(getConvexHull(points));
}

function expandRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2
  };
}

function getRectsCenter(rects) {
  const centers = rects.map(getRectCenter).filter(Boolean);
  if (!centers.length) return { x: 0, y: 0 };
  return {
    x: centers.reduce((sum, point) => sum + point.x, 0) / centers.length,
    y: centers.reduce((sum, point) => sum + point.y, 0) / centers.length
  };
}

function getExpandedRectCornerPoints(rect, center, padding) {
  const corners = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height }
  ];
  return corners.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    const distance = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: point.x + (dx / distance) * padding,
      y: point.y + (dy / distance) * padding
    };
  });
}

function roundedRectPath(rect, radius) {
  const x = rect.x;
  const y = rect.y;
  const width = rect.width;
  const height = rect.height;
  const r = Math.min(radius, width / 2, height / 2);
  const right = x + width;
  const bottom = y + height;
  return [
    `M ${Number(x + r).toFixed(1)} ${Number(y).toFixed(1)}`,
    `L ${Number(right - r).toFixed(1)} ${Number(y).toFixed(1)}`,
    `Q ${Number(right).toFixed(1)} ${Number(y).toFixed(1)} ${Number(right).toFixed(1)} ${Number(y + r).toFixed(1)}`,
    `L ${Number(right).toFixed(1)} ${Number(bottom - r).toFixed(1)}`,
    `Q ${Number(right).toFixed(1)} ${Number(bottom).toFixed(1)} ${Number(right - r).toFixed(1)} ${Number(bottom).toFixed(1)}`,
    `L ${Number(x + r).toFixed(1)} ${Number(bottom).toFixed(1)}`,
    `Q ${Number(x).toFixed(1)} ${Number(bottom).toFixed(1)} ${Number(x).toFixed(1)} ${Number(bottom - r).toFixed(1)}`,
    `L ${Number(x).toFixed(1)} ${Number(y + r).toFixed(1)}`,
    `Q ${Number(x).toFixed(1)} ${Number(y).toFixed(1)} ${Number(x + r).toFixed(1)} ${Number(y).toFixed(1)} Z`
  ].join(" ");
}

function getConvexHull(points) {
  const sorted = points
    .slice()
    .sort((a, b) => a.x - b.x || a.y - b.y)
    .filter((point, index, array) => index === 0 || point.x !== array[index - 1].x || point.y !== array[index - 1].y);
  if (sorted.length <= 1) return sorted;
  const cross = (origin, a, b) => (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x);
  const lower = [];
  sorted.forEach((point) => {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop();
    lower.push(point);
  });
  const upper = [];
  sorted.slice().reverse().forEach((point) => {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop();
    upper.push(point);
  });
  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

function getClusterTagColor(tag, memberNodes) {
  const firstNodeColor = memberNodes.find((node) => node.data("nodeColor"))?.data("nodeColor");
  return firstNodeColor || readClusterStyle().circleColor || DEFAULT_CLUSTER_STYLE.circleColor;
}

function renderTagBubblePaths(contours) {
  if (!tagBubbleOverlay) return;
  const canvasWrap = mapWorkspace.querySelector(".canvas-wrap");
  const rect = canvasWrap?.getBoundingClientRect();
  if (rect) {
    tagBubbleOverlay.setAttribute("viewBox", `0 0 ${Math.max(1, rect.width)} ${Math.max(1, rect.height)}`);
  }
  tagBubbleOverlay.replaceChildren();
  contours.forEach((contour) => {
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "tag-bubble-path");
    path.setAttribute("d", contour.pathData);
    path.setAttribute("fill", contour.color);
    path.setAttribute("fill-opacity", String(BUBBLE_SET_CONFIG.fillOpacity));
    path.setAttribute("stroke", contour.color);
    path.setAttribute("stroke-opacity", String(BUBBLE_SET_CONFIG.strokeOpacity));
    path.setAttribute("stroke-width", String(BUBBLE_SET_CONFIG.strokeWidth));
    tagBubbleOverlay.appendChild(path);
    const label = makeTagBubbleLabel(contour, path);
    if (label) tagBubbleOverlay.appendChild(label);
  });
}

function makeTagBubbleLabel(contour, path) {
  if (!path || typeof path.getBBox !== "function") return null;
  let box = null;
  try {
    box = path.getBBox();
  } catch (error) {
    return null;
  }
  if (!box || !Number.isFinite(box.x) || !Number.isFinite(box.y)) return null;
  const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
  text.setAttribute("class", "tag-bubble-label");
  text.setAttribute("x", String(box.x + box.width / 2));
  text.setAttribute("y", String(Math.max(14, box.y - 8)));
  text.setAttribute("text-anchor", "middle");
  text.textContent = contour.tag;
  return text;
}

function removeBubbleSets() {
  if (bubbleSetUpdateTimer) window.clearTimeout(bubbleSetUpdateTimer);
  bubbleSetUpdateTimer = null;
  if (tagBubbleOverlay) tagBubbleOverlay.replaceChildren();
}

function getPrimaryTagClusterKey(node) {
  const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
  return normalizeClusterLabel(tags[0]) || "Untagged";
}

function getTagClusterKeys(node, options = {}) {
  const useAllTags = options.useAllTags === true;
  const tags = Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || "");
  const normalizedTags = tags.map(normalizeClusterLabel).filter(Boolean);
  if (useAllTags) return normalizedTags.length ? Array.from(new Set(normalizedTags)) : ["Untagged"];
  return [normalizedTags[0] || "Untagged"];
}

function groupNodesForTagBackgrounds() {
  const style = readClusterStyle();
  const grouped = new Map();
  getRealNodes().forEach((node) => {
    getTagClusterKeys(node, { useAllTags: style.useAllTags }).forEach((key) => {
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(node);
    });
  });

  return Array.from(grouped.entries())
    .map(([key, nodes]) => ({ key, nodes }))
    .sort((a, b) => b.nodes.length - a.nodes.length || a.key.localeCompare(b.key));
}

function getPrimaryAuthorClusterKey(node) {
  if (node.data("type") !== "Publication") return "Ideas / Other";
  const authors = getAuthorClusterKeys(node);
  if (!authors.length) return "Unknown Author";
  const authorCounts = getAuthorPublicationCounts();
  const threshold = readClusterStyle().authorThreshold;
  const qualifiedAuthors = authors
    .map((author) => ({ author, count: authorCounts.get(author) || 0 }))
    .filter((entry) => entry.count >= threshold)
    .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author));

  if (!qualifiedAuthors.length) return "Other authors";

  const highestCount = qualifiedAuthors[0].count;
  const strongestAuthors = qualifiedAuthors
    .filter((entry) => entry.count === highestCount)
    .map((entry) => entry.author)
    .sort((a, b) => a.localeCompare(b));

  return strongestAuthors.length === 1 ? strongestAuthors[0] : strongestAuthors.join(" + ");
}

function getAuthorClusterKeys(node) {
  if (node.data("type") !== "Publication") return ["Ideas / Other"];
  const authors = node.data("zotero")?.authors || node.data("authors") || [];
  const normalizedAuthors = (Array.isArray(authors) ? authors : [authors])
    .map(normalizeAuthorNameForCluster)
    .filter(Boolean);
  return normalizedAuthors.length ? Array.from(new Set(normalizedAuthors)) : ["Unknown Author"];
}

function getAuthorPublicationCounts() {
  const counts = new Map();
  getRealNodes().forEach((node) => {
    if (node.data("type") !== "Publication") return;
    getAuthorClusterKeys(node).forEach((author) => {
      counts.set(author, (counts.get(author) || 0) + 1);
    });
  });
  return counts;
}

function normalizeClusterLabel(value) {
  return String(value || "").trim();
}

function normalizeAuthorNameForCluster(value) {
  let name = normalizeClusterLabel(value);
  if (!name) return "";

  if (name.includes(",")) {
    const parts = name.split(",").map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) name = `${parts.slice(1).join(" ")} ${parts[0]}`;
  }

  const cleaned = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned
    .split(/\s+/)
    .map((token) => token.replace(/^[^A-Za-z]+|[^A-Za-z.'-]+$/g, ""))
    .filter(Boolean)
    .filter((token) => !/^(jr|sr|ii|iii|iv|phd|md)$/i.test(token));

  if (!tokens.length) return "";
  if (tokens.length === 1) return toDisplayAuthorToken(tokens[0]);

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  return `${toDisplayAuthorToken(first)} ${toDisplayAuthorToken(last)}`;
}

function toDisplayAuthorToken(token) {
  return String(token || "")
    .replace(/\.+$/g, "")
    .split("-")
    .map((part) => part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part)
    .join("-");
}

function makeSlug(value) {
  return String(value || "cluster")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "cluster";
}

function getClusterCenters(count) {
  const extent = cy.extent();
  const width = Math.max(900, extent.x2 - extent.x1);
  const height = Math.max(640, extent.y2 - extent.y1);
  const columns = Math.max(1, Math.ceil(Math.sqrt(count)));
  const rows = Math.max(1, Math.ceil(count / columns));
  const xGap = width / columns;
  const yGap = height / rows;
  const startX = extent.x1 + xGap / 2;
  const startY = extent.y1 + yGap / 2;

  return Array.from({ length: count }, (_, index) => ({
    x: startX + (index % columns) * xGap,
    y: startY + Math.floor(index / columns) * yGap
  }));
}

function getConnectionClusterLayout() {
  const nodes = getRealNodes().sort((a, b) => b.connectedEdges().length - a.connectedEdges().length || (a.data("label") || "").localeCompare(b.data("label") || ""));
  const extent = cy.extent();
  const center = {
    x: (extent.x1 + extent.x2) / 2,
    y: (extent.y1 + extent.y2) / 2
  };
  const maxDegree = Math.max(1, ...nodes.map((node) => node.connectedEdges().length));
  const outerRadius = Math.max(300, Math.min(820, Math.max(extent.x2 - extent.x1, extent.y2 - extent.y1) * 0.4));
  const positions = {};
  const anchors = {};

  nodes.forEach((node, index) => {
    const degree = node.connectedEdges().length;
    const angle = nodes.length === 1 ? 0 : (Math.PI * 2 * index) / nodes.length;
    const centrality = degree / maxDegree;
    const radius = outerRadius * (1 - centrality) + 80;
    positions[node.id()] = {
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius
    };
    anchors[node.id()] = { ...center };
  });
  return { positions, anchors };
}

function setActiveDocumentNode(node) {
  activeDocumentTarget = { type: "node", id: node.id() };
  activeDocumentNodeId = node.id();
  activeOutlineView = getOutlineViewValueForType(node.data("type") || getDefaultNodeTypeName());
  if (!node.data("documentHtml")) node.data("documentHtml", getDefaultDocumentHtml(node));
  updateDocumentPrimaryTagControl();
  renderDocumentOutline();
  loadActiveDocumentSection();
}

function setActiveDocumentEdge(edge) {
  activeDocumentTarget = { type: "edge", id: edge.id() };
  activeDocumentNodeId = null;
  activeOutlineView = "connections";
  updateDocumentPrimaryTagControl();
  renderDocumentOutline();
  loadActiveDocumentSection();
}

function renderDocumentOutline() {
  updateDocumentPrimaryTagControl();
  const nodes = cy.nodes().sort((a, b) => (a.data("label") || "").localeCompare(b.data("label") || ""));
  const edges = getDocumentConnections();
  documentOutlineList.innerHTML = "";
  activeOutlineView = getValidOutlineView(activeOutlineView);
  renderOutlineViewSelect();
  outlineViewSelect.value = activeOutlineView;

  if (activeOutlineView === "connections") {
    appendTaggedConnectionOutlineGroups(edges);
    return;
  }

  const selectedType = getTypeFromOutlineView(activeOutlineView);
  appendTaggedNodeOutlineGroup(selectedType || "Nodes", nodes.filter((node) => node.data("type") === selectedType));
}

function openSearchPanel() {
  closeToolbarMenus();
  renderSearchResults();
  searchPanel.hidden = false;
  window.setTimeout(() => {
    appSearchInput.focus();
    appSearchInput.select();
  }, 0);
}

function closeSearchPanelView() {
  searchPanel.hidden = true;
}

function closeToolbarMenus() {
  document.querySelectorAll(".toolbar-menu[open]").forEach((menu) => {
    menu.open = false;
  });
}

function renderSearchResults() {
  const query = appSearchInput.value.trim();
  searchResultsList.innerHTML = "";
  if (!query) {
    appendSearchEmptyState("Type to search nodes, connections, notes, citations, URLs, and tags.");
    searchPanelStatus.textContent = "Find nodes, connections, notes, citations, URLs, and tags.";
    return;
  }

  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = buildSearchIndex()
    .map((item) => ({ ...item, score: scoreSearchItem(item, terms), snippet: getSearchSnippet(item.searchText, terms[0]) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, 80);

  searchPanelStatus.textContent = `${results.length} result${results.length === 1 ? "" : "s"} for "${query}".`;
  if (!results.length) {
    appendSearchEmptyState("No matching nodes, connections, or notes.");
    return;
  }

  results.forEach((result) => appendSearchResult(result));
}

function buildSearchIndex() {
  const nodeItems = getRealNodes().map((node) => {
    const type = node.data("type") || "Node";
    const publicationNotes = normalizePublicationNotes(node.data("publicationNotes"));
    const title = node.data("label") || "Untitled node";
    const tags = Array.isArray(node.data("tags")) ? node.data("tags").join(", ") : "";
    const documentText = htmlToPlainText(type === "Publication" ? publicationNotes.notesHtml : node.data("documentHtml"));
    const fields = [
      title,
      type,
      node.data("url") || "",
      tags,
      publicationNotes.citation || "",
      publicationNotes.abstract || "",
      publicationNotes.url || "",
      publicationNotes.notes || "",
      documentText
    ];
    return {
      kind: "node",
      id: node.id(),
      title,
      meta: `${type}${tags ? ` Â· ${tags}` : ""}`,
      color: getNodeColorForType(type),
      searchText: fields.filter(Boolean).join("\n")
    };
  });

  const edgeItems = cy.edges().map((edge) => {
    const title = getConnectionShortTitle(edge);
    const tags = Array.isArray(edge.data("tags")) ? edge.data("tags").join(", ") : "";
    const notesText = edge.data("notes") || htmlToPlainText(edge.data("notesHtml"));
    const from = edge.source().data("label") || edge.data("source") || "";
    const to = edge.target().data("label") || edge.data("target") || "";
    return {
      kind: "edge",
      id: edge.id(),
      title,
      meta: `Connection${tags ? ` Â· ${tags}` : ""}`,
      color: edge.data("lineColor") || "#7c3aed",
      searchText: [title, "Connection", tags, notesText, from, to].filter(Boolean).join("\n")
    };
  });

  return [...nodeItems, ...edgeItems];
}

function scoreSearchItem(item, terms) {
  const haystack = item.searchText.toLowerCase();
  const title = item.title.toLowerCase();
  let score = 0;
  for (const term of terms) {
    if (!haystack.includes(term)) return 0;
    score += title.includes(term) ? 8 : 2;
  }
  if (title.includes(terms.join(" "))) score += 8;
  return score;
}

function appendSearchResult(result) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "search-result-row";
  button.style.borderLeftColor = result.color;
  button.dataset.resultKind = result.kind;
  button.dataset.resultId = result.id;

  const meta = document.createElement("span");
  meta.className = "search-result-meta";
  meta.textContent = result.meta;
  const title = document.createElement("span");
  title.className = "search-result-title";
  title.textContent = result.title;
  const snippet = document.createElement("span");
  snippet.className = "search-result-snippet";
  snippet.textContent = result.snippet;

  button.append(meta, title, snippet);
  button.addEventListener("click", () => {
    searchResultsList.querySelectorAll(".active-result").forEach((row) => row.classList.remove("active-result"));
    button.classList.add("active-result");
    openSearchResult(result);
  });
  searchResultsList.appendChild(button);
}

function appendSearchEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "search-empty-state";
  empty.textContent = message;
  searchResultsList.appendChild(empty);
}

function getSearchSnippet(text, term) {
  const compact = String(text || "").replace(/\s+/g, " ").trim();
  if (!compact) return "No searchable note text yet.";
  const lower = compact.toLowerCase();
  const index = term ? lower.indexOf(term.toLowerCase()) : -1;
  const start = index >= 0 ? Math.max(0, index - 70) : 0;
  const end = Math.min(compact.length, start + 180);
  return `${start > 0 ? "... " : ""}${compact.slice(start, end)}${end < compact.length ? " ..." : ""}`;
}

function htmlToPlainText(html) {
  if (!html) return "";
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.textContent || container.innerText || "";
}

function openSearchResult(result) {
  closeSearchPanelView();
  if (result.kind === "node") {
    const node = cy.getElementById(result.id);
    if (!node || !node.length || node.removed()) return;
    cy.$(":selected").unselect();
    selectNode(node);
    setActiveDocumentNode(node);
    centerMapOnElement(node);
    setStatus(`Opened search result: ${node.data("label") || "Untitled node"}.`);
    return;
  }

  const edge = cy.getElementById(result.id);
  if (!edge || !edge.length || edge.removed()) return;
  selectEdge(edge);
  setActiveDocumentEdge(edge);
  centerMapOnElement(edge);
  setStatus(`Opened search result: ${getConnectionShortTitle(edge)}.`);
}

function centerMapOnElement(element) {
  if (!element || !element.length || !cy || mapWorkspace.hidden && currentView === "document") return;
  cy.animate({ center: { eles: element }, duration: 260 });
}

function appendTaggedNodeOutlineGroup(title, nodes) {
  if (!nodes.length) {
    appendOutlineEmptyState(`No ${title.toLowerCase()}.`);
    return;
  }
  const groups = groupNodesByDocumentTag(nodes);
  groups.forEach((group) => {
    appendOutlineSectionTitle(`${group.tag} (${group.nodes.length})`);
    appendNodeOutlineItems(group.nodes);
  });
}

function groupNodesByDocumentTag(nodes) {
  const grouped = new Map();
  nodes.forEach((node) => {
    const tag = getDocumentGroupTag(node);
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag).push(node);
  });
  return Array.from(grouped.entries())
    .map(([tag, groupNodes]) => ({ tag, nodes: groupNodes.sort((a, b) => (a.data("label") || "").localeCompare(b.data("label") || "")) }))
    .sort((a, b) => {
      if (a.tag === "Untagged") return 1;
      if (b.tag === "Untagged") return -1;
      return a.tag.localeCompare(b.tag);
    });
}

function appendNodeOutlineItems(nodes) {
  nodes.forEach((node) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "outline-item";
    button.dataset.type = node.data("type") || "Idea";
    button.style.borderLeftColor = getNodeColorForType(node.data("type"));
    button.textContent = node.data("label") || "Untitled";
    button.classList.toggle("active-section", activeDocumentTarget?.type === "node" && node.id() === activeDocumentTarget.id);
    button.addEventListener("click", () => {
      cy.$(":selected").unselect();
      node.select();
      selectNode(node);
      setActiveDocumentNode(node);
    });
    documentOutlineList.appendChild(button);
  });
}

function appendOutlineSectionTitle(title) {
  const heading = document.createElement("div");
  heading.className = "outline-section-title";
  heading.textContent = title;
  documentOutlineList.appendChild(heading);
}

function appendTaggedConnectionOutlineGroups(edges) {
  if (!edges.length) {
    appendOutlineEmptyState("No matching connections.");
    return;
  }

  const groups = groupConnectionsByDocumentTag(edges);
  groups.forEach((group) => {
    appendOutlineSectionTitle(`${group.tag} (${group.edges.length})`);
    appendConnectionOutlineItems(group.edges);
  });
}

function groupConnectionsByDocumentTag(edges) {
  const grouped = new Map();
  edges.forEach((edge) => {
    const tag = getConnectionDocumentTag(edge);
    if (!grouped.has(tag)) grouped.set(tag, []);
    grouped.get(tag).push(edge);
  });
  return Array.from(grouped.entries())
    .map(([tag, groupEdges]) => ({ tag, edges: groupEdges }))
    .sort((a, b) => {
      if (a.tag === "Untagged") return 1;
      if (b.tag === "Untagged") return -1;
      return a.tag.localeCompare(b.tag);
    });
}

function appendConnectionOutlineItems(edges) {
  edges.forEach((edge) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "outline-item";
    button.dataset.type = "Connection";
    button.textContent = getConnectionShortTitle(edge);
    button.classList.toggle("active-section", activeDocumentTarget?.type === "edge" && edge.id() === activeDocumentTarget.id);
    button.addEventListener("click", () => {
      selectEdge(edge);
      setActiveDocumentEdge(edge);
    });
    documentOutlineList.appendChild(button);
  });
}

function getDocumentConnections() {
  return cy.edges()
    .filter((edge) => !isPublicationPublicationEdge(edge))
    .sort((a, b) => getEdgeTitle(a).localeCompare(getEdgeTitle(b)) || a.id().localeCompare(b.id()));
}

function getConnectionShortTitle(edge) {
  if (isPublicationPublicationEdge(edge)) return "Citation connection";
  const edges = getNumberedConnections();
  const index = edges.findIndex((item) => item.id() === edge.id());
  return `Connection ${index >= 0 ? index + 1 : getFallbackConnectionNumber(edge)}`;
}

function getNumberedConnections() {
  return cy.edges()
    .filter((edge) => !isPublicationPublicationEdge(edge))
    .sort((a, b) => getEdgeTitle(a).localeCompare(getEdgeTitle(b)) || a.id().localeCompare(b.id()));
}

function getFallbackConnectionNumber(edge) {
  const allEdges = cy.edges().sort((a, b) => a.id().localeCompare(b.id()));
  const index = allEdges.findIndex((item) => item.id() === edge.id());
  return index >= 0 ? index + 1 : allEdges.length + 1;
}

function getConnectionDocumentTag(edge) {
  const tags = Array.isArray(edge.data("tags")) ? edge.data("tags") : parseTags(edge.data("tags") || "");
  return tags[0] || "Untagged";
}

function appendOutlineEmptyState(message) {
  const empty = document.createElement("div");
  empty.className = "outline-empty-state";
  empty.textContent = message;
  documentOutlineList.appendChild(empty);
}

function loadActiveDocumentSection() {
  hideDocumentLinkPopover();
  hideDocumentTableTools();
  selectDocumentImage(null);
  if (activeDocumentTarget?.type === "edge") {
    updateDocumentPrimaryTagControl();
    loadActiveConnectionDocumentSection();
    updatePdfButtons();
    return;
  }

  const node = getActiveDocumentNode();
  if (!node) {
    updateDocumentPrimaryTagControl();
    clearDocumentEditor();
    updatePdfButtons();
    return;
  }

  documentSectionTitle.disabled = false;
  setDocumentEditorEnabled(true);
  documentSectionTitle.value = node.data("label") || "";
  resizeDocumentTitle();
  const isPublication = node.data("type") === "Publication";
  const publicationNotes = normalizePublicationNotes(node.data("publicationNotes"));
  documentConnectionContext.parentElement.classList.remove("connection-document-page");
  documentConnectionContext.classList.remove("connection-endpoint-context");
  documentMetadata.hidden = !isPublication;
  documentCitation.disabled = !isPublication;
  documentUrl.disabled = !isPublication;
  documentAbstract.disabled = !isPublication;
  documentCitation.value = isPublication ? publicationNotes.citation : "";
  documentUrl.value = isPublication ? node.data("url") || publicationNotes.url || "" : "";
  documentAbstract.value = isPublication ? publicationNotes.abstract : "";
  if (isPublication) {
    setDocumentEditorHtml(publicationNotes.notesHtml || escapeHtml(publicationNotes.notes || "").replace(/\n/g, "<br>"));
  } else {
    setDocumentEditorHtml(node.data("documentHtml") || getDefaultDocumentHtml(node));
  }
  clearNodeConnectionContext();
  updateDocumentLinks();
  updateDocumentImages();
  updateDocumentPrimaryTagControl();
  updatePdfButtons();
  resetDocumentPageScroll();
  updateDocumentFontToolbarState();
}

function loadActiveConnectionDocumentSection() {
  const edge = getActiveDocumentEdge();
  if (!edge) {
    clearDocumentEditor();
    return;
  }

  documentSectionTitle.disabled = true;
  setDocumentEditorEnabled(true);
  documentSectionTitle.value = getConnectionShortTitle(edge);
  resizeDocumentTitle();
  documentMetadata.hidden = true;
  documentCitation.disabled = true;
  documentUrl.disabled = true;
  documentAbstract.disabled = true;
  documentCitation.value = "";
  documentUrl.value = "";
  documentAbstract.value = "";
  renderActiveConnectionEndpointContext(edge);
  updateDocumentPrimaryTagControl();
  setDocumentEditorHtml(edge.data("notesHtml") || escapeHtml(edge.data("notes") || "").replace(/\n/g, "<br>"));
  updateDocumentLinks();
  updateDocumentImages();
  updatePdfButtons();
  resetDocumentPageScroll();
  updateDocumentFontToolbarState();
}

function resetDocumentPageScroll() {
  if (documentPageScroll) {
    documentPageScroll.scrollTop = 0;
    return;
  }
  if (documentPage) documentPage.scrollTop = 0;
}

function renderActiveConnectionEndpointContext(edge) {
  documentConnectionContext.parentElement.classList.add("connection-document-page");
  documentConnectionContext.classList.add("connection-endpoint-context");
  documentConnectionContext.innerHTML = `
    <div class="connection-endpoint-grid">
      <section>
        <h3>From</h3>
        <p>${escapeHtml(getEdgeEndpointDocumentText(edge, "source"))}</p>
      </section>
      <section>
        <h3>To</h3>
        <p>${escapeHtml(getEdgeEndpointDocumentText(edge, "target"))}</p>
      </section>
    </div>
  `;
  documentConnectionContext.hidden = false;
}

function getEdgeEndpointDocumentText(edge, endpoint) {
  const node = endpoint === "source" ? edge.source() : edge.target();
  if (!node || !node.length) return "Unknown";
  const type = node.data("type") || "Node";
  const title = node.data("label") || node.id() || "Untitled";
  return `${type}: ${title}`;
}

function clearDocumentEditor() {
  hideDocumentLinkPopover();
  hideDocumentTableTools();
  selectDocumentImage(null);
  documentConnectionContext.parentElement.classList.remove("connection-document-page");
  documentConnectionContext.classList.remove("connection-endpoint-context");
  documentConnectionContext.hidden = true;
  documentConnectionContext.innerHTML = "";
  documentPrimaryTagControl.hidden = true;
  documentPrimaryTag.disabled = true;
  documentSectionTitle.disabled = true;
  documentMetadata.hidden = true;
  documentCitation.disabled = true;
  documentUrl.disabled = true;
  documentAbstract.disabled = true;
  setDocumentEditorEnabled(false);
  documentSectionTitle.value = "";
  resizeDocumentTitle();
  documentCitation.value = "";
  documentUrl.value = "";
  documentAbstract.value = "";
  setDocumentEditorText("Select a node from the outline or the map to edit its linked document section.");
  updatePdfButtons();
}

function updateDocumentTitle() {
  if (activeDocumentTarget?.type === "edge") return;
  const node = getActiveDocumentNode();
  if (!node) return;

  const title = documentSectionTitle.value.trim() || "Untitled";
  node.data("label", title);
  if (selectedNode && selectedNode.id() === node.id()) fields.title.value = title;
  resizeDocumentTitle();
  renderDocumentOutline();
  updateResizeOverlay();
  scheduleAutosave("Autosaved document title.");
}

function resizeDocumentTitle() {
  documentSectionTitle.style.height = "auto";
  documentSectionTitle.style.height = `${documentSectionTitle.scrollHeight}px`;
}

function handleDocumentEditorInput() {
  if (isLoadingDocumentEditor) return;
  updateDocumentBody();
}

function updateDocumentBody() {
  if (isLoadingDocumentEditor) return;
  updateDocumentLinks();
  const cleanHtml = getCleanDocumentEditorHtml();
  const cleanText = getDocumentEditorText();

  if (activeDocumentTarget?.type === "edge") {
    const edge = getActiveDocumentEdge();
    if (!edge) return;
    edge.data("notes", cleanText);
    edge.data("notesHtml", cleanHtml);
    if (selectedEdge && selectedEdge.id() === edge.id()) {
      edgeNotesText.value = edge.data("notes") || "";
    }
    scheduleAutosave("Autosaved connection notes.");
    return;
  }

  const node = getActiveDocumentNode();
  if (!node) return;
  node.data("documentHtml", cleanHtml);
  reconcileDocumentNodeLinkConnections(node, cleanHtml);
  if (node.data("type") === "Publication") {
    const notes = normalizePublicationNotes(node.data("publicationNotes"));
    notes.notes = cleanText;
    notes.notesHtml = cleanHtml;
    node.data("publicationNotes", notes);
    if (publicationNotesNode && publicationNotesNode.id() === node.id()) {
      publicationNoteFields.notes.value = notes.notes;
      publicationNoteFields.abstract.value = notes.abstract;
    }
  }
  scheduleAutosave("Autosaved document section.");
}

function getCleanDocumentEditorHtml() {
  const source = getDocumentEditorRoot();
  const clone = source.cloneNode(true);
  clone.querySelectorAll(".selected-doc-image").forEach((image) => {
    image.classList.remove("selected-doc-image");
  });
  clone.querySelectorAll(".selected-doc-table").forEach((table) => {
    table.classList.remove("selected-doc-table");
  });
  clone.querySelectorAll(".selected-doc-table-column").forEach((cell) => {
    cell.classList.remove("selected-doc-table-column");
  });
  clone.querySelectorAll(".selected-doc-table-row").forEach((cell) => {
    cell.classList.remove("selected-doc-table-row");
  });
  clone.querySelectorAll(".selected-doc-table-cell").forEach((cell) => {
    cell.classList.remove("selected-doc-table-cell");
  });
  clone.querySelectorAll('img[src^="data:image/"]').forEach((image) => {
    const placeholder = document.createElement("span");
    placeholder.className = "unsaved-image-placeholder";
    placeholder.dataset.unsavedImage = "true";
    placeholder.textContent = "Unsaved embedded image. Delete this placeholder and reinsert the image.";
    image.replaceWith(placeholder);
  });
  return clone.innerHTML;
}

function updateDocumentCitation() {
  const node = getActiveDocumentNode();
  if (!node || node.data("type") !== "Publication") return;

  const notes = normalizePublicationNotes(node.data("publicationNotes"));
  notes.citation = documentCitation.value;
  node.data("publicationNotes", notes);
  if (selectedNode && selectedNode.id() === node.id()) fields.citation.value = notes.citation;
  if (publicationNotesNode && publicationNotesNode.id() === node.id()) {
    publicationNoteFields.citation.value = notes.citation;
  }
  scheduleAutosave("Autosaved citation.");
}

function updateDocumentUrl() {
  const node = getActiveDocumentNode();
  if (!node || node.data("type") !== "Publication") return;

  const url = documentUrl.value.trim();
  const notes = normalizePublicationNotes(node.data("publicationNotes"));
  notes.url = url;
  node.data("url", url);
  node.data("publicationNotes", notes);
  if (selectedNode && selectedNode.id() === node.id()) fields.url.value = url;
  if (publicationNotesNode && publicationNotesNode.id() === node.id()) {
    publicationNoteFields.url.value = url;
  }
  scheduleAutosave("Autosaved URL.");
}

function updateDocumentAbstract() {
  const node = getActiveDocumentNode();
  if (!node || node.data("type") !== "Publication") return;

  const notes = normalizePublicationNotes(node.data("publicationNotes"));
  notes.abstract = documentAbstract.value;
  node.data("publicationNotes", notes);
  if (publicationNotesNode && publicationNotesNode.id() === node.id()) {
    publicationNoteFields.abstract.value = notes.abstract;
  }
  scheduleAutosave("Autosaved abstract.");
}

function beginDocumentEdit() {
  if (documentEditSnapshot) return;
  documentEditSnapshot = JSON.stringify(getGraphData());
}

function commitDocumentEdit() {
  if (!documentEditSnapshot) return;
  if (JSON.stringify(getGraphData()) !== documentEditSnapshot) pushUndoSnapshot(documentEditSnapshot, "document edit");
  documentEditSnapshot = null;
}

function populateDocumentFontSizes() {
  docFontSize.innerHTML = "";
  const mixedOption = document.createElement("option");
  mixedOption.value = "";
  mixedOption.textContent = "";
  docFontSize.appendChild(mixedOption);
  for (let size = 1; size <= 64; size += 1) {
    const option = document.createElement("option");
    option.value = String(size);
    option.textContent = String(size);
    if (size === 12) option.selected = true;
    docFontSize.appendChild(option);
  }
}

function runDocumentCommand(command) {
  if (documentEditor.contentEditable !== "true") return;
  if (runTableFormattingCommand(command)) return;
  beginDocumentEdit();
  restoreDocumentSelection();
  documentEditor.focus();
  document.execCommand(command, false, null);
  updateDocumentBody();
  commitDocumentEdit();
}

function runDocumentValueCommand(command, value) {
  if (documentEditor.contentEditable !== "true") return;
  if (runTableValueFormattingCommand(command, value)) return;
  const commandKey = `${command}:${value}`;
  if (runDocumentValueCommand.lastCommandKey === commandKey) return;
  runDocumentValueCommand.lastCommandKey = commandKey;
  window.setTimeout(() => {
    if (runDocumentValueCommand.lastCommandKey === commandKey) runDocumentValueCommand.lastCommandKey = "";
  }, 50);

  beginDocumentEdit();
  restoreDocumentSelection();
  documentEditor.focus();
  const applied = document.execCommand(command, false, value);
  if (!applied && command === "hiliteColor") {
    document.execCommand("backColor", false, value);
  }
  updateDocumentBody();
  commitDocumentEdit();
}

function preserveDocumentSelectionForToolbar() {
  saveDocumentSelection();
}

function handleDocumentFormatPainter() {
  if (documentEditor.contentEditable !== "true") return;
  copiedDocumentFormat = captureTableCellFormatFromSelection();
  if (copiedDocumentFormat) {
    formatPainterSourceText = "";
    formatPainterSourceRange = null;
    docFormatPainterButton.classList.add("active-tool");
    setStatus("Copied table cell formatting. Select target cell(s) to apply it.");
    return;
  }

  restoreDocumentSelection();

  copiedDocumentFormat = captureDocumentFormatFromSelection();
  if (!copiedDocumentFormat) {
    clearDocumentFormatPainter();
    setStatus("Select formatted text first, then click the format painter.");
    return;
  }

  formatPainterSourceText = getCurrentDocumentSelectionText();
  formatPainterSourceRange = getCurrentDocumentRange()?.cloneRange() || null;
  docFormatPainterButton.classList.add("active-tool");
  setStatus("Copied text formatting. Select target text to apply it.");
}

function handleDocumentSelectionForFormatPainter() {
  saveDocumentSelection();
  if (!copiedDocumentFormat) return;

  if (copiedDocumentFormat.kind === "table-cell") {
    if (applyCopiedTableCellFormat()) {
      clearDocumentFormatPainter();
      setStatus("Applied table cell formatting.");
    }
    return;
  }

  const targetText = getCurrentDocumentSelectionText();
  const targetRange = getCurrentDocumentRange();
  if (!targetText || isSameDocumentRange(targetRange, formatPainterSourceRange)) return;

  if (applyCopiedDocumentFormat()) {
    clearDocumentFormatPainter();
    setStatus("Applied copied formatting.");
  }
}

function clearDocumentFormatPainter() {
  copiedDocumentFormat = null;
  formatPainterSourceText = "";
  formatPainterSourceRange = null;
  docFormatPainterButton.classList.remove("active-tool");
}

function captureDocumentFormatFromSelection() {
  const range = getCurrentDocumentRange();
  if (!range) return null;
  const node = range.startContainer.nodeType === Node.TEXT_NODE ? range.startContainer.parentElement : range.startContainer;
  const element = node?.closest && node.closest("*");
  if (!element || !documentEditor.contains(element)) return null;
  const style = window.getComputedStyle(element);
  return {
    fontFamily: style.fontFamily,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    textDecoration: style.textDecorationLine,
    color: style.color,
    backgroundColor: isTransparentColor(style.backgroundColor) ? "" : style.backgroundColor
  };
}

function captureTableCellFormatFromSelection() {
  const cells = getActiveTableCellsForFormatting();
  if (!cells.length || !hasActiveTableCellFormattingTarget()) return null;
  const cell = cells[0];
  const style = window.getComputedStyle(cell);
  return {
    kind: "table-cell",
    style: {
      fontFamily: cell.style.fontFamily || style.fontFamily,
      fontSize: cell.style.fontSize || style.fontSize,
      fontWeight: cell.style.fontWeight || style.fontWeight,
      fontStyle: cell.style.fontStyle || style.fontStyle,
      textDecorationLine: cell.style.textDecorationLine || style.textDecorationLine,
      color: cell.style.color || style.color,
      backgroundColor: cell.style.backgroundColor || (isTransparentColor(style.backgroundColor) ? "" : style.backgroundColor),
      textAlign: cell.style.textAlign || style.textAlign,
      verticalAlign: cell.style.verticalAlign || style.verticalAlign,
      border: cell.style.border,
      borderTop: cell.style.borderTop,
      borderRight: cell.style.borderRight,
      borderBottom: cell.style.borderBottom,
      borderLeft: cell.style.borderLeft,
      width: cell.style.width,
      height: cell.style.height
    }
  };
}

function applyCopiedTableCellFormat() {
  if (copiedDocumentFormat?.kind !== "table-cell") return false;
  return applyStyleToActiveTableCells((cell) => {
    applySerializedCellStyle(cell, copiedDocumentFormat.style);
  }, "Applied table cell formatting.");
}

function applyCopiedTableCellFormatFromSelectionIfActive() {
  if (copiedDocumentFormat?.kind !== "table-cell") return false;
  if (!applyCopiedTableCellFormat()) return false;
  clearDocumentFormatPainter();
  return true;
}

function updateDocumentFontToolbarState() {
  const element = getCurrentDocumentStyleElement();
  if (!element) return;
  const style = window.getComputedStyle(element);
  const matchingFont = findMatchingDocumentFontFamily(style.fontFamily);
  if (matchingFont) docFontFamily.value = matchingFont;
  const selectedFontSize = getSelectedDocumentFontSize();
  docFontSize.value = selectedFontSize || "";
}

function getCurrentDocumentStyleElement() {
  const range = getCurrentDocumentRange();
  if (!range) return null;
  let node = range.startContainer;
  if (range.startContainer === documentEditor && range.startContainer.childNodes[range.startOffset]) {
    node = range.startContainer.childNodes[range.startOffset];
  }
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  if (!node || !documentEditor.contains(node)) return null;
  return node.closest?.("*") || null;
}

function findMatchingDocumentFontFamily(fontFamily) {
  const normalizedFamilies = String(fontFamily || "")
    .split(",")
    .map(normalizeFontFamilyName)
    .filter(Boolean);
  const options = Array.from(docFontFamily.options);
  return options.find((option) => normalizedFamilies.includes(normalizeFontFamilyName(option.value)))?.value
    || options.find((option) => normalizedFamilies.some((family) => family.includes(normalizeFontFamilyName(option.value))))?.value
    || "";
}

function normalizeFontFamilyName(name) {
  return String(name || "").replace(/["']/g, "").trim().toLowerCase();
}

function applyCopiedDocumentFormat() {
  if (!copiedDocumentFormat) return false;
  const range = getCurrentDocumentRange();
  if (!range || range.collapsed) return false;

  const beforeSnapshot = JSON.stringify(getGraphData());
  documentEditSnapshot = null;
  documentEditor.focus();
  const span = document.createElement("span");
  span.style.fontFamily = copiedDocumentFormat.fontFamily;
  span.style.fontSize = copiedDocumentFormat.fontSize;
  span.style.fontWeight = copiedDocumentFormat.fontWeight;
  span.style.fontStyle = copiedDocumentFormat.fontStyle;
  span.style.textDecoration = copiedDocumentFormat.textDecoration;
  span.style.color = copiedDocumentFormat.color;
  if (copiedDocumentFormat.backgroundColor) span.style.backgroundColor = copiedDocumentFormat.backgroundColor;

  try {
    range.surroundContents(span);
  } catch {
    span.appendChild(range.extractContents());
    range.insertNode(span);
  }

  const selection = window.getSelection();
  range.selectNodeContents(span);
  selection.removeAllRanges();
  selection.addRange(range);
  saveDocumentSelection();
  updateDocumentBody();
  if (JSON.stringify(getGraphData()) !== beforeSnapshot) pushUndoSnapshot(beforeSnapshot, "format text");
  return true;
}

function getCurrentDocumentRange() {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && documentEditor.contains(selection.anchorNode)) {
    return selection.getRangeAt(0);
  }
  if (savedDocumentRange && documentEditor.contains(savedDocumentRange.commonAncestorContainer)) {
    return savedDocumentRange;
  }
  return null;
}

function getCurrentDocumentSelectionText() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !documentEditor.contains(selection.anchorNode)) return "";
  return selection.toString().trim();
}

function isSameDocumentRange(a, b) {
  if (!a || !b) return false;
  return a.startContainer === b.startContainer
    && a.startOffset === b.startOffset
    && a.endContainer === b.endContainer
    && a.endOffset === b.endOffset;
}

function isTransparentColor(value) {
  return !value || value === "transparent" || value === "rgba(0, 0, 0, 0)";
}

function updateDocumentColorSwatches() {
  docTextColorBar.style.background = docTextColor.value;
  docTextColorSwatch.style.background = docTextColor.value;
  docHighlightColorBar.style.background = docHighlightColor.value;
  docHighlightColorSwatch.style.background = docHighlightColor.value;
}

function renderDocumentColorMenus() {
  renderDocumentColorMenu({
    menu: docTextColorMenu,
    colors: TEXT_COLOR_PRESETS,
    label: "text color",
    customInput: docTextColor,
    onPick: (color) => setDocumentTextColor(color, true)
  });
  renderDocumentColorMenu({
    menu: docHighlightColorMenu,
    colors: HIGHLIGHT_COLOR_PRESETS,
    label: "highlight color",
    customInput: docHighlightColor,
    onPick: (color) => setDocumentHighlightColor(color, true)
  });
}

function renderDocumentColorMenu({ menu, colors, label, customInput, onPick }) {
  menu.innerHTML = "";
  colors.forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "doc-color-menu-swatch";
    button.style.background = color;
    button.title = `Use ${color} ${label}`;
    button.setAttribute("aria-label", `Use ${color} ${label}`);
    button.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onPick(color);
      closeDocumentColorMenus();
    });
    menu.appendChild(button);
  });

  const customButton = document.createElement("button");
  customButton.type = "button";
  customButton.className = "doc-color-menu-custom";
  customButton.textContent = "Custom...";
  customButton.addEventListener("pointerdown", preserveDocumentSelectionForToolbar);
  customButton.addEventListener("click", (event) => {
    event.stopPropagation();
    closeDocumentColorMenus();
    customInput.click();
  });
  menu.appendChild(customButton);
}

function setDocumentTextColor(color, apply = false) {
  docTextColor.value = color;
  updateDocumentColorSwatches();
  if (apply) runDocumentValueCommand("foreColor", color);
}

function setDocumentHighlightColor(color, apply = false) {
  docHighlightColor.value = color;
  updateDocumentColorSwatches();
  if (apply) applyDocumentHighlightColor(color);
}

function toggleDocumentHighlightColor() {
  if (isCurrentSelectionHighlighted()) {
    clearDocumentHighlightColor();
    return;
  }
  applyDocumentHighlightColor(docHighlightColor.value);
}

function applyDocumentHighlightColor(color) {
  runDocumentValueCommand("hiliteColor", color);
}

function clearDocumentHighlightColor() {
  if (documentEditor.contentEditable !== "true") return;
  beginDocumentEdit();
  restoreDocumentSelection();
  documentEditor.focus();
  document.execCommand("hiliteColor", false, "transparent");
  document.execCommand("backColor", false, "transparent");
  removeInlineBackgroundFromSelection();
  updateDocumentBody();
  commitDocumentEdit();
}

function isCurrentSelectionHighlighted() {
  const range = getCurrentDocumentRange();
  if (!range || range.collapsed) return false;
  const selectedTextNodes = getSelectedTextNodes(range);
  return selectedTextNodes.length > 0 && selectedTextNodes.every((node) => textNodeHasHighlight(node));
}

function removeInlineBackgroundFromSelection() {
  const range = getCurrentDocumentRange();
  if (!range || range.collapsed) return;
  const selectedTextNodes = getSelectedTextNodes(range);
  selectedTextNodes.forEach((node) => {
    const highlightedAncestor = getHighlightAncestor(node);
    if (highlightedAncestor) {
      highlightedAncestor.style.backgroundColor = "";
      if (highlightedAncestor.getAttribute("style") === "") highlightedAncestor.removeAttribute("style");
    }
  });
}

function getSelectedTextNodes(range) {
  const root = range.commonAncestorContainer;
  if (root.nodeType === Node.TEXT_NODE) {
    return root.textContent.trim() && documentEditor.contains(root.parentElement) ? [root] : [];
  }

  const nodes = [];
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        return range.intersectsNode(node) && documentEditor.contains(node.parentElement)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function textNodeHasHighlight(node) {
  return Boolean(getHighlightAncestor(node));
}

function getHighlightAncestor(node) {
  let element = node.parentElement;
  while (element && element !== documentEditor) {
    if (!isTransparentColor(window.getComputedStyle(element).backgroundColor)) return element;
    element = element.parentElement;
  }
  return null;
}

function showDocumentColorMenu(menu, anchor) {
  const willOpen = menu.hidden;
  closeDocumentColorMenus(menu);
  if (!willOpen) {
    menu.hidden = true;
    return;
  }

  const rect = anchor.getBoundingClientRect();
  menu.hidden = false;
  const menuRect = menu.getBoundingClientRect();
  const left = clamp(rect.right - menuRect.width, 8, window.innerWidth - menuRect.width - 8);
  const top = clamp(rect.bottom + 6, 8, window.innerHeight - menuRect.height - 8);
  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
}

function closeDocumentColorMenus(except = null) {
  if (except !== docTextColorMenu) docTextColorMenu.hidden = true;
  if (except !== docHighlightColorMenu) docHighlightColorMenu.hidden = true;
}

function setDocumentAlignmentCommand(command) {
  if (!["justifyLeft", "justifyCenter", "justifyRight"].includes(command)) return;
  currentDocumentAlignmentCommand = command;
  docAlignmentIcon.className = `align-icon ${getAlignmentIconClass(command)}`;
}

function showDocumentAlignmentMenu() {
  const rect = docAlignmentMenuButton.getBoundingClientRect();
  docAlignmentMenu.hidden = false;
  const menuRect = docAlignmentMenu.getBoundingClientRect();
  const left = clamp(rect.right - menuRect.width, 8, window.innerWidth - menuRect.width - 8);
  const top = clamp(rect.bottom + 6, 8, window.innerHeight - menuRect.height - 8);
  docAlignmentMenu.style.left = `${left}px`;
  docAlignmentMenu.style.top = `${top}px`;
}

function getAlignmentIconClass(command) {
  if (command === "justifyCenter") return "align-center";
  if (command === "justifyRight") return "align-right";
  return "align-left";
}

function handleDocumentEditorKeydown(event) {
  if (documentEditor.contentEditable !== "true") return;

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && copySelectedDocumentTableCells()) {
    event.preventDefault();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "v" && pasteCopiedDocumentTableCells()) {
    event.preventDefault();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "c" && copySelectedDocumentImage()) {
    event.preventDefault();
    return;
  }

  if ((event.key === "Delete" || event.key === "Backspace") && clearSelectedDocumentTableCellContents()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }

  if ((event.key === "Delete" || event.key === "Backspace") && getSelectedDocumentResizableElement()) {
    event.preventDefault();
    event.stopImmediatePropagation();
    deleteSelectedDocumentResizableElement();
    return;
  }

  if (event.key === "Delete" || event.key === "Backspace") {
    beginDocumentEdit();
    window.setTimeout(() => {
      updateDocumentBody();
      commitDocumentEdit();
    }, 0);
  }

  if (event.key === " " || event.key === "Enter") {
    window.setTimeout(() => autoLinkDocumentUrls(), 0);
    return;
  }

  if (event.key !== "Tab") return;

  event.preventDefault();
  beginDocumentEdit();
  documentEditor.focus();

  const command = event.shiftKey ? "outdent" : "indent";
  if (isSelectionInsideDocumentListItem()) {
    document.execCommand(command, false, null);
  } else if (!event.shiftKey) {
    document.execCommand("insertText", false, "    ");
  }

  updateDocumentBody();
  commitDocumentEdit();
}

function clearSelectedDocumentTableCellContents() {
  const cells = getDocumentTableCellsSelectedForDeletion();
  if (!cells.length) return false;

  beginDocumentEdit();
  cells.forEach((cell) => {
    cell.innerHTML = "<br>";
  });
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentTableToolsPosition();
  setStatus(`Cleared ${cells.length} selected table cell${cells.length === 1 ? "" : "s"}.`);
  return true;
}

function getDocumentTableCellsSelectedForDeletion() {
  const activeCells = getActiveTableCellsForFormatting();
  if (activeCells.length && hasActiveTableCellFormattingTarget()) return activeCells;

  const root = getDocumentEditorRoot();
  const joditSelectedCells = Array.from(root.querySelectorAll([
    "td.selected-doc-table-cell",
    "th.selected-doc-table-cell",
    "td.jodit-selected-cell",
    "th.jodit-selected-cell",
    "td.jodit_selected_cell",
    "th.jodit_selected_cell",
    "td[aria-selected='true']",
    "th[aria-selected='true']"
  ].join(","))).filter((cell) => isInsideDocumentEditor(cell));
  if (joditSelectedCells.length) return Array.from(new Set(joditSelectedCells));

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return [];
  const range = selection.getRangeAt(0);
  const table = getClosestDocumentElement(range.commonAncestorContainer, "table");
  if (!table || !isInsideDocumentEditor(table)) return [];

  const intersectingCells = Array.from(table.querySelectorAll("td, th")).filter((cell) => {
    try {
      return range.intersectsNode(cell);
    } catch {
      return false;
    }
  });
  return intersectingCells.length > 1 ? intersectingCells : [];
}

function getClosestDocumentElement(node, selector) {
  let element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
  return element?.closest?.(selector) || null;
}

function isSelectionInsideDocumentListItem() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !documentEditor.contains(selection.anchorNode)) return false;

  let node = selection.anchorNode;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return Boolean(node?.closest?.("li") && documentEditor.contains(node.closest("li")));
}

function applyDocumentFontSize(size) {
  if (documentEditor.contentEditable !== "true") return;
  if (size === "") return;
  const numericSize = clamp(Number(size), 1, 64);
  if (!Number.isFinite(numericSize)) return;
  if (applyStyleToActiveTableCells((cell) => {
    cell.style.fontSize = `${numericSize}px`;
  }, "Formatted selected table cells.")) {
    updateDocumentFontToolbarState();
    return;
  }
  restoreDocumentSelection();
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !documentEditor.contains(selection.anchorNode)) return;

  beginDocumentEdit();
  documentEditor.focus();
  const range = selection.getRangeAt(0);

  if (range.collapsed) {
    const span = document.createElement("span");
    span.style.fontSize = `${numericSize}px`;
    span.appendChild(document.createTextNode("\u200b"));
    range.insertNode(span);
    range.setStart(span.firstChild, 1);
    range.collapse(true);
  } else {
    applyStyleToSelectedTextNodes(range, (span) => {
      span.style.fontSize = `${numericSize}px`;
    });
  }

  selection.removeAllRanges();
  selection.addRange(range);
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentFontToolbarState();
}

function getSelectedDocumentFontSize() {
  const range = getCurrentDocumentRange();
  if (!range) return "";
  const nodes = range.collapsed ? [] : getSelectedTextNodes(range);
  if (!nodes.length) {
    const element = getCurrentDocumentStyleElement();
    return element ? normalizePixelFontSize(window.getComputedStyle(element).fontSize) : "";
  }

  const sizes = Array.from(new Set(nodes
    .map((node) => normalizePixelFontSize(window.getComputedStyle(node.parentElement).fontSize))
    .filter(Boolean)));
  return sizes.length === 1 ? sizes[0] : "";
}

function normalizePixelFontSize(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) return "";
  const rounded = Math.round(numeric);
  return rounded >= 1 && rounded <= 64 ? String(rounded) : "";
}

function applyStyleToSelectedTextNodes(range, applyStyle) {
  const textNodes = getSelectedTextNodes(range);
  textNodes.forEach((node) => {
    const text = node.textContent;
    let start = 0;
    let end = text.length;
    if (node === range.startContainer) start = range.startOffset;
    if (node === range.endContainer) end = range.endOffset;
    if (start >= end) return;

    const before = text.slice(0, start);
    const selected = text.slice(start, end);
    const after = text.slice(end);
    const fragment = document.createDocumentFragment();
    if (before) fragment.appendChild(document.createTextNode(before));
    const span = document.createElement("span");
    applyStyle(span);
    span.textContent = selected;
    fragment.appendChild(span);
    if (after) fragment.appendChild(document.createTextNode(after));
    node.replaceWith(fragment);
  });
}

function addDocumentHyperlink() {
  if (documentEditor.contentEditable !== "true") return;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || !documentEditor.contains(selection.anchorNode)) return;

  const selectedText = selection.toString().trim();
  const enteredUrl = window.prompt("Enter hyperlink URL", "https://");
  if (!enteredUrl) return;

  const url = normalizeHyperlinkUrl(enteredUrl);
  beginDocumentEdit();
  documentEditor.focus();
  if (selectedText) {
    document.execCommand("createLink", false, url);
  } else {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    selection.getRangeAt(0).insertNode(link);
  }
  updateDocumentLinks();
  updateDocumentBody();
  commitDocumentEdit();
}

function openDocumentNodeLinkPicker() {
  if (documentEditor.contentEditable !== "true") return;
  const selection = window.getSelection();
  const root = getDocumentEditorRoot();
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) return;

  const sourceNode = getActiveDocumentNode();
  documentNodeLinkPicker.dataset.sourceNodeId = sourceNode ? sourceNode.id() : "";
  saveDocumentSelection();
  renderDocumentNodeLinkTypeFilters();
  renderDocumentNodeLinkPicker();
  documentNodeLinkPicker.hidden = false;
  positionDocumentNodeLinkPicker();
  documentNodeLinkSearch.focus();
}

function hideDocumentNodeLinkPicker() {
  documentNodeLinkPicker.hidden = true;
  documentNodeLinkPicker.dataset.sourceNodeId = "";
  documentNodeLinkSearch.value = "";
  documentNodeLinkList.innerHTML = "";
}

function renderDocumentNodeLinkPicker() {
  documentNodeLinkList.innerHTML = "";
  const selectedTypes = getSelectedNodeLinkTypes();
  const query = normalizeSearchText(documentNodeLinkSearch.value);
  const nodes = cy.nodes().filter((node) => {
    if (node.data("clusterBackground")) return false;
    if (selectedTypes.size && !selectedTypes.has(node.data("type") || "Unassigned")) return false;
    return nodeMatchesNodeLinkSearch(node, query);
  });
  const groups = new Map();

  nodes.forEach((node) => {
    const groupTag = getDocumentGroupTag(node);
    if (!groups.has(groupTag)) groups.set(groupTag, []);
    groups.get(groupTag).push(node);
  });

  Array.from(groups.entries())
    .sort(([tagA], [tagB]) => tagA.localeCompare(tagB))
    .forEach(([tag, groupNodes]) => appendDocumentNodeLinkGroup(tag, groupNodes));

  if (!nodes.length) {
    documentNodeLinkList.textContent = "No matching nodes.";
  }
}

function renderDocumentNodeLinkTypeFilters() {
  const existingChecked = getSelectedNodeLinkTypes();
  const nodeTypesInMap = Array.from(new Set(getRealNodes().map((node) => node.data("type") || "Unassigned")))
    .sort((a, b) => a.localeCompare(b));
  documentNodeLinkTypeFilters.innerHTML = "";
  nodeTypesInMap.forEach((type) => {
    const label = document.createElement("label");
    label.className = "node-link-type-filter";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = type;
    checkbox.checked = existingChecked.size ? existingChecked.has(type) : true;
    const swatch = document.createElement("span");
    swatch.className = "node-link-type-swatch";
    swatch.style.background = getNodeColorForType(type);
    const text = document.createElement("span");
    text.textContent = type;
    label.append(checkbox, swatch, text);
    documentNodeLinkTypeFilters.appendChild(label);
  });
}

function getSelectedNodeLinkTypes() {
  return new Set(Array.from(documentNodeLinkTypeFilters.querySelectorAll("input:checked")).map((input) => input.value));
}

function nodeMatchesNodeLinkSearch(node, query) {
  if (!query) return true;
  const notes = normalizePublicationNotes(node.data("publicationNotes"));
  const fields = [
    node.data("label"),
    node.data("type"),
    node.data("url"),
    notes.citation,
    notes.abstract,
    node.data("documentHtml"),
    ...(Array.isArray(node.data("tags")) ? node.data("tags") : parseTags(node.data("tags") || ""))
  ];
  return normalizeSearchText(fields.filter(Boolean).join(" ")).includes(query);
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function appendDocumentNodeLinkGroup(title, nodes) {
  const sortedNodes = Array.from(nodes).sort((a, b) => (a.data("label") || "").localeCompare(b.data("label") || ""));
  if (!sortedNodes.length) return;

  const heading = document.createElement("div");
  heading.className = "node-link-picker-group";
  heading.textContent = title;
  documentNodeLinkList.appendChild(heading);

  sortedNodes.forEach((node) => {
    const button = document.createElement("button");
    button.type = "button";
    const label = document.createElement("span");
    label.className = "node-link-picker-title";
    label.textContent = node.data("label") || "Untitled";
    const type = document.createElement("span");
    type.className = "node-link-picker-type";
    type.textContent = node.data("type") || "Node";
    button.append(label, type);
    if (node.data("type") === "Publication") {
      const citation = normalizePublicationNotes(node.data("publicationNotes")).citation.trim();
      if (citation) {
        const citationPreview = document.createElement("span");
        citationPreview.className = "node-link-picker-citation";
        citationPreview.textContent = citation;
        button.appendChild(citationPreview);
      }
    }
    button.addEventListener("click", () => addDocumentNodeLink(node));
    documentNodeLinkList.appendChild(button);
  });
}

function positionDocumentNodeLinkPicker() {
  const rect = docNodeLinkButton.getBoundingClientRect();
  documentNodeLinkPicker.hidden = false;
  const pickerRect = documentNodeLinkPicker.getBoundingClientRect();
  const left = clamp(rect.left, 8, window.innerWidth - pickerRect.width - 8);
  const top = clamp(rect.bottom + 6, 8, window.innerHeight - pickerRect.height - 8);
  documentNodeLinkPicker.style.left = `${left}px`;
  documentNodeLinkPicker.style.top = `${top}px`;
}

function addDocumentNodeLink(node) {
  if (!node || node.removed()) return;

  const sourceNodeId = documentNodeLinkPicker.dataset.sourceNodeId || activeDocumentTarget?.id || activeDocumentNodeId || "";
  const sourceNode = sourceNodeId ? cy.getElementById(sourceNodeId) : getActiveDocumentNode();
  const beforeSnapshot = JSON.stringify(getGraphData());
  beginDocumentEdit();
  restoreDocumentSelection();
  if (joditEditor) joditEditor.s.focus();
  else documentEditor.focus();
  const selection = window.getSelection();
  const root = getDocumentEditorRoot();
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) return;

  const selectedText = selection.toString().trim();
  const link = document.createElement("a");
  link.href = `#node:${node.id()}`;
  link.dataset.nodeLink = node.id();
  link.textContent = selectedText || node.data("label") || "Linked node";

  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(link);
  range.setStartAfter(link);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);

  hideDocumentNodeLinkPicker();
  const connectionResult = ensureConnectionForDocumentNodeLink(sourceNode, node);
  updateDocumentBody();
  if (JSON.stringify(getGraphData()) !== beforeSnapshot) {
    documentEditSnapshot = null;
    pushUndoSnapshot(beforeSnapshot, "node link");
  } else {
    commitDocumentEdit();
  }
  if (connectionResult === "created") {
    setStatus("Added node link and created connection.");
  } else if (connectionResult === "linked-existing") {
    setStatus("Added node link and linked it to the existing connection.");
  } else if (!sourceNode || !sourceNode.length || sourceNode.removed()) {
    setStatus("Added node link. No source node was active, so no connection was created.");
  } else {
    setStatus("Added node link. Connection already exists or target is the same node.");
  }
}

function ensureConnectionForDocumentNodeLink(sourceNode, targetNode) {
  if (!sourceNode || !sourceNode.length || !targetNode || !targetNode.length || sourceNode.removed() || targetNode.removed()) return "";
  if (sourceNode.id() === targetNode.id()) return "";

  const existingEdge = findConnectionBetweenNodes(sourceNode.id(), targetNode.id());
  if (existingEdge) {
    return markConnectionAsDocumentNodeLink(existingEdge, sourceNode.id(), targetNode.id())
      ? "linked-existing"
      : "";
  }

  const edgeId = `edge-${sourceNode.id()}-${targetNode.id()}`;
  cy.add({
    group: "edges",
    data: {
      id: edgeId,
      source: sourceNode.id(),
      target: targetNode.id(),
      notes: "",
      tags: [],
      autoDocumentNodeLink: true,
      documentLinkSource: sourceNode.id(),
      documentLinkTarget: targetNode.id(),
      zIndex: Math.max(getElementZIndex(sourceNode), getElementZIndex(targetNode)) - 1
    }
  });
  renderDocumentOutline();
  return "created";
}

function markConnectionAsDocumentNodeLink(edge, sourceNodeId, targetNodeId) {
  if (!edge || edge.removed()) return false;
  if (isCitationConnection(edge)) return false;
  edge.data({
    autoDocumentNodeLink: true,
    documentLinkSource: sourceNodeId,
    documentLinkTarget: targetNodeId
  });
  return true;
}

function reconcileDocumentNodeLinkConnections(sourceNode, documentHtml = "") {
  if (!sourceNode || !sourceNode.length || sourceNode.removed()) return;
  const linkedNodeIds = getDocumentNodeLinkTargets(documentHtml);
  const removedEdges = [];

  cy.edges().forEach((edge) => {
    const targetId = getOtherEndpointForSource(edge, sourceNode.id());
    if (!targetId) return;
    if (linkedNodeIds.has(targetId)) return;
    if (!shouldRemoveConnectionForMissingNodeLink(edge, sourceNode.id(), targetId)) return;
    removedEdges.push(edge);
  });

  if (!removedEdges.length) return;
  removedEdges.forEach((edge) => {
    if (selectedEdge && selectedEdge.id() === edge.id()) {
      selectedEdge = null;
      hideEdgeNotesPanel();
    }
    edge.remove();
  });
  renderDocumentOutline();
  setStatus(`Removed ${removedEdges.length} connection(s) for deleted node link text.`);
}

function getDocumentNodeLinkTargets(documentHtml = "") {
  const targets = new Set();
  const template = document.createElement("template");
  template.innerHTML = documentHtml || "";
  template.content.querySelectorAll("a[data-node-link]").forEach((link) => {
    const targetId = link.dataset.nodeLink || "";
    const hasVisibleLinkText = Boolean((link.textContent || "").trim());
    if (targetId && hasVisibleLinkText) targets.add(targetId);
  });
  return targets;
}

function isDocumentNodeLinkConnection(edge, sourceNodeId) {
  if (!edge || edge.removed()) return false;
  if ((edge.data("documentLinkSource") || edge.data("source")) !== sourceNodeId) return false;
  if (edge.data("autoDocumentNodeLink")) return true;

  const targetId = edge.data("target");
  const legacyAutoId = `edge-${sourceNodeId}-${targetId}`;
  const tags = Array.isArray(edge.data("tags")) ? edge.data("tags") : parseTags(edge.data("tags") || "");
  const hasNotes = Boolean((edge.data("notes") || "").trim() || (edge.data("notesHtml") || "").trim());
  return edge.id() === legacyAutoId && !hasNotes && !tags.length && !isCitationConnection(edge);
}

function shouldRemoveConnectionForMissingNodeLink(edge, sourceNodeId, targetNodeId) {
  if (!edge || edge.removed() || !targetNodeId) return false;
  if (isCitationConnection(edge)) return false;
  if (isDocumentNodeLinkConnection(edge, sourceNodeId)) return true;

  const tags = Array.isArray(edge.data("tags")) ? edge.data("tags") : parseTags(edge.data("tags") || "");
  const hasNotes = Boolean((edge.data("notes") || "").trim() || (edge.data("notesHtml") || "").trim());
  const sourceTargetId = `edge-${sourceNodeId}-${targetNodeId}`;
  const targetSourceId = `edge-${targetNodeId}-${sourceNodeId}`;
  return (edge.id() === sourceTargetId || edge.id() === targetSourceId) && !hasNotes && !tags.length;
}

function getOtherEndpointForSource(edge, sourceNodeId) {
  if (!edge || edge.removed()) return "";
  const linkSource = edge.data("documentLinkSource");
  const linkTarget = edge.data("documentLinkTarget");
  if (linkSource === sourceNodeId && linkTarget) return linkTarget;

  const edgeSource = edge.data("source");
  const edgeTarget = edge.data("target");
  if (edgeSource === sourceNodeId) return edgeTarget;
  if (edgeTarget === sourceNodeId) return edgeSource;
  return "";
}

function hasConnectionBetweenNodes(sourceId, targetId) {
  return Boolean(findConnectionBetweenNodes(sourceId, targetId));
}

function findConnectionBetweenNodes(sourceId, targetId) {
  return cy.edges().filter((edge) => {
    const edgeSource = edge.data("source");
    const edgeTarget = edge.data("target");
    return (edgeSource === sourceId && edgeTarget === targetId)
      || (edgeSource === targetId && edgeTarget === sourceId);
  })[0] || null;
}

function isCitationConnection(edge) {
  if (!edge || edge.removed()) return false;
  const tags = Array.isArray(edge.data("tags")) ? edge.data("tags") : parseTags(edge.data("tags") || "");
  return Boolean(edge.data("citationRelation") || tags.includes("citation") || tags.includes("grobid"));
}

function openDocumentNodeLink(nodeId) {
  const node = cy.getElementById(nodeId);
  if (!node || !node.length || node.removed()) {
    setStatus("Linked node no longer exists.");
    return;
  }

  setActiveDocumentNode(node);
  setStatus(`Opened linked document section: ${node.data("label") || "Untitled"}.`);
}

function openDocumentImagePicker() {
  if (documentEditor.contentEditable !== "true") return;
  saveDocumentSelection();
  docImageInput.value = "";
  docImageInput.click();
}

function insertSelectedDocumentImage(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  insertDocumentImageFile(file);
}

async function handleDocumentEditorPaste(event) {
  if (pasteCopiedDocumentTableCells()) {
    event.preventDefault();
    return;
  }

  if (!useJoditImageResize && copiedDocumentImage && !hasEditableTextSelection()) {
    event.preventDefault();
    pasteCopiedDocumentImage();
    return;
  }

  const imageFiles = getImageFiles(event.clipboardData?.files);
  if (!imageFiles.length) {
    window.setTimeout(() => autoLinkDocumentUrls(), 0);
    return;
  }

  event.preventDefault();
  saveDocumentSelection();
  for (const file of imageFiles) {
    await insertDocumentImageFile(file);
  }
}

function handleDocumentEditorDragOver(event) {
  if (getImageFiles(event.dataTransfer?.items || event.dataTransfer?.files).length) {
    event.preventDefault();
  }
}

async function handleDocumentEditorDrop(event) {
  const imageFiles = getImageFiles(event.dataTransfer?.files);
  if (!imageFiles.length) return;

  event.preventDefault();
  focusDocumentEditorAtPoint(event.clientX, event.clientY);
  saveDocumentSelection();
  for (const file of imageFiles) {
    await insertDocumentImageFile(file);
  }
}

function getImageFiles(source) {
  return Array.from(source || [])
    .map((item) => {
      if (item.kind === "file" && typeof item.getAsFile === "function") return item.getAsFile();
      return item;
    })
    .filter((file) => file && file.type && file.type.startsWith("image/"));
}

function focusDocumentEditorAtPoint(clientX, clientY) {
  const root = getDocumentEditorRoot();
  if (joditEditor) joditEditor.s.focus();
  else documentEditor.focus();
  let range = null;

  if (document.caretRangeFromPoint) {
    range = document.caretRangeFromPoint(clientX, clientY);
  } else if (document.caretPositionFromPoint) {
    const position = document.caretPositionFromPoint(clientX, clientY);
    if (position) {
      range = document.createRange();
      range.setStart(position.offsetNode, position.offset);
      range.collapse(true);
    }
  }

  if (!range || !root.contains(range.commonAncestorContainer)) return;

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
  savedDocumentRange = range.cloneRange();
}

async function insertDocumentImageFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("Choose an image file.");
    return;
  }

  setStatus("Saving image...");
  let savedImage;
  try {
    const dataUrl = await readFileAsDataUrl(file);
    savedImage = await postJson("/api/images/save", {
      filename: file.name || "image",
      contentType: file.type,
      dataUrl,
      project: activeProject
    });
  } catch (error) {
    const message = error.message.includes("404")
      ? "Image save endpoint not found. Restart the FastAPI server, then insert the image again."
      : error.message;
    setStatus(message);
    setAutosaveMessage("Autosave ready.");
    return;
  }

  const image = document.createElement("img");
  image.src = savedImage.url;
  image.dataset.localImage = savedImage.relativePath || savedImage.url;
  image.alt = (file.name || "image").replace(/\.[^.]+$/, "");
  image.className = "doc-image";
  image.style.width = "420px";

  beginDocumentEdit();
  restoreDocumentSelection();
  insertNodeInDocumentEditor(image);
  if (!useJoditImageResize) {
    selectDocumentImage(image);
    image.addEventListener("load", updateDocumentImageResizeOverlay, { once: true });
    requestAnimationFrame(updateDocumentImageResizeOverlay);
  }
  updateDocumentBody();
  commitDocumentEdit();
  setStatus("Inserted image.");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(new Error("Could not read image file.")));
    reader.readAsDataURL(file);
  });
}

function insertNodeInDocumentEditor(node) {
  if (joditEditor) {
    joditEditor.s.focus();
    joditEditor.s.insertNode(node);
    return;
  }

  documentEditor.focus();
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0 && documentEditor.contains(selection.anchorNode)) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);
    range.setStartAfter(node);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  documentEditor.appendChild(node);
}

function copySelectedDocumentImage() {
  if (useJoditImageResize) return false;
  if (!selectedDocumentImage || selectedDocumentImage.tagName !== "IMG" || !documentEditor.contains(selectedDocumentImage)) return false;
  copiedDocumentImage = {
    src: selectedDocumentImage.getAttribute("src") || "",
    localImage: selectedDocumentImage.dataset.localImage || "",
    alt: selectedDocumentImage.getAttribute("alt") || "image",
    width: selectedDocumentImage.style.width || `${Math.round(selectedDocumentImage.getBoundingClientRect().width || 420)}px`,
    className: selectedDocumentImage.className || "doc-image"
  };
  setStatus("Copied image. Place the cursor in another note and press Ctrl+V.");
  return true;
}

function pasteCopiedDocumentImage() {
  if (useJoditImageResize) return false;
  if (!copiedDocumentImage || documentEditor.contentEditable !== "true") return false;
  beginDocumentEdit();
  restoreDocumentSelection();
  const image = document.createElement("img");
  image.src = copiedDocumentImage.src;
  image.alt = copiedDocumentImage.alt;
  image.className = copiedDocumentImage.className || "doc-image";
  if (copiedDocumentImage.localImage) image.dataset.localImage = copiedDocumentImage.localImage;
  image.style.width = copiedDocumentImage.width || "420px";
  image.style.height = "auto";
  insertNodeInDocumentEditor(image);
  if (!useJoditImageResize) {
    selectDocumentImage(image);
    image.addEventListener("load", updateDocumentImageResizeOverlay, { once: true });
    requestAnimationFrame(updateDocumentImageResizeOverlay);
  }
  updateDocumentBody();
  commitDocumentEdit();
  setStatus("Pasted copied image.");
  return true;
}

function copySelectedDocumentTableCells() {
  const cells = getActiveTableCellsForFormatting();
  if (!cells.length || !hasActiveTableCellFormattingTarget()) return false;
  copiedDocumentTableCells = serializeDocumentTableCells(cells);
  setStatus(`Copied ${cells.length} table cell(s). Select a target cell and press Ctrl+V.`);
  return true;
}

function pasteCopiedDocumentTableCells() {
  if (!copiedDocumentTableCells || documentEditor.contentEditable !== "true") return false;
  const targetCells = getActiveTableCellsForFormatting();
  if (!targetCells.length) return false;

  beginDocumentEdit();
  targetCells.forEach((cell, index) => {
    const source = copiedDocumentTableCells.cells[index % copiedDocumentTableCells.cells.length];
    if (!source) return;
    cell.innerHTML = source.html;
    applySerializedCellStyle(cell, source.style);
  });
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentImageResizeOverlay();
  updateDocumentTableToolsPosition();
  setStatus(`Pasted into ${targetCells.length} table cell(s).`);
  return true;
}

function serializeDocumentTableCells(cells) {
  return {
    cells: cells.map((cell) => ({
      html: cell.innerHTML,
      style: {
        fontFamily: cell.style.fontFamily,
        fontSize: cell.style.fontSize,
        fontWeight: cell.style.fontWeight,
        fontStyle: cell.style.fontStyle,
        textDecorationLine: cell.style.textDecorationLine,
        textDecoration: cell.style.textDecoration,
        color: cell.style.color,
        backgroundColor: cell.style.backgroundColor,
        textAlign: cell.style.textAlign,
        verticalAlign: cell.style.verticalAlign,
        border: cell.style.border,
        borderTop: cell.style.borderTop,
        borderRight: cell.style.borderRight,
        borderBottom: cell.style.borderBottom,
        borderLeft: cell.style.borderLeft,
        width: cell.style.width,
        height: cell.style.height
      }
    }))
  };
}

function applySerializedCellStyle(cell, style = {}) {
  Object.entries(style).forEach(([property, value]) => {
    cell.style[property] = value || "";
  });
}

function hasEditableTextSelection() {
  const selection = window.getSelection();
  return Boolean(
    selection
    && selection.rangeCount > 0
    && !selection.isCollapsed
    && documentEditor.contains(selection.anchorNode)
    && selection.toString()
  );
}

function isDocumentImagePasteContext(target) {
  if (documentEditor.contentEditable !== "true") return false;
  if (!activeDocumentTarget) return false;
  if (!target || !target.closest) return true;
  return Boolean(documentEditor.contains(target) || target.closest(".document-editor-shell"));
}

function openDocumentTablePicker(event) {
  if (documentEditor.contentEditable !== "true") return;
  saveDocumentSelection();
  documentTablePicker.hidden = false;
  const rect = docTableButton.getBoundingClientRect();
  const pickerRect = documentTablePicker.getBoundingClientRect();
  const left = clamp(rect.left, 8, window.innerWidth - pickerRect.width - 8);
  const top = clamp(rect.bottom + 6, 8, window.innerHeight - pickerRect.height - 8);
  documentTablePicker.style.left = `${left}px`;
  documentTablePicker.style.top = `${top}px`;
  documentTableRows.focus();
  event?.stopPropagation();
}

function hideDocumentTablePicker() {
  documentTablePicker.hidden = true;
}

function insertDocumentTableFromPicker() {
  const rows = clamp(Number.parseInt(documentTableRows.value, 10) || 3, 1, 20);
  const columns = clamp(Number.parseInt(documentTableColumns.value, 10) || 3, 1, 12);
  documentTableRows.value = rows;
  documentTableColumns.value = columns;
  insertDocumentTable(rows, columns);
  hideDocumentTablePicker();
}

function insertDocumentTable(rows = 3, columns = 3) {
  if (documentEditor.contentEditable !== "true") return;

  beginDocumentEdit();
  restoreDocumentSelection();

  const table = document.createElement("table");
  table.className = "document-table";
  const tbody = document.createElement("tbody");
  for (let rowIndex = 0; rowIndex < rows; rowIndex += 1) {
    const row = document.createElement("tr");
    for (let columnIndex = 0; columnIndex < columns; columnIndex += 1) {
      const cell = document.createElement("td");
      cell.appendChild(document.createElement("br"));
      row.appendChild(cell);
    }
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  insertNodeInDocumentEditor(table);
  table.insertAdjacentHTML("afterend", "<p><br></p>");
  selectDocumentTable(table);
  updateDocumentBody();
  commitDocumentEdit();
  setStatus("Inserted table.");
}

function saveDocumentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    savedDocumentRange = null;
    return;
  }
  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  const root = getDocumentEditorRoot();
  if (!root.contains(commonAncestor) && commonAncestor !== root) {
    savedDocumentRange = null;
    return;
  }
  savedDocumentRange = range.cloneRange();
}

function restoreDocumentSelection() {
  if (!savedDocumentRange) {
    if (joditEditor) joditEditor.s.focus();
    else documentEditor.focus();
    return;
  }

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(savedDocumentRange);
  if (joditEditor) joditEditor.s.focus();
  else documentEditor.focus();
}

function selectDocumentImage(image) {
  if (selectedDocumentImage && selectedDocumentImage !== image) {
    selectedDocumentImage.classList.remove("selected-doc-image");
  }
  clearSelectedDocumentTableRow();
  clearSelectedDocumentTableColumn();
  if (selectedDocumentTable) {
    selectedDocumentTable.classList.remove("selected-doc-table");
    selectedDocumentTable = null;
  }

  selectedDocumentImage = image;
  if (selectedDocumentImage) {
    selectedDocumentImage.classList.add("selected-doc-image");
    syncDocumentImageControls();
    requestDocumentImageResizeOverlayUpdate();
    return;
  }

  syncDocumentImageControls();
  hideDocumentImageResizeOverlay();
  hideDocumentTableTools();
}

function selectDocumentTable(table) {
  if (table) clearNativeDocumentSelection();
  if (selectedDocumentImage) {
    selectedDocumentImage.classList.remove("selected-doc-image");
    selectedDocumentImage = null;
  }
  clearSelectedDocumentTableCells();
  clearSelectedDocumentTableRow();
  clearSelectedDocumentTableColumn();
  if (selectedDocumentTable && selectedDocumentTable !== table) {
    selectedDocumentTable.classList.remove("selected-doc-table");
  }

  clearSelectedDocumentTableCells();
  selectedDocumentTable = table;
  if (selectedDocumentTable) {
    selectedDocumentTable.classList.add("selected-doc-table");
    syncDocumentImageControls();
    requestDocumentImageResizeOverlayUpdate();
    applyCopiedTableCellFormatFromSelectionIfActive();
    return;
  }

  syncDocumentImageControls();
  hideDocumentImageResizeOverlay();
  hideDocumentTableTools();
}

function selectDocumentTableColumn(cell) {
  const table = cell?.closest?.("table");
  const row = cell?.parentElement;
  if (!table || !row || !documentEditor.contains(table)) return;

  clearNativeDocumentSelection();
  if (selectedDocumentImage) {
    selectedDocumentImage.classList.remove("selected-doc-image");
    selectedDocumentImage = null;
  }
  if (selectedDocumentTable) {
    selectedDocumentTable.classList.remove("selected-doc-table");
    selectedDocumentTable = null;
  }

  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  clearSelectedDocumentTableCells();
  const visualPosition = getTableCellVisualPosition(table, cell);
  const columnIndex = visualPosition?.columnIndex ?? -1;
  if (columnIndex < 0) return;

  setSelectedDocumentTableColumnRange(table, columnIndex, columnIndex);
  syncDocumentImageControls();
  requestDocumentImageResizeOverlayUpdate();
  applyCopiedTableCellFormatFromSelectionIfActive();
  setStatus("Selected table column. Drag a side handle to resize it.");
}

function selectDocumentTableRow(cell) {
  const table = cell?.closest?.("table");
  const row = cell?.parentElement;
  if (!table || !row || !documentEditor.contains(table)) return;

  clearNativeDocumentSelection();
  if (selectedDocumentImage) {
    selectedDocumentImage.classList.remove("selected-doc-image");
    selectedDocumentImage = null;
  }
  if (selectedDocumentTable) {
    selectedDocumentTable.classList.remove("selected-doc-table");
    selectedDocumentTable = null;
  }

  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  clearSelectedDocumentTableCells();
  const rowIndex = Array.from(table.rows || []).indexOf(row);
  if (rowIndex < 0) return;
  setSelectedDocumentTableRowRange(table, rowIndex, rowIndex);
  syncDocumentImageControls();
  requestDocumentImageResizeOverlayUpdate();
  applyCopiedTableCellFormatFromSelectionIfActive();
  setStatus("Selected table row.");
}

function setSelectedDocumentTableColumnRange(table, startColumnIndex, endColumnIndex) {
  clearSelectedDocumentTableColumn();
  const firstColumnIndex = Math.min(startColumnIndex, endColumnIndex);
  const lastColumnIndex = Math.max(startColumnIndex, endColumnIndex);
  selectedDocumentTableColumn = {
    table,
    columnIndex: firstColumnIndex,
    endColumnIndex: lastColumnIndex
  };
  getTableColumnRangeCells(table, firstColumnIndex, lastColumnIndex).forEach((columnCell) => {
    columnCell.classList.add("selected-doc-table-column");
  });
}

function setSelectedDocumentTableRowRange(table, startRowIndex, endRowIndex) {
  clearSelectedDocumentTableRow();
  const firstRowIndex = Math.min(startRowIndex, endRowIndex);
  const lastRowIndex = Math.max(startRowIndex, endRowIndex);
  selectedDocumentTableRow = {
    table,
    rowIndex: firstRowIndex,
    endRowIndex: lastRowIndex,
    row: table.rows[firstRowIndex]
  };
  getTableRowRangeCells(table, firstRowIndex, lastRowIndex).forEach((rowCell) => {
    rowCell.classList.add("selected-doc-table-row");
  });
}

function setSelectedDocumentTableCellRange(table, startRowIndex, startColumnIndex, endRowIndex, endColumnIndex) {
  clearSelectedDocumentTableCells();
  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  if (selectedDocumentTable) {
    selectedDocumentTable.classList.remove("selected-doc-table");
    selectedDocumentTable = null;
  }
  const firstRowIndex = Math.min(startRowIndex, endRowIndex);
  const lastRowIndex = Math.max(startRowIndex, endRowIndex);
  const firstColumnIndex = Math.min(startColumnIndex, endColumnIndex);
  const lastColumnIndex = Math.max(startColumnIndex, endColumnIndex);
  selectedDocumentTableCells = {
    table,
    startRowIndex: firstRowIndex,
    endRowIndex: lastRowIndex,
    startColumnIndex: firstColumnIndex,
    endColumnIndex: lastColumnIndex
  };
  getTableCellRangeCells(table, firstRowIndex, firstColumnIndex, lastRowIndex, lastColumnIndex).forEach((cell) => {
    cell.classList.add("selected-doc-table-cell");
  });
}

function clearSelectedDocumentTableColumn() {
  getDocumentEditorRoot().querySelectorAll(".selected-doc-table-column").forEach((cell) => {
    cell.classList.remove("selected-doc-table-column");
  });
  selectedDocumentTableColumn = null;
}

function clearSelectedDocumentTableRow() {
  getDocumentEditorRoot().querySelectorAll(".selected-doc-table-row").forEach((cell) => {
    cell.classList.remove("selected-doc-table-row");
  });
  selectedDocumentTableRow = null;
}

function clearSelectedDocumentTableCells() {
  getDocumentEditorRoot().querySelectorAll(".selected-doc-table-cell").forEach((cell) => {
    cell.classList.remove("selected-doc-table-cell");
  });
  selectedDocumentTableCells = null;
}

function clearNativeDocumentSelection() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const anchorInside = documentEditor.contains(selection.anchorNode);
  const focusInside = documentEditor.contains(selection.focusNode);
  if (anchorInside || focusInside) selection.removeAllRanges();
}

function clearSelectedDocumentObject() {
  const hadSelection = Boolean(
    selectedDocumentImage
    || selectedDocumentTable
    || selectedDocumentTableCells
    || selectedDocumentTableColumn
    || selectedDocumentTableRow
  );
  if (!hadSelection) return false;

  selectDocumentImage(null);
  selectDocumentTable(null);
  clearSelectedDocumentTableCells();
  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  activeDocumentTableCell = null;
  hideDocumentImageResizeOverlay();
  hideDocumentTableTools();
  return true;
}

function handleDocumentSelectionEscape(event) {
  if (event.key !== "Escape") return;
  if (!clearSelectedDocumentObject()) return;

  event.preventDefault();
  event.stopPropagation();
  setStatus("Cleared document selection.");
}

function getTableColumnCells(table, columnIndex) {
  return getTableColumnRangeCells(table, columnIndex, columnIndex);
}

function getTableColumnRangeCells(table, startColumnIndex, endColumnIndex) {
  const firstColumnIndex = Math.min(startColumnIndex, endColumnIndex);
  const lastColumnIndex = Math.max(startColumnIndex, endColumnIndex);
  const grid = buildTableVisualGrid(table);
  return getUniqueVisualGridCells(grid, (slot) => (
    slot.columnIndex <= lastColumnIndex && slot.endColumnIndex >= firstColumnIndex
  ));
}

function getTableRowRangeCells(table, startRowIndex, endRowIndex) {
  const firstRowIndex = Math.min(startRowIndex, endRowIndex);
  const lastRowIndex = Math.max(startRowIndex, endRowIndex);
  const grid = buildTableVisualGrid(table);
  return getUniqueVisualGridCells(grid, (slot) => (
    slot.rowIndex <= lastRowIndex && slot.endRowIndex >= firstRowIndex
  ));
}

function getTableCellRangeCells(table, startRowIndex, startColumnIndex, endRowIndex, endColumnIndex) {
  const firstRowIndex = Math.min(startRowIndex, endRowIndex);
  const lastRowIndex = Math.max(startRowIndex, endRowIndex);
  const firstColumnIndex = Math.min(startColumnIndex, endColumnIndex);
  const lastColumnIndex = Math.max(startColumnIndex, endColumnIndex);
  const grid = buildTableVisualGrid(table);
  return getUniqueVisualGridCells(grid, (slot) => (
    slot.rowIndex <= lastRowIndex
    && slot.endRowIndex >= firstRowIndex
    && slot.columnIndex <= lastColumnIndex
    && slot.endColumnIndex >= firstColumnIndex
  ));
}

function getTableCellVisualPosition(table, cell) {
  const grid = buildTableVisualGrid(table);
  return grid.cells.get(cell) || null;
}

function buildTableVisualGrid(table) {
  const rows = Array.from(table.rows || []);
  const occupied = [];
  const cells = new Map();
  const slots = [];

  rows.forEach((row, rowIndex) => {
    if (!occupied[rowIndex]) occupied[rowIndex] = [];
    let columnIndex = 0;
    Array.from(row.cells || []).forEach((cell) => {
      while (occupied[rowIndex][columnIndex]) columnIndex += 1;
      const rowSpan = Math.max(1, Number.parseInt(cell.getAttribute("rowspan") || cell.rowSpan || "1", 10) || 1);
      const colSpan = Math.max(1, Number.parseInt(cell.getAttribute("colspan") || cell.colSpan || "1", 10) || 1);
      const slot = {
        cell,
        rowIndex,
        columnIndex,
        rowSpan,
        colSpan,
        endRowIndex: rowIndex + rowSpan - 1,
        endColumnIndex: columnIndex + colSpan - 1
      };
      cells.set(cell, slot);
      slots.push(slot);
      for (let rowOffset = 0; rowOffset < rowSpan; rowOffset += 1) {
        const targetRow = rowIndex + rowOffset;
        if (!occupied[targetRow]) occupied[targetRow] = [];
        for (let columnOffset = 0; columnOffset < colSpan; columnOffset += 1) {
          occupied[targetRow][columnIndex + columnOffset] = cell;
        }
      }
      columnIndex += colSpan;
    });
  });

  return { rows, cells, slots };
}

function getUniqueVisualGridCells(grid, predicate) {
  return grid.slots
    .filter(predicate)
    .map((slot) => slot.cell);
}

function getSelectedDocumentResizableElement() {
  if (!useJoditImageResize && selectedDocumentImage && isInsideDocumentEditor(selectedDocumentImage)) return selectedDocumentImage;
  if (selectedDocumentTable && isInsideDocumentEditor(selectedDocumentTable)) return selectedDocumentTable;
  if (selectedDocumentTableCells?.table && isInsideDocumentEditor(selectedDocumentTableCells.table)) return selectedDocumentTableCells.table;
  if (selectedDocumentTableColumn?.table && isInsideDocumentEditor(selectedDocumentTableColumn.table)) return selectedDocumentTableColumn.table;
  if (selectedDocumentTableRow?.row && isInsideDocumentEditor(selectedDocumentTableRow.row)) return selectedDocumentTableRow.row;
  return null;
}

function deleteSelectedDocumentResizableElement() {
  if (selectedDocumentTableCells?.table && isInsideDocumentEditor(selectedDocumentTableCells.table)) {
    beginDocumentEdit();
    getTableCellRangeCells(
      selectedDocumentTableCells.table,
      selectedDocumentTableCells.startRowIndex,
      selectedDocumentTableCells.startColumnIndex,
      selectedDocumentTableCells.endRowIndex,
      selectedDocumentTableCells.endColumnIndex
    ).forEach((cell) => {
      cell.innerHTML = "<br>";
    });
    updateDocumentBody();
    commitDocumentEdit();
    setStatus("Cleared selected table cells.");
    return;
  }

  if (selectedDocumentTableRow?.row && isInsideDocumentEditor(selectedDocumentTableRow.row)) {
    beginDocumentEdit();
    getTableRowRangeCells(
      selectedDocumentTableRow.table,
      selectedDocumentTableRow.rowIndex,
      selectedDocumentTableRow.endRowIndex
    ).forEach((cell) => {
      cell.innerHTML = "<br>";
    });
    updateDocumentBody();
    commitDocumentEdit();
    setStatus("Cleared selected table row.");
    return;
  }

  if (selectedDocumentTableColumn?.table && isInsideDocumentEditor(selectedDocumentTableColumn.table)) {
    beginDocumentEdit();
    getTableColumnRangeCells(
      selectedDocumentTableColumn.table,
      selectedDocumentTableColumn.columnIndex,
      selectedDocumentTableColumn.endColumnIndex
    ).forEach((cell) => {
      cell.innerHTML = "<br>";
    });
    updateDocumentBody();
    commitDocumentEdit();
    setStatus("Cleared selected table column.");
    return;
  }

  const selectedElement = getSelectedDocumentResizableElement();
  if (!selectedElement) {
    selectDocumentImage(null);
    selectDocumentTable(null);
    clearSelectedDocumentTableColumn();
    clearSelectedDocumentTableRow();
    return;
  }

  beginDocumentEdit();
  const element = selectedElement;
  const deletedImagePath = element.tagName === "IMG" ? getDocumentImageRelativePath(element) : "";
  selectDocumentImage(null);
  selectDocumentTable(null);
  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  element.remove();
  updateDocumentBody();
  commitDocumentEdit();
  if (deletedImagePath) deleteDocumentImageFileIfUnused(deletedImagePath);
  setStatus(element.tagName === "TABLE" ? "Deleted table." : "Deleted image.");
}

async function deleteDocumentImageFileIfUnused(relativePath) {
  const normalizedPath = normalizeDocumentImagePath(relativePath);
  if (!normalizedPath || documentImagePathIsReferenced(normalizedPath)) return;
  try {
    await postJson("/api/images/delete", { relativePath: normalizedPath, project: activeProject });
  } catch (error) {
    console.warn("Could not delete document image file.", error);
    setStatus(`Deleted image from notes, but could not delete file: ${error.message}`);
  }
}

function documentImagePathIsReferenced(relativePath) {
  const normalizedPath = normalizeDocumentImagePath(relativePath);
  if (!normalizedPath) return false;
  const graphData = getGraphData();
  return graphData.some((element) => {
    const data = element.data || {};
    return [
      data.documentHtml,
      data.notesHtml,
      normalizePublicationNotes(data.publicationNotes).notesHtml
    ].some((html) => htmlReferencesDocumentImage(html, normalizedPath));
  });
}

function htmlReferencesDocumentImage(html, relativePath) {
  if (!html) return false;
  const normalizedHtml = String(html).replace(/\\/g, "/");
  return normalizedHtml.includes(`data-local-image="${relativePath}"`)
    || normalizedHtml.includes(`data-local-image='${relativePath}'`)
    || normalizedHtml.includes(`src="/${relativePath}"`)
    || normalizedHtml.includes(`src="${relativePath}"`);
}

function getDocumentImageRelativePath(image) {
  return normalizeDocumentImagePath(image?.dataset?.localImage || image?.getAttribute?.("src") || "");
}

function normalizeDocumentImagePath(path) {
  const normalized = String(path || "").replace(/\\/g, "/").replace(/^https?:\/\/[^/]+/i, "").replace(/^\/+/, "");
  if (normalized.startsWith("autosaves/") && normalized.includes("/document_images/")) {
    const parts = normalized.split("/").filter(Boolean);
    const imageIndex = parts.indexOf("document_images");
    if (imageIndex >= 2 && imageIndex + 1 < parts.length) {
      const project = parts.slice(1, imageIndex).join("/");
      return `autosaves/${project}/document_images/${parts[parts.length - 1]}`;
    }
  }
  if (!normalized.startsWith("document_images/")) return "";
  return `document_images/${normalized.split("/").pop()}`;
}

async function runDocumentImageMaintenance() {
  try {
    const generated = await persistEmbeddedDocumentImagesInGraph();
    if (generated) {
      await writeGraphToAutosaveFolder(activeProject, { throwOnError: true });
      writeGraphToLocalStorage();
    }
    const usedImages = getReferencedDocumentImagePaths();
    const result = await postJson("/api/images/reconcile", { usedImages, project: activeProject });
    const migratedCount = applyDocumentImageMigrations(result.migrated || {});
    if (migratedCount) {
      await writeGraphToAutosaveFolder(activeProject, { throwOnError: true });
      writeGraphToLocalStorage();
    }
    const deletedCount = result.deleted?.length || 0;
    const missingCount = result.missing?.length || 0;
    if (generated || migratedCount || deletedCount || missingCount) {
      const parts = [];
      if (generated) parts.push(`generated ${generated}`);
      if (migratedCount) parts.push(`migrated ${migratedCount}`);
      if (deletedCount) parts.push(`deleted ${deletedCount} unused`);
      if (missingCount) parts.push(`${missingCount} missing`);
      setStatus(`Document image check complete: ${parts.join(", ")}.`);
    }
  } catch (error) {
    console.warn("Document image maintenance failed.", error);
    setStatus(`Document image check failed: ${error.message}`);
  }
}

function applyDocumentImageMigrations(migrations) {
  const entries = Object.entries(migrations || {}).filter(([from, to]) => from && to && from !== to);
  if (!entries.length) return 0;
  let changed = 0;
  cy.elements().forEach((element) => {
    const data = element.data();
    const updates = {};
    getDocumentHtmlFields(data).forEach((field) => {
      const nextHtml = replaceDocumentImagePaths(field.html, entries);
      if (nextHtml === field.html) return;
      changed += 1;
      if (field.path.length === 1) {
        updates[field.path[0]] = nextHtml;
      } else {
        const root = { ...(data[field.path[0]] || {}) };
        root[field.path[1]] = nextHtml;
        updates[field.path[0]] = root;
      }
    });
    if (Object.keys(updates).length) element.data(updates);
  });
  if (activeDocumentNodeId) loadActiveDocumentSection();
  return changed;
}

function replaceDocumentImagePaths(html, entries) {
  if (!html) return html;
  let nextHtml = html;
  entries.forEach(([from, to]) => {
    nextHtml = nextHtml
      .split(from).join(to)
      .split(`/${from}`).join(`/${to}`);
  });
  return nextHtml;
}

async function persistEmbeddedDocumentImagesInGraph() {
  let generated = 0;
  for (const element of cy.elements()) {
    const data = element.data();
    const updates = {};
    for (const field of getDocumentHtmlFields(data)) {
      const nextHtml = await persistEmbeddedImagesInHtml(field.html);
      if (nextHtml === field.html) continue;
      generated += 1;
      if (field.path.length === 1) {
        updates[field.path[0]] = nextHtml;
      } else {
        const root = { ...(data[field.path[0]] || {}) };
        root[field.path[1]] = nextHtml;
        updates[field.path[0]] = root;
      }
    }
    if (Object.keys(updates).length) element.data(updates);
  }
  return generated;
}

function getDocumentHtmlFields(data) {
  const fields = [];
  if (data.documentHtml) fields.push({ path: ["documentHtml"], html: data.documentHtml });
  if (data.notesHtml) fields.push({ path: ["notesHtml"], html: data.notesHtml });
  const publicationNotes = normalizePublicationNotes(data.publicationNotes);
  if (publicationNotes.notesHtml) fields.push({ path: ["publicationNotes", "notesHtml"], html: publicationNotes.notesHtml });
  return fields;
}

async function persistEmbeddedImagesInHtml(html) {
  if (!html || !String(html).includes("data:image/")) return html;
  const container = document.createElement("div");
  container.innerHTML = html;
  const images = Array.from(container.querySelectorAll("img[src^='data:image/']"));
  for (const image of images) {
    const existingPath = normalizeDocumentImagePath(image.dataset.localImage || "");
    if (existingPath) {
      image.src = `/${existingPath}`;
      continue;
    }
    const dataUrl = image.getAttribute("src") || "";
    const match = dataUrl.match(/^data:(image\/[A-Za-z0-9.+-]+);base64,/);
    if (!match) continue;
    const savedImage = await postJson("/api/images/save", {
      filename: image.getAttribute("alt") || "restored-image",
      contentType: match[1],
      dataUrl,
      project: activeProject
    });
    image.src = savedImage.url;
    image.dataset.localImage = savedImage.relativePath || savedImage.url;
  }
  return container.innerHTML;
}

function getReferencedDocumentImagePaths() {
  const paths = new Set();
  getGraphData().forEach((element) => {
    const data = element.data || {};
    getDocumentHtmlFields(data).forEach((field) => {
      extractDocumentImagePathsFromHtml(field.html).forEach((path) => paths.add(path));
    });
  });
  return Array.from(paths);
}

function extractDocumentImagePathsFromHtml(html) {
  if (!html) return [];
  const paths = new Set();
  const container = document.createElement("div");
  container.innerHTML = html;
  container.querySelectorAll("img").forEach((image) => {
    const path = normalizeDocumentImagePath(image.dataset.localImage || image.getAttribute("src") || "");
    if (path) paths.add(path);
  });
  return Array.from(paths);
}

function syncDocumentImageControls() {
  const enabled = Boolean(selectedDocumentImage && selectedDocumentImage.tagName === "IMG" && documentEditor.contains(selectedDocumentImage));
  docImageWidth.disabled = !enabled;
  docImageWidthNumber.disabled = !enabled;

  if (!enabled) {
    docImageWidth.value = "";
    docImageWidthNumber.value = "";
    return;
  }

  const width = Math.round(selectedDocumentImage.getBoundingClientRect().width || Number.parseInt(selectedDocumentImage.style.width, 10) || 420);
  docImageWidth.value = clamp(width, Number(docImageWidth.min), Number(docImageWidth.max));
  docImageWidthNumber.value = docImageWidth.value;
}

function updateSelectedDocumentImageWidth(event) {
  if (!selectedDocumentImage || !documentEditor.contains(selectedDocumentImage)) {
    selectDocumentImage(null);
    return;
  }

  const source = event.target;
  const rawValue = source.value;
  if (rawValue === "") return;

  const width = clamp(Number(rawValue), Number(docImageWidth.min), Number(docImageWidth.max));
  beginDocumentEdit();
  selectedDocumentImage.style.width = `${width}px`;
  selectedDocumentImage.style.height = "auto";
  docImageWidth.value = width;
  docImageWidthNumber.value = width;
  updateDocumentImageResizeOverlay();
  updateDocumentBody();
}

function requestDocumentImageResizeOverlayUpdate() {
  requestAnimationFrame(() => {
    updateDocumentImageResizeOverlay();
  });
}

function updateDocumentImageResizeOverlay() {
  const selectedElement = getSelectedDocumentResizableElement();
  if (!selectedElement) {
    hideDocumentImageResizeOverlay();
    return;
  }

  const page = selectedElement.closest(".document-page");
  if (!page) {
    hideDocumentImageResizeOverlay();
    return;
  }

  const elementRect = getSelectedDocumentResizeRect(selectedElement);
  if (!elementRect.width || !elementRect.height) {
    hideDocumentImageResizeOverlay();
    return;
  }

  const pageRect = page.getBoundingClientRect();
  documentImageResizeOverlay.hidden = false;
  documentImageResizeOverlay.style.left = `${elementRect.left - pageRect.left}px`;
  documentImageResizeOverlay.style.top = `${elementRect.top - pageRect.top}px`;
  documentImageResizeOverlay.style.width = `${elementRect.width}px`;
  documentImageResizeOverlay.style.height = `${elementRect.height}px`;
}

function getSelectedDocumentResizeRect(selectedElement) {
  if (selectedDocumentTableCells?.table === selectedElement) {
    const cells = getTableCellRangeCells(
      selectedDocumentTableCells.table,
      selectedDocumentTableCells.startRowIndex,
      selectedDocumentTableCells.startColumnIndex,
      selectedDocumentTableCells.endRowIndex,
      selectedDocumentTableCells.endColumnIndex
    );
    const rects = cells.map((cell) => cell.getBoundingClientRect()).filter((rect) => rect.width && rect.height);
    if (rects.length) {
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
  }
  if (selectedDocumentTableColumn?.table === selectedElement) {
    const cells = getTableColumnRangeCells(
      selectedDocumentTableColumn.table,
      selectedDocumentTableColumn.columnIndex,
      selectedDocumentTableColumn.endColumnIndex
    );
    const rects = cells.map((cell) => cell.getBoundingClientRect()).filter((rect) => rect.width && rect.height);
    if (rects.length) {
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
  }
  if (selectedDocumentTableRow?.row === selectedElement) {
    const cells = getTableRowRangeCells(
      selectedDocumentTableRow.table,
      selectedDocumentTableRow.rowIndex,
      selectedDocumentTableRow.endRowIndex
    );
    const rects = cells.map((cell) => cell.getBoundingClientRect()).filter((rect) => rect.width && rect.height);
    if (rects.length) {
      const left = Math.min(...rects.map((rect) => rect.left));
      const top = Math.min(...rects.map((rect) => rect.top));
      const right = Math.max(...rects.map((rect) => rect.right));
      const bottom = Math.max(...rects.map((rect) => rect.bottom));
      return { left, top, right, bottom, width: right - left, height: bottom - top };
    }
  }
  return selectedElement.getBoundingClientRect();
}

function hideDocumentImageResizeOverlay() {
  documentImageResizeOverlay.hidden = true;
}

function startDocumentImageResize(event) {
  const selectedElement = getSelectedDocumentResizableElement();
  if (!selectedElement) return;

  event.preventDefault();
  event.stopPropagation();
  beginDocumentEdit();
  const rect = getSelectedDocumentResizeRect(selectedElement);
  documentImageResizeDrag = {
    element: selectedElement,
    columnIndex: selectedDocumentTableColumn?.table === selectedElement ? selectedDocumentTableColumn.columnIndex : null,
    rowSelected: selectedDocumentTableRow?.row === selectedElement,
    handle: event.currentTarget.dataset.imageResizeHandle,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    aspectRatio: rect.width / Math.max(rect.height, 1)
  };
  documentImageResizeDrag.cellRangeSelected = selectedDocumentTableCells?.table === selectedElement;
  documentImageResizeDrag.columnEndIndex = selectedDocumentTableColumn?.table === selectedElement
    ? selectedDocumentTableColumn.endColumnIndex
    : null;
  documentImageResizeDrag.rowStartIndex = selectedDocumentTableRow?.row === selectedElement
    ? selectedDocumentTableRow.rowIndex
    : null;
  documentImageResizeDrag.rowEndIndex = selectedDocumentTableRow?.row === selectedElement
    ? selectedDocumentTableRow.endRowIndex
    : null;
  event.currentTarget.setPointerCapture?.(event.pointerId);
}

function continueDocumentImageResize(event) {
  if (!documentImageResizeDrag || !documentEditor.contains(documentImageResizeDrag.element)) return;

  const horizontalSign = documentImageResizeDrag.handle.includes("left") ? -1 : 1;
  const verticalSign = documentImageResizeDrag.handle.includes("top") ? -1 : 1;
  const horizontalDelta = (event.clientX - documentImageResizeDrag.startX) * horizontalSign;
  const selectedElement = documentImageResizeDrag.element;

  if (documentImageResizeDrag.cellRangeSelected) {
    updateDocumentImageResizeOverlay();
  } else if (documentImageResizeDrag.rowSelected) {
    const verticalDelta = (event.clientY - documentImageResizeDrag.startY) * verticalSign;
    const height = clamp(Math.round(documentImageResizeDrag.startHeight + verticalDelta), 28, 600);
    getTableRowRangeCells(
      selectedDocumentTableRow.table,
      documentImageResizeDrag.rowStartIndex,
      documentImageResizeDrag.rowEndIndex
    ).forEach((cell) => {
      cell.style.height = `${height}px`;
    });
  } else if (selectedElement.tagName === "TABLE" && documentImageResizeDrag.columnIndex !== null) {
    const width = clamp(Math.round(documentImageResizeDrag.startWidth + horizontalDelta), 48, 900);
    getTableColumnRangeCells(
      selectedElement,
      documentImageResizeDrag.columnIndex,
      documentImageResizeDrag.columnEndIndex
    ).forEach((cell) => {
      cell.style.width = `${width}px`;
    });
  } else if (selectedElement.tagName === "TABLE") {
    const verticalDelta = (event.clientY - documentImageResizeDrag.startY) * verticalSign;
    const width = clamp(Math.round(documentImageResizeDrag.startWidth + horizontalDelta), 160, 1400);
    const height = clamp(Math.round(documentImageResizeDrag.startHeight + verticalDelta), 80, 1600);
    selectedElement.style.width = `${width}px`;
    selectedElement.style.height = `${height}px`;
  } else {
    const verticalDelta = (event.clientY - documentImageResizeDrag.startY) * verticalSign * documentImageResizeDrag.aspectRatio;
    const intendedDelta = Math.abs(horizontalDelta) > Math.abs(verticalDelta) ? horizontalDelta : verticalDelta;
    const width = clamp(
      Math.round(documentImageResizeDrag.startWidth + intendedDelta),
      Number(docImageWidth.min),
      Number(docImageWidth.max)
    );
    selectedElement.style.width = `${width}px`;
    selectedElement.style.height = "auto";
    docImageWidth.value = width;
    docImageWidthNumber.value = width;
  }
  updateDocumentImageResizeOverlay();
  updateDocumentBody();
}

function finishDocumentImageResize() {
  if (!documentImageResizeDrag) return;
  documentImageResizeDrag = null;
  updateDocumentImageResizeOverlay();
  commitDocumentEdit();
}

function showDocumentTableTools(table) {
  if (!table || !documentEditor.contains(table)) return;
  activeDocumentTable = table;
  documentTableTools.hidden = false;
  updateDocumentTableToolsPosition(table);
}

function hideDocumentTableTools() {
  documentTableTools.hidden = true;
  activeDocumentTableCell = null;
  activeDocumentTable = null;
}

function handleDocumentTableToolsOutsidePointerDown(event) {
  if (documentTableTools.hidden) return;
  if (!shouldCloseDocumentTableTools(event)) return;
  hideDocumentTableTools();
}

function shouldCloseDocumentTableTools(event) {
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  if (path.includes(documentTableTools)) return false;
  if (activeDocumentTable && path.includes(activeDocumentTable)) return false;
  if (documentTableTools.contains(event.target)) return false;
  if (activeDocumentTable && activeDocumentTable.contains(event.target)) return false;
  const table = event.target?.closest?.("table");
  if (table && documentEditor.contains(table)) return false;
  return true;
}

function updateDocumentTableToolsPosition(table = activeDocumentTable || activeDocumentTableCell?.closest?.("table") || selectedDocumentTable || selectedDocumentTableCells?.table || selectedDocumentTableColumn?.table || selectedDocumentTableRow?.table) {
  if (documentTableTools.hidden || !table || !documentEditor.contains(table)) return;
  const pageRect = documentPage.getBoundingClientRect();
  const tableRect = table.getBoundingClientRect();
  const toolsRect = documentTableTools.getBoundingClientRect();
  const left = clamp(tableRect.left - pageRect.left, 8, pageRect.width - toolsRect.width - 8);
  const preferredTop = tableRect.top - pageRect.top - toolsRect.height - 8;
  const fallbackTop = tableRect.bottom - pageRect.top + 8;
  const top = preferredTop >= 8
    ? preferredTop
    : clamp(fallbackTop, 8, pageRect.height - toolsRect.height - 8);
  documentTableTools.style.left = `${left}px`;
  documentTableTools.style.top = `${top}px`;
}

function runDocumentTableAction(action) {
  const cell = activeDocumentTableCell;
  const table = cell?.closest?.("table") || selectedDocumentTable || selectedDocumentTableCells?.table || selectedDocumentTableColumn?.table || selectedDocumentTableRow?.table;
  if (!table || !documentEditor.contains(table)) return;

  if (action === "select-table") {
    selectDocumentTable(table);
    showDocumentTableTools(table);
    return;
  }
  if (!cell || !table.contains(cell)) {
    setStatus("Click inside a table cell first.");
    return;
  }
  if (action === "select-row") return selectDocumentTableRow(cell);
  if (action === "select-column") return selectDocumentTableColumn(cell);
  if (action === "align-top" || action === "align-middle" || action === "align-bottom") {
    return applyTableCellVerticalAlignment(action.replace("align-", ""));
  }
  if (action === "border-all" || action === "border-outside" || action === "border-none") {
    return applyTableBorders(action.replace("border-", ""));
  }

  beginDocumentEdit();
  if (action === "row-above") insertTableRow(cell, "above");
  if (action === "row-below") insertTableRow(cell, "below");
  if (action === "delete-row") deleteTableRow(cell);
  if (action === "column-left") insertTableColumn(cell, "left");
  if (action === "column-right") insertTableColumn(cell, "right");
  if (action === "delete-column") deleteTableColumn(cell);
  clearSelectedDocumentTableColumn();
  clearSelectedDocumentTableRow();
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentImageResizeOverlay();
  showDocumentTableTools(table);
}

function makeEmptyTableCell() {
  const cell = document.createElement("td");
  cell.appendChild(document.createElement("br"));
  return cell;
}

function insertTableRow(cell, position) {
  const row = cell.parentElement;
  const newRow = row.cloneNode(false);
  Array.from(row.cells || []).forEach(() => newRow.appendChild(makeEmptyTableCell()));
  if (position === "above") row.before(newRow);
  else row.after(newRow);
  activeDocumentTableCell = newRow.cells[Math.min(cell.cellIndex, newRow.cells.length - 1)] || null;
  setStatus(position === "above" ? "Inserted row above." : "Inserted row below.");
}

function deleteTableRow(cell) {
  const row = cell.parentElement;
  const table = row.closest("table");
  if ((table.rows || []).length <= 1) {
    table.remove();
    activeDocumentTableCell = null;
    hideDocumentTableTools();
    setStatus("Deleted table.");
    return;
  }
  const nextRow = row.nextElementSibling || row.previousElementSibling;
  row.remove();
  activeDocumentTableCell = nextRow?.cells?.[Math.min(cell.cellIndex, nextRow.cells.length - 1)] || null;
  setStatus("Deleted row.");
}

function insertTableColumn(cell, position) {
  const columnIndex = cell.cellIndex;
  const insertIndex = position === "left" ? columnIndex : columnIndex + 1;
  Array.from(cell.closest("table").rows || []).forEach((row) => {
    row.insertBefore(makeEmptyTableCell(), row.cells[insertIndex] || null);
  });
  activeDocumentTableCell = cell.parentElement.cells[insertIndex] || cell;
  setStatus(position === "left" ? "Inserted column left." : "Inserted column right.");
}

function deleteTableColumn(cell) {
  const table = cell.closest("table");
  const columnIndex = cell.cellIndex;
  const firstRow = table.rows[0];
  if (!firstRow || firstRow.cells.length <= 1) {
    table.remove();
    activeDocumentTableCell = null;
    hideDocumentTableTools();
    setStatus("Deleted table.");
    return;
  }
  Array.from(table.rows || []).forEach((row) => row.cells[columnIndex]?.remove());
  activeDocumentTableCell = cell.parentElement?.cells?.[Math.min(columnIndex, cell.parentElement.cells.length - 1)] || table.rows[0]?.cells?.[0] || null;
  setStatus("Deleted column.");
}

function getActiveTableCellsForFormatting() {
  if (selectedDocumentTableCells?.table && isInsideDocumentEditor(selectedDocumentTableCells.table)) {
    return getTableCellRangeCells(
      selectedDocumentTableCells.table,
      selectedDocumentTableCells.startRowIndex,
      selectedDocumentTableCells.startColumnIndex,
      selectedDocumentTableCells.endRowIndex,
      selectedDocumentTableCells.endColumnIndex
    );
  }
  if (selectedDocumentTableColumn?.table && isInsideDocumentEditor(selectedDocumentTableColumn.table)) {
    return getTableColumnRangeCells(
      selectedDocumentTableColumn.table,
      selectedDocumentTableColumn.columnIndex,
      selectedDocumentTableColumn.endColumnIndex
    );
  }
  if (selectedDocumentTableRow?.row && isInsideDocumentEditor(selectedDocumentTableRow.row)) {
    return getTableRowRangeCells(
      selectedDocumentTableRow.table,
      selectedDocumentTableRow.rowIndex,
      selectedDocumentTableRow.endRowIndex
    );
  }
  if (selectedDocumentTable && isInsideDocumentEditor(selectedDocumentTable)) {
    return Array.from(selectedDocumentTable.querySelectorAll("td, th"));
  }
  if (activeDocumentTableCell && isInsideDocumentEditor(activeDocumentTableCell)) {
    return [activeDocumentTableCell];
  }
  return [];
}

function hasActiveTableCellFormattingTarget() {
  return getActiveTableCellsForFormatting().length > 0
    && Boolean(selectedDocumentTableCells || selectedDocumentTableColumn || selectedDocumentTableRow || selectedDocumentTable);
}

function applyStyleToActiveTableCells(applyStyle, status = "Formatted selected table cells.") {
  if (!hasActiveTableCellFormattingTarget()) return false;
  const cells = getActiveTableCellsForFormatting();
  if (!cells.length) return false;

  beginDocumentEdit();
  cells.forEach(applyStyle);
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentImageResizeOverlay();
  updateDocumentTableToolsPosition();
  setStatus(status);
  return true;
}

function runTableFormattingCommand(command) {
  const handlers = {
    bold: (cell) => {
      cell.style.fontWeight = isBoldTableCell(cell) ? "" : "700";
    },
    italic: (cell) => {
      cell.style.fontStyle = cell.style.fontStyle === "italic" ? "" : "italic";
    },
    underline: (cell) => {
      const decorations = new Set(String(cell.style.textDecorationLine || cell.style.textDecoration || "").split(/\s+/).filter(Boolean));
      if (decorations.has("underline")) decorations.delete("underline");
      else decorations.add("underline");
      cell.style.textDecorationLine = Array.from(decorations).join(" ");
    },
    justifyLeft: (cell) => {
      cell.style.textAlign = "left";
    },
    justifyCenter: (cell) => {
      cell.style.textAlign = "center";
    },
    justifyRight: (cell) => {
      cell.style.textAlign = "right";
    }
  };
  if (!handlers[command]) return false;
  return applyStyleToActiveTableCells(handlers[command], "Formatted selected table cells.");
}

function runTableValueFormattingCommand(command, value) {
  const handlers = {
    fontName: (cell) => {
      cell.style.fontFamily = value;
    },
    foreColor: (cell) => {
      cell.style.color = value;
    },
    hiliteColor: (cell) => {
      cell.style.backgroundColor = value;
    },
    backColor: (cell) => {
      cell.style.backgroundColor = value;
    }
  };
  if (!handlers[command]) return false;
  return applyStyleToActiveTableCells(handlers[command], "Formatted selected table cells.");
}

function applyTableBlockFormatting(block) {
  const styles = {
    p: { fontSize: "", fontWeight: "", fontStyle: "", borderLeft: "", paddingLeft: "" },
    h1: { fontSize: "24px", fontWeight: "700", fontStyle: "", borderLeft: "", paddingLeft: "" },
    h2: { fontSize: "20px", fontWeight: "700", fontStyle: "", borderLeft: "", paddingLeft: "" },
    h3: { fontSize: "17px", fontWeight: "700", fontStyle: "", borderLeft: "", paddingLeft: "" },
    blockquote: { fontStyle: "italic", borderLeft: "3px solid #cbd5e1", paddingLeft: "10px" }
  };
  if (!styles[block]) return false;
  return applyStyleToActiveTableCells((cell) => {
    Object.entries(styles[block]).forEach(([property, value]) => {
      cell.style[property] = value;
    });
  }, "Formatted selected table cells.");
}

function isBoldTableCell(cell) {
  const weight = cell.style.fontWeight || window.getComputedStyle(cell).fontWeight;
  return weight === "bold" || Number.parseInt(weight, 10) >= 600;
}

function applyTableCellVerticalAlignment(alignment) {
  const value = alignment === "middle" ? "middle" : alignment === "bottom" ? "bottom" : "top";
  const cells = getActiveTableCellsForFormatting();
  if (!cells.length) {
    setStatus("Click inside a table cell first.");
    return;
  }

  beginDocumentEdit();
  cells.forEach((cell) => {
    cell.style.verticalAlign = value;
  });
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentImageResizeOverlay();
  updateDocumentTableToolsPosition();
  setStatus(`Aligned table text to ${value}.`);
}

function applyTableBorders(mode) {
  const table = selectedDocumentTable
    || selectedDocumentTableCells?.table
    || selectedDocumentTableColumn?.table
    || selectedDocumentTableRow?.row?.closest?.("table")
    || activeDocumentTableCell?.closest?.("table");
  if (!table || !documentEditor.contains(table)) {
    setStatus("Click inside a table cell first.");
    return;
  }

  beginDocumentEdit();
  if (mode === "none") {
    getActiveTableCellsForFormatting().forEach((cell) => {
      cell.style.border = "0";
    });
  } else if (mode === "outside") {
    applyOutsideTableBorder(table);
  } else {
    getActiveTableCellsForFormatting().forEach((cell) => {
      cell.style.border = "1px solid #111827";
    });
  }
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentImageResizeOverlay();
  updateDocumentTableToolsPosition(table);
  setStatus(mode === "none" ? "Removed table borders." : "Updated table borders.");
}

function applyOutsideTableBorder(table) {
  const rows = Array.from(table.rows || []);
  if (!rows.length) return;
  const selectedCells = new Set(getActiveTableCellsForFormatting());
  const grid = buildTableVisualGrid(table);
  const selectedSlots = grid.slots.filter((slot) => selectedCells.has(slot.cell));
  if (!selectedSlots.length) return;

  const firstSelectedRow = Math.min(...selectedSlots.map((slot) => slot.rowIndex));
  const lastSelectedRow = Math.max(...selectedSlots.map((slot) => slot.endRowIndex));
  const firstSelectedColumn = Math.min(...selectedSlots.map((slot) => slot.columnIndex));
  const lastSelectedColumn = Math.max(...selectedSlots.map((slot) => slot.endColumnIndex));
  selectedSlots.forEach((slot) => {
    if (slot.rowIndex === firstSelectedRow) slot.cell.style.borderTop = "1px solid #111827";
    if (slot.endRowIndex === lastSelectedRow) slot.cell.style.borderBottom = "1px solid #111827";
    if (slot.columnIndex === firstSelectedColumn) slot.cell.style.borderLeft = "1px solid #111827";
    if (slot.endColumnIndex === lastSelectedColumn) slot.cell.style.borderRight = "1px solid #111827";
  });
}

function handleDocumentEditorPointerDown(event) {
  const image = event.target.closest("img");
  if (!useJoditImageResize && image && documentEditor.contains(image)) {
    event.preventDefault();
    selectDocumentImage(image);
    return;
  }

  const cell = event.target.closest("td, th");
  if (cell && documentEditor.contains(cell)) {
    if (selectedDocumentImage) {
      selectedDocumentImage.classList.remove("selected-doc-image");
      selectedDocumentImage = null;
      syncDocumentImageControls();
      hideDocumentImageResizeOverlay();
    }
    clearSelectedDocumentTableCells();
    activeDocumentTableCell = cell;
    showDocumentTableTools(cell.closest("table"));
    startDocumentTableSelectionDrag(event, cell);
    return;
  }

  const table = event.target.closest("table");
  if (table && documentEditor.contains(table)) {
    showDocumentTableTools(table);
    if (selectedDocumentTableColumn || selectedDocumentTableRow || selectedDocumentImage) {
      selectDocumentImage(null);
      clearSelectedDocumentTableColumn();
      clearSelectedDocumentTableRow();
    }
    return;
  }

  selectDocumentImage(null);
  selectDocumentTable(null);
  activeDocumentTableCell = null;
  hideDocumentTableTools();
}

function startDocumentTableSelectionDrag(event, cell) {
  if (event.button !== 0) return;
  const table = cell.closest("table");
  const visualPosition = getTableCellVisualPosition(table, cell);
  if (!visualPosition) return;

  documentTableSelectionDrag = {
    pointerId: event.pointerId,
    table,
    startCell: cell,
    startX: event.clientX,
    startY: event.clientY,
    startRowIndex: visualPosition.rowIndex,
    startColumnIndex: visualPosition.columnIndex,
    startEndRowIndex: visualPosition.endRowIndex,
    startEndColumnIndex: visualPosition.endColumnIndex,
    active: false
  };
}

function continueDocumentTableSelectionDrag(event) {
  if (!documentTableSelectionDrag || event.pointerId !== documentTableSelectionDrag.pointerId) return;
  const drag = documentTableSelectionDrag;
  if (!documentEditor.contains(drag.table)) {
    documentTableSelectionDrag = null;
    return;
  }

  const dx = event.clientX - drag.startX;
  const dy = event.clientY - drag.startY;
  const distance = Math.hypot(dx, dy);
  if (!drag.active && distance < 10) return;

  const cell = getTableCellAtPoint(event.clientX, event.clientY, drag.table);
  if (!cell) return;
  const visualPosition = getTableCellVisualPosition(drag.table, cell);
  if (!visualPosition) return;

  event.preventDefault();
  clearNativeDocumentSelection();
  drag.active = true;
  setSelectedDocumentTableCellRange(
    drag.table,
    Math.min(drag.startRowIndex, visualPosition.rowIndex),
    Math.min(drag.startColumnIndex, visualPosition.columnIndex),
    Math.max(drag.startEndRowIndex, visualPosition.endRowIndex),
    Math.max(drag.startEndColumnIndex, visualPosition.endColumnIndex)
  );
  setStatus("Selected table cells.");
  syncDocumentImageControls();
  requestDocumentImageResizeOverlayUpdate();
  applyCopiedTableCellFormatFromSelectionIfActive();
}

function finishDocumentTableSelectionDrag(event) {
  if (!documentTableSelectionDrag || event.pointerId !== documentTableSelectionDrag.pointerId) return;
  documentTableSelectionDrag = null;
}

function getTableCellAtPoint(x, y, table) {
  const element = document.elementFromPoint(x, y);
  const cell = element?.closest?.("td, th");
  return cell && table.contains(cell) ? cell : null;
}

function normalizeHyperlinkUrl(url) {
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

const URL_TEXT_PATTERN = /\b((?:https?:\/\/|www\.)[^\s<>"']*\.[^\s<>"']*[^\s<>"'.,;:!?)]?)/gi;

function autoLinkDocumentUrls({ preserveSelection = true } = {}) {
  if (documentEditor.contentEditable !== "true") return false;
  const savedRange = preserveSelection ? saveEditorRange() : null;
  let changed = false;
  const textNodes = getAutolinkTextNodes(getDocumentEditorRoot());

  textNodes.forEach((textNode) => {
    if (linkTextNodeUrls(textNode)) changed = true;
  });

  if (!changed) return false;
  updateDocumentLinks();
  updateDocumentBody();
  if (savedRange) restoreEditorRange(savedRange);
  return true;
}

function getAutolinkTextNodes(root) {
  const nodes = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !URL_TEXT_PATTERN.test(node.nodeValue)) {
        URL_TEXT_PATTERN.lastIndex = 0;
        return NodeFilter.FILTER_REJECT;
      }
      URL_TEXT_PATTERN.lastIndex = 0;
      const parent = node.parentElement;
      if (!parent || parent.closest("a, button, select, textarea, input, .document-link-popover, .document-node-link-picker")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  while (walker.nextNode()) nodes.push(walker.currentNode);
  return nodes;
}

function linkTextNodeUrls(textNode) {
  const text = textNode.nodeValue;
  URL_TEXT_PATTERN.lastIndex = 0;
  let match;
  let lastIndex = 0;
  const fragment = document.createDocumentFragment();
  let changed = false;

  while ((match = URL_TEXT_PATTERN.exec(text)) !== null) {
    const urlText = match[0];
    if (match.index > lastIndex) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
    }

    const link = document.createElement("a");
    link.href = normalizeHyperlinkUrl(urlText);
    link.textContent = urlText;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    fragment.appendChild(link);
    lastIndex = match.index + urlText.length;
    changed = true;
  }

  if (!changed) return false;
  if (lastIndex < text.length) fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
  textNode.replaceWith(fragment);
  return true;
}

function saveEditorRange() {
  const selection = window.getSelection();
  const root = getDocumentEditorRoot();
  if (!selection || selection.rangeCount === 0 || !root.contains(selection.anchorNode)) return null;
  return selection.getRangeAt(0).cloneRange();
}

function restoreEditorRange(range) {
  if (!range) return;
  const selection = window.getSelection();
  if (!selection) return;
  try {
    selection.removeAllRanges();
    selection.addRange(range);
  } catch (error) {
    if (joditEditor) joditEditor.s.focus();
    else documentEditor.focus();
  }
}

function updateDocumentLinks() {
  const root = getDocumentEditorRoot();
  root.querySelectorAll("a[href]").forEach((link) => {
    if (link.dataset.nodeLink) {
      const linkedNode = cy?.getElementById(link.dataset.nodeLink);
      if (linkedNode && linkedNode.length && !linkedNode.removed()) {
        link.style.color = getNodeColorForType(linkedNode.data("type"));
        link.title = `${linkedNode.data("type") || "Node"}: ${linkedNode.data("label") || "Untitled"}`;
      } else {
        link.style.color = getNodeColorForType("Unassigned");
        link.title = "Missing linked node";
      }
      return;
    }
    link.style.removeProperty("color");
    link.removeAttribute("title");
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });
}

function updateDocumentImages() {
  const root = getDocumentEditorRoot();
  root.querySelectorAll("img[data-unsaved-image]").forEach((image) => {
    const placeholder = document.createElement("span");
    placeholder.className = "unsaved-image-placeholder";
    placeholder.dataset.unsavedImage = "true";
    placeholder.textContent = "Unsaved embedded image. Delete this placeholder and reinsert the image.";
    image.replaceWith(placeholder);
  });
  if (!useJoditImageResize) {
    root.querySelectorAll("img").forEach((image) => {
      image.addEventListener("load", updateDocumentImageResizeOverlay, { once: true });
    });
    requestDocumentImageResizeOverlayUpdate();
  }
}

function handleDocumentEditorClick(event) {
  const root = getDocumentEditorRoot();
  const placeholder = event.target.closest(".unsaved-image-placeholder");
  if (placeholder && root.contains(placeholder)) {
    selectDocumentImage(placeholder);
    hideDocumentLinkPopover();
    return;
  }

  const image = event.target.closest("img");
  if (!useJoditImageResize && image && root.contains(image)) {
    selectDocumentImage(image);
    hideDocumentLinkPopover();
    return;
  }

  const link = event.target.closest("a[href]");
  if (link && root.contains(link)) {
    event.preventDefault();
    showDocumentLinkPopover(link);
    return;
  }

  const table = event.target.closest("table");
  if (table && root.contains(table)) return;

  selectDocumentImage(null);
}

function getActiveDocumentLink() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return null;

  let node = selection.anchorNode;
  const root = getDocumentEditorRoot();
  if (!node || !root.contains(node)) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
  return node ? node.closest("a[href]") : null;
}

function showDocumentLinkPopover(link) {
  const href = link.getAttribute("href") || "";
  const linkedNodeId = link.dataset.nodeLink || "";
  if (!link.dataset.linkInstanceId) {
    link.dataset.linkInstanceId = `doc-link-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  documentLinkPopover.dataset.activeLink = href;
  documentLinkPopover.dataset.activeNodeLink = linkedNodeId;
  documentLinkPopover.dataset.activeLinkInstanceId = link.dataset.linkInstanceId;

  if (linkedNodeId) {
    const linkedNode = cy.getElementById(linkedNodeId);
    const label = linkedNode && linkedNode.length && !linkedNode.removed()
      ? linkedNode.data("label") || "Linked node"
      : "Missing linked node";
    documentLinkUrl.href = href;
    documentLinkUrl.textContent = `Node: ${label}`;
  } else {
    documentLinkUrl.href = href;
    documentLinkUrl.textContent = href;
  }

  documentLinkPopover.hidden = false;
  const pageRect = documentLinkPopover.parentElement.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const popoverRect = documentLinkPopover.getBoundingClientRect();
  const left = clamp(linkRect.left - pageRect.left, 16, pageRect.width - popoverRect.width - 16);
  const top = clamp(linkRect.bottom - pageRect.top + 8, 16, pageRect.height - popoverRect.height - 16);
  documentLinkPopover.style.left = `${left}px`;
  documentLinkPopover.style.top = `${top}px`;
}

function hideDocumentLinkPopover() {
  documentLinkPopover.hidden = true;
  documentLinkPopover.dataset.activeLink = "";
  documentLinkPopover.dataset.activeNodeLink = "";
  documentLinkPopover.dataset.activeLinkInstanceId = "";
}

function openActiveDocumentLink() {
  const href = documentLinkPopover.dataset.activeLink;
  const linkedNodeId = documentLinkPopover.dataset.activeNodeLink;
  if (linkedNodeId) {
    openDocumentNodeLink(linkedNodeId);
    hideDocumentLinkPopover();
    return;
  }
  if (href) window.open(href, "_blank", "noopener,noreferrer");
}

function removeActiveDocumentLink() {
  const href = documentLinkPopover.dataset.activeLink;
  const linkedNodeId = documentLinkPopover.dataset.activeNodeLink || "";
  const linkInstanceId = documentLinkPopover.dataset.activeLinkInstanceId || "";
  if (!href || documentEditor.contentEditable !== "true") return;

  const links = Array.from(documentEditor.querySelectorAll("a[href]"));
  const link = links.find((item) => item.dataset.linkInstanceId === linkInstanceId)
    || links.find((item) => item.getAttribute("href") === href && (!linkedNodeId || item.dataset.nodeLink === linkedNodeId));
  if (!link) return;

  beginDocumentEdit();
  const sourceNode = getActiveDocumentNode();
  const beforeSnapshot = JSON.stringify(getGraphData());
  const text = document.createTextNode(link.textContent || href);
  link.replaceWith(text);
  hideDocumentLinkPopover();
  if (linkedNodeId && sourceNode) {
    removeDocumentNodeLinkConnection(sourceNode, linkedNodeId);
  }
  updateDocumentBody();
  if (JSON.stringify(getGraphData()) !== beforeSnapshot) {
    documentEditSnapshot = null;
    pushUndoSnapshot(beforeSnapshot, "remove link");
  } else {
    commitDocumentEdit();
  }
}

function removeDocumentNodeLinkConnection(sourceNode, targetNodeId) {
  if (!sourceNode || !sourceNode.length || sourceNode.removed() || !targetNodeId) return false;
  const removedEdges = [];
  cy.edges().forEach((edge) => {
    if (!edgeConnectsNodes(edge, sourceNode.id(), targetNodeId)) return;
    if (isCitationConnection(edge)) return;
    removedEdges.push(edge);
  });
  if (!removedEdges.length) return false;
  removedEdges.forEach((edge) => {
    if (selectedEdge && selectedEdge.id() === edge.id()) {
      selectedEdge = null;
      hideEdgeNotesPanel();
    }
    edge.remove();
  });
  renderDocumentOutline();
  setStatus("Removed node link and its connection.");
  return true;
}

function edgeConnectsNodes(edge, sourceId, targetId) {
  if (!edge || edge.removed()) return false;
  const edgeSource = edge.data("source");
  const edgeTarget = edge.data("target");
  return (edgeSource === sourceId && edgeTarget === targetId)
    || (edgeSource === targetId && edgeTarget === sourceId);
}

function runDocumentBlockCommand(block) {
  if (documentEditor.contentEditable !== "true") return;
  if (applyTableBlockFormatting(block)) return;
  beginDocumentEdit();
  documentEditor.focus();
  document.execCommand("formatBlock", false, block);
  updateDocumentBody();
  commitDocumentEdit();
  updateDocumentFontToolbarState();
}

function getActiveDocumentNode() {
  if (activeDocumentTarget?.type !== "node" && activeDocumentNodeId) {
    activeDocumentTarget = { type: "node", id: activeDocumentNodeId };
  }
  if (activeDocumentTarget?.type !== "node") return null;
  const node = cy.getElementById(activeDocumentTarget.id);
  return node && node.length && !node.removed() ? node : null;
}

function getActiveDocumentEdge() {
  if (activeDocumentTarget?.type !== "edge") return null;
  const edge = cy.getElementById(activeDocumentTarget.id);
  return edge && edge.length && !edge.removed() ? edge : null;
}

function getEdgeTitle(edge) {
  const source = edge.source();
  const target = edge.target();
  const sourceLabel = source?.data("label") || edge.data("source") || "Unknown";
  const targetLabel = target?.data("label") || edge.data("target") || "Unknown";
  return `${sourceLabel} -> ${targetLabel}`;
}

function clearNodeConnectionContext() {
  documentConnectionContext.parentElement.classList.remove("connection-document-page");
  documentConnectionContext.classList.remove("connection-endpoint-context");
  documentConnectionContext.hidden = true;
  documentConnectionContext.innerHTML = "";
}

function isIdeaPublicationEdge(edge) {
  const types = [edge.source()?.data("type"), edge.target()?.data("type")];
  return types.includes("Idea") && types.includes("Publication");
}

function isPublicationPublicationEdge(edge) {
  const types = [edge.source()?.data("type"), edge.target()?.data("type")];
  return types[0] === "Publication" && types[1] === "Publication";
}

function shouldShowConnectionInDocumentOutline(edge) {
  const types = [edge.source()?.data("type"), edge.target()?.data("type")];
  const isIdeaPublication = types.includes("Idea") && types.includes("Publication");
  const isIdeaIdea = types[0] === "Idea" && types[1] === "Idea";
  return isIdeaPublication || isIdeaIdea;
}

function getDefaultDocumentHtml(node) {
  if (node.data("type") === "Publication") {
    return "";
  }
  return "<p>Start drafting notes for this node.</p>";
}

function openPublicationNotes(node) {
  if (currentView !== "map") {
    closePublicationNotesModal();
    return;
  }

  publicationNotesNode = node;
  publicationNotesSnapshot = JSON.stringify(getGraphData());
  const notes = normalizePublicationNotes(node.data("publicationNotes"));
  const url = node.data("url") || notes.url || "";

  publicationNotesSubtitle.textContent = node.data("label") || "Publication";
  publicationNoteFields.notes.value = notes.notes || "";
  publicationNoteFields.citation.value = notes.citation || "";
  publicationNoteFields.url.value = url;
  publicationNoteFields.abstract.value = notes.abstract || "";

  publicationNotesModal.hidden = false;
  publicationNoteFields.notes.focus();
}

function closePublicationNotesModal() {
  if (publicationNotesModal.hidden) return;

  publicationNotesModal.hidden = true;
  if (publicationNotesSnapshot && JSON.stringify(getGraphData()) !== publicationNotesSnapshot) {
    pushUndoSnapshot(publicationNotesSnapshot, "publication notes");
  }
  publicationNotesNode = null;
  publicationNotesSnapshot = null;
}

function startNotesPanelDrag(event) {
  if (event.target.closest("button")) return;

  event.preventDefault();
  const rect = publicationNotesModal.getBoundingClientRect();
  notesPanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  publicationNotesDragHandle.setPointerCapture(event.pointerId);
}

function continueNotesPanelDrag(event) {
  if (!notesPanelDrag) return;

  event.preventDefault();
  const containerRect = publicationNotesModal.parentElement.getBoundingClientRect();
  const panelRect = publicationNotesModal.getBoundingClientRect();
  const nextLeft = clamp(event.clientX - containerRect.left - notesPanelDrag.offsetX, 8, containerRect.width - panelRect.width - 8);
  const nextTop = clamp(event.clientY - containerRect.top - notesPanelDrag.offsetY, 8, containerRect.height - Math.min(panelRect.height, containerRect.height - 16) - 8);

  publicationNotesModal.style.left = `${nextLeft}px`;
  publicationNotesModal.style.top = `${nextTop}px`;
  publicationNotesModal.style.right = "auto";
}

function finishNotesPanelDrag() {
  if (!notesPanelDrag) return;

  if (publicationNotesDragHandle.hasPointerCapture(notesPanelDrag.pointerId)) {
    publicationNotesDragHandle.releasePointerCapture(notesPanelDrag.pointerId);
  }
  notesPanelDrag = null;
}

function startZoteroPanelDrag(event) {
  if (event.button !== 0 || event.target.closest("button")) return;

  event.preventDefault();
  const rect = zoteroPanel.getBoundingClientRect();
  zoteroPanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  zoteroPanel.style.left = `${rect.left}px`;
  zoteroPanel.style.top = `${rect.top}px`;
  zoteroPanel.style.right = "auto";
  zoteroPanelHeader.setPointerCapture(event.pointerId);
}

function continueZoteroPanelDrag(event) {
  if (!zoteroPanelDrag) return;

  event.preventDefault();
  const panelRect = zoteroPanel.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - panelRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - Math.min(panelRect.height, window.innerHeight - 16) - 8);
  const nextLeft = clamp(event.clientX - zoteroPanelDrag.offsetX, 8, maxLeft);
  const nextTop = clamp(event.clientY - zoteroPanelDrag.offsetY, 8, maxTop);
  zoteroPanel.style.left = `${nextLeft}px`;
  zoteroPanel.style.top = `${nextTop}px`;
}

function finishZoteroPanelDrag() {
  if (!zoteroPanelDrag) return;

  if (zoteroPanelHeader.hasPointerCapture(zoteroPanelDrag.pointerId)) {
    zoteroPanelHeader.releasePointerCapture(zoteroPanelDrag.pointerId);
  }
  zoteroPanelDrag = null;
}

function startOpenAlexPanelDrag(event) {
  if (event.button !== 0 || event.target.closest("button")) return;

  event.preventDefault();
  const rect = openAlexPanel.getBoundingClientRect();
  openAlexPanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  openAlexPanel.style.left = `${rect.left}px`;
  openAlexPanel.style.top = `${rect.top}px`;
  openAlexPanel.style.right = "auto";
  openAlexPanelHeader.setPointerCapture(event.pointerId);
}

function continueOpenAlexPanelDrag(event) {
  if (!openAlexPanelDrag) return;

  event.preventDefault();
  const panelRect = openAlexPanel.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - panelRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - Math.min(panelRect.height, window.innerHeight - 16) - 8);
  const nextLeft = clamp(event.clientX - openAlexPanelDrag.offsetX, 8, maxLeft);
  const nextTop = clamp(event.clientY - openAlexPanelDrag.offsetY, 8, maxTop);
  openAlexPanel.style.left = `${nextLeft}px`;
  openAlexPanel.style.top = `${nextTop}px`;
}

function finishOpenAlexPanelDrag() {
  if (!openAlexPanelDrag) return;

  if (openAlexPanelHeader.hasPointerCapture(openAlexPanelDrag.pointerId)) {
    openAlexPanelHeader.releasePointerCapture(openAlexPanelDrag.pointerId);
  }
  openAlexPanelDrag = null;
}

function startPdfHighlightsPanelDrag(event) {
  if (event.button !== 0 || event.target.closest("button, select, input, textarea")) return;

  event.preventDefault();
  const rect = pdfHighlightsDialog.getBoundingClientRect();
  pdfHighlightsPanelDrag = {
    pointerId: event.pointerId,
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top
  };
  pdfHighlightsDialog.style.left = `${rect.left}px`;
  pdfHighlightsDialog.style.top = `${rect.top}px`;
  pdfHighlightsDialog.style.transform = "none";
  pdfHighlightsHeader.setPointerCapture(event.pointerId);
}

function continuePdfHighlightsPanelDrag(event) {
  if (!pdfHighlightsPanelDrag) return;

  event.preventDefault();
  const panelRect = pdfHighlightsDialog.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - panelRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - Math.min(panelRect.height, window.innerHeight - 16) - 8);
  const nextLeft = clamp(event.clientX - pdfHighlightsPanelDrag.offsetX, 8, maxLeft);
  const nextTop = clamp(event.clientY - pdfHighlightsPanelDrag.offsetY, 8, maxTop);
  pdfHighlightsDialog.style.left = `${nextLeft}px`;
  pdfHighlightsDialog.style.top = `${nextTop}px`;
}

function finishPdfHighlightsPanelDrag() {
  if (!pdfHighlightsPanelDrag) return;

  if (pdfHighlightsHeader.hasPointerCapture(pdfHighlightsPanelDrag.pointerId)) {
    pdfHighlightsHeader.releasePointerCapture(pdfHighlightsPanelDrag.pointerId);
  }
  pdfHighlightsPanelDrag = null;
}

function startOpenAlexPanelResize(event) {
  if (event.button !== 0) return;

  event.preventDefault();
  event.stopPropagation();
  const rect = openAlexPanel.getBoundingClientRect();
  openAlexPanelResize = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startWidth: rect.width,
    startHeight: rect.height,
    left: rect.left,
    top: rect.top
  };
  openAlexPanel.style.left = `${rect.left}px`;
  openAlexPanel.style.top = `${rect.top}px`;
  openAlexPanel.style.right = "auto";
  openAlexPanel.style.width = `${rect.width}px`;
  openAlexPanel.style.height = `${rect.height}px`;
  openAlexResizeHandle.setPointerCapture(event.pointerId);
}

function continueOpenAlexPanelResize(event) {
  if (!openAlexPanelResize) return;

  event.preventDefault();
  const minWidth = Math.min(760, window.innerWidth - 16);
  const minHeight = Math.min(460, window.innerHeight - 16);
  const maxWidth = Math.max(minWidth, window.innerWidth - openAlexPanelResize.left - 8);
  const maxHeight = Math.max(minHeight, window.innerHeight - openAlexPanelResize.top - 8);
  const nextWidth = clamp(openAlexPanelResize.startWidth + event.clientX - openAlexPanelResize.startX, minWidth, maxWidth);
  const nextHeight = clamp(openAlexPanelResize.startHeight + event.clientY - openAlexPanelResize.startY, minHeight, maxHeight);
  openAlexPanel.style.width = `${nextWidth}px`;
  openAlexPanel.style.height = `${nextHeight}px`;
}

function finishOpenAlexPanelResize() {
  if (!openAlexPanelResize) return;

  if (openAlexResizeHandle.hasPointerCapture(openAlexPanelResize.pointerId)) {
    openAlexResizeHandle.releasePointerCapture(openAlexPanelResize.pointerId);
  }
  openAlexPanelResize = null;
}

function updatePublicationNotes() {
  if (!publicationNotesNode || publicationNotesNode.removed()) return;

  const notes = normalizePublicationNotes(publicationNotesNode.data("publicationNotes"));
  notes.notes = publicationNoteFields.notes.value;
  notes.notesHtml = escapeHtml(notes.notes).replace(/\n/g, "<br>");
  notes.citation = publicationNoteFields.citation.value;
  notes.url = publicationNoteFields.url.value.trim();
  notes.abstract = publicationNoteFields.abstract.value;

  publicationNotesNode.data("url", notes.url);
  publicationNotesNode.data("publicationNotes", notes);
  if (selectedNode && selectedNode.id() === publicationNotesNode.id()) fields.url.value = notes.url;
  if (activeDocumentNodeId === publicationNotesNode.id()) {
    setDocumentEditorHtml(notes.notesHtml);
    documentCitation.value = notes.citation;
    documentUrl.value = notes.url;
    documentAbstract.value = notes.abstract;
  }
  scheduleAutosave("Autosaved publication notes.");
}

function duplicateNode(node) {
  if (!node || node.removed()) return;

  pushUndoState("duplicate node");
  const type = node.data("type") || "Idea";
  const id = makeStableId(type);
  const duplicated = cy.add({
    group: "nodes",
    data: {
      ...node.data(),
      id,
      label: `${node.data("label") || "Untitled"} copy`,
      nodeColor: getNodeColorForType(node.data("type"))
    },
    position: {
      x: node.position("x") + 48,
      y: node.position("y") + 48
    }
  });

  cy.$(":selected").unselect();
  duplicated.select();
  selectNode(duplicated);
  setActiveDocumentNode(duplicated);
  renderDocumentOutline();
  renderMapLegend();
  setStatus("Duplicated node.");
  scheduleAutosave("Autosaved after duplicating node.");
}

function copySelectedNodesToClipboard() {
  const nodes = getSelectedNodes();
  if (!nodes.length) {
    setStatus("Select one or more nodes to copy.");
    return;
  }

  copiedNodesClipboard = nodes.map((node) => ({
    data: cloneDataForClipboard(node.data()),
    position: { ...node.position() }
  }));
  setStatus(`Copied ${copiedNodesClipboard.length} node(s).`);
}

function pasteCopiedNodesFromClipboard() {
  if (!copiedNodesClipboard.length) {
    setStatus("No copied nodes to paste.");
    return;
  }

  pushUndoState("paste nodes");
  const pastedNodes = [];
  copiedNodesClipboard.forEach((item, index) => {
    const type = getNodeTypeNames().includes(item.data.type) ? item.data.type : getDefaultNodeTypeName();
    const id = makeStableId(type);
    const data = {
      ...cloneDataForClipboard(item.data),
      id,
      label: `${item.data.label || "Untitled"} copy`,
      type,
      nodeColor: getNodeColorForType(type),
      zIndex: getNextNodeZIndex() + index
    };
    const node = cy.add({
      group: "nodes",
      data,
      position: {
        x: item.position.x + 48,
        y: item.position.y + 48
      }
    });
    pastedNodes.push(node);
  });

  cy.$(":selected").unselect();
  pastedNodes.forEach((node) => node.select());
  if (pastedNodes.length) {
    selectNode(pastedNodes[pastedNodes.length - 1]);
    setActiveDocumentNode(pastedNodes[pastedNodes.length - 1]);
  }
  renderDocumentOutline();
  renderMapLegend();
  setStatus(`Pasted ${pastedNodes.length} node(s).`);
  scheduleAutosave("Autosaved after pasting copied nodes.");
}

function cloneDataForClipboard(data) {
  return JSON.parse(JSON.stringify(data || {}));
}

function changeNodeType(node, type) {
  if (!node || node.removed() || !getNodeTypeNames().includes(type)) return;
  pushUndoState("change node type");
  node.data("type", type);
  node.data("nodeColor", getNodeColorForType(type));
  if (selectedNode && selectedNode.id() === node.id()) {
    fields.type.value = type;
    selectedKind.textContent = type;
  }
  renderDocumentOutline();
  renderMapLegend();
  setStatus(`Changed node type to ${type}.`);
  scheduleAutosave("Autosaved after type change.");
}

function showContextMenu(node, event) {
  contextNode = node;

  const finishButton = nodeContextMenu.querySelector('[data-menu-action="finish-connection"]');
  const openLinkMenuButton = nodeContextMenu.querySelector('[data-menu-action="open-link"]');
  const pasteStyleMenuButton = nodeContextMenu.querySelector('[data-menu-action="paste-style"]');
  const currentType = node.data("type") || "Idea";
  finishButton.disabled = !connectionSource || connectionSource.id() === node.id();
  openLinkMenuButton.disabled = !node.data("url");
  pasteStyleMenuButton.disabled = !copiedNodeStyle;
  nodeContextMenu.querySelectorAll("[data-menu-type]").forEach((button) => {
    const isCurrentType = button.dataset.menuType === currentType;
    button.disabled = isCurrentType;
    button.classList.toggle("current-type", isCurrentType);
  });

  const point = getMenuPoint(event);
  nodeContextMenu.hidden = false;
  const menuRect = nodeContextMenu.getBoundingClientRect();
  const left = Math.min(point.x, window.innerWidth - menuRect.width - 8);
  const top = Math.min(point.y, window.innerHeight - menuRect.height - 8);
  nodeContextMenu.style.left = `${Math.max(8, left)}px`;
  nodeContextMenu.style.top = `${Math.max(8, top)}px`;
}

function hideContextMenu() {
  nodeContextMenu.hidden = true;
  contextNode = null;
}

function handleContextMenuClick(event) {
  const actionButton = event.target.closest("[data-menu-action]");
  const typeButton = event.target.closest("[data-menu-type]");

  if (!contextNode || contextNode.removed()) {
    hideContextMenu();
    return;
  }

  if (typeButton && !typeButton.disabled) {
    changeNodeType(contextNode, typeButton.dataset.menuType);
    hideContextMenu();
    return;
  }

  if (!actionButton || actionButton.disabled) return;

  const node = contextNode;
  const action = actionButton.dataset.menuAction;
  hideContextMenu();

  if (action === "edit") {
    cy.$(":selected").unselect();
    node.select();
    selectNode(node);
    fields.title.focus();
  } else if (action === "start-connection") {
    startConnectionFromNode(node);
  } else if (action === "finish-connection") {
    handleConnectionTap(node);
  } else if (action === "duplicate") {
    duplicateNode(node);
  } else if (action === "open-link") {
    const url = node.data("url");
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  } else if (action === "copy-style") {
    copyNodeStyle(node);
  } else if (action === "paste-style") {
    pasteNodeStyle(node);
  } else if (action === "bring-front") {
    bringNodeToFront(node);
  } else if (action === "send-back") {
    sendNodeToBack(node);
  } else if (action === "delete") {
    deleteNode(node);
  }
}

function getMenuPoint(event) {
  const original = event.originalEvent;
  if (original && Number.isFinite(original.clientX) && Number.isFinite(original.clientY)) {
    return { x: original.clientX, y: original.clientY };
  }

  const rendered = event.renderedPosition;
  const containerRect = cy.container().getBoundingClientRect();
  return {
    x: containerRect.left + rendered.x,
    y: containerRect.top + rendered.y
  };
}

function getGraphData() {
  return cy.elements().filter((element) => !element.data("clusterBackground")).jsons().map((element) => ({
    group: element.group,
    data: element.data,
    position: element.position
  }));
}

function getGraphPayload() {
  return {
    savedAt: new Date().toISOString(),
    project: activeProject,
    nodeTypes,
    elements: getGraphData()
  };
}

function beginNodeEdit() {
  if (!selectedNode || activeEditSnapshot) return;
  activeEditSnapshot = JSON.stringify(getGraphData());
}

function commitNodeEdit() {
  if (!activeEditSnapshot) return;

  const currentSnapshot = JSON.stringify(getGraphData());
  if (currentSnapshot !== activeEditSnapshot) {
    pushUndoSnapshot(activeEditSnapshot, "node edit");
  }

  activeEditSnapshot = null;
}

function pushUndoState(label = "change") {
  activeEditSnapshot = null;
  pushUndoSnapshot(JSON.stringify(getGraphData()), label);
}

function pushUndoSnapshot(snapshot, label = "change") {
  const normalized = normalizeUndoEntry(snapshot, label);
  const latest = undoStack[undoStack.length - 1];
  if (latest?.snapshot === normalized.snapshot) return;

  undoStack.push(normalized);
  redoStack = [];
  if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
}

function normalizeUndoEntry(snapshotOrEntry, label = "change") {
  if (snapshotOrEntry && typeof snapshotOrEntry === "object" && snapshotOrEntry.snapshot) {
    return {
      snapshot: snapshotOrEntry.snapshot,
      label: snapshotOrEntry.label || label,
      target: snapshotOrEntry.target || getCurrentDocumentTargetSnapshot(),
      selection: snapshotOrEntry.selection || getCurrentGraphSelectionSnapshot(),
      viewport: snapshotOrEntry.viewport || getCurrentViewportSnapshot()
    };
  }

  return {
    snapshot: String(snapshotOrEntry || "[]"),
    label,
    target: getCurrentDocumentTargetSnapshot(),
    selection: getCurrentGraphSelectionSnapshot(),
    viewport: getCurrentViewportSnapshot()
  };
}

function getCurrentGraphSnapshotEntry(label = "change") {
  return normalizeUndoEntry(JSON.stringify(getGraphData()), label);
}

function undoLastAction() {
  if (documentEditSnapshot && document.activeElement === documentEditor) {
    setStatus("Use the editor's native undo while typing. Click outside the note to undo map-level changes.");
    return;
  }

  if (activeEditSnapshot) {
    const currentSnapshot = JSON.stringify(getGraphData());
    if (currentSnapshot !== activeEditSnapshot) {
      const currentEntry = getCurrentGraphSnapshotEntry("redo node edit");
      const undoEntry = normalizeUndoEntry(activeEditSnapshot, "node edit");
      redoStack.push(currentEntry);
      restoreGraphFromUndoEntry(undoEntry);
      activeEditSnapshot = null;
      setStatus("Undid node edit.");
      scheduleAutosave("Autosaved after undo.");
      return;
    }
    activeEditSnapshot = null;
  }

  if (!undoStack.length) {
    setStatus("Nothing to undo.");
    return;
  }

  const currentEntry = getCurrentGraphSnapshotEntry("redo change");
  const undoEntry = normalizeUndoEntry(undoStack.pop());
  redoStack.push(currentEntry);
  if (redoStack.length > MAX_UNDO_STEPS) redoStack.shift();
  restoreGraphFromUndoEntry(undoEntry);
  activeEditSnapshot = null;
  setStatus(`Undid ${undoEntry.label || "previous change"}.`);
  scheduleAutosave("Autosaved after undo.");
}

function redoLastAction() {
  if (documentEditSnapshot && document.activeElement === documentEditor) {
    setStatus("Use the editor's native redo while typing. Click outside the note to redo map-level changes.");
    return;
  }

  if (!redoStack.length) {
    setStatus("Nothing to redo.");
    return;
  }

  const currentEntry = getCurrentGraphSnapshotEntry("undo redo");
  const redoEntry = normalizeUndoEntry(redoStack.pop());
  undoStack.push(currentEntry);
  if (undoStack.length > MAX_UNDO_STEPS) undoStack.shift();
  restoreGraphFromUndoEntry(redoEntry);
  activeEditSnapshot = null;
  setStatus(`Redid ${redoEntry.label || "change"}.`);
  scheduleAutosave("Autosaved after redo.");
}

function restoreGraphFromUndoEntry(entry) {
  restoreGraphState(JSON.parse(entry.snapshot), {
    fit: false,
    viewport: entry.viewport,
    selection: entry.selection
  });
  restoreDocumentTargetAfterUndo(entry.target);
}

function restoreDocumentTargetAfterUndo(target) {
  if (!target) return;
  const element = cy.getElementById(target.id);
  if (!element || !element.length || element.removed()) return;
  activeDocumentTarget = { ...target };
  activeDocumentNodeId = target.type === "node" ? target.id : null;
  loadActiveDocumentSection();
  renderDocumentOutline();
}

function getCurrentDocumentTargetSnapshot() {
  return activeDocumentTarget ? { ...activeDocumentTarget } : null;
}

function getCurrentViewportSnapshot() {
  if (!cy) return null;
  const pan = cy.pan();
  return {
    zoom: cy.zoom(),
    pan: { x: pan.x, y: pan.y }
  };
}

function getCurrentGraphSelectionSnapshot() {
  if (!cy) return [];
  return cy.$(":selected").map((element) => ({ id: element.id(), group: element.group() }));
}

function restoreGraphSelection(selection = []) {
  cy.$(":selected").unselect();
  const restored = [];
  selection.forEach((item) => {
    const element = cy.getElementById(item.id);
    if (!element || !element.length || element.removed()) return;
    element.select();
    restored.push(element);
  });

  const selectedNodes = restored.filter((element) => element.isNode() && !element.data("clusterBackground"));
  const selectedEdges = restored.filter((element) => element.isEdge());
  if (selectedNodes.length) {
    selectNode(selectedNodes[selectedNodes.length - 1]);
    if (selectedNodes.length > 1) selectedNodes.forEach((node) => node.select());
    return;
  }
  if (selectedEdges.length) {
    selectEdge(selectedEdges[selectedEdges.length - 1]);
  }
}

function restoreGraphState(elements, options = {}) {
  cy.elements().remove();
  cy.add(normalizeElements(elements));
  cy.layout({ name: "preset", fit: Boolean(options.fit), padding: 70 }).run();
  if (options.viewport) {
    cy.zoom(options.viewport.zoom);
    cy.pan(options.viewport.pan);
  } else if (options.fit !== false) {
    cy.fit(undefined, 70);
    setMapZoomBaseFromCurrentView();
  } else if (options.resetZoomBase) {
    setMapZoomBaseFromCurrentView();
  }
  selectedNode = null;
  selectedEdge = null;
  activeDocumentNodeId = null;
  activeDocumentTarget = null;
  connectionMode = false;
  connectionSource = null;
  contextNode = null;
  hideContextMenu();
  hideResizeOverlay();
  hideEdgeNotesPanel();
  clearForm();
  setFormEnabled(false);
  selectedKind.textContent = "No selection";
  panelMessage.textContent = "Select a node to edit its research metadata.";
  renderMapLegend();
  if (options.selection) restoreGraphSelection(options.selection);
}

function normalizeElements(elements) {
  if (!Array.isArray(elements)) throw new Error("Graph JSON must be an array.");

  return elements.filter((element) => !element.data?.clusterBackground).map((element) => {
    if (!element.group || !element.data || !element.data.id) {
      throw new Error("Each graph element needs group, data, and data.id.");
    }

    const normalized = {
      group: element.group,
      data: { ...element.data }
    };
    normalized.data.zIndex = Number.isFinite(Number(normalized.data.zIndex)) ? Number(normalized.data.zIndex) : 1;

    if (element.group === "nodes") {
      normalized.position = element.position || { x: 100, y: 100 };
      normalized.data.type = getNodeTypeNames().includes(normalized.data.type) ? normalized.data.type : "Unassigned";
      normalized.data.nodeColor = getNodeColorForType(normalized.data.type);
      normalized.data.tags = Array.isArray(normalized.data.tags) ? normalized.data.tags : parseTags(normalized.data.tags || "");
      normalized.data.primaryTag = getValidPrimaryTag(normalized.data.primaryTag, normalized.data.tags);
      normalized.data.size = clampNodeSize(normalized.data.size);
      normalized.data.textWidth = getTextWidth(normalized.data.size);
      normalized.data.label = normalized.data.label || "Untitled";
      normalized.data.fontSize = clampFontSize(normalized.data.fontSize);
      normalized.data.fontFamily = getValidFontFamily(normalized.data.fontFamily);
      normalized.data.fontStyle = getValidFontStyle(normalized.data.fontStyle);
      Object.assign(normalized.data, getFontStyleParts(normalized.data.fontStyle));
      normalized.data.publicationNotes = normalizePublicationNotes(normalized.data.publicationNotes);
      normalized.data.documentHtml = normalizeDocumentHtml(normalized.data.documentHtml, normalized.data.type);
    } else if (element.group === "edges") {
      normalized.data.notes = normalized.data.notes || "";
      normalized.data.notesHtml = normalized.data.notesHtml || "";
      normalized.data.tags = Array.isArray(normalized.data.tags) ? normalized.data.tags : parseTags(normalized.data.tags || "");
    }

    return normalized;
  });
}

function parseTags(value) {
  if (Array.isArray(value)) return value;
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function initializeTagAutocomplete(input) {
  if (!input) return;
  input.setAttribute("autocomplete", "off");
  input.addEventListener("focus", () => updateTagAutocomplete(input));
  input.addEventListener("input", () => updateTagAutocomplete(input));
  input.addEventListener("click", () => updateTagAutocomplete(input));
  input.addEventListener("keydown", handleTagAutocompleteKeydown);
  input.addEventListener("blur", () => {
    window.setTimeout(() => {
      if (activeTagAutocompleteInput === input) hideTagAutocomplete();
    }, 120);
  });
}

function getExistingProjectTags() {
  const tags = new Map();
  if (!cy) return [];
  cy.elements().forEach((element) => {
    const elementTags = Array.isArray(element.data("tags"))
      ? element.data("tags")
      : parseTags(element.data("tags") || "");
    elementTags.forEach((tag) => {
      const trimmed = String(tag || "").trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!tags.has(key)) tags.set(key, trimmed);
    });
  });
  return Array.from(tags.values()).sort((a, b) => a.localeCompare(b));
}

function getTagAutocompleteToken(input) {
  const cursor = input.selectionStart ?? input.value.length;
  const beforeCursor = input.value.slice(0, cursor);
  const tokenStart = beforeCursor.lastIndexOf(",") + 1;
  const token = input.value.slice(tokenStart, cursor).trim();
  return { cursor, tokenStart, token };
}

function updateTagAutocomplete(input) {
  if (!input || input.disabled) {
    hideTagAutocomplete();
    return;
  }

  const { token } = getTagAutocompleteToken(input);
  const existingInInput = new Set(parseTags(input.value).map((tag) => tag.toLowerCase()));
  const query = token.toLowerCase();
  tagAutocompleteOptions = getExistingProjectTags()
    .filter((tag) => !existingInInput.has(tag.toLowerCase()) || tag.toLowerCase() === query)
    .filter((tag) => !query || tag.toLowerCase().includes(query))
    .slice(0, 10);

  if (!tagAutocompleteOptions.length) {
    hideTagAutocomplete();
    return;
  }

  activeTagAutocompleteInput = input;
  activeTagAutocompleteIndex = 0;
  renderTagAutocompleteMenu();
}

function renderTagAutocompleteMenu() {
  if (!activeTagAutocompleteInput) return;
  if (!tagAutocompleteMenu) {
    tagAutocompleteMenu = document.createElement("div");
    tagAutocompleteMenu.className = "tag-autocomplete-menu";
    document.body.appendChild(tagAutocompleteMenu);
  }

  tagAutocompleteMenu.innerHTML = "";
  tagAutocompleteOptions.forEach((tag, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = index === activeTagAutocompleteIndex ? "active" : "";
    button.textContent = tag;
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
      applyTagAutocompleteOption(tag);
    });
    tagAutocompleteMenu.appendChild(button);
  });

  const rect = activeTagAutocompleteInput.getBoundingClientRect();
  tagAutocompleteMenu.style.left = `${rect.left}px`;
  tagAutocompleteMenu.style.top = `${rect.bottom + 4}px`;
  tagAutocompleteMenu.style.width = `${rect.width}px`;
  tagAutocompleteMenu.hidden = false;
}

function handleTagAutocompleteKeydown(event) {
  if (event.target !== activeTagAutocompleteInput || !tagAutocompleteMenu || tagAutocompleteMenu.hidden) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeTagAutocompleteIndex = (activeTagAutocompleteIndex + 1) % tagAutocompleteOptions.length;
    renderTagAutocompleteMenu();
  } else if (event.key === "ArrowUp") {
    event.preventDefault();
    activeTagAutocompleteIndex = (activeTagAutocompleteIndex - 1 + tagAutocompleteOptions.length) % tagAutocompleteOptions.length;
    renderTagAutocompleteMenu();
  } else if (event.key === "Enter" || event.key === "Tab") {
    const tag = tagAutocompleteOptions[activeTagAutocompleteIndex];
    if (!tag) return;
    event.preventDefault();
    applyTagAutocompleteOption(tag);
  } else if (event.key === "Escape") {
    hideTagAutocomplete();
  }
}

function applyTagAutocompleteOption(tag) {
  const input = activeTagAutocompleteInput;
  if (!input) return;
  const { cursor, tokenStart } = getTagAutocompleteToken(input);
  const beforeToken = input.value.slice(0, tokenStart);
  const afterToken = input.value.slice(cursor);
  const prefix = beforeToken && !beforeToken.endsWith(" ") ? `${beforeToken} ` : beforeToken;
  const separator = afterToken.trimStart().startsWith(",") ? "" : ", ";
  input.value = `${prefix}${tag}${separator}${afterToken.replace(/^\s+/, "")}`;
  const nextCursor = `${prefix}${tag}${separator}`.length;
  input.setSelectionRange(nextCursor, nextCursor);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.focus();
  hideTagAutocomplete();
}

function hideTagAutocomplete() {
  activeTagAutocompleteInput = null;
  activeTagAutocompleteIndex = -1;
  tagAutocompleteOptions = [];
  if (tagAutocompleteMenu) tagAutocompleteMenu.hidden = true;
}

function normalizePublicationNotes(notes = {}) {
  let migratedNotes = notes.notes || [
    notes.purpose || "",
    notes.methods || "",
    notes.findings || "",
    notes.quotes || "",
    notes.limitations || "",
    notes.relevance || ""
  ].filter(Boolean).join("\n\n");
  let abstract = notes.abstract || "";

  if (!abstract && migratedNotes.startsWith("Abstract:\n")) {
    abstract = migratedNotes.replace(/^Abstract:\n?/, "").trim();
    migratedNotes = "";
  }

  return {
    notes: migratedNotes,
    notesHtml: notes.notesHtml || "",
    citation: notes.citation || "",
    url: notes.url || "",
    abstract
  };
}

function normalizeDocumentHtml(documentHtml, type) {
  if (type === "Publication") {
    return isLegacyPublicationTemplate(documentHtml) ? "" : documentHtml || "";
  }
  return documentHtml || getDefaultDocumentHtml({ data: () => type });
}

function isLegacyPublicationTemplate(documentHtml = "") {
  return documentHtml.includes("<strong>Citation:</strong>") ||
    documentHtml.includes("<strong>Purpose:</strong>") ||
    documentHtml.includes("<strong>Methods/Data:</strong>") ||
    documentHtml.includes("<strong>Key findings:</strong>") ||
    documentHtml.includes("<strong>Relevance:</strong>") ||
    documentHtml.includes("Start writing literature review notes for this publication");
}

function makeStableId(type) {
  const slug = type.toLowerCase();
  let counter = 1;
  let id = `node-${slug}-${counter}`;
  while (cy.getElementById(id).length) {
    counter += 1;
    id = `node-${slug}-${counter}`;
  }
  return id;
}

function setFormEnabled(enabled) {
  Object.values(fields).forEach((field) => {
    field.disabled = !enabled;
  });
  openNotesButton.disabled = !enabled;
  openLinkButton.disabled = !enabled || !fields.url.value.trim();
  copyNodeStyleButton.disabled = !enabled;
  pasteNodeStyleButton.disabled = !enabled || !copiedNodeStyle;
  setMultiFormatEnabled(enabled);
  if (!enabled) {
    openPdfButton.disabled = true;
    importPdfHighlightsButton.disabled = true;
  }
}

function setMultiFormatEnabled(enabled) {
  Object.values(multiFormatFields).forEach((field) => {
    field.disabled = !enabled;
  });
  multiCopyNodeStyleButton.disabled = !enabled;
  multiPasteNodeStyleButton.disabled = !enabled || !copiedNodeStyle;
  multiFormatBar.classList.toggle("visible", Boolean(enabled));
}

function syncMultiFormatFields(node) {
  if (!node || node.removed()) {
    clearMultiFormatFields();
    return;
  }
  multiFormatFields.size.value = getNodeSize(node);
  multiFormatFields.sizeNumber.value = getNodeSize(node);
  multiFormatFields.fontSize.value = getNodeFontSize(node);
  multiFormatFields.fontFamily.value = getNodeFontFamily(node);
  multiFormatFields.fontStyle.value = getNodeFontStyle(node);
}

function clearMultiFormatFields() {
  multiFormatFields.size.value = DEFAULT_NODE_SIZE;
  multiFormatFields.sizeNumber.value = DEFAULT_NODE_SIZE;
  multiFormatFields.fontSize.value = DEFAULT_FONT_SIZE;
  multiFormatFields.fontFamily.value = DEFAULT_FONT_FAMILY;
  multiFormatFields.fontStyle.value = "bold";
}

function clearForm() {
  fields.title.value = "";
  fields.type.value = "Idea";
  fields.url.value = "";
  fields.citation.value = "";
  fields.citation.disabled = true;
  nodeCitationLabel.hidden = true;
  fields.tags.value = "";
  fields.size.value = DEFAULT_NODE_SIZE;
  fields.sizeNumber.value = DEFAULT_NODE_SIZE;
  fields.fontSize.value = DEFAULT_FONT_SIZE;
  fields.fontFamily.value = DEFAULT_FONT_FAMILY;
  fields.fontStyle.value = "bold";
  openLinkButton.disabled = true;
  copyNodeStyleButton.disabled = true;
  pasteNodeStyleButton.disabled = true;
  clearMultiFormatFields();
  setMultiFormatEnabled(false);
  openPdfButton.disabled = true;
  importPdfHighlightsButton.disabled = true;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function isTypingTarget(target) {
  if (!target || !target.matches) return false;
  if (isInsideDocumentEditor(target)) return true;
  return target.matches("input, textarea, select, [contenteditable='true']");
}

function shouldLetBrowserHandleClipboard(target) {
  if (!target || !target.matches) return false;
  if (isInsideDocumentEditor(target)) return true;
  return target.matches("input[type='text'], input[type='url'], input[type='number'], textarea, [contenteditable='true']");
}

function getEditedNodeSize(options = {}) {
  const { clampSizeField = true } = options;
  const activeSize = document.activeElement === fields.sizeNumber ? fields.sizeNumber.value : fields.size.value;
  return clampSizeField ? clampNodeSize(activeSize) : Number.parseInt(activeSize, 10);
}

function isValidLiveNodeSize(value) {
  if (value === "") return false;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= MIN_NODE_SIZE && parsed <= MAX_NODE_SIZE;
}

function updateResizeOverlay() {
  if (!selectedNode || selectedNode.removed() || resizeDrag) {
    if (!resizeDrag) hideResizeOverlay();
    return;
  }

  const box = selectedNode.renderedBoundingBox({ includeLabels: false, includeOverlays: false });
  resizeOverlay.hidden = false;
  resizeOverlay.style.left = `${box.x1}px`;
  resizeOverlay.style.top = `${box.y1}px`;
  resizeOverlay.style.width = `${box.w}px`;
  resizeOverlay.style.height = `${box.h}px`;
}

function hideResizeOverlay() {
  resizeOverlay.hidden = true;
}

function startResizeDrag(event) {
  if (!selectedNode || selectedNode.removed()) return;

  event.preventDefault();
  event.stopPropagation();
  pushUndoState("resize node");

  resizeDrag = {
    node: selectedNode,
    center: selectedNode.renderedPosition(),
    handle: event.currentTarget.dataset.resizeHandle,
    pointerId: event.pointerId,
    handleElement: event.currentTarget
  };

  cy.userPanningEnabled(false);
  selectedNode.ungrabify();
  event.currentTarget.setPointerCapture(event.pointerId);
}

function continueResizeDrag(event) {
  if (!resizeDrag) return;

  event.preventDefault();
  const containerRect = cy.container().getBoundingClientRect();
  const pointer = {
    x: event.clientX - containerRect.left,
    y: event.clientY - containerRect.top
  };
  const dx = Math.abs(pointer.x - resizeDrag.center.x);
  const dy = Math.abs(pointer.y - resizeDrag.center.y);
  const renderedSize = Math.max(dx, dy) * 2;
  const modelSize = clampNodeSize(renderedSize / cy.zoom());

  resizeDrag.node.data({
    size: modelSize,
    textWidth: getTextWidth(modelSize)
  });

  if (selectedNode && selectedNode.id() === resizeDrag.node.id()) {
    fields.size.value = modelSize;
    fields.sizeNumber.value = modelSize;
  }

  updateResizeOverlayDuringDrag(resizeDrag.node);
}

function finishResizeDrag(event) {
  if (!resizeDrag) return;

  if (resizeDrag.handleElement.hasPointerCapture(resizeDrag.pointerId)) {
    resizeDrag.handleElement.releasePointerCapture(resizeDrag.pointerId);
  }

  resizeDrag.node.grabify();
  cy.userPanningEnabled(true);
  resizeDrag = null;
  updateResizeOverlay();
  scheduleAutosave("Autosaved after resizing node.");
}

function updateResizeOverlayDuringDrag(node) {
  const box = node.renderedBoundingBox({ includeLabels: false, includeOverlays: false });
  resizeOverlay.hidden = false;
  resizeOverlay.style.left = `${box.x1}px`;
  resizeOverlay.style.top = `${box.y1}px`;
  resizeOverlay.style.width = `${box.w}px`;
  resizeOverlay.style.height = `${box.h}px`;
}

function getNodeSize(node) {
  return clampNodeSize(node.data("size"));
}

function getNodeFontSize(node) {
  return clampFontSize(node.data("fontSize"));
}

function getNodeFontFamily(node) {
  return getValidFontFamily(node.data("fontFamily"));
}

function getNodeFontStyle(node) {
  return getValidFontStyle(node.data("fontStyle"));
}

function clampNodeSize(size) {
  const parsed = Number.parseInt(size, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_NODE_SIZE;
  return Math.min(MAX_NODE_SIZE, Math.max(MIN_NODE_SIZE, parsed));
}

function clampFontSize(size) {
  const parsed = Number.parseInt(size, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_FONT_SIZE;
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, parsed));
}

function isValidLiveFontSize(size) {
  if (size === "") return false;
  const parsed = Number.parseInt(size, 10);
  return Number.isFinite(parsed) && parsed >= MIN_FONT_SIZE && parsed <= MAX_FONT_SIZE;
}

function getValidFontFamily(fontFamily) {
  const options = Array.from(fields.fontFamily.options).map((option) => option.value);
  return options.includes(fontFamily) ? fontFamily : DEFAULT_FONT_FAMILY;
}

function getValidFontStyle(fontStyle) {
  const allowed = ["normal", "bold", "italic", "bold italic"];
  return allowed.includes(fontStyle) ? fontStyle : "bold";
}

function getFontStyleParts(fontStyle) {
  return {
    fontStyleValue: fontStyle.includes("italic") ? "italic" : "normal",
    fontWeight: fontStyle.includes("bold") ? 700 : 400
  };
}

function getTextWidth(size) {
  return Math.max(48, size - 8);
}

function bringNodeToFront(node) {
  if (!node || node.removed()) return;
  pushUndoState("bring node forward");
  const nextZIndex = getNextElementZIndex();
  node.data("zIndex", nextZIndex);
  node.connectedEdges().forEach((edge) => edge.data("zIndex", nextZIndex + 1));
  setStatus("Brought node and connections to front.");
  scheduleAutosave("Autosaved after ordering change.");
}

function sendNodeToBack(node) {
  if (!node || node.removed()) return;
  pushUndoState("send node backward");
  const previousZIndex = getPreviousElementZIndex();
  node.data("zIndex", previousZIndex);
  node.connectedEdges().forEach((edge) => edge.data("zIndex", previousZIndex - 1));
  setStatus("Sent node and connections to back.");
  scheduleAutosave("Autosaved after ordering change.");
}

function scheduleAutosave(message = "Autosaved.") {
  window.clearTimeout(autosaveTimer);
  setAutosaveMessage("Autosave pending...");
  autosaveTimer = window.setTimeout(async () => {
    try {
      flushActiveDocumentEdits();
      window.clearTimeout(autosaveTimer);
      await writeGraphToAutosaveFolder(activeProject, { throwOnError: true });
      writeGraphToLocalStorage();
      appendAutosaveHistory();
      setAutosaveMessage(`${message} ${formatSaveTime(new Date())}`);
    } catch (error) {
      console.error("Autosave failed.", error);
      setAutosaveMessage("Autosave failed. Export JSON backup now.");
      setStatus(error?.message || "Autosave failed.");
    }
  }, AUTOSAVE_DELAY_MS);
}

function projectStorageKey(project = activeProject) {
  return `${STORAGE_KEY}:${project || DEFAULT_PROJECT_NAME}`;
}

function writeGraphToLocalStorage(project = activeProject, payload = getGraphPayload()) {
  const payloadWithMetadata = {
    ...payload,
    savedAt: payload.savedAt || new Date().toISOString(),
    project
  };
  const serialized = JSON.stringify(payloadWithMetadata, null, 2);
  const savedProjectCopy = safeSetLocalStorage(projectStorageKey(project), serialized);
  const savedLegacyCopy = project === activeProject ? safeSetLocalStorage(STORAGE_KEY, serialized) : true;
  return savedProjectCopy && savedLegacyCopy;
}

function safeSetLocalStorage(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Skipped localStorage write for ${key}. Folder autosave is the primary save location.`, error);
    try {
      localStorage.removeItem(key);
      localStorage.removeItem(AUTOSAVE_HISTORY_KEY);
      if (key !== STORAGE_KEY) localStorage.removeItem(STORAGE_KEY);
    } catch (cleanupError) {
      console.warn("Could not clean localStorage after quota failure.", cleanupError);
    }
    return false;
  }
}

function readGraphFromLocalStorage(project = activeProject) {
  try {
    const saved = localStorage.getItem(projectStorageKey(project));
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return parsed && Array.isArray(parsed.elements) ? parsed : null;
  } catch (error) {
    console.warn(`Could not read local project save for ${project}.`, error);
    return null;
  }
}

function chooseNewestGraphPayload(serverPayload, localPayload) {
  return isLocalNewerThanServer(localPayload, serverPayload) ? localPayload : serverPayload;
}

function isLocalNewerThanServer(localPayload, serverPayload) {
  if (!localPayload || !Array.isArray(localPayload.elements)) return false;
  const localTime = Date.parse(localPayload.savedAt || "");
  const serverTime = Date.parse(serverPayload?.savedAt || "");
  if (!Number.isFinite(localTime)) return false;
  if (!Number.isFinite(serverTime)) return true;
  return localTime > serverTime;
}

function appendAutosaveHistory() {
  const currentGraph = getGraphData();
  const currentSnapshot = {
    savedAt: new Date().toISOString(),
    nodeTypes,
    elements: currentGraph
  };
  const snapshotSize = JSON.stringify(currentSnapshot).length;
  if (snapshotSize > MAX_AUTOSAVE_HISTORY_BYTES) {
    localStorage.removeItem(AUTOSAVE_HISTORY_KEY);
    console.warn("Skipped autosave history because the graph is too large for localStorage history.");
    return;
  }

  const history = readAutosaveHistory();
  history.unshift({
    savedAt: currentSnapshot.savedAt,
    nodeTypes,
    elements: currentGraph
  });

  let trimmed = history.slice(0, MAX_AUTOSAVE_HISTORY);
  while (trimmed.length) {
    try {
      localStorage.setItem(AUTOSAVE_HISTORY_KEY, JSON.stringify(trimmed));
      return;
    } catch (error) {
      trimmed = trimmed.slice(0, -1);
    }
  }
  localStorage.removeItem(AUTOSAVE_HISTORY_KEY);
}

function writeGraphToAutosaveFolder(project = activeProject, options = {}) {
  const payload = options.payload || getGraphPayload();
  return postJson(`/api/projects/${encodeURIComponent(project)}/autosave`, payload).catch((error) => {
    console.warn("Folder autosave failed.", error);
    setStatus("Folder autosave failed. Is the FastAPI server running?");
    if (options.throwOnError) throw error;
    return null;
  });
}

function readAutosaveHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(AUTOSAVE_HISTORY_KEY) || "[]");
    return Array.isArray(history) ? history : [];
  } catch (error) {
    console.warn("Could not read autosave history.", error);
    return [];
  }
}

function setAutosaveMessage(message) {
  autosaveMessage.textContent = message;
}

function formatSaveTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getNextNodeZIndex() {
  return getNextElementZIndex();
}

function getNextElementZIndex() {
  const values = cy ? cy.elements().map((element) => getElementZIndex(element)) : [1];
  return Math.max(...values, 1) + 1;
}

function getPreviousElementZIndex() {
  const values = cy.elements().map((element) => getElementZIndex(element));
  return Math.min(...values, 1) - 1;
}

function getElementZIndex(element) {
  return Number(element.data("zIndex")) || 1;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function cloneElements(elements) {
  return JSON.parse(JSON.stringify(elements));
}
