// core.js - Core functionality, canvas setup, and global state

// Define UML element types
export const ELEMENT_TYPES = {
    ACTOR: 'actor',
    USECASE: 'usecase',
    SYSTEM: 'system',
    ASSOCIATION: 'association',
    INCLUDE: 'include',
    EXTEND: 'extend',
    GENERALIZATION: 'generalization',
    MISUSE_CASE: 'misusecase',
    MISUSER: 'misuser',
    THREATENS: 'threatens'
};

// Global state variables - using let so they can be modified by setter functions
export let currentTool = 'select';
export let selectedElement = null;
export let connectingElement = null;
export let connectionStep = 'none'; // 'none', 'source-selected', 'completed'
export let connectionHelpElement = null;

// Setter functions for state variables
export function setSelectedElement(element) {
    selectedElement = element;
    return selectedElement;
}

export function setConnectingElement(element) {
    connectingElement = element;
    return connectingElement;
}

export function setConnectionStep(step) {
    connectionStep = step;
    return connectionStep;
}

export function setConnectionHelpElement(element) {
    connectionHelpElement = element;
    return connectionHelpElement;
}

export function setCurrentTool(tool) {
    currentTool = tool;
    return currentTool;
}

// Initialize the canvas with Fabric.js with improved rendering
export const canvas = new fabric.Canvas('diagram-canvas', {
    width: window.innerWidth - 280, // Adjust for properties panel
    height: window.innerHeight - 110, // Adjust for header and toolbar
    selection: true,
    preserveObjectStacking: true,
    renderOnAddRemove: true,
    imageSmoothingEnabled: true, // Enable image smoothing
    enableRetinaScaling: true,   // Better rendering on high-DPI displays
    snapAngle: 15,               // Snap to 15-degree angles when rotating
    snapThreshold: 10,           // Snap threshold in pixels
    selectionFullyContained: false // Selection by touching, not fully contained
});

// Apply better rendering settings to fabric globally
fabric.Object.prototype.objectCaching = true;         // Enable object caching
fabric.Object.prototype.transparentCorners = false;   // More visible handles
fabric.Object.prototype.cornerColor = '#4a6fff';      // Blue corners
fabric.Object.prototype.cornerSize = 8;               // Slightly smaller corners
fabric.Object.prototype.cornerStyle = 'circle';       // Round corners
fabric.Object.prototype.borderColor = '#4a6fff';      // Blue borders
fabric.Object.prototype.borderScaleFactor = 1.5;      // Thicker selection border
fabric.Object.prototype.padding = 5;                  // Space between object and border

// Enable smoothing and better rendering
fabric.textureSize = 4096;  // Maximum texture size
fabric.devicePixelRatio = window.devicePixelRatio || 1; // Use device pixel ratio

// Add anti-aliasing for text rendering
const originalRenderText = fabric.Text.prototype._render;
fabric.Text.prototype._render = function(ctx) {
    ctx.imageSmoothingEnabled = true;
    ctx.textRendering = 'optimizeLegibility';
    ctx.fontKerning = 'normal';
    
    // Enable text anti-aliasing
    ctx.shadowColor = this.fill || '#000';
    ctx.shadowBlur = 0.5;
    ctx.shadowOffsetX = 0.3;
    ctx.shadowOffsetY = 0.3;
    
    originalRenderText.call(this, ctx);
    
    // Reset shadow to avoid affecting other elements
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
};

// Initialize the core functionality
export function init() {
    try {
        // Make sure the canvas element exists
        const canvasElement = document.getElementById('diagram-canvas');
        if (!canvasElement) {
            console.error("Canvas element 'diagram-canvas' not found!");
            return;
        }
        
        connectionHelpElement = document.getElementById('connection-help');
        if (!connectionHelpElement) {
            console.warn("Connection help element not found, creating one");
            connectionHelpElement = document.createElement('div');
            connectionHelpElement.id = 'connection-help';
            connectionHelpElement.className = 'connection-help';
            document.body.appendChild(connectionHelpElement);
        }

        // Reset canvas state
        canvas.isDrawingMode = false;
        canvas.selection = true;
        canvas.defaultCursor = 'default';
        
        // Initialize tools
        initTools();
        
        // Ensure all canvas event handlers are set up
        setupCanvasEventHandlers();
        
        console.log("Core initialization complete");
    } catch (err) {
        console.error("Error in core initialization:", err);
    }
}

