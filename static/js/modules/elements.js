// elements.js - Element creation functions with improved font handling
import { canvas, ELEMENT_TYPES } from './core.js';
import * as fontManager from './fontManager.js';

// Helper function to ensure all elements are properly selectable
function ensureSelectable(fabricObject) {
    fabricObject.set({
        selectable: true,
        hasControls: true,
        hasBorders: true,
        hoverCursor: 'pointer',
        moveCursor: 'move',
        subTargetCheck: true, // Important for group elements like actors
        perPixelTargetFind: false, // Better for selection performance
        lockUniScaling: false // Allow proportional scaling
    });
    
    // If this is a group, ensure all objects in the group are properly configured
    if (fabricObject.type === 'group' && fabricObject._objects) {
        fabricObject._objects.forEach(obj => {
            obj.evented = true; // Make sure sub-objects respond to events
        });
    }
    
    return fabricObject;
}

// Create actor (stick figure) with improved text rendering
export function createActor(left, top, name = 'Actor') {
    const fontSettings = fontManager.getDefaultFontSettings('actor');
    
    // Head (circle with smooth edges)
    const head = new fabric.Circle({
        radius: 10,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 2,
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.1)',
            blur: 3,
            offsetX: 0,
            offsetY: 1
        })
    });
    
    // Body (line with rounded ends)
    const body = new fabric.Line([0, 10, 0, 40], {
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Arms (line with rounded ends)
    const arms = new fabric.Line([-15, 20, 15, 20], {
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Left leg (line with rounded ends)
    const leftLeg = new fabric.Line([0, 40, -15, 60], {
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Right leg (line with rounded ends)
    const rightLeg = new fabric.Line([0, 40, 15, 60], {
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Name text with improved rendering - using textbox for multiline support
    const nameText = new fabric.Textbox(name, {
        fontSize: fontSettings.fontSize,
        fontFamily: fontSettings.fontFamily,
        fontWeight: fontSettings.fontWeight,
        originX: 'center',
        originY: 'center',
        top: 75,
        left: 0,
        fill: fontSettings.fill,
        textAlign: fontSettings.textAlign,
        width: 120, // Width for the textbox
        breakWords: true, // Allow word breaking for long words
        lineHeight: fontSettings.lineHeight // Add line height for multiline text
    });
    
    // Group all parts together
    const actor = new fabric.Group([head, body, arms, leftLeg, rightLeg, nameText], {
        left: left,
        top: top,
        hasControls: true,
        hasBorders: true,
        elementType: ELEMENT_TYPES.ACTOR,
        name: name,
        connections: [],
        hoverCursor: 'pointer',
        subTargetCheck: true,
        customFontSettings: fontSettings // Store the font settings
    });
    
    // Add class for CSS styling
    actor.set('class', 'uml-element');
    
    // Initialize smart font scaling
    fontManager.initFontScaling(actor);
    
    // Ensure the actor is selectable
    return ensureSelectable(actor);
}

// Create use case (oval with text) with improved text rendering
export function createUseCase(left, top, name = 'Use Case') {
    const fontSettings = fontManager.getDefaultFontSettings('usecase');
    const ellipseRx = 60;
    const ellipseRy = 30;
    
    // Create ellipse with smooth edges
    const ellipse = new fabric.Ellipse({
        rx: ellipseRx,
        ry: ellipseRy,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.1)',
            blur: 5,
            offsetX: 0,
            offsetY: 2
        })
    });
    
    // Create textbox instead of text for better wrapping and multiline support
    const text = new fabric.Textbox(name, {
        fontSize: fontSettings.fontSize,
        fontFamily: fontSettings.fontFamily,
        fontWeight: fontSettings.fontWeight,
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        textAlign: fontSettings.textAlign,
        width: ellipseRx * 1.5,
        breakWords: true,
        fill: fontSettings.fill,
        lockScalingX: true,
        lockScalingY: true,
        lineHeight: fontSettings.lineHeight // Add line height for multiline text
    });
    
    // Group with special handling
    const useCase = new fabric.Group([ellipse, text], {
        left: left,
        top: top,
        hasControls: true,
        hasBorders: true,
        elementType: ELEMENT_TYPES.USECASE,
        name: name,
        connections: [],
        hoverCursor: 'pointer',
        subTargetCheck: true,
        customFontSettings: fontSettings // Store the font settings
    });
    
    // Add class for CSS styling
    useCase.set('class', 'uml-element');
    
    // Initialize smart font scaling
    fontManager.initFontScaling(useCase);
    
    // Auto-size based on initial text
    fontManager.autoSizeElementBasedOnText(useCase);
    
    // Ensure the use case is selectable
    return ensureSelectable(useCase);
}

// Create misuse case (red oval with text) with improved text rendering
export function createMisuseCase(left, top, name = 'Misuse Case') {
    const fontSettings = fontManager.getDefaultFontSettings('misusecase');
    const ellipseRx = 60;
    const ellipseRy = 30;
    
    // Create ellipse with smooth edges
    const ellipse = new fabric.Ellipse({
        rx: ellipseRx,
        ry: ellipseRy,
        fill: '#ffebee',
        stroke: '#dc3545',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
            color: 'rgba(220,53,69,0.1)',
            blur: 5,
            offsetX: 0,
            offsetY: 2
        })
    });
    
    // Create textbox instead of text for better wrapping and multiline support
    const text = new fabric.Textbox(name, {
        fontSize: fontSettings.fontSize,
        fontFamily: fontSettings.fontFamily,
        fontWeight: fontSettings.fontWeight,
        originX: 'center',
        originY: 'center',
        left: 0,
        top: 0,
        textAlign: fontSettings.textAlign,
        width: ellipseRx * 1.5,
        breakWords: true,
        fill: fontSettings.fill,
        lockScalingX: true,
        lockScalingY: true,
        lineHeight: fontSettings.lineHeight // Add line height for multiline text
    });
    
    // Group with special handling
    const misuseCase = new fabric.Group([ellipse, text], {
        left: left,
        top: top,
        hasControls: true,
        hasBorders: true,
        elementType: ELEMENT_TYPES.MISUSE_CASE,
        name: name,
        connections: [],
        hoverCursor: 'pointer',
        subTargetCheck: true,
        customFontSettings: fontSettings // Store the font settings
    });
    
    // Add class for CSS styling
    misuseCase.set('class', 'uml-element');
    
    // Initialize smart font scaling
    fontManager.initFontScaling(misuseCase);
    
    // Auto-size based on initial text
    fontManager.autoSizeElementBasedOnText(misuseCase);
    
    // Ensure the misuse case is selectable
    return ensureSelectable(misuseCase);
}

// Create misuser (red stick figure) with improved text rendering
export function createMisuser(left, top, name = 'Misuser') {
    const fontSettings = fontManager.getDefaultFontSettings('misuser');
    
    // Head (circle with smooth edges)
    const head = new fabric.Circle({
        radius: 10,
        fill: '#ffebee',
        stroke: '#dc3545',
        strokeWidth: 2,
        left: 0,
        top: 0,
        originX: 'center',
        originY: 'center',
        shadow: new fabric.Shadow({
            color: 'rgba(220,53,69,0.1)',
            blur: 3,
            offsetX: 0,
            offsetY: 1
        })
    });
    
    // Body (line with rounded ends)
    const body = new fabric.Line([0, 10, 0, 40], {
        stroke: '#dc3545',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Arms (line with rounded ends)
    const arms = new fabric.Line([-15, 20, 15, 20], {
        stroke: '#dc3545',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Left leg (line with rounded ends)
    const leftLeg = new fabric.Line([0, 40, -15, 60], {
        stroke: '#dc3545',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Right leg (line with rounded ends)
    const rightLeg = new fabric.Line([0, 40, 15, 60], {
        stroke: '#dc3545',
        strokeWidth: 2,
        originX: 'center',
        originY: 'top',
        strokeLineCap: 'round'
    });
    
    // Name text with improved rendering - using textbox for multiline support
    const nameText = new fabric.Textbox(name, {
        fontSize: fontSettings.fontSize,
        fontFamily: fontSettings.fontFamily,
        fontWeight: fontSettings.fontWeight,
        originX: 'center',
        originY: 'center',
        top: 75,
        left: 0,
        fill: fontSettings.fill,
        textAlign: fontSettings.textAlign,
        width: 120, // Width for the textbox
        breakWords: true, // Allow word breaking for long words
        lineHeight: fontSettings.lineHeight // Add line height for multiline text
    });
    
    // Group all parts together
    const misuser = new fabric.Group([head, body, arms, leftLeg, rightLeg, nameText], {
        left: left,
        top: top,
        hasControls: true,
        hasBorders: true,
        elementType: ELEMENT_TYPES.MISUSER,
        name: name,
        connections: [],
        hoverCursor: 'pointer',
        subTargetCheck: true,
        customFontSettings: fontSettings // Store the font settings
    });
    
    // Add class for CSS styling
    misuser.set('class', 'uml-element');
    
    // Initialize smart font scaling
    fontManager.initFontScaling(misuser);
    
    // Ensure the misuser is selectable
    return ensureSelectable(misuser);
}

// Create system boundary (rectangle with title) with improved text rendering
export function createSystem(left, top, name = 'System') {
    const fontSettings = fontManager.getDefaultFontSettings('system');
    const width = 300;
    const height = 400;
    
    // Create rect with smooth corners
    const rect = new fabric.Rect({
        width: width,
        height: height,
        fill: 'white',
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        rx: 10,
        ry: 10,
        strokeDashArray: [5, 5],
        shadow: new fabric.Shadow({
            color: 'rgba(0,0,0,0.05)',
            blur: 10,
            offsetX: 0,
            offsetY: 5
        })
    });
    
    // Create title box with smooth corners
    const titleBox = new fabric.Rect({
        width: width,
        height: 30,
        fill: '#f8f9fa',
        stroke: 'black',
        strokeWidth: 2,
        originX: 'center',
        originY: 'center',
        top: -height / 2 + 15,
        rx: 10,
        ry: 10
    });
    
    // Create title text with improved rendering - using textbox for multiline support
    const titleText = new fabric.Textbox(name, {
        fontSize: fontSettings.fontSize,
        fontFamily: fontSettings.fontFamily,
        fontWeight: fontSettings.fontWeight,
        originX: 'center',
        originY: 'center',
        left: 0,
        top: -height / 2 + 15,
        fill: fontSettings.fill,
        textAlign: fontSettings.textAlign,
        width: width - 20, // Width for the textbox with padding
        breakWords: true, // Allow word breaking for long words
        lineHeight: fontSettings.lineHeight // Add line height for multiline text
    });
    
    // Group with special handling
    const system = new fabric.Group([rect, titleBox, titleText], {
        left: left,
        top: top,
        hasControls: true,
        hasBorders: true,
        elementType: ELEMENT_TYPES.SYSTEM,
        name: name,
        connections: [],
        hoverCursor: 'pointer',
        subTargetCheck: true,
        customFontSettings: fontSettings // Store the font settings
    });
    
    // Add class for CSS styling
    system.set('class', 'uml-element');
    
    // Initialize smart font scaling
    fontManager.initFontScaling(system);
    
    // Auto-size based on initial text
    fontManager.autoSizeElementBasedOnText(system);
    
    // Send to back so other elements appear on top
    system.sendToBack();
    
    // Ensure the system is selectable
    return ensureSelectable(system);
}

// Improved method to update element text
export function updateElementText(element, newText) {
    if (!element) return;
    
    // Use the font manager's handleMultiLineText for proper multiline support
    fontManager.handleMultiLineText(element, newText);
}

// Get current font settings from an element
export function getElementFontSettings(element) {
    if (!element) return null;
    
    // Get the text object
    const textObj = fontManager.getTextObject(element);
    if (!textObj) return null;
    
    // If element has custom font settings, use those
    if (element.customFontSettings) {
        return element.customFontSettings;
    }
    
    // Otherwise extract settings from the text object
    return {
        fontFamily: textObj.fontFamily,
        fontSize: textObj.fontSize,
        fontWeight: textObj.fontWeight,
        textAlign: textObj.textAlign,
        fill: textObj.fill,
        lineHeight: textObj.lineHeight
    };
}

// Fix selection issues for all elements on the canvas
export function fixElementSelection() {
    canvas.getObjects().forEach(obj => {
        if (obj.elementType) {
            ensureSelectable(obj);
        }
    });
    canvas.renderAll();
}