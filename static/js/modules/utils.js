// utils.js - Utility functions with improved zoom functionality and connection saving
import { canvas, ELEMENT_TYPES } from './core.js';
import { showConnectionHelp } from './ui.js';
import * as fontManager from './fontManager.js';

// Session storage key for diagram
const DIAGRAM_STORAGE_KEY = 'uml_diagram_session';

// Helper functions for guidelines
export const guidelines = {
    vertical: null,
    horizontal: null,
    
    show: function(orientation, position) {
        this.hide(orientation);
        
        // Create guideline
        if (orientation === 'vertical') {
            this.vertical = new fabric.Line([position, 0, position, canvas.height], {
                stroke: '#4a6fff',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                strokeLineCap: 'round'
            });
            canvas.add(this.vertical);
            this.vertical.bringToFront();
        } else {
            this.horizontal = new fabric.Line([0, position, canvas.width, position], {
                stroke: '#4a6fff',
                strokeWidth: 1,
                strokeDashArray: [5, 5],
                selectable: false,
                evented: false,
                strokeLineCap: 'round'
            });
            canvas.add(this.horizontal);
            this.horizontal.bringToFront();
        }
    },
    
    hide: function(orientation) {
        if (orientation === 'vertical' && this.vertical) {
            canvas.remove(this.vertical);
            this.vertical = null;
        } else if (orientation === 'horizontal' && this.horizontal) {
            canvas.remove(this.horizontal);
            this.horizontal = null;
        } else if (orientation === 'all') {
            if (this.vertical) {
                canvas.remove(this.vertical);
                this.vertical = null;
            }
            if (this.horizontal) {
                canvas.remove(this.horizontal);
                this.horizontal = null;
            }
        }
    }
};

