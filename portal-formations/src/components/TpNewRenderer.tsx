import { useState, useEffect, useCallback, useRef } from 'react'
import { Layers, FileText, CheckCircle, MessageSquare } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabaseClient'
import { RichTextEditor } from './RichTextEditor'
import type { Item, Submission } from '../types/database'

const EMPTY_DOC = { type: 'doc' as const, content: [] }

/** Bloc de contenu TPNew : texte, image, ou texte + image côte à côte */
export type TpNewBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; src: string; alt?: string; title?: string }
  | {
      type: 'text-image'
      text: string
      src: string
      alt?: string
      title?: string
      layout?: 'left' | 'right'
    }

export type TpNewTheme = {
  id: string
  title: string
  blocks: TpNewBlock[]
}

export type TpNewContent = {
  type: 'tp-new'
  title?: string
  introduction?: string
  themes: TpNewTheme[]
  conclusion?: string
}

interface TpNewRendererProps {
  item: Item
  submission?: Submission | null
  onSubmissionUpdate?: (submission: Submission | null) => void
  viewingUserId?: string | null
}

/** Support minimal **gras** et *italique* pour le texte */
function simpleMarkdown(html: string): string {
  return html
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />')
}

function BlockText({ text }: { text: string }) {
  return (
    <div
      className="prose prose-gray max-w-none text-gray-700"
      dangerouslySetInnerHTML={{ __html: simpleMarkdown(text) }}
    />
  )
}

function BlockImage({ src, alt, title }: { src: string; alt?: string; title?: string }) {
  return (
    <figure className="my-4 rounded-xl overflow-hidden border-2 border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Illustration</p>
      <img
        src={src}
        alt={alt ?? ''}
        title={title}
        className="rounded-lg border border-slate-200 shadow-md w-full max-w-2xl object-contain bg-white"
      />
      {(alt || title) && (
        <figcaption className="mt-2 text-sm text-slate-500 italic">{title ?? alt}</figcaption>
      )}
    </figure>
  )
}

