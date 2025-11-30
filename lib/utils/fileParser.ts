/**
 * File Parser Utilities
 * 
 * Parse various document formats (PDF, DOCX, TXT) to extract text
 */

import pdf from 'pdf-parse'
import mammoth from 'mammoth'

/**
 * Extract text from PDF buffer
 */
export async function parsePDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('[parsePDF] Error:', error)
    throw new Error('PDF parse hatası')
  }
}

/**
 * Extract text from DOCX buffer
 */
export async function parseDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('[parseDOCX] Error:', error)
    throw new Error('DOCX parse hatası')
  }
}

/**
 * Extract text from TXT buffer
 */
export function parseTXT(buffer: Buffer): string {
  return buffer.toString('utf-8')
}

/**
 * Parse file based on extension
 */
export async function parseFile(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop()

  switch (ext) {
    case 'pdf':
      return parsePDF(buffer)
    case 'docx':
    case 'doc':
      return parseDOCX(buffer)
    case 'txt':
      return parseTXT(buffer)
    default:
      throw new Error(`Desteklenmeyen dosya formatı: ${ext}`)
  }
}

/**
 * Validate file type
 */
export function isValidFileType(filename: string): boolean {
  const ext = filename.toLowerCase().split('.').pop()
  return ['pdf', 'docx', 'doc', 'txt'].includes(ext || '')
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.toLowerCase().split('.').pop() || ''
}