// IMPROVED: Zoom utilities
export const zoom = {
    // Current zoom level
    level: 1.0,
    
    // Min and max zoom levels
    min: 0.1,
    max: 5.0,
    
    // Zoom step
    step: 0.1,
    
    // Canvas reference - NEW
    canvas: null,
    
    // Initialize zoom controls - IMPROVED
    init: function(canvasObj) {
        // Store canvas reference - FIXED
        this.canvas = canvasObj || canvas;
        
        // Create zoom controls if they don't exist
        if (!document.querySelector('.zoom-controls')) {
            this.createZoomControls();
        }
        
        // Bind methods to this context - FIXED
        this.zoomIn = this.zoomIn.bind(this);
        this.zoomOut = this.zoomOut.bind(this);
        this.zoomReset = this.zoomReset.bind(this);
        this.applyZoom = this.applyZoom.bind(this);
        this.updateZoomIndicator = this.updateZoomIndicator.bind(this);
        
        // Add mouse wheel zoom handler
        this.setupWheelZoom();
        
        // Set initial zoom level
        this.updateZoomIndicator();
        
        console.log("Zoom initialized correctly with canvas:", this.canvas ? "Valid" : "Invalid");
        
        return this; // Return this for chaining
    },
    
    // Create zoom control buttons - IMPROVED
    createZoomControls: function() {
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button class="zoom-btn zoom-in" title="Zoom In">
                <i class="fas fa-plus"></i>
            </button>
            <div class="zoom-divider"></div>
            <div class="zoom-indicator">100%</div>
            <div class="zoom-divider"></div>
            <button class="zoom-btn zoom-out" title="Zoom Out">
                <i class="fas fa-minus"></i>
            </button>
            <div class="zoom-divider"></div>
            <button class="zoom-btn zoom-reset" title="Reset Zoom">
                <i class="fas fa-expand"></i>
            </button>
        `;
        
        // Add to document
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(zoomControls);
            
            // Add event listeners with correct binding
            const zoomInBtn = zoomControls.querySelector('.zoom-in');
            const zoomOutBtn = zoomControls.querySelector('.zoom-out');
            const zoomResetBtn = zoomControls.querySelector('.zoom-reset');
            
            if (zoomInBtn) zoomInBtn.addEventListener('click', this.zoomIn);
            if (zoomOutBtn) zoomOutBtn.addEventListener('click', this.zoomOut);
            if (zoomResetBtn) zoomResetBtn.addEventListener('click', this.zoomReset);
            
            console.log("Zoom controls created and attached");
        } else {
            console.warn("Canvas container not found for zoom controls");
        }
    },
    
    // Setup wheel zoom - IMPROVED 
    setupWheelZoom: function() {
        if (!this.canvas) {
            console.error("Canvas reference is missing in zoom.setupWheelZoom");
            return;
        }
        
        // Use stored canvas reference
        this.canvas.on('mouse:wheel', (opt) => {
            const delta = opt.e.deltaY;
            let zoom = this.canvas.getZoom();
            
            // Calculate new zoom level
            zoom *= 0.999 ** delta;
            zoom = Math.min(Math.max(this.min, zoom), this.max);
            
            // Apply zoom to canvas at the mouse position
            this.canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            
            // Update the zoom level
            this.level = zoom;
            this.updateZoomIndicator();
            
            // Adjust text rendering for readability
            if (fontManager && fontManager.adjustTextForZoom) {
                fontManager.adjustTextForZoom(zoom);
            }
            
            // Prevent page scrolling
            opt.e.preventDefault();
            opt.e.stopPropagation();
        });
        
        console.log("Wheel zoom setup complete");
    },
    
    // Zoom in function - IMPROVED
    zoomIn: function() {
        this.level = Math.min(this.max, this.level + this.step);
        this.applyZoom();
        console.log(`Zoomed in to ${this.level.toFixed(2)}`);
    },
    
    // Zoom out function - IMPROVED
    zoomOut: function() {
        this.level = Math.max(this.min, this.level - this.step);
        this.applyZoom();
        console.log(`Zoomed out to ${this.level.toFixed(2)}`);
    },
    
    // Reset zoom function - IMPROVED
    zoomReset: function() {
        this.level = 1.0;
        this.applyZoom();
        console.log("Zoom reset to 100%");
    },
    
    // Apply zoom to canvas - IMPROVED
    applyZoom: function() {
        if (!this.canvas) {
            console.error("Canvas reference is missing in zoom.applyZoom");
            return;
        }
        
        // Get canvas center
        const center = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2
        };
        
        // Apply zoom to center point
        this.canvas.zoomToPoint(center, this.level);
        
        // Update zoom indicator
        this.updateZoomIndicator();
        
        // Adjust text rendering for readability
        if (fontManager && fontManager.adjustTextForZoom) {
            fontManager.adjustTextForZoom(this.level);
        }
    },
    
    // Update zoom indicator - IMPROVED
    updateZoomIndicator: function() {
        const indicator = document.querySelector('.zoom-indicator');
        if (indicator) {
            indicator.textContent = Math.round(this.level * 100) + '%';
        }
    }
};

// Pan (scroll) functionality for canvas navigation
export const pan = {
    canvas: null,
    isPanning: false,
    lastPosX: 0,
    lastPosY: 0,

    // Initialize panning functionality
    init: function(canvasInstance) {
        this.canvas = canvasInstance;

        if (!this.canvas) {
            console.error("Canvas instance required for panning");
            return;
        }

        this.setupPanning();
        console.log("Panning initialized");
    },

    // Setup panning event listeners
    setupPanning: function() {
        // Enable panning with middle mouse button or Space + drag
        this.canvas.on('mouse:down', (opt) => {
            const evt = opt.e;

            // Middle mouse button (button 1) or Space key held
            if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
                this.isPanning = true;
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;
                this.canvas.selection = false; // Disable selection while panning
                this.canvas.defaultCursor = 'grab';
                this.canvas.hoverCursor = 'grab';
                evt.preventDefault();
            }
        });

        this.canvas.on('mouse:move', (opt) => {
            if (this.isPanning) {
                const evt = opt.e;
                const vpt = this.canvas.viewportTransform;

                // Calculate movement delta
                const deltaX = evt.clientX - this.lastPosX;
                const deltaY = evt.clientY - this.lastPosY;

                // Update viewport transform for panning
                vpt[4] += deltaX;
                vpt[5] += deltaY;

                this.canvas.requestRenderAll();
                this.lastPosX = evt.clientX;
                this.lastPosY = evt.clientY;

                this.canvas.defaultCursor = 'grabbing';
                this.canvas.hoverCursor = 'grabbing';
            }
        });

        this.canvas.on('mouse:up', (opt) => {
            if (this.isPanning) {
                this.canvas.setViewportTransform(this.canvas.viewportTransform);
                this.isPanning = false;
                this.canvas.selection = true; // Re-enable selection
                this.canvas.defaultCursor = 'default';
                this.canvas.hoverCursor = 'move';
            }
        });

        // Add keyboard shortcuts for panning
        document.addEventListener('keydown', (e) => {
            const step = 50; // pixels to pan per key press
            const vpt = this.canvas.viewportTransform;

            // Arrow keys for panning (when no input field is focused)
            if (!e.target.matches('input, textarea, select')) {
                switch(e.key) {
                    case 'ArrowLeft':
                        vpt[4] += step;
                        this.canvas.requestRenderAll();
                        e.preventDefault();
                        break;
                    case 'ArrowRight':
                        vpt[4] -= step;
                        this.canvas.requestRenderAll();
                        e.preventDefault();
                        break;
                    case 'ArrowUp':
                        vpt[5] += step;
                        this.canvas.requestRenderAll();
                        e.preventDefault();
                        break;
                    case 'ArrowDown':
                        vpt[5] -= step;
                        this.canvas.requestRenderAll();
                        e.preventDefault();
                        break;
                }
            }
        });

        console.log("Panning setup complete - Use Shift+Drag or Middle Mouse Button to pan");
    },

    // Reset pan to center
    reset: function() {
        if (this.canvas) {
            this.canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
            this.canvas.requestRenderAll();
            console.log("Pan reset to origin");
        }
    }
};

// Get list of all saved diagrams
export function getSavedDiagramsList() {
    try {
        const savedList = JSON.parse(localStorage.getItem('umlDiagramsList') || '[]');
        return savedList;
    } catch (error) {
        console.error('Error getting saved diagrams list:', error);
        return [];
    }
}

// Enhanced saveDiagram function with named saves support
export function saveDiagram(useLocalStorage = false, diagramName = null) {
    try {
        // Pre-save processing to ensure connection integrity
        canvas.getObjects().forEach(obj => {
            // Ensure connections array exists
            if (!obj.connections) {
                obj.connections = [];
            }
            
            // Store connection label texts and properties before saving
            if (obj.elementType && [
                ELEMENT_TYPES.ASSOCIATION,
                ELEMENT_TYPES.INCLUDE,
                ELEMENT_TYPES.EXTEND,
                ELEMENT_TYPES.GENERALIZATION,
                ELEMENT_TYPES.THREATENS
            ].includes(obj.elementType)) {
                // Store unique ID for connections if not already assigned
                if (!obj.id) {
                    obj.id = 'conn_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                
                // Store source and target IDs (not just references)
                if (obj.source && typeof obj.source === 'object') {
                    if (!obj.source.id) {
                        obj.source.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    }
                    obj.sourceId = obj.source.id;
                }
                
                if (obj.target && typeof obj.target === 'object') {
                    if (!obj.target.id) {
                        obj.target.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                    }
                    obj.targetId = obj.target.id;
                }
                
                // Store label text and settings if label exists
                if (obj.label) {
                    obj.labelText = obj.label.text;
                    obj.labelSettings = {
                        fontFamily: obj.label.fontFamily,
                        fontSize: obj.label.fontSize,
                        fontWeight: obj.label.fontWeight,
                        fill: obj.label.fill,
                        textAlign: obj.label.textAlign
                    };
                    
                    // Store position relative to the connection
                    obj.labelPosition = {
                        xOffset: obj.label.left - (obj.x1 + obj.x2) / 2,
                        yOffset: obj.label.top - (obj.y1 + obj.y2) / 2
                    };
                }
            }
            
            // For all elements (not connections), ensure they have an ID
            if (obj.elementType && ![
                ELEMENT_TYPES.ASSOCIATION,
                ELEMENT_TYPES.INCLUDE,
                ELEMENT_TYPES.EXTEND,
                ELEMENT_TYPES.GENERALIZATION,
                ELEMENT_TYPES.THREATENS
            ].includes(obj.elementType)) {
                if (!obj.id) {
                    obj.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                
                // Store connection IDs rather than object references
                if (obj.connections && obj.connections.length > 0) {
                    obj.connectionIds = obj.connections.map(conn => {
                        if (!conn.id) {
                            conn.id = 'conn_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                        }
                        return conn.id;
                    });
                }
            }
        });
        
        // Now generate the JSON with all needed properties
        const json = canvas.toJSON([
            'elementType', 
            'name', 
            'connections',
            'connectionIds', // New property for element -> connection references
            'source', 
            'target',
            'sourceId',      // New property for connection -> element references 
            'targetId',      // New property for connection -> element references
            'id',            // Unique ID for all objects
            'class',
            'customFontSettings',
            'isConnectionLabel',
            'labelText',
            'labelSettings',
            'labelPosition',  // New property for label positioning
            '_originalScale'
        ]);
        
        // Save to session storage for page refresh persistence
        sessionStorage.setItem(DIAGRAM_STORAGE_KEY, JSON.stringify(json));
        console.log("Diagram saved to session storage with enhanced connection references");

        // Also save to local storage if specified (for longer persistence)
        if (useLocalStorage) {
            // If no name provided, prompt for one
            if (!diagramName) {
                diagramName = prompt("Enter a name for this diagram:", "My UML Diagram " + new Date().toLocaleDateString());
                if (!diagramName) {
                    // User cancelled
                    return false;
                }
            }

            // Save the diagram with timestamp
            const timestamp = new Date().toISOString();
            const diagramData = {
                name: diagramName,
                data: json,
                savedAt: timestamp,
                id: 'diagram_' + Date.now()
            };

            // Get existing diagrams list
            let diagramsList = getSavedDiagramsList();

            // Check if diagram with same name exists
            const existingIndex = diagramsList.findIndex(d => d.name === diagramName);
            if (existingIndex !== -1) {
                // Update existing diagram
                diagramsList[existingIndex] = diagramData;
            } else {
                // Add new diagram
                diagramsList.push(diagramData);
            }

            // Save the updated list
            localStorage.setItem('umlDiagramsList', JSON.stringify(diagramsList));

            // Also save as the "last diagram" for quick access
            localStorage.setItem('umlDiagram', JSON.stringify(json));

            // Import UI module to show success message
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(true, `Diagram "${diagramName}" saved successfully!`, "success");
                    setTimeout(() => ui.showConnectionHelp(false), 2000);
                }
            }).catch(error => {
                console.error("Error importing UI module:", error);
            });

            console.log("Diagram saved to local storage with enhanced connection references");
        }
        
        // Send to server if configured
        sendToServer(json);
        
        return true;
    } catch (error) {
        console.error('Error saving diagram to storage:', error);
        
        if (useLocalStorage) {
            // Import UI module to show error message
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(true, "Error saving diagram: " + error.message, "error");
                    setTimeout(() => ui.showConnectionHelp(false), 3000);
                }
            }).catch(err => {
                console.error("Error importing UI module:", err);
            });
        }
        
        return false;
    }
}

// Function to save diagram to server
function sendToServer(json) {
    try {
        fetch('/save', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Saved to server successfully');
            } else {
                console.error('Error saving to server:', data);
            }
        })
        .catch((error) => {
            console.error('Error saving to server:', error);
        });
    } catch (error) {
        console.error('Error sending to server:', error);
    }
}

// Auto-save function to be called on diagram changes
export function autoSaveDiagram() {
    saveDiagram(false); // Don't show notifications for auto-save
}

// Show diagram picker dialog
export function showDiagramPicker() {
    const diagramsList = getSavedDiagramsList();

    if (diagramsList.length === 0) {
        alert("No saved diagrams found!");
        return;
    }

    // Create a simple selection dialog
    let options = "Select a diagram to load:\n\n";
    diagramsList.forEach((diagram, index) => {
        const date = new Date(diagram.savedAt).toLocaleString();
        options += `${index + 1}. ${diagram.name} (Saved: ${date})\n`;
    });

    const selection = prompt(options + "\nEnter the number of the diagram to load:", "1");

    if (selection) {
        const index = parseInt(selection) - 1;
        if (index >= 0 && index < diagramsList.length) {
            loadDiagramById(diagramsList[index].id);
        } else {
            alert("Invalid selection!");
        }
    }
}

// Load a specific diagram by ID
export function loadDiagramById(diagramId) {
    try {
        const diagramsList = getSavedDiagramsList();
        const diagram = diagramsList.find(d => d.id === diagramId);

        if (diagram) {
            loadDiagramFromJSON(JSON.stringify(diagram.data), true);

            // Import UI module to show success message
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(true, `Diagram "${diagram.name}" loaded successfully!`, "success");
                    setTimeout(() => ui.showConnectionHelp(false), 2000);
                }
            }).catch(error => {
                console.error("Error importing UI module:", error);
            });

            return true;
        } else {
            throw new Error("Diagram not found!");
        }
    } catch (error) {
        console.error('Error loading diagram by ID:', error);
        alert("Error loading diagram: " + error.message);
        return false;
    }
}

// Enhanced load diagram function to use sessionStorage
export function loadDiagram(useLocalStorage = false) {
    try {
        // If useLocalStorage, show the diagram picker
        if (useLocalStorage) {
            showDiagramPicker();
            return true;
        }

        // Otherwise, load from session storage (for page refresh persistence)
        let savedDiagram = sessionStorage.getItem(DIAGRAM_STORAGE_KEY);

        if (savedDiagram) {
            loadDiagramFromJSON(savedDiagram, useLocalStorage);
            return true;
        }
    } catch (error) {
        console.error('Error loading diagram from storage:', error);
        
        if (useLocalStorage) {
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(true, "Error loading diagram: " + error.message, "error");
                    setTimeout(() => ui.showConnectionHelp(false), 3000);
                }
            }).catch(error => {
                console.error("Error importing UI module:", error);
            });
        }
    }
    
    // Initialize zoom controls anyway
    zoom.init(canvas);
    return false;
}

// Enhanced loadDiagramFromJSON function with improved connection handling
function loadDiagramFromJSON(jsonString, showNotification = true) {
    try {
        // Parse the JSON first to access the object data before loading
        const jsonData = JSON.parse(jsonString);
        
        // Create a map of IDs to track elements while loading
        const idMap = new Map();
        
        canvas.loadFromJSON(jsonData, () => {
            console.log("Initial diagram loading complete, now fixing connections...");
            
            // First pass: Build the ID map for all elements
            canvas.getObjects().forEach(obj => {
                if (obj.id) {
                    idMap.set(obj.id, obj);
                    console.log(`Mapped object ID ${obj.id} to object type ${obj.elementType || 'unknown'}`);
                }
            });
            
            // Second pass: Reconnect all objects with their connections, sources, and targets
            canvas.getObjects().forEach(obj => {
                try {
                    // Rebuild element's connections array using connectionIds
                    if (obj.connectionIds && Array.isArray(obj.connectionIds)) {
                        obj.connections = obj.connectionIds.map(id => idMap.get(id)).filter(Boolean);
                        console.log(`Restored ${obj.connections.length} connections for element ID ${obj.id}`);
                    }
                    
                    // Rebuild connection's source and target references using sourceId and targetId
                    if (obj.elementType && [
                        ELEMENT_TYPES.ASSOCIATION,
                        ELEMENT_TYPES.INCLUDE,
                        ELEMENT_TYPES.EXTEND,
                        ELEMENT_TYPES.GENERALIZATION,
                        ELEMENT_TYPES.THREATENS
                    ].includes(obj.elementType)) {
                        
                        if (obj.sourceId) {
                            obj.source = idMap.get(obj.sourceId);
                            if (obj.source) {
                                // Make sure this connection is in the source's connections array
                                if (!obj.source.connections) {
                                    obj.source.connections = [];
                                }
                                if (!obj.source.connections.includes(obj)) {
                                    obj.source.connections.push(obj);
                                }
                            }
                        }
                        
                        if (obj.targetId) {
                            obj.target = idMap.get(obj.targetId);
                            if (obj.target) {
                                // Make sure this connection is in the target's connections array
                                if (!obj.target.connections) {
                                    obj.target.connections = [];
                                }
                                if (!obj.target.connections.includes(obj)) {
                                    obj.target.connections.push(obj);
                                }
                            }
                        }
                        
                        // Rebuild connection components (arrows, text)
                        if (obj.source && obj.target) {
                            import('./connections.js').then(connections => {
                                try {
                                    // Update the connection's endpoints
                                    connections.updateElementConnections(obj);
                                    
                                    // Recreate label if text was stored
                                    if (obj.labelText && !obj.label) {
                                        const label = connections.addConnectionLabel(obj, obj.labelText);
                                        
                                        // Apply label styling if available
                                        if (obj.labelSettings && label) {
                                            label.set(obj.labelSettings);
                                        }
                                        
                                        // Apply custom position if available
                                        if (obj.labelPosition && label) {
                                            const midX = (obj.x1 + obj.x2) / 2;
                                            const midY = (obj.y1 + obj.y2) / 2;
                                            
                                            label.set({
                                                left: midX + obj.labelPosition.xOffset,
                                                top: midY + obj.labelPosition.yOffset
                                            });
                                        }
                                        
                                        canvas.renderAll();
                                    }
                                } catch (connError) {
                                    console.error("Error updating connection during load:", connError);
                                }
                            }).catch(error => {
                                console.error('Error importing connections module:', error);
                            });
                        } else {
                            console.warn(`Connection ${obj.id} has invalid source or target references`);
                        }
                    }
                    
                    // Reattach custom scaling behavior for text elements with font handling
                    if (obj.elementType && (
                        obj.elementType === ELEMENT_TYPES.ACTOR ||
                        obj.elementType === ELEMENT_TYPES.USECASE ||
                        obj.elementType === ELEMENT_TYPES.SYSTEM ||
                        obj.elementType === ELEMENT_TYPES.MISUSE_CASE ||
                        obj.elementType === ELEMENT_TYPES.MISUSER)) {
                        
                        import('./fontManager.js').then(fontManager => {
                            try {
                                // Apply font settings if they exist
                                if (obj.customFontSettings) {
                                    const textObj = fontManager.getTextObject(obj);
                                    if (textObj) {
                                        // Apply stored font settings
                                        fontManager.updateTextAppearance(obj, obj.customFontSettings);
                                    }
                                }
                                
                                // Set up intelligent font scaling
                                fontManager.initFontScaling(obj);
                                
                                // Auto-size based on text content
                                fontManager.autoSizeElementBasedOnText(obj);
                            } catch (fontError) {
                                console.error("Error applying font settings during load:", fontError);
                            }
                        }).catch(error => {
                            console.error('Error importing fontManager module:', error);
                        });
                    }
                } catch (objError) {
                    console.error(`Error processing object during load:`, objError);
                }
            });
            
            canvas.renderAll();
            console.log("Connection restoration complete");
            
            // Initialize zoom controls after loading with correct canvas reference
            zoom.init(canvas);
            
            if (showNotification) {
                // Show confirmation
                import('./ui.js').then(ui => {
                    if (ui.showConnectionHelp) {
                        ui.showConnectionHelp(true, "Diagram loaded successfully!", "success");
                        setTimeout(() => ui.showConnectionHelp(false), 2000);
                    }
                }).catch(error => {
                    console.error('Error importing UI module for notification:', error);
                });
            }
            
            // Re-initialize the connection handlers from connections module
            import('./connections.js').then(connections => {
                if (connections.setupConnectionHandlers) {
                    connections.setupConnectionHandlers();
                    console.log("Connection handlers reinitiated");
                }
            }).catch(error => {
                console.error('Error importing connections module for handlers:', error);
            });
            
            // Initialize misuse case manager
            import('./misuseCaseManager.js').then(misuseCaseManager => {
                if (misuseCaseManager.init) {
                    misuseCaseManager.init();
                    console.log("Misuse case manager initialized after load");
                }
            }).catch(error => {
                console.error('Error importing misuseCaseManager module:', error);
            });
        });
    } catch (error) {
        console.error('Error in loadDiagramFromJSON:', error);
        
        // Show error notification
        import('./ui.js').then(ui => {
            if (ui.showConnectionHelp) {
                ui.showConnectionHelp(true, "Error loading diagram: " + error.message, "error");
                setTimeout(() => ui.showConnectionHelp(false), 3000);
            }
        }).catch(err => {
            console.error('Error importing UI module for error notification:', err);
        });
    }
}

export { loadDiagramFromJSON };

// Fixed clearDiagram function
export function clearDiagram() {
    try {
        // Confirm before clearing
        if (!confirm('Are you sure you want to clear the diagram?')) {
            return false;
        }
        
        // Clear the canvas
        canvas.clear();
        
        // Use the setter functions from core.js
        import('./core.js').then(core => {
            if (core.setSelectedElement) {
                core.setSelectedElement(null);
            }
            if (core.setConnectingElement) {
                core.setConnectingElement(null);
            }
            if (core.setConnectionStep) {
                core.setConnectionStep('none');
            }
            
            // Clear properties panel using UI module
            import('./ui.js').then(ui => {
                if (ui.clearPropertiesPanel) {
                    ui.clearPropertiesPanel();
                }
                
                // Show success message
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(true, "Diagram cleared successfully!", "success");
                    setTimeout(() => ui.showConnectionHelp(false), 2000);
                }
            }).catch(err => {
                console.error('Error importing UI module:', err);
            });
        }).catch(err => {
            console.error('Error importing core module:', err);
        });
        
        // Clear the session storage
        sessionStorage.removeItem(DIAGRAM_STORAGE_KEY);
        
        // Reset zoom level
        zoom.zoomReset();
        
        return true;
    } catch (error) {
        console.error('Error clearing diagram:', error);
        
        // Show error notification
        import('./ui.js').then(ui => {
            if (ui.showConnectionHelp) {
                ui.showConnectionHelp(true, "Error clearing diagram: " + error.message, "error");
                setTimeout(() => ui.showConnectionHelp(false), 3000);
            }
        }).catch(err => {
            console.error('Error importing UI module:', err);
        });
        
        return false;
    }
}

// Function to set up auto-save functionality
export function setupAutoSave() {
    try {
        // Auto-save on object modifications
        canvas.on('object:modified', autoSaveDiagram);
        
        // Auto-save when objects are added or removed
        canvas.on('object:added', autoSaveDiagram);
        canvas.on('object:removed', autoSaveDiagram);
        
        // Auto-save when text changes
        canvas.on('text:changed', autoSaveDiagram);
        
        console.log('Auto-save functionality set up');
    } catch (error) {
        console.error('Error setting up auto-save:', error);
    }
}

// Function to validate the integrity of connections in the diagram
export function validateConnections() {
    let issues = 0;
    const fixedConnections = [];

    // Check each element with connections
    canvas.getObjects().forEach(obj => {
        if (!obj.connections) {
            obj.connections = [];
        } else {
            // Filter out invalid connections
            const validConnections = obj.connections.filter(conn => {
                if (!conn || !conn.elementType) {
                    issues++;
                    console.warn('Found invalid connection in element connections list', obj.id);
                    return false;
                }
                return true;
            });
            
            if (validConnections.length !== obj.connections.length) {
                issues++;
                obj.connections = validConnections;
                fixedConnections.push(obj.id);
            }
        }
        
        // For connection objects, validate source and target
        if (obj.elementType && [
            ELEMENT_TYPES.ASSOCIATION,
            ELEMENT_TYPES.INCLUDE,
            ELEMENT_TYPES.EXTEND,
            ELEMENT_TYPES.GENERALIZATION,
            ELEMENT_TYPES.THREATENS
        ].includes(obj.elementType)) {
            
            let fixed = false;
            
            // Ensure source and target exist
            if (!obj.source || !obj.target) {
                issues++;
                // This connection can't be fixed - orphaned connection
                canvas.remove(obj);
                console.warn('Removed orphaned connection without source or target', obj.id);
                fixed = true;
            } else {
                // Ensure the connection is in both source and target objects' connections arrays
                if (obj.source.connections && !obj.source.connections.includes(obj)) {
                    obj.source.connections.push(obj);
                    issues++;
                    fixed = true;
                }
                
                if (obj.target.connections && !obj.target.connections.includes(obj)) {
                    obj.target.connections.push(obj);
                    issues++;
                    fixed = true;
                }
            }
            
            if (fixed) {
                fixedConnections.push(obj.id);
            }
        }
    });
    
    // Output report
    if (issues > 0) {
        console.info(`Connection validation completed: Fixed ${issues} issues in ${fixedConnections.length} objects`);
        
        // Re-render canvas after fixes
        canvas.renderAll();
        
        // Force an auto-save to preserve fixes
        autoSaveDiagram();
        
        return fixedConnections;
    } else {
        console.info('Connection validation completed: No issues found');
        return [];
    }
}

// Function to extract all connection data for debugging or info
export function getConnectionInfo() {
    const connections = [];
    const elements = [];
    
    canvas.getObjects().forEach(obj => {
        if (obj.elementType && [
            ELEMENT_TYPES.ASSOCIATION,
            ELEMENT_TYPES.INCLUDE,
            ELEMENT_TYPES.EXTEND,
            ELEMENT_TYPES.GENERALIZATION,
            ELEMENT_TYPES.THREATENS
        ].includes(obj.elementType)) {
            // This is a connection
            connections.push({
                id: obj.id || 'unknown',
                type: obj.elementType,
                source: obj.source ? {
                    id: obj.source.id || 'unknown',
                    type: obj.source.elementType || 'unknown',
                    name: obj.source.name || 'unnamed'
                } : 'missing',
                target: obj.target ? {
                    id: obj.target.id || 'unknown',
                    type: obj.target.elementType || 'unknown',
                    name: obj.target.name || 'unnamed'
                } : 'missing',
                hasLabel: obj.label ? true : false
            });
        } else if (obj.elementType) {
            // This is an element
            elements.push({
                id: obj.id || 'unknown',
                type: obj.elementType,
                name: obj.name || 'unnamed',
                connectionCount: obj.connections ? obj.connections.length : 0
            });
        }
    });
    
    return {
        connections,
        elements,
        totalConnections: connections.length,
        totalElements: elements.length
    };
}