// Add this in the setupCanvasEventHandlers function in core.js
// Inside the existing setupCanvasEventHandlers function, add:

function setupCanvasEventHandlers() {
    try {
        // Make sure mouse:down handler is set up for element creation
        canvas.off('mouse:down');
        canvas.on('mouse:down', function(options) {
            handleCanvasClick(options);
        });
        
        // Add selection event handlers - these are critical
        canvas.off('selection:created');
        canvas.off('selection:updated');
        canvas.off('selection:cleared');
        
        // When selection is created
        canvas.on('selection:created', function(options) {
            try {
                // Don't proceed if no selection
                if (!options.selected || options.selected.length === 0) return;
                
                // Import UI module to update properties panel
                import('./ui.js').then(ui => {
                    if (ui.updatePropertiesPanel) {
                        ui.updatePropertiesPanel(options.selected[0]);
                    }
                }).catch(error => {
                    console.error("Error importing UI module:", error);
                });
                
                // Import misuseCaseManager to update selected use case
                import('./misuseCaseManager.js').then(misuseCaseManager => {
                    if (misuseCaseManager.updateSelectedUseCaseInfo) {
                        misuseCaseManager.updateSelectedUseCaseInfo(options.selected[0]);
                    }
                }).catch(error => {
                    console.error("Error importing misuseCaseManager module:", error);
                });
                
                // Update global selected element
                setSelectedElement(options.selected[0]);
                
                // Add selected class for better styling
                if (options.selected && options.selected.length > 0) {
                    options.selected.forEach(obj => {
                        obj.set('data-selected', 'true');
                    });
                }
            } catch (error) {
                console.error("Error in selection:created handler:", error);
            }
        });
        
        // When selection is updated
        canvas.on('selection:updated', function(options) {
            try {
                if (!options.selected || options.selected.length === 0) return;
                
                import('./ui.js').then(ui => {
                    if (ui.updatePropertiesPanel) {
                        ui.updatePropertiesPanel(options.selected[0]);
                    }
                }).catch(error => {
                    console.error("Error importing UI module:", error);
                });
                
                import('./misuseCaseManager.js').then(misuseCaseManager => {
                    if (misuseCaseManager.updateSelectedUseCaseInfo) {
                        misuseCaseManager.updateSelectedUseCaseInfo(options.selected[0]);
                    }
                }).catch(error => {
                    console.error("Error importing misuseCaseManager module:", error);
                });
                
                // Update global selected element
                setSelectedElement(options.selected[0]);
            } catch (error) {
                console.error("Error in selection:updated handler:", error);
            }
        });
        
        // When selection is cleared
        canvas.on('selection:cleared', function() {
            try {
                import('./ui.js').then(ui => {
                    if (ui.clearPropertiesPanel) {
                        ui.clearPropertiesPanel();
                    }
                }).catch(error => {
                    console.error("Error importing UI module:", error);
                });
                
                import('./misuseCaseManager.js').then(misuseCaseManager => {
                    if (misuseCaseManager.updateSelectedUseCaseInfo) {
                        misuseCaseManager.updateSelectedUseCaseInfo(null);
                    }
                }).catch(error => {
                    console.error("Error importing misuseCaseManager module:", error);
                });
                
                // Clear global selected element
                setSelectedElement(null);
                
                // Remove selected class
                canvas.getObjects().forEach(obj => {
                    obj.set('data-selected', 'false');
                });
            } catch (error) {
                console.error("Error in selection:cleared handler:", error);
            }
        });
        
        // Other essential event handlers can be set up here if needed
    } catch (err) {
        console.error("Error setting up canvas event handlers:", err);
    }
}

