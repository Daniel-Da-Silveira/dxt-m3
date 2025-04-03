// app/assets/javascripts/flowbuilder/managers/CanvasManager.js
export class CanvasManager {
  constructor(canvas) {
	this.canvas = canvas;
	this.zoomLevel = 1;
	this.panOffset = { x: 0, y: 0 };
	this.isPanning = false;
	this.spacePressed = false;
	this.setupPanning();
  }

  setupPanning() {
	const container = this.canvas.parentElement;
	let lastX, lastY;

	const startPan = (e) => {
	  if (e.button === 1 || (e.button === 0 && this.spacePressed)) {
		this.isPanning = true;
		lastX = e.clientX;
		lastY = e.clientY;
		container.style.cursor = 'grabbing';
		e.preventDefault();
	  }
	};

	const doPan = (e) => {
	  if (!this.isPanning) return;

	  const deltaX = e.clientX - lastX;
	  const deltaY = e.clientY - lastY;

	  this.panOffset.x += deltaX;
	  this.panOffset.y += deltaY;

	  this.updateCanvasPosition();

	  lastX = e.clientX;
	  lastY = e.clientY;
	};

	const endPan = () => {
	  this.isPanning = false;
	  container.style.cursor = '';
	};

	this.setupPanningEventListeners(container, startPan, doPan, endPan);
  }

  setupPanningEventListeners(container, startPan, doPan, endPan) {
	document.addEventListener('keydown', (e) => {
	  if (e.code === 'Space' && !this.spacePressed) {
		this.spacePressed = true;
		container.style.cursor = 'grab';
	  }
	});

	document.addEventListener('keyup', (e) => {
	  if (e.code === 'Space') {
		this.spacePressed = false;
		container.style.cursor = '';
	  }
	});

	container.addEventListener('mousedown', startPan);
	document.addEventListener('mousemove', doPan);
	document.addEventListener('mouseup', endPan);
	document.addEventListener('mouseleave', endPan);
  }

  updateCanvasPosition() {
	this.canvas.style.transform = `
	  translate(${this.panOffset.x}px, ${this.panOffset.y}px) 
	  scale(${this.zoomLevel})
	`;
  }

  setZoom(value) {
	this.zoomLevel = value / 100;
	this.updateCanvasPosition();
  }
}