import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary pour capturer les erreurs dans les composants Lottie
 */
export class LottieErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Lottie Error Boundary caught an error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="lottie-animation-error">
          <p className="font-semibold mb-1">⚠️ Erreur dans l'animation Lottie</p>
          <p className="text-xs">
            {this.state.error?.message || 'Une erreur est survenue lors du chargement de l\'animation'}
          </p>
          <p className="text-xs mt-2 text-gray-500">
            Le fichier contient des couches de texte avec une structure incompatible.
            Essayez de réexporter depuis After Effects en convertissant les textes en formes (Create Outlines).
          </p>
        </div>
      )
    }

    return this.props.children
  }
}



