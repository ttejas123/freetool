'use client';

import React, { useState, useMemo } from 'react';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from 'lucide-react';

interface DataTableProps {
  data: any[];
  columns: string[];
}

export const DataTable: React.FC<DataTableProps> = ({ data, columns }) => {
  const [globalSearch, setGlobalSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Reset page when filters change
  const handleGlobalSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleColumnFilterChange = (col: string, val: string) => {
    setColumnFilters(prev => ({ ...prev, [col]: val }));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Global Search
      if (globalSearch) {
        const matchesGlobal = columns.some(col => String(row[col] ?? '').toLowerCase().includes(globalSearch.toLowerCase()));
        if (!matchesGlobal) return false;
      }
      
      // Column Filters
      for (const col of Object.keys(columnFilters)) {
        const filterVal = columnFilters[col];
        if (filterVal) {
          const rowVal = String(row[col] ?? '').toLowerCase();
          if (!rowVal.includes(filterVal.toLowerCase())) return false;
        }
      }
      
      return true;
    });
  }, [data, columns, globalSearch, columnFilters]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key] ?? '';
      const bVal = b[sortConfig.key] ?? '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortConfig]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 max-w-sm">
        <Search className="w-5 h-5 text-gray-400" />
        <Input 
          placeholder="Global search..." 
          value={globalSearch} 
          onChange={handleGlobalSearchChange} 
        />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900/50">
            <tr>
              {columns.map(col => (
                <th key={col} className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                  <div className="flex flex-col gap-2">
                    <button 
                      className="flex items-center gap-1 hover:text-brand-600 focus:outline-none"
                      onClick={() => handleSort(col)}
                    >
                      {col}
                      {sortConfig?.key === col && (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      )}
                    </button>
                    <Input 
                      className="h-7 text-xs px-2 py-1 placeholder:text-gray-400 font-normal w-32" 
                      placeholder="Filter..." 
                      value={columnFilters[col] || ''} 
                      onChange={(e) => handleColumnFilterChange(col, e.target.value)}
                    />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {columns.map(col => (
                  <td key={col} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 max-w-[300px] truncate" title={String(row[col] ?? '')}>
                    {String(row[col] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-gray-500">
                  No data points found matching criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} entries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-md">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
