// main.js - Main entry point for the UML editor with complete bug fixes
import * as core from './modules/core.js';
import * as elements from './modules/elements.js';
import * as connections from './modules/connections.js';
import * as ui from './modules/ui.js';
import * as utils from './modules/utils.js';
import * as fontManager from './modules/fontManager.js';
import * as misuseCaseManager from './modules/misuseCaseManager.js';
import historyManager from './modules/historyManager.js';
import clipboardManager from './modules/clipboardManager.js';
import contextMenu from './modules/contextMenu.js';
import stylingManager from './modules/stylingManager.js';
import performanceOptimizer from './modules/performanceOptimizer.js';

// Create a global reference to key objects that need to be accessed
window.umlEditor = {
    core: core,
    ui: ui,
    canvas: core.canvas,
    selectedElement: null
};

// Function to wrap the original loadDiagram and apply fixes
function enhancedLoadDiagram(useLocalStorage) {
  const result = utils.loadDiagram(useLocalStorage);
  setTimeout(fixElementInteraction, 500); // Apply fix after loading
  return result;
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("Initializing UML Editor...");
    
    try {
        // Initialize core components
        core.init();
        
        // Initialize UI components
        ui.initToolbar();
        ui.initPropertiesPanel();
        ui.initTutorial();
        
        // Initialize misuse case manager
        misuseCaseManager.init();

        // Initialize history manager
        historyManager.init();

        // Initialize clipboard manager (copy/paste/duplicate)
        clipboardManager.init();

        // Initialize context menu (right-click menu)
        contextMenu.init();

        // Initialize styling manager (colors, fills, etc.)
        stylingManager.init();

        // Initialize performance optimizer
        performanceOptimizer.init();

        // Ensure misuse case manager is properly initialized
        // FIX: Added timeout to re-initialize misuse case manager after page load
        setTimeout(() => {
            misuseCaseManager.init();
            console.log("Re-initialized misuse case manager");
        }, 1000);
        
        // Initialize canvas event handlers with improved auto-scaling prevention
        // Note: setupCanvasEvents() includes connection update calls
        setupCanvasEvents();
        
        // Initialize zoom controls with the proper canvas reference - FIXED
        utils.zoom.init(core.canvas);
        console.log("Zoom controls initialized");

        // Initialize pan controls for canvas navigation
        utils.pan.init(core.canvas);
        console.log("Pan controls initialized");
        
        // Set up auto-save functionality
        utils.setupAutoSave();
        
        // Try to load previous diagram from session storage
        enhancedLoadDiagram(false);
        
        // Fix any selection issues with elements
        elements.fixElementSelection();
        
        // Window resize handler
        window.addEventListener('resize', () => {
            updateCanvasDimensions();
        });
        
        // Initial canvas size setup
        updateCanvasDimensions();
        
        // Add ESC key press to cancel connections
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && core.connectionStep === 'source-selected') {
                connections.cancelConnection();
            }
            
            // Double-press ESC for emergency dialog removal
            if (event.key === 'Escape') {
                if (!window.lastEscTime || Date.now() - window.lastEscTime < 500) {
                    console.log('Emergency dialog cleanup initiated');
                    forceRemoveAllDialogs();
                }
                window.lastEscTime = Date.now();
            }
        });
        
        // FIX: Add keyboard shortcut for deleting selected elements
        document.addEventListener('keydown', function(event) {
            // Check if Delete or Backspace key is pressed
            if ((event.key === 'Delete' || event.key === 'Backspace') && 
                !event.target.matches('input, textarea, select')) {
                
                // Prevent any default behavior (like browser back)
                event.preventDefault();
                
                // Get the currently selected element
                const element = window.umlEditor.core.selectedElement;
                
                if (element) {
                    console.log('Deleting element via keyboard shortcut');
                    
                    // Call the deleteSelectedElement function
                    if (typeof window.umlEditor.ui.deleteSelectedElement === 'function') {
                        window.umlEditor.ui.deleteSelectedElement();
                    } else {
                        // Fallback delete implementation
                        deleteSelectedElementFallback(element, window.umlEditor.canvas);
                    }
                }
            }
        });
        
        // Inject CSS styles for the improved dialog system
        injectDialogStyles();
        
        // Wait a bit to ensure everything is loaded, then apply fix and add button
        setTimeout(function() {
            fixElementInteraction();
            addFixButton();
        }, 1000);
        
        console.log("UML Editor initialized successfully");
    } catch (err) {
        console.error("Error initializing UML Editor:", err);
    }
});

