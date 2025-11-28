// clipboardManager.js - Advanced copy/paste/duplicate functionality
import { canvas, ELEMENT_TYPES } from './core.js';
import { showConnectionHelp } from './ui.js';
import * as elements from './elements.js';
import * as connections from './connections.js';

class ClipboardManager {
    constructor() {
        this.clipboard = null;
        this.clipboardConnections = [];
        this.offsetX = 20; // Offset for paste to avoid overlapping
        this.offsetY = 20;
    }

    init() {
        this.setupKeyboardShortcuts();
        console.log("Clipboard manager initialized");
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Skip if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Copy: Ctrl+C
            if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
                e.preventDefault();
                this.copy();
            }
            // Paste: Ctrl+V
            else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
                e.preventDefault();
                this.paste();
            }
            // Duplicate: Ctrl+D
            else if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.duplicate();
            }
        });
    }

    copy() {
        const activeObject = canvas.getActiveObject();

        if (!activeObject) {
            showConnectionHelp(true, "No element selected to copy", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Check if it's a connection (we don't allow copying connections directly)
        if (this.isConnection(activeObject)) {
            showConnectionHelp(true, "Cannot copy connections. Copy the connected elements instead.", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Clone the object
        activeObject.clone((cloned) => {
            this.clipboard = cloned;

            // Store connection information (but not the connections themselves)
            this.clipboardConnections = [];
            if (activeObject.connections && activeObject.connections.length > 0) {
                activeObject.connections.forEach(conn => {
                    this.clipboardConnections.push({
                        type: conn.elementType,
                        isSource: conn.source === activeObject,
                        isTarget: conn.target === activeObject,
                        otherElementId: conn.source === activeObject ?
                            (conn.target ? conn.target.id : null) :
                            (conn.source ? conn.source.id : null)
                    });
                });
            }

            showConnectionHelp(true, "Element copied to clipboard", "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        }, [
            'elementType',
            'name',
            'id',
            'customFontSettings',
            'class',
            '_originalScale'
        ]);
    }

    paste() {
        if (!this.clipboard) {
            showConnectionHelp(true, "Clipboard is empty. Copy an element first.", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Clone from clipboard
        this.clipboard.clone((clonedObj) => {
            // Generate new ID
            clonedObj.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

            // Reset connections (they will be empty for pasted object)
            clonedObj.connections = [];

            // Position with offset
            clonedObj.set({
                left: clonedObj.left + this.offsetX,
                top: clonedObj.top + this.offsetY,
                evented: true,
                selectable: true
            });

            // Ensure element is properly configured
            if (clonedObj.type === 'group' && clonedObj._objects) {
                clonedObj._objects.forEach(obj => {
                    obj.evented = true;
                });
            }

            // Add to canvas
            canvas.add(clonedObj);
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();

            // Auto-increment offset for next paste
            this.offsetX += 20;
            this.offsetY += 20;

            // Reset offset if it gets too large
            if (this.offsetX > 100) {
                this.offsetX = 20;
                this.offsetY = 20;
            }

            showConnectionHelp(true, "Element pasted successfully", "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        }, [
            'elementType',
            'name',
            'id',
            'customFontSettings',
            'class',
            '_originalScale'
        ]);
    }

    duplicate() {
        const activeObject = canvas.getActiveObject();

        if (!activeObject) {
            showConnectionHelp(true, "No element selected to duplicate", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Check if it's a connection
        if (this.isConnection(activeObject)) {
            showConnectionHelp(true, "Cannot duplicate connections", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Clone and immediately paste
        activeObject.clone((clonedObj) => {
            // Generate new ID
            clonedObj.id = 'elem_' + Date.now() + '_' + Math.floor(Math.random() * 10000);

            // Reset connections
            clonedObj.connections = [];

            // Position with offset
            clonedObj.set({
                left: clonedObj.left + 20,
                top: clonedObj.top + 20,
                evented: true,
                selectable: true
            });

            // Ensure element is properly configured
            if (clonedObj.type === 'group' && clonedObj._objects) {
                clonedObj._objects.forEach(obj => {
                    obj.evented = true;
                });
            }

            // Add to canvas
            canvas.add(clonedObj);
            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();

            showConnectionHelp(true, "Element duplicated successfully", "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        }, [
            'elementType',
            'name',
            'id',
            'customFontSettings',
            'class',
            '_originalScale'
        ]);
    }

    // Helper to check if object is a connection
    isConnection(obj) {
        return obj && obj.elementType && [
            ELEMENT_TYPES.ASSOCIATION,
            ELEMENT_TYPES.INCLUDE,
            ELEMENT_TYPES.EXTEND,
            ELEMENT_TYPES.GENERALIZATION,
            ELEMENT_TYPES.THREATENS
        ].includes(obj.elementType);
    }

    // Advanced: Copy multiple selected objects
    copySelection() {
        const activeSelection = canvas.getActiveObject();

        if (!activeSelection || activeSelection.type !== 'activeSelection') {
            showConnectionHelp(true, "No selection to copy", "error");
            setTimeout(() => showConnectionHelp(false), 2000);
            return;
        }

        // Clone the entire selection
        activeSelection.clone((cloned) => {
            this.clipboard = cloned;
            showConnectionHelp(true, `${activeSelection._objects.length} elements copied`, "success");
            setTimeout(() => showConnectionHelp(false), 2000);
        });
    }
}

// Create singleton instance
const clipboardManager = new ClipboardManager();
export default clipboardManager;
