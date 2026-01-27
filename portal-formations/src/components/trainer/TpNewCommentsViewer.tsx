import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MessageSquare, Users, Filter, Search, Download, FileText } from 'lucide-react'
import { RichTextEditor } from '../RichTextEditor'
import type { Item } from '../../types/database'

interface TpNewCommentsViewerProps {
  itemId: string
  courseId?: string
  sessionId?: string
}

interface ThemeInfo {
  id: string
  title: string
}

interface StudentCommentRow {
  userId: string
  userName: string
  studentId?: string
  userEmail?: string
  themeId: string
  themeTitle: string
  commentDoc: Record<string, unknown> | null
  lastUpdated?: string
}

/** Extraire le texte brut d'un doc TipTap pour la recherche */
function extractTextFromDoc(doc: unknown): string {
  if (!doc || typeof doc !== 'object') return ''
  const d = doc as Record<string, unknown>
  if (!Array.isArray(d.content)) return ''
  const texts: string[] = []
  const walk = (nodes: unknown[]) => {
    for (const n of nodes) {
      const node = n as Record<string, unknown>
      if (typeof node.text === 'string') texts.push(node.text)
      if (Array.isArray(node.content)) walk(node.content)
    }
  }
  walk(d.content)
  return texts.join(' ').trim()
}

export function TpNewCommentsViewer({ itemId, courseId, sessionId }: TpNewCommentsViewerProps) {
  const [item, setItem] = useState<Item | null>(null)
  const [rows, setRows] = useState<StudentCommentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTheme, setFilterTheme] = useState<string>('')
  const [searchText, setSearchText] = useState('')

  const themes: ThemeInfo[] = useMemo(() => {
    if (!item?.content || typeof item.content !== 'object') return []
    const c = item.content as { type?: string; themes?: { id: string; title: string }[] }
    if (c.type !== 'tp-new' || !Array.isArray(c.themes)) return []
    return c.themes.map((t) => ({ id: t.id, title: t.title || t.id }))
  }, [item])

  useEffect(() => {
    const fetchItem = async () => {
      try {
        const { data, error: itemError } = await supabase
          .from('items')
          .select('*')
          .eq('id', itemId)
          .single()
        if (itemError) throw itemError
        setItem(data)
      } catch (err: any) {
        setError(err?.message || 'Erreur lors du chargement du TP')
      }
    }
    fetchItem()
  }, [itemId])

  useEffect(() => {
    if (!item) return

    const fetchComments = async () => {
      setLoading(true)
      setError(null)
      try {
        let query = supabase
          .from('submissions')
          .select(`
            id,
            user_id,
            answer_json,
            submitted_at,
            graded_at,
            profiles!inner ( id, full_name, student_id )
          `)
          .eq('item_id', itemId)

        if (sessionId) {
          query = query.eq('session_id', sessionId)
        }

        const { data: submissions, error: subError } = await query
        if (subError) throw subError

        const themesFromItem = (item.content as any)?.themes
          ? (item.content as any).themes.map((t: any) => ({ id: t.id, title: t.title || t.id }))
          : []

        const flat: StudentCommentRow[] = []
        const lastUpdatedByUser: Record<string, string> = {}

        for (const sub of submissions || []) {
          const profile = (sub as any).profiles
          const userName = profile?.full_name || 'Utilisateur inconnu'
          const themeCom = (sub.answer_json as any)?.themeComments || {}
          const lu = (sub.answer_json as any)?.lastUpdated || sub.graded_at || sub.submitted_at
          if (lu) lastUpdatedByUser[sub.user_id] = lu

          for (const th of themesFromItem) {
            const doc = themeCom[th.id]
            const commentDoc =
              doc && typeof doc === 'object' && (doc as any).type === 'doc' ? doc : null
            flat.push({
              userId: sub.user_id,
              userName,
              studentId: profile?.student_id,
              userEmail: undefined,
              themeId: th.id,
              themeTitle: th.title,
              commentDoc,
              lastUpdated: lastUpdatedByUser[sub.user_id]
            })
          }
        }
        setRows(flat)
      } catch (err: any) {
        setError(err?.message || 'Erreur lors du chargement des commentaires')
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [item, itemId, sessionId])

  const filteredRows = useMemo(() => {
    let list = rows
    if (filterTheme) {
      list = list.filter((r) => r.themeId === filterTheme)
    }
    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase()
      list = list.filter((r) => {
        const text = extractTextFromDoc(r.commentDoc)
        return (
          text.toLowerCase().includes(q) ||
          r.userName.toLowerCase().includes(q) ||
          (r.studentId && r.studentId.toLowerCase().includes(q))
        )
      })
    }
    return list
  }, [rows, filterTheme, searchText])

  const exportCsv = () => {
    const headers = ['Étudiant', 'N° étudiant', 'Partie', 'Commentaire (texte)', 'Dernière MAJ']
    const body = filteredRows.map((r) => [
      r.userName,
      r.studentId || '',
      r.themeTitle,
      extractTextFromDoc(r.commentDoc).replace(/"/g, '""').replace(/\n/g, ' '),
      r.lastUpdated ? new Date(r.lastUpdated).toLocaleString('fr-FR') : ''
    ])
    const csv = [headers.join(','), ...body.map((row) => row.map((c) => `"${c}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `commentaires-tp-${item?.title || 'tp'}-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-4 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
        <p className="mt-2 text-gray-600">Chargement des commentaires…</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">{error}</p>
      </div>
    )
  }
  if (!item) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-amber-800">TP non trouvé.</p>
      </div>
    )
  }

  const emptyDoc = { type: 'doc' as const, content: [] }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Commentaires des étudiants par partie</h3>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50"
        >
          <Download className="w-4 h-4" />
          Exporter (CSV)
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white border border-gray-200 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <label className="text-sm font-medium text-gray-700">Partie :</label>
          <select
            value={filterTheme}
            onChange={(e) => setFilterTheme(e.target.value)}
            className="rounded border border-gray-300 px-2 py-1.5 text-sm"
          >
            <option value="">Toutes les parties</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-gray-500 shrink-0" />
          <input
            type="search"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Rechercher dans les commentaires ou par nom..."
            className="flex-1 min-w-0 rounded border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
          <Users className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-600">
            {rows.length === 0
              ? 'Aucun commentaire pour l’instant.'
              : 'Aucun résultat pour ces filtres.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRows.map((r) => (
            <div
              key={`${r.userId}-${r.themeId}`}
              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                <span className="font-medium text-gray-900">
                  {r.userName}
                  {r.studentId && (
                    <span className="ml-2 text-gray-500 text-sm font-normal">({r.studentId})</span>
                  )}
                </span>
                <span className="text-sm text-indigo-600 font-medium">{r.themeTitle}</span>
              </div>
              <div className="prose prose-sm max-w-none min-h-[60px] rounded border border-gray-100 bg-slate-50/50 p-3">
                <RichTextEditor
                  content={r.commentDoc || emptyDoc}
                  onChange={() => {}}
                  editable={false}
                />
              </div>
              {r.lastUpdated && (
                <p className="mt-2 text-xs text-gray-500">
                  Dernière mise à jour : {new Date(r.lastUpdated).toLocaleString('fr-FR')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
