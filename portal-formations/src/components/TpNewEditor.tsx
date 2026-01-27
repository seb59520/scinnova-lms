import { useCallback, useState, useRef } from 'react'
import { FileText, Image, ImagePlus, Layers, CheckCircle, Upload, Plus, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import type { TpNewBlock, TpNewContent, TpNewTheme } from './TpNewRenderer'

function newBlock(type: 'text' | 'image' | 'text-image'): TpNewBlock {
  if (type === 'text') return { type: 'text', text: '' }
  if (type === 'image') return { type: 'image', src: '', alt: '' }
  return { type: 'text-image', text: '', src: '', layout: 'right' }
}

interface TpNewEditorProps {
  content: TpNewContent
  onContentChange: (content: TpNewContent) => void
  /** Optionnel : ID de l'item pour l'upload d'images vers course-assets/tp-new/{itemId}/ */
  itemId?: string | null
}

function updateContent(
  prev: TpNewContent,
  updater: (c: TpNewContent) => void
): TpNewContent {
  const next = JSON.parse(JSON.stringify(prev)) as TpNewContent
  updater(next)
  return next
}

export function TpNewEditor({ content, onContentChange, itemId }: TpNewEditorProps) {
  const safeContent: TpNewContent = {
    type: 'tp-new',
    introduction: content.introduction ?? '',
    themes: Array.isArray(content.themes) ? content.themes : [],
    conclusion: content.conclusion ?? ''
  }

  const setIntroduction = useCallback(
    (v: string) => onContentChange(updateContent(safeContent, c => { c.introduction = v })),
    [safeContent, onContentChange]
  )
  const setConclusion = useCallback(
    (v: string) => onContentChange(updateContent(safeContent, c => { c.conclusion = v })),
    [safeContent, onContentChange]
  )
  const setTheme = useCallback(
    (themeIndex: number, theme: TpNewTheme) =>
      onContentChange(updateContent(safeContent, c => { c.themes[themeIndex] = theme })),
    [safeContent, onContentChange]
  )
  const setBlock = useCallback(
    (themeIndex: number, blockIndex: number, block: TpNewBlock) =>
      onContentChange(updateContent(safeContent, c => { c.themes[themeIndex].blocks[blockIndex] = block })),
    [safeContent, onContentChange]
  )
  const addBlock = useCallback(
    (themeIndex: number, blockType: 'text' | 'image' | 'text-image') => {
      onContentChange(
        updateContent(safeContent, c => { c.themes[themeIndex].blocks.push(newBlock(blockType)) })
      )
    },
    [safeContent, onContentChange]
  )
  const removeBlock = useCallback(
    (themeIndex: number, blockIndex: number) => {
      onContentChange(
        updateContent(safeContent, c => { c.themes[themeIndex].blocks.splice(blockIndex, 1) })
      )
    },
    [safeContent, onContentChange]
  )

  return (
    <div className="space-y-6">
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-indigo-900 mb-2">
          <FileText className="w-4 h-4" />
          Introduction
        </label>
        <textarea
          value={safeContent.introduction ?? ''}
          onChange={e => setIntroduction(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-indigo-200 bg-white p-3 text-gray-800 text-sm"
          placeholder="Texte d'introduction du TP..."
        />
      </div>

      {safeContent.themes.map((theme, themeIndex) => (
        <div key={theme.id} className="rounded-xl border-2 border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-gray-600" />
            <span className="font-semibold text-gray-900">Thème {themeIndex + 1}</span>
            <input
              type="text"
              value={theme.title}
              onChange={e => setTheme(themeIndex, { ...theme, title: e.target.value })}
              className="flex-1 ml-2 rounded border border-gray-300 px-2 py-1 text-sm font-medium"
              placeholder="Titre du thème"
            />
          </div>
          <div className="p-4 space-y-4">
            {theme.blocks.map((block, blockIndex) => (
              <BlockEditor
                key={blockIndex}
                block={block}
                onChange={block => setBlock(themeIndex, blockIndex, block)}
                itemId={itemId}
                onRemove={() => removeBlock(themeIndex, blockIndex)}
              />
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
              <span className="text-xs font-medium text-gray-500">Ajouter un bloc :</span>
              <button
                type="button"
                onClick={() => addBlock(themeIndex, 'text')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded border border-gray-300 bg-white text-gray-700 text-sm hover:bg-gray-50"
              >
                <Plus className="w-3.5 h-3.5" />
                Texte
              </button>
              <button
                type="button"
                onClick={() => addBlock(themeIndex, 'image')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded border border-slate-300 bg-slate-50 text-slate-700 text-sm hover:bg-slate-100"
              >
                <Image className="w-3.5 h-3.5" />
                Illustration seule
              </button>
              <button
                type="button"
                onClick={() => addBlock(themeIndex, 'text-image')}
                className="inline-flex items-center gap-1 px-2 py-1.5 rounded border border-indigo-300 bg-indigo-50 text-indigo-700 text-sm hover:bg-indigo-100"
              >
                <ImagePlus className="w-3.5 h-3.5" />
                Texte + illustration
              </button>
            </div>
          </div>
        </div>
      ))}

      <div className="rounded-xl border-2 border-emerald-200 bg-emerald-50/50 p-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
          <CheckCircle className="w-4 h-4" />
          Conclusion
        </label>
        <textarea
          value={safeContent.conclusion ?? ''}
          onChange={e => setConclusion(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-emerald-200 bg-white p-3 text-gray-800 text-sm"
          placeholder="Texte de conclusion..."
        />
      </div>
    </div>
  )
}

function ImageUrlField({
  value,
  onChange,
  label,
  itemId,
  placeholder = "URL de l'image ou importer un fichier"
}: {
  value: string
  onChange: (url: string) => void
  label: string
  itemId?: string | null
  placeholder?: string
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !/^image\//i.test(file.type)) {
        setUploadError('Choisissez une image (JPEG, PNG, WebP, etc.)')
        e.target.value = ''
        return
      }
      setUploadError('')
      setUploading(true)
      try {
        const ext = file.name.split('.').pop() || 'png'
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80)
        const path = `tp-new/${itemId || 'draft'}/${Date.now()}-${safeName}`
        const { error } = await supabase.storage.from('course-assets').upload(path, file, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('course-assets').getPublicUrl(path)
        onChange(data.publicUrl)
      } catch (err: any) {
        setUploadError(err?.message || 'Erreur lors de l\'upload')
      } finally {
        setUploading(false)
        e.target.value = ''
      }
    },
    [itemId, onChange]
  )

  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-gray-700">{label}</label>
      <div className="flex gap-2 flex-wrap">
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 min-w-[200px] rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
          placeholder={placeholder}
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          aria-hidden
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-indigo-800 text-sm font-medium hover:bg-indigo-100 disabled:opacity-50"
        >
          <Upload className="w-4 h-4" />
          {uploading ? 'Upload…' : 'Importer une image'}
        </button>
      </div>
      {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
    </div>
  )
}

function BlockEditor({
  block,
  onChange,
  itemId,
  onRemove
}: {
  block: TpNewBlock
  onChange: (block: TpNewBlock) => void
  itemId?: string | null
  onRemove?: () => void
}) {
  const blockHeader = (label: string) => (
    <p className="text-xs font-semibold uppercase text-gray-500 mb-2 flex items-center justify-between">
      <span>{label}</span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 text-xs font-normal normal-case"
          title="Supprimer ce bloc"
        >
          <Trash2 className="w-3 h-3" />
          Supprimer
        </button>
      )}
    </p>
  )
  if (block.type === 'text') {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50/80 p-4">
        {blockHeader('Bloc texte')}
        <textarea
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          rows={3}
          className="w-full rounded border border-gray-300 bg-white p-2 text-sm"
          placeholder="Texte du paragraphe..."
        />
      </div>
    )
  }
  if (block.type === 'image') {
    return (
      <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase text-slate-600 flex items-center gap-1">
            <Image className="w-3.5 h-3.5" />
            Illustration seule
          </p>
          {onRemove && (
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 text-xs font-normal normal-case" title="Supprimer ce bloc">
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
          )}
        </div>
        <div className="grid gap-2">
          <ImageUrlField
            label="Image (URL ou import)"
            value={block.src}
            onChange={url => onChange({ ...block, src: url })}
            itemId={itemId}
            placeholder="URL ou cliquez sur « Importer une image »"
          />
          <input
            type="text"
            value={block.alt ?? ''}
            onChange={e => onChange({ ...block, alt: e.target.value || undefined })}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm"
            placeholder="Description (alt)"
          />
        </div>
        {block.src && (
          <div className="mt-2 rounded border border-slate-200 overflow-hidden max-w-xs">
            <img src={block.src} alt={block.alt ?? ''} className="w-full object-contain max-h-32" />
          </div>
        )}
      </div>
    )
  }
  if (block.type === 'text-image') {
    return (
      <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase text-indigo-700 flex items-center gap-1">
            <ImagePlus className="w-3.5 h-3.5" />
            Texte + Illustration (modifiable)
          </p>
          {onRemove && (
            <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 text-gray-400 hover:text-red-600 text-xs font-normal normal-case" title="Supprimer ce bloc">
              <Trash2 className="w-3 h-3" /> Supprimer
            </button>
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-indigo-800 mb-1">Texte</label>
            <textarea
              value={block.text}
              onChange={e => onChange({ ...block, text: e.target.value })}
              rows={4}
              className="w-full rounded border border-indigo-200 bg-white p-2 text-sm"
              placeholder="Texte à côté de l'illustration..."
            />
          </div>
          <div>
            <ImageUrlField
              label="Illustration (URL ou import)"
              value={block.src}
              onChange={url => onChange({ ...block, src: url })}
              itemId={itemId}
              placeholder="URL ou cliquez sur « Importer une image »"
            />
            <input
              type="text"
              value={block.alt ?? ''}
              onChange={e => onChange({ ...block, alt: e.target.value || undefined })}
              className="w-full rounded border border-indigo-200 bg-white px-2 py-1.5 text-sm mb-2"
              placeholder="Description (alt)"
            />
            <label className="flex items-center gap-2 text-sm text-indigo-800">
              Position de l'image :
              <select
                value={block.layout ?? 'right'}
                onChange={e => onChange({ ...block, layout: e.target.value as 'left' | 'right' })}
                className="rounded border border-indigo-200 px-2 py-1"
              >
                <option value="right">À droite du texte</option>
                <option value="left">À gauche du texte</option>
              </select>
            </label>
            {block.src && (
              <div className="mt-2 rounded border border-indigo-200 overflow-hidden">
                <img src={block.src} alt={block.alt ?? ''} className="w-full object-contain max-h-40" />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  return null
}
