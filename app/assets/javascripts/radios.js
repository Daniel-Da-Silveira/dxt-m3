const builderPanel = document.getElementById('form-builder');
const previewPanel = document.getElementById('preview');
const legendInput = document.getElementById('legend-input'); // Reference to the legend input field
const hintInput = document.getElementById('hint-input'); // Reference to the hint input field
const pageHeadingInput = document.getElementById('page-heading-input-radios'); // Reference to the page heading input
const guidanceTextarea = document.getElementById('guidance-textarea-radios'); // Reference to the guidance textarea
let radioIndex = 0;
let radioButtons = [];
let isEditMode = false; // Variable to track if Edit Mode is active
let draggedElement = null; // Reference to the dragged element

// Create an aria-live region to announce changes to the order of radio buttons
const liveRegion = document.createElement('div');
liveRegion.setAttribute('aria-live', 'polite');
liveRegion.classList.add('govuk-visually-hidden');  // Hidden but accessible to screen readers
document.body.appendChild(liveRegion);

// Function to render the preview of the form
function renderPreview() {
	// Clear the existing preview
	previewPanel.innerHTML = '';

	// Create the GOV.UK style form group
	const formGroup = document.createElement('div');
	formGroup.classList.add('govuk-form-group');

	// Get the page heading text from the input field and add it to the preview
	const pageHeadingText = pageHeadingInput ? pageHeadingInput.value.trim() : '';
	if (pageHeadingText) {
		const pageHeading = document.createElement('h1');
		pageHeading.classList.add('govuk-heading-xl');
		pageHeading.id = 'dynamic-heading';
		pageHeading.textContent = pageHeadingText;

		// Append the page heading to the form group (above the legend)
		formGroup.appendChild(pageHeading);
	}

	// Create the fieldset for legend, hint, guidance, and inputs
	const fieldset = document.createElement('fieldset');
	fieldset.classList.add('govuk-fieldset');
	fieldset.setAttribute('aria-labelledby', 'dynamic-heading'); // Fieldset described by page heading

	// Get the legend text from the input field and add it if not empty
	const legendText = legendInput.value.trim();
	if (legendText) {
		const legend = document.createElement('legend');
		legend.classList.add('govuk-fieldset__legend', 'govuk-fieldset__legend--l');

		const heading = document.createElement('h1');
		heading.classList.add('govuk-fieldset__heading');
		heading.textContent = legendText;

		legend.appendChild(heading);
		fieldset.appendChild(legend);
	}

	// Get the hint text from the input field and add it if not empty
	const hintText = hintInput.value.trim();
	if (hintText) {
		const hint = document.createElement('div');
		hint.classList.add('govuk-hint');
		hint.id = 'hint-text-output';
		hint.textContent = hintText;

		fieldset.appendChild(hint);
	}

	// Get the guidance text from the textarea and add it if not empty
	const guidanceText = guidanceTextarea ? guidanceTextarea.value.trim() : '';
	if (guidanceText) {
		const guidance = document.createElement('p');
		guidance.classList.add('govuk-body');
		guidance.id = 'guidance-paragraph';
		guidance.textContent = guidanceText;

		fieldset.appendChild(guidance);
	}

	// Create the radios container
	const radiosContainer = document.createElement('div');
	radiosContainer.classList.add('govuk-radios');
	radiosContainer.setAttribute('data-module', 'govuk-radios');

	// Loop through each radio button in the radioButtons array and create its HTML
	radioButtons.forEach((radio, index) => {
		const radioItem = document.createElement('div');
		radioItem.classList.add('govuk-radios__item');

		const input = document.createElement('input');
		input.classList.add('govuk-radios__input');
		input.id = `radio-${index + 1}`;
		input.name = 'whereDoYouLive';
		input.type = 'radio';
		input.value = `value-${index + 1}`;

		const label = document.createElement('label');
		label.classList.add('govuk-label', 'govuk-radios__label');
		label.setAttribute('for', `radio-${index + 1}`);
		label.textContent = radio.label;

		radioItem.appendChild(input);
		radioItem.appendChild(label);
		radiosContainer.appendChild(radioItem);
	});

	// Append the radios container to the fieldset
	fieldset.appendChild(radiosContainer);

	// Append the fieldset to the form group
	formGroup.appendChild(fieldset);

	// Add the form group to the preview panel
	previewPanel.appendChild(formGroup);
}

