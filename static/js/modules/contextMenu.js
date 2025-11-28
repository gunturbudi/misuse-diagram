// contextMenu.js - Right-click context menu system
import { canvas, ELEMENT_TYPES } from './core.js';
import { showConnectionHelp } from './ui.js';
import clipboardManager from './clipboardManager.js';

class ContextMenu {
    constructor() {
        this.menu = null;
        this.targetObject = null;
    }

    init() {
        this.createMenuElement();
        this.setupCanvasRightClick();
        console.log("Context menu initialized");
    }

    createMenuElement() {
        // Remove existing menu if present
        const existingMenu = document.getElementById('context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        // Create menu element
        this.menu = document.createElement('div');
        this.menu.id = 'context-menu';
        this.menu.className = 'context-menu';
        this.menu.style.display = 'none';
        document.body.appendChild(this.menu);

        // Hide menu when clicking elsewhere
        document.addEventListener('click', () => {
            this.hide();
        });

        // Prevent menu from closing when clicking inside it
        this.menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }

    setupCanvasRightClick() {
        // Disable default context menu on canvas
        const canvasElement = document.querySelector('.canvas-container');
        if (canvasElement) {
            canvasElement.addEventListener('contextmenu', (e) => {
                e.preventDefault();
            });
        }

        // Handle right-click on canvas objects
        canvas.on('mouse:down', (options) => {
            if (options.button === 3 || (options.e && options.e.button === 2)) {
                // Right-click detected
                options.e.preventDefault();
                this.show(options.e, options.target);
            }
        });
    }

    show(event, target) {
        this.targetObject = target;

        // Clear existing menu items
        this.menu.innerHTML = '';

        if (!target) {
            // Canvas background menu
            this.addCanvasMenuItems();
        } else if (this.isConnection(target)) {
            // Connection menu
            this.addConnectionMenuItems(target);
        } else if (target.elementType) {
            // Element menu
            this.addElementMenuItems(target);
        }

        // Position menu
        this.menu.style.left = event.clientX + 'px';
        this.menu.style.top = event.clientY + 'px';
        this.menu.style.display = 'block';

        // Adjust if menu goes off-screen
        setTimeout(() => {
            const rect = this.menu.getBoundingClientRect();
            if (rect.right > window.innerWidth) {
                this.menu.style.left = (window.innerWidth - rect.width - 10) + 'px';
            }
            if (rect.bottom > window.innerHeight) {
                this.menu.style.top = (window.innerHeight - rect.height - 10) + 'px';
            }
        }, 0);
    }

    hide() {
        if (this.menu) {
            this.menu.style.display = 'none';
        }
        this.targetObject = null;
    }

    addMenuItem(icon, label, callback, danger = false) {
        const item = document.createElement('div');
        item.className = 'context-menu-item' + (danger ? ' danger' : '');
        item.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${label}</span>
        `;
        item.addEventListener('click', () => {
            callback();
            this.hide();
        });
        this.menu.appendChild(item);
    }

    addSeparator() {
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        this.menu.appendChild(separator);
    }

    addCanvasMenuItems() {
        this.addMenuItem('paste', 'Paste', () => {
            clipboardManager.paste();
        });

        this.addSeparator();

        this.addMenuItem('expand-arrows-alt', 'Fit to Screen', () => {
            this.fitToScreen();
        });

        this.addMenuItem('sync-alt', 'Reset View', () => {
            import('./utils.js').then(utils => {
                utils.zoom.zoomReset();
                utils.pan.reset();
            });
        });
    }

    addElementMenuItems(element) {
        // Copy
        this.addMenuItem('copy', 'Copy', () => {
            canvas.setActiveObject(element);
            clipboardManager.copy();
        });

        // Duplicate
        this.addMenuItem('clone', 'Duplicate', () => {
            canvas.setActiveObject(element);
            clipboardManager.duplicate();
        });

        this.addSeparator();

        // Layer controls
        this.addMenuItem('arrow-up', 'Bring to Front', () => {
            element.bringToFront();
            canvas.renderAll();
            showConnectionHelp(true, "Element brought to front", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addMenuItem('arrow-down', 'Send to Back', () => {
            element.sendToBack();
            canvas.renderAll();
            showConnectionHelp(true, "Element sent to back", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addMenuItem('level-up-alt', 'Bring Forward', () => {
            element.bringForward();
            canvas.renderAll();
            showConnectionHelp(true, "Element moved forward", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addMenuItem('level-down-alt', 'Send Backward', () => {
            element.sendBackwards();
            canvas.renderAll();
            showConnectionHelp(true, "Element moved backward", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addSeparator();

        // Lock/Unlock
        if (element.lockMovementX || element.lockMovementY) {
            this.addMenuItem('unlock', 'Unlock', () => {
                element.set({
                    lockMovementX: false,
                    lockMovementY: false,
                    lockRotation: false,
                    lockScalingX: false,
                    lockScalingY: false
                });
                canvas.renderAll();
                showConnectionHelp(true, "Element unlocked", "success");
                setTimeout(() => showConnectionHelp(false), 1500);
            });
        } else {
            this.addMenuItem('lock', 'Lock Position', () => {
                element.set({
                    lockMovementX: true,
                    lockMovementY: true
                });
                canvas.renderAll();
                showConnectionHelp(true, "Element locked", "success");
                setTimeout(() => showConnectionHelp(false), 1500);
            });
        }

        this.addSeparator();

        // Delete
        this.addMenuItem('trash', 'Delete', () => {
            canvas.setActiveObject(element);
            this.deleteElement(element);
        }, true);
    }

    addConnectionMenuItems(connection) {
        // Change connection style
        this.addMenuItem('pencil-alt', 'Edit Label', () => {
            this.editConnectionLabel(connection);
        });

        this.addSeparator();

        // Layer controls for connections
        this.addMenuItem('arrow-up', 'Bring to Front', () => {
            connection.bringToFront();
            if (connection.arrowhead) connection.arrowhead.bringToFront();
            if (connection.text) connection.text.bringToFront();
            if (connection.label) connection.label.bringToFront();
            canvas.renderAll();
            showConnectionHelp(true, "Connection brought to front", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addMenuItem('arrow-down', 'Send to Back', () => {
            connection.sendToBack();
            if (connection.arrowhead) connection.arrowhead.sendToBack();
            if (connection.text) connection.text.sendToBack();
            if (connection.label) connection.label.sendToBack();
            canvas.renderAll();
            showConnectionHelp(true, "Connection sent to back", "success");
            setTimeout(() => showConnectionHelp(false), 1500);
        });

        this.addSeparator();

        // Delete connection
        this.addMenuItem('trash', 'Delete Connection', () => {
            this.deleteConnection(connection);
        }, true);
    }

    deleteElement(element) {
        if (!element) return;

        // Handle connections
        if (element.connections && element.connections.length > 0) {
            const connections = [...element.connections];

            connections.forEach(conn => {
                this.deleteConnection(conn);
            });
        }

        // Remove the element
        canvas.remove(element);
        canvas.requestRenderAll();

        showConnectionHelp(true, "Element deleted", "success");
        setTimeout(() => showConnectionHelp(false), 1500);
    }

    deleteConnection(connection) {
        if (!connection) return;

        // Remove connection label
        if (connection.label) {
            canvas.remove(connection.label);
        }

        // Remove connection text
        if (connection.text) {
            canvas.remove(connection.text);
        }

        // Remove arrowhead
        if (connection.arrowhead) {
            canvas.remove(connection.arrowhead);
        }

        // Remove from source and target connections arrays
        if (connection.source && connection.source.connections) {
            connection.source.connections = connection.source.connections.filter(c => c !== connection);
        }
        if (connection.target && connection.target.connections) {
            connection.target.connections = connection.target.connections.filter(c => c !== connection);
        }

        // Remove the connection line
        canvas.remove(connection);
        canvas.requestRenderAll();

        showConnectionHelp(true, "Connection deleted", "success");
        setTimeout(() => showConnectionHelp(false), 1500);
    }

    editConnectionLabel(connection) {
        // Create or edit label
        import('./connections.js').then(conn => {
            if (!connection.label) {
                conn.addConnectionLabel(connection, 'Label');
            }
            if (connection.label) {
                canvas.setActiveObject(connection.label);
                connection.label.enterEditing();
                connection.label.selectAll();
            }
        });
    }

    fitToScreen() {
        const objects = canvas.getObjects().filter(obj => obj.elementType);
        if (objects.length === 0) return;

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
        const contentWidth = maxX - minX + padding * 2;
        const contentHeight = maxY - minY + padding * 2;

        // Calculate zoom to fit
        const zoomX = canvas.width / contentWidth;
        const zoomY = canvas.height / contentHeight;
        const zoom = Math.min(zoomX, zoomY, 2); // Max zoom 2x

        // Calculate center offset
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        // Apply zoom and pan
        canvas.setZoom(zoom);
        const vpt = canvas.viewportTransform;
        vpt[4] = canvas.width / 2 - centerX * zoom;
        vpt[5] = canvas.height / 2 - centerY * zoom;
        canvas.requestRenderAll();

        showConnectionHelp(true, "Fitted to screen", "success");
        setTimeout(() => showConnectionHelp(false), 1500);
    }

    isConnection(obj) {
        return obj && obj.elementType && [
            ELEMENT_TYPES.ASSOCIATION,
            ELEMENT_TYPES.INCLUDE,
            ELEMENT_TYPES.EXTEND,
            ELEMENT_TYPES.GENERALIZATION,
            ELEMENT_TYPES.THREATENS
        ].includes(obj.elementType);
    }
}

// Create singleton
const contextMenu = new ContextMenu();
export default contextMenu;
