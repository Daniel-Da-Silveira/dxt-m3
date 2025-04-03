document.addEventListener("DOMContentLoaded", function() {
	// Select all elements with the `data-help` attribute
	const helpTextElements = document.querySelectorAll('[data-help]');

	// If there are no elements with data-help, exit early
	if (helpTextElements.length === 0) return;

	helpTextElements.forEach(function(element) {
		// Create popover element
		const popover = document.createElement('div');
		popover.classList.add('popover');
		
		// Get the help text and insert it as plain text (no HTML parsing)
		const helpText = element.getAttribute('data-help');
		const textNode = document.createTextNode(helpText);  // Create a text node with the content
		popover.appendChild(textNode); // Append the text node to the popover
		
		// Add accessibility roles and attributes
		popover.setAttribute('role', 'tooltip');
		popover.setAttribute('aria-hidden', 'true');  // Initially hidden
		
		// Link the element to the popover for screen readers
		element.setAttribute('aria-describedby', `popover-${Date.now()}`);
		popover.setAttribute('id', `popover-${Date.now()}`);

		document.body.appendChild(popover);

		// Toggle popover visibility on click
		element.addEventListener('click', function(event) {
			const isPopoverVisible = popover.style.display === 'block';
			popover.style.display = isPopoverVisible ? 'none' : 'block';
			popover.setAttribute('aria-hidden', isPopoverVisible ? 'true' : 'false');

			// Position popover near the text
			const rect = element.getBoundingClientRect();
			popover.style.left = `${rect.left + rect.width / 2 - popover.offsetWidth / 2}px`;
			popover.style.top = `${rect.bottom + window.scrollY + 5}px`;

			// Prevent click event from closing popover immediately
			event.stopPropagation();
		});
	});

	// Hide the popover when clicking anywhere else on the page
	document.addEventListener('click', function(event) {
		const openPopover = document.querySelector('.popover[aria-hidden="false"]');
		if (openPopover && !openPopover.contains(event.target) && !event.target.closest('[data-help]')) {
			openPopover.style.display = 'none';
			openPopover.setAttribute('aria-hidden', 'true');
		}
	});
});