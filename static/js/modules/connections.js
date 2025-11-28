// connections.js - Simplified connection creation and handling
import { canvas, ELEMENT_TYPES, connectingElement, setConnectingElement, connectionStep, setConnectionStep, resetElementAppearance } from './core.js';
import { showConnectionHelp } from './ui.js';

// Function to calculate the connection points at the edge of elements
export function calculateConnectionPoints(source, target) {
    try {
        if (!source || !target) {
            console.error("Invalid source or target for connection point calculation");
            return { 
                source: { x: 0, y: 0 }, 
                target: { x: 0, y: 0 } 
            };
        }
        
        // Get the center points of both elements
        const sourceCenter = source.getCenterPoint();
        const targetCenter = target.getCenterPoint();
        
        // Initialize the connection points
        let sourcePoint = { x: sourceCenter.x, y: sourceCenter.y };
        let targetPoint = { x: targetCenter.x, y: targetCenter.y };
        
        // Calculate the angle between the two elements
        const angle = Math.atan2(targetCenter.y - sourceCenter.y, targetCenter.x - sourceCenter.x);
        
        // For actors and misusers (stick figures)
        if (source.elementType === ELEMENT_TYPES.ACTOR || source.elementType === ELEMENT_TYPES.MISUSER) {
            // Use actual dimensions considering scaling
            const width = 30 * source.scaleX;
            const height = 75 * source.scaleY;
            
            // Consider rotation in calculations if present
            const rotatedAngle = source.angle ? angle - (source.angle * Math.PI / 180) : angle;
            sourcePoint.x = sourceCenter.x + Math.cos(rotatedAngle) * width / 2;
            sourcePoint.y = sourceCenter.y + Math.sin(rotatedAngle) * height / 2;
        }
        // For use cases and misuse cases (ovals)
        else if (source.elementType === ELEMENT_TYPES.USECASE || source.elementType === ELEMENT_TYPES.MISUSE_CASE) {
            // Get the actual dimensions of the ellipse considering scaling
            if (source.getObjects && source.getObjects()[0]) {
                const ellipse = source.getObjects()[0];
                const rx = ellipse.rx * source.scaleX; 
                const ry = ellipse.ry * source.scaleY;
                
                // Consider rotation in calculations if present
                const rotatedAngle = source.angle ? angle - (source.angle * Math.PI / 180) : angle;
                sourcePoint.x = sourceCenter.x + rx * Math.cos(rotatedAngle);
                sourcePoint.y = sourceCenter.y + ry * Math.sin(rotatedAngle);
            }
        }
        // For systems (rectangles)
        else if (source.elementType === ELEMENT_TYPES.SYSTEM) {
            // Get actual dimensions considering scaling
            if (source.getObjects && source.getObjects()[0]) {
                const rect = source.getObjects()[0];
                const width = rect.width * source.scaleX;
                const height = rect.height * source.scaleY;
                
                // Calculate intersection point with rectangle edge
                const dx = Math.abs(sourceCenter.x - targetCenter.x);
                const dy = Math.abs(sourceCenter.y - targetCenter.y);
                
                // Avoid division by zero
                if (dx === 0 && dy === 0) {
                    return { source: sourcePoint, target: targetPoint };
                }
                
                // Calculate the distance to intersection based on aspect ratio
                let factor;
                
                if (dx * height > dy * width) {
                    // Intersects with left or right edge
                    factor = width / 2 / dx;
                } else {
                    // Intersects with top or bottom edge
                    factor = height / 2 / dy;
                }
                
                // Calculate intersection point
                sourcePoint.x = sourceCenter.x + (targetCenter.x - sourceCenter.x) * factor;
                sourcePoint.y = sourceCenter.y + (targetCenter.y - sourceCenter.y) * factor;
            }
        }
        
        // Same process for the target element
        if (target.elementType === ELEMENT_TYPES.ACTOR || target.elementType === ELEMENT_TYPES.MISUSER) {
            const width = 30 * target.scaleX;
            const height = 75 * target.scaleY;
            
            // Calculate the point on the edge of the stick figure (in opposite direction)
            const oppositeAngle = angle + Math.PI;
            const rotatedAngle = target.angle ? oppositeAngle - (target.angle * Math.PI / 180) : oppositeAngle;
            targetPoint.x = targetCenter.x + Math.cos(rotatedAngle) * width / 2;
            targetPoint.y = targetCenter.y + Math.sin(rotatedAngle) * height / 2;
        }
        else if (target.elementType === ELEMENT_TYPES.USECASE || target.elementType === ELEMENT_TYPES.MISUSE_CASE) {
            if (target.getObjects && target.getObjects()[0]) {
                const ellipse = target.getObjects()[0];
                const rx = ellipse.rx * target.scaleX;
                const ry = ellipse.ry * target.scaleY;
                
                // Calculate the point on the edge of the ellipse (in opposite direction)
                const oppositeAngle = angle + Math.PI;
                const rotatedAngle = target.angle ? oppositeAngle - (target.angle * Math.PI / 180) : oppositeAngle;
                targetPoint.x = targetCenter.x + rx * Math.cos(rotatedAngle);
                targetPoint.y = targetCenter.y + ry * Math.sin(rotatedAngle);
            }
        }
        else if (target.elementType === ELEMENT_TYPES.SYSTEM) {
            // Get actual dimensions considering scaling
            if (target.getObjects && target.getObjects()[0]) {
                const rect = target.getObjects()[0];
                const width = rect.width * target.scaleX;
                const height = rect.height * target.scaleY;
                
                // Calculate intersection point with rectangle edge
                const dx = Math.abs(targetCenter.x - sourceCenter.x);
                const dy = Math.abs(targetCenter.y - sourceCenter.y);
                
                // Avoid division by zero
                if (dx === 0 && dy === 0) {
                    return { source: sourcePoint, target: targetPoint };
                }
                
                // Calculate the distance to intersection based on aspect ratio
                let factor;
                
                if (dx * height > dy * width) {
                    // Intersects with left or right edge
                    factor = width / 2 / dx;
                } else {
                    // Intersects with top or bottom edge
                    factor = height / 2 / dy;
                }
                
                // Calculate intersection point
                targetPoint.x = targetCenter.x + (sourceCenter.x - targetCenter.x) * factor;
                targetPoint.y = targetCenter.y + (sourceCenter.y - targetCenter.y) * factor;
            }
        }
        
        return { source: sourcePoint, target: targetPoint };
    } catch (error) {
        console.error("Error calculating connection points:", error);
        return { 
            source: { x: 0, y: 0 }, 
            target: { x: 0, y: 0 } 
        };
    }
}

