import React from 'react';

export interface Column<T> {
  header: string;
  accessor: (row: T, index: number) => React.ReactNode;
}

interface DataTableProps<T> {
  title?: string;
  columns: Column<T>[];
  data: T[];
}

export function DataTable<T>({ title, columns, data }: DataTableProps<T>) {
  return (
    <div className="bg-black/30 backdrop-blur-sm text-white p-6 rounded-xl border border-white/20">
      {title && <h3 className="text-center text-lg font-bold mb-4 text-white">{title}</h3>}

      <table className="w-full text-sm">
        <thead>
          <tr className="opacity-80 text-left border-b border-white/20">
            {columns.map((column, index) => (
              <th key={index} className="py-2 text-white">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b border-white/10">
              {columns.map((column, colIndex) => (
                <td key={colIndex} className="py-2 text-white/80">
                  {column.accessor(row, rowIndex)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}