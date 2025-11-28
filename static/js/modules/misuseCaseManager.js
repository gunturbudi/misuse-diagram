// misuseCaseManager.js - Module for handling misuse case functionality
import { canvas, ELEMENT_TYPES, setSelectedElement } from './core.js';
import * as elements from './elements.js';
import * as connections from './connections.js';
import { showConnectionHelp } from './ui.js';

// State management for misuse cases
const misuseState = {
    generatedMisuseCases: [],
    selectedMisuseCases: new Set(),
    analysisTarget: 'selected', // 'selected', 'all', or 'system'
    isGenerating: false,
    selectedUseCase: null
};

export function init() {
    try {
        console.log("Initializing misuse case manager...");
        
        // Set up event listeners for the panel
        const showMisusePanelBtn = document.getElementById('show-misuse-panel');
        const closeMisusePanelBtn = document.getElementById('close-misuse-panel');
        const generateMisuseBtnEl = document.getElementById('generate-misuse-btn');
        const addSelectedMisuseBtn = document.getElementById('add-selected-misuse');
        const clearMisuseCasesBtn = document.getElementById('clear-misuse-cases');
        const analysisTargetEl = document.getElementById('analysis-target');
        
        if (showMisusePanelBtn) {
            // Clear existing listeners first
            showMisusePanelBtn.removeEventListener('click', showMisusePanel);
            showMisusePanelBtn.addEventListener('click', showMisusePanel);
            console.log("Show misuse panel button listener added");
        } else {
            console.warn("Show misuse panel button not found in DOM");
        }
        
        if (closeMisusePanelBtn) {
            // Clear existing listeners first
            closeMisusePanelBtn.removeEventListener('click', hideMisusePanel);
            closeMisusePanelBtn.addEventListener('click', hideMisusePanel);
            console.log("Close misuse panel button listener added");
        } else {
            console.warn("Close misuse panel button not found in DOM");
        }
        
        // CRITICAL FIX: Properly handle generate button
        if (generateMisuseBtnEl) {
            // Always make sure the button is not disabled by default
            generateMisuseBtnEl.disabled = false;
            
            // Remove any existing click handler to prevent duplicates
            generateMisuseBtnEl.removeEventListener('click', generateMisuseCases);
            
            // Add a fresh click handler
            generateMisuseBtnEl.addEventListener('click', generateMisuseCases);
            console.log("Generate misuse button event listener added correctly");
            
            // Add a direct onclick handler as a fallback
            generateMisuseBtnEl.onclick = function() {
                console.log("Generate misuse button clicked via onclick property");
                generateMisuseCases();
                return false; // Prevent default
            };
        } else {
            console.warn("Generate misuse button not found in DOM");
        }
        
        if (addSelectedMisuseBtn) {
            addSelectedMisuseBtn.removeEventListener('click', addSelectedMisuseCasesToDiagram);
            addSelectedMisuseBtn.addEventListener('click', addSelectedMisuseCasesToDiagram);
            console.log("Add selected misuse button listener added");
        }
        
        if (clearMisuseCasesBtn) {
            clearMisuseCasesBtn.removeEventListener('click', clearMisuseCases);
            clearMisuseCasesBtn.addEventListener('click', clearMisuseCases);
            console.log("Clear misuse cases button listener added");
        }
        
        // Set up analysis target change event
        if (analysisTargetEl) {
            analysisTargetEl.removeEventListener('change', updateAnalysisTarget);
            analysisTargetEl.addEventListener('change', updateAnalysisTarget);
            console.log("Analysis target dropdown listener added");
        }
        
        // Initial update of the analysis target info
        updateAnalysisTarget();
        
        // Force initial update of selected use case info
        updateSelectedUseCaseInfo(misuseState.selectedUseCase);
        
        console.log("Misuse case manager initialized successfully");
    } catch (error) {
        console.error("Error initializing misuse case manager:", error);
    }
}

// Show the misuse case panel
export function showMisusePanel() {
    try {
        const panel = document.getElementById('misuse-case-panel');
        if (panel) {
            panel.classList.add('active');
            document.body.classList.add('misuse-panel-active');
            
            // Update canvas size for the new layout
            updateCanvasSize();
            
            // Update selected use case info
            updateSelectedUseCaseInfo();
        }
    } catch (error) {
        console.error("Error showing misuse panel:", error);
    }
}

