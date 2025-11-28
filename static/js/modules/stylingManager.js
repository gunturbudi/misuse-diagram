// stylingManager.js - Advanced element styling capabilities
import { canvas, ELEMENT_TYPES } from './core.js';
import { showConnectionHelp } from './ui.js';

class StylingManager {
    constructor() {
        this.defaultColors = {
            actor: { stroke: '#000000', fill: '#ffffff' },
            usecase: { stroke: '#000000', fill: '#ffffff' },
            system: { stroke: '#000000', fill: '#ffffff' },
            misuser: { stroke: '#dc3545', fill: '#ffebee' },
            misusecase: { stroke: '#dc3545', fill: '#ffebee' }
        };
    }

    init() {
        this.setupStylingPanel();
        console.log("Styling manager initialized");
    }

    setupStylingPanel() {
        // Check if styling panel exists
        let stylingPanel = document.getElementById('styling-panel');

        if (!stylingPanel) {
            // Create styling panel
            stylingPanel = document.createElement('div');
            stylingPanel.id = 'styling-panel';
            stylingPanel.className = 'styling-panel';
            stylingPanel.innerHTML = `
                <h3>Style</h3>
                <div class="style-section">
                    <label>Fill Color:</label>
                    <input type="color" id="element-fill-color" value="#ffffff">
                    <button id="reset-fill-color" class="btn-icon" title="Reset to default">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
                <div class="style-section">
                    <label>Stroke Color:</label>
                    <input type="color" id="element-stroke-color" value="#000000">
                    <button id="reset-stroke-color" class="btn-icon" title="Reset to default">
                        <i class="fas fa-undo"></i>
                    </button>
                </div>
                <div class="style-section">
                    <label>Stroke Width:</label>
                    <input type="range" id="element-stroke-width" min="1" max="10" value="2">
                    <span id="stroke-width-value">2</span>px
                </div>
                <div class="style-section">
                    <label>Opacity:</label>
                    <input type="range" id="element-opacity" min="0" max="100" value="100">
                    <span id="opacity-value">100</span>%
                </div>
                <div class="style-section">
                    <label>Border Radius:</label>
                    <input type="range" id="element-border-radius" min="0" max="50" value="0">
                    <span id="border-radius-value">0</span>px
                </div>
                <div class="style-section">
                    <button id="apply-style-to-all" class="btn btn-secondary">
                        <i class="fas fa-paint-brush"></i> Apply to All Same Type
                    </button>
                </div>
            `;

            // Add to properties panel or create separate panel
            const propertiesPanel = document.getElementById('properties-panel');
            if (propertiesPanel) {
                propertiesPanel.appendChild(stylingPanel);
            }
        }

        // Setup event listeners
        this.setupStylingControls();
    }

    setupStylingControls() {
        // Fill color
        const fillColorInput = document.getElementById('element-fill-color');
        if (fillColorInput) {
            fillColorInput.addEventListener('change', (e) => {
                this.applyFillColor(e.target.value);
            });
        }

        // Stroke color
        const strokeColorInput = document.getElementById('element-stroke-color');
        if (strokeColorInput) {
            strokeColorInput.addEventListener('change', (e) => {
                this.applyStrokeColor(e.target.value);
            });
        }

        // Stroke width
        const strokeWidthInput = document.getElementById('element-stroke-width');
        const strokeWidthValue = document.getElementById('stroke-width-value');
        if (strokeWidthInput && strokeWidthValue) {
            strokeWidthInput.addEventListener('input', (e) => {
                strokeWidthValue.textContent = e.target.value;
                this.applyStrokeWidth(parseInt(e.target.value));
            });
        }

        // Opacity
        const opacityInput = document.getElementById('element-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacityInput && opacityValue) {
            opacityInput.addEventListener('input', (e) => {
                opacityValue.textContent = e.target.value;
                this.applyOpacity(parseInt(e.target.value) / 100);
            });
        }

        // Border radius
        const borderRadiusInput = document.getElementById('element-border-radius');
        const borderRadiusValue = document.getElementById('border-radius-value');
        if (borderRadiusInput && borderRadiusValue) {
            borderRadiusInput.addEventListener('input', (e) => {
                borderRadiusValue.textContent = e.target.value;
                this.applyBorderRadius(parseInt(e.target.value));
            });
        }

        // Reset buttons
        const resetFillBtn = document.getElementById('reset-fill-color');
        if (resetFillBtn) {
            resetFillBtn.addEventListener('click', () => {
                this.resetFillColor();
            });
        }

        const resetStrokeBtn = document.getElementById('reset-stroke-color');
        if (resetStrokeBtn) {
            resetStrokeBtn.addEventListener('click', () => {
                this.resetStrokeColor();
            });
        }

        // Apply to all button
        const applyToAllBtn = document.getElementById('apply-style-to-all');
        if (applyToAllBtn) {
            applyToAllBtn.addEventListener('click', () => {
                this.applyStyleToAllSameType();
            });
        }
    }

