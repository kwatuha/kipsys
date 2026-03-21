"use client"

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type TelemedicineFloatingContextValue = {
  /** Active session shown in the floating panel (null = hidden) */
  sessionId: string | null
  minimized: boolean
  openSession: (sessionId: string | number) => void
  closePanel: () => void
  setMinimized: (value: boolean) => void
  toggleMinimize: () => void
}

const TelemedicineFloatingContext = createContext<TelemedicineFloatingContextValue | null>(null)

export function TelemedicineFloatingProvider({ children }: { children: ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [minimized, setMinimized] = useState(false)

  const openSession = useCallback((id: string | number) => {
    setSessionId(String(id))
    setMinimized(false)
  }, [])

  const closePanel = useCallback(() => {
    setSessionId(null)
    setMinimized(false)
  }, [])

  const toggleMinimize = useCallback(() => {
    setMinimized((m) => !m)
  }, [])

  const value = useMemo(
    () => ({
      sessionId,
      minimized,
      openSession,
      closePanel,
      setMinimized,
      toggleMinimize,
    }),
    [sessionId, minimized, openSession, closePanel, toggleMinimize]
  )

  return (
    <TelemedicineFloatingContext.Provider value={value}>{children}</TelemedicineFloatingContext.Provider>
  )
}

export function useTelemedicineFloating(): TelemedicineFloatingContextValue {
  const ctx = useContext(TelemedicineFloatingContext)
  if (!ctx) {
    throw new Error("useTelemedicineFloating must be used within TelemedicineFloatingProvider")
  }
  return ctx
}
