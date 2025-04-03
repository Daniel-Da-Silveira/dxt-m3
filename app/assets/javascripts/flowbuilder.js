// app/assets/javascripts/flowbuilder.js
import { FormFlowBuilder } from './flowbuilder/FormFlowBuilder.js';

// Initialise when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Only initialize if we're on a page with the flow builder
  if (document.getElementById('canvas')) {
	const flowBuilder = new FormFlowBuilder();
  }
});