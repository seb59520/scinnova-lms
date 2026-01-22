import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface SidebarContextType {
  isCollapsed: boolean
  toggleCollapse: () => void
  setCollapsed: (collapsed: boolean) => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    return saved === 'true'
  })

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const newState = !prev
      localStorage.setItem('sidebar-collapsed', String(newState))
      return newState
    })
  }

  const setCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed)
    localStorage.setItem('sidebar-collapsed', String(collapsed))
  }

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapse, setCollapsed }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider')
  }
  return context
}
