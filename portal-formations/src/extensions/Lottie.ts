import { Node, mergeAttributes } from '@tiptap/core'

export interface LottieOptions {
  HTMLAttributes: Record<string, any>
  width: number
  height: number
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lottie: {
      setLottie: (options: { src: string; size?: number }) => ReturnType
      updateLottieSize: (options: { size: number }) => ReturnType
    }
  }
}

export const Lottie = Node.create<LottieOptions>({
  name: 'lottie',

  addOptions() {
    return {
      HTMLAttributes: {},
      width: 640,
      height: 360,
    }
  },

  group: 'block',

  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      width: {
        default: this.options.width,
      },
      height: {
        default: this.options.height,
      },
      size: {
        default: 2, // Taille par défaut : 2 (moyenne)
        parseHTML: element => {
          const size = element.getAttribute('data-size')
          return size ? parseInt(size) : 2
        },
        renderHTML: attributes => {
          if (!attributes.size) {
            return {}
          }
          return {
            'data-size': attributes.size.toString(),
          }
        },
      },
      autoplay: {
        default: true,
        parseHTML: element => {
          const autoplay = element.getAttribute('data-autoplay')
          return autoplay === 'true' || autoplay === null
        },
        renderHTML: attributes => {
          return {
            'data-autoplay': attributes.autoplay ? 'true' : 'false',
          }
        },
      },
      loop: {
        default: true,
        parseHTML: element => {
          const loop = element.getAttribute('data-loop')
          return loop === 'true' || loop === null
        },
        renderHTML: attributes => {
          return {
            'data-loop': attributes.loop ? 'true' : 'false',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-lottie-animation]',
        getAttrs: (node) => {
          if (typeof node === 'string') return false
          const div = node as HTMLElement
          return {
            src: div.getAttribute('data-src') || '',
            width: div.getAttribute('data-width') || this.options.width,
            height: div.getAttribute('data-height') || this.options.height,
            autoplay: div.getAttribute('data-autoplay') !== 'false',
            loop: div.getAttribute('data-loop') !== 'false',
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = HTMLAttributes.src
    if (!src) {
      return ['div', { 'data-lottie-animation': 'true', class: 'lottie-animation-error' }, 'Fichier Lottie manquant']
    }

    const width = HTMLAttributes.width || this.options.width
    const height = HTMLAttributes.height || this.options.height
    const size = HTMLAttributes.size || 2
    const autoplay = HTMLAttributes.autoplay !== false
    const loop = HTMLAttributes.loop !== false

    return [
      'div',
      { 
        'data-lottie-animation': 'true',
        'data-src': src,
        'data-width': width.toString(),
        'data-height': height.toString(),
        'data-autoplay': autoplay.toString(),
        'data-loop': loop.toString(),
        'data-size': size.toString(),
        class: `lottie-animation-container widget-size-${size}` 
      },
    ]
  },

  addCommands() {
    return {
      setLottie:
        (options: { src: string; size?: number; autoplay?: boolean; loop?: boolean }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              size: options.size || 2,
              autoplay: options.autoplay !== undefined ? options.autoplay : true,
              loop: options.loop !== undefined ? options.loop : true,
            },
          })
        },
      updateLottieSize:
        (options: { size: number }) =>
        ({ chain, state }) => {
          const { selection } = state
          const node = state.doc.nodeAt(selection.anchor - 1)
          if (node && node.type.name === this.name) {
            return chain()
              .focus()
              .updateAttributes(this.name, { size: options.size })
              .run()
          }
          return false
        },
    }
  },

  addNodeView() {
    return ({ node, HTMLAttributes }) => {
      const src = node.attrs.src
      if (!src) {
        return document.createElement('div')
      }

      const container = document.createElement('div')
      const size = node.attrs.size || 2
      container.className = `lottie-animation-container widget-size-${size}`
      container.setAttribute('data-lottie-animation', 'true')
      container.setAttribute('data-src', src)
      container.setAttribute('data-size', size.toString())
      container.setAttribute('data-autoplay', node.attrs.autoplay !== false ? 'true' : 'false')
      container.setAttribute('data-loop', node.attrs.loop !== false ? 'true' : 'false')

      // L'animation sera chargée par le composant React dans ReactRenderer
      container.setAttribute('data-lottie-placeholder', 'true')
      container.textContent = 'Chargement de l\'animation Lottie...'

      return {
        dom: container,
      }
    }
  },
})