// Fallback function for deleting elements if ui.js can't be imported
function deleteSelectedElementFallback(element, canvas) {
    if (!element || !canvas) return;
    
    try {
        // Handle connections
        if (element.connections && element.connections.length > 0) {
            // Create a copy of the connections array to avoid issues during removal
            const connections = [...element.connections];
            
            connections.forEach(conn => {
                // Remove connection label if it exists
                if (conn.label) {
                    canvas.remove(conn.label);
                }
                
                // Remove connection text (used by threatens relationship)
                if (conn.text) {
                    canvas.remove(conn.text);
                }
                
                // Remove arrowhead if it exists
                if (conn.arrowhead) {
                    canvas.remove(conn.arrowhead);
                }
                
                // Remove this connection from the other element's connections
                if (conn.source && conn.source !== element) {
                    conn.source.connections = conn.source.connections.filter(c => c !== conn);
                }
                if (conn.target && conn.target !== element) {
                    conn.target.connections = conn.target.connections.filter(c => c !== conn);
                }
                
                // Remove the connection from the canvas
                canvas.remove(conn);
            });
        }
        
        // Remove the element from the canvas
        canvas.remove(element);
        canvas.renderAll();
        
        // Show a success message
        const connectionHelp = document.getElementById('connection-help');
        if (connectionHelp) {
            connectionHelp.textContent = "Element deleted successfully!";
            connectionHelp.className = 'connection-help success active';
            setTimeout(() => {
                connectionHelp.classList.remove('active');
            }, 2000);
        }
    } catch (err) {
        console.error("Error in fallback delete:", err);
    }
}