function BlockTextImage({
  text,
  src,
  alt,
  title,
  layout = 'right'
}: {
  text: string
  src: string
  alt?: string
  title?: string
  layout?: 'left' | 'right'
}) {
  const isImageRight = layout === 'right'
  return (
    <div
      className={`flex flex-col md:flex-row gap-4 items-stretch my-4 rounded-xl overflow-hidden border-2 border-indigo-100 shadow-sm ${
        isImageRight ? '' : 'md:flex-row-reverse'
      }`}
    >
      <div className="flex-1 min-w-0 flex flex-col bg-white md:border-r border-indigo-100 md:border-r-indigo-100 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 mb-2">Texte</p>
        <div className="flex-1">
          <BlockText text={text} />
        </div>
      </div>
      <div className="flex-shrink-0 w-full md:w-[min(420px,48%)] flex flex-col bg-slate-50 p-4 border-t md:border-t-0 border-indigo-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-2">Illustration</p>
        <div className="flex-1 flex flex-col">
          <img
            src={src}
            alt={alt ?? ''}
            title={title}
            className="rounded-lg border border-slate-200 shadow-md w-full object-contain bg-white"
          />
          {(alt || title) && (
            <p className="mt-2 text-sm text-slate-500 italic">{title ?? alt}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function RenderBlock({ block }: { block: TpNewBlock }) {
  switch (block.type) {
    case 'text':
      return <BlockText text={block.text} />
    case 'image':
      return <BlockImage src={block.src} alt={block.alt} title={block.title} />
    case 'text-image':
      return (
        <BlockTextImage
          text={block.text}
          src={block.src}
          alt={block.alt}
          title={block.title}
          layout={block.layout ?? 'right'}
        />
      )
    default:
      return null
  }
}

export function TpNewRenderer({ item, submission, onSubmissionUpdate, viewingUserId }: TpNewRendererProps) {
  const { user } = useAuth()
  const [content, setContent] = useState<TpNewContent | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const displayUserId = viewingUserId ?? user?.id

  useEffect(() => {
    if (!item.content) return
    try {
      const raw = item.content as Record<string, unknown>
      if (raw.type !== 'tp-new' || !Array.isArray(raw.themes)) {
        setError('Format TPNew invalide : type "tp-new" et tableau "themes" requis.')
        return
      }
      setContent({
        type: 'tp-new',
        title: typeof raw.title === 'string' ? raw.title : undefined,
        introduction: typeof raw.introduction === 'string' ? raw.introduction : undefined,
        themes: (raw.themes as TpNewTheme[]).filter(
          (t) => t && typeof t.id === 'string' && typeof t.title === 'string' && Array.isArray(t.blocks)
        ),
        conclusion: typeof raw.conclusion === 'string' ? raw.conclusion : undefined
      })
      setError(null)
    } catch (e) {
      console.error('TpNewRenderer parse error:', e)
      setError('Erreur lors du chargement du contenu TPNew.')
      setContent(null)
    }
  }, [item.content])

  // Charger ou créer une soumission pour stocker les commentaires
  useEffect(() => {
    if (!submission && user?.id && item.id && displayUserId === user.id && onSubmissionUpdate) {
      const fetchOrCreate = async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from('submissions')
            .select('*')
            .eq('user_id', user.id)
            .eq('item_id', item.id)
            .maybeSingle()
          if (fetchError && fetchError.code !== 'PGRST116') return
          if (data) {
            onSubmissionUpdate(data)
            return
          }
          const { data: newSub, error: createError } = await supabase
            .from('submissions')
            .insert({
              user_id: user.id,
              item_id: item.id,
              answer_json: { themeComments: {} },
              status: 'draft'
            })
            .select()
            .single()
          if (!createError && newSub) onSubmissionUpdate(newSub)
        } catch (e) {
          console.error('TpNew fetchOrCreate submission:', e)
        }
      }
      fetchOrCreate()
    }
  }, [submission, user?.id, item.id, displayUserId, onSubmissionUpdate])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const saveThemeComment = useCallback(
    async (themeId: string, doc: Record<string, unknown>) => {
      if (!user?.id || displayUserId !== user.id || !onSubmissionUpdate) return
      const themeComments = { ...((submission?.answer_json as any)?.themeComments || {}), [themeId]: doc }
      const answerJson = { ...(submission?.answer_json as Record<string, unknown> || {}), themeComments, lastUpdated: new Date().toISOString() }
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(async () => {
        setSaving(true)
        try {
          if (submission?.id) {
            const { data, error: upErr } = await supabase
              .from('submissions')
              .update({ answer_json: answerJson, status: 'draft' })
              .eq('id', submission.id)
              .select()
              .single()
            if (!upErr && data) onSubmissionUpdate(data)
          } else {
            const { data: newSub, error: insErr } = await supabase
              .from('submissions')
              .insert({
                user_id: user.id,
                item_id: item.id,
                answer_json: answerJson,
                status: 'draft'
              })
              .select()
              .single()
            if (!insErr && newSub) onSubmissionUpdate(newSub)
          }
        } finally {
          setSaving(false)
          saveTimeoutRef.current = null
        }
      }, 600)
    },
    [user?.id, displayUserId, submission, item.id, onSubmissionUpdate]
  )

  if (error) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">{error}</p>
      </div>
    )
  }

  if (!content || content.themes.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
        <p className="text-slate-700">Aucun thème défini pour ce TPNew.</p>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Introduction */}
      {content.introduction && (
        <section className="rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-indigo-900">Introduction</h2>
          </div>
          <BlockText text={content.introduction} />
        </section>
      )}

      {/* Thèmes */}
      {content.themes.map((theme, index) => {
        const themeComment = (submission?.answer_json as any)?.themeComments?.[theme.id]
        const commentDoc = themeComment && typeof themeComment === 'object' && themeComment.type === 'doc'
          ? themeComment
          : EMPTY_DOC
        const canEditComment = displayUserId === user?.id
        return (
          <section
            key={theme.id}
            id={`theme-${theme.id}`}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
          >
            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                {index + 1}
              </span>
              <Layers className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-semibold text-gray-900">{theme.title}</h3>
            </div>
            <div className="p-5 space-y-6">
              {theme.blocks.map((block, blockIndex) => (
                <div key={blockIndex} className="tp-new-block">
                  <RenderBlock block={block} />
                </div>
              ))}
              {/* Commentaire par partie — visible par l'étudiant et le formateur */}
              <div className="mt-6 pt-4 border-t border-gray-200 rounded-lg bg-slate-50/80 p-4">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4" />
                  {canEditComment ? 'Mon commentaire (cette partie)' : 'Commentaire de l\'étudiant'}
                  {saving && <span className="text-xs text-slate-500 font-normal">— Enregistrement…</span>}
                </h4>
                <div className="min-h-[3.5rem] max-h-[6rem] overflow-y-auto rounded border border-slate-200 bg-white p-3">
                  <RichTextEditor
                    content={commentDoc}
                    onChange={(doc) => saveThemeComment(theme.id, doc)}
                    placeholder={canEditComment ? 'Ajoutez vos notes, questions ou remarques pour cette partie…' : undefined}
                    editable={!!canEditComment}
                  />
                </div>
              </div>
            </div>
          </section>
        )
      })}

      {/* Conclusion */}
      {content.conclusion && (
        <section className="rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-emerald-900">Conclusion</h2>
          </div>
          <BlockText text={content.conclusion} />
        </section>
      )}
    </div>
  )
}