// Function to create the UI for a new radio button
function createRadioButton(labelText, index, shouldFocus = false) {
	const div = document.createElement('div');
	div.classList.add('form-item');
	div.dataset.index = index;
	div.setAttribute('role', 'group');  // Grouping for accessibility
	div.setAttribute('aria-label', `Radio button ${index + 1} controls`);

	// Make div draggable
	div.setAttribute('draggable', true);
	div.addEventListener('dragstart', handleDragStart);
	div.addEventListener('dragover', handleDragOver);
	div.addEventListener('drop', handleDrop);
	div.addEventListener('dragend', handleDragEnd);

	const labelInput = document.createElement('input');
	labelInput.type = 'text';
	labelInput.value = labelText;
	labelInput.placeholder = 'Radio Label';
	labelInput.className = "govuk-input govuk-!-margin-top-3";
	labelInput.setAttribute('aria-label', 'Radio label input');  // Accessible label

	// Add listener to trigger the addRadioButton function when "Enter" is pressed
	labelInput.addEventListener('keydown', function(event) {
		if (event.key === 'Enter') {
			event.preventDefault();  // Prevent default form submission behavior
			addRadioButton();  // Trigger the add function
		}
	});

	// Create "Up" button with ARIA label and class
	const moveUpButton = document.createElement('button');
	moveUpButton.innerText = 'Up';
	moveUpButton.classList.add('gem-c-button', 'govuk-button', 'govuk-button--secondary');
	moveUpButton.setAttribute('aria-label', `Move radio button ${index + 1} up`);
	moveUpButton.onclick = function() { moveRadioButton(index, -1); };

	// Create "Down" button with ARIA label and class
	const moveDownButton = document.createElement('button');
	moveDownButton.innerText = 'Down';
	moveDownButton.classList.add('gem-c-button', 'govuk-button', 'govuk-button--secondary');
	moveDownButton.setAttribute('aria-label', `Move radio button ${index + 1} down`);
	moveDownButton.onclick = function() { moveRadioButton(index, 1); };

	// Create "Remove" button with ARIA label and class
	const removeButton = document.createElement('button');
	removeButton.innerText = 'Remove';
	removeButton.classList.add('gem-c-button', 'govuk-button', 'govuk-button--secondary');
	removeButton.setAttribute('aria-label', `Remove radio button ${index + 1}`);
	removeButton.onclick = function() { removeRadioButton(index); };

	labelInput.addEventListener('input', function() {
		radioButtons[index].label = labelInput.value;
		renderPreview();
	});

	// Create div container to wrap "Up", "Down", and "Remove" buttons
	const buttonContainer = document.createElement('div');
	buttonContainer.classList.add('button-container');
	buttonContainer.style.display = isEditMode ? 'flex' : 'none';  // Initially hidden, will be shown in edit mode
	buttonContainer.style.gap = '8px';  // Add some space between the buttons

	// Append buttons to the button container
	buttonContainer.appendChild(moveUpButton);
	buttonContainer.appendChild(moveDownButton);
	buttonContainer.appendChild(removeButton);

	div.appendChild(labelInput);
	div.appendChild(buttonContainer);

	builderPanel.appendChild(div);

	// Set focus to the new field if requested
	if (shouldFocus) {
		labelInput.value = '';  // Clear the text
		labelInput.focus();     // Focus on the input
	}
}

// Function to handle drag start
function handleDragStart(event) {
	draggedElement = event.target;  // Store the dragged item
	event.target.style.cursor = 'ns-resize'; // Change cursor during dragging
	setTimeout(() => event.target.classList.add('hidden'), 0);  // Hide the element being dragged
}

// Function to handle drag over
function handleDragOver(event) {
	event.preventDefault();  // Necessary to allow drop
	const closest = event.target.closest('.form-item');
	
	// Remove highlight from previously highlighted drop zones
	document.querySelectorAll('.highlight-drop-zone-active').forEach((zone) => {
		zone.classList.remove('highlight-drop-zone-active');
	});

	if (closest && closest !== draggedElement) {
		const rect = closest.getBoundingClientRect();
		const next = (event.clientY - rect.top) / rect.height > 0.5;
		
		// Ensure the dragged element can be inserted at the top
		if (builderPanel.firstChild === closest && !next) {
			builderPanel.insertBefore(draggedElement, builderPanel.firstChild);  // Insert at the top
		} else {
			builderPanel.insertBefore(draggedElement, next ? closest.nextSibling : closest);  // Insert elsewhere
		}

		closest.classList.add('highlight-drop-zone'); // Highlight the drop zone
		closest.classList.add('highlight-drop-zone-active'); // Active drop zone for more obvious visual feedback
	}
}