// Hide the misuse case panel
export function hideMisusePanel() {
    try {
        const panel = document.getElementById('misuse-case-panel');
        if (panel) {
            panel.classList.remove('active');
            document.body.classList.remove('misuse-panel-active');
            
            // Update canvas size for the original layout
            updateCanvasSize();
        }
    } catch (error) {
        console.error("Error hiding misuse panel:", error);
    }
}

// Update canvas size when panel is shown/hidden
function updateCanvasSize() {
    try {
        const isPanelActive = document.body.classList.contains('misuse-panel-active');
        
        if (isPanelActive) {
            // Adjust canvas size with panel open
            canvas.setWidth(window.innerWidth - 580); // 280px for properties + 300px for misuse panel
        } else {
            // Restore original canvas size
            canvas.setWidth(window.innerWidth - 280); // Just 280px for properties panel
        }
        
        canvas.renderAll();
    } catch (error) {
        console.error("Error updating canvas size:", error);
    }
}

// Improvements to updateSelectedUseCaseInfo in misuseCaseManager.js
export function updateSelectedUseCaseInfo(selectedElement = null) {
    try {
        console.log("updateSelectedUseCaseInfo called with:", selectedElement);
        
        const infoElement = document.getElementById('selected-usecase-info');
        if (!infoElement) return;
        
        const analysisTargetEl = document.getElementById('analysis-target');
        const analysisTarget = analysisTargetEl ? analysisTargetEl.value : misuseState.analysisTarget;
        
        // Update the misuseState.selectedUseCase
        misuseState.selectedUseCase = selectedElement && 
                                     selectedElement.elementType === ELEMENT_TYPES.USECASE ? 
                                     selectedElement : null;
        
        console.log("misuseState.selectedUseCase updated to:", misuseState.selectedUseCase);
        
        // If analysis target is 'selected', we need a selected use case
        if (analysisTarget === 'selected') {
            const generateBtn = document.getElementById('generate-misuse-btn');
            
            if (misuseState.selectedUseCase) {
                infoElement.innerHTML = `
                    <p><strong>Selected Use Case:</strong> ${misuseState.selectedUseCase.name}</p>
                `;
                if (generateBtn) {
                    // Fix: Make sure button is enabled and has working click handler
                    generateBtn.disabled = false;
                    
                    // IMPORTANT: First remove any existing click handlers to prevent duplicates
                    generateBtn.removeEventListener('click', generateMisuseCases);
                    // Then add a fresh click handler
                    generateBtn.addEventListener('click', generateMisuseCases);
                    console.log("Generate misuse button click handler re-attached");
                }
            } else {
                infoElement.innerHTML = `
                    <p><strong>No use case selected.</strong> Please select a use case or choose a different analysis target.</p>
                `;
                if (generateBtn) generateBtn.disabled = true;
            }
        } else {
            // For 'all' or 'system' targets, no specific use case is needed
            if (analysisTarget === 'all') {
                infoElement.innerHTML = `
                    <p><strong>Analysis Target:</strong> All use cases in the diagram</p>
                `;
            } else {
                infoElement.innerHTML = `
                    <p><strong>Analysis Target:</strong> Entire system</p>
                `;
            }
            
            // Enable generate button regardless of selection
            const generateBtn = document.getElementById('generate-misuse-btn');
            if (generateBtn) {
                // Fix: Make sure button is enabled and has working click handler
                generateBtn.disabled = false;
                
                // IMPORTANT: First remove any existing click handlers to prevent duplicates
                generateBtn.removeEventListener('click', generateMisuseCases);
                // Then add a fresh click handler
                generateBtn.addEventListener('click', generateMisuseCases);
                console.log("Generate misuse button click handler re-attached");
            }
        }
    } catch (error) {
        console.error("Error updating selected use case info:", error);
    }
}


// Handle analysis target change
function updateAnalysisTarget() {
    try {
        const analysisTargetEl = document.getElementById('analysis-target');
        if (analysisTargetEl) {
            misuseState.analysisTarget = analysisTargetEl.value;
        }
        
        // Update the UI based on the new target
        updateSelectedUseCaseInfo(misuseState.selectedUseCase);
    } catch (error) {
        console.error("Error updating analysis target:", error);
    }
}

