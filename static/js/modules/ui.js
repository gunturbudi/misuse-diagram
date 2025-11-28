// ui.js - UI-related functionality with font customization
import { canvas, ELEMENT_TYPES, selectedElement, connectionHelpElement, setSelectedElement } from './core.js';
import { updateElementText, getElementFontSettings } from './elements.js';
import * as fontManager from './fontManager.js';
import stylingManager from './stylingManager.js';

// Initialize the properties panel
export function initPropertiesPanel() {
    // Set up property panel buttons
    document.getElementById('apply-properties').addEventListener('click', applyProperties);
    document.getElementById('delete-element').addEventListener('click', deleteSelectedElement);
    
    // Set up multiline text editor
    setupMultiLineTextEditor();
    
    // Set up font customization controls
    setupFontCustomizationControls();
    
    // Set up export button
    setupExportButton();
}


// Improved setupMultiLineTextEditor function for ui.js
// Use proper setters for selectedElement

function setupMultiLineTextEditor() {
    // Replace the single-line text input with a textarea
    const nameProperty = document.getElementById('name-property');
    if (!nameProperty) return;
    
    // Create the textarea element
    const textArea = document.createElement('textarea');
    textArea.id = 'element-text-editor';
    textArea.className = 'text-editor';
    textArea.rows = 4;
    textArea.placeholder = 'Enter element text...';
    
    // Replace the current input field
    nameProperty.innerHTML = '<label for="element-text-editor">Text:</label>';
    nameProperty.appendChild(textArea);
    
    // Reference to imported modules
    let coreModule = null;
    
    // Preload the core module for faster access
    import('./core.js').then(core => {
        coreModule = core;
    }).catch(err => {
        console.error('Error importing core module:', err);
    });
    
    // Setup editor events with auto-apply functionality
    textArea.addEventListener('input', function() {
        const currentElement = coreModule ? coreModule.selectedElement : selectedElement;
        
        if (!currentElement) return;
        
        // Update element name directly
        currentElement.name = this.value;
        
        // Update element text with line breaks
        updateElementText(currentElement, this.value);
        
        // Auto-save diagram when text changes
        if (window.utils && window.utils.autoSaveDiagram) {
            window.utils.autoSaveDiagram();
        }
    });
    
    // Keep the Apply button functionality for consistency
    // It will still be useful for applying font changes
}