// Export updateConnectedElements for use in other modules
export { updateConnectedElements };

// Create association connection (simple line between elements)
export function createAssociation(source, target) {
    try {
        if (!source || !target) {
            console.error("Cannot create association: source or target is missing");
            return null;
        }
        
        // Calculate edge connection points
        const points = calculateConnectionPoints(source, target);
        
        // Create a simple line with improved hit detection
        const line = new fabric.Line(
            [points.source.x, points.source.y, points.target.x, points.target.y],
            {
                stroke: 'black',
                strokeWidth: 2,
                selectable: true,
                evented: true,
                source: source,
                target: target,
                elementType: ELEMENT_TYPES.ASSOCIATION,
                hoverCursor: 'pointer',
                objectCaching: false,
                perPixelTargetFind: true, // Better hit detection for thin lines
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                targetFindTolerance: 15, // IMPROVED: Much larger hit area for easier selection
                padding: 10 // IMPROVED: Add padding for easier interaction
            }
        );
        
        // Add to connections arrays of both elements
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        source.connections.push(line);
        target.connections.push(line);
        
        // No default label for association
        line.labelText = '';
        
        // Add to canvas
        canvas.add(line);
        
        return line;
    } catch (error) {
        console.error("Error creating association:", error);
        return null;
    }
}

