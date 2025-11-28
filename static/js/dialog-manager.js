// dialog-manager.js - Improved dialog system with robust error handling

// Global tracking of active dialogs
const activeDialogs = new Set();

/**
 * Creates and displays a dialog with proper backdrop and error handling
 * @param {Object} options - Dialog configuration
 * @param {string} options.title - Dialog title
 * @param {string|HTMLElement} options.content - Dialog content (HTML string or element)
 * @param {Object[]} options.buttons - Array of button configurations
 * @param {string} options.buttons[].label - Button text
 * @param {string} options.buttons[].type - Button type (primary, secondary, danger)
 * @param {Function} options.buttons[].onClick - Button click handler
 * @param {string} options.size - Dialog size (small, medium, large)
 * @param {boolean} options.closeOnEscape - Whether to close on Escape key
 * @param {boolean} options.closeOnBackdropClick - Whether to close when clicking backdrop
 * @returns {Object} Dialog control object with methods to manipulate the dialog
 */
export function showDialog(options) {
    // Default options
    const config = Object.assign({
        title: 'Dialog',
        content: '',
        buttons: [{ label: 'Close', type: 'secondary', onClick: () => {} }],
        size: 'medium',
        closeOnEscape: true,
        closeOnBackdropClick: true,
        onClose: () => {}
    }, options);

    // Create backdrop with improved styling
    const backdrop = document.createElement('div');
    backdrop.className = 'dialog-backdrop';
    
    // Add animation class
    backdrop.classList.add('fade-in');
    
    // Create dialog container
    const dialog = document.createElement('div');
    dialog.className = `dialog dialog-${config.size}`;
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'dialog-title');
    
    // Add animation class
    dialog.classList.add('zoom-in');
    
    // Create dialog content
    dialog.innerHTML = `
        <div class="dialog-header">
            <h3 id="dialog-title">${config.title}</h3>
            <button class="dialog-close" aria-label="Close dialog">&times;</button>
        </div>
        <div class="dialog-content"></div>
        <div class="dialog-actions"></div>
    `;
    
    // Add content
    const contentContainer = dialog.querySelector('.dialog-content');
    if (typeof config.content === 'string') {
        contentContainer.innerHTML = config.content;
    } else if (config.content instanceof HTMLElement) {
        contentContainer.appendChild(config.content);
    }
    
    // Add buttons
    const actionsContainer = dialog.querySelector('.dialog-actions');
    config.buttons.forEach(button => {
        const btnElement = document.createElement('button');
        btnElement.className = `btn btn-${button.type || 'secondary'}`;
        btnElement.textContent = button.label;
        btnElement.addEventListener('click', (e) => {
            try {
                // Call the click handler, which might return a promise
                const result = button.onClick(e);
                
                // If it's a promise, wait for it to resolve before closing
                if (result instanceof Promise) {
                    result.finally(() => {
                        closeDialog();
                    }).catch(err => {
                        console.error('Error in dialog button handler:', err);
                        closeDialog();
                    });
                } else {
                    closeDialog();
                }
            } catch (err) {
                console.error('Error in dialog button handler:', err);
                closeDialog();
            }
        });
        actionsContainer.appendChild(btnElement);
    });
    
    // Track this dialog as active
    const dialogId = Date.now().toString();
    activeDialogs.add(dialogId);
    
    // Function to safely close and clean up the dialog
    function closeDialog() {
        try {
            // Remove animation classes and add exit animations
            dialog.classList.remove('zoom-in');
            backdrop.classList.remove('fade-in');
            dialog.classList.add('zoom-out');
            backdrop.classList.add('fade-out');
            
            // Wait for animations to complete
            setTimeout(() => {
                try {
                    // Remove from DOM safely with error handling
                    if (document.body.contains(backdrop)) {
                        document.body.removeChild(backdrop);
                    }
                    if (document.body.contains(dialog)) {
                        document.body.removeChild(dialog);
                    }
                    
                    // Remove from active dialogs set
                    activeDialogs.delete(dialogId);
                    
                    // Call the close callback
                    config.onClose();
                    
                    // Remove the ESC key listener
                    document.removeEventListener('keydown', handleEscape);
                } catch (err) {
                    console.error('Error removing dialog from DOM:', err);
                    
                    // Fallback cleanup attempt
                    forceCleanupDialog();
                }
            }, 200); // Match the CSS animation duration
        } catch (err) {
            console.error('Error closing dialog:', err);
            forceCleanupDialog();
        }
    }
    
    // Emergency cleanup function for when normal closing fails
    function forceCleanupDialog() {
        try {
            // Find all dialog elements and remove them
            document.querySelectorAll('.dialog-backdrop, .dialog').forEach(el => {
                if (document.body.contains(el)) {
                    document.body.removeChild(el);
                }
            });
            
            // Remove from active dialogs
            activeDialogs.delete(dialogId);
            
            // Remove event listener
            document.removeEventListener('keydown', handleEscape);
        } catch (e) {
            console.error('Critical error in dialog cleanup:', e);
        }
    }
    
    // Close when clicking the X button
    dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
    
    // Close when clicking the backdrop (if enabled)
    if (config.closeOnBackdropClick) {
        backdrop.addEventListener('click', (e) => {
            if (e.target === backdrop) {
                closeDialog();
            }
        });
    }
    
    // Handle ESC key
    function handleEscape(e) {
        if (e.key === 'Escape' && config.closeOnEscape) {
            closeDialog();
        }
    }
    
    // Add ESC key listener
    document.addEventListener('keydown', handleEscape);
    
    // Add to DOM
    document.body.appendChild(backdrop);
    document.body.appendChild(dialog);
    
    // Focus the first focusable element in the dialog
    setTimeout(() => {
        const focusable = dialog.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length > 0) {
            focusable[0].focus();
        } else {
            dialog.focus();
        }
    }, 50);
    
    // Return dialog control object
    return {
        close: closeDialog,
        getElement: () => dialog
    };
}