// Setup canvas-specific event listeners with auto-scaling fix
function setupCanvasEvents() {
    console.log("Setting up canvas events...");
    
    // Handle canvas click for creating elements and connections
    core.canvas.on('mouse:down', function(options) {
        core.handleCanvasClick(options);
    });
    
    // IMPROVED: Handle object movement with auto-scaling prevention
    core.canvas.on('object:moving', function(e) {
        const o = e.target;
        if (!o) return;
        
        // FIXED: Store original scale before any transformations
        if (!o._originalScale) {
            o._originalScale = {
                scaleX: o.scaleX,
                scaleY: o.scaleY
            };
            
            console.log("Stored original scale:", o._originalScale);
        }
        
        // Show alignment guides
        const threshold = 10;
        const zoom = core.canvas.getZoom();
        
        // Vertical center line
        if (Math.abs(o.left - core.canvas.width / 2) < threshold / zoom) {
            o.set({ left: core.canvas.width / 2 });
            utils.guidelines.show('vertical', core.canvas.width / 2);
        } else {
            utils.guidelines.hide('vertical');
        }
        
        // Horizontal center line
        if (Math.abs(o.top - core.canvas.height / 2) < threshold / zoom) {
            o.set({ top: core.canvas.height / 2 });
            utils.guidelines.show('horizontal', core.canvas.height / 2);
        } else {
            utils.guidelines.hide('horizontal');
        }
        
        // FIXED: Maintain original scale during movement
        if (o._originalScale) {
            if (o.scaleX !== o._originalScale.scaleX || o.scaleY !== o._originalScale.scaleY) {
                o.set({
                    scaleX: o._originalScale.scaleX,
                    scaleY: o._originalScale.scaleY
                });
                
                console.log("Restored original scale during movement");
                
                // Force canvas to retain the corrected scale
                core.canvas.renderAll();
            }
        }
        
        // Update connections if the object has any
        if (o.connections && o.connections.length > 0) {
            connections.updateElementConnections(o);
        }

        // Also update connections for elements connected to this one
        connections.updateConnectedElements(o);
    });

    // NEW: Clean up _originalScale after movement is completed
    core.canvas.on('object:modified', function(e) {
        const obj = e.target;
        if (obj && obj._originalScale) {
            // We keep the _originalScale property for future operations
            // but update it to match the current (potentially modified) scale
            obj._originalScale = {
                scaleX: obj.scaleX,
                scaleY: obj.scaleY
            };

            console.log("Updated _originalScale after modification:", obj._originalScale);
        }

        // Always update connections after modification
        if (obj && obj.connections && obj.connections.length > 0) {
            connections.updateElementConnections(obj);
        }

        // Also update connections for elements connected to this one
        connections.updateConnectedElements(obj);
    });
    
    // Handle object hover for connection highlighting
    core.canvas.on('mouse:over', function(options) {
        // Update cursor based on hover state
        if (core.currentTool === 'select' && options.target) {
            document.querySelector('.canvas-container').setAttribute('data-hovering', 'true');

            // Highlight connections on hover for easier selection
            if (options.target.elementType && [
                core.ELEMENT_TYPES.ASSOCIATION,
                core.ELEMENT_TYPES.INCLUDE,
                core.ELEMENT_TYPES.EXTEND,
                core.ELEMENT_TYPES.GENERALIZATION,
                core.ELEMENT_TYPES.THREATENS
            ].includes(options.target.elementType)) {
                // Store original stroke width if not already stored
                if (!options.target._originalStrokeWidth) {
                    options.target._originalStrokeWidth = options.target.strokeWidth;
                }

                // Increase stroke width on hover for better visibility
                options.target.set({
                    strokeWidth: options.target._originalStrokeWidth + 2,
                    opacity: 0.8
                });
                core.canvas.renderAll();
            }
        }

        if (core.connectionStep === 'source-selected' && options.target && options.target !== core.connectingElement) {
            const isValidTarget = connections.validateConnectionTarget(core.currentTool, core.connectingElement, options.target);

            if (isValidTarget) {
                options.target.set({
                    stroke: '#28a745',
                    strokeWidth: 3
                });
            } else {
                options.target.set({
                    stroke: '#dc3545',
                    strokeWidth: 3
                });
            }
            core.canvas.renderAll();
        }
    });
    
    // Handle object hover out for connection highlighting
    core.canvas.on('mouse:out', function(options) {
        // Reset cursor
        document.querySelector('.canvas-container').setAttribute('data-hovering', 'false');

        // Reset connection appearance on hover out
        if (options.target && options.target.elementType && [
            core.ELEMENT_TYPES.ASSOCIATION,
            core.ELEMENT_TYPES.INCLUDE,
            core.ELEMENT_TYPES.EXTEND,
            core.ELEMENT_TYPES.GENERALIZATION,
            core.ELEMENT_TYPES.THREATENS
        ].includes(options.target.elementType)) {
            if (options.target._originalStrokeWidth) {
                options.target.set({
                    strokeWidth: options.target._originalStrokeWidth,
                    opacity: 1
                });
                core.canvas.renderAll();
            }
        }

        if (core.connectionStep === 'source-selected' && options.target && options.target !== core.connectingElement) {
            core.resetElementAppearance(options.target);
            core.canvas.renderAll();
        }
    });
    
    // Handle object scaling - update connections
    core.canvas.on('object:scaling', function(e) {
        const obj = e.target;
        if (obj && obj.connections && obj.connections.length > 0) {
            connections.updateElementConnections(obj);
        }
        connections.updateConnectedElements(obj);
    });

    // Handle object rotating - update connections
    core.canvas.on('object:rotating', function(e) {
        const obj = e.target;
        if (obj && obj.connections && obj.connections.length > 0) {
            connections.updateElementConnections(obj);
        }
        connections.updateConnectedElements(obj);
    });

    // Clean up guidelines after moving
    core.canvas.on('mouse:up', function() {
        utils.guidelines.hide('all');
    });
    
    // Handle selection events
    core.canvas.on('selection:created', function(options) {
        ui.updatePropertiesPanel(options.selected[0]);
        // Update misuse case sidebar with the selected element
        misuseCaseManager.updateSelectedUseCaseInfo(options.selected[0]);
        
        // Add selected class for better styling
        if (options.selected && options.selected.length > 0) {
            options.selected.forEach(obj => {
                obj.set('data-selected', 'true');
            });
        }
        
        // Update global selected element reference
        window.umlEditor.selectedElement = options.selected[0];
    });
    
    core.canvas.on('selection:updated', function(options) {
        ui.updatePropertiesPanel(options.selected[0]);
        // Update misuse case sidebar with the selected element
        misuseCaseManager.updateSelectedUseCaseInfo(options.selected[0]);
        
        // Update global selected element reference
        window.umlEditor.selectedElement = options.selected[0];
    });
    
    core.canvas.on('selection:cleared', function() {
        ui.clearPropertiesPanel();
        // Update misuse case sidebar with no selection
        misuseCaseManager.updateSelectedUseCaseInfo(null);
        
        // Remove selected class
        core.canvas.getObjects().forEach(obj => {
            obj.set('data-selected', 'false');
        });
        
        // Clear global selected element reference
        window.umlEditor.selectedElement = null;
    });
    
    // After object modifications, update auto-sizing and connections
    core.canvas.on('object:modified', function(options) {
        const obj = options.target;
        if (!obj) return;
        
        // Auto-resize elements based on text content if needed
        if (obj.elementType && [
            core.ELEMENT_TYPES.USECASE, 
            core.ELEMENT_TYPES.MISUSE_CASE,
            core.ELEMENT_TYPES.SYSTEM
        ].includes(obj.elementType)) {
            fontManager.autoSizeElementBasedOnText(obj);
        }
        
        // Update connection line endpoints
        if (obj.connections && obj.connections.length > 0) {
            connections.updateElementConnections(obj);
        }
        
        // Auto-save diagram
        utils.autoSaveDiagram();
    });
    
    // After text changes, update auto-sizing
    core.canvas.on('text:changed', function(options) {
        const obj = options.target;
        if (!obj) return;
        
        // If this is a connection label, store the text
        if (obj.isConnectionLabel && obj.connection) {
            obj.connection.labelText = obj.text;
        }
        
        // For main elements, trigger auto-sizing
        if (obj.parent && obj.parent.elementType) {
            fontManager.autoSizeElementBasedOnText(obj.parent);
        }
        
        // Auto-save diagram
        utils.autoSaveDiagram();
    });
    
    // Auto-save on object additions and removals
    core.canvas.on('object:added', function() {
        utils.autoSaveDiagram();
    });
    
    core.canvas.on('object:removed', function() {
        utils.autoSaveDiagram();
    });
    
    console.log("Canvas events setup complete");
}