// Create include relationship
export function createInclude(source, target) {
    try {
        if (!source || !target) {
            console.error("Cannot create include relationship: source or target is missing");
            return null;
        }
        
        // Calculate edge connection points
        const points = calculateConnectionPoints(source, target);
        
        // Calculate the arrow direction
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Create a dashed line with improved hit detection
        const line = new fabric.Line(
            [points.source.x, points.source.y, points.target.x, points.target.y],
            {
                stroke: 'black',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                evented: true,
                source: source,
                target: target,
                elementType: ELEMENT_TYPES.INCLUDE,
                hoverCursor: 'pointer',
                objectCaching: false,
                perPixelTargetFind: true,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                targetFindTolerance: 15, // IMPROVED: Larger hit area
                padding: 10 // IMPROVED: Add padding
            }
        );
        
        // Create arrowhead
        const arrowSize = 10;
        const arrowhead = new fabric.Triangle({
            width: arrowSize,
            height: arrowSize,
            fill: 'black',
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90,
            originX: 'center',
            originY: 'center',
            selectable: false,
            objectCaching: false
        });
        
        // Create <<include>> text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        const text = new fabric.Text('<<include>>', {
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            fill: 'black',
            backgroundColor: 'white',
            left: midX,
            top: midY,
            originX: 'center',
            originY: 'center',
            selectable: false,
            padding: 3,
            objectCaching: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.1)',
                blur: 3,
                offsetX: 0,
                offsetY: 1
            })
        });
        
        // Add objects to canvas
        canvas.add(line);
        canvas.add(arrowhead);
        canvas.add(text);
        
        // Store references in the line object
        line.arrowhead = arrowhead;
        line.text = text;
        
        // Add to connections arrays of both elements
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        source.connections.push(line);
        target.connections.push(line);
        
        // Set label text
        line.labelText = '';
        
        return line;
    } catch (error) {
        console.error("Error creating include relationship:", error);
        return null;
    }
}

// Create extend relationship
export function createExtend(source, target) {
    try {
        if (!source || !target) {
            console.error("Cannot create extend relationship: source or target is missing");
            return null;
        }
        
        // Calculate edge connection points
        const points = calculateConnectionPoints(source, target);
        
        // Calculate the arrow direction
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Create a dashed line with improved hit detection
        const line = new fabric.Line(
            [points.source.x, points.source.y, points.target.x, points.target.y],
            {
                stroke: 'black',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                evented: true,
                source: source,
                target: target,
                elementType: ELEMENT_TYPES.EXTEND,
                hoverCursor: 'pointer',
                objectCaching: false,
                perPixelTargetFind: true,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                targetFindTolerance: 15, // IMPROVED: Larger hit area
                padding: 10 // IMPROVED: Add padding
            }
        );
        
        // Create arrowhead
        const arrowSize = 10;
        const arrowhead = new fabric.Triangle({
            width: arrowSize,
            height: arrowSize,
            fill: 'black',
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90,
            originX: 'center',
            originY: 'center',
            selectable: false,
            objectCaching: false
        });
        
        // Create <<extend>> text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        const text = new fabric.Text('<<extend>>', {
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            fill: 'black',
            backgroundColor: 'white',
            left: midX,
            top: midY,
            originX: 'center',
            originY: 'center',
            selectable: false,
            padding: 3,
            objectCaching: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.1)',
                blur: 3,
                offsetX: 0,
                offsetY: 1
            })
        });
        
        // Add objects to canvas
        canvas.add(line);
        canvas.add(arrowhead);
        canvas.add(text);
        
        // Store references in the line object
        line.arrowhead = arrowhead;
        line.text = text;
        
        // Add to connections arrays of both elements
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        source.connections.push(line);
        target.connections.push(line);
        
        // Set label text
        line.labelText = '';
        
        return line;
    } catch (error) {
        console.error("Error creating extend relationship:", error);
        return null;
    }
}

// Create generalization relationship
export function createGeneralization(source, target) {
    try {
        if (!source || !target) {
            console.error("Cannot create generalization: source or target is missing");
            return null;
        }
        
        // Calculate edge connection points
        const points = calculateConnectionPoints(source, target);
        
        // Calculate the arrow direction
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Create a solid line with improved hit detection
        const line = new fabric.Line(
            [points.source.x, points.source.y, points.target.x, points.target.y],
            {
                stroke: 'black',
                strokeWidth: 2,
                selectable: true,
                evented: true,
                source: source,
                target: target,
                elementType: ELEMENT_TYPES.GENERALIZATION,
                hoverCursor: 'pointer',
                objectCaching: false,
                perPixelTargetFind: true,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                targetFindTolerance: 15, // IMPROVED: Larger hit area
                padding: 10 // IMPROVED: Add padding
            }
        );
        
        // Create hollow arrowhead
        const arrowSize = 15;
        const arrowhead = new fabric.Triangle({
            width: arrowSize,
            height: arrowSize,
            fill: 'white',
            stroke: 'black',
            strokeWidth: 2,
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90,
            originX: 'center',
            originY: 'center',
            selectable: false,
            objectCaching: false
        });
        
        // Add objects to canvas
        canvas.add(line);
        canvas.add(arrowhead);
        
        // Store references in the line object
        line.arrowhead = arrowhead;
        
        // Add to connections arrays of both elements
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        source.connections.push(line);
        target.connections.push(line);
        
        // Add a label
        const label = addConnectionLabel(line, 'Generalization');
        line.label = label;
        
        return line;
    } catch (error) {
        console.error("Error creating generalization:", error);
        return null;
    }
}