// Initialize the tool buttons
function initTools() {
    try {
        document.getElementById('select-tool')?.addEventListener('click', () => setTool('select'));
        document.getElementById('actor-tool')?.addEventListener('click', () => setTool('actor'));
        document.getElementById('usecase-tool')?.addEventListener('click', () => setTool('usecase'));
        document.getElementById('system-tool')?.addEventListener('click', () => setTool('system'));
        document.getElementById('association-tool')?.addEventListener('click', () => setTool('association'));
        document.getElementById('include-tool')?.addEventListener('click', () => setTool('include'));
        document.getElementById('extend-tool')?.addEventListener('click', () => setTool('extend'));
        document.getElementById('generalization-tool')?.addEventListener('click', () => setTool('generalization'));
        document.getElementById('misuser-tool')?.addEventListener('click', () => setTool('misuser'));
        document.getElementById('misusecase-tool')?.addEventListener('click', () => setTool('misusecase'));
        document.getElementById('threatens-tool')?.addEventListener('click', () => setTool('threatens'));

        // Save, load, and clear buttons
        const saveBtn = document.getElementById('save-btn');
        const loadBtn = document.getElementById('load-btn');
        const clearBtn = document.getElementById('clear-btn');
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                // Call the enhanced saveDiagram with useLocalStorage=true
                import('./utils.js').then(utils => {
                    utils.saveDiagram(true);
                }).catch(error => {
                    console.error("Error importing utils module:", error);
                });
            });
        }
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                // Call the enhanced loadDiagram with useLocalStorage=true
                import('./utils.js').then(utils => {
                    utils.loadDiagram(true);
                }).catch(error => {
                    console.error("Error importing utils module:", error);
                });
            });
        }
        
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                import('./utils.js').then(utils => {
                    utils.clearDiagram();
                }).catch(error => {
                    console.error("Error importing utils module:", error);
                });
            });
        }
        
        console.log("Tools initialized successfully");
    } catch (err) {
        console.error("Error initializing tools:", err);
    }
}

// FIXED: Set the active tool with proper error handling
export function setTool(tool) {
    try {
        // Deactivate all tool buttons
        document.querySelectorAll('.tool').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Activate the selected tool button
        const toolBtn = document.getElementById(`${tool}-tool`);
        if (toolBtn) {
            toolBtn.classList.add('active');
        }
        
        // Cancel any current connection
        if (connectionStep === 'source-selected') {
            // Use the connections module to cancel properly
            import('./connections.js').then(connections => {
                if (connections.cancelConnection) {
                    connections.cancelConnection();
                }
            }).catch(error => {
                console.error("Error importing connections module:", error);
                // Fallback to direct reset if import fails
                if (connectingElement) {
                    resetElementAppearance(connectingElement);
                    canvas.renderAll();
                }
                setConnectionStep('none');
                setConnectingElement(null);
            });
        }
        
        // Update current tool
        setCurrentTool(tool);
        
        // Set cursor based on the tool
        if (tool === 'select') {
            canvas.defaultCursor = 'default';
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(false);
                }
            }).catch(error => {
                console.error("Error importing UI module:", error);
            });
        } else if (tool === 'association' || tool === 'include' || 
                tool === 'extend' || tool === 'generalization' || 
                tool === 'threatens') {
            canvas.defaultCursor = 'pointer';
            showConnectionInstructions(tool);
        } else {
            canvas.defaultCursor = 'crosshair';
            import('./ui.js').then(ui => {
                if (ui.showConnectionHelp) {
                    ui.showConnectionHelp(false);
                }
            }).catch(error => {
                console.error("Error importing UI module:", error);
            });
        }
        
        return tool;
    } catch (err) {
        console.error("Error setting tool:", err);
        return null;
    }
}