// Generate misuse cases based on the current settings
function generateMisuseCases() {
    try {
        // Prevent multiple simultaneous generations
        if (misuseState.isGenerating) return;
        
        const analysisTarget = misuseState.analysisTarget;
        let useCaseName, systemName, otherUseCases;
        
        // Collect the data based on the analysis target
        if (analysisTarget === 'selected') {
            if (!misuseState.selectedUseCase) {
                showStatus('error', 'Please select a use case first');
                return;
            }
            
            useCaseName = misuseState.selectedUseCase.name;
            
            // Find the system container if any
            systemName = findSystemForUseCase(misuseState.selectedUseCase);
            
            // Get other use cases
            otherUseCases = getOtherUseCases(misuseState.selectedUseCase);
        } 
        else if (analysisTarget === 'all') {
            // Analyze all use cases together
            const allUseCases = getAllUseCases();
            
            if (allUseCases.length === 0) {
                showStatus('error', 'No use cases found in the diagram');
                return;
            }
            
            useCaseName = allUseCases.map(uc => uc.name).join(', ');
            systemName = findCommonSystemName();
            otherUseCases = [];
        }
        else { // 'system'
            systemName = findCommonSystemName() || 'the system';
            useCaseName = 'All functionality in ' + systemName;
            otherUseCases = [];
        }
        
        // Show loading status
        showStatus('loading', 'Generating misuse cases...');
        misuseState.isGenerating = true;
        
        // Clear any previous selections
        misuseState.selectedMisuseCases.clear();
        updateButtonStates();
        
        // Call the server to generate misuse cases
        fetch('/generate_misuse_cases', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                useCaseName: useCaseName,
                systemName: systemName,
                otherUseCases: otherUseCases
            }),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            misuseState.isGenerating = false;
            
            if (data.status === 'success') {
                misuseState.generatedMisuseCases = data.data;
                showStatus('success', `Generated ${data.data.length} misuse cases successfully!`);
                displayMisuseCases(data.data);
            } else {
                showStatus('error', `Error: ${data.message}`);
                console.error('Error:', data);
            }
        })
        .catch((error) => {
            misuseState.isGenerating = false;
            showStatus('error', 'Error communicating with server: ' + error.message);
            console.error('Error:', error);
        });
    } catch (error) {
        misuseState.isGenerating = false;
        showStatus('error', 'Error generating misuse cases: ' + error.message);
        console.error('Error generating misuse cases:', error);
    }
}

// Display the generated misuse cases in the panel
function displayMisuseCases(misuseCases) {
    try {
        const listElement = document.getElementById('misuse-case-list');
        if (!listElement) return;
        
        if (!misuseCases || misuseCases.length === 0) {
            listElement.innerHTML = `
                <p class="empty-state">No misuse cases were generated. Try refining your use case descriptions.</p>
            `;
            return;
        }
        
        let html = '';
        
        misuseCases.forEach((misuseCase, index) => {
            html += `
                <div class="misuse-case-item" data-index="${index}">
                    <h5><i class="fas fa-exclamation-circle"></i> ${misuseCase.name}</h5>
                    <p><strong>Actor:</strong> ${misuseCase.actor}</p>
                    <p><strong>Description:</strong> ${misuseCase.description}</p>
                    <p><strong>Impact:</strong> ${misuseCase.impact}</p>
                </div>
            `;
        });
        
        listElement.innerHTML = html;
        
        // Add click event listeners to the misuse case items
        document.querySelectorAll('.misuse-case-item').forEach(item => {
            item.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                toggleMisuseCaseSelection(index, this);
            });
        });
        
        // Enable the clear button
        const clearButton = document.getElementById('clear-misuse-cases');
        if (clearButton) clearButton.disabled = false;
    } catch (error) {
        console.error("Error displaying misuse cases:", error);
        showStatus('error', 'Error displaying misuse cases: ' + error.message);
    }
}

// Toggle selection of a misuse case
function toggleMisuseCaseSelection(index, element) {
    try {
        if (misuseState.selectedMisuseCases.has(index)) {
            misuseState.selectedMisuseCases.delete(index);
            element.classList.remove('selected');
        } else {
            misuseState.selectedMisuseCases.add(index);
            element.classList.add('selected');
        }
        
        // Update button states
        updateButtonStates();
    } catch (error) {
        console.error("Error toggling misuse case selection:", error);
    }
}

// Update the states of action buttons
function updateButtonStates() {
    try {
        const addButton = document.getElementById('add-selected-misuse');
        if (!addButton) return;
        
        addButton.disabled = misuseState.selectedMisuseCases.size === 0;
    } catch (error) {
        console.error("Error updating button states:", error);
    }
}