// Create threatens relationship
export function createThreatens(source, target) {
    try {
        if (!source || !target) {
            console.error("Cannot create threatens relationship: source or target is missing");
            return null;
        }
        
        // Calculate edge connection points
        const points = calculateConnectionPoints(source, target);
        
        // Calculate the arrow direction
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Create a dashed red line with improved hit detection
        const line = new fabric.Line(
            [points.source.x, points.source.y, points.target.x, points.target.y],
            {
                stroke: '#dc3545',
                strokeWidth: 2,
                strokeDashArray: [5, 5],
                selectable: true,
                evented: true,
                source: source,
                target: target,
                elementType: ELEMENT_TYPES.THREATENS,
                hoverCursor: 'pointer',
                objectCaching: false,
                perPixelTargetFind: true,
                strokeLineCap: 'round',
                strokeLineJoin: 'round',
                targetFindTolerance: 15, // IMPROVED: Larger hit area
                padding: 10 // IMPROVED: Add padding
            }
        );
        
        // Create arrowhead
        const arrowSize = 10;
        const arrowhead = new fabric.Triangle({
            width: arrowSize,
            height: arrowSize,
            fill: '#dc3545',
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90,
            originX: 'center',
            originY: 'center',
            selectable: false,
            objectCaching: false
        });
        
        // Create <<threatens>> text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        const text = new fabric.Text('<<threatens>>', {
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            fill: '#dc3545',
            backgroundColor: 'white',
            left: midX,
            top: midY,
            originX: 'center',
            originY: 'center',
            selectable: false,
            padding: 3,
            objectCaching: false,
            shadow: new fabric.Shadow({
                color: 'rgba(220,53,69,0.1)',
                blur: 3,
                offsetX: 0,
                offsetY: 1
            })
        });
        
        // Add objects to canvas
        canvas.add(line);
        canvas.add(arrowhead);
        canvas.add(text);
        
        // Store references in the line object
        line.arrowhead = arrowhead;
        line.text = text;
        
        // Add to connections arrays of both elements
        if (!source.connections) source.connections = [];
        if (!target.connections) target.connections = [];
        
        source.connections.push(line);
        target.connections.push(line);
        
        // Set label text (no additional label needed)
        line.labelText = '';
        
        return line;
    } catch (error) {
        console.error("Error creating threatens relationship:", error);
        return null;
    }
}

// Add a label to a connection
export function addConnectionLabel(connection, defaultText = '') {
    try {
        // Skip if the connection already has a label
        if (connection.label) return connection.label;
        
        // Create text object for the label
        const label = new fabric.Textbox(defaultText, {
            fontSize: 12,
            fontFamily: 'Inter, sans-serif',
            backgroundColor: 'white',
            fill: '#333333',
            padding: 3,
            width: 120,
            textAlign: 'center',
            originX: 'center',
            originY: 'center',
            selectable: true,
            hasControls: true,
            hasBorders: true,
            hoverCursor: 'pointer',
            borderColor: '#4a6fff',
            cornerColor: '#4a6fff',
            cornerSize: 6,
            transparentCorners: false,
            editable: true,
            objectCaching: false,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.1)',
                blur: 3,
                offsetX: 0,
                offsetY: 1,
                nonScaling: true
            })
        });
        
        // Position the label
        updateLabelPosition(connection, label);
        
        // Add the label to the canvas
        canvas.add(label);
        
        // Store reference to the label
        connection.label = label;
        
        // Store reference to the connection in the label
        label.connection = connection;
        
        // Add a custom property to identify this as a connection label
        label.isConnectionLabel = true;
        
        // Event handlers for editing
        label.on('selected', function() {
            this.set('editable', true);
            canvas.renderAll();
        });
        
        label.on('editing:entered', function() {
            this._originalFontWeight = this.fontWeight || 'normal';
        });
        
        label.on('editing:exited', function() {
            if (this.connection) {
                this.connection.labelText = this.text;
            }
        });
        
        return label;
    } catch (error) {
        console.error("Error adding connection label:", error);
        return null;
    }
}

