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
// Service role key pour contourner RLS côté backend (avec vérification manuelle des permissions)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || (!supabaseAnonKey && !supabaseServiceKey)) {
  console.error('⚠️ Variables d\'environnement Supabase manquantes pour la génération PDF');
}

// Utiliser le service role key si disponible, sinon l'anon key
const supabase = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey!)
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
    
    if (!token) {
      console.log('[PDF] Aucun token d\'authentification fourni');
      return res.status(401).json({ 
        error: 'Authentification requise',
        details: 'Vous devez être connecté pour télécharger le PDF'
      });
    }

    // 1. Vérifier les permissions de l'utilisateur avec le token
    console.log('[PDF] Vérification des permissions utilisateur...');
    console.log('[PDF] CourseId:', courseId);
    console.log('[PDF] SupabaseUrl:', supabaseUrl ? 'Configuré' : 'MANQUANT');
    console.log('[PDF] SupabaseAnonKey:', supabaseAnonKey ? 'Configuré' : 'MANQUANT');
    console.log('[PDF] Token présent:', !!token);
    console.log('[PDF] Token preview:', token ? token.substring(0, 20) + '...' : 'AUCUN');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[PDF] Configuration Supabase incomplète');
      return res.status(500).json({ 
        error: 'Configuration serveur incomplète',
        details: 'Les variables d\'environnement Supabase ne sont pas configurées correctement'
      });
    }
    
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    // Vérifier que l'utilisateur a accès au cours
    console.log('[PDF] Requête Supabase pour vérifier l\'accès au cours...');
    const { data: userCourse, error: userCourseError } = await userClient
      .from('courses')
      .select('id, title, description, allow_pdf_download')
      .eq('id', courseId)
      .single();

    console.log('[PDF] Résultat de la vérification:');
    console.log('[PDF] - userCourse:', userCourse ? `Trouvé: ${userCourse.title}` : 'NULL');
    console.log('[PDF] - userCourseError:', userCourseError ? {
      code: userCourseError.code,
      message: userCourseError.message,
      details: userCourseError.details,
      hint: userCourseError.hint
    } : 'AUCUNE ERREUR');

    if (userCourseError || !userCourse) {
      console.error('[PDF] ❌ Erreur lors de la vérification des permissions');
      console.error('[PDF] Code erreur:', userCourseError?.code);
      console.error('[PDF] Message:', userCourseError?.message);
      console.error('[PDF] Détails:', userCourseError?.details);
      console.error('[PDF] Hint:', userCourseError?.hint);
      
      if (userCourseError?.code === 'PGRST301' || userCourseError?.message?.includes('permission')) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          details: 'Vous n\'avez pas les permissions nécessaires pour accéder à ce cours. Vérifiez que vous êtes bien inscrit au cours ou que vous avez les droits d\'administration.',
          code: userCourseError.code
        });
      }
      
      // Si c'est une erreur 404 de Supabase, retourner 404
      if (userCourseError?.code === 'PGRST116' || userCourseError?.message?.includes('not found')) {
        return res.status(404).json({ 
          error: 'Cours non trouvé',
          details: 'Le cours avec cet ID n\'existe pas dans la base de données',
          code: userCourseError.code
        });
      }
      
      return res.status(404).json({ 
        error: 'Cours non trouvé',
        details: userCourseError?.message || 'Le cours avec cet ID n\'existe pas ou vous n\'y avez pas accès',
        code: userCourseError?.code
      });
    }
    
    console.log('[PDF] ✅ Permissions vérifiées, accès autorisé');

    // 2. Utiliser le service role key pour récupérer toutes les données (contourne RLS)
    // On a déjà vérifié les permissions avec le token utilisateur
    if (!supabase) {
      console.error('[PDF] Client Supabase non disponible');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Impossible de créer le client Supabase'
      });
    }
    
    console.log('[PDF] Récupération du cours avec service role key...');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, description, allow_pdf_download')
      .eq('id', courseId)
      .single();

    if (courseError || !course) {
      console.error('[PDF] Erreur lors de la récupération du cours:', courseError);
      return res.status(404).json({ 
        error: 'Cours non trouvé',
        details: courseError?.message || 'Le cours avec cet ID n\'existe pas dans la base de données'
      });
    }
    
    // Utiliser les données vérifiées avec le token utilisateur
    const finalCourse = userCourse;
    
    console.log('[PDF] Cours trouvé:', finalCourse.title, 'allow_pdf_download:', finalCourse.allow_pdf_download);

    // 3. Vérifier que le téléchargement PDF est activé
    if (!finalCourse.allow_pdf_download) {
      console.warn('[PDF] Téléchargement PDF non activé pour ce cours');
      return res.status(403).json({ 
        error: 'Le téléchargement PDF n\'est pas activé pour ce cours',
        details: 'Activez cette option dans les paramètres du cours'
      });
    }

    // 4. Récupérer les modules et items
    console.log('[PDF] Récupération des modules et items...');
    const { data: modules, error: modulesError } = await supabase
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

    // Log détaillé des items pour déboguer
    if (modules && modules.length > 0) {
      modules.forEach((module: any, idx: number) => {
        console.log(`[PDF] Module ${idx + 1}: ${module.title}`);
        console.log(`[PDF]   - Items: ${module.items?.length || 0}`);
        if (module.items && module.items.length > 0) {
          module.items.forEach((item: any, itemIdx: number) => {
            console.log(`[PDF]   - Item ${itemIdx + 1}: type="${item.type}", published=${item.published}, title="${item.title?.substring(0, 50)}"`);
          });
        }
      });
    }

    // 4. Filtrer les slides publiées (et aussi les resources avec du contenu)
    // On inclut les slides ET les resources qui ont du contenu (pour les cours qui n'ont pas de slides)
    const allItems = modules
      ?.flatMap(module => 
        (module.items as any[])
          ?.map(item => ({
            ...item,
            moduleTitle: module.title,
            modulePosition: module.position
          }))
      ) || [];

    console.log(`[PDF] Total items récupérés: ${allItems.length}`);
    
    // Filtrer les slides publiées
    const slides = allItems.filter(item => 
      item.type === 'slide' && (item.published !== false)
    );
    
    console.log(`[PDF] Slides trouvées (type=slide, published): ${slides.length}`);
    
    // Si pas de slides, essayer avec les resources qui ont du contenu
    let itemsToInclude = slides;
    if (slides.length === 0) {
      console.log('[PDF] Aucune slide trouvée, recherche de resources avec contenu...');
      const resourcesWithContent = allItems.filter(item => 
        (item.type === 'resource' || item.type === 'slide') && 
        (item.published !== false) &&
        (item.content?.body || item.asset_path)
      );
      console.log(`[PDF] Resources avec contenu trouvées: ${resourcesWithContent.length}`);
      itemsToInclude = resourcesWithContent;
    }

    if (itemsToInclude.length === 0) {
      console.warn('[PDF] Aucun contenu trouvé pour le PDF');
      console.warn('[PDF] Détails des items:');
      allItems.forEach((item: any, idx: number) => {
        console.warn(`[PDF]   Item ${idx + 1}: type="${item.type}", published=${item.published}, hasContent=${!!item.content}, hasAsset=${!!item.asset_path}`);
      });
      return res.status(404).json({ 
        error: 'Aucun contenu trouvé dans ce cours',
        details: 'Le cours ne contient aucune slide ou ressource publiée avec du contenu. Assurez-vous que le cours contient au moins une slide publiée ou une ressource avec du contenu.',
        debug: {
          totalItems: allItems.length,
          itemsByType: allItems.reduce((acc: any, item: any) => {
            acc[item.type] = (acc[item.type] || 0) + 1;
            return acc;
          }, {}),
          publishedItems: allItems.filter((item: any) => item.published !== false).length
        }
      });
    }
    
    console.log('[PDF] Items à inclure dans le PDF:', itemsToInclude.length);

    // 5. Générer le HTML avec format paysage (de manière incrémentale)
    console.log('[PDF] Génération du HTML...');
    let html: string;
    let tempHtmlFile: string | null = null;
    
    try {
      // Générer le HTML par parties pour éviter les problèmes de mémoire
      html = generatePdfHtml(finalCourse, itemsToInclude, supabase);
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
      
      // Capturer les erreurs de la console et les logs
      const consoleMessages: string[] = [];
      const pageErrors: string[] = [];
      
      page.on('console', (msg) => {
        const text = msg.text();
        consoleMessages.push(text);
        if (msg.type() === 'error') {
          console.error('[PDF] Console error:', text);
        }
      });
      
      page.on('pageerror', (error) => {
        const errorMsg = error.message;
        pageErrors.push(errorMsg);
        console.error('[PDF] Page error:', errorMsg);
      });
      
      // Configurer la page pour optimiser les images
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Utiliser setContent directement pour éviter les problèmes avec file:// et les images
      console.log('[PDF] Chargement du contenu HTML dans Puppeteer...');
      console.log('[PDF] Taille du HTML:', (Buffer.byteLength(html, 'utf8') / 1024).toFixed(2), 'KB');
      
      // Charger le HTML directement avec setContent
      await page.setContent(html, { 
        waitUntil: 'networkidle0', // Attendre que toutes les ressources soient chargées
        timeout: 60000 // 60 secondes
      });
      
      console.log('[PDF] Contenu HTML chargé, vérification...');
      
      // Vérifier qu'il n'y a pas d'erreurs de chargement
      const pageTitle = await page.title();
      console.log('[PDF] Titre de la page:', pageTitle);
      
      // Attendre que le DOM soit complètement rendu
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérifier que le contenu est bien chargé
      const bodyContent = await page.evaluate(() => document.body?.innerText || '');
      if (bodyContent.length < 10) {
        throw new Error('Le contenu de la page est vide ou trop court');
      }
      console.log('[PDF] Contenu vérifié, longueur:', bodyContent.length, 'caractères');
      
      // Attendre que toutes les images soient chargées
      console.log('[PDF] Attente du chargement des images...');
      const imagesCount = await page.evaluate(() => document.images.length);
      console.log('[PDF] Nombre d\'images trouvées:', imagesCount);
      
      if (imagesCount > 0) {
        await page.evaluate(() => {
          return Promise.all(
            Array.from(document.images)
              .map((img: HTMLImageElement) => {
                if (img.complete && img.naturalWidth > 0) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = resolve;
                  img.onerror = resolve; // Continuer même si une image échoue
                  setTimeout(resolve, 5000); // Timeout de 5s par image
                });
              })
          );
        });
        console.log('[PDF] Images chargées');
      }
      
      console.log('[PDF] Prêt pour la génération du PDF...');

      // Attendre un peu pour que tout soit bien rendu
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('[PDF] Génération du PDF avec Puppeteer...');
      
      let pdfBuffer: Buffer;
      try {
        // Options PDF simplifiées pour éviter les problèmes
        pdfBuffer = await page.pdf({
          format: 'A4',
          landscape: true,
          printBackground: true,
          margin: {
            top: '1cm',
            right: '1cm',
            bottom: '1cm',
            left: '1cm'
          },
          preferCSSPageSize: true, // Utiliser le CSS @page
          displayHeaderFooter: false,
          scale: 1.0, // Résolution complète
          timeout: 60000 // 60 secondes pour la génération
        });
      } catch (pdfError: any) {
        console.error('[PDF] Erreur lors de la génération PDF avec Puppeteer:', pdfError);
        console.error('[PDF] Message:', pdfError.message);
        console.error('[PDF] Stack:', pdfError.stack);
        throw new Error(`Erreur Puppeteer lors de la génération PDF: ${pdfError.message}`);
      }
      
      console.log('[PDF] PDF généré, taille:', pdfBuffer.length, 'bytes');
      console.log('[PDF] Type du buffer:', typeof pdfBuffer, 'is Buffer:', Buffer.isBuffer(pdfBuffer));
      
      // Valider le buffer PDF
      if (!pdfBuffer || pdfBuffer.length === 0) {
        console.error('[PDF] ❌ Buffer PDF est vide ou null');
        throw new Error('Le buffer PDF est vide');
      }
      
      // Afficher les premiers bytes pour déboguer
      const firstBytes = pdfBuffer.slice(0, 20);
      console.log('[PDF] Premiers bytes du buffer (hex):', firstBytes.toString('hex'));
      console.log('[PDF] Premiers bytes du buffer (ascii):', firstBytes.toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
      
      // Vérifier que c'est bien un PDF (doit commencer par %PDF)
      // Vérifier les bytes directement plutôt que de convertir en string
      const headerBytes = pdfBuffer.slice(0, 4);
      const pdfHeader = headerBytes.toString('ascii');
      const expectedBytes = Buffer.from('%PDF', 'ascii');
      
      // Vérifier byte par byte pour être sûr
      const isValidPdf = headerBytes[0] === 0x25 && // '%'
                         headerBytes[1] === 0x50 && // 'P'
                         headerBytes[2] === 0x44 && // 'D'
                         headerBytes[3] === 0x46;   // 'F'
      
      if (!isValidPdf) {
        console.error('[PDF] ❌ Buffer PDF invalide');
        console.error('[PDF] Header attendu: %PDF (bytes: 0x25, 0x50, 0x44, 0x46)');
        console.error('[PDF] Header reçu (bytes):', Array.from(headerBytes).map(b => `0x${b.toString(16).toUpperCase()}`).join(', '));
        console.error('[PDF] Header reçu (ascii):', pdfHeader);
        console.error('[PDF] Header (hex):', headerBytes.toString('hex'));
        console.error('[PDF] Premiers 100 bytes:', pdfBuffer.slice(0, 100).toString('ascii').replace(/[^\x20-\x7E]/g, '.'));
        
        // Afficher les erreurs de la console et de la page
        if (consoleMessages.length > 0) {
          console.error('[PDF] Messages de la console:', consoleMessages);
        }
        if (pageErrors.length > 0) {
          console.error('[PDF] Erreurs de la page:', pageErrors);
        }
        
        // Si c'est du HTML, c'est qu'il y a eu une erreur
        if (pdfHeader.startsWith('<!') || pdfHeader.startsWith('<html')) {
          const htmlPreview = pdfBuffer.slice(0, 500).toString('utf8');
          console.error('[PDF] Contenu HTML retourné:', htmlPreview);
          throw new Error('Puppeteer a retourné du HTML au lieu d\'un PDF. Vérifiez les logs pour plus de détails.');
        }
        
        throw new Error(`Le buffer généré n'est pas un PDF valide. Header reçu: "${pdfHeader}" (bytes: ${Array.from(headerBytes).join(',')}) (attendu: "%PDF"). Vérifiez les logs pour les erreurs de la console.`);
      }
      
      console.log('[PDF] ✅ Buffer PDF validé (header:', pdfHeader + '...)');
      
      await browser.close();
      
      // Nettoyer le fichier temporaire (ou le garder pour debug si DEBUG_PDF_HTML est défini)
      if (tempHtmlFile && fs.existsSync(tempHtmlFile)) {
        const keepHtmlForDebug = process.env.DEBUG_PDF_HTML === 'true';
        if (keepHtmlForDebug) {
          console.log('[PDF] Fichier HTML conservé pour debug:', tempHtmlFile);
        } else {
          try {
            await unlink(tempHtmlFile);
            console.log('[PDF] Fichier temporaire supprimé');
          } catch (cleanupError) {
            console.warn('[PDF] Impossible de supprimer le fichier temporaire:', cleanupError);
          }
        }
      }

      // 7. Valider à nouveau avant l'envoi
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Le buffer PDF est vide avant l\'envoi');
      }
      
      // Vérifier byte par byte pour être sûr
      const headerBytesCheck = pdfBuffer.slice(0, 4);
      const isValidPdfCheck = headerBytesCheck[0] === 0x25 && // '%'
                              headerBytesCheck[1] === 0x50 && // 'P'
                              headerBytesCheck[2] === 0x44 && // 'D'
                              headerBytesCheck[3] === 0x46;   // 'F'
      
      if (!isValidPdfCheck) {
        throw new Error('Le buffer PDF est invalide avant l\'envoi');
      }
      
      // 8. Envoyer le PDF
      const duration = Date.now() - startTime;
      console.log(`[PDF] ✅ PDF généré avec succès en ${duration}ms (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
      
      // Définir les headers correctement
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(finalCourse.title.replace(/[^a-z0-9]/gi, '_'))}.pdf"`
      );
      res.setHeader('Cache-Control', 'no-cache');
      
      // Envoyer le buffer
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
        // Pour les images, utiliser l'URL publique
        const imageUrl = data?.publicUrl || '';
        
        // Échapper l'URL pour éviter les problèmes avec les caractères spéciaux
        const escapedImageUrl = imageUrl.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        
        // Utiliser des attributs pour limiter la taille d'affichage
        if (imageUrl) {
          // Utiliser des attributs simples pour éviter les problèmes de rendu
          slideImageHtml = `<img src="${escapedImageUrl}" alt="${escapeHtml(slide.title)}" class="slide-image" style="max-width: 100%; height: auto; display: block; margin: 0 auto;" />`;
        } else {
          slideImageHtml = `<div class="slide-placeholder"><p>Image non disponible</p></div>`;
        }
      }
    } else if (slide.content?.body) {
      // Contenu rich text (limiter la taille)
      try {
        const tipTapHtml = tipTapToHtml(slide.content.body, 100000);
        // S'assurer que le HTML généré est valide
        slideImageHtml = `<div class="slide-content">${tipTapHtml}</div>`;
      } catch (error) {
        console.warn(`[PDF] Erreur lors de la conversion TipTap pour slide "${slide.title}":`, error);
        slideImageHtml = `<div class="slide-placeholder"><p>Erreur lors du chargement du contenu</p></div>`;
      }
    } else {
      slideImageHtml = `<div class="slide-placeholder"><p>Aucun contenu de slide</p></div>`;
    }

    // Contexte pédagogique (limiter la taille)
    let contextHtml = '<p class="no-context">Aucun contexte pédagogique disponible.</p>';
    if (slide.content?.pedagogical_context) {
      try {
        contextHtml = pedagogicalContextToHtml(slide.content.pedagogical_context, 50000);
      } catch (error) {
        console.warn(`[PDF] Erreur lors de la conversion du contexte pédagogique pour slide "${slide.title}":`, error);
        contextHtml = '<p class="no-context">Erreur lors du chargement du contexte pédagogique.</p>';
      }
    }

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
      min-height: 600px;
      width: 100%;
    }

    .slide-section {
      flex: 1;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      background: #fff;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      min-width: 0; /* Important pour flex */
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
      overflow: hidden;
      min-width: 0; /* Important pour flex */
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