// Add selected misuse cases to the diagram
function addSelectedMisuseCasesToDiagram() {
    try {
        if (misuseState.selectedMisuseCases.size === 0) {
            showStatus('error', 'Please select at least one misuse case first');
            return;
        }
        
        // Get the target use case - either the selected one or the first one in the diagram
        let targetUseCase = misuseState.selectedUseCase;
        
        if (!targetUseCase) {
            // If no use case is selected, find the first one in the diagram
            canvas.getObjects().forEach(obj => {
                if (obj.elementType === ELEMENT_TYPES.USECASE && !targetUseCase) {
                    targetUseCase = obj;
                }
            });
        }
        
        if (!targetUseCase) {
            showStatus('error', 'No target use case found to link misuse cases to');
            return;
        }
        
        // Get the selected misuse cases
        const selectedMisuseCases = Array.from(misuseState.selectedMisuseCases).map(
            index => misuseState.generatedMisuseCases[index]
        );
        
        // Show initial status
        showStatus('loading', 'Adding misuse cases to diagram...');
        
        // Get the center point of the target use case
        const targetCenter = targetUseCase.getCenterPoint();
        
        // Find a suitable position to place the misuser
        const misusers = {};
        let misuserOffsetX = 200;
        let misuserOffsetY = -100;
        
        // Process each misuse case one by one
        selectedMisuseCases.forEach((misuseCase, index) => {
            // Calculate position for the misuse case 
            // (position in a semi-circle around the target use case)
            const angle = (Math.PI / (selectedMisuseCases.length + 1)) * (index + 1);
            const distance = 200; // Distance from target use case
            const offsetX = distance * Math.cos(angle);
            const offsetY = distance * Math.sin(angle);
            
            // Create the misuse case
            const newMisuseCase = elements.createMisuseCase(
                targetCenter.x + offsetX, 
                targetCenter.y + offsetY, 
                misuseCase.name
            );
            canvas.add(newMisuseCase);
            
            // Render after creating the misuse case
            canvas.renderAll();
            
            // Check if we need a new misuser for this actor type
            if (!misusers[misuseCase.actor]) {
                // Create new misuser
                const newMisuser = elements.createMisuser(
                    targetCenter.x + misuserOffsetX, 
                    targetCenter.y + misuserOffsetY, 
                    misuseCase.actor
                );
                canvas.add(newMisuser);
                misusers[misuseCase.actor] = newMisuser;
                
                // Adjust offset for next misuser
                misuserOffsetX += 70;
                misuserOffsetY -= 30;
                
                // Render after creating the misuser
                canvas.renderAll();
            }
            
            // Create the threatens connection between misuse case and use case
            const threatens = connections.createThreatens(newMisuseCase, targetUseCase);
            
            // Create association between misuser and misuse case
            const association = connections.createAssociation(misusers[misuseCase.actor], newMisuseCase);
            
            // Final render to ensure everything is displayed correctly
            canvas.renderAll();
        });
        
        // Success message
        showStatus('success', `Added ${selectedMisuseCases.length} misuse case(s) to the diagram!`);
        
        // Clear selections after adding
        clearSelections();
        
    } catch (error) {
        console.error('Error adding misuse cases to diagram:', error);
        showStatus('error', 'Error adding misuse cases to diagram: ' + error.message);
    }
}

// Clear all misuse cases from the panel
function clearMisuseCases() {
    try {
        misuseState.generatedMisuseCases = [];
        clearSelections();
        
        // Clear the list
        const listElement = document.getElementById('misuse-case-list');
        if (listElement) {
            listElement.innerHTML = `
                <p class="empty-state">No misuse cases generated yet. Use the button above to generate potential security threats.</p>
            `;
        }
        
        // Disable buttons
        const clearButton = document.getElementById('clear-misuse-cases');
        if (clearButton) clearButton.disabled = true;
        
        const addButton = document.getElementById('add-selected-misuse');
        if (addButton) addButton.disabled = true;
        
        showStatus('success', 'Cleared misuse case results');
    } catch (error) {
        console.error("Error clearing misuse cases:", error);
        showStatus('error', 'Error clearing misuse cases: ' + error.message);
    }
}

