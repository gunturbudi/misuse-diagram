// historyManager.js - Updated version with fixed restore functionality
import { canvas } from './core.js';
import * as utils from './utils.js';

// History configuration
const HISTORY_CONFIG = {
    maxStates: 50,
    saveDelay: 500  // Increased delay to avoid too frequent captures
};

class HistoryManager {
    constructor() {
        this.states = [];
        this.current = -1;
        this.saveTimeout = null;
        this.isSaving = false;
        this.isRestoring = false;
        this.lastSavedJSON = null;
        this.lastCaptureTime = 0;  // Track last capture time
        this.captureThrottle = 300; // Minimum time between captures (ms)
    }

    init() {
        // Clear the canvas and reset history
        this.clearHistory();
        // Capture initial state
        this.capture();
        this.setupCanvasEvents();
        this.setupKeyboardShortcuts();
        console.log("History manager initialized");
    }

    setupCanvasEvents() {
        // Capture only on significant changes (not during movements)
        canvas.on('object:added', () => {
            if (!this.isRestoring) {
                this.saveDeferredState();
            }
        });

        canvas.on('object:removed', () => {
            if (!this.isRestoring) {
                this.saveDeferredState();
            }
        });

        // Only capture after modification is complete (not during)
        canvas.on('object:modified', () => {
            if (!this.isRestoring) {
                this.saveDeferredState();
            }
        });

        // Don't capture during moving, rotating, scaling - only after modified
        // This prevents multiple rapid captures during drag operations
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Check if user is typing in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            // Undo: Ctrl+Z
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            // Redo: Ctrl+Y or Ctrl+Shift+Z
            else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                this.redo();
            }
        });
    }

    capture() {
        if (this.isSaving || this.isRestoring) return;

        // Throttle captures to prevent rapid-fire saves
        const now = Date.now();
        if (now - this.lastCaptureTime < this.captureThrottle) {
            console.log("Capture throttled - too soon after last capture");
            return;
        }

        try {
            this.isSaving = true;

            const json = JSON.stringify(canvas.toJSON([
                'elementType',
                'name',
                'connections',
                'connectionIds',
                'source',
                'target',
                'sourceId',
                'targetId',
                'id',
                'class',
                'customFontSettings',
                'isConnectionLabel',
                'labelText',
                'labelSettings',
                'labelPosition',
                '_originalScale'
            ]));

            // Check if state has actually changed
            if (json !== this.lastSavedJSON) {
                this.current++;

                // Remove any states after current position (branching history)
                if (this.current < this.states.length) {
                    this.states.splice(this.current);
                }

                this.states.push(json);

                // Limit history size
                if (this.states.length > HISTORY_CONFIG.maxStates) {
                    this.states.shift();
                    this.current--;
                }

                this.lastSavedJSON = json;
                this.lastCaptureTime = now;
                this.updateUndoRedoButtons();

                console.log(`History captured: ${this.current + 1}/${this.states.length} states`);
            } else {
                console.log("No changes detected - skipping capture");
            }
        } catch (error) {
            console.error("Error capturing history:", error);
        } finally {
            this.isSaving = false;
        }
    }

    saveDeferredState() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        this.saveTimeout = setTimeout(() => {
            this.capture();
        }, HISTORY_CONFIG.saveDelay);
    }

    undo() {
        if (this.current > 0) {
            this.current--;
            this.restore();
            this.showStatus('Undo', '#4CAF50');
        } else {
            this.showStatus('Nothing to undo', '#F44336');
        }
    }

    redo() {
        if (this.current < this.states.length - 1) {
            this.current++;
            this.restore();
            this.showStatus('Redo', '#4CAF50');
        } else {
            this.showStatus('Nothing to redo', '#F44336');
        }
    }

    restore() {
        if (!this.states[this.current]) return;

        this.isRestoring = true;
        
        try {
            const json = this.states[this.current];
            const jsonData = JSON.parse(json);
            
            // Remove all existing objects
            canvas.getObjects().forEach(obj => {
                canvas.remove(obj);
            });
            
            // Load the state
            canvas.loadFromJSON(jsonData, () => {
                // Restore connections and properties
                const idMap = new Map();
                
                // First pass: Build the ID map
                canvas.getObjects().forEach(obj => {
                    if (obj.id) {
                        idMap.set(obj.id, obj);
                    }
                });
                
                // Second pass: Reconnect objects
                canvas.getObjects().forEach(obj => {
                    if (obj.connectionIds && Array.isArray(obj.connectionIds)) {
                        obj.connections = obj.connectionIds.map(id => idMap.get(id)).filter(Boolean);
                    }
                    
                    if (obj.sourceId) obj.source = idMap.get(obj.sourceId);
                    if (obj.targetId) obj.target = idMap.get(obj.targetId);
                    
                    // Ensure proper event handling
                    if (obj.elementType) {
                        obj.selectable = true;
                        obj.evented = true;
                    }
                });
                
                // Update connections
                import('./connections.js').then(connections => {
                    canvas.getObjects().forEach(obj => {
                        if (obj.connections && obj.connections.length > 0) {
                            connections.updateElementConnections(obj);
                        }
                    });

                    // Render all
                    canvas.renderAll();

                    // Update buttons
                    this.updateUndoRedoButtons();

                    // Update last saved JSON
                    this.lastSavedJSON = json;

                    console.log(`History restored: state ${this.current + 1}/${this.states.length}`);

                    // Done restoring
                    this.isRestoring = false;
                }).catch(error => {
                    console.error("Error in restoration:", error);
                    this.isRestoring = false;
                });
            });
        } catch (error) {
            console.error('Error restoring state:', error);
            this.isRestoring = false;
        }
    }

    updateUndoRedoButtons() {
        this.ensureUndoRedoButtons();
        
        const undoBtn = document.getElementById('undo-btn');
        const redoBtn = document.getElementById('redo-btn');
        
        if (undoBtn) {
            undoBtn.disabled = this.current <= 0;
            undoBtn.title = `Undo (${this.current}/${this.states.length - 1})`;
        }
        if (redoBtn) {
            redoBtn.disabled = this.current >= this.states.length - 1;
            redoBtn.title = `Redo (${this.current}/${this.states.length - 1})`;
        }
    }

    ensureUndoRedoButtons() {
        if (!document.getElementById('undo-btn')) {
            const header = document.querySelector('.header div');
            if (header) {
                const undoBtn = document.createElement('button');
                undoBtn.id = 'undo-btn';
                undoBtn.className = 'btn btn-secondary';
                undoBtn.innerHTML = '<i class="fas fa-undo"></i> Undo';
                undoBtn.title = 'Undo (Ctrl+Z)';
                undoBtn.addEventListener('click', () => this.undo());
                
                const redoBtn = document.createElement('button');
                redoBtn.id = 'redo-btn';
                redoBtn.className = 'btn btn-secondary';
                redoBtn.innerHTML = '<i class="fas fa-redo"></i> Redo';
                redoBtn.title = 'Redo (Ctrl+Y)';
                redoBtn.addEventListener('click', () => this.redo());
                
                // Find the fix button and insert after it
                const fixBtn = document.getElementById('fix-interaction-btn');
                if (fixBtn && fixBtn.parentNode) {
                    fixBtn.parentNode.insertBefore(undoBtn, fixBtn.nextSibling);
                    fixBtn.parentNode.insertBefore(redoBtn, undoBtn.nextSibling);
                } else {
                    header.appendChild(undoBtn);
                    header.appendChild(redoBtn);
                }
            }
        }
    }

    showStatus(message, color = '#4CAF50') {
        const connectionHelp = document.getElementById('connection-help');
        if (connectionHelp) {
            connectionHelp.textContent = message;
            connectionHelp.className = 'connection-help';
            
            if (color === '#4CAF50') {
                connectionHelp.classList.add('success');
            } else {
                connectionHelp.classList.add('error');
            }
            
            connectionHelp.classList.add('active');
            
            setTimeout(() => {
                connectionHelp.classList.remove('active');
            }, 1500);
        }
    }

    clearHistory() {
        this.states = [];
        this.current = -1;
        this.lastSavedJSON = null;
        this.updateUndoRedoButtons();
    }

    getHistoryInfo() {
        return {
            total: this.states.length,
            current: this.current + 1,
            canUndo: this.current > 0,
            canRedo: this.current < this.states.length - 1
        };
    }
}

const historyManager = new HistoryManager();
export default historyManager;