// Function to show connection instructions
function showConnectionInstructions(connectionType) {
    try {
        import('./ui.js').then(ui => {
            if (!ui.showConnectionHelp) {
                console.error("showConnectionHelp function not found in UI module");
                return;
            }
            
            let message = "";
            switch(connectionType) {
                case 'association':
                    message = "Step 1: Click on an Actor or Use Case to start the association";
                    break;
                case 'include':
                    message = "Step 1: Click on a Use Case to start the <<include>> relationship";
                    break;
                case 'extend':
                    message = "Step 1: Click on a Use Case to start the <<extend>> relationship";
                    break;
                case 'generalization':
                    message = "Step 1: Click on an Actor or Use Case to start the generalization";
                    break;
                case 'threatens':
                    message = "Step 1: Click on a Misuse Case to start the <<threatens>> relationship";
                    break;
                default:
                    message = "Select a source element to begin";
                    break;
            }
            
            // Show the help message
            ui.showConnectionHelp(true, message);
        }).catch(error => {
            console.error("Error importing UI module:", error);
        });
    } catch (err) {
        console.error("Error showing connection instructions:", err);
    }
}

// Reset an element's appearance
export function resetElementAppearance(element) {
    try {
        if (!element) return;
        
        if (element.elementType === ELEMENT_TYPES.MISUSE_CASE ||
            element.elementType === ELEMENT_TYPES.MISUSER) {
            element.set({
                stroke: '#dc3545',
                strokeWidth: 2
            });
        } else {
            element.set({
                stroke: 'black',
                strokeWidth: 2
            });
        }
    } catch (err) {
        console.error("Error resetting element appearance:", err);
    }
}

// Handle canvas click for creating elements and connections
export function handleCanvasClick(options) {
    try {
        if (!options) {
            console.error("Invalid options provided to handleCanvasClick");
            return;
        }
        
        if (currentTool === 'select') {
            // Selection mode, default behavior
            return;
        }
        
        const pointer = canvas.getPointer(options.e);
        if (!pointer) {
            console.error("Could not get pointer position from event");
            return;
        }
        
        let element;
        
        // Part 1: Creating elements
        // Import the elements module dynamically to avoid circular dependencies
        import('./elements.js').then(elements => {
            switch (currentTool) {
                case 'actor':
                    element = elements.createActor(pointer.x, pointer.y);
                    if (element) {
                        canvas.add(element);
                        showConnectionHelp(true, "Actor created! Use the association tool to connect it to a Use Case.", "success");
                        setTimeout(() => showConnectionHelp(false), 3000);
                        setTool('select'); // Auto-switch to select tool
                    }
                    break;
                    
                case 'usecase':
                    element = elements.createUseCase(pointer.x, pointer.y);
                    if (element) {
                        canvas.add(element);
                        showConnectionHelp(true, "Use Case created! Use the association tool to connect it to an Actor.", "success");
                        setTimeout(() => showConnectionHelp(false), 3000);
                        setTool('select'); // Auto-switch to select tool
                    }
                    break;
                    
                case 'system':
                    element = elements.createSystem(pointer.x, pointer.y);
                    if (element) {
                        canvas.add(element);
                        canvas.sendToBack(element);
                        showConnectionHelp(true, "System boundary created! Add Use Cases inside this boundary.", "success");
                        setTimeout(() => showConnectionHelp(false), 3000);
                        setTool('select'); // Auto-switch to select tool
                    }
                    break;
                    
                case 'misuser':
                    element = elements.createMisuser(pointer.x, pointer.y);
                    if (element) {
                        canvas.add(element);
                        showConnectionHelp(true, "Misuser created! Connect it to a Misuse Case using the association tool.", "success");
                        setTimeout(() => showConnectionHelp(false), 3000);
                        setTool('select'); // Auto-switch to select tool
                    }
                    break;
                    
                case 'misusecase':
                    element = elements.createMisuseCase(pointer.x, pointer.y);
                    if (element) {
                        canvas.add(element);
                        showConnectionHelp(true, "Misuse Case created! Connect it to a Use Case using the threatens tool.", "success");
                        setTimeout(() => showConnectionHelp(false), 3000);
                        setTool('select'); // Auto-switch to select tool
                    }
                    break;
            }
        }).catch(error => {
            console.error("Error importing elements module:", error);
        });
        
        // Part 2: Creating connections
        if (['association', 'include', 'extend', 'generalization', 'threatens'].includes(currentTool)) {
            handleConnectionCreation(options);
        }
        
        canvas.renderAll();
    } catch (err) {
        console.error("Error handling canvas click:", err);
    }
}

