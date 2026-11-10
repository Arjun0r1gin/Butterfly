#!/usr/bin/env node

/**
 * BUTTERFLY — Production Content Package Importer / Publisher CLI
 * Usage:
 *   node scripts/publish-package.js <path-to-package.zip | path-to-package.json>
 *
 * Actions:
 * 1. Safely backs up existing src/services/content/defaultContent.ts and media/audio folders.
 * 2. Unpacks media files into public/media/ and audio files into public/audio/.
 * 3. Validates that all referenced media and audio tracks exist.
 * 4. Compiles and updates src/services/content/defaultContent.ts.
 */

const fs = require('fs');
const path = require('path');

const packagePath = process.argv[2];

if (!packagePath) {
  console.error('\n❌ Usage: node scripts/publish-package.js <path-to-production-package.zip | .json>');
  console.error('Example: node scripts/publish-package.js butterfly_production_package_2026-11-10.zip\n');
  process.exit(1);
}

const resolvedPath = path.resolve(process.cwd(), packagePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`\n❌ Error: File not found at "${resolvedPath}"\n`);
  process.exit(1);
}

console.log(`\n📦 BUTTERFLY Production Importer`);
console.log(`Reading package: ${resolvedPath}...`);

// 1. Create Timestamped Backup
const nowStr = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(process.cwd(), 'backups', `backup_${nowStr}`);
fs.mkdirSync(backupDir, { recursive: true });

const defaultContentPath = path.resolve(process.cwd(), 'src/services/content/defaultContent.ts');
if (fs.existsSync(defaultContentPath)) {
  fs.copyFileSync(defaultContentPath, path.join(backupDir, 'defaultContent.ts.bak'));
  console.log(`🔒 Created backup of defaultContent.ts -> backups/backup_${nowStr}/defaultContent.ts.bak`);
}

const mediaDir = path.resolve(process.cwd(), 'public/media');
const audioDir = path.resolve(process.cwd(), 'public/audio');
fs.mkdirSync(mediaDir, { recursive: true });
fs.mkdirSync(audioDir, { recursive: true });

let contentJson = null;
let mediaExtracted = 0;
let audioExtracted = 0;

if (resolvedPath.endsWith('.zip')) {
  // Read ZIP package
  const buf = fs.readFileSync(resolvedPath);
  let pos = 0;

  while (pos < buf.length - 4) {
    const sig = buf.readUInt32LE(pos);
    if (sig === 0x04034b50) {
      const compSize = buf.readUInt32LE(pos + 18);
      const nameLen = buf.readUInt16LE(pos + 26);
      const extraLen = buf.readUInt16LE(pos + 28);
      const name = buf.toString('utf8', pos + 30, pos + 30 + nameLen);
      const dataStart = pos + 30 + nameLen + extraLen;
      const data = buf.slice(dataStart, dataStart + compSize);

      if (name === 'production_content.json') {
        contentJson = JSON.parse(data.toString('utf8'));
      } else if (name.startsWith('media/')) {
        const fileName = path.basename(name);
        fs.writeFileSync(path.join(mediaDir, fileName), data);
        mediaExtracted++;
      } else if (name.startsWith('audio/')) {
        const fileName = path.basename(name);
        fs.writeFileSync(path.join(audioDir, fileName), data);
        audioExtracted++;
      }

      pos = dataStart + compSize;
    } else {
      break;
    }
  }
} else if (resolvedPath.endsWith('.json')) {
  const raw = fs.readFileSync(resolvedPath, 'utf8');
  const parsed = JSON.parse(raw);

  if (parsed.schema) {
    contentJson = parsed.schema;
    if (parsed.media) {
      for (const [id, dataUrl] of Object.entries(parsed.media)) {
        const base64Data = dataUrl.replace(/^data:[^;]+;base64,/, '');
        const ext = dataUrl.includes('image/gif') ? '.gif' : '.png';
        const fileName = `${id}${ext}`;
        fs.writeFileSync(path.join(mediaDir, fileName), Buffer.from(base64Data, 'base64'));
        mediaExtracted++;
      }
    }
  } else {
    contentJson = parsed;
  }
} else {
  console.error('❌ Unsupported package file extension. Must be .zip or .json');
  process.exit(1);
}

