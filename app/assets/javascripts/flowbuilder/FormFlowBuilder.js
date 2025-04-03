// app/assets/javascripts/flowbuilder/FormFlowBuilder.js
import { ConnectionManager } from './managers/ConnectionManager.js';
import { NodeManager } from './managers/NodeManager.js';
import { CanvasManager } from './managers/CanvasManager.js';
import { SVGExporter } from './managers/SVGExporter.js';
import { createSVGElement } from './utils.js';

export class FormFlowBuilder {
  constructor() {
	this.canvas = document.getElementById('canvas');
	this.setupSVGLayer();
	
	this.canvasManager = new CanvasManager(this.canvas);
	
	// Create ConnectionManager first
	this.connectionManager = new ConnectionManager(this.svgLayer, []);
	
	// Pass connectionManager to NodeManager
	this.nodeManager = new NodeManager(
	  this.canvas, 
	  this.canvasManager.zoomLevel,
	  this.connectionManager
	);
	
	// Update ConnectionManager's nodes reference
	this.connectionManager.nodes = this.nodeManager.nodes;
	
	this.setupEventListeners();
	this.setupZoomControls();
	this.setupImportExport();
	this.setupSVGExport();
  }

  setupSVGLayer() {
	this.svgLayer = createSVGElement('svg');
	Object.assign(this.svgLayer.style, {
	  position: 'absolute',
	  top: '0',
	  left: '0',
	  width: '100%',
	  height: '100%',
	  pointerEvents: 'none'
	});
	this.canvas.appendChild(this.svgLayer);
  }

  setupEventListeners() {
	document.querySelectorAll('.floating-btn').forEach(btn => {
	  btn.addEventListener('dragstart', (e) => {
		e.dataTransfer.setData('text/plain', e.target.dataset.type);
	  });

	  btn.addEventListener('click', (e) => {
		const type = e.target.dataset.type;
		const canvasRect = this.canvas.getBoundingClientRect();
		
		// Calculate position relative to canvas, accounting for zoom and pan
		const x = Math.round(
		  (window.innerWidth / 4 - canvasRect.left) / 
		  this.canvasManager.zoomLevel / 
		  20
		) * 20;
		
		const y = Math.round(
		  (window.innerHeight / 4 - canvasRect.top) / 
		  this.canvasManager.zoomLevel / 
		  20
		) * 20;

		this.nodeManager.createNode(type, x, y, this.connectionManager);
	  });
	});

	this.canvas.addEventListener('dragover', (e) => e.preventDefault());
	this.canvas.addEventListener('drop', this.handleDrop.bind(this));
  }

  handleDrop(e) {
	e.preventDefault();
	const type = e.dataTransfer.getData('text/plain');
	const rect = this.canvas.getBoundingClientRect();

	// Calculate drop position accounting for zoom and pan
	const x = Math.round(
	  ((e.clientX - rect.left) / this.canvasManager.zoomLevel - 
	  this.canvasManager.panOffset.x) / 
	  20
	) * 20;

	const y = Math.round(
	  ((e.clientY - rect.top) / this.canvasManager.zoomLevel - 
	  this.canvasManager.panOffset.y) / 
	  20
	) * 20;

	this.nodeManager.createNode(type, x, y, this.connectionManager);
  }

  setupZoomControls() {
	const zoomIn = document.getElementById('zoom-in');
	const zoomOut = document.getElementById('zoom-out');
	const zoomReset = document.getElementById('zoom-reset');
	const zoomSlider = document.getElementById('zoom-slider');

	zoomIn?.addEventListener('click', () => {
	  const newValue = Math.min(200, parseInt(zoomSlider.value) + 25);
	  zoomSlider.value = newValue;
	  this.handleZoom(newValue);
	});

	zoomOut?.addEventListener('click', () => {
	  const newValue = Math.max(25, parseInt(zoomSlider.value) - 25);
	  zoomSlider.value = newValue;
	  this.handleZoom(newValue);
	});

	zoomReset?.addEventListener('click', () => {
	  zoomSlider.value = 100;
	  this.handleZoom(100);
	});

	zoomSlider?.addEventListener('input', (e) => {
	  this.handleZoom(e.target.value);
	});
  }

  handleZoom(value) {
	const zoomLevel = document.getElementById('zoom-level');
	if (zoomLevel) {
	  zoomLevel.textContent = `${value}%`;
	}
	
	this.canvasManager.setZoom(value);
	this.connectionManager.updateConnections(this.canvasManager.zoomLevel);
  }

  setupImportExport() {
	document.getElementById('export-btn')?.addEventListener('click', () => {
	  const data = {
		nodes: this.nodeManager.getNodeData(),
		connections: this.connectionManager.connections
	  };
	  const json = JSON.stringify(data, null, 2);
	  navigator.clipboard.writeText(json).then(() => {
		alert('Flow exported to clipboard!');
	  });
	});

	document.getElementById('import-btn')?.addEventListener('click', () => {
	  const json = prompt('Paste your flow JSON:');
	  if (json) {
		try {
		  const data = JSON.parse(json);
		  this.importFlow(data);
		} catch (error) {
		  console.error('Import error:', error);
		  alert('Invalid JSON format');
		}
	  }
	});
  }

  setupSVGExport() {
	document.getElementById('export-svg-btn')?.addEventListener('click', () => {
	  const exporter = new SVGExporter(this.nodeManager.nodes, this.connectionManager.connections);
	  exporter.export();
	});
  }

  importFlow(data) {
	// Clear existing nodes and connections
	this.nodeManager.nodes.forEach(node => {
	  const el = document.getElementById(node.id);
	  if (el) el.remove();
	});
	this.nodeManager.nodes = [];
	this.connectionManager.connections = [];

	// Recreate nodes with their content
	data.nodes.forEach(node => {
	  const newNode = this.nodeManager.createNode(
		node.type, 
		node.x, 
		node.y, 
		this.connectionManager
	  );

	  if (node.content) {
		const inputs = newNode.querySelectorAll('input');
		const selects = newNode.querySelectorAll('select');

		node.content.inputs.forEach((value, i) => {
		  if (inputs[i]) inputs[i].value = value;
		});
		node.content.selects.forEach((value, i) => {
		  if (selects[i]) selects[i].value = value;
		});
	  }
	});

	// Recreate connections
	data.connections.forEach(conn => {
	  this.connectionManager.createConnection(conn.from, conn.to);
	});
  }
}