// Clear selections without clearing the whole list
function clearSelections() {
    try {
        misuseState.selectedMisuseCases.clear();
        
        // Remove selected class from all items
        document.querySelectorAll('.misuse-case-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Update button states
        updateButtonStates();
    } catch (error) {
        console.error("Error clearing selections:", error);
    }
}

// Show a status message in the status indicator
function showStatus(type, message) {
    try {
        const statusElement = document.getElementById('generation-status');
        if (!statusElement) return;
        
        // Clear any existing status
        statusElement.className = 'status-indicator';
        
        // Set the new status
        if (type === 'loading') {
            statusElement.classList.add('loading');
            statusElement.innerHTML = `<div class="spinner"></div> ${message}`;
        } else if (type === 'success') {
            statusElement.classList.add('success');
            statusElement.innerHTML = `<i class="fas fa-check-circle"></i> ${message}`;
            
            // Auto hide success message after 5 seconds
            setTimeout(() => {
                if (statusElement.classList.contains('success')) {
                    statusElement.className = 'status-indicator';
                }
            }, 5000);
        } else if (type === 'error') {
            statusElement.classList.add('error');
            statusElement.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        }
    } catch (error) {
        console.error("Error showing status:", error);
    }
}

// Helper function: Find the system that contains a use case
function findSystemForUseCase(useCase) {
    try {
        let systemName = "the system";
        
        canvas.getObjects().forEach(obj => {
            if (obj.elementType === ELEMENT_TYPES.SYSTEM) {
                // Check if the use case is inside the system boundary
                const useCaseCenter = useCase.getCenterPoint();
                const systemLeft = obj.left - obj.width/2;
                const systemRight = obj.left + obj.width/2;
                const systemTop = obj.top - obj.height/2;
                const systemBottom = obj.top + obj.height/2;
                
                if (useCaseCenter.x >= systemLeft && 
                    useCaseCenter.x <= systemRight && 
                    useCaseCenter.y >= systemTop && 
                    useCaseCenter.y <= systemBottom) {
                    systemName = obj.name;
                }
            }
        });
        
        return systemName;
    } catch (error) {
        console.error("Error finding system for use case:", error);
        return "the system";
    }
}

// Helper function: Get other use cases in the diagram
function getOtherUseCases(currentUseCase) {
    try {
        const otherUseCases = [];
        
        canvas.getObjects().forEach(obj => {
            if (obj.elementType === ELEMENT_TYPES.USECASE && obj !== currentUseCase) {
                otherUseCases.push(obj.name);
            }
        });
        
        return otherUseCases;
    } catch (error) {
        console.error("Error getting other use cases:", error);
        return [];
    }
}

// Helper function: Get all use cases in the diagram
function getAllUseCases() {
    try {
        const useCases = [];
        
        canvas.getObjects().forEach(obj => {
            if (obj.elementType === ELEMENT_TYPES.USECASE) {
                useCases.push(obj);
            }
        });
        
        return useCases;
    } catch (error) {
        console.error("Error getting all use cases:", error);
        return [];
    }
}

// Helper function: Find the common system name for all use cases
function findCommonSystemName() {
    try {
        // Get all systems in the diagram
        const systems = [];
        canvas.getObjects().forEach(obj => {
            if (obj.elementType === ELEMENT_TYPES.SYSTEM) {
                systems.push(obj);
            }
        });
        
        if (systems.length === 1) {
            // If there's only one system, use its name
            return systems[0].name;
        } else if (systems.length > 1) {
            // Multiple systems - find the one with the most use cases
            const systemMap = new Map();
            
            // Initialize counters
            systems.forEach(sys => {
                systemMap.set(sys, 0);
            });
            
            // Count use cases in each system
            const useCases = getAllUseCases();
            useCases.forEach(useCase => {
                const useCaseCenter = useCase.getCenterPoint();
                
                systems.forEach(sys => {
                    const systemLeft = sys.left - sys.width/2;
                    const systemRight = sys.left + sys.width/2;
                    const systemTop = sys.top - sys.height/2;
                    const systemBottom = sys.top + sys.height/2;
                    
                    if (useCaseCenter.x >= systemLeft && 
                        useCaseCenter.x <= systemRight && 
                        useCaseCenter.y >= systemTop && 
                        useCaseCenter.y <= systemBottom) {
                        systemMap.set(sys, systemMap.get(sys) + 1);
                    }
                });
            });
            
            // Find the system with the most use cases
            let maxCount = 0;
            let mainSystem = null;
            
            systemMap.forEach((count, sys) => {
                if (count > maxCount) {
                    maxCount = count;
                    mainSystem = sys;
                }
            });
            
            return mainSystem ? mainSystem.name : "the system";
        }
        
        return "the system";
    } catch (error) {
        console.error("Error finding common system name:", error);
        return "the system";
    }
}