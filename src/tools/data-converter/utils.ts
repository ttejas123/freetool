import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { parquetReadObjects } from 'hyparquet';
import { parquetWriteBuffer } from 'hyparquet-writer';

export type SupportedFormat = 'json' | 'csv' | 'excel' | 'parquet';

export interface ParseResult {
  data: any[];
  columns: string[];
  error?: string;
}

/**
 * Flattens nested objects into a single level
 */
export function flattenObject(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, k: string) => {
    const pre = prefix.length ? prefix + '.' : '';
    if (typeof obj[k] === 'object' && obj[k] !== null && !Array.isArray(obj[k])) {
      Object.assign(acc, flattenObject(obj[k], pre + k));
    } else {
      acc[pre + k] = obj[k];
    }
    return acc;
  }, {});
}

/**
 * Parses input data from various formats
 */
export async function parseData(
  input: string | ArrayBuffer,
  format: SupportedFormat,
  options?: { delimiter?: string }
): Promise<ParseResult> {
  try {
    switch (format) {
      case 'json': {
        const text = typeof input === 'string' ? input : new TextDecoder().decode(input);
        let parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) parsed = [parsed];
        const data = parsed.map((item: any) => flattenObject(item));
        const columns:any = Array.from(new Set(data.flatMap((d:any) => Object.keys(d))));
        return { data, columns };
      }

      case 'csv': {
        const text = typeof input === 'string' ? input : new TextDecoder().decode(input);
        return new Promise((resolve) => {
          Papa.parse(text, {
            header: true,
            dynamicTyping: true,
            skipEmptyLines: true,
            delimiter: options?.delimiter || ',',
            complete: (results) => {
              const columns = results.meta.fields || [];
              resolve({ data: results.data, columns });
            },
            error: (err:any) => resolve({ data: [], columns: [], error: err.message })
          });
        });
      }

      case 'excel': {
        const buffer = typeof input === 'string' ? new TextEncoder().encode(input).buffer : input;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);
        const columns = data.length > 0 ? Object.keys(data[0] as object) : [];
        return { data, columns };
      }

      case 'parquet': {
        const buffer = typeof input === 'string' ? new TextEncoder().encode(input).buffer : input;
        const arrayBuffer = buffer as ArrayBuffer;
        
        const file = {
          byteLength: arrayBuffer.byteLength,
          async read(offset: number, length: number) {
            return new Uint8Array(arrayBuffer.slice(offset, offset + length));
          }
        };
        
        const data = await parquetReadObjects({ file });
        const columns = data.length > 0 ? Object.keys(data[0] as object) : [];
        return { data, columns };
      }

      default:
        return { data: [], columns: [], error: 'Unsupported format' };
    }
  } catch (err: any) {
    console.error('Data conversion error:', err);
    return { data: [], columns: [], error: err.message || 'Error parsing data' };
  }
}

/**
 * Exports data to various formats
 */
export async function exportData(
  data: any[],
  format: SupportedFormat,
  options?: { delimiter?: string; filename?: string }
): Promise<Blob> {
  switch (format) {
    case 'json': {
      const json = JSON.stringify(data, null, 2);
      return new Blob([json], { type: 'application/json' });
    }

    case 'csv': {
      const csv = Papa.unparse(data, {
        delimiter: options?.delimiter || ','
      });
      return new Blob([csv], { type: 'text/csv' });
    }

    case 'excel': {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    }

    case 'parquet': {
      if (data.length === 0) throw new Error('No data to export');
      
      const columns = Object.keys(data[0]);
      const columnData = columns.map(col => {
        const columnRawData = data.map(row => row[col]);
        
        // Check for type consistency (e.g., strings vs numbers)
        const types = new Set(
          columnRawData
            .filter(v => v !== null && v !== undefined)
            .map(v => typeof v)
        );
        
        const isMixed = types.size > 1;

        return {
          name: col,
          data: columnRawData.map(val => {
            if (val === null || val === undefined) return null;
            
            // If mixed types, cast everything to string to avoid writer errors
            if (isMixed) return String(val);
            
            if (val instanceof Date) return val.getTime();
            if (typeof val === 'object') return JSON.stringify(val);
            return val;
          }),
        };
      });

      const parquetBuffer = parquetWriteBuffer({ columnData });
      return new Blob([parquetBuffer], { type: 'application/octet-stream' });
    }

    default:
      throw new Error('Unsupported export format');
  }
}

/**
 * Detects format from filename or content
 */
export function detectFormat(filename: string): SupportedFormat | null {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'json') return 'json';
  if (ext === 'csv') return 'csv';
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  if (ext === 'parquet') return 'parquet';
  return null;
}