/**
 * Shows a simple confirmation dialog
 * @param {string} message - Confirmation message
 * @param {Object} options - Additional options
 * @returns {Promise} Resolves to true if confirmed, false otherwise
 */
export function confirm(message, options = {}) {
    return new Promise((resolve) => {
        showDialog({
            title: options.title || 'Confirm',
            content: `<p>${message}</p>`,
            buttons: [
                {
                    label: options.cancelText || 'Cancel',
                    type: 'secondary',
                    onClick: () => resolve(false)
                },
                {
                    label: options.confirmText || 'Confirm',
                    type: options.confirmType || 'primary',
                    onClick: () => resolve(true)
                }
            ],
            closeOnEscape: true,
            closeOnBackdropClick: true,
            size: options.size || 'small',
            onClose: () => resolve(false)
        });
    });
}

/**
 * Shows a loading dialog that can be updated
 * @param {string} message - Initial loading message
 * @param {Object} options - Additional options
 * @returns {Object} Control object for the loading dialog
 */
export function showLoading(message, options = {}) {
    const contentEl = document.createElement('div');
    contentEl.className = 'loading-container';
    contentEl.innerHTML = `
        <div class="loading-spinner"></div>
        <p class="loading-message">${message}</p>
    `;
    
    const dialog = showDialog({
        title: options.title || 'Loading',
        content: contentEl,
        buttons: [],
        closeOnEscape: false,
        closeOnBackdropClick: false,
        size: options.size || 'small'
    });
    
    // Add update message function
    return {
        ...dialog,
        updateMessage: (newMessage) => {
            const msgEl = contentEl.querySelector('.loading-message');
            if (msgEl) {
                msgEl.textContent = newMessage;
            }
        },
        completeWithSuccess: (successMessage, autoClose = true) => {
            const spinner = contentEl.querySelector('.loading-spinner');
            if (spinner) {
                spinner.className = 'success-icon';
                spinner.innerHTML = '<i class="fas fa-check-circle"></i>';
            }
            
            const msgEl = contentEl.querySelector('.loading-message');
            if (msgEl) {
                msgEl.textContent = successMessage;
                msgEl.className = 'loading-message success-message';
            }
            
            if (autoClose) {
                setTimeout(dialog.close, 1500);
            }
        },
        completeWithError: (errorMessage, autoClose = false) => {
            const spinner = contentEl.querySelector('.loading-spinner');
            if (spinner) {
                spinner.className = 'error-icon';
                spinner.innerHTML = '<i class="fas fa-exclamation-circle"></i>';
            }
            
            const msgEl = contentEl.querySelector('.loading-message');
            if (msgEl) {
                msgEl.textContent = errorMessage;
                msgEl.className = 'loading-message error-message';
            }
            
            if (autoClose) {
                setTimeout(dialog.close, 3000);
            } else {
                // Add a close button
                const dialogEl = dialog.getElement();
                const actionsEl = dialogEl.querySelector('.dialog-actions');
                if (actionsEl) {
                    const closeBtn = document.createElement('button');
                    closeBtn.className = 'btn btn-secondary';
                    closeBtn.textContent = 'Close';
                    closeBtn.addEventListener('click', dialog.close);
                    actionsEl.appendChild(closeBtn);
                }
            }
        }
    };
}

/**
 * Force cleanup of all active dialogs
 * For use when navigation occurs or the application state changes dramatically
 */
export function cleanupAllDialogs() {
    try {
        document.querySelectorAll('.dialog-backdrop, .dialog').forEach(el => {
            el.remove();
        });
        activeDialogs.clear();
    } catch (err) {
        console.error('Error cleaning up dialogs:', err);
    }
}