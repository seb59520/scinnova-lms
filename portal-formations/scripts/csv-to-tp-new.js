#!/usr/bin/env node

/**
 * Convertit un CSV (matrice) en JSON TPNew.
 * Colonnes: theme_id, theme_title, block_order, block_type, text, image_url, image_alt, layout
 *
 * Usage: node scripts/csv-to-tp-new.js <fichier.csv> [--out tp-new.json]
 *   ou:  node scripts/csv-to-tp-new.js   (lit depuis stdin)
 */

import fs from 'fs';
import path from 'path';

function parseCSVLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if ((c === ',' && !inQuotes) || c === '\r') {
      out.push(cur.trim());
      cur = '';
    } else if (c !== '\r') cur += c;
  }
  out.push(cur.trim());
  return out;
}

function parseCSV(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) throw new Error('CSV doit contenir au moins une ligne d\'en-tête et une ligne de données');
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
  const idx = (name) => {
    const i = headers.indexOf(name);
    if (i === -1) throw new Error('Colonne manquante: ' + name);
    return i;
  };
  const colThemeId = idx('theme_id');
  const colThemeTitle = idx('theme_title');
  const colBlockOrder = idx('block_order');
  const colBlockType = idx('block_type');
  const colText = headers.indexOf('text') !== -1 ? headers.indexOf('text') : -1;
  const colImageUrl = headers.indexOf('image_url') !== -1 ? headers.indexOf('image_url') : -1;
  const colImageAlt = headers.indexOf('image_alt') !== -1 ? headers.indexOf('image_alt') : -1;
  const colLayout = headers.indexOf('layout') !== -1 ? headers.indexOf('layout') : -1;

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = parseCSVLine(lines[i]);
    rows.push({
      theme_id: cells[colThemeId] || '',
      theme_title: cells[colThemeTitle] || '',
      block_order: parseInt(cells[colBlockOrder], 10) || 0,
      block_type: (cells[colBlockType] || 'text').toLowerCase(),
      text: colText >= 0 ? (cells[colText] || '') : '',
      image_url: colImageUrl >= 0 ? (cells[colImageUrl] || '') : '',
      image_alt: colImageAlt >= 0 ? (cells[colImageAlt] || '') : '',
      layout: colLayout >= 0 ? (cells[colLayout] || 'right').toLowerCase() : 'right'
    });
  }
  return rows;
}

function buildBlock(row) {
  const t = row.block_type;
  if (t === 'text') {
    return { type: 'text', text: row.text };
  }
  if (t === 'image') {
    return {
      type: 'image',
      src: row.image_url,
      alt: row.image_alt || undefined,
      title: row.image_alt || undefined
    };
  }
  if (t === 'text-image') {
    return {
      type: 'text-image',
      text: row.text,
      src: row.image_url,
      alt: row.image_alt || undefined,
      layout: row.layout === 'left' ? 'left' : 'right'
    };
  }
  return { type: 'text', text: row.text };
}

function csvToTpNew(rows) {
  const themeMap = new Map();
  for (const row of rows) {
    const id = row.theme_id || 'theme-1';
    if (!themeMap.has(id)) {
      themeMap.set(id, { id, title: row.theme_title || 'Sans titre', blocks: [] });
    }
    themeMap.get(id).blocks.push({ ...row, _order: row.block_order });
  }
  const themes = [];
  for (const t of themeMap.values()) {
    t.blocks.sort((a, b) => (a._order || 0) - (b._order || 0));
    themes.push({
      id: t.id,
      title: t.title,
      blocks: t.blocks.map((r) => buildBlock(r))
    });
  }
  return {
    type: 'tp-new',
    introduction: '',
    themes,
    conclusion: ''
  };
}

function main() {
  const args = process.argv.slice(2);
  let outPath = null;
  let inputFile = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--out' && args[i + 1]) {
      outPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('-')) {
      inputFile = args[i];
    }
  }
  const input = inputFile
    ? fs.readFileSync(path.resolve(inputFile), 'utf-8')
    : process.stdin.isTTY
      ? ''
      : fs.readFileSync(0, 'utf-8');
  if (!input) {
    console.error('Usage: node scripts/csv-to-tp-new.js <fichier.csv> [--out tp-new.json]');
    console.error('       cat matrix.csv | node scripts/csv-to-tp-new.js [--out tp-new.json]');
    process.exit(1);
  }

  const rows = parseCSV(input);
  const json = csvToTpNew(rows);
  const out = JSON.stringify(json, null, 2);

  if (outPath) {
    fs.writeFileSync(path.resolve(outPath), out, 'utf-8');
    console.log('✅ Écrit:', path.resolve(outPath));
  } else {
    console.log(out);
  }
}

main();
