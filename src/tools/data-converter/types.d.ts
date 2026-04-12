declare module 'hyparquet' {
  export interface AsyncBuffer {
    byteLength: number;
    read(offset: number, length: number): Promise<Uint8Array>;
  }

  export interface ParquetReadOptions {
    file: AsyncBuffer;
    columns?: string[];
    rowStart?: number;
    rowEnd?: number;
    compressors?: any;
  }

  export function parquetReadObjects(options: ParquetReadOptions): Promise<any[]>;
}

declare module 'hyparquet-writer' {
  export interface ColumnData {
    name: string;
    data: any[];
    type?: string;
  }

  export interface ParquetWriteOptions {
    columnData: ColumnData[];
  }

  export function parquetWriteBuffer(options: ParquetWriteOptions): ArrayBuffer;
}
