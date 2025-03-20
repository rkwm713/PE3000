import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  Row,
  Column,
  Table
} from '@tanstack/react-table';
import { PoleData } from '../types';

const columnHelper = createColumnHelper<PoleData>();

interface DataTableProps {
  data: PoleData[];
  onDataChange: (updatedData: PoleData[]) => void;
}

// Define prop types for EditableCell
interface EditableCellProps {
  getValue: () => string | number | undefined;
  row: Row<PoleData>;
  column: Column<PoleData, unknown>;
  table: Table<PoleData>;
  onDataChange: (updatedData: PoleData[]) => void;
}

// Editable cell component to avoid React hooks inside the cell renderer
const EditableCell: React.FC<EditableCellProps> = ({ getValue, row, column, table, onDataChange }) => {
  const initialValue = getValue() || '';
  const [value, setValue] = useState(initialValue);
  
  const onBlur = () => {
    if (value !== initialValue) {
      const newData = [...table.options.data];
      newData[row.index] = {
        ...newData[row.index],
        [column.id]: value
      };
      onDataChange(newData);
    }
  };
  
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
      onBlur={onBlur}
      className="p-1 border rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
};

export const DataTable: React.FC<DataTableProps> = ({ data, onDataChange }) => {
  // Copy function for rows with rich text formatting
  const handleCopy = (rowData: PoleData) => {
    // Create an HTML table for rich text formatting
    const htmlContent = `
      <div style="font-family: 'Times New Roman', Times, serif; font-size: 12pt;">
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="font-weight: bold;">${rowData.stationId}</td>
            <td>${rowData.existingLoading.toFixed(2)}%</td>
            <td>${rowData.finalLoading.toFixed(2)}%</td>
            <td>${rowData.description || ''}</td>
          </tr>
        </table>
      </div>
    `;
    
    // Create a contentEditable div to handle rich text copy
    const el = document.createElement('div');
    el.contentEditable = 'true';
    el.innerHTML = htmlContent;
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Select the content
    const range = document.createRange();
    range.selectNodeContents(el);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
    
    // Execute copy command for rich text
    document.execCommand('copy');
    document.body.removeChild(el);
    
    // Show a simple alert for confirmation
    alert('Formatted data copied to clipboard! (Times New Roman 12pt with bold Station ID)');
  };

  const columns = React.useMemo(() => [
    columnHelper.accessor('stationId', {
      header: 'Station ID/Pole Number',
      cell: props => <EditableCell {...props} onDataChange={onDataChange} />,
    }),
    columnHelper.accessor('existingLoading', {
      header: 'Existing Loading %',
      cell: info => `${info.getValue().toFixed(2)}%`,
    }),
    columnHelper.accessor('finalLoading', {
      header: 'Final Loading %',
      cell: info => `${info.getValue().toFixed(2)}%`,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: props => <EditableCell {...props} onDataChange={onDataChange} />,
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Action',
      cell: ({ row }) => (
        <div>
          <button
            onClick={() => handleCopy(row.original)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
          >
            Copy
          </button>
        </div>
      ),
    }),
  ], [onDataChange]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id}>
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
