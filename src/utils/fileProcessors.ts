import * as XLSX from 'xlsx';
import { PoleData, FileProcessorFunction } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const processExcel: FileProcessorFunction = async (file: File): Promise<PoleData[]> => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    
    // Find the Analysis sheet
    const analysisSheet = workbook.Sheets['Analysis'];
    if (!analysisSheet) {
      throw new Error('Analysis sheet not found in Excel file');
    }

    const jsonData = XLSX.utils.sheet_to_json(analysisSheet, { header: 1 });
    const poleData: PoleData[] = [];

    // Scan through the entire sheet for pole sections
    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any[];
      if (!Array.isArray(row)) continue;

      const rowStr = row.map(cell => String(cell || '').toLowerCase()).join(' ');
      // Look for rows that contain the header pattern
      if (rowStr.includes('existing') && rowStr.includes('proposed') && rowStr.includes('remedy')) {
        // Get the pole number from the first column
        const poleNumber = row[0];
        if (!poleNumber || typeof poleNumber !== 'string' || !poleNumber.trim()) {
          continue; // Skip if no valid pole number
        }

        const stationId = poleNumber.trim();

        // Look for MEDIUM Load Case B within the next few rows
        let loadingCaseRow = -1;
        for (let j = i; j < Math.min(i + 10, jsonData.length); j++) {
          const checkRow = jsonData[j] as any[];
          if (!Array.isArray(checkRow)) continue;

          const checkRowStr = checkRow.map(cell => String(cell || '').toLowerCase()).join(' ');
          if (checkRowStr.includes('medium load case b')) {
            loadingCaseRow = j;
            break;
          }
        }

        if (loadingCaseRow === -1) continue;

        // Look for SF or Max% row
        let maxPercentRow = -1;
        for (let j = loadingCaseRow; j < Math.min(loadingCaseRow + 5, jsonData.length); j++) {
          const checkRow = jsonData[j] as any[];
          if (!Array.isArray(checkRow)) continue;

          const checkRowStr = checkRow.map(cell => String(cell || '').toLowerCase()).join(' ');
          if (checkRowStr.includes('sf or max%')) {
            maxPercentRow = j;
            break;
          }
        }

        if (maxPercentRow === -1) continue;

        // Get the values from the next row
        const valuesRow = jsonData[maxPercentRow + 1];
        if (!Array.isArray(valuesRow)) continue;

        // Find the first non-null value (Existing Loading %)
        let existingLoadingIndex = -1;
        let existingLoading: number | null = null;

        for (let j = 0; j < valuesRow.length; j++) {
          const value = valuesRow[j];
          if (value !== null && value !== undefined && !isNaN(Number(value))) {
            existingLoadingIndex = j;
            existingLoading = Number(value);
            break;
          }
        }

        if (existingLoadingIndex === -1 || existingLoading === null) continue;

        // Get Final Loading % from 4 cells to the right
        const finalLoadingValue = valuesRow[existingLoadingIndex + 4];
        if (finalLoadingValue === null || finalLoadingValue === undefined || isNaN(Number(finalLoadingValue))) {
          continue;
        }

        const finalLoading = Number(finalLoadingValue);

        poleData.push({
          stationId,
          existingLoading,
          finalLoading,
          description: 'Pole Loading Analysis'
        });

        // Skip a few rows to avoid processing the same section again
        i = maxPercentRow + 2;
      }
    }

    if (poleData.length === 0) {
      throw new Error('No valid pole data found in the Excel file');
    }

    return poleData;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
    throw new Error('Failed to process Excel file: Unknown error occurred');
  }
};

export const processPDF: FileProcessorFunction = async (file: File): Promise<PoleData[]> => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const poleData: PoleData[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((item: any) => item.str || '')
        .join(' ');

      // Find all pole sections
      const poleSections = text.split('Lead: Lead Location:').slice(1);

      for (const section of poleSections) {
        // Extract pole number from the start of the section
        const poleMatch = section.match(/^\s*([^\s]+)/);
        if (!poleMatch) continue;

        const poleNumber = poleMatch[1].trim();

        // Find the "Pole Stress" section and extract loading values
        const stressSection = section.match(/Pole Stress[\s\S]*?Maximum Load %[\s\S]*?Existing[^\d]*(\d+\.?\d*)[^\d]*Remedy[^\d]*(\d+\.?\d*)/i);
        
        if (stressSection) {
          const existingLoading = parseFloat(stressSection[1]);
          const finalLoading = parseFloat(stressSection[2]);

          if (!isNaN(existingLoading) && !isNaN(finalLoading)) {
            poleData.push({
              stationId: poleNumber,
              existingLoading,
              finalLoading,
              description: 'Project Analysis Summary'
            });
          }
        }
      }
    }

    if (poleData.length === 0) {
      throw new Error('No valid pole data found in the PDF');
    }

    return poleData;
  } catch (error) {
    console.error('Error processing PDF file:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process PDF file: ${error.message}`);
    }
    throw new Error('Failed to process PDF file: Unknown error occurred');
  }
};

export const processCSV: FileProcessorFunction = async (file: File): Promise<PoleData[]> => {
  if (!file) {
    throw new Error('No file provided');
  }

  try {
    const text = await file.text();
    const rows = text.split('\n').map(row => row.split(','));
    
    if (rows.length < 2) {
      throw new Error('CSV file is empty or contains no data rows');
    }

    const headers = rows[0].map(h => h.trim().toLowerCase());

    const stationIdIndex = headers.findIndex(h => h.includes('station') || h.includes('pole'));
    const existingLoadingIndex = headers.findIndex(h => h.includes('existing'));
    const finalLoadingIndex = headers.findIndex(h => h.includes('final'));
    const descriptionIndex = headers.findIndex(h => h.includes('description'));

    if (stationIdIndex === -1 || existingLoadingIndex === -1 || finalLoadingIndex === -1) {
      throw new Error('Required columns not found in CSV. File must contain station/pole, existing, and final columns.');
    }

    const poleData = rows.slice(1)
      .filter(row => row.length >= Math.max(stationIdIndex, existingLoadingIndex, finalLoadingIndex))
      .map(row => {
        const stationId = row[stationIdIndex].trim();
        const existingLoading = parseFloat(row[existingLoadingIndex]);
        const finalLoading = parseFloat(row[finalLoadingIndex]);
        
        if (!stationId || isNaN(existingLoading) || isNaN(finalLoading)) {
          return null;
        }

        return {
          stationId,
          existingLoading,
          finalLoading,
          description: descriptionIndex !== -1 ? row[descriptionIndex]?.trim() : 'CSV Import'
        };
      })
      .filter((data): data is PoleData => data !== null);

    if (poleData.length === 0) {
      throw new Error('No valid pole data found in the CSV file');
    }

    return poleData;
  } catch (error) {
    console.error('Error processing CSV file:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to process CSV file: ${error.message}`);
    }
    throw new Error('Failed to process CSV file: Unknown error occurred');
  }
};