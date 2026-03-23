"use client"

import { useEffect, useRef, useState } from "react"
import * as ReactNS from "react"
import * as ReactDOMNS from "react-dom"
import { telemedicineApi } from "@/lib/api"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export type ZoomEmbeddedMeetingProps = {
  sessionId: string
  /** Compact layout for floating panel */
  compact?: boolean
  className?: string
}

/** Zoom reports whether this browser can use audio/video/screen (call before `init`). */
export type ZoomMediaCompatibility = {
  audio?: boolean
  video?: boolean
  screen?: boolean
}

type ZoomEmbeddedClient = {
  init: (args: Record<string, unknown>) => Promise<unknown>
  join: (args: Record<string, unknown>) => Promise<unknown>
  leaveMeeting?: () => unknown
  /** SDK 2.1.1+ — browser capability check; use before `init`. */
  checkSystemRequirements?: () => ZoomMediaCompatibility
}

type ZoomEmbeddedGlobal = {
  createClient: () => ZoomEmbeddedClient
  destroyClient?: () => void
}

declare global {
  interface Window {
    ZoomMtgEmbedded?: ZoomEmbeddedGlobal
    ReactWidgets?: unknown
    zoomMtg?: unknown
    React?: unknown
    ReactDOM?: unknown
  }
}

function looksLikeZoomEmbedded(v: unknown): v is ZoomEmbeddedGlobal {
  if (!v) return false
  const t = typeof v
  if (t !== "object" && t !== "function") return false
  return typeof (v as { createClient?: unknown }).createClient === "function"
}

function resolveZoomEmbeddedFromAny(v: unknown, depth = 0): ZoomEmbeddedGlobal | null {
  if (looksLikeZoomEmbedded(v)) return v
  if (!v || (typeof v !== "object" && typeof v !== "function") || depth > 3) return null
  const rec = v as Record<string, unknown>
  if (looksLikeZoomEmbedded(rec.default)) return rec.default
  if (looksLikeZoomEmbedded(rec.ZoomMtgEmbedded)) return rec.ZoomMtgEmbedded
  if (rec.default && typeof rec.default === "object") {
    const nested = rec.default as Record<string, unknown>
    if (looksLikeZoomEmbedded(nested.ZoomMtgEmbedded)) return nested.ZoomMtgEmbedded
  }
  for (const key of Object.keys(rec)) {
    const found = resolveZoomEmbeddedFromAny(rec[key], depth + 1)
    if (found) return found
  }
  return null
}

function resolveZoomEmbeddedGlobal(): ZoomEmbeddedGlobal | null {
  const direct = resolveZoomEmbeddedFromAny(window.ZoomMtgEmbedded)
  if (direct) return direct
  const rw = resolveZoomEmbeddedFromAny(window.ReactWidgets)
  if (rw) return rw
  const zm = resolveZoomEmbeddedFromAny(window.zoomMtg)
  if (zm) return zm
  return null
}

function debugDetectedZoomGlobals(): string {
  const w = window as unknown as Record<string, unknown>
  const keys = Object.keys(w).filter((k) => /zoom|reactwidgets|mtg/i.test(k)).slice(0, 20)
  const details = keys.map((k) => {
    const v = w[k]
    const type = v == null ? "null" : typeof v
    const hasCreate =
      !!v &&
      (typeof v === "object" || typeof v === "function") &&
      typeof (v as { createClient?: unknown }).createClient === "function"
    return `${k}:${type}${hasCreate ? ":createClient" : ""}`
  })
  return details.join(", ") || "none"
}