// Handle connection creation - separated for clarity
function handleConnectionCreation(options) {
    try {
        import('./connections.js').then(connections => {
            if (options.target) {
                // Check if we're selecting the source or the target for the connection
                if (connectionStep === 'none') {
                    // Step 1: Selecting the source element
                    const isValidSource = connections.validateConnectionSource(currentTool, options.target);
                    
                    if (isValidSource) {
                        setConnectingElement(options.target);
                        setConnectionStep('source-selected');
                        
                        // Apply source-selected class for CSS styling
                        options.target.set({
                            stroke: '#4a6fff',
                            strokeWidth: 3
                        });
                        
                        // Show next step message
                        import('./ui.js').then(ui => {
                            if (ui.showConnectionHelp) {
                                ui.showConnectionHelp(true, `Step 2: Now click on a target element to complete the ${currentTool} connection`);
                            }
                        }).catch(error => {
                            console.error("Error importing UI module:", error);
                        });
                    } else {
                        // Show error message for invalid source
                        import('./ui.js').then(ui => {
                            if (ui.showConnectionHelp) {
                                ui.showConnectionHelp(true, connections.getInvalidSourceMessage(currentTool, options.target), "error");
                                setTimeout(() => ui.showConnectionHelp(false), 3000);
                            }
                        }).catch(error => {
                            console.error("Error importing UI module:", error);
                        });
                    }
                } 
                else if (connectionStep === 'source-selected') {
                    // Step 2: Selecting the target element
                    if (options.target !== connectingElement) {
                        const isValidTarget = connections.validateConnectionTarget(currentTool, connectingElement, options.target);
                        
                        if (isValidTarget) {
                            // Create the appropriate relationship
                            let relationship;
                            switch (currentTool) {
                                case 'association':
                                    relationship = connections.createAssociation(connectingElement, options.target);
                                    showConnectionHelp(true, "Association created successfully!", "success");
                                    break;
                                    
                                case 'include':
                                    relationship = connections.createInclude(connectingElement, options.target);
                                    showConnectionHelp(true, "Include relationship created successfully!", "success");
                                    break;
                                    
                                case 'extend':
                                    relationship = connections.createExtend(connectingElement, options.target);
                                    showConnectionHelp(true, "Extend relationship created successfully!", "success");
                                    break;
                                    
                                case 'generalization':
                                    relationship = connections.createGeneralization(connectingElement, options.target);
                                    showConnectionHelp(true, "Generalization created successfully!", "success");
                                    break;
                                    
                                case 'threatens':
                                    relationship = connections.createThreatens(connectingElement, options.target);
                                    showConnectionHelp(true, "Threatens relationship created successfully!", "success");
                                    break;
                            }
                            
                            // Reset the source element appearance
                            resetElementAppearance(connectingElement);
                            
                            // Reset connection state
                            setConnectionStep('none');
                            setConnectingElement(null);
                            
                            // Auto switch to select tool after creating a connection
                            setTimeout(() => {
                                setTool('select');
                                import('./ui.js').then(ui => {
                                    if (ui.showConnectionHelp) {
                                        ui.showConnectionHelp(false);
                                    }
                                }).catch(error => {
                                    console.error("Error importing UI module:", error);
                                });
                            }, 2000);
                        } else {
                            // Show error message for invalid connection
                            import('./ui.js').then(ui => {
                                if (ui.showConnectionHelp) {
                                    ui.showConnectionHelp(true, connections.getInvalidTargetMessage(currentTool, connectingElement, options.target), "error");
                                    setTimeout(() => ui.showConnectionHelp(false), 3000);
                                }
                            }).catch(error => {
                                console.error("Error importing UI module:", error);
                            });
                        }
                    } else {
                        // Clicked on the same element
                        import('./ui.js').then(ui => {
                            if (ui.showConnectionHelp) {
                                ui.showConnectionHelp(true, "Cannot connect an element to itself. Please select a different target.", "error");
                                setTimeout(() => ui.showConnectionHelp(false), 3000);
                            }
                        }).catch(error => {
                            console.error("Error importing UI module:", error);
                        });
                    }
                }
            } else if (connectionStep === 'source-selected') {
                // Clicked on empty canvas with a source already selected - cancel the connection
                resetElementAppearance(connectingElement);
                setConnectionStep('none');
                setConnectingElement(null);
                
                import('./ui.js').then(ui => {
                    if (ui.showConnectionHelp) {
                        ui.showConnectionHelp(true, "Connection canceled. Click on an element to start again.", "error");
                        setTimeout(() => ui.showConnectionHelp(false), 2000);
                    }
                }).catch(error => {
                    console.error("Error importing UI module:", error);
                });
            } else {
                // Clicked on empty canvas without a source - show guidance
                import('./ui.js').then(ui => {
                    if (ui.showConnectionHelp) {
                        ui.showConnectionHelp(true, "Please click on an element first to start the connection");
                        setTimeout(() => ui.showConnectionHelp(false), 3000);
                    }
                }).catch(error => {
                    console.error("Error importing UI module:", error);
                });
            }
        }).catch(error => {
            console.error("Error importing connections module:", error);
        });
    } catch (error) {
        console.error("Error in handleConnectionCreation:", error);
    }
}