// Setup font customization controls
function setupFontCustomizationControls() {
    // Initialize the font family dropdown
    const fontFamilySelect = document.getElementById('font-family');
    if (fontFamilySelect) {
        // Clear existing options
        fontFamilySelect.innerHTML = '';
        
        // Add options for each font family
        fontManager.FONT_FAMILIES.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font.split(',')[0]; // Show only the primary font name
            fontFamilySelect.appendChild(option);
        });
        
        // Listen for changes
        fontFamilySelect.addEventListener('change', function() {
            if (!selectedElement) return;
            fontManager.updateTextAppearance(selectedElement, {
                fontFamily: this.value
            });
        });
    }
    
    // Initialize the font weight dropdown
    const fontWeightSelect = document.getElementById('font-weight');
    if (fontWeightSelect) {
        // Clear existing options
        fontWeightSelect.innerHTML = '';
        
        // Add options for each font weight
        fontManager.FONT_WEIGHTS.forEach(weight => {
            const option = document.createElement('option');
            option.value = weight.value;
            option.textContent = weight.label;
            fontWeightSelect.appendChild(option);
        });
        
        // Listen for changes
        fontWeightSelect.addEventListener('change', function() {
            if (!selectedElement) return;
            fontManager.updateTextAppearance(selectedElement, {
                fontWeight: this.value
            });
        });
    }
    
    // Initialize the text alignment dropdown
    const textAlignSelect = document.getElementById('text-align');
    if (textAlignSelect) {
        // Clear existing options
        textAlignSelect.innerHTML = '';
        
        // Add options for each text alignment
        fontManager.TEXT_ALIGNMENTS.forEach(align => {
            const option = document.createElement('option');
            option.value = align.value;
            option.textContent = align.label;
            textAlignSelect.appendChild(option);
        });
        
        // Listen for changes
        textAlignSelect.addEventListener('change', function() {
            if (!selectedElement) return;
            fontManager.updateTextAppearance(selectedElement, {
                textAlign: this.value
            });
        });
    }
    
    // Initialize the font size input
    const fontSizeInput = document.getElementById('font-size');
    if (fontSizeInput) {
        // Listen for changes
        fontSizeInput.addEventListener('change', function() {
            if (!selectedElement) return;
            const fontSize = parseInt(this.value);
            if (isNaN(fontSize) || fontSize < 8 || fontSize > 72) return;
            
            fontManager.updateTextAppearance(selectedElement, {
                fontSize: fontSize
            });
        });
    }
    
    // Initialize the font color picker
    const fontColorInput = document.getElementById('font-color');
    if (fontColorInput) {
        // Listen for changes
        fontColorInput.addEventListener('change', function() {
            if (!selectedElement) return;
            fontManager.updateTextAppearance(selectedElement, {
                fill: this.value
            });
        });
    }
    
    // Initialize the line height input
    const lineHeightInput = document.getElementById('line-height');
    if (lineHeightInput) {
        // Listen for changes
        lineHeightInput.addEventListener('change', function() {
            if (!selectedElement) return;
            const lineHeight = parseFloat(this.value);
            if (isNaN(lineHeight) || lineHeight < 0.8 || lineHeight > 2.5) return;
            
            fontManager.updateTextAppearance(selectedElement, {
                lineHeight: lineHeight
            });
        });
    }
}

// NEW FEATURE: Setup export button
function setupExportButton() {
    const exportButton = document.getElementById('export-btn');
    if (!exportButton) {
        // Create export button if it doesn't exist
        const header = document.querySelector('.header div');
        if (header) {
            const exportBtn = document.createElement('button');
            exportBtn.id = 'export-btn';
            exportBtn.className = 'btn btn-secondary';
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Export';
            header.appendChild(exportBtn);
            
            // Create export dropdown menu
            const exportMenu = document.createElement('div');
            exportMenu.id = 'export-menu';
            exportMenu.className = 'export-menu';
            exportMenu.innerHTML = `
                <button class="export-option" data-format="svg"><i class="fas fa-file-code"></i> SVG</button>
                <button class="export-option" data-format="png"><i class="fas fa-file-image"></i> PNG</button>
            `;
            exportMenu.style.display = 'none';
            document.body.appendChild(exportMenu);
            
            // Handle export button click
            exportBtn.addEventListener('click', function(e) {
                const rect = exportBtn.getBoundingClientRect();
                exportMenu.style.top = (rect.bottom + 5) + 'px';
                exportMenu.style.right = (window.innerWidth - rect.right) + 'px';
                exportMenu.style.display = 'block';
                e.stopPropagation();
            });
            
            // Handle export option selection
            document.querySelectorAll('.export-option').forEach(option => {
                option.addEventListener('click', function() {
                    const format = this.getAttribute('data-format');
                    exportDiagram(format);
                    exportMenu.style.display = 'none';
                });
            });
            
            // Hide export menu when clicking elsewhere
            document.addEventListener('click', function(e) {
                if (!exportMenu.contains(e.target) && e.target !== exportBtn) {
                    exportMenu.style.display = 'none';
                }
            });
        }
    } else {
        // Setup existing export button
        exportButton.addEventListener('click', function() {
            exportDiagram('svg');
        });
    }
}

// NEW FEATURE: Export diagram
function exportDiagram(format = 'svg') {
    try {
        if (format === 'svg') {
            exportSVG();
        } else if (format === 'png') {
            exportPNG();
        } else if (format === 'pdf') {
            exportPDF();
        }
    } catch (error) {
        console.error("Export error:", error);
        showConnectionHelp(true, "Export failed: " + error.message, "error");
        setTimeout(() => showConnectionHelp(false), 3000);
    }
}

