#!/usr/bin/env node

/**
 * Script pour générer un PDF complet du TP
 * 
 * Usage: node generer-pdf.js
 * 
 * Génère un PDF avec :
 * - L'énoncé complet
 * - Le pas à pas détaillé
 * - Les exemples de code
 * - La checklist
 */

const fs = require('fs');
const path = require('path');

// Vérifier si puppeteer est installé
let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  console.error('❌ Puppeteer n\'est pas installé.');
  console.log('📦 Installation de puppeteer...');
  console.log('   Exécutez: npm install puppeteer');
  process.exit(1);
}

// Fonction pour lire un fichier markdown
function readMarkdown(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  Fichier ${filename} non trouvé`);
    return '';
  }
  return fs.readFileSync(filePath, 'utf8');
}

// Fonction pour convertir markdown en HTML (améliorée)
function markdownToHTML(markdown) {
  let html = markdown;
  
  // Séparateurs horizontaux
  html = html.replace(/^---$/gim, '<hr>');
  html = html.replace(/^\*\*\*$/gim, '<hr>');
  
  // Code blocks (doit être fait avant les autres remplacements)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
    const language = lang || 'text';
    return `<pre><code class="language-${language}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code (doit être fait avant les autres remplacements de texte)
  html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  
  // Titres
  html = html.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Gras et italique
  html = html.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Listes numérotées (doit être fait avant les listes à puces)
  const lines = html.split('\n');
  let inOrderedList = false;
  let orderedListItems = [];
  let processedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const orderedMatch = line.match(/^(\d+)\.\s+(.+)$/);
    
    if (orderedMatch) {
      if (!inOrderedList) {
        inOrderedList = true;
        orderedListItems = [];
      }
      orderedListItems.push(`<li>${processInlineMarkdown(orderedMatch[2])}</li>`);
    } else {
      if (inOrderedList) {
        processedLines.push(`<ol>${orderedListItems.join('')}</ol>`);
        inOrderedList = false;
        orderedListItems = [];
      }
      processedLines.push(line);
    }
  }
  
  if (inOrderedList) {
    processedLines.push(`<ol>${orderedListItems.join('')}</ol>`);
  }
  
  html = processedLines.join('\n');
  
  // Listes à puces
  html = html.replace(/^[\*\-\+]\s+(.+)$/gim, '<li>$1</li>');
  
  // Grouper les <li> consécutifs dans des <ul>
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
    return `<ul>${match.replace(/\n/g, '')}</ul>`;
  });
  
  // Liens
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Paragraphes (pour les lignes qui ne sont pas déjà des balises)
  html = html.split('\n\n').map(block => {
    const trimmed = block.trim();
    if (!trimmed) return '';
    if (trimmed.match(/^<(h[1-6]|ul|ol|pre|hr|p)/)) {
      return trimmed;
    }
    // Traiter le markdown inline dans les paragraphes
    return `<p>${processInlineMarkdown(trimmed)}</p>`;
  }).filter(b => b).join('\n\n');
  
  return html;
}

