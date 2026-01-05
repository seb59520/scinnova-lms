import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import { TrainerHeader } from '../../components/trainer/TrainerHeader';
import { CourseJson } from '../../types/courseJson';
import { Course, Module, Item } from '../../types/database';
import { ReactRenderer } from '../../components/ReactRenderer';
import { ResizableSidebar } from '../../components/ResizableSidebar';

type CourseItem = CourseJson['modules'][number]['items'][number];
import { 
  BookOpen, 
  Clock, 
  Target, 
  MessageSquare, 
  Lightbulb, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Download,
  Printer,
  Eye,
  ArrowLeft,
  Layout,
  X,
  Edit2,
  Save,
  Plus,
  Trash2,
  Check,
  Upload,
  FileText as FileTextIcon,
  CheckCircle2,
  Circle
} from 'lucide-react';

interface ScriptSection {
  title: string;
  type: 'introduction' | 'content' | 'exercise' | 'transition' | 'summary';
  content: string;
  keyPoints: string[];
  arguments: string[];
  sources: string[];
  questions: string[];
  examples: string[];
  estimatedTime: number; // en minutes
  order: number;
  itemId?: string; // ID de l'item associé (pour les slides, exercices, etc.)
}

export function TrainerCourseScript() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [courseJson, setCourseJson] = useState<CourseJson | null>(null);
  const [scriptSections, setScriptSections] = useState<ScriptSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [totalTime, setTotalTime] = useState(0);
  const [splitView, setSplitView] = useState(searchParams.get('split') === 'true');
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editedSections, setEditedSections] = useState<Map<number, ScriptSection>>(new Map());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [readSections, setReadSections] = useState<Set<number>>(new Set());
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  useEffect(() => {
    if (courseId && user) {
      fetchCourse();
    }
  }, [courseId, user]);

  // Migrer les scripts de localStorage vers Supabase
  const migrateScriptsToSupabase = async () => {
    if (!courseId || !user || scriptSections.length === 0) return;
    
    try {
      // Vérifier si des scripts existent dans localStorage
      const storageKey = `trainer-script-${courseId}-${user.id}`;
      const saved = localStorage.getItem(storageKey);
      
      if (!saved) {
        console.log('📦 No scripts found in localStorage to migrate');
        return;
      }

      const parsed: ScriptSection[] = JSON.parse(saved);
      console.log('📦 Found scripts in localStorage:', parsed.length, 'sections');
      
      // Vérifier si des scripts existent déjà dans Supabase
      const { data: existingScripts, error: checkError } = await supabase
        .from('trainer_scripts')
        .select('id')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .limit(1);

      if (checkError) {
        console.error('❌ Error checking existing scripts:', checkError);
        return;
      }

      if (existingScripts && existingScripts.length > 0) {
        console.log('✅ Scripts already exist in Supabase, skipping migration');
        return;
      }

      // Migrer les scripts vers Supabase
      const scriptsToInsert = parsed.map(section => ({
        course_id: courseId,
        item_id: section.itemId || null,
        user_id: user.id,
        section_title: section.title,
        section_type: section.type,
        content: section.content || null,
        key_points: section.keyPoints || [],
        arguments: section.arguments || [],
        sources: section.sources || [],
        questions: section.questions || [],
        examples: section.examples || [],
        estimated_time: section.estimatedTime || 0,
        section_order: section.order
      }));

      console.log('📦 Migrating scripts to Supabase:', {
        count: scriptsToInsert.length,
        withItemId: scriptsToInsert.filter(s => s.item_id).length,
        withoutItemId: scriptsToInsert.filter(s => !s.item_id).length
      });

      const { error: insertError } = await supabase
        .from('trainer_scripts')
        .insert(scriptsToInsert);

      if (insertError) {
        console.error('❌ Error migrating scripts:', insertError);
        alert('Erreur lors de la migration vers Supabase. Les scripts restent dans localStorage.');
      } else {
        console.log('✅ Scripts migrated successfully to Supabase!');
        alert(`✅ Migration réussie ! ${scriptsToInsert.length} sections migrées vers Supabase.`);
        // Recharger les scripts depuis Supabase
        await loadSavedScript();
      }
    } catch (error) {
      console.error('❌ Error during migration:', error);
      alert('Erreur lors de la migration vers Supabase.');
    }
  };

  // Charger le script sauvegardé depuis Supabase
  const loadSavedScript = async () => {
    if (!courseId || !user || scriptSections.length === 0) return;
    
    try {
      // Charger depuis Supabase
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('trainer_scripts')
        .select('*')
        .eq('course_id', courseId)
        .eq('user_id', user.id)
        .order('section_order', { ascending: true });

      if (scriptsError) {
        console.error('Error loading scripts from Supabase:', scriptsError);
        // Fallback sur localStorage si Supabase échoue
        loadFromLocalStorage();
        return;
      }

      if (scriptsData && scriptsData.length > 0) {
        const savedMap = new Map<number, ScriptSection>();
        scriptsData.forEach((dbSection: any) => {
          const section: ScriptSection = {
            title: dbSection.section_title,
            type: dbSection.section_type,
            content: dbSection.content || '',
            keyPoints: Array.isArray(dbSection.key_points) ? dbSection.key_points : [],
            arguments: Array.isArray(dbSection.arguments) ? dbSection.arguments : [],
            sources: Array.isArray(dbSection.sources) ? dbSection.sources : [],
            questions: Array.isArray(dbSection.questions) ? dbSection.questions : [],
            examples: Array.isArray(dbSection.examples) ? dbSection.examples : [],
            estimatedTime: dbSection.estimated_time || 0,
            order: dbSection.section_order,
            itemId: dbSection.item_id || undefined
          };
          
          // Trouver l'index correspondant dans scriptSections
          const index = scriptSections.findIndex(s => s.order === section.order);
          if (index >= 0 && index < scriptSections.length) {
            savedMap.set(index, section);
          }
        });
        setEditedSections(savedMap);
        console.log('✅ Script loaded from Supabase:', scriptsData.length, 'sections');
      } else {
        // Si rien dans Supabase, charger depuis localStorage et proposer la migration
        console.log('⚠️ No scripts in Supabase, loading from localStorage...');
        loadFromLocalStorage();
        
        // Proposer automatiquement la migration si des scripts existent dans localStorage
        const storageKey = `trainer-script-${courseId}-${user.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          console.log('💡 Scripts found in localStorage, you can migrate them to Supabase');
          // Ne pas migrer automatiquement, laisser l'utilisateur décider
        }
      }
    } catch (error) {
      console.error('Error loading script:', error);
      loadFromLocalStorage();
    }
    
    // Charger les sections marquées comme lues depuis localStorage (pour l'instant)
    const readKey = `trainer-script-read-${courseId}-${user.id}`;
    const readSaved = localStorage.getItem(readKey);
    if (readSaved) {
      try {
        const readArray = JSON.parse(readSaved);
        setReadSections(new Set(readArray));
      } catch (error) {
        console.error('Error loading read sections:', error);
      }
    }
  };

  // Fallback : charger depuis localStorage
  const loadFromLocalStorage = () => {
    if (!courseId || !user) return;
    const storageKey = `trainer-script-${courseId}-${user.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const savedMap = new Map<number, ScriptSection>();
        parsed.forEach((section: ScriptSection, index: number) => {
          if (index < scriptSections.length) {
            savedMap.set(index, section);
          }
        });
        setEditedSections(savedMap);
        console.log('✅ Script loaded from localStorage (fallback)');
      } catch (error) {
        console.error('Error loading saved script:', error);
      }
    }
  };

  // Sauvegarder le script dans Supabase
  const saveScript = async () => {
    if (!courseId || !user) return;
    
    try {
      const sectionsToSave = scriptSections.map((section, index) => 
        editedSections.get(index) || section
      );

      // Supprimer les anciens scripts pour ce cours et cet utilisateur
      const { error: deleteError } = await supabase
        .from('trainer_scripts')
        .delete()
        .eq('course_id', courseId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting old scripts:', deleteError);
      }

      // Insérer les nouvelles sections
      const scriptsToInsert = sectionsToSave.map(section => ({
        course_id: courseId,
        item_id: section.itemId || null,
        user_id: user.id,
        section_title: section.title,
        section_type: section.type,
        content: section.content || null,
        key_points: section.keyPoints || [],
        arguments: section.arguments || [],
        sources: section.sources || [],
        questions: section.questions || [],
        examples: section.examples || [],
        estimated_time: section.estimatedTime || 0,
        section_order: section.order
      }));

      console.log('💾 Saving scripts to Supabase:', {
        count: scriptsToInsert.length,
        withItemId: scriptsToInsert.filter(s => s.item_id).length,
        withoutItemId: scriptsToInsert.filter(s => !s.item_id).length,
        sample: scriptsToInsert.slice(0, 3).map(s => ({
          title: s.section_title,
          item_id: s.item_id
        }))
      });

      const { error: insertError } = await supabase
        .from('trainer_scripts')
        .insert(scriptsToInsert);

      if (insertError) {
        console.error('Error saving scripts to Supabase:', insertError);
        // Fallback sur localStorage
        const storageKey = `trainer-script-${courseId}-${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(sectionsToSave));
        alert('Script sauvegardé dans localStorage (Supabase non disponible)');
      } else {
        // Sauvegarder aussi dans localStorage comme backup
        const storageKey = `trainer-script-${courseId}-${user.id}`;
        localStorage.setItem(storageKey, JSON.stringify(sectionsToSave));
        alert('Script sauvegardé avec succès dans Supabase !');
      }
      
      // Sauvegarder aussi les sections lues
      const readKey = `trainer-script-read-${courseId}-${user.id}`;
      localStorage.setItem(readKey, JSON.stringify(Array.from(readSections)));
      
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Error saving script:', error);
      // Fallback sur localStorage
      const storageKey = `trainer-script-${courseId}-${user.id}`;
      const sectionsToSave = scriptSections.map((section, index) => 
        editedSections.get(index) || section
      );
      localStorage.setItem(storageKey, JSON.stringify(sectionsToSave));
      alert('Erreur lors de la sauvegarde. Script sauvegardé dans localStorage.');
    }
  };

  // Marquer/démarquer une section comme lue
  const toggleReadSection = (index: number) => {
    const newReadSections = new Set(readSections);
    if (newReadSections.has(index)) {
      newReadSections.delete(index);
    } else {
      newReadSections.add(index);
    }
    setReadSections(newReadSections);
    
    // Sauvegarder immédiatement
    if (courseId && user) {
      const readKey = `trainer-script-read-${courseId}-${user.id}`;
      localStorage.setItem(readKey, JSON.stringify(Array.from(newReadSections)));
    }
  };

  // Obtenir la section (éditée ou originale)
  const getSection = (index: number): ScriptSection => {
    return editedSections.get(index) || scriptSections[index];
  };

  // Mettre à jour une section
  const updateSection = (index: number, updates: Partial<ScriptSection>) => {
    const currentSection = getSection(index);
    const updatedSection = { ...currentSection, ...updates };
    setEditedSections(new Map(editedSections.set(index, updatedSection)));
    setHasUnsavedChanges(true);
  };

  // Ajouter un élément à une liste
  const addListItem = (index: number, listType: 'keyPoints' | 'arguments' | 'sources' | 'questions' | 'examples', value: string = '') => {
    const section = getSection(index);
    const currentList = section[listType] || [];
    updateSection(index, {
      [listType]: [...currentList, value]
    });
  };

  // Supprimer un élément d'une liste
  const removeListItem = (index: number, listType: 'keyPoints' | 'arguments' | 'sources' | 'questions' | 'examples', itemIndex: number) => {
    const section = getSection(index);
    const currentList = section[listType] || [];
    updateSection(index, {
      [listType]: currentList.filter((_, i) => i !== itemIndex)
    });
  };

  // Mettre à jour un élément de liste
  const updateListItem = (index: number, listType: 'keyPoints' | 'arguments' | 'sources' | 'questions' | 'examples', itemIndex: number, value: string) => {
    const section = getSection(index);
    const currentList = [...(section[listType] || [])];
    currentList[itemIndex] = value;
    updateSection(index, {
      [listType]: currentList
    });
  };

  // Parser les notes au format fourni
  const parseNotes = (text: string): Map<number, Partial<ScriptSection>> => {
    const updates = new Map<number, Partial<ScriptSection>>();
    const lines = text.split('\n');
    
    let currentSectionIndex: number | null = null;
    let currentSection: Partial<ScriptSection> = {};
    let currentContent = '';
    let currentType: 'content' | 'example' | 'question' | 'transition' | null = null;

    // Fonction pour finaliser la section courante
    const finalizeCurrentSection = () => {
      if (currentSectionIndex !== null && Object.keys(currentSection).length > 0) {
        const existing = updates.get(currentSectionIndex) || {};
        updates.set(currentSectionIndex, { ...existing, ...currentSection });
      }
      currentSection = {};
      currentContent = '';
    };

    // Chercher les sections correspondantes par titre
    const findSectionByTitle = (title: string): number | null => {
      const normalizedTitle = title.toLowerCase().trim();
      // Extraire les mots-clés importants (ignorer les mots vides)
      const stopWords = ['le', 'la', 'les', 'de', 'des', 'du', 'et', 'ou', 'pour', 'par', 'avec', 'dans', 'sur'];
      const extractKeywords = (text: string) => {
        return text.split(/\s+/)
          .filter(w => w.length > 2 && !stopWords.includes(w))
          .map(w => w.replace(/[^\w]/g, ''));
      };
      
      const titleKeywords = extractKeywords(normalizedTitle);
      
      for (let i = 0; i < scriptSections.length; i++) {
        const section = getSection(i);
        const sectionTitle = section.title.toLowerCase();
        const sectionKeywords = extractKeywords(sectionTitle);
        
        // Correspondance exacte ou partielle
        if (sectionTitle.includes(normalizedTitle) || normalizedTitle.includes(sectionTitle.split(':')[0])) {
          return i;
        }
        
        // Correspondance par mots-clés (au moins 2 mots-clés communs)
        const commonKeywords = titleKeywords.filter(kw => 
          sectionKeywords.some(sk => sk.includes(kw) || kw.includes(sk))
        );
        if (commonKeywords.length >= 2) {
          return i;
        }
        
        // Correspondance partielle sur les premiers mots
        const titleFirstWords = normalizedTitle.split(/\s+/).slice(0, 3).join(' ');
        const sectionFirstWords = sectionTitle.split(/\s+/).slice(0, 3).join(' ');
        if (titleFirstWords.includes(sectionFirstWords) || sectionFirstWords.includes(titleFirstWords)) {
          return i;
        }
      }
      return null;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Détecter un nouveau slide
      if (line.match(/^🟦\s*SLIDE\s*—\s*(.+)/i) || line.match(/^🟩\s*SLIDE\s*—\s*(.+)/i)) {
        finalizeCurrentSection();
        const match = line.match(/^🟦\s*SLIDE\s*—\s*(.+)/i) || line.match(/^🟩\s*SLIDE\s*—\s*(.+)/i);
        if (match) {
          const title = match[1].trim();
          currentSectionIndex = findSectionByTitle(title);
          currentType = null;
          currentContent = '';
        }
        continue;
      }

      // Détecter "Ce que je dis"
      if (line.match(/^🗣️\s*Ce que je dis/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'content') {
          const existing = updates.get(currentSectionIndex) || {};
          existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'content';
        currentContent = '';
        continue;
      }

      // Détecter "Exemple à raconter"
      if (line.match(/^💡\s*Exemple/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'content') {
          const existing = updates.get(currentSectionIndex) || {};
          existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'example';
        currentContent = '';
        continue;
      }

      // Détecter "Question à poser"
      if (line.match(/^❓\s*Question/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'content') {
          const existing = updates.get(currentSectionIndex) || {};
          existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'question';
        currentContent = '';
        continue;
      }

      // Détecter "Transition"
      if (line.match(/^🔁\s*Transition/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'content') {
          const existing = updates.get(currentSectionIndex) || {};
          existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'transition';
        currentContent = '';
        continue;
      }

      // Détecter "Sources à citer"
      if (line.match(/^📚\s*Sources/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'content') {
          const existing = updates.get(currentSectionIndex) || {};
          existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'sources';
        currentContent = '';
        continue;
      }

      // Détecter "Comment tu les cites à l'oral" ou "Phrase prête à dire"
      if (line.match(/^🎙️\s*(Comment|Phrase)/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'sources') {
          const existing = updates.get(currentSectionIndex) || {};
          const sources = existing.sources || [];
          // Ajouter les sources accumulées
          if (currentContent.trim()) {
            sources.push(...currentContent.trim().split('\n').filter(l => l.trim()));
          }
          existing.sources = sources;
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'citation';
        currentContent = '';
        continue;
      }

      // Détecter "Pourquoi cette source" ou "Usage pédagogique"
      if (line.match(/^💡\s*(Pourquoi|Usage)/i)) {
        if (currentContent && currentSectionIndex !== null && currentType === 'citation') {
          const existing = updates.get(currentSectionIndex) || {};
          // Ajouter la phrase de citation comme argument
          if (currentContent.trim()) {
            const arguments_ = existing.arguments || [];
            arguments_.push(currentContent.trim());
            existing.arguments = arguments_;
          }
          updates.set(currentSectionIndex, existing);
        }
        currentType = 'usage';
        currentContent = '';
        continue;
      }

      // Détecter les séparateurs
      if (line.match(/^⸻/)) {
        finalizeCurrentSection();
        currentSectionIndex = null;
        currentType = null;
        currentContent = '';
        continue;
      }

      // Accumuler le contenu
      if (line && currentSectionIndex !== null) {
        if (currentType === 'content') {
          // N'ajouter que si ce n'est pas une ligne vide ou un séparateur
          if (line && !line.match(/^⸻/)) {
            currentContent += (currentContent ? '\n' : '') + line;
          }
        } else if (currentType === 'example') {
          const existing = updates.get(currentSectionIndex) || {};
          const examples = existing.examples || [];
          if (line && !line.match(/^⸻/)) {
            if (line.startsWith('•') || line.startsWith('-')) {
              const cleanLine = line.replace(/^[•-]\s*/, '').trim();
              if (cleanLine) examples.push(cleanLine);
            } else if (line.trim()) {
              examples.push(line.trim());
            }
          }
          existing.examples = examples;
          updates.set(currentSectionIndex, existing);
        } else if (currentType === 'question') {
          const existing = updates.get(currentSectionIndex) || {};
          const questions = existing.questions || [];
          if (line && !line.match(/^⸻/)) {
            if (line.startsWith('•') || line.startsWith('-')) {
              const cleanLine = line.replace(/^[•-]\s*/, '').trim();
              if (cleanLine) questions.push(cleanLine);
            } else if (line.trim()) {
              questions.push(line.trim());
            }
          }
          existing.questions = questions;
          updates.set(currentSectionIndex, existing);
        } else if (currentType === 'transition') {
          const existing = updates.get(currentSectionIndex) || {};
          if (line && !line.match(/^⸻/)) {
            existing.content = (existing.content || '') + (existing.content ? '\n' : '') + line;
            updates.set(currentSectionIndex, existing);
          }
        } else if (currentType === 'sources') {
          // Accumuler les sources
          if (line && !line.match(/^⸻/)) {
            const trimmed = line.trim();
            if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
              const cleanLine = trimmed.replace(/^[•-]\s*/, '').trim();
              if (cleanLine) {
                // Si la ligne précédente se terminait par une URL, l'ajouter à cette source
                if (currentContent && currentContent.match(/https?:\/\/[^\s]+$/)) {
                  currentContent += '\n' + cleanLine;
                } else {
                  currentContent += (currentContent ? '\n' : '') + cleanLine;
                }
              }
            } else if (trimmed.match(/^https?:\/\//)) {
              // URL : l'ajouter à la dernière ligne de source
              if (currentContent) {
                const lines = currentContent.split('\n');
                const lastLine = lines[lines.length - 1];
                if (lastLine && !lastLine.match(/https?:\/\//)) {
                  lines[lines.length - 1] = lastLine + ' - ' + trimmed;
                } else {
                  lines.push(trimmed);
                }
                currentContent = lines.join('\n');
              } else {
                currentContent = trimmed;
              }
            } else if (trimmed && !trimmed.match(/^📚|^🎙️|^💡/)) {
              // Ligne de texte normale (nom de source)
              currentContent += (currentContent ? '\n' : '') + trimmed;
            }
          }
        } else if (currentType === 'citation') {
          // Phrase prête à dire pour citer les sources
          if (line && !line.match(/^⸻/)) {
            currentContent += (currentContent ? ' ' : '') + line.trim();
          }
        } else if (currentType === 'usage') {
          // Usage pédagogique - ajouter comme argument
          const existing = updates.get(currentSectionIndex) || {};
          if (line && !line.match(/^⸻/)) {
            if (line.startsWith('•') || line.startsWith('-')) {
              const cleanLine = line.replace(/^[•-]\s*/, '').trim();
              if (cleanLine) {
                const arguments_ = existing.arguments || [];
                arguments_.push(cleanLine);
                existing.arguments = arguments_;
                updates.set(currentSectionIndex, existing);
              }
            } else if (line.trim()) {
              const arguments_ = existing.arguments || [];
              arguments_.push(line.trim());
              existing.arguments = arguments_;
              updates.set(currentSectionIndex, existing);
            }
          }
        }
      }
    }

    // Finaliser la dernière section
    if (currentSectionIndex !== null) {
      const existing = updates.get(currentSectionIndex) || {};
      
      if (currentType === 'content' && currentContent) {
        existing.content = (existing.content || '') + (existing.content ? '\n\n' : '') + currentContent.trim();
      } else if (currentType === 'sources' && currentContent) {
        // Finaliser les sources - une source par ligne
        const sources = existing.sources || [];
        const sourceLines = currentContent.trim().split('\n').filter(l => l.trim());
        // Nettoyer et formater les sources
        sourceLines.forEach(line => {
          const cleaned = line.trim();
          if (cleaned && !cleaned.match(/^📚|^🎙️|^💡/)) {
            sources.push(cleaned);
          }
        });
        existing.sources = sources;
      } else if (currentType === 'citation' && currentContent) {
        // Ajouter la phrase de citation comme argument
        const arguments_ = existing.arguments || [];
        arguments_.push(`Citation: ${currentContent.trim()}`);
        existing.arguments = arguments_;
      }
      
      if (Object.keys(existing).length > 0) {
        updates.set(currentSectionIndex, existing);
      }
    }
    finalizeCurrentSection();

    // Appliquer les mises à jour
    const finalUpdates = new Map<number, ScriptSection>();
    updates.forEach((partial, index) => {
      const current = getSection(index);
      finalUpdates.set(index, {
        ...current,
        ...partial,
        content: partial.content || current.content,
        examples: partial.examples || current.examples,
        questions: partial.questions || current.questions
      });
    });

    return finalUpdates;
  };

  // Importer les notes
  const handleImport = () => {
    if (!importText.trim()) {
      alert('Veuillez coller vos notes');
      return;
    }

    try {
      const parsed = parseNotes(importText);
      if (parsed.size === 0) {
        alert('Aucune section correspondante trouvée. Vérifiez que les titres des slides correspondent aux sections du script.');
        return;
      }

      // Compter ce qui a été importé
      let sourcesCount = 0;
      let examplesCount = 0;
      let questionsCount = 0;
      let argumentsCount = 0;
      
      parsed.forEach((section) => {
        if (section.sources && section.sources.length > 0) sourcesCount += section.sources.length;
        if (section.examples && section.examples.length > 0) examplesCount += section.examples.length;
        if (section.questions && section.questions.length > 0) questionsCount += section.questions.length;
        if (section.arguments && section.arguments.length > 0) argumentsCount += section.arguments.length;
      });

      // Fusionner avec les sections existantes
      parsed.forEach((updatedSection, index) => {
        updateSection(index, updatedSection);
      });

      setShowImportModal(false);
      setImportText('');
      
      const details = [];
      if (sourcesCount > 0) details.push(`${sourcesCount} source(s)`);
      if (examplesCount > 0) details.push(`${examplesCount} exemple(s)`);
      if (questionsCount > 0) details.push(`${questionsCount} question(s)`);
      if (argumentsCount > 0) details.push(`${argumentsCount} argument(s)`);
      
      const message = `${parsed.size} section(s) mise(s) à jour avec succès !\n` +
        (details.length > 0 ? `\nImporté : ${details.join(', ')}` : '');
      alert(message);
    } catch (error) {
      console.error('Error importing notes:', error);
      alert('Erreur lors de l\'import. Vérifiez le format de vos notes.');
    }
  };

  const fetchCourse = async () => {
    try {
      setError('');
      setLoading(true);

      // Récupérer le cours
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Récupérer les modules
      const { data: modulesData, error: modulesError } = await supabase
        .from('modules')
        .select('*')
        .eq('course_id', courseId)
        .order('position', { ascending: true });

      if (modulesError) throw modulesError;

      // Récupérer les items
      const moduleIds = modulesData?.map(m => m.id) || [];
      const { data: itemsData, error: itemsError } = await supabase
        .from('items')
        .select('*')
        .in('module_id', moduleIds)
        .order('position', { ascending: true });

      if (itemsError) throw itemsError;

      // Récupérer les chapitres
      const itemIds = itemsData?.map(i => i.id) || [];
      const { data: chaptersData } = await supabase
        .from('chapters')
        .select('*')
        .in('item_id', itemIds)
        .order('position', { ascending: true });

      // Construire le CourseJson
      const modulesWithItems = (modulesData || []).map(module => ({
        ...module,
        items: (itemsData || []).filter(item => item.module_id === module.id)
      }));

      const chaptersMap = new Map<string, any[]>();
      (chaptersData || []).forEach(ch => {
        if (!chaptersMap.has(ch.item_id)) {
          chaptersMap.set(ch.item_id, []);
        }
        chaptersMap.get(ch.item_id)!.push({
          title: ch.title,
          position: ch.position,
          content: ch.content,
          type: ch.type,
          game_content: ch.game_content,
          published: ch.published
        });
      });

      const courseJsonData: CourseJson = {
        title: courseData.title,
        description: courseData.description || '',
        status: courseData.status as 'draft' | 'published',
        access_type: courseData.access_type as 'free' | 'paid' | 'invite',
        price_cents: courseData.price_cents || undefined,
        currency: courseData.currency || undefined,
        modules: modulesWithItems.map(module => ({
          title: module.title,
          position: module.position,
          items: module.items.map(item => ({
            id: item.id,
            type: item.type as 'resource' | 'slide' | 'exercise' | 'tp' | 'game',
            title: item.title,
            position: item.position,
            published: item.published,
            content: item.content || {},
            asset_path: item.asset_path || undefined,
            external_url: item.external_url || undefined,
            chapters: chaptersMap.get(item.id) || undefined
          }))
        }))
      };

      setCourseJson(courseJsonData);
      generateScript(courseJsonData);
    } catch (error: any) {
      console.error('Error fetching course:', error);
      setError('Erreur lors du chargement du cours.');
    } finally {
      setLoading(false);
    }
  };

  const generateScript = (courseJson: CourseJson) => {
    const sections: ScriptSection[] = [];
    let order = 0;
    let totalMinutes = 0;

    // Introduction générale du cours
    sections.push({
      title: `Introduction - ${courseJson.title}`,
      type: 'introduction',
      content: courseJson.description || `Bienvenue dans le cours "${courseJson.title}". Ce cours a été conçu pour vous permettre d'acquérir des compétences essentielles dans ce domaine. Nous allons explorer les concepts fondamentaux, les techniques pratiques, et les applications concrètes qui vous seront utiles dans votre contexte professionnel.`,
      keyPoints: extractKeyPoints(courseJson.description || '').length > 0 
        ? extractKeyPoints(courseJson.description || '')
        : [
          'Comprendre les objectifs pédagogiques du cours',
          'Identifier les compétences à acquérir',
          'Connaître la structure et l\'organisation du parcours',
          'Définir les attentes et les prérequis'
        ],
      arguments: [
        'Une introduction claire permet de poser le cadre et de motiver les apprenants',
        'La définition des objectifs facilite l\'engagement et la compréhension des enjeux',
        'La présentation de la structure aide à se repérer dans le parcours'
      ],
      sources: [],
      questions: [
        'Quelles sont vos attentes pour ce cours ?',
        'Avez-vous déjà des connaissances sur ce sujet ? Si oui, lesquelles ?',
        'Quels sont les défis que vous souhaitez relever grâce à ce cours ?',
        'Comment envisagez-vous d\'appliquer les connaissances acquises ?'
      ],
      examples: [],
      estimatedTime: 10,
      order: order++
    });
    totalMinutes += 10;

    // Parcourir chaque module
    courseJson.modules.forEach((module, moduleIndex) => {
      // Introduction du module
      sections.push({
        title: `Module ${moduleIndex + 1}: ${module.title}`,
        type: 'introduction',
        content: `Nous allons maintenant aborder le module "${module.title}". Ce module est essentiel car il constitue une étape fondamentale dans votre apprentissage. Il va vous permettre de développer des compétences pratiques et théoriques qui seront directement applicables dans votre contexte professionnel.`,
        keyPoints: [
          `Comprendre les concepts clés et les fondements théoriques de ${module.title}`,
          `Maîtriser les techniques, méthodes et outils associés`,
          `Appliquer les connaissances acquises dans des situations concrètes`,
          `Identifier les bonnes pratiques et éviter les erreurs courantes`
        ],
        arguments: [
          `Ce module s'appuie sur les connaissances acquises précédemment et prépare les modules suivants`,
          `Les concepts abordés sont directement applicables dans un contexte professionnel`,
          `La maîtrise de ce module est essentielle pour la suite du parcours`
        ],
        sources: [],
        questions: [
          `Que savez-vous déjà sur ${module.title} ?`,
          `Quels sont les défis que vous rencontrez ou anticipez dans ce domaine ?`,
          `Quelles sont vos attentes pour ce module ?`,
          `Avez-vous déjà eu l'occasion d'appliquer ces concepts ?`
        ],
        examples: [],
        estimatedTime: 5,
        order: order++
      });
      totalMinutes += 5;

      // Parcourir chaque item du module
      module.items.forEach((item, itemIndex) => {
        const itemContent = extractItemContent(item);
        
        // Section principale pour l'item
        sections.push({
          title: `${item.title}`,
          type: item.type === 'exercise' || item.type === 'tp' ? 'exercise' : 'content',
          content: itemContent.mainContent,
          keyPoints: itemContent.keyPoints,
          arguments: itemContent.arguments,
          sources: itemContent.sources,
          questions: itemContent.questions,
          examples: itemContent.examples,
          estimatedTime: estimateTimeForItem(item),
          order: order++,
          itemId: item.id // Associer l'ID de l'item pour permettre la recherche directe
        });
        totalMinutes += estimateTimeForItem(item);

        // Traiter les chapitres si présents
        if (item.chapters && item.chapters.length > 0) {
          item.chapters.forEach((chapter, chapterIndex) => {
            const chapterContent = extractChapterContent(chapter);
            sections.push({
              title: `${item.title} - ${chapter.title}`,
              type: 'content',
              content: chapterContent.mainContent,
              keyPoints: chapterContent.keyPoints,
              arguments: chapterContent.arguments,
              sources: chapterContent.sources,
              questions: chapterContent.questions,
              examples: chapterContent.examples,
              estimatedTime: 5, // Estimation par défaut pour un chapitre
              order: order++
            });
            totalMinutes += 5;
          });
        }

        // Transition entre items (sauf pour le dernier)
        if (itemIndex < module.items.length - 1) {
          sections.push({
            title: `Transition vers ${module.items[itemIndex + 1].title}`,
            type: 'transition',
            content: `Maintenant que nous avons couvert ${item.title}, nous allons passer à ${module.items[itemIndex + 1].title}. Cette transition est logique car les concepts que nous venons d'aborder vont nous permettre de comprendre et d'appliquer les éléments suivants. Il est important de bien assimiler ce que nous venons de voir avant de continuer.`,
            keyPoints: [
              `Faire le lien entre ${item.title} et ${module.items[itemIndex + 1].title}`,
              `S'assurer que les concepts précédents sont bien compris`,
              `Préparer l'introduction des nouveaux concepts`
            ],
            arguments: [
              `La progression pédagogique est construite de manière séquentielle`,
              `Chaque élément s'appuie sur les précédents pour construire une compréhension globale`
            ],
            sources: [],
            questions: [
              'Avez-vous des questions sur ce que nous venons de voir ?',
              'Y a-t-il des points qui nécessitent des précisions avant de continuer ?',
              'Êtes-vous prêts à passer à la suite ?'
            ],
            examples: [],
            estimatedTime: 2,
            order: order++
          });
          totalMinutes += 2;
        }
      });

      // Résumé du module
      sections.push({
        title: `Résumé - ${module.title}`,
        type: 'summary',
        content: `Pour résumer ce module "${module.title}", nous avons couvert les concepts fondamentaux, les techniques pratiques, et les applications concrètes. Il est important de bien intégrer ces éléments car ils constituent la base pour la suite du parcours.`,
        keyPoints: [
          'Synthétiser les points essentiels à retenir',
          'Identifier les applications pratiques dans votre contexte',
          'Comprendre les liens avec les autres modules',
          'Préparer les prochaines étapes d\'apprentissage'
        ],
        arguments: [
          `La synthèse permet de consolider les apprentissages et de créer des liens entre les concepts`,
          `L'identification des applications pratiques facilite le transfert des connaissances`,
          `La compréhension des liens entre modules renforce la cohérence du parcours`
        ],
        sources: [],
        questions: [
          'Quels sont les points qui vous semblent les plus importants dans ce module ?',
          'Avez-vous des questions ou des points à clarifier ?',
          'Comment envisagez-vous d\'appliquer ces connaissances ?',
          'Quels sont les éléments que vous souhaitez approfondir ?'
        ],
        examples: [],
        estimatedTime: 5,
        order: order++
      });
      totalMinutes += 5;
    });

    // Conclusion générale
    sections.push({
      title: 'Conclusion du cours',
      type: 'summary',
      content: `Pour conclure ce cours "${courseJson.title}", nous avons couvert l'ensemble des concepts fondamentaux, des techniques pratiques, et des applications concrètes. Vous disposez maintenant des connaissances et des compétences nécessaires pour appliquer ces éléments dans votre contexte professionnel. Il est important de continuer à pratiquer et à approfondir ces concepts pour les intégrer durablement.`,
      keyPoints: [
        'Synthétiser les concepts principaux abordés dans le cours',
        'Identifier les applications pratiques dans différents contextes',
        'Comprendre les liens entre les différents modules',
        'Connaître les ressources disponibles pour approfondir',
        'Définir un plan d\'action pour l\'application des connaissances'
      ],
      arguments: [
        'La synthèse finale permet de consolider les apprentissages et de créer une vision d\'ensemble',
        'L\'identification des applications pratiques facilite le transfert des connaissances',
        'La connaissance des ressources complémentaires encourage la poursuite de l\'apprentissage',
        'Un plan d\'action concret favorise l\'application immédiate des connaissances'
      ],
      sources: [],
      questions: [
        'Quels sont les points que vous souhaitez approfondir ?',
        'Comment allez-vous appliquer ces connaissances dans votre contexte ?',
        'Quels sont les défis que vous anticipez dans l\'application de ces concepts ?',
        'Quelles ressources complémentaires souhaitez-vous explorer ?',
        'Avez-vous des questions finales ou des points à clarifier ?'
      ],
      examples: [],
      estimatedTime: 10,
      order: order++
    });
    totalMinutes += 10;

    setScriptSections(sections);
    setTotalTime(totalMinutes);
    // Développer toutes les sections par défaut
    setExpandedSections(new Set(sections.map((_, i) => i)));
    
    // Charger le script sauvegardé après génération
    if (courseId && user) {
      setTimeout(() => {
        const storageKey = `trainer-script-${courseId}-${user.id}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const savedMap = new Map<number, ScriptSection>();
            parsed.forEach((section: ScriptSection, index: number) => {
              if (index < sections.length) {
                savedMap.set(index, section);
              }
            });
            setEditedSections(savedMap);
          } catch (error) {
            console.error('Error loading saved script:', error);
          }
        }
      }, 100);
    }
  };

  const extractItemContent = (item: CourseItem) => {
    const content = item.content || {};
    const keyPoints: string[] = [];
    const arguments_: string[] = [];
    const sources: string[] = [];
    const questions: string[] = [];
    const examples: string[] = [];

    // Extraire le contenu du body (TipTap JSON)
    let mainContent = '';
    if (content.body) {
      mainContent = extractTextFromTipTap(content.body);
    } else if (content.description) {
      mainContent = content.description;
    } else if (typeof content === 'string') {
      mainContent = content;
    }

    // Extraire les points clés, arguments, sources, exemples du contenu
    const lines = mainContent.split('\n');
    let currentSection = '';
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      const lowerLine = trimmed.toLowerCase();
      
      // Détecter les sections spéciales
      if (lowerLine.includes('points clés') || lowerLine.includes('points essentiels')) {
        currentSection = 'keyPoints';
      } else if (lowerLine.includes('argument') || lowerLine.includes('raison')) {
        currentSection = 'arguments';
      } else if (lowerLine.includes('source') || lowerLine.includes('référence') || lowerLine.includes('bibliographie')) {
        currentSection = 'sources';
      } else if (lowerLine.includes('exemple') || lowerLine.includes('cas pratique') || lowerLine.includes('illustration')) {
        currentSection = 'examples';
      } else if (lowerLine.includes('question') || lowerLine.includes('interroger')) {
        currentSection = 'questions';
      }
      
      // Extraire selon le contexte
      if (trimmed && !trimmed.startsWith('#')) {
        if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.match(/^\d+\./)) {
          const cleanText = trimmed.replace(/^[-*•]\s+|\d+\.\s+/, '').trim();
          if (currentSection === 'keyPoints' || (!currentSection && cleanText.length > 0)) {
            keyPoints.push(cleanText);
          } else if (currentSection === 'arguments') {
            arguments_.push(cleanText);
          } else if (currentSection === 'examples') {
            examples.push(cleanText);
          } else if (currentSection === 'questions') {
            questions.push(cleanText.replace(/[?？]/g, '').trim());
          }
        } else if (lowerLine.includes('source:') || lowerLine.includes('référence:')) {
          sources.push(trimmed.replace(/^.*(?:source|référence):\s*/i, '').trim());
        } else if (lowerLine.includes('exemple:') || lowerLine.includes('ex:')) {
          examples.push(trimmed.replace(/^.*(?:exemple|ex):\s*/i, '').trim());
        } else if (trimmed.endsWith('?') || trimmed.endsWith('？')) {
          questions.push(trimmed);
        }
      }
    });

    // Si pas de points clés trouvés, extraire les titres de sections
    if (keyPoints.length === 0) {
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#')) {
          keyPoints.push(trimmed.replace(/^#+\s+/, ''));
        }
      });
    }

    // Ajouter des questions par défaut si aucune n'est trouvée
    if (questions.length === 0) {
      questions.push(
        `Qu'est-ce qui vous semble le plus important dans "${item.title}" ?`,
        'Avez-vous des questions sur ce sujet ?',
        'Comment pouvez-vous appliquer ces concepts dans votre contexte ?'
      );
    }

    // Générer des arguments si aucun n'est trouvé mais qu'il y a du contenu
    if (arguments_.length === 0 && mainContent.length > 100) {
      arguments_.push(
        `Expliquer pourquoi ${item.title} est important dans le contexte du cours`,
        `Développer les concepts clés de manière progressive`,
        `Illustrer avec des exemples concrets et des cas pratiques`
      );
    }

    return {
      mainContent: mainContent || `Contenu de "${item.title}". Développer les concepts principaux, expliquer les mécanismes, et illustrer avec des exemples concrets.`,
      keyPoints: keyPoints.length > 0 ? keyPoints : [
        `Comprendre les concepts fondamentaux de ${item.title}`,
        `Maîtriser les applications pratiques`,
        `Identifier les points d'attention et les pièges courants`
      ],
      arguments: arguments_,
      sources: sources.length > 0 ? sources : [],
      questions: questions,
      examples: examples.length > 0 ? examples : []
    };
  };

  const extractChapterContent = (chapter: CourseItem['chapters'][number]) => {
    let mainContent = '';
    if (chapter.content) {
      mainContent = extractTextFromTipTap(chapter.content);
    } else if (chapter.game_content) {
      mainContent = `Contenu de jeu interactif: ${chapter.title}`;
    }

    return {
      mainContent: mainContent || `Contenu du chapitre "${chapter.title}"`,
      keyPoints: [`Points clés de ${chapter.title}`],
      arguments: [],
      sources: [],
      questions: [`Qu'avez-vous retenu de ${chapter.title} ?`],
      examples: []
    };
  };

  const extractTextFromTipTap = (content: any): string => {
    if (typeof content === 'string') return content;
    if (!content || typeof content !== 'object') return '';

    let text = '';
    if (content.content && Array.isArray(content.content)) {
      content.content.forEach((node: any) => {
        if (node.type === 'paragraph' || node.type === 'heading') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                const nodeText = textNode.text || '';
                // Ajouter un préfixe pour les titres
                if (node.type === 'heading') {
                  const level = node.attrs?.level || 1;
                  const prefix = '#'.repeat(level) + ' ';
                  text += prefix + nodeText + '\n';
                } else {
                  text += nodeText + '\n';
                }
              } else if (textNode.type === 'hardBreak') {
                text += '\n';
              }
            });
          }
        } else if (node.type === 'bulletList' || node.type === 'orderedList') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((listItem: any, index: number) => {
              if (listItem.content && Array.isArray(listItem.content)) {
                listItem.content.forEach((paragraph: any) => {
                  if (paragraph.content && Array.isArray(paragraph.content)) {
                    const prefix = node.type === 'orderedList' ? `${index + 1}. ` : '• ';
                    paragraph.content.forEach((textNode: any) => {
                      if (textNode.type === 'text') {
                        text += prefix + textNode.text + '\n';
                      }
                    });
                  }
                });
              }
            });
          }
        } else if (node.type === 'blockquote') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((paragraph: any) => {
              if (paragraph.content && Array.isArray(paragraph.content)) {
                paragraph.content.forEach((textNode: any) => {
                  if (textNode.type === 'text') {
                    text += '> ' + textNode.text + '\n';
                  }
                });
              }
            });
          }
        } else if (node.type === 'codeBlock') {
          if (node.content && Array.isArray(node.content)) {
            node.content.forEach((textNode: any) => {
              if (textNode.type === 'text') {
                text += '```\n' + textNode.text + '\n```\n';
              }
            });
          }
        }
      });
    }
    return text.trim();
  };

  const extractKeyPoints = (text: string): string[] => {
    const points: string[] = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('**') || trimmed.match(/^[-*•]\s+/)) {
        points.push(trimmed.replace(/^[-*•]\s+|\*\*/g, ''));
      }
    });
    return points.length > 0 ? points : ['Points clés à développer'];
  };

  const estimateTimeForItem = (item: CourseItem): number => {
    // Estimation basée sur le type d'item
    switch (item.type) {
      case 'slide':
        return 10; // 10 minutes par slide
      case 'resource':
        return 15; // 15 minutes pour une ressource
      case 'exercise':
        return 20; // 20 minutes pour un exercice
      case 'tp':
        return 45; // 45 minutes pour un TP
      case 'game':
        return 15; // 15 minutes pour un jeu
      default:
        return 10;
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h${mins > 0 ? mins : ''}`;
    }
    return `${mins}min`;
  };

  const printScript = () => {
    window.print();
  };

  const toggleSplitView = () => {
    const newSplitView = !splitView;
    setSplitView(newSplitView);
    if (newSplitView) {
      searchParams.set('split', 'true');
    } else {
      searchParams.delete('split');
    }
    setSearchParams(searchParams);
  };

  // Composant pour rendre une liste éditable
  const EditableList = ({ 
    index, 
    listType, 
    items, 
    label, 
    icon: Icon 
  }: { 
    index: number; 
    listType: 'keyPoints' | 'arguments' | 'sources' | 'questions' | 'examples';
    items: string[];
    label: string;
    icon: React.ElementType;
  }) => {
    const isEditing = editingSection === index;
    const section = getSection(index);

    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-gray-700 flex items-center space-x-1">
            <Icon className="w-3 h-3" />
            <span>{label}</span>
          </h4>
          {isEditing && (
            <button
              onClick={() => addListItem(index, listType)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Ajouter</span>
            </button>
          )}
        </div>
        {isEditing ? (
          <div className="space-y-2">
            {section[listType].map((item, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateListItem(index, listType, i, e.target.value)}
                  className="flex-1 text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`${label} ${i + 1}`}
                />
                <button
                  onClick={() => removeListItem(index, listType, i)}
                  className="text-red-600 hover:text-red-700 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
            {section[listType].length === 0 && (
              <button
                onClick={() => addListItem(index, listType)}
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Ajouter le premier élément</span>
              </button>
            )}
          </div>
        ) : (
          <ul className="list-disc list-inside text-xs text-gray-600 space-y-1">
            {items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Cours non trouvé'}
          </h2>
          <Link to="/trainer" className="btn-primary">
            Retour au dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TrainerHeader />
      {splitView ? (
        // Vue côte à côte : Cours à gauche, Script à droite
        <div className="flex h-[calc(100vh-112px)] overflow-hidden pt-28">
          {/* Panneau gauche : Cours */}
          <div className="flex-1 overflow-y-auto border-r border-gray-200 bg-white">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Cours et Slides</h2>
                <button
                  onClick={toggleSplitView}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  title="Fermer la vue côte à côte"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {courseJson ? (
                <div className="bg-white rounded-lg">
                  <ReactRenderer courseJson={courseJson} />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Chargement du cours...
                </div>
              )}
            </div>
          </div>

          {/* Séparateur redimensionnable */}
          <ResizableSidebar
            storageKey="trainer-script-split-width"
            minWidth={400}
            maxWidth={800}
            defaultWidth={600}
            side="right"
          >
            <div className="h-full bg-gray-50 overflow-y-auto">
              <div className="p-6">
                {/* Header Script */}
                <div className="mb-6 bg-white rounded-lg shadow p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold text-gray-900">Script pédagogique</h2>
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="p-2 text-purple-600 hover:bg-purple-50 rounded"
                      title="Importer des notes"
                    >
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-6 text-gray-600 text-sm">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>Durée: {formatTime(totalTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{scriptSections.length} sections</span>
                      {readSections.size > 0 && (
                        <span className="text-green-600">
                          ({readSections.size} lue{readSections.size > 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                        showOnlyUnread
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      title={showOnlyUnread ? 'Afficher toutes les sections' : 'Afficher seulement les non lues'}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{showOnlyUnread ? 'Toutes' : 'Non lues'}</span>
                    </button>
                  </div>
                </div>

                {/* Script sections */}
                <div className="space-y-3">
                  {scriptSections
                    .map((_, index) => {
                      const section = getSection(index);
                      const isRead = readSections.has(index);
                      // Filtrer si on veut seulement les non lues
                      if (showOnlyUnread && isRead) return null;
                      
                      const isExpanded = expandedSections.has(index);
                      const isEditing = editingSection === index;
                      const isModified = editedSections.has(index);
                      const typeColors = {
                        introduction: 'bg-blue-50 border-blue-200',
                        content: 'bg-white border-gray-200',
                        exercise: 'bg-green-50 border-green-200',
                        transition: 'bg-yellow-50 border-yellow-200',
                        summary: 'bg-purple-50 border-purple-200'
                      };

                      return (
                        <div
                          key={index}
                          className={`border rounded-lg shadow-sm ${typeColors[section.type]} ${isModified ? 'ring-2 ring-orange-300' : ''} ${isRead ? 'opacity-75' : ''}`}
                        >
                          <div className="w-full px-4 py-3 flex items-center justify-between">
                            <button
                              onClick={() => toggleSection(index)}
                              className="flex items-center space-x-2 flex-1 min-w-0 text-left"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                              )}
                              <h3 className={`text-sm font-semibold truncate flex-1 ${isRead ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                                {section.title}
                                {isModified && <span className="ml-2 text-orange-600 text-xs">(modifié)</span>}
                              </h3>
                            <span className={`px-2 py-0.5 text-xs rounded flex-shrink-0 ${
                              section.type === 'introduction' ? 'bg-blue-100 text-blue-700' :
                              section.type === 'exercise' ? 'bg-green-100 text-green-700' :
                              section.type === 'transition' ? 'bg-yellow-100 text-yellow-700' :
                              section.type === 'summary' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {section.type}
                            </span>
                            <div className="flex items-center space-x-1 text-xs text-gray-500 flex-shrink-0">
                              <Clock className="w-3 h-3" />
                              <span>{formatTime(section.estimatedTime)}</span>
                            </div>
                          </button>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReadSection(index);
                                }}
                                className={`p-1 rounded transition-colors ${
                                  isRead
                                    ? 'text-green-600 hover:text-green-700' 
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                                title={isRead ? 'Marquer comme non lue' : 'Marquer comme lue'}
                              >
                                {isRead ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingSection(isEditing ? null : index);
                                }}
                                className={`p-1.5 rounded ${
                                  isEditing 
                                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={isEditing ? 'Terminer l\'édition' : 'Modifier cette section'}
                              >
                                {isEditing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                          <div className="px-4 pb-4 space-y-3 border-t pt-3">
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="text-xs font-semibold text-gray-700">Contenu</h4>
                              </div>
                              {isEditing ? (
                                <textarea
                                  value={section.content}
                                  onChange={(e) => updateSection(index, { content: e.target.value })}
                                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                                  placeholder="Contenu à présenter..."
                                />
                              ) : (
                                <p className="text-xs text-gray-600 whitespace-pre-wrap">{section.content}</p>
                              )}
                            </div>
                            
                            <EditableList
                              index={index}
                              listType="keyPoints"
                              items={section.keyPoints}
                              label="Points clés"
                              icon={Target}
                            />
                            
                            <EditableList
                              index={index}
                              listType="arguments"
                              items={section.arguments}
                              label="Arguments"
                              icon={Lightbulb}
                            />
                            
                            <EditableList
                              index={index}
                              listType="sources"
                              items={section.sources}
                              label="Sources"
                              icon={BookOpen}
                            />
                            
                            <EditableList
                              index={index}
                              listType="questions"
                              items={section.questions}
                              label="Questions"
                              icon={MessageSquare}
                            />
                            
                            <EditableList
                              index={index}
                              listType="examples"
                              items={section.examples}
                              label="Exemples"
                              icon={Lightbulb}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </ResizableSidebar>
        </div>
      ) : (
        // Vue script seule (vue originale)
        <div className="p-6 pt-28">
          <div className="mx-auto max-w-6xl">
            {/* Header */}
            <div className="mb-8 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <Link
                  to={`/courses/${courseId}`}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Eye className="w-5 h-5" />
                  <span>Voir le cours</span>
                </Link>
                <Link
                  to="/trainer"
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Retour</span>
                </Link>
              </div>
              <div className="flex items-center space-x-3">
                {hasUnsavedChanges && (
                  <span className="text-sm text-orange-600 font-medium">Modifications non sauvegardées</span>
                )}
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  title="Importer des notes depuis un texte"
                >
                  <Upload className="w-5 h-5" />
                  <span>Importer notes</span>
                </button>
                <button
                  onClick={migrateScriptsToSupabase}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  title="Migrer les scripts de localStorage vers Supabase"
                >
                  <Upload className="w-5 h-5" />
                  <span>Migrer vers Supabase</span>
                </button>
                <button
                  onClick={saveScript}
                  disabled={!hasUnsavedChanges}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    hasUnsavedChanges
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <Save className="w-5 h-5" />
                  <span>Sauvegarder</span>
                </button>
                <button
                  onClick={toggleSplitView}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    splitView 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Layout className="w-5 h-5" />
                  <span>{splitView ? 'Vue script seule' : 'Vue côte à côte'}</span>
                </button>
                <button
                  onClick={printScript}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Printer className="w-5 h-5" />
                  <span>Imprimer</span>
                </button>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Script pédagogique - {course.title}
            </h1>
              <div className="flex items-center space-x-6 text-gray-600">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Durée totale estimée: {formatTime(totalTime)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5" />
                <span>{scriptSections.length} sections</span>
                {readSections.size > 0 && (
                  <span className="text-green-600">
                    ({readSections.size} lue{readSections.size > 1 ? 's' : ''})
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  showOnlyUnread
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                title={showOnlyUnread ? 'Afficher toutes les sections' : 'Afficher seulement les non lues'}
              >
                <Eye className="w-4 h-4" />
                <span>{showOnlyUnread ? 'Toutes' : 'Non lues'}</span>
              </button>
            </div>
          </div>

          {/* Script sections */}
          <div className="space-y-4">
            {scriptSections
              .map((_, index) => {
                const section = getSection(index);
                const isRead = readSections.has(index);
                // Filtrer si on veut seulement les non lues
                if (showOnlyUnread && isRead) return null;
                
                const isExpanded = expandedSections.has(index);
                const isEditing = editingSection === index;
                const isModified = editedSections.has(index);
                const typeColors = {
                  introduction: 'bg-blue-50 border-blue-200',
                  content: 'bg-white border-gray-200',
                  exercise: 'bg-green-50 border-green-200',
                  transition: 'bg-yellow-50 border-yellow-200',
                  summary: 'bg-purple-50 border-purple-200'
                };

                return (
                  <div
                    key={index}
                    className={`border rounded-lg shadow-sm ${typeColors[section.type]} ${isModified ? 'ring-2 ring-orange-300' : ''} ${isRead ? 'opacity-75' : ''}`}
                  >
                    {/* Section header */}
                    <div className="w-full px-6 py-4 flex items-center justify-between">
                      <button
                        onClick={() => toggleSection(index)}
                        className="flex items-center space-x-4 flex-1 text-left"
                      >
                        <div className="flex-shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h3 className={`text-lg font-semibold ${isRead ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                              {section.title}
                              {isModified && <span className="ml-2 text-orange-600 text-sm">(modifié)</span>}
                            </h3>
                          <span className={`px-2 py-1 text-xs rounded ${
                            section.type === 'introduction' ? 'bg-blue-100 text-blue-700' :
                            section.type === 'exercise' ? 'bg-green-100 text-green-700' :
                            section.type === 'transition' ? 'bg-yellow-100 text-yellow-700' :
                            section.type === 'summary' ? 'bg-purple-100 text-purple-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {section.type}
                          </span>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            <span>{formatTime(section.estimatedTime)}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleReadSection(index);
                        }}
                        className={`p-2 rounded transition-colors ${
                          readSections.has(index)
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                        }`}
                        title={readSections.has(index) ? 'Marquer comme non lue' : 'Marquer comme lue'}
                      >
                        {readSections.has(index) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSection(isEditing ? null : index);
                        }}
                        className={`p-2 rounded ${
                          isEditing 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        title={isEditing ? 'Terminer l\'édition' : 'Modifier cette section'}
                      >
                        {isEditing ? <Check className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Section content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 space-y-4 border-t">
                      {/* Contenu principal */}
                      <div className="pt-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <h4 className="font-semibold text-gray-900">Contenu à présenter</h4>
                        </div>
                        {isEditing ? (
                          <textarea
                            value={section.content}
                            onChange={(e) => updateSection(index, { content: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                            placeholder="Contenu à présenter..."
                          />
                        ) : (
                          <div className="prose max-w-none bg-white p-4 rounded border">
                            <p className="whitespace-pre-wrap text-gray-700">{section.content}</p>
                          </div>
                        )}
                      </div>

                      <EditableList
                        index={index}
                        listType="keyPoints"
                        items={section.keyPoints}
                        label="Points clés à développer"
                        icon={Target}
                      />

                      <EditableList
                        index={index}
                        listType="arguments"
                        items={section.arguments}
                        label="Arguments à développer"
                        icon={Lightbulb}
                      />

                      <EditableList
                        index={index}
                        listType="sources"
                        items={section.sources}
                        label="Sources et références"
                        icon={BookOpen}
                      />

                      <EditableList
                        index={index}
                        listType="questions"
                        items={section.questions}
                        label="Questions à poser"
                        icon={MessageSquare}
                      />

                      <EditableList
                        index={index}
                        listType="examples"
                        items={section.examples}
                        label="Exemples concrets"
                        icon={Lightbulb}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>
      )}

      {/* Modal d'import */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Importer des notes</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collez vos notes et/ou sources au format suivant :
                </label>
                <div className="bg-gray-50 p-4 rounded text-xs text-gray-600 mb-4 space-y-3">
                  <div>
                    <p className="font-semibold mb-1">Format notes :</p>
                    <pre className="whitespace-pre-wrap text-xs">{`🟦 SLIDE — Titre du slide

🗣️ Ce que je dis
Votre contenu ici...

💡 Exemple à raconter
Votre exemple...

❓ Question à poser
Votre question...

🔁 Transition
Votre transition...`}</pre>
                  </div>
                  <div>
                    <p className="font-semibold mb-1">Format sources :</p>
                    <pre className="whitespace-pre-wrap text-xs">{`🟦 SLIDE — Titre du slide

📚 Sources à citer
• Source 1
• Source 2 - https://url.com

🎙️ Phrase prête à dire
Comment citer à l'oral...

💡 Usage pédagogique
Pourquoi cette source...`}</pre>
                  </div>
                  <p className="text-xs text-gray-500 italic">
                    💡 Vous pouvez importer les deux formats en même temps. Le système trouvera automatiquement les sections correspondantes.
                  </p>
                </div>
              </div>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Collez vos notes ici..."
                className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportText('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Annuler
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Importer</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