// Function to update canvas dimensions considering panels
function updateCanvasDimensions() {
    const propertiesPanelWidth = 280;
    const misusePanelWidth = document.body.classList.contains('misuse-panel-active') ? 300 : 0;
    const totalPanelWidth = propertiesPanelWidth + misusePanelWidth;
    
    const canvasWidth = window.innerWidth - totalPanelWidth;
    const canvasHeight = window.innerHeight - 110;
    
    core.canvas.setWidth(canvasWidth);
    core.canvas.setHeight(canvasHeight);
    core.canvas.setDimensions({
        width: canvasWidth, 
        height: canvasHeight
    }, {
        cssOnly: true
    });
    core.canvas.renderAll();
    
    console.log(`Canvas dimensions updated: ${canvasWidth}x${canvasHeight}`);
}

// Function to force remove all dialogs - Emergency cleanup
function forceRemoveAllDialogs() {
    try {
        // Find all dialog elements
        document.querySelectorAll('.dialog-backdrop, .simple-dialog-backdrop, .dialog, .simple-dialog, .simple-loading-overlay').forEach(el => {
            try {
                if (document.body.contains(el)) {
                    document.body.removeChild(el);
                }
            } catch (err) {
                console.error('Error removing dialog element:', err);
            }
        });
        
        console.log('All dialogs forcibly removed');
    } catch (err) {
        console.error('Error in emergency cleanup:', err);
    }
}