// Update the position of a connection label
export function updateLabelPosition(connection, label) {
    try {
        if (!label || !connection) return;
        
        if (!connection.source || !connection.target) return;
        
        // Calculate the midpoint of the connection
        const x1 = connection.x1 !== undefined ? connection.x1 : 0;
        const y1 = connection.y1 !== undefined ? connection.y1 : 0;
        const x2 = connection.x2 !== undefined ? connection.x2 : 0;
        const y2 = connection.y2 !== undefined ? connection.y2 : 0;
        
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 15; // Position slightly above the line
        
        // Update label position
        label.set({
            left: midX,
            top: midY
        });
    } catch (error) {
        console.error("Error updating label position:", error);
    }
}

// This is the fixed updateElementConnections function for connections.js
// Add this to your connections.js file

// Main function to update all connections for an element
export function updateElementConnections(element) {
    try {
        if (!element || !element.connections) return;
        
        // Ensure connections array is valid
        if (!Array.isArray(element.connections)) {
            console.warn("Invalid connections array for element:", element);
            element.connections = [];
            return;
        }
        
        // Filter out any null or undefined connections
        element.connections = element.connections.filter(conn => conn);
        
        if (element.connections.length === 0) return;
        
        // Update each connection
        element.connections.forEach(connection => {
            if (!connection) return;
            
            // Skip connections without proper type
            if (!connection.elementType) {
                console.warn("Connection without elementType:", connection);
                return;
            }
            
            // Check for valid source and target
            if (!connection.source || !connection.target) {
                console.warn("Connection with missing source or target:", connection);
                return;
            }
            
            if (connection.elementType === ELEMENT_TYPES.ASSOCIATION) {
                updateAssociation(connection);
            } 
            else if (connection.elementType === ELEMENT_TYPES.THREATENS) {
                updateThreatens(connection);
            }
            else if (connection.elementType === ELEMENT_TYPES.INCLUDE) {
                updateInclude(connection);
            }
            else if (connection.elementType === ELEMENT_TYPES.EXTEND) {
                updateExtend(connection);
            }
            else if (connection.elementType === ELEMENT_TYPES.GENERALIZATION) {
                updateGeneralization(connection);
            }
        });
        
        canvas.renderAll();
    } catch (error) {
        console.error("Error updating element connections:", error);
    }
}

// Update an association connection
function updateAssociation(connection) {
    try {
        if (!connection || !connection.source || !connection.target) return;
        
        // Calculate new connection points
        const points = calculateConnectionPoints(connection.source, connection.target);
        
        // Update the line
        connection.set({
            x1: points.source.x,
            y1: points.source.y,
            x2: points.target.x,
            y2: points.target.y
        });
        
        // Update the label if it exists
        if (connection.label) {
            updateLabelPosition(connection, connection.label);
        }
    } catch (error) {
        console.error("Error updating association:", error);
    }
}

// Update a threatens connection
function updateThreatens(connection) {
    try {
        if (!connection || !connection.source || !connection.target ||
            !connection.arrowhead || !connection.text) return;
        
        // Calculate new connection points
        const points = calculateConnectionPoints(connection.source, connection.target);
        
        // Update the line
        connection.set({
            x1: points.source.x,
            y1: points.source.y,
            x2: points.target.x,
            y2: points.target.y
        });
        
        // Calculate angle for arrowhead
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Update arrowhead
        connection.arrowhead.set({
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90
        });
        
        // Update text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        connection.text.set({
            left: midX,
            top: midY
        });
    } catch (error) {
        console.error("Error updating threatens connection:", error);
    }
}

