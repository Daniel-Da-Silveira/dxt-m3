// app/assets/javascripts/flowbuilder/managers/NodeManager.js
import { NODE_CONFIGS } from '../constants.js';

export class NodeManager {
  constructor(canvas, zoomLevel, connectionManager) {  // Added connectionManager parameter
	this.canvas = canvas;
	this.zoomLevel = zoomLevel;
	this.nodes = [];
	this.connectionManager = connectionManager;  // Store reference to connectionManager
  }

  createNode(type, x, y, connectionManager) {
	if (!this.connectionManager) {
	  this.connectionManager = connectionManager;  // Set if not already set
	}
	const nodeId = `node-${Date.now()}`;
	const node = document.createElement('div');
	node.id = nodeId;
	node.classList.add('canvas-node');
	node.setAttribute('data-type', type);
	node.style.left = `${x}px`;
	node.style.top = `${y}px`;

	const config = NODE_CONFIGS[type];
	node.innerHTML = `
	  <div class="node-header">${config.title}</div>
	  <div class="node-content">${config.content}</div>
	  <div class="connection-points">
		<div class="connection-point left" data-node="${nodeId}"></div>
		<div class="connection-point right" data-node="${nodeId}"></div>
	  </div>
	  <button class="delete-node-btn">Delete</button>
	`;

	this.setupNodeDragging(node);
	this.setupConnectionPoints(node);
	this.setupDeleteButton(node, nodeId);

	this.canvas.appendChild(node);
	this.nodes.push({ id: nodeId, type, x, y });
	return node;
  }

  setupNodeDragging(node) {
	let isDragging = false;
	let startX, startY;

	const shouldIgnoreDrag = (e) => {
	  return e.target.classList.contains('connection-point') ||
		['input', 'select', 'button'].includes(e.target.tagName.toLowerCase());
	};

	const handleMouseDown = (e) => {
	  if (shouldIgnoreDrag(e)) return;
	  
	  isDragging = true;
	  startX = e.clientX - node.offsetLeft * this.zoomLevel;
	  startY = e.clientY - node.offsetTop * this.zoomLevel;
	  node.classList.add('dragging');
	};

	const handleMouseMove = (e) => {
	  if (!isDragging) return;

	  let x = (e.clientX - startX) / this.zoomLevel;
	  let y = (e.clientY - startY) / this.zoomLevel;

	  x = Math.round(x / 20) * 20;
	  y = Math.round(y / 20) * 20;

	  node.style.left = `${x}px`;
	  node.style.top = `${y}px`;

	  // Update connections while dragging
	  if (this.connectionManager) {
		this.connectionManager.updateConnections(this.zoomLevel);
	  }
	};

	const handleMouseUp = () => {
	  if (isDragging) {
		node.classList.remove('dragging');
		isDragging = false;

		const nodeData = this.nodes.find(n => n.id === node.id);
		if (nodeData) {
		  nodeData.x = Math.round(parseFloat(node.style.left) / 20) * 20;
		  nodeData.y = Math.round(parseFloat(node.style.top) / 20) * 20;
		  // Update connections after drag ends
		  if (this.connectionManager) {
			this.connectionManager.updateConnections(this.zoomLevel);
		  }
		}
	  }
	};

	node.addEventListener('mousedown', handleMouseDown);
	document.addEventListener('mousemove', handleMouseMove);
	document.addEventListener('mouseup', handleMouseUp);
  }

  setupConnectionPoints(node) {
	const rightPoint = node.querySelector('.connection-point.right');
	rightPoint.addEventListener('mousedown', (e) => {
	  e.stopPropagation();
	  if (!this.connectionManager) return;
	  
	  const moveHandler = this.connectionManager.startDrawingConnection(e, node.id, this.canvas, this.zoomLevel);
	  
	  document.addEventListener('mousemove', (e) => moveHandler(e, this.canvas, this.zoomLevel));
	  document.addEventListener('mouseup', (e) => {
		const connectionPoint = e.target.closest('.connection-point');
		if (connectionPoint && connectionPoint.classList.contains('left')) {
		  this.connectionManager.finishConnection(connectionPoint.dataset.node);
		} else {
		  this.connectionManager.cleanupTemporaryConnection();
		}
		this.canvas.classList.remove('drawing-connection');
	  }, { once: true });
	});
  }

  setupDeleteButton(node, nodeId) {
	node.querySelector('.delete-node-btn').addEventListener('click', () => {
	  node.remove();
	  this.nodes = this.nodes.filter(n => n.id !== nodeId);
	  if (this.connectionManager) {
		this.connectionManager.removeConnectionsForNode(nodeId);
	  }
	});
  }

  getNodeData() {
	return this.nodes.map(node => {
	  const el = document.getElementById(node.id);
	  return {
		...node,
		content: {
		  inputs: Array.from(el.querySelectorAll('input')).map(input => input.value),
		  selects: Array.from(el.querySelectorAll('select')).map(select => select.value)
		}
	  };
	});
  }
}