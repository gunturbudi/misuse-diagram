// fontManager.js - Font handling and text customization
import { canvas } from './core.js';

// Available font families
export const FONT_FAMILIES = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Helvetica, sans-serif',
    'Times New Roman, serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Consolas, monospace',
    'Roboto, sans-serif',
    'Open Sans, sans-serif',
    'Lato, sans-serif'
];

// Font weight options
export const FONT_WEIGHTS = [
    { value: '300', label: 'Light' },
    { value: '400', label: 'Regular' },
    { value: '500', label: 'Medium' },
    { value: '600', label: 'Semi-Bold' },
    { value: '700', label: 'Bold' }
];

// Text alignment options
export const TEXT_ALIGNMENTS = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' }
];

// Default font settings by element type
export const DEFAULT_FONT_SETTINGS = {
    actor: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        fill: '#333333',
        maxFontSize: 24,
        minFontSize: 10,
        fontSizeRatio: 0.4, // Font size as a ratio of element size
        lineHeight: 1.2
    },
    usecase: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        fill: '#333333',
        maxFontSize: 20,
        minFontSize: 10,
        fontSizeRatio: 0.23, // Font size as a ratio of element size
        lineHeight: 1.2
    },
    system: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        fill: '#333333',
        maxFontSize: 28,
        minFontSize: 12,
        fontSizeRatio: 0.05, // Font size as a ratio of element width
        lineHeight: 1.2
    },
    misusecase: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 14,
        fontWeight: '400',
        textAlign: 'center',
        fill: '#dc3545',
        maxFontSize: 20,
        minFontSize: 10,
        fontSizeRatio: 0.23, // Font size as a ratio of element size
        lineHeight: 1.2
    },
    misuser: {
        fontFamily: 'Inter, sans-serif',
        fontSize: 16,
        fontWeight: '500',
        textAlign: 'center',
        fill: '#dc3545',
        maxFontSize: 24,
        minFontSize: 10,
        fontSizeRatio: 0.4, // Font size as a ratio of element size
        lineHeight: 1.2
    }
};

// Get default font settings for an element type
export function getDefaultFontSettings(elementType) {
    const type = elementType.toLowerCase();
    return DEFAULT_FONT_SETTINGS[type] || DEFAULT_FONT_SETTINGS.usecase;
}

// Calculate appropriate font size based on element dimensions
export function calculateFontSize(element, textObj) {
    // Get element type
    const elementType = element.elementType.toLowerCase();
    const settings = DEFAULT_FONT_SETTINGS[elementType];
    
    if (!settings) return 14; // Default fallback
    
    let size;
    
    // Calculate based on element type
    if (elementType === 'actor' || elementType === 'misuser') {
        // For actors, scale based on overall height
        const height = element.height * element.scaleY;
        size = Math.floor(height * settings.fontSizeRatio);
    } 
    else if (elementType === 'usecase' || elementType === 'misusecase') {
        // For use cases, scale based on ellipse size
        const rx = 60 * element.scaleX; // Default ellipse rx is 60
        size = Math.floor(rx * settings.fontSizeRatio);
    }
    else if (elementType === 'system') {
        // For systems, scale based on width
        const width = element.width * element.scaleX;
        size = Math.floor(width * settings.fontSizeRatio);
    }
    else {
        // Fallback using the object's dimensions
        const minDimension = Math.min(element.width * element.scaleX, element.height * element.scaleY);
        size = Math.floor(minDimension * 0.2);
    }
    
    // Apply min/max constraints
    return Math.max(settings.minFontSize, Math.min(settings.maxFontSize, size));
}

// Get the text object from an element
export function getTextObject(element) {
    if (!element) return null;
    
    // Get the text object within the group based on element type
    let textObj;
    
    if (element.elementType === 'actor' || element.elementType === 'misuser') {
        // Actor's/Misuser's name is the last element (index 5)
        textObj = element.getObjects()[5];
    } else if (element.elementType === 'usecase' || element.elementType === 'misusecase') {
        // Use case's/Misuse case's text is the second element (index 1)
        textObj = element.getObjects()[1];
    } else if (element.elementType === 'system') {
        // System's title is the third element (index 2)
        textObj = element.getObjects()[2];
    }
    
    return textObj;
}

// Update text appearance
export function updateTextAppearance(element, options = {}) {
    const textObj = getTextObject(element);
    if (!textObj) return;
    
    // Apply each option if provided
    if (options.fontFamily !== undefined) textObj.set('fontFamily', options.fontFamily);
    if (options.fontSize !== undefined) textObj.set('fontSize', options.fontSize);
    if (options.fontWeight !== undefined) textObj.set('fontWeight', options.fontWeight);
    if (options.textAlign !== undefined) textObj.set('textAlign', options.textAlign);
    if (options.fill !== undefined) textObj.set('fill', options.fill);
    if (options.lineHeight !== undefined) textObj.set('lineHeight', options.lineHeight);
    
    // If text changed
    if (options.text !== undefined) textObj.set('text', options.text);
    
    // Store custom font settings on the element for persistence
    if (!element.customFontSettings) element.customFontSettings = {};
    
    Object.keys(options).forEach(key => {
        element.customFontSettings[key] = options[key];
    });
    
    // Auto-resize element if needed
    if (options.text !== undefined) {
        autoSizeElementBasedOnText(element);
    }
    
    // Render changes
    canvas.renderAll();
}