// Fonction pour traiter le markdown inline dans un texte
function processInlineMarkdown(text) {
  let processed = text;
  // Code inline
  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Gras
  processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italique
  processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  return processed;
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

async function generatePDF() {
  console.log('📄 Génération du PDF du TP...\n');
  
  // Lire les fichiers
  const enonce = readMarkdown('TP_ENONCE.md');
  const actions = readMarkdown('ACTIONS_ETUDIANTS.md');
  const checklist = readMarkdown('CHECKLIST.md');
  const readme = readMarkdown('README.md');
  
  // Créer le HTML complet
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TP OpenAPI 3 + Swagger UI - Documentation complète</title>
  <style>
    @page {
      margin: 2cm;
      size: A4;
    }
    
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 100%;
      margin: 0;
      padding: 20px;
    }
    
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      page-break-after: avoid;
      margin-top: 30px;
    }
    
    h2 {
      color: #34495e;
      border-bottom: 2px solid #95a5a6;
      padding-bottom: 8px;
      margin-top: 25px;
      page-break-after: avoid;
    }
    
    h3 {
      color: #7f8c8d;
      margin-top: 20px;
      page-break-after: avoid;
    }
    
    h4 {
      color: #95a5a6;
      margin-top: 15px;
      page-break-after: avoid;
    }
    
    code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
      color: #e74c3c;
    }
    
    pre {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 15px 0;
    }
    
    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }
    
    ul, ol {
      margin: 10px 0;
      padding-left: 30px;
    }
    
    li {
      margin: 5px 0;
    }
    
    p {
      margin: 10px 0;
      text-align: justify;
    }
    
    a {
      color: #3498db;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #3498db;
    }
    
    .header h1 {
      border: none;
      margin: 0;
      color: #2c3e50;
    }
    
    .meta {
      color: #7f8c8d;
      font-size: 0.9em;
      margin-top: 10px;
    }
    
    .checklist-item {
      margin: 8px 0;
      padding: 5px;
    }
    
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 10px;
      margin: 15px 0;
    }
    
    .success {
      background-color: #d4edda;
      border-left: 4px solid #28a745;
      padding: 10px;
      margin: 15px 0;
    }
    
    .info {
      background-color: #d1ecf1;
      border-left: 4px solid #17a2b8;
      padding: 10px;
      margin: 15px 0;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
    }
    
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background-color: #3498db;
      color: white;
    }
    
    footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 0.8em;
      color: #7f8c8d;
      padding: 10px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>TP : Swagger UI / OpenAPI 3</h1>
    <h2>Création d'une API simple</h2>
    <div class="meta">
      <p><strong>Niveau :</strong> MBA1 Développeur Full Stack</p>
      <p><strong>Durée estimée :</strong> 2h30 à 3h30</p>
      <p><strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
    </div>
  </div>
  
  <div class="page-break"></div>
  
  <h1>Table des matières</h1>
  <ul>
    <li><a href="#enonce">1. Énoncé du TP</a></li>
    <li><a href="#actions">2. Actions concrètes à réaliser</a></li>
    <li><a href="#checklist">3. Checklist de conformité</a></li>
    <li><a href="#exemples">4. Exemples d'appels et documentation</a></li>
  </ul>
  
  <div class="page-break"></div>
  
  <section id="enonce">
    <h1>1. Énoncé du TP</h1>
    ${markdownToHTML(enonce)}
  </section>
  
  <div class="page-break"></div>
  
  <section id="actions">
    <h1>2. Actions concrètes à réaliser</h1>
    ${markdownToHTML(actions)}
  </section>
  
  <div class="page-break"></div>
  
  <section id="checklist">
    <h1>3. Checklist de conformité</h1>
    ${markdownToHTML(checklist)}
  </section>
  
  <div class="page-break"></div>
  
  <section id="exemples">
    <h1>4. Exemples d'appels et documentation</h1>
    ${markdownToHTML(readme)}
  </section>
  
  <div class="page-break"></div>
  
  <footer>
    <p>TP OpenAPI 3 + Swagger UI - Documentation complète | Généré le ${new Date().toLocaleDateString('fr-FR')}</p>
  </footer>
</body>
</html>
  `;
  
  // Sauvegarder le HTML temporaire
  const htmlPath = path.join(__dirname, 'tp-complet-temp.html');
  fs.writeFileSync(htmlPath, html, 'utf8');
  
  console.log('🌐 Génération du PDF depuis le HTML...\n');
  
  // Générer le PDF avec Puppeteer
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
  
  const pdfPath = path.join(__dirname, 'TP-OpenAPI-Swagger-COMPLET.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: {
      top: '2cm',
      right: '2cm',
      bottom: '2cm',
      left: '2cm'
    },
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #7f8c8d;">TP OpenAPI 3 + Swagger UI</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #7f8c8d;">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>'
  });
  
  await browser.close();
  
  // Supprimer le fichier HTML temporaire
  fs.unlinkSync(htmlPath);
  
  console.log('✅ PDF généré avec succès !');
  console.log(`📄 Fichier : ${pdfPath}`);
  console.log(`📊 Taille : ${(fs.statSync(pdfPath).size / 1024 / 1024).toFixed(2)} MB\n`);
}

// Exécuter
generatePDF().catch(error => {
  console.error('❌ Erreur lors de la génération du PDF:', error);
  process.exit(1);
});