// Function to handle drop
function handleDrop(event) {
	event.preventDefault();
	const closest = event.target.closest('.form-item');
	
	if (draggedElement && closest && closest !== draggedElement) {
		const draggedIndex = parseInt(draggedElement.dataset.index);
		const droppedIndex = Array.from(builderPanel.children).indexOf(draggedElement);

		if (draggedIndex !== droppedIndex) {
			const movedItem = radioButtons.splice(draggedIndex, 1)[0];  // Remove dragged item
			radioButtons.splice(droppedIndex, 0, movedItem);  // Insert at new position
			
			// Update the indices after reordering
			radioButtons.forEach((radio, index) => radio.index = index);

			refreshBuilderUI();
			renderPreview();

			// Announce the reordering to screen readers
			liveRegion.textContent = `Radio button ${draggedIndex + 1} moved to position ${droppedIndex + 1}`;
		}
	}
}

// Function to handle drag end
function handleDragEnd(event) {
	event.target.style.cursor = 'auto'; // Reset cursor
	draggedElement.classList.remove('hidden');  // Make the dragged element visible again
	draggedElement = null;  // Clear the reference
	const highlightedDropZones = document.querySelectorAll('.highlight-drop-zone, .highlight-drop-zone-active');
	highlightedDropZones.forEach(zone => zone.classList.remove('highlight-drop-zone', 'highlight-drop-zone-active'));  // Remove highlight
}

// Function to refresh the builder panel UI (without adding extra fields)
function refreshBuilderUI() {
	builderPanel.innerHTML = '';
	radioButtons.forEach((radio, index) => {
		createRadioButton(radio.label, index);
	});

	// Apply edit mode class if necessary
	if (isEditMode) {
		builderPanel.classList.add('edit-mode');
	} else {
		builderPanel.classList.remove('edit-mode');
	}

	// Ensure the visibility of the buttons based on the edit mode state
	const buttonContainers = document.querySelectorAll('.button-container');
	buttonContainers.forEach(container => {
		container.style.display = isEditMode ? 'flex' : 'none';  // Ensure buttons stay visible in edit mode
	});
}

// Function to add a new radio button and focus on it
function addRadioButton() {
	const newRadioButton = { label: `Radio ${radioIndex + 1}` };
	radioButtons.push(newRadioButton);
	createRadioButton(newRadioButton.label, radioButtons.length - 1, true);  // Focus on the new field and clear the text
	renderPreview();
	radioIndex++;
}

// Add event listener to "Add Radio Button" button
document.getElementById('add-radio-button').addEventListener('click', addRadioButton);

// Function to remove a radio button
function removeRadioButton(index) {
	radioButtons.splice(index, 1); // Remove the button at the specified index
	refreshBuilderUI(); // Refresh the UI to reflect changes
	renderPreview();    // Update the preview
}

// Function to move a radio button up or down
function moveRadioButton(index, direction) {
	const newIndex = index + direction;
	if (newIndex >= 0 && newIndex < radioButtons.length) {
		// Swap the radio buttons in the array
		const temp = radioButtons[index];
		radioButtons[index] = radioButtons[newIndex];
		radioButtons[newIndex] = temp;

		// Refresh the UI and preview with the updated order
		refreshBuilderUI();
		renderPreview();

		// Announce the change to screen readers
		liveRegion.textContent = `Radio button ${index + 1} moved ${direction === -1 ? 'up' : 'down'}`;
	}
}

// Toggle Edit Mode
function toggleEditMode() {
	isEditMode = !isEditMode; // Toggle the edit mode state
	refreshBuilderUI();       // Refresh the UI to apply edit mode
}

// Add event listeners to dynamically update the preview as inputs change
legendInput.addEventListener('input', renderPreview);
hintInput.addEventListener('input', renderPreview);
if (pageHeadingInput) pageHeadingInput.addEventListener('input', renderPreview);
if (guidanceTextarea) guidanceTextarea.addEventListener('input', renderPreview);

// Add event listener to "Edit" button
document.getElementById('toggle-edit-mode').addEventListener('click', toggleEditMode);

// Initialize the builder with one form field
window.onload = function() {
	addRadioButton();  // Add the initial radio button when the page loads
};
