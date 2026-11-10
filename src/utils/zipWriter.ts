/**
 * BUTTERFLY — Zero-Dependency Pure-TypeScript ZIP Archive Builder
 * Creates standard PKZIP (Store mode, uncompressed) archives.
 * Fast, lightweight, zero runtime dependencies, compatible with all native unzippers.
 */

function makeCrcTable(): Uint32Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
}

const crcTable = makeCrcTable();

export function crc32(bytes: Uint8Array): number {
  let crc = 0 ^ -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

export interface ZipFileInput {
  name: string;
  data: Uint8Array | string;
}

export function createZipArchive(files: ZipFileInput[]): Uint8Array {
  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let offset = 0;

  const textEncoder = new TextEncoder();

  for (const file of files) {
    const nameBytes = textEncoder.encode(file.name);
    const dataBytes =
      typeof file.data === 'string' ? textEncoder.encode(file.data) : file.data;
    const crc = crc32(dataBytes);
    const size = dataBytes.length;

    // 1. Local File Header (30 bytes + name)
    const lh = new Uint8Array(30 + nameBytes.length);
    const dvLh = new DataView(lh.buffer);

    dvLh.setUint32(0, 0x04034b50, true); // Local file header signature
    dvLh.setUint16(4, 20, true);         // Version needed to extract (2.0)
    dvLh.setUint16(6, 0, true);          // General purpose bit flag
    dvLh.setUint16(8, 0, true);          // Compression method: 0 (STORE)
    dvLh.setUint16(10, 0, true);         // File mod time
    dvLh.setUint16(12, 0x5421, true);    // File mod date (2022-01-01)
    dvLh.setUint32(14, crc, true);       // CRC-32
    dvLh.setUint32(18, size, true);      // Compressed size
    dvLh.setUint32(22, size, true);      // Uncompressed size
    dvLh.setUint16(26, nameBytes.length, true); // File name length
    dvLh.setUint16(28, 0, true);         // Extra field length
    lh.set(nameBytes, 30);

    parts.push(lh);
    parts.push(dataBytes);

    // 2. Central Directory Header (46 bytes + name)
    const cd = new Uint8Array(46 + nameBytes.length);
    const dvCd = new DataView(cd.buffer);

    dvCd.setUint32(0, 0x02014b50, true); // Central directory file header signature
    dvCd.setUint16(4, 20, true);         // Version made by
    dvCd.setUint16(6, 20, true);         // Version needed to extract
    dvCd.setUint16(8, 0, true);          // Bit flag
    dvCd.setUint16(10, 0, true);         // Compression method: 0 (STORE)
    dvCd.setUint16(12, 0, true);         // Mod time
    dvCd.setUint16(14, 0x5421, true);    // Mod date
    dvCd.setUint32(16, crc, true);       // CRC-32
    dvCd.setUint32(20, size, true);      // Compressed size
    dvCd.setUint32(24, size, true);      // Uncompressed size
    dvCd.setUint16(28, nameBytes.length, true); // File name length
    dvCd.setUint16(30, 0, true);         // Extra field length
    dvCd.setUint16(32, 0, true);         // Comment length
    dvCd.setUint16(34, 0, true);         // Disk number start
    dvCd.setUint16(36, 0, true);         // Internal file attributes
    dvCd.setUint32(38, 0, true);         // External file attributes
    dvCd.setUint32(42, offset, true);    // Relative offset of local header
    cd.set(nameBytes, 46);

    cdEntries.push(cd);
    offset += lh.length + dataBytes.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const cd of cdEntries) {
    parts.push(cd);
    cdSize += cd.length;
  }

  // 3. End of Central Directory Record (22 bytes)
  const eocd = new Uint8Array(22);
  const dvEocd = new DataView(eocd.buffer);

  dvEocd.setUint32(0, 0x06054b50, true); // End of central dir signature
  dvEocd.setUint16(4, 0, true);          // Number of this disk
  dvEocd.setUint16(6, 0, true);          // Disk where central directory starts
  dvEocd.setUint16(8, files.length, true);  // Number of central directory records on this disk
  dvEocd.setUint16(10, files.length, true); // Total number of central directory records
  dvEocd.setUint32(12, cdSize, true);    // Size of central directory
  dvEocd.setUint32(16, cdOffset, true);  // Offset of start of central directory
  dvEocd.setUint16(20, 0, true);         // Comment length

  parts.push(eocd);

  // Concatenate all parts into a single Uint8Array
  const totalLength = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLength);
  let cur = 0;
  for (const part of parts) {
    result.set(part, cur);
    cur += part.length;
  }

  return result;
}

export function createZipBlob(files: ZipFileInput[]): Blob {
  const bytes = createZipArchive(files);
  return new Blob([bytes], { type: 'application/zip' });
}

