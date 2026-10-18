declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export function extractRawText(options: {
    arrayBuffer?: ArrayBuffer;
    path?: string;
    buffer?: Buffer;
  }): Promise<RawTextResult>;

  export function convertToHtml(options: {
    arrayBuffer?: ArrayBuffer;
    path?: string;
    buffer?: Buffer;
  }): Promise<{ value: string; messages: any[] }>;
}
