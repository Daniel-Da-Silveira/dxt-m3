// app/assets/javascripts/flowbuilder/constants.js
export const NODE_TYPES = {
  QUESTION: 'question',
  CONDITION: 'condition',
  END: 'end'
};

export const NODE_CONFIGS = {
  question: {
	title: 'Page',
	content: `
	  <input type="text" class="govuk-input" placeholder="Page title">
	`
  },
  condition: {
	title: 'Condition',
	content: `
	  <select class="govuk-select">
		<option>If Answer Is</option>
		<option>If Answer Contains</option>
		<option>If Greater Than</option>
		<option>If Less Than</option>
	  </select>
	  <input type="text" class="govuk-input" placeholder="Value">
	`
  },
  end: {
	title: 'End',
	content: `
	  <select class="govuk-select">
		<option>Submit</option>
		<option>Show Message</option>
		<option>Redirect</option>
	  </select>
	`
  }
};