// Inject CSS styles for the improved dialog system
function injectDialogStyles() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
    /* Simple dialog styles */
    .simple-loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .simple-loading-box {
        background-color: white;
        padding: 20px;
        border-radius: 8px;
        text-align: center;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    }
    
    .simple-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #3498db;
        border-radius: 50%;
        margin: 0 auto 15px auto;
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .simple-dialog-backdrop {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .simple-dialog {
        background-color: white;
        width: 90%;
        max-width: 700px;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }
    
    .simple-dialog-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        background-color: #4a6fff;
        color: white;
    }
    
    .simple-dialog-header h3 {
        margin: 0;
        font-size: 1.2rem;
    }
    
    .simple-dialog-header h3 i {
        margin-right: 8px;
    }
    
    .simple-dialog-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    }
    
    .simple-dialog-content {
        padding: 20px;
        overflow-y: auto;
        max-height: calc(90vh - 130px);
    }
    
    .simple-dialog-actions {
        padding: 15px 20px;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        border-top: 1px solid #dee2e6;
        background-color: #f8f9fa;
    }
    
    .simple-btn {
        padding: 8px 16px;
        border-radius: 4px;
        border: none;
        font-size: 0.9rem;
        cursor: pointer;
    }
    
    .simple-btn-primary {
        background-color: #4a6fff;
        color: white;
    }
    
    .simple-btn-secondary {
        background-color: #6c757d;
        color: white;
    }
    
    .simple-misuse-options {
        margin-top: 15px;
        max-height: 50vh;
        overflow-y: auto;
    }
    
    .simple-misuse-option {
        margin-bottom: 10px;
        padding: 15px;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
    }
    
    .simple-misuse-option:hover {
        background-color: #f8f9fa;
    }
    
    .simple-misuse-option.selected {
        background-color: #ffebee;
        border-color: #dc3545;
    }
    
    .simple-misuse-option h5 {
        margin-top: 0;
        color: #dc3545;
    }
    
    .simple-misuse-option p {
        margin: 5px 0;
    }
    
    /* Style for when hovering over selectable objects */
    .canvas-container[data-hovering="true"] {
        cursor: pointer;
    }

    /* Enhance active selection style */
    .canvas-container .object-selected {
        cursor: move !important;
    }
    `;
    document.head.appendChild(styleEl);
    
    console.log("Dialog styles injected");
}

// Function to fix element interaction issues
function fixElementInteraction() {
  console.log("Applying element interaction fix...");
  
  try {
      // 1. Clear session storage to start fresh
      // sessionStorage.removeItem('uml_diagram_session'); // Commented out to prevent losing work
      
      // 2. Ensure the tool is set to 'select' initially
      core.setTool('select');
      
      // 3. Re-initialize canvas events
      core.canvas.off('mouse:down');
      core.canvas.on('mouse:down', function(options) {
        core.handleCanvasClick(options);
      });
      
      // 4. Reset element selection for all elements
      elements.fixElementSelection();
      
      // 5. Reset canvas state
      core.canvas.isDrawingMode = false;
      core.canvas.selection = true;
      core.canvas.defaultCursor = 'default';
      
      // 6. Fix any object selection issues
      core.canvas.forEachObject(function(obj) {
        if (obj.elementType) {
          obj.selectable = true;
          obj.evented = true;
          
          // Store original scale if not already stored
          if (!obj._originalScale) {
            obj._originalScale = {
              scaleX: obj.scaleX,
              scaleY: obj.scaleY
            };
          }
          
          // Make sure all objects in groups are properly configured
          if (obj.type === 'group' && obj._objects) {
            obj._objects.forEach(subObj => {
              subObj.evented = true;
            });
          }
        }
      });
      
      // 7. Set proper CSS cursor
      document.querySelector('.canvas-container').style.cursor = 'default';

      // 8. Connection handlers are set up in setupCanvasEvents() - no need to call again

      // 9. Ensure Misuse Case button is properly initialized
      const generateMisuseBtnEl = document.getElementById('generate-misuse-btn');
      if (generateMisuseBtnEl) {
        // Make sure the button is not disabled by default
        generateMisuseBtnEl.disabled = false;
        
        // FIXED: Don't use dynamic import here, use direct event handler
        console.log("Adding direct click handler to Generate Misuse button");
        
        // Remove existing handler first (if any)
        if (generateMisuseBtnEl.onclick) {
            generateMisuseBtnEl.onclick = null;
        }
        
        // Add a direct onclick handler
        generateMisuseBtnEl.onclick = function(e) {
            console.log("Generate misuse button clicked directly");
            
            // Prevent the default action
            e.preventDefault();
            
            // Call the misuse case generator function from global scope if available
            if (window.misuseCaseManager && window.misuseCaseManager.generateMisuseCases) {
                window.misuseCaseManager.generateMisuseCases();
            } else {
                // Direct DOM-based approach without importing the module
                const analysisTargetEl = document.getElementById('analysis-target');
                const selectedUseCaseInfo = document.getElementById('selected-usecase-info');
                const misuseCaseList = document.getElementById('misuse-case-list');
                const generationStatus = document.getElementById('generation-status');
                
                // Display loading status
                if (generationStatus) {
                    generationStatus.className = 'status-indicator loading';
                    generationStatus.innerHTML = '<div class="spinner"></div> Generating misuse cases...';
                }
                
                // Get analysis target
                const analysisTarget = analysisTargetEl ? analysisTargetEl.value : 'selected';
                
                // Get the use case information
                let useCaseName = "Unknown Use Case";
                
                // Extract information from the selected use case display
                if (selectedUseCaseInfo && selectedUseCaseInfo.textContent) {
                    if (selectedUseCaseInfo.textContent.includes(':')) {
                        // Try to extract the use case name
                        const match = selectedUseCaseInfo.textContent.match(/Selected Use Case:\s*(.+)/);
                        if (match && match[1]) {
                            useCaseName = match[1].trim();
                        }
                    }
                }
                
                // Get system name
                let systemName = "the system";
                
                // Make API call to generate misuse cases
                fetch('/generate_misuse_cases', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        useCaseName: useCaseName,
                        systemName: systemName,
                        otherUseCases: []
                    }),
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Update status
                        if (generationStatus) {
                            generationStatus.className = 'status-indicator success';
                            generationStatus.innerHTML = 
                                `<i class="fas fa-check-circle"></i> Generated ${data.data.length} misuse cases successfully!`;
                        }
                        
                        // Display results in the list
                        if (misuseCaseList) {
                            let html = '';
                            
                            data.data.forEach((misuseCase, index) => {
                                html += `
                                    <div class="misuse-case-item" data-index="${index}">
                                        <h5><i class="fas fa-exclamation-circle"></i> ${misuseCase.name}</h5>
                                        <p><strong>Actor:</strong> ${misuseCase.actor}</p>
                                        <p><strong>Description:</strong> ${misuseCase.description}</p>
                                        <p><strong>Impact:</strong> ${misuseCase.impact}</p>
                                    </div>
                                `;
                            });
                            
                            misuseCaseList.innerHTML = html;
                            
                            // Enable the clear button
                            const clearButton = document.getElementById('clear-misuse-cases');
                            if (clearButton) clearButton.disabled = false;
                            
                            // Add click handlers to the misuse case items
                            document.querySelectorAll('.misuse-case-item').forEach(item => {
                                item.addEventListener('click', function() {
                                    this.classList.toggle('selected');
                                    
                                    // Update add selected button state
                                    const selectedItems = document.querySelectorAll('.misuse-case-item.selected');
                                    const addButton = document.getElementById('add-selected-misuse');
                                    if (addButton) {
                                        addButton.disabled = selectedItems.length === 0;
                                    }
                                });
                            });
                        }
                    } else {
                        // Show error
                        if (generationStatus) {
                            generationStatus.className = 'status-indicator error';
                            generationStatus.innerHTML = 
                                `<i class="fas fa-exclamation-circle"></i> Error: ${data.message}`;
                        }
                        console.error('Error generating misuse cases:', data);
                    }
                })
                .catch(error => {
                    // Show error
                    if (generationStatus) {
                        generationStatus.className = 'status-indicator error';
                        generationStatus.innerHTML = 
                            `<i class="fas fa-exclamation-circle"></i> Error: ${error.message}`;
                    }
                    console.error('Error generating misuse cases:', error);
                });
            }
            
            // Return false to prevent default action
            return false;
        };
        
        console.log("Direct handler for Generate Misuse button attached");
      }
      
      console.log("Element interaction fix applied");
      core.canvas.renderAll();
  } catch (error) {
      console.error("Error applying element interaction fix:", error);
  }
}

// Function to add a fix button to the interface
function addFixButton() {
    // Check if button already exists
    if (document.getElementById('fix-interaction-btn')) {
      return;
    }
    
    try {
        // Create the fix button
        const fixButton = document.createElement('button');
        fixButton.id = 'fix-interaction-btn';
        fixButton.className = 'btn btn-warning';
        fixButton.innerHTML = '<i class="fas fa-wrench"></i> Fix Interaction';
        
        // Add click event listener to fix interaction issues
        fixButton.addEventListener('click', function() {
          fixElementInteraction();
          
          // Show confirmation message
          ui.showConnectionHelp(true, "Interaction fixed! You should be able to click elements now.", "success");
          setTimeout(() => ui.showConnectionHelp(false), 3000);
        });
        
        // Find the header button group to add the button to
        const headerButtonGroup = document.querySelector('.header div');
        
        if (headerButtonGroup) {
          // Insert the fix button before the first button in the group
          const firstButton = headerButtonGroup.querySelector('button');
          if (firstButton) {
            headerButtonGroup.insertBefore(fixButton, firstButton);
          } else {
            // If no buttons found, just append it
            headerButtonGroup.appendChild(fixButton);
          }
        } else {
          console.warn("Header button group not found, adding button to body as fallback");
          // Fallback to adding as floating button if header not found
          fixButton.style.position = 'fixed';
          fixButton.style.top = '70px';
          fixButton.style.right = '20px';
          fixButton.style.zIndex = '1000';
          document.body.appendChild(fixButton);
        }
        
        console.log("Fix interaction button added to top bar");
    } catch (error) {
        console.error("Error adding fix button:", error);
    }
}

// Update the load button event handler to use the enhanced loader
document.getElementById('load-btn')?.addEventListener('click', function() {
  enhancedLoadDiagram(true);
});

// FIX: Directly add event listener to misuse case button if it exists
document.addEventListener('DOMContentLoaded', function() {
    const generateMisuseBtnEl = document.getElementById('generate-misuse-btn');
    if (generateMisuseBtnEl) {
        console.log("Adding direct click handler to Generate Misuse button");
        generateMisuseBtnEl.onclick = function() {
            console.log("Generate misuse button clicked via direct handler");
            import('./misuseCaseManager.js').then(manager => {
                if (typeof manager.generateMisuseCases === 'function') {
                    manager.generateMisuseCases();
                }
            }).catch(err => {
                console.error("Error importing misuseCaseManager for direct click:", err);
            });
            return false;
        };
    }
});

// FIX: Enhance connection data structure - Add unique IDs to elements and connections
// This function can be called to ensure all elements have proper IDs and references
function ensureProperDataStructure() {
    core.canvas.getObjects().forEach(obj => {
        // Ensure every object has an ID
        if (!obj.id) {
            obj.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        }
        
        // If it's a connection, ensure it has sourceId and targetId
        if (obj.elementType && [
            core.ELEMENT_TYPES.ASSOCIATION,
            core.ELEMENT_TYPES.INCLUDE,
            core.ELEMENT_TYPES.EXTEND,
            core.ELEMENT_TYPES.GENERALIZATION,
            core.ELEMENT_TYPES.THREATENS
        ].includes(obj.elementType)) {
            
            if (obj.source && typeof obj.source === 'object' && !obj.sourceId) {
                if (!obj.source.id) {
                    obj.source.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                obj.sourceId = obj.source.id;
            }
            
            if (obj.target && typeof obj.target === 'object' && !obj.targetId) {
                if (!obj.target.id) {
                    obj.target.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                obj.targetId = obj.target.id;
            }
        }
        
        // For elements, ensure connections array has connectionIds
        if (obj.connections && Array.isArray(obj.connections) && !obj.connectionIds) {
            obj.connectionIds = obj.connections.map(conn => {
                if (!conn.id) {
                    conn.id = 'conn_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
                }
                return conn.id;
            });
        }
    });
    
    console.log("Enhanced data structure applied to all canvas objects");
}

// Export functions that might be needed by other modules
export {
    updateCanvasDimensions,
    forceRemoveAllDialogs,
    fixElementInteraction,
    enhancedLoadDiagram,
    ensureProperDataStructure // New exported function
}