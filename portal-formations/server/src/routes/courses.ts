import { Router, Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import { tipTapToHtml, pedagogicalContextToHtml } from '../utils/tipTapToHtml';
import { tipTapToMarkdown, pedagogicalContextToMarkdown } from '../utils/tipTapToMarkdown';
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

/**
 * GET /api/courses/programs/:programId/pdf
 * Génère un PDF du programme complet avec arborescence structurée
 * Structure: Programme > Cours > Modules > Items
 */
router.get('/programs/:programId/pdf', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[PDF Program] Début de la génération PDF pour le programme ${req.params.programId}`);
  
  try {
    const { programId } = req.params;

    if (!supabase) {
      console.error('[PDF Program] Configuration Supabase manquante');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être configurées'
      });
    }
    
    // Récupérer le token d'authentification
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentification requise',
        details: 'Vous devez être connecté pour télécharger le PDF'
      });
    }

    // Vérifier les permissions avec le token utilisateur
    const userClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: userProgram, error: userProgramError } = await userClient
      .from('programs')
      .select('id, title, description')
      .eq('id', programId)
      .single();

    if (userProgramError || !userProgram) {
      return res.status(404).json({ 
        error: 'Programme non trouvé',
        details: userProgramError?.message || 'Le programme avec cet ID n\'existe pas ou vous n\'y avez pas accès'
      });
    }

    // Récupérer le programme avec service role key (incluant le glossaire)
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, description, glossary')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return res.status(404).json({
        error: 'Programme non trouvé',
        details: programError?.message || 'Le programme avec cet ID n\'existe pas'
      });
    }

    console.log('[PDF Program] Programme trouvé:', program.title);

    // Récupérer tous les cours du programme avec leur ordre
    const { data: programCourses, error: programCoursesError } = await supabase
      .from('program_courses')
      .select(`
        position,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('program_id', programId)
      .order('position', { ascending: true });

    if (programCoursesError) {
      console.error('[PDF Program] Erreur lors de la récupération des cours:', programCoursesError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des cours',
        details: programCoursesError.message
      });
    }

    if (!programCourses || programCourses.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun cours trouvé',
        details: 'Le programme ne contient aucun cours'
      });
    }

    console.log('[PDF Program] Cours récupérés:', programCourses.length);

    // Pour chaque cours, récupérer les modules et items
    const coursesData: any[] = [];
    
    for (const pc of programCourses) {
      const course = (pc as any).courses;
      if (!course) continue;

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
            published,
            chapters (
              id,
              title,
              position,
              content
            )
          )
        `)
        .eq('course_id', course.id)
        .order('position', { ascending: true });

      if (modulesError) {
        console.warn(`[PDF Program] Erreur pour le cours ${course.title}:`, modulesError);
        continue;
      }

      // Filtrer les items publiés avec du contenu
      const modulesWithContent = (modules || []).map((module: any) => ({
        ...module,
        items: (module.items || [])
          .filter((item: any) =>
            item.published !== false &&
            (item.content?.body || item.asset_path || item.content?.description || item.content?.question || item.content?.instructions || (item.chapters && item.chapters.length > 0))
          )
          .sort((a: any, b: any) => a.position - b.position)
      })).filter((module: any) => module.items.length > 0);

      if (modulesWithContent.length > 0) {
        coursesData.push({
          ...course,
          position: (pc as any).position,
          modules: modulesWithContent,
          courseResources: [] as { title: string; description: string | null; signedUrl: string }[]
        });
      }
    }

    if (coursesData.length === 0) {
      return res.status(404).json({
        error: 'Aucun contenu trouvé',
        details: 'Le programme ne contient aucun contenu publié'
      });
    }

    // Pour chaque cours, récupérer les ressources (course_resources) et générer les URLs signées pour les PDF
    for (const course of coursesData) {
      const { data: resources, error: resourcesError } = await supabase
        .from('course_resources')
        .select('id, title, description, resource_type, file_path, mime_type')
        .eq('course_id', course.id)
        .eq('is_visible', true)
        .not('file_path', 'is', null)
        .order('position', { ascending: true });

      if (resourcesError || !resources || resources.length === 0) continue;

      const pdfResources = resources.filter((r: any) => {
        if (!r.file_path || (r.resource_type !== 'file' && r.resource_type !== 'document')) return false;
        const isPdfMime = typeof r.mime_type === 'string' && r.mime_type.toLowerCase().includes('pdf');
        const isPdfPath = typeof r.file_path === 'string' && r.file_path.toLowerCase().endsWith('.pdf');
        return isPdfMime || isPdfPath;
      });

      const imageResources = resources.filter((r: any) => {
        if (!r.file_path || r.resource_type !== 'file') return false;
        const isImageMime = typeof r.mime_type === 'string' && r.mime_type.toLowerCase().includes('image');
        return isImageMime;
      });

      for (const res of pdfResources) {
        const { data: signedData } = await supabase.storage
          .from('course-resources')
          .createSignedUrl(res.file_path, 3600);

        if (signedData?.signedUrl) {
          (course as any).courseResources.push({
            type: 'pdf',
            title: res.title,
            description: res.description || null,
            signedUrl: signedData.signedUrl
          });
        }
      }

      for (const res of imageResources) {
        const { data: signedData } = await supabase.storage
          .from('course-resources')
          .createSignedUrl(res.file_path, 3600);

        if (signedData?.signedUrl) {
          (course as any).courseResources.push({
            type: 'image',
            title: res.title,
            description: res.description || null,
            signedUrl: signedData.signedUrl
          });
        }
      }
    }

    console.log('[PDF Program] Données préparées pour', coursesData.length, 'cours');

    // Générer le HTML avec arborescence (incluant le glossaire et les PDF des ressources)
    const html = generateProgramPdfHtml(program, coursesData, program.glossary, supabase);

    // Générer le PDF avec Puppeteer
    console.log('[PDF Program] Lancement de Puppeteer...');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 120000 // 2 minutes pour les gros programmes
    });

    // Attendre le chargement des images
    await page.evaluate(() => {
      return Promise.all(
        Array.from(document.images)
          .map((img: HTMLImageElement) => {
            if (img.complete && img.naturalWidth > 0) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 5000);
            });
          })
      );
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #7f8c8d;">' + escapeHtml(program.title) + '</div>',
      footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%; color: #7f8c8d;">Page <span class="pageNumber"></span> sur <span class="totalPages"></span></div>',
      timeout: 120000
    });

    await browser.close();

    // Convertir Uint8Array en Buffer
    const pdfBuffer = Buffer.from(pdfUint8Array);

    // Valider que c'est bien un PDF
    console.log(`[PDF Program] Buffer généré: ${pdfBuffer.length} bytes`);
    const headerBytes = pdfBuffer.slice(0, 4);
    const isValidPdf = headerBytes[0] === 0x25 && // '%'
                       headerBytes[1] === 0x50 && // 'P'
                       headerBytes[2] === 0x44 && // 'D'
                       headerBytes[3] === 0x46;   // 'F'

    if (!isValidPdf) {
      console.error('[PDF Program] ❌ Buffer PDF invalide');
      console.error('[PDF Program] Header reçu:', headerBytes.toString('ascii'));
      console.error('[PDF Program] Premiers 200 bytes:', pdfBuffer.slice(0, 200).toString('utf8').substring(0, 200));
      throw new Error('Le PDF généré est invalide. Vérifiez les logs du serveur.');
    }

    console.log('[PDF Program] ✅ PDF validé (header: %PDF...)');

    const duration = Date.now() - startTime;
    console.log(`[PDF Program] ✅ PDF généré avec succès en ${duration}ms (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(program.title.replace(/[^a-z0-9]/gi, '_'))}.pdf"`
    );
    res.setHeader('Cache-Control', 'no-cache');

    res.send(pdfBuffer);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[PDF Program] ❌ Erreur lors de la génération du PDF (${duration}ms)`);
    console.error('[PDF Program] Erreur:', error?.message);
    
    res.status(500).json({ 
      error: 'Erreur lors de la génération du PDF',
      message: error?.message || 'Erreur inconnue'
    });
  }
});

/**
 * Génère le HTML pour le PDF d'un programme complet avec arborescence
 */
function generateProgramPdfHtml(program: any, coursesData: any[], glossary: any, supabaseClient: any): string {
  // Construire la table des matières
  let tocHtml = '<div class="toc"><h2>Table des matières</h2><ul>';
  let courseIndex = 1;

  coursesData.forEach((course) => {
    tocHtml += `<li><strong>${courseIndex}. ${escapeHtml(course.title)}</strong>`;
    if (course.modules && course.modules.length > 0) {
      tocHtml += '<ul>';
      course.modules.forEach((module: any) => {
        tocHtml += `<li>${escapeHtml(module.title)}`;
        if (module.items && module.items.length > 0) {
          tocHtml += '<ul>';
          module.items.forEach((item: any) => {
            tocHtml += `<li>${escapeHtml(item.title)}</li>`;
          });
          tocHtml += '</ul>';
        }
        tocHtml += '</li>';
      });
      tocHtml += '</ul>';
    }
    const courseResources = (course as any).courseResources;
    if (courseResources && Array.isArray(courseResources) && courseResources.length > 0) {
      tocHtml += '<ul><li>Ressources de la formation</li></ul>';
    }
    tocHtml += '</li>';
    courseIndex++;
  });

  // Ajouter le glossaire à la table des matières s'il existe
  if (glossary?.terms && glossary.terms.length > 0) {
    tocHtml += `<li><strong>${courseIndex}. Glossaire</strong></li>`;
  }

  tocHtml += '</ul></div>';

  // Construire le contenu
  let contentHtml = '';
  courseIndex = 1;

  coursesData.forEach((course) => {
    contentHtml += `<div class="course-section"><h1>${courseIndex}. ${escapeHtml(course.title)}</h1>`;

    if (course.description) {
      contentHtml += `<p class="course-description">${escapeHtml(course.description)}</p>`;
    }

    if (course.modules && course.modules.length > 0) {
      course.modules.forEach((module: any) => {
        contentHtml += `<div class="module-section"><h2>${escapeHtml(module.title)}</h2>`;

        if (module.items && module.items.length > 0) {
          module.items.forEach((item: any) => {
            const itemTypeLabel = getItemTypeLabel(item.type);
            contentHtml += `<div class="item-section"><h3>${escapeHtml(item.title)}${itemTypeLabel ? ` <span class="item-type">(${escapeHtml(itemTypeLabel)})</span>` : ''}</h3>`;

            // Asset (image ou PDF)
            if (item.asset_path && supabaseClient) {
              const { data } = supabaseClient.storage
                .from('course-assets')
                .getPublicUrl(item.asset_path);

              if (item.asset_path.endsWith('.pdf')) {
                contentHtml += `<div class="item-content"><p class="note"><strong>Fichier PDF:</strong> ${escapeHtml(item.title)}</p></div>`;
              } else if (data?.publicUrl) {
                const imageUrl = data.publicUrl.replace(/"/g, '&quot;');
                contentHtml += `<div class="item-content"><img src="${imageUrl}" alt="${escapeHtml(item.title)}" class="item-image" /></div>`;
              }
            }

            // Contenu body (pour resource, slide, etc.)
            if (item.content?.body) {
              try {
                const tipTapHtml = tipTapToHtml(item.content.body, 100000);
                contentHtml += `<div class="item-content">${tipTapHtml}</div>`;
              } catch (error) {
                console.warn(`[PDF Program] Erreur conversion body pour "${item.title}":`, error);
              }
            }

            // Chapitres (sous-sections de l'item)
            if (item.chapters && Array.isArray(item.chapters) && item.chapters.length > 0) {
              item.chapters
                .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                .forEach((chapter: any) => {
                  contentHtml += `<div class="chapter-section"><h4>${escapeHtml(chapter.title)}</h4>`;
                  if (chapter.content) {
                    try {
                      const chapterHtml = tipTapToHtml(chapter.content, 100000);
                      contentHtml += `<div class="chapter-content">${chapterHtml}</div>`;
                    } catch (error) {
                      console.warn(`[PDF Program] Erreur chapitre "${chapter.title}":`, error);
                    }
                  }
                  contentHtml += '</div>';
                });
            }

            // Question (pour exercise, quiz)
            if (item.content?.question) {
              contentHtml += '<div class="item-content"><p class="content-label"><strong>Question:</strong></p>';
              try {
                const questionHtml = tipTapToHtml(item.content.question, 50000);
                contentHtml += questionHtml;
              } catch (error) {
                console.warn(`[PDF Program] Erreur question pour "${item.title}":`, error);
              }
              contentHtml += '</div>';
            }

            // Correction (pour exercise)
            if (item.content?.correction) {
              contentHtml += '<div class="item-content correction"><p class="content-label"><strong>Correction:</strong></p>';
              try {
                const correctionHtml = tipTapToHtml(item.content.correction, 50000);
                contentHtml += correctionHtml;
              } catch (error) {
                console.warn(`[PDF Program] Erreur correction pour "${item.title}":`, error);
              }
              contentHtml += '</div>';
            }

            // Instructions (pour TP)
            if (item.content?.instructions) {
              contentHtml += '<div class="item-content"><p class="content-label"><strong>Instructions:</strong></p>';
              try {
                const instructionsHtml = tipTapToHtml(item.content.instructions, 50000);
                contentHtml += instructionsHtml;
              } catch (error) {
                console.warn(`[PDF Program] Erreur instructions pour "${item.title}":`, error);
              }
              contentHtml += '</div>';
            }

            // Checklist (pour TP)
            if (item.content?.checklist && Array.isArray(item.content.checklist)) {
              contentHtml += '<div class="item-content"><p class="content-label"><strong>Checklist:</strong></p><ul class="checklist">';
              item.content.checklist.forEach((task: string) => {
                contentHtml += `<li>☐ ${escapeHtml(task)}</li>`;
              });
              contentHtml += '</ul></div>';
            }

            // Description
            if (item.content?.description && !item.content?.body) {
              contentHtml += `<div class="item-content"><p>${escapeHtml(item.content.description)}</p></div>`;
            }

            // Contexte pédagogique (pour slides)
            if (item.content?.pedagogical_context) {
              contentHtml += '<div class="item-content pedagogical"><p class="content-label"><strong>Contexte pédagogique:</strong></p>';
              try {
                const contextHtml = pedagogicalContextToHtml(item.content.pedagogical_context, 50000);
                contentHtml += contextHtml;
              } catch (error) {
                console.warn(`[PDF Program] Erreur contexte pédagogique pour "${item.title}":`, error);
              }
              contentHtml += '</div>';
            }

            contentHtml += '</div>';
          });
        }

        contentHtml += '</div>';
      });
    }

      // Ressources de la formation (PDF et photos)
      const courseResources = (course as any).courseResources;
      if (courseResources && Array.isArray(courseResources) && courseResources.length > 0) {
        contentHtml += '<div class="course-resources-section"><h2>Ressources de la formation</h2>';
        courseResources.forEach((res: { type: string; title: string; description: string | null; signedUrl: string }) => {
          const safeUrl = res.signedUrl.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
          contentHtml += `<div class="resource-block">`;
          contentHtml += `<h3 class="resource-title">${escapeHtml(res.title)}</h3>`;
          if (res.description) {
            contentHtml += `<p class="resource-desc">${escapeHtml(res.description)}</p>`;
          }
          if (res.type === 'image') {
            contentHtml += `<img src="${safeUrl}" alt="${escapeHtml(res.title)}" class="resource-image" />`;
          } else {
            contentHtml += `<embed src="${safeUrl}" type="application/pdf" class="resource-pdf-embed" />`;
          }
          contentHtml += '</div>';
        });
        contentHtml += '</div>';
      }

    contentHtml += '</div>';
    courseIndex++;
  });

  // Ajouter le glossaire si disponible
  if (glossary?.terms && glossary.terms.length > 0) {
    contentHtml += `<div class="course-section glossary-section"><h1>${courseIndex}. Glossaire</h1>`;

    if (glossary.metadata?.title) {
      contentHtml += `<h2>${escapeHtml(glossary.metadata.title)}</h2>`;
    }
    if (glossary.metadata?.description) {
      contentHtml += `<p class="course-description">${escapeHtml(glossary.metadata.description)}</p>`;
    }

    const categories = glossary.categories || [];
    const terms = glossary.terms || [];

    if (categories.length > 0) {
      // Termes par catégorie
      categories.forEach((category: any) => {
        const categoryTerms = terms.filter((t: any) => t.category_id === category.id);
        if (categoryTerms.length === 0) return;

        contentHtml += `<div class="glossary-category"><h3>${escapeHtml(category.name)}</h3>`;
        if (category.description) {
          contentHtml += `<p class="category-description">${escapeHtml(category.description)}</p>`;
        }

        categoryTerms.forEach((term: any) => {
          contentHtml += `<div class="glossary-term"><h4>${escapeHtml(term.word)}</h4>`;
          contentHtml += `<p>${escapeHtml(term.explanation)}</p>`;
          if (term.example) {
            contentHtml += `<p class="term-example"><strong>Exemple:</strong> ${escapeHtml(term.example)}</p>`;
          }
          if (term.tags && term.tags.length > 0) {
            contentHtml += `<p class="term-tags"><strong>Tags:</strong> ${term.tags.map((t: string) => escapeHtml(t)).join(', ')}</p>`;
          }
          contentHtml += '</div>';
        });

        contentHtml += '</div>';
      });

      // Termes sans catégorie
      const uncategorizedTerms = terms.filter((t: any) => !t.category_id || !categories.find((c: any) => c.id === t.category_id));
      if (uncategorizedTerms.length > 0) {
        contentHtml += '<div class="glossary-category"><h3>Autres termes</h3>';
        uncategorizedTerms.forEach((term: any) => {
          contentHtml += `<div class="glossary-term"><h4>${escapeHtml(term.word)}</h4>`;
          contentHtml += `<p>${escapeHtml(term.explanation)}</p>`;
          if (term.example) {
            contentHtml += `<p class="term-example"><strong>Exemple:</strong> ${escapeHtml(term.example)}</p>`;
          }
          contentHtml += '</div>';
        });
        contentHtml += '</div>';
      }
    } else {
      // Pas de catégories, afficher tous les termes
      terms.forEach((term: any) => {
        contentHtml += `<div class="glossary-term"><h4>${escapeHtml(term.word)}</h4>`;
        contentHtml += `<p>${escapeHtml(term.explanation)}</p>`;
        if (term.example) {
          contentHtml += `<p class="term-example"><strong>Exemple:</strong> ${escapeHtml(term.example)}</p>`;
        }
        contentHtml += '</div>';
      });
    }

    contentHtml += '</div>';
  }

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(program.title)}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
    }

    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      text-align: center;
      border-bottom: 3px solid #3498db;
      padding-bottom: 30px;
    }

    .cover-page h1 {
      font-size: 28pt;
      color: #2c3e50;
      margin-bottom: 20px;
    }

    .cover-page .subtitle {
      font-size: 14pt;
      color: #7f8c8d;
      margin-top: 10px;
    }

    .cover-page .date {
      font-size: 10pt;
      color: #95a5a6;
      margin-top: 30px;
    }

    .toc {
      page-break-after: always;
      margin-bottom: 30px;
    }

    .toc h2 {
      font-size: 18pt;
      color: #2c3e50;
      margin-bottom: 20px;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
    }

    .toc ul {
      list-style-type: none;
      padding-left: 0;
    }

    .toc ul ul {
      padding-left: 30px;
      margin-top: 5px;
    }

    .toc ul ul ul {
      padding-left: 30px;
    }

    .toc li {
      margin: 8px 0;
      line-height: 1.8;
    }

    .toc li strong {
      color: #2c3e50;
    }

    .course-section {
      page-break-before: always;
      margin-bottom: 40px;
    }

    .course-section h1 {
      font-size: 22pt;
      color: #2c3e50;
      margin-bottom: 15px;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      page-break-after: avoid;
    }

    .course-description {
      font-size: 11pt;
      color: #555;
      margin-bottom: 25px;
      font-style: italic;
    }

    .module-section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .module-section h2 {
      font-size: 16pt;
      color: #34495e;
      margin-top: 25px;
      margin-bottom: 15px;
      border-bottom: 2px solid #95a5a6;
      padding-bottom: 8px;
      page-break-after: avoid;
    }

    .item-section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .item-section h3 {
      font-size: 13pt;
      color: #7f8c8d;
      margin-top: 20px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    .item-content {
      margin-left: 15px;
      margin-bottom: 15px;
    }

    .item-content p {
      margin: 8px 0;
      text-align: justify;
    }

    .item-image {
      max-width: 50%;
      width: 50%;
      height: auto;
      display: block;
      margin: 15px auto;
      page-break-inside: avoid;
    }

    /* Images dans le contenu riche (TipTap) : 50% pour qu'elles s'affichent complètement */
    .item-content img,
    .chapter-content img {
      max-width: 50% !important;
      width: 50% !important;
      height: auto !important;
      display: block;
      margin: 10px auto;
    }

    .item-content h1, .item-content h2, .item-content h3, .item-content h4 {
      margin-top: 15px;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    .item-content code {
      background-color: #f4f4f4;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
    }

    .item-content pre {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 15px;
      border-radius: 5px;
      overflow-x: auto;
      page-break-inside: avoid;
      margin: 15px 0;
    }

    .item-content pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
    }

    .item-content ul, .item-content ol {
      margin: 10px 0;
      padding-left: 30px;
    }

    .item-content blockquote {
      border-left: 4px solid #3498db;
      padding-left: 15px;
      margin: 15px 0;
      color: #555;
      font-style: italic;
    }

    .course-resources-section {
      margin-top: 30px;
      margin-bottom: 25px;
      page-break-before: auto;
    }

    .course-resources-section h2 {
      font-size: 16pt;
      color: #34495e;
      margin-bottom: 15px;
      border-bottom: 2px solid #95a5a6;
      padding-bottom: 8px;
      page-break-after: avoid;
    }

    .resource-block {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }

    .resource-title {
      font-size: 13pt;
      color: #2c3e50;
      margin-bottom: 8px;
      page-break-after: avoid;
    }

    .resource-desc {
      font-size: 10pt;
      color: #555;
      margin-bottom: 10px;
      font-style: italic;
    }

    /* Photos des ressources : 50 % pour qu'elles s'affichent complètement */
    .resource-image {
      max-width: 50%;
      width: 50%;
      height: auto;
      display: block;
      margin: 15px auto;
      page-break-inside: avoid;
    }

    .resource-pdf-embed {
      width: 100%;
      height: 600px;
      max-height: 80vh;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: block;
    }

    .note {
      color: #7f8c8d;
      font-style: italic;
    }

    .error {
      color: #e74c3c;
      font-weight: bold;
    }

    .item-type {
      font-size: 10pt;
      color: #95a5a6;
      font-weight: normal;
    }

    .content-label {
      margin-bottom: 8px;
      color: #2c3e50;
    }

    .chapter-section {
      margin: 15px 0 15px 20px;
      padding-left: 15px;
      border-left: 3px solid #bdc3c7;
    }

    .chapter-section h4 {
      font-size: 12pt;
      color: #555;
      margin-bottom: 10px;
    }

    .chapter-content {
      margin-left: 0;
    }

    .correction {
      background-color: #e8f8f5;
      padding: 10px 15px;
      border-radius: 5px;
      border-left: 4px solid #27ae60;
    }

    .pedagogical {
      background-color: #fef9e7;
      padding: 10px 15px;
      border-radius: 5px;
      border-left: 4px solid #f39c12;
    }

    .checklist {
      list-style-type: none;
      padding-left: 10px;
    }

    .checklist li {
      margin: 5px 0;
    }

    /* Glossaire */
    .glossary-section {
      page-break-before: always;
    }

    .glossary-category {
      margin-bottom: 25px;
    }

    .glossary-category h3 {
      font-size: 14pt;
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 5px;
      margin-bottom: 15px;
    }

    .category-description {
      font-style: italic;
      color: #7f8c8d;
      margin-bottom: 15px;
    }

    .glossary-term {
      margin-bottom: 15px;
      padding-left: 15px;
      border-left: 3px solid #ecf0f1;
    }

    .glossary-term h4 {
      font-size: 12pt;
      color: #34495e;
      margin-bottom: 5px;
    }

    .term-example {
      color: #7f8c8d;
      font-style: italic;
      margin-top: 5px;
    }

    .term-tags {
      color: #95a5a6;
      font-size: 10pt;
      margin-top: 5px;
    }
  </style>
</head>
<body>
  <div class="cover-page">
    <h1>${escapeHtml(program.title)}</h1>
    ${program.description ? `<p class="subtitle">${escapeHtml(program.description)}</p>` : ''}
    <p class="date">Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
  </div>

  ${tocHtml}

  ${contentHtml}
</body>
</html>
  `;
}

