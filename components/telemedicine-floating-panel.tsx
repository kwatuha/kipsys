"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTelemedicineFloating } from "@/lib/telemedicine-floating-context"
import { TelemedicineSessionPanel } from "@/components/telemedicine-session-panel"
import { ExternalLink, Minus, PanelBottom, Video, X } from "lucide-react"

/**
 * Fixed floating panel for an active telemedicine session so users can navigate the rest of HMIS
 * (patient chart, notes) while keeping Zoom/consent controls visible. Minimize to a slim bar.
 */
export function TelemedicineFloatingPanel() {
  const router = useRouter()
  const { sessionId, minimized, closePanel, setMinimized } = useTelemedicineFloating()

  if (!sessionId) return null

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-[calc(100vw-1.5rem)] animate-in slide-in-from-bottom-4 fade-in-0 duration-200">
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-left text-sm shadow-lg ring-1 ring-border hover:bg-accent"
        >
          <Video className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate font-medium">Telemedicine session #{sessionId}</span>
          <span className="text-muted-foreground text-xs">— click to expand</span>
        </button>
      </div>
    )
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex max-h-[min(92vh,900px)] w-[min(96vw,520px)] flex-col overflow-hidden rounded-lg border bg-background shadow-2xl ring-1 ring-border animate-in slide-in-from-bottom-4 fade-in-0 duration-200"
      role="dialog"
      aria-label="Telemedicine session"
    >
      <div className="flex shrink-0 items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Video className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold">Telemedicine</span>
          <span className="truncate text-xs text-muted-foreground">#{sessionId}</span>
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
          <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Minimize" onClick={() => setMinimized(true)}>
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
      <div className="shrink-0 border-t bg-muted/20 px-3 py-1.5 text-center text-[10px] text-muted-foreground">
        <PanelBottom className="mr-1 inline h-3 w-3 align-text-bottom" />
        You can navigate the app; this session stays open until you close or end it.
      </div>
    </div>
  )
}