// Helper function to show connection help message - used for direct updates
export function showConnectionHelp(show, message = '', type = 'info') {
    try {
        import('./ui.js').then(ui => {
            if (ui.showConnectionHelp) {
                ui.showConnectionHelp(show, message, type);
            } else {
                console.warn("showConnectionHelp function not found in UI module");
                
                // Fallback implementation if UI module can't be imported
                if (!connectionHelpElement) {
                    connectionHelpElement = document.getElementById('connection-help');
                    if (!connectionHelpElement) {
                        connectionHelpElement = document.createElement('div');
                        connectionHelpElement.id = 'connection-help';
                        connectionHelpElement.className = 'connection-help';
                        document.body.appendChild(connectionHelpElement);
                    }
                }
                
                if (show) {
                    connectionHelpElement.textContent = message;
                    connectionHelpElement.className = 'connection-help';
                    
                    if (type === 'success') {
                        connectionHelpElement.classList.add('success');
                    } else if (type === 'error') {
                        connectionHelpElement.classList.add('error');
                    }
                    
                    connectionHelpElement.classList.add('active');
                } else {
                    connectionHelpElement.classList.remove('active');
                }
            }
        }).catch(error => {
            console.error("Error importing UI module:", error);
            
            // Extra fallback if import completely fails
            if (!connectionHelpElement) {
                connectionHelpElement = document.getElementById('connection-help');
                if (!connectionHelpElement) return;
            }
            
            if (show) {
                connectionHelpElement.textContent = message;
                connectionHelpElement.className = 'connection-help';
                
                if (type === 'success') {
                    connectionHelpElement.classList.add('success');
                } else if (type === 'error') {
                    connectionHelpElement.classList.add('error');
                }
                
                connectionHelpElement.classList.add('active');
            } else {
                connectionHelpElement.classList.remove('active');
            }
        });
    } catch (error) {
        console.error("Error in showConnectionHelp:", error);
    }
}