// Export as SVG with font optimization
function exportSVG() {
    try {
        // Get SVG data from canvas
        const svgData = canvas.toSVG();

        // Try to get font families if fontManager is available
        let fontCss = '<style>\n';
        try {
            if (fontManager && fontManager.getFontFamiliesInUse) {
                const fontFamilies = fontManager.getFontFamiliesInUse();
                fontFamilies.forEach(family => {
                    // Skip default fonts
                    if (family === 'Inter' || family === 'sans-serif') return;

                    fontCss += `@import url('https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}&display=swap');\n`;
                });
            }
        } catch (e) {
            console.warn("Could not get font families:", e);
        }
        fontCss += '</style>';

        // Insert font CSS into SVG
        const enhancedSvg = svgData.replace('<svg ', `<svg ${fontCss} `);

        // Provide download link
        const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(enhancedSvg);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'uml-diagram_' + new Date().getTime() + '.svg';
        link.click();

        // Show confirmation
        showConnectionHelp(true, "Diagram exported as SVG successfully!", "success");
        setTimeout(() => showConnectionHelp(false), 2000);
    } catch (error) {
        console.error("SVG export error:", error);
        showConnectionHelp(true, "SVG export failed: " + error.message, "error");
        setTimeout(() => showConnectionHelp(false), 3000);
    }
}

// Export as PNG
function exportPNG() {
    try {
        // Create a temporary canvas with higher resolution for better quality
        const multiplier = 2; // Higher resolution multiplier

        // Get the bounds of all objects to calculate actual content size
        const objects = canvas.getObjects();
        if (objects.length === 0) {
            showConnectionHelp(true, "No content to export!", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Calculate bounding box of all objects
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
            const bounds = obj.getBoundingRect(true);
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.top);
            maxX = Math.max(maxX, bounds.left + bounds.width);
            maxY = Math.max(maxY, bounds.top + bounds.height);
        });

        // Add padding
        const padding = 50;
        minX -= padding;
        minY -= padding;
        maxX += padding;
        maxY += padding;

        const width = maxX - minX;
        const height = maxY - minY;

        // Create a temporary canvas with the dimensions
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width * multiplier;
        tempCanvas.height = height * multiplier;

        // Get the canvas context
        const ctx = tempCanvas.getContext('2d');

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        // Scale and translate for higher resolution
        ctx.scale(multiplier, multiplier);
        ctx.translate(-minX, -minY);

        // Export canvas to data URL and draw it
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: multiplier
        });

        const img = new Image();
        img.onload = function() {
            ctx.drawImage(img, minX, minY);

            // Convert to PNG
            const finalDataUrl = tempCanvas.toDataURL('image/png');

            // Provide download link
            const link = document.createElement('a');
            link.href = finalDataUrl;
            link.download = 'uml-diagram_' + new Date().getTime() + '.png';
            link.click();

            // Show confirmation
            showConnectionHelp(true, "Diagram exported as PNG successfully!", "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        };
        img.onerror = function() {
            showConnectionHelp(true, "PNG export failed: Could not load canvas image", "error");
            setTimeout(() => showConnectionHelp(false), 3000);
        };
        img.src = dataURL;
    } catch (error) {
        console.error("PNG export error:", error);
        showConnectionHelp(true, "PNG export failed: " + error.message, "error");
        setTimeout(() => showConnectionHelp(false), 3000);
    }
}

