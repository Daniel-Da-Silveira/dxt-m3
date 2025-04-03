// app/assets/javascripts/flowbuilder/utils.js
export function createSVGElement(type) {
  return document.createElementNS('http://www.w3.org/2000/svg', type);
}

export function calculatePath(startX, startY, endX, endY) {
  const midX = startX + (endX - startX) / 2;
  return `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`;
}