function stringifySdkError(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === "string") return err
  if (err && typeof err === "object") {
    const rec = err as Record<string, unknown>
    const direct =
      (typeof rec.reason === "string" && rec.reason) ||
      (typeof rec.message === "string" && rec.message) ||
      (typeof rec.errorMessage === "string" && rec.errorMessage) ||
      (typeof rec.type === "string" && rec.type)
    if (direct) return direct
    try {
      return JSON.stringify(rec)
    } catch {
      return String(err)
    }
  }
  return String(err)
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null
  try {
    return await Promise.race([
      p,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/**
 * Zoom Meeting SDK — Component View (embedded in a div via zoomAppRoot).
 * Requires API env ZOOM_MEETING_SDK_KEY + ZOOM_MEETING_SDK_SECRET and a standard /j/######## join URL.
 */
export function ZoomEmbeddedMeeting({ sessionId, compact, className }: ZoomEmbeddedMeetingProps) {
  const { user } = useAuth()
  const rootRef = useRef<HTMLDivElement>(null)
  const clientRef = useRef<ZoomEmbeddedClient | null>(null)
  const [sdkRuntimeReady, setSdkRuntimeReady] = useState(false)

  const [sdkRole, setSdkRole] = useState<"0" | "1">("1")
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  /** Filled after createClient + checkSystemRequirements (if available). */
  const [mediaCompat, setMediaCompat] = useState<ZoomMediaCompatibility | null>(null)

  const userName = user?.name?.trim() || "Clinician"
  const userEmail = user?.email?.trim() || ""

  /** Served from public/vendor (copied by scripts/copy-zoom-sdk-css.mjs — avoids bundler resolving node_modules CSS). */
  useEffect(() => {
    const id = "hmis-zoom-meetingsdk-css"
    if (document.getElementById(id)) return
    const link = document.createElement("link")
    link.id = id
    link.rel = "stylesheet"
    link.href = "/vendor/zoom-meetingsdk.css"
    document.head.appendChild(link)
    return () => {
      try {
        link.remove()
      } catch {
        /* ignore */
      }
    }
  }, [])

  /** Load Zoom embedded runtime via script URL(s), so build does not depend on bundling @zoom/meetingsdk. */
  useEffect(() => {
    if (resolveZoomEmbeddedGlobal()) {
      setSdkRuntimeReady(true)
      return
    }
    let cancelled = false
    const scriptId = "hmis-zoom-embedded-runtime-js"
    const urls = [
      // Prefer local copied assets (works offline / pinned to installed package).
      "/vendor/zoom-meeting-embedded-ES5.min.js",
      "/vendor/zoomus-websdk-embedded.umd.min.js",
      // Fallback to Zoom CDN if local vendor asset is unavailable in this environment.
      "https://source.zoom.us/5.1.4/zoom-meeting-embedded-ES5.min.js",
    ]
    const reactVendorUrls = ["/vendor/zoom-react18.min.js", "/vendor/zoom-react-dom18.min.js"]
    const diagnostics: string[] = []

    const injectScript = (id: string, src: string, onLoad: () => void, onError: () => void) => {
      const existing = document.getElementById(id) as HTMLScriptElement | null
      if (existing) existing.remove()
      const script = document.createElement("script")
      script.id = id
      script.src = `${src}${src.includes("?") ? "&" : "?"}v=${Date.now()}`
      script.async = true
      script.onload = onLoad
      script.onerror = onError
      document.body.appendChild(script)
    }

    const loadReactVendors = (idx: number, done: () => void) => {
      if (cancelled) return
      if (idx >= reactVendorUrls.length) {
        done()
        return
      }
      const src = reactVendorUrls[idx]
      void fetch(src, { method: "GET", cache: "no-store" })
        .then((res) => diagnostics.push(`${src} fetch:${res.status}`))
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e)
          diagnostics.push(`${src} fetch-error:${msg}`)
        })
      injectScript(
        `hmis-zoom-react-vendor-${idx}`,
        src,
        () => {
          diagnostics.push(`${src} script:onload`)
          loadReactVendors(idx + 1, done)
        },
        () => {
          diagnostics.push(`${src} script:onerror`)
          // Continue; maybe already available from cache/other script.
          loadReactVendors(idx + 1, done)
        }
      )
    }

    const tryLoad = (idx: number) => {
      if (cancelled) return
      const found = resolveZoomEmbeddedGlobal()
      if (found) {
        window.ZoomMtgEmbedded = found
        setSdkRuntimeReady(true)
        return
      }
      if (idx >= urls.length) {
        setErrorMessage(
          `Zoom runtime could not be loaded from local vendor or CDN URL. Diagnostics: ${diagnostics.join(" | ") || "none"}. Detected globals: ${debugDetectedZoomGlobals()}`
        )
        setPhase("error")
        return
      }

      const src = urls[idx]
      // Probe reachability first so the final error explains if URL was 404/blocked.
      void fetch(src, { method: "GET", cache: "no-store" })
        .then((res) => {
          diagnostics.push(`${src} fetch:${res.status}`)
        })
        .catch((e: unknown) => {
          const msg = e instanceof Error ? e.message : String(e)
          diagnostics.push(`${src} fetch-error:${msg}`)
        })

      injectScript(
        scriptId,
        src,
        () => {
        if (cancelled) return
        diagnostics.push(`${src} script:onload`)
        const resolved = resolveZoomEmbeddedGlobal()
        if (resolved) {
          window.ZoomMtgEmbedded = resolved
          setSdkRuntimeReady(true)
          return
        }
        diagnostics.push(`${src} no-createClient-export`)
        // Loaded but export shape still not usable: try next URL.
        tryLoad(idx + 1)
      },
        () => {
        if (cancelled) return
        diagnostics.push(`${src} script:onerror`)
        tryLoad(idx + 1)
      })
    }

    loadReactVendors(0, () => {
      // Ensure globals point to React 18 vendor builds before loading SDK runtime.
      if (!window.React || !window.ReactDOM) {
        diagnostics.push("react18-globals-missing-before-sdk-load")
      }
      tryLoad(0)
    })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sdkRuntimeReady) return
    // Keep a defensive guard in case runtime gets cleared unexpectedly.
    if (!resolveZoomEmbeddedGlobal()) {
      const err = "Zoom runtime became unavailable after initialization."
      setErrorMessage(err)
      setPhase("error")
    }
  }, [sdkRuntimeReady])

  useEffect(() => {
    const el = rootRef.current
    if (!el || !sdkRuntimeReady) return

    let cancelled = false

    const run = async () => {
      setPhase("loading")
      setErrorMessage(null)
      setMediaCompat(null)
      try {
        const zoomEmbedded = resolveZoomEmbeddedGlobal()
        if (!zoomEmbedded) {
          throw new Error(`Zoom embedded runtime is not available on window (expected createClient provider). Detected: ${debugDetectedZoomGlobals()}`)
        }
        // Retry-safe: force cleanup of any prior embedded instance before starting a fresh join.
        try {
          clientRef.current?.leaveMeeting?.()
        } catch {
          /* ignore */
        }
        clientRef.current = null
        try {
          zoomEmbedded.destroyClient?.()
        } catch {
          /* ignore */
        }

        const data = await telemedicineApi.getZoomSdkSignature(sessionId, {
          role: Number(sdkRole) as 0 | 1,
        })
        if (cancelled) return

        const client = zoomEmbedded.createClient()
        clientRef.current = client

        if (typeof client.checkSystemRequirements === "function") {
          try {
            const compat = client.checkSystemRequirements()
            setMediaCompat(compat ?? null)
          } catch {
            setMediaCompat(null)
          }
        }

        const w = compact ? 400 : Math.min(720, typeof window !== "undefined" ? window.innerWidth - 80 : 640)
        const h = compact ? 240 : 400

        await withTimeout(
          client.init({
          zoomAppRoot: el,
          language: "en-US",
          patchJsMedia: true,
          customize: {
            video: {
              isResizable: true,
              viewSizes: {
                default: { width: w, height: h },
              },
            },
          },
          }),
          20000,
          "Zoom SDK init"
        )
        if (cancelled) return

        const joinResult = await withTimeout(
          client.join({
          signature: data.signature,
          meetingNumber: data.meetingNumber,
          password: data.password ?? "",
          userName,
          userEmail: userEmail || undefined,
          }),
          30000,
          "Zoom SDK join"
        )
        if (cancelled) return
        if (joinResult && typeof joinResult === "object" && "reason" in joinResult) {
          throw new Error(String((joinResult as { reason?: string }).reason || "Join failed"))
        }
        setPhase("ready")
      } catch (e: unknown) {
        if (cancelled) return
        const msg = stringifySdkError(e)
        setErrorMessage(msg)
        setPhase("error")
      }
    }

    void run()

    return () => {
      cancelled = true
      try {
        clientRef.current?.leaveMeeting?.()
      } catch {
        /* ignore */
      }
      clientRef.current = null
      try {
        resolveZoomEmbeddedGlobal()?.destroyClient?.()
      } catch {
        /* ignore */
      }
    }
  }, [sessionId, sdkRole, userName, userEmail, compact, sdkRuntimeReady])

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">SDK join role</Label>
          <Select value={sdkRole} onValueChange={(v) => setSdkRole(v as "0" | "1")}>
            <SelectTrigger className="h-8 w-[200px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Host (1) — typical for meeting owner</SelectItem>
              <SelectItem value="0">Participant (0) — if you join someone else&apos;s room</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground max-w-md">
          Changing role reloads the embed. If join fails, try participant, or confirm your Zoom Marketplace Meeting SDK app is
          published and the join URL uses <code className="rounded bg-muted px-0.5">/j/</code> + numbers.
        </p>
      </div>

      {phase === "loading" && (
        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Zoom Meeting SDK…
        </div>
      )}

      {phase === "error" && errorMessage && (
        <Alert variant="destructive" className="mb-2">
          <AlertTitle>Could not embed meeting</AlertTitle>
          <AlertDescription className="text-xs whitespace-pre-wrap">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div
        ref={rootRef}
        className={`zoom-meeting-sdk-root w-full overflow-hidden rounded-md border bg-black/5 ${compact ? "min-h-[260px]" : "min-h-[420px]"}`}
      />

      {phase === "ready" && (
        <div className="mt-2 space-y-2">
          <Alert className="border-primary/30 bg-primary/5">
            <AlertTitle className="text-sm">Audio &amp; video in the toolbar</AlertTitle>
            <AlertDescription className="text-xs space-y-1.5">
              <p>
                The meeting is connected; mic and camera stay <strong>off</strong> until you turn them on in Zoom&apos;s own UI.
              </p>
              <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                <li>
                  Click <strong>Join audio</strong> (headset icon) and choose <strong>Computer audio</strong> — then allow the
                  microphone if the browser asks.
                </li>
                <li>
                  Click <strong>Start video</strong> (camera) and allow the camera if prompted.
                </li>
              </ol>
              <p className="text-muted-foreground">
                Use <strong>HTTPS</strong> or <strong>localhost</strong> so the browser can grant media permissions. If controls
                stay disabled, check the site&apos;s mic/camera permissions in the browser address bar.
              </p>
            </AlertDescription>
          </Alert>
          {mediaCompat && (mediaCompat.audio === false || mediaCompat.video === false) && (
            <Alert variant="destructive">
              <AlertTitle className="text-sm">Browser reports limited media support</AlertTitle>
              <AlertDescription className="text-xs">
                Zoom SDK check: audio={String(mediaCompat.audio ?? "unknown")}, video={String(mediaCompat.video ?? "unknown")}.
                Try Chrome/Edge, update the browser, or enable Cross-Origin isolation for advanced features (see docs).
              </AlertDescription>
            </Alert>
          )}
          <p className="text-[11px] text-muted-foreground">
            Leave from the Zoom toolbar when finished. For gallery view and virtual backgrounds, your site may need Cross-Origin
            isolation headers (see deployment notes).
          </p>
        </div>
      )}
    </div>
  )
}
