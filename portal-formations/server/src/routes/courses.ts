import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { tipTapToHtml, pedagogicalContextToHtml } from '../utils/tipTapToHtml';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

const router = Router();

/**
 * Échappe les caractères HTML
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Configuration Supabase depuis les variables d'environnement
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variables d\'environnement Supabase manquantes pour la génération PDF');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * GET /api/courses/:courseId/pdf
 * Génère un PDF du cours complet avec format paysage
 * Slides à gauche, contexte pédagogique à droite
 */
router.get('/:courseId/pdf', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[PDF] Début de la génération PDF pour le cours ${req.params.courseId}`);
  
  try {
    const { courseId } = req.params;

    if (!supabase) {
      console.error('[PDF] Configuration Supabase manquante');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être configurées'
      });
    }
    
    console.log('[PDF] Configuration Supabase OK');

    // Récupérer le token d'authentification depuis le header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    // Créer un client Supabase avec le token de l'utilisateur si disponible
    let clientWithAuth = supabase;
    if (token && supabaseUrl && supabaseAnonKey && supabase) {
      try {
        clientWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false
          }
        });
        console.log('[PDF] Client Supabase créé avec authentification utilisateur');
      } catch (error) {
        console.error('[PDF] Erreur lors de la création du client avec auth, utilisation du client par défaut:', error);
        clientWithAuth = supabase;
      }
    } else {
      if (!token) {
        console.log('[PDF] Aucun token d\'authentification fourni');
      }
      console.log('[PDF] Utilisation du client Supabase sans authentification');
    }

    // 1. Récupérer le cours
    if (!clientWithAuth) {
      console.error('[PDF] Client Supabase non disponible');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Impossible de créer le client Supabase'
      });
    }
    
    console.log('[PDF] Récupération du cours...');
    const { data: course, error: courseError } = await clientWithAuth
      .from('courses')
      .select('id, title, description, allow_pdf_download')
      .eq('id', courseId)
      .single();

    if (courseError) {
      console.error('[PDF] Erreur lors de la récupération du cours:', courseError);
      return res.status(404).json({ 
        error: 'Cours non trouvé',
        details: courseError.message
      });
    }
    
    if (!course) {
      console.error('[PDF] Cours non trouvé (data est null)');
      return res.status(404).json({ 
        error: 'Cours non trouvé' 
      });
    }
    
    console.log('[PDF] Cours trouvé:', course.title, 'allow_pdf_download:', course.allow_pdf_download);

    // 2. Vérifier que le téléchargement PDF est activé
    if (!course.allow_pdf_download) {
      console.warn('[PDF] Téléchargement PDF non activé pour ce cours');
      return res.status(403).json({ 
        error: 'Le téléchargement PDF n\'est pas activé pour ce cours',
        details: 'Activez cette option dans les paramètres du cours'
      });
    }

    // 3. Récupérer les modules et items
    console.log('[PDF] Récupération des modules et items...');
    const { data: modules, error: modulesError } = await clientWithAuth
      .from('modules')
      .select(`
        id,
        title,
        position,
        items (
          id,
          type,
          title,
          content,
          asset_path,
          position,
          published
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    if (modulesError) {
      console.error('[PDF] Erreur lors de la récupération des modules:', modulesError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des modules',
        details: modulesError.message
      });
    }
    
    console.log('[PDF] Modules récupérés:', modules?.length || 0);

    // 4. Filtrer uniquement les slides publiées
    const slides = modules
      ?.flatMap(module => 
        (module.items as any[])
          ?.filter(item => item.type === 'slide' && item.published)
          .map(item => ({
            ...item,
            moduleTitle: module.title,
            modulePosition: module.position
          }))
      ) || [];

    if (slides.length === 0) {
      console.warn('[PDF] Aucune slide trouvée');
      return res.status(404).json({ 
        error: 'Aucune slide trouvée dans ce cours',
        details: 'Assurez-vous que le cours contient au moins une slide publiée'
      });
    }
    
    console.log('[PDF] Slides trouvées:', slides.length);

    // 5. Générer le HTML avec format paysage (de manière incrémentale)
    console.log('[PDF] Génération du HTML...');
    let html: string;
    let tempHtmlFile: string | null = null;
    
    try {
      // Générer le HTML par parties pour éviter les problèmes de mémoire
      html = generatePdfHtml(course, slides, clientWithAuth);
      const htmlSize = Buffer.byteLength(html, 'utf8');
      console.log('[PDF] HTML généré, taille:', (htmlSize / 1024 / 1024).toFixed(2), 'MB');
      
      // Vérifier la taille (limite à ~50MB pour éviter les problèmes)
      if (htmlSize > 50 * 1024 * 1024) {
        throw new Error(`HTML trop volumineux: ${(htmlSize / 1024 / 1024).toFixed(2)}MB. Limitez le nombre de slides ou le contenu.`);
      }
    } catch (htmlError: any) {
      if (htmlError.message?.includes('string length') || htmlError.message?.includes('Invalid string') || htmlError.name === 'RangeError') {
        console.error('[PDF] Erreur: HTML trop volumineux pour être généré');
        return res.status(500).json({ 
          error: 'Le contenu du cours est trop volumineux',
          message: 'Le cours contient trop de contenu pour générer un PDF. Essayez de réduire le nombre de slides ou le contenu.',
          details: 'Limite de taille dépassée lors de la génération du HTML'
        });
      }
      throw htmlError;
    }

    // 6. Générer le PDF avec Puppeteer
    console.log('[PDF] Lancement de Puppeteer...');
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      console.log('[PDF] Puppeteer lancé');
      
      const page = await browser.newPage();
      console.log('[PDF] Page créée, chargement du contenu...');
      
      // Configurer la page pour optimiser les images
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Utiliser un fichier temporaire pour éviter les problèmes de mémoire avec setContent
      try {
        tempHtmlFile = path.join(process.cwd(), 'temp', `pdf-${courseId}-${Date.now()}.html`);
        const tempDir = path.dirname(tempHtmlFile);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        await writeFile(tempHtmlFile, html, 'utf8');
        console.log('[PDF] HTML écrit dans fichier temporaire');
        
        // Intercepter les requêtes d'images pour les optimiser (AVANT le goto)
        await page.setRequestInterception(true);
        page.on('request', (request) => {
          // Laisser passer toutes les requêtes
          request.continue();
        });
        
        // Charger depuis le fichier avec timeout pour les images
        await page.goto(`file://${tempHtmlFile}`, { 
          waitUntil: 'networkidle0',
          timeout: 60000 // 60 secondes pour charger les images
        });
        
        // Compresser et redimensionner toutes les images pour réduire la taille du PDF
        await page.evaluate(async () => {
          const images = Array.from(document.images) as HTMLImageElement[];
          
          for (const img of images) {
            try {
              // Attendre que l'image soit chargée
              if (!img.complete) {
                await new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve;
                  setTimeout(resolve, 3000);
                });
              }
              
              // Créer un canvas pour compresser l'image
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              
              if (!ctx) continue;
              
              // Limiter la taille maximale (800px de largeur max pour le PDF)
              const maxWidth = 800;
              const maxHeight = 600;
              let width = img.naturalWidth;
              let height = img.naturalHeight;
              
              // Calculer les nouvelles dimensions en gardant le ratio
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
              
              // Redimensionner le canvas
              canvas.width = width;
              canvas.height = height;
              
              // Dessiner l'image redimensionnée avec compression
              ctx.drawImage(img, 0, 0, width, height);
              
              // Convertir en JPEG avec compression (qualité 0.7 = 70%)
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              
              // Remplacer l'image par la version compressée
              img.src = compressedDataUrl;
              img.style.width = `${width}px`;
              img.style.height = `${height}px`;
              img.style.maxWidth = '100%';
              img.style.maxHeight = '100%';
            } catch (error) {
              console.warn('Erreur lors de la compression de l\'image:', error);
              // Continuer même si une image échoue
            }
          }
        });
        
        // Attendre que les images soient chargées
        await page.evaluate(() => {
          return Promise.all(
            Array.from(document.images)
              .filter(img => !img.complete)
              .map(img => new Promise((resolve) => {
                img.onload = resolve;
                img.onerror = resolve; // Continuer même si une image échoue
                setTimeout(resolve, 5000); // Timeout de 5s par image
              }))
          );
        });
        
        console.log('[PDF] Contenu chargé depuis fichier, images optimisées, génération du PDF...');
      } catch (fileError: any) {
        // Si l'écriture du fichier échoue, essayer setContent quand même
        console.warn('[PDF] Impossible d\'écrire le fichier temporaire, utilisation de setContent:', fileError.message);
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
        console.log('[PDF] Contenu chargé avec setContent, génération du PDF...');
      }

      // Attendre un peu pour que les images compressées soient bien chargées
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        // Optimisations pour réduire la taille du PDF
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        // Options de compression (si supportées par Puppeteer)
        scale: 0.8 // Réduire légèrement la résolution pour économiser de l'espace
      });
      
      console.log('[PDF] PDF généré, taille:', pdfBuffer.length, 'bytes');
      await browser.close();
      
      // Nettoyer le fichier temporaire
      if (tempHtmlFile && fs.existsSync(tempHtmlFile)) {
        try {
          await unlink(tempHtmlFile);
          console.log('[PDF] Fichier temporaire supprimé');
        } catch (cleanupError) {
          console.warn('[PDF] Impossible de supprimer le fichier temporaire:', cleanupError);
        }
      }

      // 7. Envoyer le PDF
      const duration = Date.now() - startTime;
      console.log(`[PDF] ✅ PDF généré avec succès en ${duration}ms`);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${course.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (puppeteerError: any) {
      if (browser) {
        await browser.close().catch(() => {});
      }
      
      // Nettoyer le fichier temporaire en cas d'erreur
      if (tempHtmlFile && fs.existsSync(tempHtmlFile)) {
        try {
          await unlink(tempHtmlFile);
        } catch (cleanupError) {
          // Ignorer les erreurs de nettoyage
        }
      }
      
      console.error('[PDF] Erreur Puppeteer:', puppeteerError);
      throw puppeteerError;
    }

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Logger l'erreur sans essayer de la sérialiser complètement
    console.error(`[PDF] ❌ Erreur lors de la génération du PDF (${duration}ms)`);
    console.error('[PDF] Type d\'erreur:', error?.constructor?.name || 'Unknown');
    console.error('[PDF] Message:', error?.message?.substring(0, 500) || 'Erreur inconnue');
    if (error?.stack) {
      const stackPreview = error.stack.substring(0, 1000);
      console.error('[PDF] Stack (preview):', stackPreview);
    }
    
    let errorMessage = 'Erreur lors de la génération du PDF';
    let errorDetails = (error?.message || 'Erreur inconnue').substring(0, 500);
    
    // Messages d'erreur spécifiques
    if (error?.message?.includes('Invalid string length') || error?.message?.includes('string length')) {
      errorMessage = 'Contenu trop volumineux';
      errorDetails = 'Le cours contient trop de contenu pour générer un PDF. Le HTML généré dépasse les limites. Essayez de réduire le nombre de slides ou le contenu.';
    } else if (error?.message?.includes('puppeteer') || error?.message?.includes('browser') || error?.message?.includes('Executable')) {
      errorMessage = 'Erreur lors de la génération du PDF avec Puppeteer';
      errorDetails = 'Vérifiez que Puppeteer est bien installé: npm install puppeteer dans le dossier server/';
    } else if (error?.message?.includes('timeout')) {
      errorMessage = 'Timeout lors de la génération du PDF';
      errorDetails = 'La génération prend trop de temps. Vérifiez les ressources du serveur.';
    } else if (error?.message?.includes('Cannot find module')) {
      errorMessage = 'Module manquant';
      errorDetails = `Module manquant: ${error.message.substring(0, 200)}. Installez les dépendances avec npm install.`;
    }
    
    // En développement, retourner plus de détails (mais limiter la taille)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const response: any = { 
      error: errorMessage,
      message: errorDetails
    };
    
    if (isDevelopment && error?.stack) {
      response.stack = error.stack.substring(0, 2000); // Limiter la stack à 2000 caractères
      response.type = error?.constructor?.name || 'Unknown';
    }
    
    res.status(500).json(response);
  }
});