/**
 * GET /api/courses/programs/:programId/markdown
 * Génère un fichier Markdown du programme complet avec arborescence structurée
 */
router.get('/programs/:programId/markdown', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[Markdown Program] Début de la génération Markdown pour le programme ${req.params.programId}`);
  
  try {
    const { programId } = req.params;

    if (!supabase) {
      console.error('[Markdown Program] Configuration Supabase manquante');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être configurées'
      });
    }
    
    // Récupérer le token d'authentification
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentification requise',
        details: 'Vous devez être connecté pour télécharger le Markdown'
      });
    }

    // Vérifier les permissions avec le token utilisateur
    const userClient = createClient(supabaseUrl!, supabaseAnonKey!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
    
    const { data: userProgram, error: userProgramError } = await userClient
      .from('programs')
      .select('id, title, description')
      .eq('id', programId)
      .single();

    if (userProgramError || !userProgram) {
      return res.status(404).json({
        error: 'Programme non trouvé',
        details: userProgramError?.message || 'Le programme avec cet ID n\'existe pas ou vous n\'y avez pas accès'
      });
    }

    // Récupérer le programme avec service role key (incluant le glossaire)
    const { data: program, error: programError } = await supabase
      .from('programs')
      .select('id, title, description, glossary')
      .eq('id', programId)
      .single();

    if (programError || !program) {
      return res.status(404).json({
        error: 'Programme non trouvé',
        details: programError?.message || 'Le programme avec cet ID n\'existe pas dans la base de données'
      });
    }

    // Récupérer les cours du programme
    const { data: programCourses, error: programCoursesError } = await supabase
      .from('program_courses')
      .select(`
        course_id,
        position,
        courses (
          id,
          title,
          description
        )
      `)
      .eq('program_id', programId)
      .order('position', { ascending: true });

    if (programCoursesError) {
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des cours',
        details: programCoursesError.message
      });
    }

    if (!programCourses || programCourses.length === 0) {
      return res.status(404).json({ 
        error: 'Aucun cours trouvé',
        details: 'Le programme ne contient aucun cours'
      });
    }

    // Récupérer les modules et items pour chaque cours
    const parts: string[] = [];
    
    // En-tête du document
    parts.push(`# ${program.title}\n\n`);
    
    if (program.description) {
      parts.push(`${program.description}\n\n`);
    }
    
    parts.push(`---\n\n`);
    parts.push(`## Table des matières\n\n`);
    
    // Générer la table des matières
    programCourses.forEach((pc: any, courseIndex: number) => {
      const course = pc.courses;
      if (!course) return;

      parts.push(`${courseIndex + 1}. [${course.title}](#cours-${courseIndex + 1})\n`);
    });

    // Ajouter le glossaire à la table des matières s'il existe
    if (program.glossary && typeof program.glossary === 'object') {
      const glossary = program.glossary as { terms?: Array<unknown> };
      if (glossary.terms && glossary.terms.length > 0) {
        parts.push(`${programCourses.length + 1}. [Glossaire](#glossaire)\n`);
      }
    }

    parts.push(`\n---\n\n`);

    // Générer le contenu pour chaque cours
    for (let courseIndex = 0; courseIndex < programCourses.length; courseIndex++) {
      const pc = programCourses[courseIndex];
      const course = pc.courses;
      if (!course) continue;

      parts.push(`## ${courseIndex + 1}. ${course.title} {#cours-${courseIndex + 1}}\n\n`);
      
      if (course.description) {
        parts.push(`${course.description}\n\n`);
      }

      // Récupérer les modules du cours (avec chapitres)
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
            published,
            chapters (
              id,
              title,
              position,
              content
            )
          )
        `)
        .eq('course_id', course.id)
        .order('position', { ascending: true });

      if (modulesError) {
        console.error(`[Markdown Program] Erreur pour le cours ${course.id}:`, modulesError);
        parts.push(`*Erreur lors de la récupération des modules*\n\n`);
        continue;
      }

      if (modules && modules.length > 0) {
        modules.forEach((module: any) => {
          parts.push(`### ${module.title}\n\n`);

          if (module.items && module.items.length > 0) {
            // Trier et filtrer les items publiés
            const publishedItems = module.items
              .filter((item: any) => item.published !== false)
              .sort((a: any, b: any) => (a.position || 0) - (b.position || 0));

            publishedItems.forEach((item: any) => {
              // Titre de l'item avec son type
              const itemTypeLabel = getItemTypeLabel(item.type);
              parts.push(`#### ${item.title}${itemTypeLabel ? ` (${itemTypeLabel})` : ''}\n\n`);

              // Asset (image ou PDF)
              if (item.asset_path && supabase) {
                const { data } = supabase.storage
                  .from('course-assets')
                  .getPublicUrl(item.asset_path);

                if (item.asset_path.endsWith('.pdf')) {
                  parts.push(`**Fichier PDF:** ${item.title}\n\n`);
                } else if (data?.publicUrl) {
                  parts.push(`![${item.title}](${data.publicUrl})\n\n`);
                }
              }

              // Contenu body (pour resource, slide, etc.)
              if (item.content?.body) {
                try {
                  const markdownContent = tipTapToMarkdown(item.content.body, 100000);
                  if (markdownContent && markdownContent.trim()) {
                    parts.push(`${markdownContent}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown Program] Erreur body pour l'item ${item.id}:`, error);
                }
              }

              // Chapitres (contenu supplémentaire organisé)
              if (item.chapters && Array.isArray(item.chapters) && item.chapters.length > 0) {
                item.chapters
                  .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
                  .forEach((chapter: any) => {
                    parts.push(`##### ${chapter.title}\n\n`);
                    if (chapter.content) {
                      try {
                        const chapterMarkdown = tipTapToMarkdown(chapter.content, 100000);
                        if (chapterMarkdown && chapterMarkdown.trim()) {
                          parts.push(`${chapterMarkdown}\n\n`);
                        }
                      } catch (error) {
                        console.warn(`[Markdown Program] Erreur chapitre "${chapter.title}":`, error);
                      }
                    }
                  });
              }

              // Question (pour exercise, quiz)
              if (item.content?.question) {
                parts.push(`**Question:**\n\n`);
                try {
                  const questionMarkdown = tipTapToMarkdown(item.content.question, 50000);
                  if (questionMarkdown) {
                    parts.push(`${questionMarkdown}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown Program] Erreur question pour l'item ${item.id}:`, error);
                }
              }

              // Correction (pour exercise)
              if (item.content?.correction) {
                parts.push(`**Correction:**\n\n`);
                try {
                  const correctionMarkdown = tipTapToMarkdown(item.content.correction, 50000);
                  if (correctionMarkdown) {
                    parts.push(`${correctionMarkdown}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown Program] Erreur correction pour l'item ${item.id}:`, error);
                }
              }

              // Instructions (pour TP)
              if (item.content?.instructions) {
                parts.push(`**Instructions:**\n\n`);
                try {
                  const instructionsMarkdown = tipTapToMarkdown(item.content.instructions, 50000);
                  if (instructionsMarkdown) {
                    parts.push(`${instructionsMarkdown}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown Program] Erreur instructions pour l'item ${item.id}:`, error);
                }
              }

              // Checklist (pour TP)
              if (item.content?.checklist && Array.isArray(item.content.checklist)) {
                parts.push(`**Checklist:**\n\n`);
                item.content.checklist.forEach((task: string) => {
                  parts.push(`- [ ] ${task}\n`);
                });
                parts.push(`\n`);
              }

              // Description
              if (item.content?.description) {
                parts.push(`${item.content.description}\n\n`);
              }

              // Contexte pédagogique (pour slides)
              if (item.content?.pedagogical_context) {
                parts.push(`##### Contexte pédagogique\n\n`);
                try {
                  const contextMarkdown = pedagogicalContextToMarkdown(item.content.pedagogical_context, 50000);
                  if (contextMarkdown) {
                    parts.push(`${contextMarkdown}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown Program] Erreur contexte pédagogique pour l'item ${item.id}:`, error);
                }
              }
            });
          }
        });
      }
      
      parts.push(`---\n\n`);
    }

    // Ajouter le glossaire du programme s'il existe
    if (program.glossary && typeof program.glossary === 'object') {
      const glossary = program.glossary as {
        metadata?: { title?: string; description?: string };
        categories?: Array<{ id: string; name: string; description?: string }>;
        terms?: Array<{
          id: string;
          word: string;
          explanation: string;
          example?: string;
          category_id?: string;
          tags?: string[];
          related_terms?: string[];
          difficulty?: string;
        }>;
      };

      const categories = glossary.categories || [];
      const terms = glossary.terms || [];

      // Ne générer le glossaire que s'il y a des termes
      if (terms.length > 0) {
        parts.push(`# Glossaire {#glossaire}\n\n`);

        // Titre et description du glossaire
        if (glossary.metadata?.title) {
          parts.push(`## ${glossary.metadata.title}\n\n`);
        }
        if (glossary.metadata?.description) {
          parts.push(`${glossary.metadata.description}\n\n`);
        }

        if (categories.length > 0) {
          // Afficher les termes par catégorie
          for (const category of categories) {
            const categoryTerms = terms.filter(t => t.category_id === category.id);
            if (categoryTerms.length === 0) continue;

            parts.push(`### ${category.name}\n\n`);
            if (category.description) {
              parts.push(`${category.description}\n\n`);
            }

            for (const term of categoryTerms) {
              parts.push(`#### ${term.word}\n\n`);
              parts.push(`${term.explanation}\n\n`);

              if (term.example) {
                parts.push(`**Exemple :** ${term.example}\n\n`);
              }

              if (term.tags && term.tags.length > 0) {
                parts.push(`**Tags :** ${term.tags.join(', ')}\n\n`);
              }

              if (term.difficulty) {
                const difficultyLabels: Record<string, string> = {
                  beginner: 'Débutant',
                  intermediate: 'Intermédiaire',
                  advanced: 'Avancé'
                };
                parts.push(`**Niveau :** ${difficultyLabels[term.difficulty] || term.difficulty}\n\n`);
              }
            }
          }

          // Termes sans catégorie
          const uncategorizedTerms = terms.filter(t => !t.category_id || !categories.find(c => c.id === t.category_id));
          if (uncategorizedTerms.length > 0) {
            parts.push(`### Sans catégorie\n\n`);
            for (const term of uncategorizedTerms) {
              parts.push(`#### ${term.word}\n\n`);
              parts.push(`${term.explanation}\n\n`);

              if (term.example) {
                parts.push(`**Exemple :** ${term.example}\n\n`);
              }

              if (term.tags && term.tags.length > 0) {
                parts.push(`**Tags :** ${term.tags.join(', ')}\n\n`);
              }
            }
          }
        } else {
          // Pas de catégories, afficher tous les termes
          for (const term of terms) {
            parts.push(`### ${term.word}\n\n`);
            parts.push(`${term.explanation}\n\n`);

            if (term.example) {
              parts.push(`**Exemple :** ${term.example}\n\n`);
            }

            if (term.tags && term.tags.length > 0) {
              parts.push(`**Tags :** ${term.tags.join(', ')}\n\n`);
            }
          }
        }

        parts.push(`---\n\n`);
        console.log(`[Markdown Program] ✅ Glossaire ajouté avec ${terms.length} termes`);
      }
    }

    const markdown = parts.join('');
    const markdownSize = Buffer.byteLength(markdown, 'utf8');

    const duration = Date.now() - startTime;
    console.log(`[Markdown Program] ✅ Markdown généré avec succès en ${duration}ms (${(markdownSize / 1024).toFixed(2)} KB)`);
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Length', markdownSize.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(program.title.replace(/[^a-z0-9]/gi, '_'))}.md"`
    );
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(markdown);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`[Markdown Program] ❌ Erreur lors de la génération du Markdown (${duration}ms)`);
    console.error('[Markdown Program] Message:', error?.message?.substring(0, 500) || 'Erreur inconnue');
    
    res.status(500).json({ 
      error: 'Erreur lors de la génération du Markdown',
      message: (error?.message || 'Erreur inconnue').substring(0, 500)
    });
  }
});

