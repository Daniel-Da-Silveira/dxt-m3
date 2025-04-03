document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('comment-modal');
  const closeModalButtons = document.querySelectorAll('#close-modal, #close-modal-button');
  const form = document.getElementById('comment-form');

  // Show modal on Alt+Click anywhere
  document.addEventListener('click', (e) => {
	if (modal && e.altKey) {
	  const urlInput = document.getElementById('url');
	  if (urlInput) {
		urlInput.value = window.location.href;
	  }

	  modal.classList.add('govuk-modal--visible');
	  modal.setAttribute('aria-hidden', 'false');
	}
  });

  // Close modal
  if (modal) {
	closeModalButtons.forEach((button) => {
	  button.addEventListener('click', () => {
		modal.classList.remove('govuk-modal--visible');
		modal.setAttribute('aria-hidden', 'true');
	  });
	});
  }

  // Handle form submission
  if (form) {
	form.addEventListener('submit', (e) => {
	  e.preventDefault();

	  const formData = new FormData(form);
	  const payload = {
		project: formData.get('project'),
		feedback: formData.get('feedback'),
		url: formData.get('url'),
	  };

	  // Send the data to the server
	  fetch('/add-comment', {
		method: 'POST',
		headers: {
		  'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	  })
		.then((response) => {
		  if (response.ok) {
			alert('Feedback submitted!');
			modal.classList.remove('govuk-modal--visible');
			modal.setAttribute('aria-hidden', 'true');
			form.reset();
		  } else {
			alert('Failed to submit feedback. Please try again.');
		  }
		})
		.catch((error) => {
		  console.error('Error:', error);
		  alert('An error occurred. Please try again.');
		});
	});
  }

  // Utility for debugging
  console.log('comments.js initialized');
});