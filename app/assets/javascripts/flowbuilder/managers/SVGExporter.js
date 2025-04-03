// app/assets/javascripts/flowbuilder/managers/SVGExporter.js
import { createSVGElement, calculatePath } from '../utils.js';

export class SVGExporter {
  constructor(nodes, connections) {
	this.nodes = nodes;
	this.connections = connections;
  }

  getCanvasBounds() {
	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	this.nodes.forEach(node => {
	  minX = Math.min(minX, node.x);
	  minY = Math.min(minY, node.y);
	  maxX = Math.max(maxX, node.x + 200);
	  maxY = Math.max(maxY, node.y + 80);
	});

	const padding = 20;
	return {
	  x: minX - padding,
	  y: minY - padding,
	  width: maxX - minX + padding * 2,
	  height: maxY - minY + padding * 2
	};
  }

  createSVGStyles() {
	const style = createSVGElement('style');
	style.textContent = `
	  .node { 
		fill: white; 
		stroke: black; 
		stroke-width: 2px;
		rx: 4; 
	  }
	  .node-question { 
		fill: white;
		stroke: black;
	  }
	  .node-condition { 
		fill: white;
		stroke: black;
	  }
	  .node-end { 
		fill: white;
		stroke: black;
		stroke-width: 2px;
	  }
	  .node-text { 
		font-family: "GDS Transport", arial, sans-serif; 
		fill: black;
		font-weight: bold;
	  }
	  .node-content { 
		font-size: 12px; 
		fill: black;
	  }
	  .connection { 
		stroke: black; 
		fill: none; 
		stroke-width: 2;
	  }
	`;
	return style;
  }

  createSVGNode(node) {
	const nodeGroup = createSVGElement('g');
	const rect = createSVGElement('rect');

	rect.setAttribute('x', node.x.toString());
	rect.setAttribute('y', node.y.toString());
	rect.setAttribute('width', '200');
	rect.setAttribute('height', '80');
	rect.setAttribute('class', `node node-${node.type}`);
	nodeGroup.appendChild(rect);

	const title = createSVGElement('text');
	title.setAttribute('x', (node.x + 10).toString());
	title.setAttribute('y', (node.y + 25).toString());
	title.setAttribute('class', 'node-text');

	const domNode = document.getElementById(node.id);
	if (domNode) {
	  title.textContent = domNode.querySelector('.node-header').textContent;

	  const content = createSVGElement('text');
	  content.setAttribute('x', (node.x + 10).toString());
	  content.setAttribute('y', (node.y + 45).toString());
	  content.setAttribute('class', 'node-content');

	  const input = domNode.querySelector('input');
	  if (input) {
		content.textContent = input.value || input.placeholder;
	  }

	  const select = domNode.querySelector('select');
	  if (select) {
		content.textContent = select.value;
	  }

	  nodeGroup.appendChild(content);
	}

	nodeGroup.appendChild(title);
	return nodeGroup;
  }

  createSVGConnection(fromNode, toNode) {
	const path = createSVGElement('path');
	path.setAttribute('class', 'connection');

	const startX = fromNode.x + 200;
	const startY = fromNode.y + 40;
	const endX = toNode.x;
	const endY = toNode.y + 40;

	const d = calculatePath(startX, startY, endX, endY);
	path.setAttribute('d', d);

	return path;
  }

  export() {
	const bounds = this.getCanvasBounds();
	const svg = createSVGElement('svg');
	
	svg.setAttribute('width', bounds.width.toString());
	svg.setAttribute('height', bounds.height.toString());
	svg.setAttribute('viewBox', `${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`);

	svg.appendChild(this.createSVGStyles());

	// Add nodes
	const nodesGroup = createSVGElement('g');
	this.nodes.forEach(node => {
	  nodesGroup.appendChild(this.createSVGNode(node));
	});
	svg.appendChild(nodesGroup);

	// Add connections
	const connectionsGroup = createSVGElement('g');
	this.connections.forEach(conn => {
	  const fromNode = this.nodes.find(n => n.id === conn.from);
	  const toNode = this.nodes.find(n => n.id === conn.to);

	  if (fromNode && toNode) {
		connectionsGroup.appendChild(this.createSVGConnection(fromNode, toNode));
	  }
	});
	svg.appendChild(connectionsGroup);

	// Export to clipboard
	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svg);
	navigator.clipboard.writeText(svgString)
	  .then(() => alert('SVG exported to clipboard!'))
	  .catch(err => {
		console.error('Failed to copy SVG to clipboard:', err);
		alert('Failed to export SVG to clipboard');
	  });
  }
}