// Update an include connection
function updateInclude(connection) {
    try {
        if (!connection || !connection.source || !connection.target ||
            !connection.arrowhead || !connection.text) return;
        
        // Calculate new connection points
        const points = calculateConnectionPoints(connection.source, connection.target);
        
        // Update the line
        connection.set({
            x1: points.source.x,
            y1: points.source.y,
            x2: points.target.x,
            y2: points.target.y
        });
        
        // Calculate angle for arrowhead
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Update arrowhead
        connection.arrowhead.set({
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90
        });
        
        // Update text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        connection.text.set({
            left: midX,
            top: midY
        });
    } catch (error) {
        console.error("Error updating include connection:", error);
    }
}

// Update an extend connection
function updateExtend(connection) {
    try {
        if (!connection || !connection.source || !connection.target ||
            !connection.arrowhead || !connection.text) return;
        
        // Calculate new connection points
        const points = calculateConnectionPoints(connection.source, connection.target);
        
        // Update the line
        connection.set({
            x1: points.source.x,
            y1: points.source.y,
            x2: points.target.x,
            y2: points.target.y
        });
        
        // Calculate angle for arrowhead
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Update arrowhead
        connection.arrowhead.set({
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90
        });
        
        // Update text
        const midX = (points.source.x + points.target.x) / 2;
        const midY = (points.source.y + points.target.y) / 2 - 15;
        
        connection.text.set({
            left: midX,
            top: midY
        });
    } catch (error) {
        console.error("Error updating extend connection:", error);
    }
}

// Update a generalization connection
function updateGeneralization(connection) {
    try {
        if (!connection || !connection.source || !connection.target ||
            !connection.arrowhead) return;
        
        // Calculate new connection points
        const points = calculateConnectionPoints(connection.source, connection.target);
        
        // Update the line
        connection.set({
            x1: points.source.x,
            y1: points.source.y,
            x2: points.target.x,
            y2: points.target.y
        });
        
        // Calculate angle for arrowhead
        const dx = points.target.x - points.source.x;
        const dy = points.target.y - points.source.y;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // Update arrowhead
        connection.arrowhead.set({
            left: points.target.x,
            top: points.target.y,
            angle: angle + 90
        });
        
        // Update the label if it exists
        if (connection.label) {
            updateLabelPosition(connection, connection.label);
        }
    } catch (error) {
        console.error("Error updating generalization connection:", error);
    }
}

// Updates connections for elements connected to the given element
function updateConnectedElements(element) {
    try {
        if (!element) return;
        
        // Find all elements that have connections with this element
        canvas.getObjects().forEach(obj => {
            if (obj !== element && obj.connections && obj.connections.length > 0) {
                const needsUpdate = obj.connections.some(conn => 
                    (conn.source === element || conn.target === element)
                );
                
                if (needsUpdate) {
                    updateElementConnections(obj);
                }
            }
        });
    } catch (error) {
        console.error("Error updating connected elements:", error);
    }
}

// Function to cancel the current connection operation
export function cancelConnection() {
    try {
        // Reset the connection state
        if (connectingElement) {
            // Remove highlighting if it was applied
            resetElementAppearance(connectingElement);
            canvas.renderAll();
        }
        
        // Use setter functions instead of direct assignment
        setConnectionStep('none');
        setConnectingElement(null);
        
        // Display message
        showConnectionHelp(true, "Connection canceled", "error");
        setTimeout(() => showConnectionHelp(false), 2000);
    } catch (error) {
        console.error("Error canceling connection:", error);
        
        // Fallback - try to reset state directly
        try {
            resetElementAppearance(connectingElement);
            canvas.renderAll();
            
            // Use setter functions
            setConnectionStep('none');
            setConnectingElement(null);
        } catch (e) {
            console.error("Error in fallback connection cancellation:", e);
        }
    }
}

// Helper function to validate connection source
export function validateConnectionSource(connectionType, sourceElement) {
    try {
        if (!sourceElement) return false;
        
        switch (connectionType) {
            case 'association':
                return sourceElement.elementType === ELEMENT_TYPES.ACTOR || 
                    sourceElement.elementType === ELEMENT_TYPES.USECASE ||
                    sourceElement.elementType === ELEMENT_TYPES.MISUSER ||
                    sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE;
                
            case 'include':
            case 'extend':
                return sourceElement.elementType === ELEMENT_TYPES.USECASE;
                
            case 'generalization':
                return sourceElement.elementType === ELEMENT_TYPES.ACTOR || 
                    sourceElement.elementType === ELEMENT_TYPES.USECASE ||
                    sourceElement.elementType === ELEMENT_TYPES.MISUSER ||
                    sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE;
                
            case 'threatens':
                return sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE;
                
            default:
                return false;
        }
    } catch (error) {
        console.error("Error validating connection source:", error);
        return false;
    }
}

