// app/assets/javascripts/flowbuilder/managers/ConnectionManager.js

import { createSVGElement, calculatePath } from '../utils.js';

export class ConnectionManager {
  constructor(svgLayer, nodes) {
	this.svgLayer = svgLayer;
	this.nodes = nodes;
	this.connections = [];
	this.isDrawingLine = false;
	this.temporaryLine = null;
  }

  // Helper method to get transformed coordinates
  getTransformedCoordinates(element, canvasRect, zoomLevel) {
	const rect = element.getBoundingClientRect();
	const matrix = new DOMMatrix(getComputedStyle(this.svgLayer.parentElement).transform);
	
	return {
	  x: (rect.left - canvasRect.left - matrix.e) / zoomLevel,
	  y: (rect.top - canvasRect.top - matrix.f) / zoomLevel,
	  width: rect.width / zoomLevel,
	  height: rect.height / zoomLevel
	};
  }

  startDrawingConnection(e, nodeId, canvas, zoomLevel) {
   e.preventDefault();
   this.isDrawingLine = true;
   canvas.classList.add('drawing-connection');
   
   const point = e.target;
   const canvasRect = canvas.getBoundingClientRect();
   const pointRect = point.getBoundingClientRect();
   
   console.log('Starting connection:', {
	 canvasRect,
	 pointRect,
	 transform: canvas.style.transform
   });
  
   this.temporaryStartX = pointRect.left - canvasRect.left;
   this.temporaryStartY = pointRect.top - canvasRect.top;
   this.zoomLevel = parseFloat(canvas.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
   
   this.temporaryLine = createSVGElement('path');
   this.temporaryLine.setAttribute('class', 'connection-line temporary');
   this.svgLayer.appendChild(this.temporaryLine);
   this.startNodeId = nodeId;
   return this.handleConnection.bind(this);
  }
  
  handleConnection(e, canvas, zoomLevel) {
	if (!this.isDrawingLine) return;
	const actualZoom = parseFloat(canvas.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
	const canvasRect = canvas.getBoundingClientRect();
	
	// Use the node's edge for the start point
	const startX = this.temporaryStartX / actualZoom;
	const startY = this.temporaryStartY / actualZoom;
	const endX = (e.clientX - canvasRect.left) / actualZoom;
	const endY = (e.clientY - canvasRect.top) / actualZoom;
	
	const path = calculatePath(startX, startY, endX, endY);
	this.temporaryLine.setAttribute('d', path);
  }
 
 drawConnection(fromNode, toNode, zoomLevel) {
   const fromPoint = fromNode.querySelector('.connection-point.right');
   const toPoint = toNode.querySelector('.connection-point.left');
   
   if (fromPoint && toPoint) {
	 const canvas = this.svgLayer.parentElement;
	 const actualZoom = parseFloat(canvas.style.transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
	 
	 const canvasRect = this.svgLayer.getBoundingClientRect();
	 const fromNodeRect = fromNode.getBoundingClientRect();
	 const toNodeRect = toNode.getBoundingClientRect();
	 
	 // Use the actual node edges instead of connection points
	 const startX = (fromNodeRect.left - canvasRect.left + fromNodeRect.width) / actualZoom;
	 const startY = (fromNodeRect.top - canvasRect.top + fromNodeRect.height/2) / actualZoom;
	 const endX = (toNodeRect.left - canvasRect.left) / actualZoom;
	 const endY = (toNodeRect.top - canvasRect.top + toNodeRect.height/2) / actualZoom;
	 
	 const path = createSVGElement('path');
	 path.classList.add('connection-line');
	 path.setAttribute('d', calculatePath(startX, startY, endX, endY));
	 this.svgLayer.appendChild(path);
   }
 }

  // Rest of the methods remain the same...
  finishConnection(endNodeId) {
	if (this.startNodeId !== endNodeId) {
	  this.createConnection(this.startNodeId, endNodeId);
	}
	this.cleanupTemporaryConnection();
  }

  cleanupTemporaryConnection() {
	this.isDrawingLine = false;
	if (this.temporaryLine) {
	  this.temporaryLine.remove();
	  this.temporaryLine = null;
	}
  }

  createConnection(fromId, toId) {
	if (!this.connections.some(conn => conn.from === fromId && conn.to === toId)) {
	  this.connections.push({ from: fromId, to: toId });
	  this.updateConnections(this.zoomLevel); // Pass the stored zoom level
	  
	  // Force redraw with correct zoom
	  this.drawConnection(
		document.getElementById(fromId),
		document.getElementById(toId),
		this.zoomLevel
	  );
	}
  }

  updateConnections(zoomLevel) {
	// Get current zoom if not provided
	if (!zoomLevel) {
	  const transform = this.svgLayer.parentElement.style.transform;
	  zoomLevel = parseFloat(transform.match(/scale\(([\d.]+)\)/)?.[1] || 1);
	}
	
	while (this.svgLayer.firstChild) {
	  this.svgLayer.removeChild(this.svgLayer.firstChild);
	}
	this.connections.forEach(conn => {
	  const fromNode = document.getElementById(conn.from);
	  const toNode = document.getElementById(conn.to);
	  if (fromNode && toNode) {
		this.drawConnection(fromNode, toNode, zoomLevel);
	  }
	});
  }

  removeConnectionsForNode(nodeId) {
	this.connections = this.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
	this.updateConnections();
  }
}