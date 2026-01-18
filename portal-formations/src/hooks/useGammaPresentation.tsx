import { createContext, useContext, useState, ReactNode } from 'react'

interface GammaPresentationData {
  gammaUrl: string
  pdfUrl?: string
  pptxUrl?: string
}

interface GammaPresentationContextType {
  openGammaPresentation: (data: GammaPresentationData) => void
  closeGammaPresentation: () => void
  isOpen: boolean
  data: GammaPresentationData | null
}

const GammaPresentationContext = createContext<GammaPresentationContextType | undefined>(undefined)

export function GammaPresentationProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [data, setData] = useState<GammaPresentationData | null>(null)

  const openGammaPresentation = (presentationData: GammaPresentationData) => {
    setData(presentationData)
    setIsOpen(true)
  }

  const closeGammaPresentation = () => {
    setIsOpen(false)
    setData(null)
  }

  return (
    <GammaPresentationContext.Provider
      value={{
        openGammaPresentation,
        closeGammaPresentation,
        isOpen,
        data,
      }}
    >
      {children}
    </GammaPresentationContext.Provider>
  )
}

export function useGammaPresentation() {
  const context = useContext(GammaPresentationContext)
  if (!context) {
    throw new Error('useGammaPresentation must be used within GammaPresentationProvider')
  }
  return context
}