// Helper function to validate connection target
export function validateConnectionTarget(connectionType, sourceElement, targetElement) {
    try {
        if (!sourceElement || !targetElement) return false;
        
        switch (connectionType) {
            case 'association':
                // Actors can connect to use cases and misuse cases
                if (sourceElement.elementType === ELEMENT_TYPES.ACTOR) {
                    return targetElement.elementType === ELEMENT_TYPES.USECASE;
                }
                // Misusers can connect to misuse cases
                else if (sourceElement.elementType === ELEMENT_TYPES.MISUSER) {
                    return targetElement.elementType === ELEMENT_TYPES.MISUSE_CASE;
                }
                // Use cases can connect to actors
                else if (sourceElement.elementType === ELEMENT_TYPES.USECASE) {
                    return targetElement.elementType === ELEMENT_TYPES.ACTOR;
                }
                // Misuse cases can connect to misusers
                else if (sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE) {
                    return targetElement.elementType === ELEMENT_TYPES.MISUSER;
                }
                return false;
                
            case 'include':
            case 'extend':
                // Only between use cases
                return sourceElement.elementType === ELEMENT_TYPES.USECASE && 
                    targetElement.elementType === ELEMENT_TYPES.USECASE &&
                    sourceElement !== targetElement;
                
            case 'generalization':
                // Must be same type (actor->actor or usecase->usecase)
                return sourceElement.elementType === targetElement.elementType &&
                    sourceElement !== targetElement;
                
            case 'threatens':
                // Misuse cases can threaten use cases
                return sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE && 
                    targetElement.elementType === ELEMENT_TYPES.USECASE;
                
            default:
                return false;
        }
    } catch (error) {
        console.error("Error validating connection target:", error);
        return false;
    }
}

// Helper function to get error message for invalid source
export function getInvalidSourceMessage(connectionType, sourceElement) {
    try {
        switch (connectionType) {
            case 'association':
                return "Associations must start from an Actor, Misuser, Use Case, or Misuse Case.";
                
            case 'include':
            case 'extend':
                return `${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)} relationships must start from a Use Case.`;
                
            case 'generalization':
                return "Generalizations must start from an Actor or Use Case.";
                
            case 'threatens':
                return "Threatens relationships must start from a Misuse Case.";
                
            default:
                return "Invalid source element for this connection type.";
        }
    } catch (error) {
        console.error("Error getting invalid source message:", error);
        return "Invalid connection source.";
    }
}

// Helper function to get error message for invalid target
export function getInvalidTargetMessage(connectionType, sourceElement, targetElement) {
    try {
        if (!sourceElement) return "Invalid source element.";
        
        switch (connectionType) {
            case 'association':
                if (sourceElement.elementType === ELEMENT_TYPES.ACTOR) {
                    return "Actors can only be associated with Use Cases.";
                } else if (sourceElement.elementType === ELEMENT_TYPES.MISUSER) {
                    return "Misusers can only be associated with Misuse Cases.";
                } else if (sourceElement.elementType === ELEMENT_TYPES.USECASE) {
                    return "Use Cases can only be associated with Actors.";
                } else if (sourceElement.elementType === ELEMENT_TYPES.MISUSE_CASE) {
                    return "Misuse Cases can only be associated with Misusers.";
                }
                break;
                
            case 'include':
            case 'extend':
                return `${connectionType.charAt(0).toUpperCase() + connectionType.slice(1)} relationships can only be between two different Use Cases.`;
                
            case 'generalization':
                return "Generalizations must be between two elements of the same type (Actor-Actor or UseCase-UseCase).";
                
            case 'threatens':
                return "Threatens relationships must go from a Misuse Case to a Use Case.";
                
            default:
                return "Invalid connection.";
        }
        
        return "Invalid connection.";
    } catch (error) {
        console.error("Error getting invalid target message:", error);
        return "Invalid connection target.";
    }
}