    updateStylingPanel(element) {
        if (!element || !element.elementType) return;

        // Get current values from element
        let fillColor = '#ffffff';
        let strokeColor = '#000000';
        let strokeWidth = 2;
        let opacity = 1;

        // Extract colors from the element
        if (element.type === 'group' && element._objects && element._objects.length > 0) {
            const mainShape = element._objects[0];
            fillColor = mainShape.fill || '#ffffff';
            strokeColor = mainShape.stroke || '#000000';
            strokeWidth = mainShape.strokeWidth || 2;
            opacity = mainShape.opacity !== undefined ? mainShape.opacity : 1;
        } else {
            fillColor = element.fill || '#ffffff';
            strokeColor = element.stroke || '#000000';
            strokeWidth = element.strokeWidth || 2;
            opacity = element.opacity !== undefined ? element.opacity : 1;
        }

        // Update inputs
        const fillColorInput = document.getElementById('element-fill-color');
        if (fillColorInput) fillColorInput.value = fillColor;

        const strokeColorInput = document.getElementById('element-stroke-color');
        if (strokeColorInput) strokeColorInput.value = strokeColor;

        const strokeWidthInput = document.getElementById('element-stroke-width');
        const strokeWidthValue = document.getElementById('stroke-width-value');
        if (strokeWidthInput && strokeWidthValue) {
            strokeWidthInput.value = strokeWidth;
            strokeWidthValue.textContent = strokeWidth;
        }

        const opacityInput = document.getElementById('element-opacity');
        const opacityValue = document.getElementById('opacity-value');
        if (opacityInput && opacityValue) {
            const opacityPercent = Math.round(opacity * 100);
            opacityInput.value = opacityPercent;
            opacityValue.textContent = opacityPercent;
        }
    }

    applyFillColor(color) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'group' && activeObject._objects) {
            // For groups, apply to the main shape (first object)
            const mainShape = activeObject._objects[0];
            if (mainShape) {
                mainShape.set('fill', color);
            }
        } else {
            activeObject.set('fill', color);
        }

        canvas.requestRenderAll();
        this.showStyleMessage("Fill color applied");
    }

    applyStrokeColor(color) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'group' && activeObject._objects) {
            // Apply to all sub-objects
            activeObject._objects.forEach(obj => {
                obj.set('stroke', color);
            });
        } else {
            activeObject.set('stroke', color);
        }

        canvas.requestRenderAll();
        this.showStyleMessage("Stroke color applied");
    }

    applyStrokeWidth(width) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'group' && activeObject._objects) {
            activeObject._objects.forEach(obj => {
                if (obj.stroke) {
                    obj.set('strokeWidth', width);
                }
            });
        } else {
            activeObject.set('strokeWidth', width);
        }

        canvas.requestRenderAll();
    }

    applyOpacity(opacity) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        activeObject.set('opacity', opacity);
        canvas.requestRenderAll();
    }

    applyBorderRadius(radius) {
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        if (activeObject.type === 'group' && activeObject._objects) {
            activeObject._objects.forEach(obj => {
                if (obj.type === 'rect') {
                    obj.set({
                        rx: radius,
                        ry: radius
                    });
                }
            });
        } else if (activeObject.type === 'rect') {
            activeObject.set({
                rx: radius,
                ry: radius
            });
        }

        canvas.requestRenderAll();
        this.showStyleMessage("Border radius applied");
    }

    resetFillColor() {
        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.elementType) return;

        const defaultColor = this.getDefaultFillColor(activeObject.elementType);
        this.applyFillColor(defaultColor);

        const fillColorInput = document.getElementById('element-fill-color');
        if (fillColorInput) fillColorInput.value = defaultColor;
    }

    resetStrokeColor() {
        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.elementType) return;

        const defaultColor = this.getDefaultStrokeColor(activeObject.elementType);
        this.applyStrokeColor(defaultColor);

        const strokeColorInput = document.getElementById('element-stroke-color');
        if (strokeColorInput) strokeColorInput.value = defaultColor;
    }

    applyStyleToAllSameType() {
        const activeObject = canvas.getActiveObject();
        if (!activeObject || !activeObject.elementType) {
            showConnectionHelp(true, "No element selected", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        const elementType = activeObject.elementType;

        // Get current style
        let style = {};
        if (activeObject.type === 'group' && activeObject._objects && activeObject._objects.length > 0) {
            const mainShape = activeObject._objects[0];
            style = {
                fill: mainShape.fill,
                stroke: mainShape.stroke,
                strokeWidth: mainShape.strokeWidth,
                opacity: activeObject.opacity
            };
        }

        // Apply to all elements of same type
        let count = 0;
        canvas.getObjects().forEach(obj => {
            if (obj !== activeObject && obj.elementType === elementType) {
                if (obj.type === 'group' && obj._objects && obj._objects.length > 0) {
                    const mainShape = obj._objects[0];
                    mainShape.set({
                        fill: style.fill,
                        stroke: style.stroke,
                        strokeWidth: style.strokeWidth
                    });

                    // Apply stroke to all sub-objects
                    obj._objects.forEach(subObj => {
                        if (subObj.stroke) {
                            subObj.set('stroke', style.stroke);
                        }
                    });
                }
                obj.set('opacity', style.opacity);
                count++;
            }
        });

        canvas.requestRenderAll();
        showConnectionHelp(true, `Style applied to ${count} elements`, "success");
        setTimeout(() => showConnectionHelp(false), 2000);
    }

    getDefaultFillColor(elementType) {
        switch (elementType) {
            case ELEMENT_TYPES.MISUSER:
            case ELEMENT_TYPES.MISUSE_CASE:
                return '#ffebee';
            default:
                return '#ffffff';
        }
    }

    getDefaultStrokeColor(elementType) {
        switch (elementType) {
            case ELEMENT_TYPES.MISUSER:
            case ELEMENT_TYPES.MISUSE_CASE:
                return '#dc3545';
            default:
                return '#000000';
        }
    }

    showStyleMessage(message) {
        // Use the connection help display for style messages
        showConnectionHelp(true, message, "success");
        setTimeout(() => showConnectionHelp(false), 1000);
    }
}

// Create singleton
const stylingManager = new StylingManager();
export default stylingManager;
