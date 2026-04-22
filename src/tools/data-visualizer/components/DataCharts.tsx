'use client';

import React, { useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

interface DataChartsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[];
  columns: string[];
}

const COLORS = ['#0ea5e9', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export const DataCharts: React.FC<DataChartsProps> = ({ data, columns }) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [xAxis, setXAxis] = useState(columns[0] || '');
  const [yAxis, setYAxis] = useState(columns.length > 1 ? columns[1] : columns[0] || '');

  // Prepare chart data (take first 100 rows for performance to avoid lag)
  const chartData = data.slice(0, 100).map(row => ({
    ...row,
    // Try to parse Y axis as number for charts
    [yAxis]: typeof row[yAxis] === 'string' && !isNaN(Number(row[yAxis])) ? Number(row[yAxis]) : row[yAxis]
  }));

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgb(31, 41, 55)', color: '#fff', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey={yAxis} fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey={xAxis} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'rgb(31, 41, 55)', color: '#fff', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey={yAxis} stroke="#f43f5e" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey={yAxis}
                nameKey={xAxis}
                cx="50%"
                cy="50%"
                outerRadius={150}
                fill="#8884d8"
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'rgb(31, 41, 55)', color: '#fff', border: 'none', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  if (!columns.length) {
    return <div className="p-8 text-center text-gray-500">No data available for charting.</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle>Chart Configuration</CardTitle>
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {['bar', 'line', 'pie'].map((type) => (
              <button
                key={type}
                onClick={() => setChartType(type as any)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                  chartType === type 
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="xaxis-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">X-Axis Category</label>
              <select 
                id="xaxis-select"
                value={xAxis} 
                onChange={e => setXAxis(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label htmlFor="yaxis-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Y-Axis Value</label>
              <select 
                id="yaxis-select"
                value={yAxis} 
                onChange={e => setYAxis(e.target.value)}
                className="w-full h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm"
              >
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-xs text-gray-500 mb-4 text-center">Note: Charting is limited to the first 100 rows for performance.</p>
          {renderChart()}
        </CardContent>
      </Card>
    </div>
  );
};
