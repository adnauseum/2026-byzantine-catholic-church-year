#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if filename is provided
if (process.argv.length < 3) {
  console.error('Usage: node format-calendar.js <filename.csv>');
  process.exit(1);
}

const filename = process.argv[2];
const filepath = path.join(__dirname, filename);

// Check if file exists
if (!fs.existsSync(filepath)) {
  console.error(`Error: File ${filename} not found`);
  process.exit(1);
}

// Read and parse CSV
const content = fs.readFileSync(filepath, 'utf-8');
const lines = content.split('\n').filter(line => line.trim());

// Skip header row
const dataLines = lines.slice(1);

// Function to parse CSV line (handles quoted fields with commas)
function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current.trim());

  return fields;
}

// Function to format readings for Bible Gateway URL
function formatReadingsURL(readings) {
  if (!readings) return '';

  // Split readings by | (gospels are separated)
  const readingSets = readings.split('|');

  // Parse all readings and collect them
  const allReadings = [];

  readingSets.forEach(set => {
    // Split by comma to get individual readings
    const parts = set.split(',').map(p => p.trim());
    allReadings.push(...parts);
  });

  // Encode readings for URL (join with comma)
  const readingsParam = allReadings.join(',');
  const encodedReadings = encodeURIComponent(readingsParam);

  return `https://www.biblegateway.com/passage/?search=${encodedReadings}&version=RSVCE`;
}

// Process each line
const output = [];

dataLines.forEach(line => {
  if (!line.trim()) return;

  const fields = parseCSVLine(line);

  // Extract fields (based on CSV structure)
  const date = fields[0];
  const dayName = fields[1];
  const readings = fields[2];
  const about = fields[11]; // "About Today" column
  const remarks = fields[12]; // "Remarks" column

  // Skip empty lines
  if (!date || !dayName) return;

  // Format commemorations (replace | with comma)
  const commemorations = dayName.replace(/\|/g, ', ');

  // Format the output
  output.push(`${date}`);
  output.push(`Commemorations: ${commemorations}`);
  output.push(`Link to readings: ${formatReadingsURL(readings)}`);

  // Add About Today if present
  if (about && about.trim()) {
    output.push(`About: ${about}`);
  }

  // Add Remarks if present
  if (remarks && remarks.trim()) {
    output.push(`Remarks: ${remarks}`);
  }

  output.push(''); // Empty line between entries
});

// Create txt directory if it doesn't exist
const txtDir = path.join(__dirname, 'txt');
if (!fs.existsSync(txtDir)) {
  fs.mkdirSync(txtDir, {recursive: true});
}

// Write output to file in txt directory
const outputFilename = filename.replace('.csv', '.txt');
const outputPath = path.join(txtDir, outputFilename);

fs.writeFileSync(outputPath, output.join('\n'));

console.log(`Output written to txt/${outputFilename}`);