/**
 * Génère le HTML pour le PDF avec format paysage
 * Slides à gauche, contexte pédagogique à droite
 */
function generatePdfHtml(course: any, slides: any[], supabaseClient: any): string {
  // Limiter le nombre de slides pour éviter les problèmes de mémoire
  const MAX_SLIDES = 50; // Limite à 50 slides max
  const slidesToProcess = slides.slice(0, MAX_SLIDES);
  
  if (slides.length > MAX_SLIDES) {
    console.warn(`[PDF] Attention: ${slides.length} slides trouvées, seulement ${MAX_SLIDES} seront incluses dans le PDF`);
  }
  
  // Utiliser un tableau pour construire le HTML de manière plus efficace
  const slidesHtmlParts: string[] = [];
  
  slidesToProcess.forEach((slide, index) => {
    // Récupérer l'URL publique de l'asset si présent
    let slideImageHtml = '';
    if (slide.asset_path && supabaseClient) {
      const { data } = supabaseClient.storage
        .from('course-assets')
        .getPublicUrl(slide.asset_path);
      
      if (slide.asset_path.endsWith('.pdf')) {
        // Pour les PDFs, on affiche un message (Puppeteer ne peut pas afficher les PDFs dans le PDF)
        slideImageHtml = `
          <div class="slide-placeholder">
            <p><strong>PDF:</strong> ${escapeHtml(slide.title)}</p>
            <p class="note">Le contenu PDF ne peut pas être affiché dans cette extraction.</p>
          </div>
        `;
      } else {
        // Pour les images, utiliser l'URL directement
        // La compression sera faite côté client par Puppeteer
        const imageUrl = data.publicUrl;
        
        // Utiliser des attributs pour limiter la taille d'affichage
        // La compression réelle sera faite par Puppeteer dans le navigateur
        slideImageHtml = `<img src="${imageUrl}" alt="${escapeHtml(slide.title)}" class="slide-image" loading="lazy" style="max-width: 800px; max-height: 600px; width: auto; height: auto; object-fit: contain;" />`;
      }
    } else if (slide.content?.body) {
      // Contenu rich text (limiter la taille)
      slideImageHtml = `<div class="slide-content">${tipTapToHtml(slide.content.body, 100000)}</div>`;
    } else {
      slideImageHtml = `<div class="slide-placeholder"><p>Aucun contenu de slide</p></div>`;
    }

    // Contexte pédagogique (limiter la taille)
    const contextHtml = slide.content?.pedagogical_context
      ? pedagogicalContextToHtml(slide.content.pedagogical_context, 50000)
      : '<p class="no-context">Aucun contexte pédagogique disponible.</p>';

    // Construire le HTML de la slide
    slidesHtmlParts.push(`
      <div class="slide-page">
        <div class="slide-container">
          <div class="slide-section">
            <h3 class="slide-title">${escapeHtml(slide.title)}</h3>
            ${slideImageHtml}
          </div>
          <div class="context-section">
            <h4 class="context-title">Contexte pédagogique</h4>
            <div class="context-content">
              ${contextHtml}
            </div>
          </div>
        </div>
      </div>
    `);
  });
  
  // Construire le HTML de manière incrémentale pour éviter les problèmes de mémoire
  let slidesHtml = '';
  for (let i = 0; i < slidesHtmlParts.length; i++) {
    slidesHtml += slidesHtmlParts[i];
    // Vérifier la taille toutes les 10 slides
    if (i % 10 === 0 && Buffer.byteLength(slidesHtml, 'utf8') > 20 * 1024 * 1024) {
      throw new Error(`HTML trop volumineux après ${i + 1} slides. Réduisez le contenu.`);
    }
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(course.title)}</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 1cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 10pt;
      line-height: 1.4;
      color: #333;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #3498db;
    }

    .header h1 {
      font-size: 18pt;
      color: #2c3e50;
      margin-bottom: 5px;
    }

    .header p {
      font-size: 10pt;
      color: #7f8c8d;
    }

    .slide-page {
      page-break-after: always;
      margin-bottom: 20px;
    }

    .slide-page:last-child {
      page-break-after: auto;
    }

    .slide-container {
      display: flex;
      gap: 15px;
      height: 100%;
      min-height: 600px;
    }

    .slide-section {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #fff;
      display: flex;
      flex-direction: column;
    }

    .slide-title {
      font-size: 12pt;
      font-weight: bold;
      color: #2c3e50;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }

    .slide-image {
      max-width: 100%;
      max-height: 500px;
      object-fit: contain;
      margin: 0 auto;
      image-rendering: -webkit-optimize-contrast;
      image-rendering: crisp-edges;
    }
    
    /* Optimisation des images pour réduire la taille */
    img {
      image-rendering: auto;
    }

    .slide-content {
      flex: 1;
      overflow: hidden;
    }

    .slide-content p,
    .slide-content h1,
    .slide-content h2,
    .slide-content h3 {
      margin: 5px 0;
    }

    .slide-placeholder {
      padding: 20px;
      text-align: center;
      color: #999;
      border: 2px dashed #ddd;
      border-radius: 4px;
    }

    .slide-placeholder .note {
      font-size: 8pt;
      font-style: italic;
      margin-top: 10px;
    }

    .context-section {
      flex: 1;
      border: 1px solid #3498db;
      border-left-width: 4px;
      border-radius: 4px;
      padding: 10px;
      background: #f9fafb;
      display: flex;
      flex-direction: column;
    }

    .context-title {
      font-size: 10pt;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .context-content {
      flex: 1;
      overflow: hidden;
      font-size: 9pt;
      line-height: 1.5;
    }

    .context-content p {
      margin: 5px 0;
      text-align: justify;
    }

    .context-content ul,
    .context-content ol {
      margin: 5px 0 5px 20px;
    }

    .context-content li {
      margin: 3px 0;
    }

    .context-content code {
      background: #f4f4f4;
      padding: 2px 4px;
      border-radius: 2px;
      font-size: 8pt;
    }

    .context-content pre {
      background: #2c3e50;
      color: #ecf0f1;
      padding: 8px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 8pt;
    }

    .context-content blockquote {
      border-left: 3px solid #3498db;
      padding-left: 10px;
      margin: 5px 0;
      font-style: italic;
    }

    .no-context {
      color: #999;
      font-style: italic;
      text-align: center;
      padding: 20px;
    }

    .module-header {
      background: #3498db;
      color: white;
      padding: 8px 12px;
      margin: 15px 0 10px 0;
      border-radius: 4px;
      font-weight: bold;
      font-size: 11pt;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(course.title)}</h1>
    <p>Extraction complète du cours - Format paysage</p>
  </div>

  ${slidesHtml}
</body>
</html>
  `;
}

export default router;

