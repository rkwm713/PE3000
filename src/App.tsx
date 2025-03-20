import React, { useState } from 'react';
import './styles/engineeringBackground.css';
import { FileUpload } from './components/FileUpload';
import { DataTable } from './components/DataTable';
import { PoleData } from './types';
import { processExcel, processPDF, processCSV } from './utils/fileProcessors';
import { AlertCircle } from 'lucide-react';

function App() {
  const [poleData, setPoleData] = useState<PoleData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFiles = async (files: File[]) => {
    setError(null);
    setIsLoading(true);

    try {
      const allData: PoleData[] = [];

      for (const file of files) {
        let processor;
        if (file.name.endsWith('.xlsx')) {
          processor = processExcel;
        } else if (file.name.endsWith('.pdf')) {
          processor = processPDF;
        } else if (file.name.endsWith('.csv')) {
          processor = processCSV;
        } else {
          throw new Error(`Unsupported file type: ${file.name}`);
        }

        const data = await processor(file);
        allData.push(...data);
      }

      setPoleData(allData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred processing the files');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen engineering-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="stress-indicators"></div>
      <div className="lightning-bolts">
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
        <div className="lightning-bolt"></div>
      </div>
      <div className="circuit-paths"></div>
      <div className="pulse-signals"></div>
      <div className="max-w-7xl mx-auto content-overlay p-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Pole Loading Analyzer</h1>
          <p className="mt-2 text-sm text-gray-600">
            Upload your pole loading data files (PDF, Excel, or CSV) to analyze and display the results
          </p>
        </div>

        <div className="mt-8">
          <FileUpload onFilesAccepted={handleFiles} />
        </div>

        {isLoading && (
          <div className="mt-8 text-center text-gray-600">
            Processing files...
          </div>
        )}

        {error && (
          <div className="mt-8 p-4 bg-red-50 rounded-md">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="ml-2 text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {poleData.length > 0 && (
          <div className="mt-8">
            <DataTable data={poleData} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