// Apply smart font sizing during scaling
export function applySmartFontSizing(element) {
    const textObj = getTextObject(element);
    if (!textObj) return;
    
    // Calculate appropriate font size based on element dimensions
    const fontSize = calculateFontSize(element, textObj);
    
    // Apply the calculated font size
    textObj.set('fontSize', fontSize);
    
    // Special handling for textboxes in use cases
    if ((element.elementType === 'usecase' || element.elementType === 'misusecase') && 
        textObj.type === 'textbox') {
        // Adjust width for textbox based on ellipse size
        const rx = 60 * element.scaleX; // Default ellipse rx is 60
        textObj.set('width', rx * 1.5);
    }
    
    // Update the custom font settings
    if (!element.customFontSettings) element.customFontSettings = {};
    element.customFontSettings.fontSize = fontSize;
}

// Initialize font scaling behavior for an element
export function initFontScaling(element) {
    // Remove any existing scaling handlers to avoid duplication
    element.off('scaling');
    
    // Add scaling behavior
    element.on('scaling', function() {
        applySmartFontSizing(element);
        canvas.renderAll();
    });
}

// NEW FEATURE: Auto-sizing elements based on text content
export function autoSizeElementBasedOnText(element) {
    const textObj = getTextObject(element);
    if (!textObj) return;
    
    // Get the text dimensions (force a render to get accurate dimensions)
    textObj.set('dirty', true);
    canvas.renderAll();
    
    const textWidth = textObj.width;
    const textHeight = textObj.height;
    
    // Apply appropriate resizing based on element type
    if (element.elementType === 'usecase' || element.elementType === 'misusecase') {
        // For use cases, adjust the ellipse size
        const ellipse = element.getObjects()[0];
        const padding = 15; // Padding around text
        
        // Calculate new dimensions based on text content
        // Use max of current size and required size for text
        const newRx = Math.max(60, (textWidth / 2) + padding);
        const newRy = Math.max(30, (textHeight / 2) + padding);
        
        // Update ellipse dimensions
        ellipse.set({
            rx: newRx,
            ry: newRy
        });
        
        // Update textbox width proportionally
        if (textObj.type === 'textbox') {
            textObj.set({
                width: newRx * 1.5
            });
        }
    }
    else if (element.elementType === 'system') {
        // For systems, adjust the rectangle width if needed
        const rect = element.getObjects()[0]; // Main rectangle
        const titleBox = element.getObjects()[1]; // Title box
        
        const padding = 30; // Padding around text
        const minimumWidth = 300; // Minimum width constraint
        
        // Calculate new width based on text content
        const newWidth = Math.max(minimumWidth, textWidth + padding * 2);
        
        // If new width is bigger than current width, resize
        if (newWidth > rect.width) {
            // Update main rectangle
            rect.set({
                width: newWidth
            });
            
            // Update title box
            titleBox.set({
                width: newWidth
            });
        }
    }
    // For actors and misusers, no automatic resizing is needed as they are fixed-shape

    // Update the element
    element.set('dirty', true);
    canvas.renderAll();
}

// NEW FEATURE: Adjust text rendering for zoom levels
export function adjustTextForZoom(zoom) {
    canvas.getObjects().forEach(obj => {
        const textObj = getTextObject(obj);
        if (!textObj) return;
        
        if (zoom < 0.5) {
            // For very zoomed out views, increase contrast and visibility
            textObj.set({ 
                strokeWidth: 0.5, 
                stroke: textObj.fill,
                shadow: new fabric.Shadow({
                    color: '#ffffff',
                    blur: 3,
                    offsetX: 0,
                    offsetY: 0
                }) 
            });
        } else {
            // Normal text rendering
            textObj.set({ 
                strokeWidth: 0,
                shadow: null 
            });
        }
    });
    
    canvas.renderAll();
}

// NEW FEATURE: Support for multi-line text handling
export function handleMultiLineText(element, text) {
    const textObj = getTextObject(element);
    if (!textObj) return;
    
    // Check for textbox type which supports multiline
    if (textObj.type !== 'textbox') {
        // Convert to textbox if it's a simple text object
        const props = textObj.toObject();
        
        // Create a textbox with the same properties
        const newTextObj = new fabric.Textbox(text, {
            ...props,
            width: props.width || 150,
            breakWords: true
        });
        
        // Replace the text object in the element
        const objects = element.getObjects();
        const textIndex = objects.indexOf(textObj);
        
        if (textIndex !== -1) {
            objects[textIndex] = newTextObj;
            element.set('objects', objects);
        }
    } else {
        // Update the existing textbox
        textObj.set({
            text: text
        });
    }
    
    // Auto-size the element based on new text content
    autoSizeElementBasedOnText(element);
    
    canvas.renderAll();
}

// Get all font families used in the diagram for export
export function getFontFamiliesInUse() {
    const fontFamilies = new Set();
    
    canvas.getObjects().forEach(obj => {
        const textObj = getTextObject(obj);
        if (textObj && textObj.fontFamily) {
            // Extract primary font name before any fallbacks
            const primaryFont = textObj.fontFamily.split(',')[0].trim();
            fontFamilies.add(primaryFont);
        }
    });
    
    return Array.from(fontFamilies);
}