// Export as PDF (using PNG as base)
function exportPDF() {
    try {
        showConnectionHelp(true, "Generating PDF... This may take a moment.", "info");

        // For PDF export, we'll use the PNG export and embed it
        // First, get the PNG data
        const objects = canvas.getObjects();
        if (objects.length === 0) {
            showConnectionHelp(true, "No content to export!", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Calculate bounding box
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        objects.forEach(obj => {
            const bounds = obj.getBoundingRect(true);
            minX = Math.min(minX, bounds.left);
            minY = Math.min(minY, bounds.top);
            maxX = Math.max(maxX, bounds.left + bounds.width);
            maxY = Math.max(maxY, bounds.top + bounds.height);
        });

        const padding = 50;
        const width = (maxX - minX) + (padding * 2);
        const height = (maxY - minY) + (padding * 2);

        // Get high quality PNG
        canvas.setViewportTransform([1, 0, 0, 1, -minX + padding, -minY + padding]);
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2,
            width: width,
            height: height
        });
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

        // Create a simple PDF using data URL (browser will handle conversion)
        // Note: This creates a PNG-in-PDF, not a true vector PDF
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'uml-diagram_' + new Date().getTime() + '.png';  // Still PNG, but user can print to PDF
        link.click();

        showConnectionHelp(true, "Image exported! Use 'Print to PDF' in your browser to create a PDF.", "success");
        setTimeout(() => showConnectionHelp(false), 4000);
    } catch (error) {
        console.error("PDF export error:", error);
        showConnectionHelp(true, "PDF export failed: " + error.message, "error");
        setTimeout(() => showConnectionHelp(false), 3000);
    }
}

// Update properties panel based on selected element
export function updatePropertiesPanel(element) {
    if (!element) return;
    
    // Use setter function instead of direct assignment
    setSelectedElement(element);
    
    // Show properties for all element types
    if (element.elementType === ELEMENT_TYPES.ACTOR || 
        element.elementType === ELEMENT_TYPES.USECASE || 
        element.elementType === ELEMENT_TYPES.SYSTEM ||
        element.elementType === ELEMENT_TYPES.MISUSE_CASE ||
        element.elementType === ELEMENT_TYPES.MISUSER) {
        
        // Update the multiline text editor
        const textEditor = document.getElementById('element-text-editor');
        if (textEditor) {
            textEditor.value = element.name || '';
        }
        
        document.getElementById('properties-panel').style.display = 'flex';
        
        // Always hide the old misuse case controls - removed in favor of the sidebar
        const misuseControls = document.getElementById('misuse-case-controls');
        if (misuseControls) {
            misuseControls.style.display = 'none';
        }
        
        // Update font customization controls
        updateFontControls(element);

        // Update styling controls (colors, fills, etc.)
        if (stylingManager && stylingManager.updateStylingPanel) {
            stylingManager.updateStylingPanel(element);
        }
    } 
    // Handle connection (relationship line)
    else if (element.elementType && [
        ELEMENT_TYPES.ASSOCIATION,
        ELEMENT_TYPES.INCLUDE,
        ELEMENT_TYPES.EXTEND,
        ELEMENT_TYPES.GENERALIZATION,
        ELEMENT_TYPES.THREATENS
    ].includes(element.elementType)) {
        // Show simple properties panel for connections
        const textEditor = document.getElementById('element-text-editor');
        if (textEditor) {
            const connectionName = getConnectionName(element.elementType);
            textEditor.value = `${connectionName} Relationship`;
            textEditor.disabled = true; // Read-only for connections
        }

        document.getElementById('properties-panel').style.display = 'flex';

        // Hide misuse case controls
        const misuseControls = document.getElementById('misuse-case-controls');
        if (misuseControls) {
            misuseControls.style.display = 'none';
        }

        // Show helpful message in properties panel
        const propertiesPanel = document.getElementById('properties-panel');
        if (propertiesPanel) {
            // Add a helpful message for connection deletion
            let helpMsg = propertiesPanel.querySelector('.connection-delete-help');
            if (!helpMsg) {
                helpMsg = document.createElement('div');
                helpMsg.className = 'connection-delete-help';
                helpMsg.style.cssText = 'padding: 10px; background: #f8f9fa; border-radius: 4px; margin: 10px 0; font-size: 12px; color: #666;';
                const nameProperty = document.getElementById('name-property');
                if (nameProperty) {
                    nameProperty.parentNode.insertBefore(helpMsg, nameProperty.nextSibling);
                }
            }
            helpMsg.innerHTML = '<i class="fas fa-info-circle"></i> Click the Delete button below or press Delete key to remove this relationship.';
        }
    }
    // Handle connection label
    else if (element.isConnectionLabel) {
        // Show only text editing for connection labels
        const textEditor = document.getElementById('element-text-editor');
        if (textEditor) {
            textEditor.value = element.text || '';
            textEditor.disabled = false; // Enable editing for labels
        }

        document.getElementById('properties-panel').style.display = 'flex';

        // Hide misuse case controls
        const misuseControls = document.getElementById('misuse-case-controls');
        if (misuseControls) {
            misuseControls.style.display = 'none';
        }

        // Update font controls for the label
        updateFontControls(element);
    } else {
        clearPropertiesPanel();
    }
}

