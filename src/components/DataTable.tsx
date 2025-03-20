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
  // Copy function for rows
  const handleCopy = (rowData: PoleData) => {
    // Format data for Word table (tab-separated for easy pasting)
    const formattedData = `${rowData.stationId}\t${rowData.existingLoading.toFixed(2)}%\t${rowData.finalLoading.toFixed(2)}%\t${rowData.description || ''}`;
    
    // Create a simple text area element to handle the copy
    const el = document.createElement('textarea');
    el.value = formattedData;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    // Show a simple alert for confirmation
    alert('Data copied to clipboard for Word!');
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
