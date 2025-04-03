const fs = require('fs').promises;
const path = require('path');

const dbPath = path.join(__dirname, '/data/comments.json'); // Adjust if necessary

async function readData() {
  try {
	console.log('Reading data from:', dbPath);
	const rawData = await fs.readFile(dbPath, 'utf8');

	if (!rawData.trim()) {
	  console.warn('data.json is empty. Initializing with default structure.');
	  return { comments: [] };
	}

	const parsedData = JSON.parse(rawData);

	if (!Array.isArray(parsedData.comments)) {
	  console.warn('Missing or invalid "comments" property in data.json. Initializing with default structure.');
	  parsedData.comments = [];
	}

	return parsedData;
  } catch (err) {
	console.error('Error reading data.json:', err.message, err.stack);
	throw err;
  }
}

async function writeData(data) {
  try {
	console.log('Writing data to file:', data);
	await fs.writeFile(dbPath, JSON.stringify(data, null, 2), 'utf8');
	console.log('Data written successfully');
  } catch (err) {
	console.error('Error writing data.json:', err.message, err.stack);
	throw err;
  }
}

async function getComments() {
  try {
	const data = await readData();
	console.log('Comments loaded:', data.comments);
	return data.comments || [];
  } catch (err) {
	console.error('Error in getComments:', err.message, err.stack);
	throw err;
  }
}

async function updateComments(comments) {
  try {
	const data = await readData();
	data.comments = comments;
	await writeData(data);
	console.log('Comments updated successfully');
  } catch (err) {
	console.error('Error in updateComments:', err.message, err.stack);
	throw err;
  }
}

module.exports = {
  readData,
  writeData,
  getComments,
  updateComments,
};