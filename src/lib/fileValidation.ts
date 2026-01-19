// File validation utilities with magic byte checking

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.ppt', '.pptx'];

// Magic bytes (file signatures)
const MAGIC_BYTES = {
  pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
  doc_old: [0xd0, 0xcf, 0x11, 0xe0], // Old DOC format
  docx: [0x50, 0x4b, 0x03, 0x04], // ZIP-based (DOCX, PPTX)
  ppt_old: [0xd0, 0xcf, 0x11, 0xe0], // Old PPT format
  ppt_old2: [0x00, 0x6e, 0x1e, 0xf0], // Alternative PPT format
};

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate file extension
 */
export function validateFileExtension(file: File): ValidationResult {
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: ${ALLOWED_EXTENSIONS.join(', ')}`,
    };
  }
  return { valid: true };
}

/**
 * Validate MIME type
 */
export function validateMimeType(file: File): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `MIME type not allowed. File type: ${file.type}`,
    };
  }
  return { valid: true };
}

/**
 * Validate file size
 */
export function validateFileSize(file: File): ValidationResult {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }
  return { valid: true };
}

/**
 * Read first bytes of file to check magic bytes
 */
async function readFileHeader(file: File, bytes: number = 4): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(e.target.result.slice(0, bytes)));
      } else {
        reject(new Error('Failed to read file header'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file.slice(0, bytes));
  });
}

/**
 * Check if bytes match magic bytes pattern
 */
function matchesMagicBytes(header: Uint8Array, pattern: number[]): boolean {
  if (header.length < pattern.length) return false;
  for (let i = 0; i < pattern.length; i++) {
    if (header[i] !== pattern[i]) return false;
  }
  return true;
}

/**
 * Validate magic bytes (file signature) to prevent file extension spoofing
 */
export async function validateMagicBytes(file: File): Promise<ValidationResult> {
  try {
    const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    const header = await readFileHeader(file, 4);

    // PDF validation
    if (extension === '.pdf') {
      if (matchesMagicBytes(header, MAGIC_BYTES.pdf)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'File does not appear to be a valid PDF file',
      };
    }

    // DOC validation (old format)
    if (extension === '.doc') {
      if (matchesMagicBytes(header, MAGIC_BYTES.doc_old)) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'File does not appear to be a valid DOC file',
      };
    }

    // DOCX validation (ZIP-based)
    if (extension === '.docx') {
      if (matchesMagicBytes(header, MAGIC_BYTES.docx)) {
        // Additional check: verify it's actually a DOCX by checking for word/document.xml
        // For now, ZIP signature is enough (more thorough check would require unzipping)
        return { valid: true };
      }
      return {
        valid: false,
        error: 'File does not appear to be a valid DOCX file',
      };
    }

    // PPT validation (old format)
    if (extension === '.ppt') {
      if (
        matchesMagicBytes(header, MAGIC_BYTES.ppt_old) ||
        matchesMagicBytes(header, MAGIC_BYTES.ppt_old2)
      ) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'File does not appear to be a valid PPT file',
      };
    }

    // PPTX validation (ZIP-based)
    if (extension === '.pptx') {
      if (matchesMagicBytes(header, MAGIC_BYTES.docx)) {
        // ZIP signature check (PPTX is also ZIP-based)
        return { valid: true };
      }
      return {
        valid: false,
        error: 'File does not appear to be a valid PPTX file',
      };
    }

    return {
      valid: false,
      error: 'Unknown file type',
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to validate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Comprehensive file validation - runs all checks
 */
export async function validateFile(file: File): Promise<ValidationResult> {
  // Check extension first (fastest)
  const extCheck = validateFileExtension(file);
  if (!extCheck.valid) return extCheck;

  // Check MIME type
  const mimeCheck = validateMimeType(file);
  if (!mimeCheck.valid) return mimeCheck;

  // Check file size
  const sizeCheck = validateFileSize(file);
  if (!sizeCheck.valid) return sizeCheck;

  // Check magic bytes (most thorough but slower)
  const magicCheck = await validateMagicBytes(file);
  if (!magicCheck.valid) return magicCheck;

  return { valid: true };
}