/**
 * GET /api/courses/:courseId/markdown
 * Génère un fichier Markdown du cours complet
 */
router.get('/:courseId/markdown', async (req: Request, res: Response) => {
  const startTime = Date.now();
  console.log(`[Markdown] Début de la génération Markdown pour le cours ${req.params.courseId}`);
  
  try {
    const { courseId } = req.params;

    if (!supabase) {
      console.error('[Markdown] Configuration Supabase manquante');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Les variables d\'environnement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY doivent être configurées'
      });
    }
    
    console.log('[Markdown] Configuration Supabase OK');

    // Récupérer le token d'authentification depuis le header
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      console.log('[Markdown] Aucun token d\'authentification fourni');
      return res.status(401).json({ 
        error: 'Authentification requise',
        details: 'Vous devez être connecté pour télécharger le Markdown'
      });
    }

    // 1. Vérifier les permissions de l'utilisateur avec le token
    console.log('[Markdown] Vérification des permissions utilisateur...');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[Markdown] Configuration Supabase incomplète');
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
    const { data: userCourse, error: userCourseError } = await userClient
      .from('courses')
      .select('id, title, description, allow_pdf_download')
      .eq('id', courseId)
      .single();

    if (userCourseError || !userCourse) {
      if (userCourseError?.code === 'PGRST301' || userCourseError?.message?.includes('permission')) {
        return res.status(403).json({ 
          error: 'Accès refusé',
          details: 'Vous n\'avez pas les permissions nécessaires pour accéder à ce cours.'
        });
      }
      
      if (userCourseError?.code === 'PGRST116' || userCourseError?.message?.includes('not found')) {
        return res.status(404).json({ 
          error: 'Cours non trouvé',
          details: 'Le cours avec cet ID n\'existe pas dans la base de données'
        });
      }
      
      return res.status(404).json({ 
        error: 'Cours non trouvé',
        details: userCourseError?.message || 'Le cours avec cet ID n\'existe pas ou vous n\'y avez pas accès'
      });
    }
    
    console.log('[Markdown] ✅ Permissions vérifiées, accès autorisé');

    // 2. Utiliser le service role key pour récupérer toutes les données
    if (!supabase) {
      console.error('[Markdown] Client Supabase non disponible');
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Impossible de créer le client Supabase'
      });
    }
    
    const finalCourse = userCourse;
    console.log('[Markdown] Cours trouvé:', finalCourse.title);

    // 3. Vérifier que le téléchargement est activé (utiliser allow_pdf_download pour compatibilité)
    if (!finalCourse.allow_pdf_download) {
      console.warn('[Markdown] Téléchargement non activé pour ce cours');
      return res.status(403).json({ 
        error: 'Le téléchargement n\'est pas activé pour ce cours',
        details: 'Activez cette option dans les paramètres du cours'
      });
    }

    // 4. Récupérer les modules et items (avec chapitres)
    console.log('[Markdown] Récupération des modules et items...');
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
          published,
          chapters (
            id,
            title,
            position,
            content
          )
        )
      `)
      .eq('course_id', courseId)
      .order('position', { ascending: true });

    if (modulesError) {
      console.error('[Markdown] Erreur lors de la récupération des modules:', modulesError);
      return res.status(500).json({ 
        error: 'Erreur lors de la récupération des modules',
        details: modulesError.message
      });
    }
    
    console.log('[Markdown] Modules récupérés:', modules?.length || 0);

    // 5. Organiser les modules avec leurs items (inclure TOUS les types d'items publiés)
    const modulesWithItems = (modules || [])
      .map(module => {
        const publishedItems = (module.items as any[] || [])
          .filter(item => item.published !== false)
          .sort((a, b) => (a.position || 0) - (b.position || 0));
        
        console.log(`[Markdown] Module "${module.title}": ${publishedItems.length} items publiés sur ${(module.items as any[] || []).length} total`);
        
        return {
          ...module,
          items: publishedItems
        };
      })
      .sort((a, b) => (a.position || 0) - (b.position || 0)); // Inclure TOUS les modules, même vides

    console.log(`[Markdown] Modules organisés: ${modulesWithItems.length}`);
    const totalItems = modulesWithItems.reduce((sum, m) => sum + m.items.length, 0);
    console.log(`[Markdown] Total items publiés: ${totalItems}`);
    
    // Log détaillé des types d'items
    const itemsByType = modulesWithItems
      .flatMap(m => m.items)
      .reduce((acc: any, item: any) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      }, {});
    console.log(`[Markdown] Items par type:`, itemsByType);

    // 6. Récupérer le glossaire si disponible (vérifier d'abord au niveau du cours, puis du programme)
    let glossary = null;
    try {
      console.log('[Markdown] Recherche du glossaire...');
      // Vérifier si le cours fait partie d'un programme avec un glossaire
      const { data: programCourses, error: programCoursesError } = await supabase
        .from('program_courses')
        .select('program_id')
        .eq('course_id', courseId)
        .limit(1);

      if (programCoursesError) {
        console.warn('[Markdown] Erreur lors de la recherche du programme:', programCoursesError);
      } else if (programCourses && programCourses.length > 0) {
        console.log(`[Markdown] Cours trouvé dans le programme: ${programCourses[0].program_id}`);
        const { data: programWithGlossary, error: programError } = await supabase
          .from('programs')
          .select('glossary, title')
          .eq('id', programCourses[0].program_id)
          .single();

        if (programError) {
          console.warn('[Markdown] Erreur lors de la récupération du programme:', programError);
        } else {
          console.log(`[Markdown] Programme récupéré: ${programWithGlossary?.title || 'N/A'}`);
          if (programWithGlossary?.glossary) {
            glossary = programWithGlossary.glossary;
            const termCount = glossary.terms?.length || 0;
            const categoryCount = glossary.categories?.length || 0;
            console.log(`[Markdown] ✅ Glossaire trouvé: ${termCount} termes, ${categoryCount} catégories`);
          } else {
            console.log('[Markdown] Programme trouvé mais sans glossaire');
          }
        }
      } else {
        console.log('[Markdown] Cours non associé à un programme');
      }
    } catch (glossaryError) {
      console.warn('[Markdown] Erreur lors de la récupération du glossaire:', glossaryError);
      // Continuer sans glossaire
    }
    
    if (!glossary) {
      console.log('[Markdown] Aucun glossaire disponible pour ce cours');
    }

    if (modulesWithItems.length === 0 && !glossary) {
      console.warn('[Markdown] Aucun contenu trouvé pour le Markdown');
      return res.status(404).json({ 
        error: 'Aucun contenu trouvé dans ce cours',
        details: 'Le cours ne contient aucun module avec des items publiés.'
      });
    }

    // 7. Générer le Markdown
    console.log('[Markdown] Génération du Markdown...');
    const markdown = generateMarkdown(finalCourse, modulesWithItems, glossary, supabase);
    const markdownSize = Buffer.byteLength(markdown, 'utf8');
    console.log('[Markdown] Markdown généré, taille:', (markdownSize / 1024).toFixed(2), 'KB');

    // 7. Envoyer le Markdown
    const duration = Date.now() - startTime;
    console.log(`[Markdown] ✅ Markdown généré avec succès en ${duration}ms (${(markdownSize / 1024).toFixed(2)} KB)`);
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader('Content-Length', markdownSize.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(finalCourse.title.replace(/[^a-z0-9]/gi, '_'))}.md"`
    );
    res.setHeader('Cache-Control', 'no-cache');
    
    res.send(markdown);

  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    console.error(`[Markdown] ❌ Erreur lors de la génération du Markdown (${duration}ms)`);
    console.error('[Markdown] Type d\'erreur:', error?.constructor?.name || 'Unknown');
    console.error('[Markdown] Message:', error?.message?.substring(0, 500) || 'Erreur inconnue');
    
    let errorMessage = 'Erreur lors de la génération du Markdown';
    let errorDetails = (error?.message || 'Erreur inconnue').substring(0, 500);
    
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const response: any = { 
      error: errorMessage,
      message: errorDetails
    };
    
    if (isDevelopment && error?.stack) {
      response.stack = error.stack.substring(0, 2000);
      response.type = error?.constructor?.name || 'Unknown';
    }
    
    res.status(500).json(response);
  }
});

