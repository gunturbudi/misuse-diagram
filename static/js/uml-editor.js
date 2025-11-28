// Initialize the canvas with Fabric.js with improved rendering
const canvas = new fabric.Canvas('diagram-canvas', {
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

// Define UML element types
const ELEMENT_TYPES = {
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

// Store the current tool and selected element
let currentTool = 'select';
let selectedElement = null;
let connectingElement = null;
let connectionStep = 'none'; // 'none', 'source-selected', 'completed'
let connectionHelpElement = document.getElementById('connection-help');

// Helper functions for guidelines
const guidelines = {
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

// Initialize the tools
document.getElementById('select-tool').addEventListener('click', () => setTool('select'));
document.getElementById('actor-tool').addEventListener('click', () => setTool('actor'));
document.getElementById('usecase-tool').addEventListener('click', () => setTool('usecase'));
document.getElementById('system-tool').addEventListener('click', () => setTool('system'));
document.getElementById('association-tool').addEventListener('click', () => setTool('association'));
document.getElementById('include-tool').addEventListener('click', () => setTool('include'));
document.getElementById('extend-tool').addEventListener('click', () => setTool('extend'));
document.getElementById('generalization-tool').addEventListener('click', () => setTool('generalization'));
document.getElementById('misuser-tool').addEventListener('click', () => setTool('misuser'));
document.getElementById('misusecase-tool').addEventListener('click', () => setTool('misusecase'));
document.getElementById('threatens-tool').addEventListener('click', () => setTool('threatens'));

// Save, load, and clear buttons
document.getElementById('save-btn').addEventListener('click', saveDiagram);
document.getElementById('load-btn').addEventListener('click', loadDiagram);
document.getElementById('clear-btn').addEventListener('click', clearDiagram);

// Property panel buttons
document.getElementById('apply-properties').addEventListener('click', applyProperties);
document.getElementById('delete-element').addEventListener('click', deleteSelectedElement);
document.getElementById('generate-misuse-cases').addEventListener('click', generateMisuseCases);

// Window resize handler
window.addEventListener('resize', () => {
    canvas.setWidth(window.innerWidth - 280);
    canvas.setHeight(window.innerHeight - 110);
    canvas.setDimensions({
        width: window.innerWidth - 280, 
        height: window.innerHeight - 110
    }, {
        cssOnly: true
    });
    canvas.renderAll();
});

// Set up tutorial panel event listeners
document.addEventListener('DOMContentLoaded', function() {
    const tutorialPanel = document.getElementById('tutorial-panel');
    const showTutorialBtn = document.getElementById('show-tutorial');
    const closeTutorialBtn = document.getElementById('close-tutorial');
    
    // Show tutorial button click handler
    if (showTutorialBtn) {
        showTutorialBtn.addEventListener('click', function() {
            tutorialPanel.style.display = 'flex';
        });
    }
    
    // Close tutorial button click handler
    if (closeTutorialBtn) {
        closeTutorialBtn.addEventListener('click', function() {
            tutorialPanel.style.display = 'none';
        });
    }
    
    // Show tutorial on page load
    if (tutorialPanel) {
        tutorialPanel.style.display = 'flex';
    }
});

// Add ESC key press to cancel connections
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && connectionStep === 'source-selected') {
        cancelConnection();
    }
});

// Function to show connection help messages
function showConnectionHelp(show, message = '', type = 'info') {
    if (!connectionHelpElement) {
        connectionHelpElement = document.getElementById('connection-help');
    }
    
    if (show) {
        connectionHelpElement.textContent = message;
        connectionHelpElement.className = 'connection-help';
        
        // Add the appropriate class based on message type
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

// Function to cancel the current connection operation
function cancelConnection() {
    // Reset the connection state
    if (connectingElement) {
        // Remove highlighting if it was applied
        resetElementAppearance(connectingElement);
        canvas.renderAll();
    }
    
    connectionStep = 'none';
    connectingElement = null;
    
    // Display message
    showConnectionHelp(true, "Connection canceled", "error");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Reset an element's appearance
function resetElementAppearance(element) {
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
}

// Set the active tool
function setTool(tool) {
    // Deactivate all tool buttons
    document.querySelectorAll('.tool').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Activate the selected tool button
    document.getElementById(`${tool}-tool`).classList.add('active');
    
    // Cancel any current connection
    if (connectionStep === 'source-selected') {
        cancelConnection();
    }
    
    currentTool = tool;
    
    // Set cursor based on the tool
    if (tool === 'select') {
        canvas.defaultCursor = 'default';
        showConnectionHelp(false);
    } else if (tool === 'association' || tool === 'include' || 
               tool === 'extend' || tool === 'generalization' || 
               tool === 'threatens') {
        canvas.defaultCursor = 'pointer';
        showConnectionInstructions(tool);
    } else {
        canvas.defaultCursor = 'crosshair';
        showConnectionHelp(false);
    }
}

// Function to show connection instructions
function showConnectionInstructions(connectionType) {
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
    }
    
    // Show the help message
    showConnectionHelp(true, message);
}

// IMPROVED VERSION - Generate misuse cases with robust error handling
function generateMisuseCases() {
    if (!selectedElement || selectedElement.elementType !== ELEMENT_TYPES.USECASE) {
        showConnectionHelp(true, "Please select a use case first", "error");
        setTimeout(() => showConnectionHelp(false), 2000);
        return;
    }
    
    // Get the use case name
    const useCaseName = selectedElement.name;
    
    // Find the system container if any
    let systemName = "the system";
    canvas.getObjects().forEach(obj => {
        if (obj.elementType === ELEMENT_TYPES.SYSTEM) {
            // Check if the use case is inside the system boundary
            const useCaseCenter = selectedElement.getCenterPoint();
            const systemLeft = obj.left - obj.width/2;
            const systemRight = obj.left + obj.width/2;
            const systemTop = obj.top - obj.height/2;
            const systemBottom = obj.top + obj.height/2;
            
            if (useCaseCenter.x >= systemLeft && 
                useCaseCenter.x <= systemRight && 
                useCaseCenter.y >= systemTop && 
                useCaseCenter.y <= systemBottom) {
                systemName = obj.name;
            }
        }
    });
    
    // Get all other use cases in the diagram
    const otherUseCases = [];
    canvas.getObjects().forEach(obj => {
        if (obj.elementType === ELEMENT_TYPES.USECASE && obj !== selectedElement) {
            otherUseCases.push(obj.name);
        }
    });
    
    // Update status
    const statusElement = document.getElementById('misuse-generation-status');
    statusElement.className = 'status-loading';
    statusElement.innerHTML = 'Generating misuse cases...';
    
    // Create a simple loading overlay
    const loadingOverlay = document.createElement('div');
    loadingOverlay.className = 'simple-loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="simple-loading-box">
            <div class="simple-spinner"></div>
            <p>Generating misuse cases...</p>
        </div>
    `;
    document.body.appendChild(loadingOverlay);
    
    // Safety timeout - force remove loading overlay after 30 seconds
    const safetyTimeout = setTimeout(() => {
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
            statusElement.className = 'status-error';
            statusElement.innerHTML = 'Request timed out. Please try again.';
        }
    }, 30000);
    
    // Call the server to generate misuse cases
    fetch('/generate_misuse_cases', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            useCaseName: useCaseName,
            systemName: systemName,
            otherUseCases: otherUseCases
        }),
    })
    .then(response => response.json())
    .then(data => {
        // Clear safety timeout
        clearTimeout(safetyTimeout);
        
        // Always remove the loading overlay first
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }
        
        if (data.status === 'success') {
            statusElement.className = 'status-success';
            statusElement.innerHTML = 'Misuse cases generated successfully!';
            showSimpleMisuseCaseOptions(data.data, selectedElement);
        } else {
            statusElement.className = 'status-error';
            statusElement.innerHTML = `Error: ${data.message}`;
            console.error('Error:', data);
        }
    })
    .catch((error) => {
        // Clear safety timeout
        clearTimeout(safetyTimeout);
        
        // Always remove the loading overlay first
        if (document.body.contains(loadingOverlay)) {
            document.body.removeChild(loadingOverlay);
        }
        
        statusElement.className = 'status-error';
        statusElement.innerHTML = 'Error communicating with server';
        console.error('Error:', error);
    });
}

// Simplified approach to display misuse case options
function showSimpleMisuseCaseOptions(misuseCases, targetUseCase) {
    // Create dialog backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'simple-dialog-backdrop';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'simple-dialog';
    dialog.innerHTML = `
        <div class="simple-dialog-header">
            <h3><i class="fas fa-exclamation-triangle"></i> Generated Misuse Cases</h3>
            <button class="simple-dialog-close">&times;</button>
        </div>
        <div class="simple-dialog-content">
            <p>The following misuse cases were generated for <strong>${targetUseCase.name}</strong>. 
            Select the ones you want to add to your diagram:</p>
            <div class="simple-misuse-options"></div>
        </div>
        <div class="simple-dialog-actions">
            <button class="simple-btn simple-btn-secondary simple-dialog-cancel">Cancel</button>
            <button class="simple-btn simple-btn-primary simple-dialog-add">
                <i class="fas fa-plus"></i> Add Selected
            </button>
        </div>
    `;
    
    // Add misuse case options
    const optionsContainer = dialog.querySelector('.simple-misuse-options');
    const selectedMisuseCases = [];
    
    misuseCases.forEach((misuseCase, index) => {
        const option = document.createElement('div');
        option.className = 'simple-misuse-option';
        option.innerHTML = `
            <h5><i class="fas fa-exclamation-circle"></i> ${misuseCase.name}</h5>
            <p><strong><i class="fas fa-user-ninja"></i> Actor:</strong> ${misuseCase.actor}</p>
            <p><strong><i class="fas fa-info-circle"></i> Description:</strong> ${misuseCase.description}</p>
            <p><strong><i class="fas fa-exclamation-triangle"></i> Impact:</strong> ${misuseCase.impact}</p>
        `;
        
        // Add click handler
        option.addEventListener('click', function() {
            this.classList.toggle('selected');
            if (this.classList.contains('selected')) {
                selectedMisuseCases.push(misuseCase);
            } else {
                const index = selectedMisuseCases.indexOf(misuseCase);
                if (index > -1) {
                    selectedMisuseCases.splice(index, 1);
                }
            }
        });
        
        optionsContainer.appendChild(option);
    });
    
    // Safety timeout - force remove dialog after 5 minutes
    const safetyTimeout = setTimeout(() => {
        if (document.body.contains(backdrop)) {
            document.body.removeChild(backdrop);
        }
        if (document.body.contains(dialog)) {
            document.body.removeChild(dialog);
        }
    }, 300000); // 5 minutes
    
    // Function to close dialog
    function closeDialog() {
        try {
            clearTimeout(safetyTimeout);
            if (document.body.contains(backdrop)) {
                document.body.removeChild(backdrop);
            }
            if (document.body.contains(dialog)) {
                document.body.removeChild(dialog);
            }
        } catch(err) {
            console.error('Error closing dialog:', err);
            forceRemoveAllDialogs();
        }
    }
    
    // Close button handler
    dialog.querySelector('.simple-dialog-close').addEventListener('click', closeDialog);
    
    // Cancel button handler
    dialog.querySelector('.simple-dialog-cancel').addEventListener('click', closeDialog);
    
    // Add button handler
    dialog.querySelector('.simple-dialog-add').addEventListener('click', function() {
        if (selectedMisuseCases.length === 0) {
            alert('Please select at least one misuse case or click Cancel.');
            return;
        }
        
        try {
            addMisuseCasesToDiagram(selectedMisuseCases, targetUseCase);
            closeDialog();
            
            // Show success message
            showConnectionHelp(true, `Added ${selectedMisuseCases.length} misuse case(s) successfully!`, "success");
            setTimeout(() => showConnectionHelp(false), 3000);
        } catch(err) {
            console.error('Error adding misuse cases:', err);
            closeDialog();
        }
    });
    
    // Add backdrop to DOM
    document.body.appendChild(backdrop);
    
    // Add dialog to DOM
    document.body.appendChild(dialog);
    
    // Also close if backdrop is clicked
    backdrop.addEventListener('click', function(e) {
        if (e.target === backdrop) {
            closeDialog();
        }
    });
}

// Improved addMisuseCasesToDiagram function for uml-editor.js or misuseCaseManager.js

function addMisuseCasesToDiagram(selectedMisuseCases, targetUseCase) {
    try {
        // Get the center point of the target use case
        const targetCenter = targetUseCase.getCenterPoint();
        
        // Find a suitable position to place the misuser
        const misusers = {};
        let misuserOffsetX = 200;
        let misuserOffsetY = -100;
        
        selectedMisuseCases.forEach((misuseCase, index) => {
            // Calculate position for the misuse case 
            // (position in a semi-circle around the target use case)
            const angle = (Math.PI / (selectedMisuseCases.length + 1)) * (index + 1);
            const distance = 200; // Distance from target use case
            const offsetX = distance * Math.cos(angle);
            const offsetY = distance * Math.sin(angle);
            
            // Create the misuse case
            const newMisuseCase = createMisuseCase(
                targetCenter.x + offsetX, 
                targetCenter.y + offsetY, 
                misuseCase.name
            );
            canvas.add(newMisuseCase);
            
            // Create the threatens relationship
            const threatens = connections.createThreatens(newMisuseCase, targetUseCase);
            canvas.add(threatens);
            
            // Make sure to render after creating the connection
            canvas.renderAll();
            
            // Check if we need a new misuser for this actor type
            if (!misusers[misuseCase.actor]) {
                // Create new misuser
                const newMisuser = createMisuser(
                    targetCenter.x + misuserOffsetX, 
                    targetCenter.y + misuserOffsetY, 
                    misuseCase.actor
                );
                canvas.add(newMisuser);
                misusers[misuseCase.actor] = newMisuser;
                
                // Adjust offset for next misuser
                misuserOffsetX += 50;
                misuserOffsetY -= 50;
            }
            
            // Create association between misuser and misuse case
            const association = connections.createAssociation(misusers[misuseCase.actor], newMisuseCase);
            canvas.add(association);
            
            // Make sure to render after creating each set of elements
            canvas.renderAll();
            
            // Ensure connections are properly initialized
            connections.updateElementConnections(newMisuseCase);
            connections.updateElementConnections(misusers[misuseCase.actor]);
            connections.updateElementConnections(targetUseCase);
        });
        
        // Final render to ensure everything is displayed correctly
        canvas.renderAll();
    } catch (error) {
        console.error('Error adding misuse cases to diagram:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
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

// Update properties panel based on selected element
function updatePropertiesPanel(element) {
    if (!element) return;
    
    selectedElement = element;
    
    // Show properties for all element types
    if (element.elementType === ELEMENT_TYPES.ACTOR || 
        element.elementType === ELEMENT_TYPES.USECASE || 
        element.elementType === ELEMENT_TYPES.SYSTEM ||
        element.elementType === ELEMENT_TYPES.MISUSE_CASE ||
        element.elementType === ELEMENT_TYPES.MISUSER) {
        
        document.getElementById('element-name').value = element.name || '';
        document.getElementById('properties-panel').style.display = 'flex';
        
        // Show misuse case generation controls only for use cases
        const misuseControls = document.getElementById('misuse-case-controls');
        if (element.elementType === ELEMENT_TYPES.USECASE) {
            misuseControls.style.display = 'block';
        } else {
            misuseControls.style.display = 'none';
        }
    } else {
        clearPropertiesPanel();
    }
}

// Clear properties panel
function clearPropertiesPanel() {
    selectedElement = null;
    document.getElementById('element-name').value = '';
    document.getElementById('misuse-case-controls').style.display = 'none';
}

// Apply properties to selected element with improved text handling
function applyProperties() {
    if (!selectedElement) return;
    
    const name = document.getElementById('element-name').value;
    
    // Update the name property
    selectedElement.name = name;
    
    // Use the improved method to update text
    updateElementText(selectedElement, name);
    
    // Show confirmation
    showConnectionHelp(true, "Properties updated successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Delete selected element
function deleteSelectedElement() {
    if (!selectedElement) return;
    
    // If it has connections, remove them first
    if (selectedElement.connections && selectedElement.connections.length > 0) {
        // Create a copy of the connections array to avoid issues during removal
        const connections = [...selectedElement.connections];
        
        connections.forEach(conn => {
            // Remove this connection from the other element's connections
            if (conn.source && conn.source !== selectedElement) {
                conn.source.connections = conn.source.connections.filter(c => c !== conn);
            }
            if (conn.target && conn.target !== selectedElement) {
                conn.target.connections = conn.target.connections.filter(c => c !== conn);
            }
            
            // Remove the connection from the canvas
            canvas.remove(conn);
        });
    }
    
    // Remove the element
    canvas.remove(selectedElement);
    selectedElement = null;
    clearPropertiesPanel();
    canvas.renderAll();
    
    // Show confirmation
    showConnectionHelp(true, "Element deleted successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Save diagram to JSON
function saveDiagram() {
    const json = canvas.toJSON(['elementType', 'name', 'connections', 'source', 'target', 'class']);
    // For a real application, you would send this to the server
    // For now, just log it or allow download
    localStorage.setItem('umlDiagram', JSON.stringify(json));
    
    // Show confirmation
    showConnectionHelp(true, "Diagram saved successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Load diagram from JSON
function loadDiagram() {
    const savedDiagram = localStorage.getItem('umlDiagram');
    if (savedDiagram) {
        canvas.loadFromJSON(savedDiagram, () => {
            // Reconnect all objects with their connections, sources, and targets
            canvas.forEachObject(obj => {
                // Rebuild the connections array references
                if (obj.connections) {
                    const connectionIds = obj.connections.map(conn => {
                        return typeof conn === 'object' ? conn.id : conn;
                    });
                    
                    obj.connections = connectionIds.map(id => {
                        return canvas.getObjects().find(o => o.id === id);
                    }).filter(Boolean);
                }
                
                // Rebuild source and target references
                if (obj.source && typeof obj.source !== 'object') {
                    obj.source = canvas.getObjects().find(o => o.id === obj.source);
                }
                if (obj.target && typeof obj.target !== 'object') {
                    obj.target = canvas.getObjects().find(o => o.id === obj.target);
                }
                
                // Reattach custom scaling behavior for text elements
                if (obj.elementType && (
                    obj.elementType === ELEMENT_TYPES.ACTOR ||
                    obj.elementType === ELEMENT_TYPES.USECASE ||
                    obj.elementType === ELEMENT_TYPES.SYSTEM ||
                    obj.elementType === ELEMENT_TYPES.MISUSE_CASE ||
                    obj.elementType === ELEMENT_TYPES.MISUSER)) {
                    
                    // Remove any existing scaling handlers to avoid duplication
                    obj.off('scaling');
                    
                    // Add scaling behavior based on element type
                    obj.on('scaling', function() {
                        const scaleFactor = Math.min(obj.scaleX, obj.scaleY);
                        let textObj;
                        let baseFontSize;
                        
                        if (obj.elementType === ELEMENT_TYPES.ACTOR || 
                            obj.elementType === ELEMENT_TYPES.MISUSER) {
                            textObj = obj.getObjects()[5]; // Actor text is at index 5
                            baseFontSize = 16;
                        } else if (obj.elementType === ELEMENT_TYPES.USECASE || 
                                  obj.elementType === ELEMENT_TYPES.MISUSE_CASE) {
                            textObj = obj.getObjects()[1]; // Use case text is at index 1
                            baseFontSize = 14;
                        } else if (obj.elementType === ELEMENT_TYPES.SYSTEM) {
                            textObj = obj.getObjects()[2]; // System text is at index 2
                            baseFontSize = 16;
                        }
                        
                        if (textObj) {
                            const newFontSize = Math.max(10, Math.min(24, Math.floor(baseFontSize * scaleFactor)));
                            textObj.set({
                                fontSize: newFontSize
                            });
                            
                            // If it's a textbox, adjust width too
                            if (textObj.type === 'textbox' && 
                               (obj.elementType === ELEMENT_TYPES.USECASE || 
                                obj.elementType === ELEMENT_TYPES.MISUSE_CASE)) {
                                textObj.set({
                                    width: 60 * scaleFactor * 1.5 // 60 is the ellipse rx
                                });
                            }
                        }
                        
                        // Force rendering update
                        canvas.renderAll();
                    });
                }
            });
            
            canvas.renderAll();
            
            // Show confirmation
            showConnectionHelp(true, "Diagram loaded successfully!", "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        });
    } else {
        // Show error
        showConnectionHelp(true, "No saved diagram found!", "error");
        setTimeout(() => showConnectionHelp(false), 2000);
    }
}

// Clear the diagram
function clearDiagram() {
    if (confirm('Are you sure you want to clear the diagram?')) {
        canvas.clear();
        selectedElement = null;
        connectingElement = null;
        connectionStep = 'none';
        clearPropertiesPanel();
        
        // Show confirmation
        showConnectionHelp(true, "Diagram cleared successfully!", "success");
        setTimeout(() => showConnectionHelp(false), 2000);
    }
}

// Initialize the canvas size
canvas.setWidth(window.innerWidth - 280);
canvas.setHeight(window.innerHeight - 110);