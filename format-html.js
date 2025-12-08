#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Check if filename is provided
if (process.argv.length < 3) {
  console.error('Usage: node format-html.js <filename.csv>');
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

// Extract month and year from filename
const monthName = filename.replace('_2026.csv', '').charAt(0).toUpperCase() + filename.replace('_2026.csv', '').slice(1);
const year = '2026';

// Build HTML content
let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Byzantine Calendar - ${monthName} ${year}</title>
  <style>
    body {
      font-family: Georgia, serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fafafa;
      color: #333;
    }
    h1 {
      text-align: center;
      color: #8b0000;
      border-bottom: 2px solid #8b0000;
      padding-bottom: 10px;
    }
    .day-entry {
      background-color: white;
      padding: 20px;
      margin-bottom: 20px;
      border-left: 4px solid #8b0000;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .date {
      font-size: 1.3em;
      font-weight: bold;
      color: #8b0000;
      margin-bottom: 10px;
    }
    .commemorations {
      font-style: italic;
      margin-bottom: 10px;
      color: #555;
    }
    .readings-link {
      margin-bottom: 15px;
    }
    .readings-link a {
      color: #1a5490;
      text-decoration: none;
      font-weight: bold;
    }
    .readings-link a:hover {
      text-decoration: underline;
    }
    .about, .remarks {
      margin-top: 15px;
      line-height: 1.6;
      text-align: justify;
    }
    .about {
      color: #444;
    }
    .remarks {
      color: #666;
      font-style: italic;
    }
    .label {
      font-weight: bold;
      color: #8b0000;
    }
  </style>
</head>
<body>
  <h1>Byzantine Calendar - ${monthName} ${year}</h1>
`;

// Process each line
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

  // Build HTML for this day
  htmlContent += `  <div class="day-entry">
    <div class="date">${date}</div>
    <div class="commemorations">${commemorations}</div>
    <div class="readings-link">
      <span class="label">Readings:</span> <a href="${formatReadingsURL(readings)}" target="_blank">View Readings</a>
    </div>
`;

  // Add About Today if present
  if (about && about.trim()) {
    htmlContent += `    <div class="about">
      <span class="label">About:</span> ${about}
    </div>
`;
  }

  // Add Remarks if present
  if (remarks && remarks.trim()) {
    htmlContent += `    <div class="remarks">
      <span class="label">Remarks:</span> ${remarks}
    </div>
`;
  }

  htmlContent += `  </div>
`;
});

// Close HTML
htmlContent += `</body>
</html>
`;

// Create html directory if it doesn't exist
const htmlDir = path.join(__dirname, 'html');
if (!fs.existsSync(htmlDir)) {
  fs.mkdirSync(htmlDir, { recursive: true });
}

// Write output to file in html directory
const outputFilename = filename.replace('.csv', '.html');
const outputPath = path.join(htmlDir, outputFilename);

fs.writeFileSync(outputPath, htmlContent);

console.log(`Output written to html/${outputFilename}`);
