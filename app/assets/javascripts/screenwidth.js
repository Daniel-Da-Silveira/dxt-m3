document.addEventListener('DOMContentLoaded', function() {
  // toggle page width
  document.addEventListener('keydown', function (event) {
	// Check if Ctrl + Alt + ] (BracketRight) is pressed
	if (event.ctrlKey && event.altKey && event.code === 'BracketRight') {
	  event.preventDefault(); // Prevent any default behavior

	  // Select all elements with the class 'govuk-width-container'
	  const containers = document.querySelectorAll('.govuk-width-container');

	  // Toggle the custom class for all instances
	  containers.forEach(container => {
		container.classList.toggle('custom-width');
	  });
	}
  });

  // CSS to apply the width change
  const style = document.createElement('style');
  style.textContent = `
	.custom-width {
	  max-width: 1300px !important;
	}
  `;
  document.head.appendChild(style);
});