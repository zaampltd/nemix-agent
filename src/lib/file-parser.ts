import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text || '';
  } catch (err: any) {
    console.error('PDF parsing error:', err);
    return `[Error extracting PDF text: ${err.message}]`;
  }
}

export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } catch (err: any) {
    console.error('DOCX parsing error:', err);
    return `[Error extracting DOCX text: ${err.message}]`;
  }
}

export async function parseXLSX(buffer: Buffer): Promise<string> {
  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    let text = '';
    for (const sheetName of workbook.SheetNames) {
      text += `=== Sheet: ${sheetName} ===\n`;
      const sheet = workbook.Sheets[sheetName];
      // sheet_to_txt returns comma-separated or tab-separated text representation
      const sheetText = XLSX.utils.sheet_to_txt(sheet);
      text += sheetText + '\n\n';
    }
    return text;
  } catch (err: any) {
    console.error('XLSX parsing error:', err);
    return `[Error extracting XLSX text: ${err.message}]`;
  }
}

export async function extractTextFromBinary(fileName: string, buffer: Buffer): Promise<string | null> {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf':
      return await parsePDF(buffer);
    case 'docx':
      return await parseDOCX(buffer);
    case 'xlsx':
    case 'xls':
      return await parseXLSX(buffer);
    default:
      return null; // Keep non-binary files or unsupported binary files as-is
  }
}