/**
 * Génère le Markdown pour le cours
 */
function generateMarkdown(course: any, modules: any[], glossary: any, supabaseClient: any): string {
  const parts: string[] = [];
  
  console.log(`[generateMarkdown] Début génération: ${modules.length} modules, glossaire: ${glossary ? 'présent' : 'absent'}`);
  if (glossary) {
    console.log(`[generateMarkdown] Glossaire détails:`, {
      hasMetadata: !!glossary.metadata,
      categoriesCount: glossary.categories?.length || 0,
      termsCount: glossary.terms?.length || 0
    });
  }
  
  // En-tête du document
  parts.push(`# ${course.title}\n\n`);
  
  if (course.description) {
    parts.push(`${course.description}\n\n`);
  }
  
  parts.push(`---\n\n`);
  
  // Parcourir les modules
  modules.forEach((module, moduleIndex) => {
    console.log(`[generateMarkdown] Module ${moduleIndex + 1}/${modules.length}: "${module.title}" (${module.items?.length || 0} items)`);
    // Titre du module
    parts.push(`## ${module.title}\n\n`);
    
    // Parcourir les items du module
    if (module.items && module.items.length > 0) {
      module.items.forEach((item: any, itemIndex: number) => {
        console.log(`[generateMarkdown] Item ${itemIndex + 1}: "${item.title}" (type: ${item.type})`);
        console.log(`[generateMarkdown]   - has content.body: ${!!item.content?.body}`);
        console.log(`[generateMarkdown]   - has chapters: ${!!(item.chapters && item.chapters.length > 0)}`);
        if (item.content?.body) {
          console.log(`[generateMarkdown]   - content.body type:`, typeof item.content.body);
          if (typeof item.content.body === 'object') {
            console.log(`[generateMarkdown]   - content.body.type:`, item.content.body.type);
            console.log(`[generateMarkdown]   - content.body.content length:`, item.content.body.content?.length || 0);
          }
        }
        
        // Titre de l'item avec son type
        const itemTypeLabel = getItemTypeLabel(item.type);
        parts.push(`### ${item.title}${itemTypeLabel ? ` (${itemTypeLabel})` : ''}\n\n`);
        
        // Contenu selon le type d'item
        if (item.asset_path && supabaseClient) {
          const { data } = supabaseClient.storage
            .from('course-assets')
            .getPublicUrl(item.asset_path);
          
          if (item.asset_path.endsWith('.pdf')) {
            parts.push(`**Fichier PDF:** ${item.title}\n\n`);
            parts.push(`*Note: Le contenu PDF ne peut pas être affiché dans cette extraction.*\n\n`);
          } else if (data?.publicUrl) {
            parts.push(`![${item.title}](${data.publicUrl})\n\n`);
          } else {
            parts.push(`*Fichier: ${item.asset_path}*\n\n`);
          }
        }
        
        // Contenu body (pour resource, slide, etc.)
        if (item.content?.body) {
          try {
            console.log(`[generateMarkdown] Conversion du contenu body pour "${item.title}"`);
            const markdownContent = tipTapToMarkdown(item.content.body, 100000);
            if (markdownContent && markdownContent.trim()) {
              parts.push(`${markdownContent}\n\n`);
              console.log(`[generateMarkdown] Contenu body converti: ${markdownContent.length} caractères`);
            } else {
              console.warn(`[generateMarkdown] Contenu body vide ou invalide pour "${item.title}"`);
            }
          } catch (error) {
            console.warn(`[Markdown] Erreur lors de la conversion TipTap pour item "${item.title}":`, error);
          }
        } else {
          console.log(`[generateMarkdown] Pas de contenu body pour "${item.title}"`);
        }
        
        // Chapitres (contenu supplémentaire organisé)
        if (item.chapters && Array.isArray(item.chapters) && item.chapters.length > 0) {
          console.log(`[generateMarkdown] ${item.chapters.length} chapitres trouvés pour "${item.title}"`);
          item.chapters
            .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
            .forEach((chapter: any) => {
              parts.push(`#### ${chapter.title}\n\n`);
              if (chapter.content) {
                try {
                  const chapterMarkdown = tipTapToMarkdown(chapter.content, 100000);
                  if (chapterMarkdown && chapterMarkdown.trim()) {
                    parts.push(`${chapterMarkdown}\n\n`);
                  }
                } catch (error) {
                  console.warn(`[Markdown] Erreur lors de la conversion du chapitre "${chapter.title}":`, error);
                }
              }
            });
        }
        
        // Question (pour exercise, quiz)
        if (item.content?.question) {
          parts.push(`**Question:**\n\n`);
          try {
            const questionMarkdown = tipTapToMarkdown(item.content.question, 50000);
            if (questionMarkdown) {
              parts.push(`${questionMarkdown}\n\n`);
            }
          } catch (error) {
            console.warn(`[Markdown] Erreur lors de la conversion de la question pour item "${item.title}":`, error);
          }
        }
        
        // Correction (pour exercise)
        if (item.content?.correction) {
          parts.push(`**Correction:**\n\n`);
          try {
            const correctionMarkdown = tipTapToMarkdown(item.content.correction, 50000);
            if (correctionMarkdown) {
              parts.push(`${correctionMarkdown}\n\n`);
            }
          } catch (error) {
            console.warn(`[Markdown] Erreur lors de la conversion de la correction pour item "${item.title}":`, error);
          }
        }
        
        // Instructions (pour TP)
        if (item.content?.instructions) {
          parts.push(`**Instructions:**\n\n`);
          try {
            const instructionsMarkdown = tipTapToMarkdown(item.content.instructions, 50000);
            if (instructionsMarkdown) {
              parts.push(`${instructionsMarkdown}\n\n`);
            }
          } catch (error) {
            console.warn(`[Markdown] Erreur lors de la conversion des instructions pour item "${item.title}":`, error);
          }
        }
        
        // Checklist (pour TP)
        if (item.content?.checklist && Array.isArray(item.content.checklist)) {
          parts.push(`**Checklist:**\n\n`);
          item.content.checklist.forEach((task: string) => {
            parts.push(`- [ ] ${task}\n`);
          });
          parts.push(`\n`);
        }
        
        // Description
        if (item.content?.description) {
          parts.push(`${item.content.description}\n\n`);
        }
        
        // Contexte pédagogique (pour slides)
        if (item.content?.pedagogical_context) {
          parts.push(`#### Contexte pédagogique\n\n`);
          try {
            const contextMarkdown = pedagogicalContextToMarkdown(item.content.pedagogical_context, 50000);
            if (contextMarkdown) {
              parts.push(`${contextMarkdown}\n\n`);
            } else {
              parts.push(`*Aucun contexte pédagogique disponible.*\n\n`);
            }
          } catch (error) {
            console.warn(`[Markdown] Erreur lors de la conversion du contexte pédagogique pour item "${item.title}":`, error);
          }
        }
        
        parts.push(`---\n\n`);
      });
    } else {
      parts.push(`*Ce module ne contient aucun élément publié.*\n\n`);
      parts.push(`---\n\n`);
    }
  });
  
  // Ajouter le glossaire si disponible
  console.log(`[generateMarkdown] Vérification du glossaire:`, glossary ? 'présent' : 'absent');
  if (glossary) {
    console.log(`[generateMarkdown] Ajout du glossaire avec ${glossary.terms?.length || 0} termes`);
    parts.push(`# Glossaire\n\n`);
    
    // Le glossaire est au format JSONB avec metadata, categories, terms
    const metadata = glossary.metadata || {};
    if (metadata.title) {
      parts.push(`## ${metadata.title}\n\n`);
    }
    
    if (metadata.description) {
      parts.push(`${metadata.description}\n\n`);
    }
    
    // Organiser les termes par catégorie
    const categories = (glossary.categories || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    const terms = (glossary.terms || []).sort((a: any, b: any) => (a.position || 0) - (b.position || 0));
    
    if (categories.length > 0) {
      categories.forEach((category: any) => {
        const categoryTerms = terms.filter((t: any) => t.categoryId === category.id || t.category_id === category.id);
        if (categoryTerms.length > 0) {
          parts.push(`### ${category.name || category.title}\n\n`);
          if (category.description) {
            parts.push(`${category.description}\n\n`);
          }
          categoryTerms.forEach((term: any) => {
            const termWord = term.word || term.term;
            parts.push(`#### ${termWord}\n\n`);
            if (term.explanation || term.definition) {
              parts.push(`${term.explanation || term.definition}\n\n`);
            }
            if (term.examples && Array.isArray(term.examples) && term.examples.length > 0) {
              parts.push(`**Exemples:**\n\n`);
              term.examples.forEach((example: string) => {
                parts.push(`- ${example}\n`);
              });
              parts.push(`\n`);
            }
            if (term.tags && Array.isArray(term.tags) && term.tags.length > 0) {
              parts.push(`**Tags:** ${term.tags.join(', ')}\n\n`);
            }
          });
        }
      });
      
      // Termes sans catégorie
      const uncategorizedTerms = terms.filter((t: any) => !t.categoryId && !t.category_id);
      if (uncategorizedTerms.length > 0) {
        parts.push(`### Sans catégorie\n\n`);
        uncategorizedTerms.forEach((term: any) => {
          const termWord = term.word || term.term;
          parts.push(`#### ${termWord}\n\n`);
          if (term.explanation || term.definition) {
            parts.push(`${term.explanation || term.definition}\n\n`);
          }
          if (term.examples && Array.isArray(term.examples) && term.examples.length > 0) {
            parts.push(`**Exemples:**\n\n`);
            term.examples.forEach((example: string) => {
              parts.push(`- ${example}\n`);
            });
            parts.push(`\n`);
          }
          if (term.tags && Array.isArray(term.tags) && term.tags.length > 0) {
            parts.push(`**Tags:** ${term.tags.join(', ')}\n\n`);
          }
        });
      }
    } else {
      // Pas de catégories, afficher tous les termes
      terms.forEach((term: any) => {
        const termWord = term.word || term.term;
        parts.push(`### ${termWord}\n\n`);
        if (term.explanation || term.definition) {
          parts.push(`${term.explanation || term.definition}\n\n`);
        }
        if (term.examples && Array.isArray(term.examples) && term.examples.length > 0) {
          parts.push(`**Exemples:**\n\n`);
          term.examples.forEach((example: string) => {
            parts.push(`- ${example}\n`);
          });
          parts.push(`\n`);
        }
        if (term.tags && Array.isArray(term.tags) && term.tags.length > 0) {
          parts.push(`**Tags:** ${term.tags.join(', ')}\n\n`);
        }
      });
    }
  }
  
  return parts.join('');
}

/**
 * Retourne le label pour un type d'item
 */
function getItemTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    'resource': 'Ressource',
    'slide': 'Support',
    'exercise': 'Exercice',
    'tp': 'Travaux Pratiques',
    'game': 'Jeu',
    'quiz': 'Quiz',
    'activity': 'Activité'
  };
  return labels[type] || '';
}

export default router;