// Update font customization controls based on selected element
function updateFontControls(element) {
    const fontSettings = getElementFontSettings(element);
    if (!fontSettings) return;
    
    // Update font family dropdown
    const fontFamilySelect = document.getElementById('font-family');
    if (fontFamilySelect) {
        fontFamilySelect.value = fontSettings.fontFamily || 'Inter, sans-serif';
    }
    
    // Update font weight dropdown
    const fontWeightSelect = document.getElementById('font-weight');
    if (fontWeightSelect) {
        fontWeightSelect.value = fontSettings.fontWeight || '400';
    }
    
    // Update text alignment dropdown
    const textAlignSelect = document.getElementById('text-align');
    if (textAlignSelect) {
        textAlignSelect.value = fontSettings.textAlign || 'center';
    }
    
    // Update font size input
    const fontSizeInput = document.getElementById('font-size');
    if (fontSizeInput) {
        fontSizeInput.value = fontSettings.fontSize || 14;
    }
    
    // Update font color picker
    const fontColorInput = document.getElementById('font-color');
    if (fontColorInput) {
        fontColorInput.value = fontSettings.fill || '#333333';
    }
    
    // Update line height input
    const lineHeightInput = document.getElementById('line-height');
    if (lineHeightInput) {
        lineHeightInput.value = fontSettings.lineHeight || 1.2;
    }
}

// Clear properties panel
export function clearPropertiesPanel() {
    // Use setter function instead of direct assignment
    setSelectedElement(null);

    // Clear the multiline text editor
    const textEditor = document.getElementById('element-text-editor');
    if (textEditor) {
        textEditor.value = '';
        textEditor.disabled = false; // Re-enable the text editor
    }

    // Remove connection delete help message if it exists
    const helpMsg = document.querySelector('.connection-delete-help');
    if (helpMsg) {
        helpMsg.remove();
    }

    const misuseControls = document.getElementById('misuse-case-controls');
    if (misuseControls) {
        misuseControls.style.display = 'none';
    }
    
    // Reset font controls to defaults
    const fontFamilySelect = document.getElementById('font-family');
    if (fontFamilySelect) fontFamilySelect.value = 'Inter, sans-serif';
    
    const fontWeightSelect = document.getElementById('font-weight');
    if (fontWeightSelect) fontWeightSelect.value = '400';
    
    const textAlignSelect = document.getElementById('text-align');
    if (textAlignSelect) textAlignSelect.value = 'center';
    
    const fontSizeInput = document.getElementById('font-size');
    if (fontSizeInput) fontSizeInput.value = '14';
    
    const fontColorInput = document.getElementById('font-color');
    if (fontColorInput) fontColorInput.value = '#333333';
    
    const lineHeightInput = document.getElementById('line-height');
    if (lineHeightInput) lineHeightInput.value = '1.2';
}