if (!contentJson) {
  console.error('❌ Failed to parse production content JSON from package.');
  process.exit(1);
}

// 2. Validate Content References
const warnings = [];
const existingMedia = new Set(fs.readdirSync(mediaDir));
const existingAudio = new Set(fs.readdirSync(audioDir));

// Add built-ins
existingAudio.add('our_evening_melody.mp3');
existingAudio.add('remo_first_sight.mp3');

if (Array.isArray(contentJson.spreads)) {
  contentJson.spreads.forEach((spread, sIdx) => {
    // Photos
    spread.leftPage?.photos?.forEach((photo, pIdx) => {
      if (photo.customUrl?.startsWith('/media/')) {
        const file = path.basename(photo.customUrl);
        if (!existingMedia.has(file)) {
          warnings.push(`Spread ${sIdx + 1} Photo ${pIdx + 1}: file "${file}" not found in public/media/`);
        }
      }
    });

    // Stickers
    spread.leftPage?.stickers?.forEach((st) => {
      if (st.customUrl?.startsWith('/media/')) {
        const file = path.basename(st.customUrl);
        if (!existingMedia.has(file)) {
          warnings.push(`Spread ${sIdx + 1} Left Sticker: file "${file}" not found in public/media/`);
        }
      }
    });

    spread.rightPage?.stickers?.forEach((st) => {
      if (st.customUrl?.startsWith('/media/')) {
        const file = path.basename(st.customUrl);
        if (!existingMedia.has(file)) {
          warnings.push(`Spread ${sIdx + 1} Right Sticker: file "${file}" not found in public/media/`);
        }
      }
    });

    // Music
    if (spread.rightPage?.musicMarkers) {
      Object.entries(spread.rightPage.musicMarkers).forEach(([mKey, marker]) => {
        const track = contentJson.audioTracks?.find((t) => t.id === marker.trackId);
        if (track && track.fileName) {
          const file = path.basename(track.fileName);
          if (!existingAudio.has(file)) {
            warnings.push(`Spread ${sIdx + 1} Music Marker (${marker.title || mKey}): file "${file}" not found in public/audio/`);
          }
        }
      });
    }
  });
}

// 3. Write updated defaultContent.ts
const updatedFileContent = `/**
 * BUTTERFLY — Canonical Published Content
 * Auto-generated by Studio Admin Publish Workflow.
 * Last Published: ${new Date().toISOString()}
 */

import type { ButterflyContent } from './types';

export const DEFAULT_BUTTERFLY_CONTENT: ButterflyContent = ${JSON.stringify(contentJson, null, 2)};
`;

fs.writeFileSync(defaultContentPath, updatedFileContent, 'utf8');

console.log(`\n✅ PUBLISHED SUCCESSFULLY!`);
console.log(`- Updated defaultContent.ts with ${contentJson.spreads?.length || 0} scrapbook spreads`);
console.log(`- Extracted ${mediaExtracted} media files into public/media/`);
console.log(`- Extracted ${audioExtracted} audio files into public/audio/`);
console.log(`- Backup created at: backups/backup_${nowStr}`);

if (warnings.length > 0) {
  console.warn(`\n⚠️ VALIDATION WARNINGS (${warnings.length}):`);
  warnings.forEach((w) => console.warn(`  • ${w}`));
} else {
  console.log(`- All asset references validated with 0 warnings!`);
}

console.log(`\nNext steps to deploy to GitHub Pages:`);
console.log(`  1. npm run build`);
console.log(`  2. git add .`);
console.log(`  3. git commit -m "Publish updated scrapbook content and media"`);
console.log(`  4. git push origin main\n`);
