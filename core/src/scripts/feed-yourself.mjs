// scripts/generate-data.mjs
import 'dotenv/config';
import { google } from 'googleapis';
import { promises as fs } from 'node:fs'; // Use promises API for async operations
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Polyfill for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Configuration ---
// Make sure to set this environment variable in your CI/CD pipeline
// Example: GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", ...}'
const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}');

// Replace with your Google Sheet ID (from the URL of your sheet)
const SPREADSHEET_ID = '1cR05XN_ezXbB811eBvhY_-g7bmscmoLfbhzSOpG1U5U';

// Define which sheets to process and where to save their JSON
const sheetsToProcess = [
  { name: 'General', outputPath: 'data/feed/general-guide.json' },
  { name: 'Stock', outputPath: 'data/feed/stock.json' },
  { name: 'Cook', outputPath: 'data/feed/cook.json' },
];

async function generateJsonFromSheet(sheetName, outputPath) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: serviceAccountKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`, // Adjust range as needed
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.warn(`No data found in sheet: ${sheetName}`);
      return;
    }

    // Assume first row are headers
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Trim header and row values
        const cleanHeader = header.trim();
        const value = (row[index] || '').trim(); // Handle empty cells gracefully
        obj[cleanHeader] = value;
      });
      return obj;
    });

    const fullOutputPath = join(__dirname, '..', outputPath);
    await fs.mkdir(dirname(fullOutputPath), { recursive: true });
    await fs.writeFile(fullOutputPath, JSON.stringify(data, null, 2));

    console.log(`Successfully generated <span class="math-inline">\{outputPath\} from sheet "</span>{sheetName}".`);
  } catch (error) {
    console.error(`Error processing sheet "${sheetName}":`, error);
    throw error; // Re-throw to fail the build if conversion fails
  }
}

async function main() {
  console.log('Starting data generation from Google Sheets...');
  for (const sheetConfig of sheetsToProcess) {
    await generateJsonFromSheet(sheetConfig.name, sheetConfig.outputPath);
  }
  console.log('All data generation complete.');
}

main().catch(error => {
  console.error('Data generation failed:', error);
  process.exit(1); // Exit with a non-zero code to indicate failure
});