// Apply properties to selected element with improved text handling
function applyProperties() {
    if (!selectedElement) return;
    
    const textEditor = document.getElementById('element-text-editor');
    const text = textEditor ? textEditor.value : '';
    
    // Check if it's a connection label
    if (selectedElement.isConnectionLabel) {
        // Update the label text
        selectedElement.set('text', text);
        canvas.renderAll();
    } else {
        // Update the element name and text
        selectedElement.name = text;
        
        // Use the improved method to handle multiline text
        updateElementText(selectedElement, text);
    }
    
    // Show confirmation
    showConnectionHelp(true, "Properties updated successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Function to show connection help messages
export function showConnectionHelp(show, message = '', type = 'info') {
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

// Initialize the toolbar
export function initToolbar() {
    // Toolbar initialization happens in core.js
}

// Initialize the tutorial panel
export function initTutorial() {
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
}

// Delete selected element
function deleteSelectedElement() {
    if (!selectedElement) return;

    // Check if it's a connection (relationship line)
    if (selectedElement.elementType && [
        ELEMENT_TYPES.ASSOCIATION,
        ELEMENT_TYPES.INCLUDE,
        ELEMENT_TYPES.EXTEND,
        ELEMENT_TYPES.GENERALIZATION,
        ELEMENT_TYPES.THREATENS
    ].includes(selectedElement.elementType)) {
        deleteConnection(selectedElement);
        return;
    }

    // Check if it's a connection label
    if (selectedElement.isConnectionLabel) {
        // Get the associated connection
        const connection = selectedElement.connection;

        // Remove the label reference from the connection
        if (connection) {
            connection.label = null;
        }

        // Remove the label
        canvas.remove(selectedElement);
        setSelectedElement(null);
        clearPropertiesPanel();
        canvas.renderAll();

        // Show confirmation
        showConnectionHelp(true, "Label deleted successfully!", "success");
        setTimeout(() => showConnectionHelp(false), 2000);

        return;
    }
    
    // If it has connections, remove them and their labels first
    if (selectedElement.connections && selectedElement.connections.length > 0) {
        // Create a copy of the connections array to avoid issues during removal
        const connections = [...selectedElement.connections];
        
        connections.forEach(conn => {
            // IMPROVED: Remove all connection elements (label, text, arrowhead)
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
    setSelectedElement(null);
    clearPropertiesPanel();
    canvas.renderAll();
    
    // Show confirmation
    showConnectionHelp(true, "Element deleted successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Delete a connection (relationship line)
function deleteConnection(connection) {
    if (!connection) return;

    // Remove all connection visual elements
    if (connection.label) {
        canvas.remove(connection.label);
    }

    if (connection.text) {
        canvas.remove(connection.text);
    }

    if (connection.arrowhead) {
        canvas.remove(connection.arrowhead);
    }

    // Remove this connection from both source and target elements' connections arrays
    if (connection.source && connection.source.connections) {
        connection.source.connections = connection.source.connections.filter(c => c !== connection);
    }

    if (connection.target && connection.target.connections) {
        connection.target.connections = connection.target.connections.filter(c => c !== connection);
    }

    // Remove the connection line itself
    canvas.remove(connection);
    setSelectedElement(null);
    clearPropertiesPanel();
    canvas.renderAll();

    // Show confirmation
    showConnectionHelp(true, "Relationship deleted successfully!", "success");
    setTimeout(() => showConnectionHelp(false), 2000);
}

// Helper function to get human-readable connection name
function getConnectionName(elementType) {
    switch(elementType) {
        case ELEMENT_TYPES.ASSOCIATION:
            return 'Association';
        case ELEMENT_TYPES.INCLUDE:
            return 'Include';
        case ELEMENT_TYPES.EXTEND:
            return 'Extend';
        case ELEMENT_TYPES.GENERALIZATION:
            return 'Generalization';
        case ELEMENT_TYPES.THREATENS:
            return 'Threatens';
        default:
            return 'Connection';
    }
}

// Export the deleteConnection function for use in other modules
export { deleteConnection };