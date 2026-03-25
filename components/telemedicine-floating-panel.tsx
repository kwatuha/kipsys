"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTelemedicineFloating } from "@/lib/telemedicine-floating-context"
import { TelemedicineSessionPanel } from "@/components/telemedicine-session-panel"
import { TelemedicineEncounterPanel } from "@/components/telemedicine-encounter-panel"
import { ExternalLink, Minus, Video, X } from "lucide-react"

/**
 * Fixed floating dock: telemedicine video/session on the right, compact encounter + patient history on the left (desktop).
 * On small screens the encounter panel stacks below the video.
 */
export function TelemedicineFloatingPanel() {
  const router = useRouter()
  const { sessionId, minimized, closePanel, setMinimized, patientId, patientDisplayName } = useTelemedicineFloating()

  if (!sessionId) return null

  if (minimized) {
    const label = patientDisplayName?.trim() || `Session #${sessionId}`
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm shadow-lg ring-1 ring-border hover:bg-accent"
        >
          <Video className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-medium">{label}</span>
          <span className="text-muted-foreground text-xs">· expand</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-4 left-3 right-3 z-[100] flex max-h-[min(94vh,960px)] flex-col gap-2 sm:left-4 sm:right-4 lg:max-h-[min(94vh,960px)] lg:flex-row-reverse lg:items-stretch"
      role="dialog"
      aria-label="Telemedicine session and encounter"
    >
      <div className="flex min-h-[min(48vh,400px)] min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background shadow-2xl ring-1 ring-border animate-in slide-in-from-bottom-4 fade-in-0 duration-200 lg:min-h-0 lg:min-w-[min(42%,320px)] lg:max-w-none lg:flex-[1.15]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <Video className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate text-sm font-semibold">Telemedicine</span>
              <span className="shrink-0 text-xs text-muted-foreground">#{sessionId}</span>
            </div>
            {patientDisplayName ? (
              <span className="truncate pl-6 text-xs text-muted-foreground">{patientDisplayName}</span>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Open full page"
              onClick={() => {
                closePanel()
                router.push(`/telemedicine/${sessionId}`)
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Minimize — restores the sidebar for navigation"
              onClick={() => setMinimized(true)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Close panel" onClick={closePanel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2">
          <TelemedicineSessionPanel sessionId={sessionId} variant="floating" onFloatingDismiss={closePanel} />
        </div>
      </div>

      <div className="min-h-0 min-w-0 flex-1 lg:min-w-[min(38%,280px)] lg:max-w-none">
        <TelemedicineEncounterPanel
          patientId={patientId}
          patientDisplayName={patientDisplayName}
          sessionId={sessionId}
        />
      </div>
    </div>
  )
}
