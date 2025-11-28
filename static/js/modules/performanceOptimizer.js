// performanceOptimizer.js - Performance optimizations for large diagrams
import { canvas } from './core.js';

class PerformanceOptimizer {
    constructor() {
        this.renderTimeout = null;
        this.renderDelay = 16; // ~60fps
        this.objectCache = new Map();
        this.isOptimized = false;
    }

    init() {
        this.setupOptimizations();
        this.monitorPerformance();
        console.log("Performance optimizer initialized");
    }

    setupOptimizations() {
        // Enable object caching for better performance
        fabric.Object.prototype.objectCaching = true;
        fabric.Object.prototype.statefullCache = true;
        fabric.Object.prototype.noScaleCache = false;
        fabric.Object.prototype.cacheProperties = [
            'fill',
            'stroke',
            'strokeWidth',
            'strokeDashArray',
            'width',
            'height',
            'paintFirst',
            'strokeUniform',
            'strokeLineCap',
            'strokeDashOffset',
            'strokeLineJoin',
            'strokeMiterLimit',
            'backgroundColor',
            'clipPath'
        ];

        // Optimize canvas rendering
        canvas.enableRetinaScaling = true;
        canvas.renderOnAddRemove = true;
        canvas.skipOffscreen = true;
        canvas.imageSmoothingEnabled = true;

        // Debounced rendering
        this.setupDebouncedRendering();

        // Optimize selection
        this.optimizeSelection();
    }

    setupDebouncedRendering() {
        // Override renderAll with debounced version
        const originalRenderAll = canvas.renderAll.bind(canvas);

        canvas.renderAll = () => {
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
            }

            this.renderTimeout = setTimeout(() => {
                originalRenderAll();
            }, this.renderDelay);
        };

        // For immediate renders when needed
        canvas.requestRenderAll = () => {
            if (this.renderTimeout) {
                clearTimeout(this.renderTimeout);
            }
            originalRenderAll();
        };
    }

    optimizeSelection() {
        // Optimize selection performance for large numbers of objects
        canvas.perPixelTargetFind = false; // Faster but less accurate
        canvas.targetFindTolerance = 5;
        canvas.skipTargetFind = false;
    }

    monitorPerformance() {
        // Monitor object count and adjust optimizations
        setInterval(() => {
            const objectCount = canvas.getObjects().length;

            if (objectCount > 100 && !this.isOptimized) {
                this.enableHeavyOptimizations();
                console.log("Heavy optimizations enabled for", objectCount, "objects");
            } else if (objectCount <= 100 && this.isOptimized) {
                this.disableHeavyOptimizations();
                console.log("Heavy optimizations disabled");
            }
        }, 5000); // Check every 5 seconds
    }

    enableHeavyOptimizations() {
        this.isOptimized = true;

        // Increase render delay
        this.renderDelay = 32; // ~30fps

        // Disable some visual effects
        canvas.getObjects().forEach(obj => {
            if (obj.shadow) {
                obj._originalShadow = obj.shadow;
                obj.set('shadow', null);
            }
        });

        // Reduce selection border quality
        fabric.Object.prototype.borderScaleFactor = 1;

        console.log("Performance mode: OPTIMIZED");
    }

    disableHeavyOptimizations() {
        this.isOptimized = false;

        // Reset render delay
        this.renderDelay = 16; // ~60fps

        // Restore visual effects
        canvas.getObjects().forEach(obj => {
            if (obj._originalShadow) {
                obj.set('shadow', obj._originalShadow);
                delete obj._originalShadow;
            }
        });

        // Restore selection border quality
        fabric.Object.prototype.borderScaleFactor = 1.5;

        console.log("Performance mode: NORMAL");
    }

    // Batch operations for better performance
    batchAdd(objects) {
        canvas.renderOnAddRemove = false;

        objects.forEach(obj => {
            canvas.add(obj);
        });

        canvas.renderOnAddRemove = true;
        canvas.requestRenderAll();
    }

    batchRemove(objects) {
        canvas.renderOnAddRemove = false;

        objects.forEach(obj => {
            canvas.remove(obj);
        });

        canvas.renderOnAddRemove = true;
        canvas.requestRenderAll();
    }

    // Optimize connection updates
    batchUpdateConnections(elements) {
        canvas.renderOnAddRemove = false;

        import('./connections.js').then(connections => {
            elements.forEach(element => {
                if (element.connections && element.connections.length > 0) {
                    connections.updateElementConnections(element);
                }
            });

            canvas.renderOnAddRemove = true;
            canvas.requestRenderAll();
        });
    }

    // Memory cleanup
    cleanup() {
        this.objectCache.clear();

        // Force garbage collection by removing references
        canvas.getObjects().forEach(obj => {
            if (obj._cacheCanvas) {
                obj._cacheCanvas = null;
            }
            if (obj._cacheContext) {
                obj._cacheContext = null;
            }
        });

        console.log("Performance optimizer: Memory cleanup completed");
    }

    // Get performance statistics
    getStats() {
        const objects = canvas.getObjects();
        const connections = objects.filter(obj =>
            obj.elementType &&
            ['association', 'include', 'extend', 'generalization', 'threatens'].includes(obj.elementType)
        );
        const elements = objects.filter(obj =>
            obj.elementType &&
            !['association', 'include', 'extend', 'generalization', 'threatens'].includes(obj.elementType)
        );

        return {
            totalObjects: objects.length,
            elements: elements.length,
            connections: connections.length,
            isOptimized: this.isOptimized,
            renderDelay: this.renderDelay,
            fps: Math.round(1000 / this.renderDelay)
        };
    }

    // Export stats for debugging
    logStats() {
        const stats = this.getStats();
        console.table(stats);
    }
}

// Create singleton
const performanceOptimizer = new PerformanceOptimizer();
export default performanceOptimizer;
