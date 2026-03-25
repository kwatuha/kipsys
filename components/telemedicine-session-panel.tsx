"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { telemedicineApi } from "@/lib/api"
import {
  getTelemedicineProviderLabel,
  isZoomProvider,
  meetingLinkFieldLabel,
  openMeetingButtonLabel,
} from "@/lib/telemedicine-providers"
import { TelemedicineHelpLink } from "@/components/telemedicine-help-link"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTelemedicineFloating } from "@/lib/telemedicine-floating-context"

const ZoomEmbeddedMeeting = dynamic(
  () => import("@/components/zoom-embedded-meeting").then((m) => m.ZoomEmbeddedMeeting),
  { ssr: false, loading: () => <p className="text-xs text-muted-foreground py-2">Loading video module…</p> }
)

function calculateAgeYears(dob: string | null | undefined) {
  if (!dob) return null
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null

  const ref = new Date()
  let age = ref.getFullYear() - d.getFullYear()
  const refMonth = ref.getMonth()
  const dobMonth = d.getMonth()
  const refDay = ref.getDate()
  const dobDay = d.getDate()

  if (refMonth < dobMonth || (refMonth === dobMonth && refDay < dobDay)) {
    age -= 1
  }
  return age
}

function normalizeZoomUrl(raw: string): string | null {
  const t = raw.trim()
  if (!t) return null
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}

/** Zoom sets X-Frame-Options — iframes are blocked; use a popup or new tab instead. */
const ZOOM_POPUP_FEATURES =
  "popup=yes,width=1280,height=720,left=80,top=72,scrollbars=yes,resizable=yes,menubar=no,toolbar=no"

function zoomPopupWindowName(sessionId: string) {
  return `hmis-zoom-${sessionId}`
}

/** Must run synchronously in a click handler (user activation). */
function openZoomMeetingPopup(url: string, sessionId: string): Window | null {
  return window.open(url, zoomPopupWindowName(sessionId), ZOOM_POPUP_FEATURES)
}

/** Open blank popup before any `await` so the browser still counts it as a user gesture. */
function openBlankZoomPopup(sessionId: string): Window | null {
  return window.open("about:blank", zoomPopupWindowName(sessionId), ZOOM_POPUP_FEATURES)
}

export type TelemedicineSessionPanelProps = {
  sessionId: string
  /** full page vs compact floating widget */
  variant?: "page" | "floating"
  /** When variant=floating and session fails to load — close the floating panel */
  onFloatingDismiss?: () => void
}

export function TelemedicineSessionPanel({
  sessionId,
  variant = "page",
  onFloatingDismiss,
}: TelemedicineSessionPanelProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { setFloatingPatientMeta } = useTelemedicineFloating()
  const isFloating = variant === "floating"

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<any>(null)

  const [zoomJoinUrl, setZoomJoinUrl] = useState("")
  const [zoomPassword, setZoomPassword] = useState("")
  const [savingLink, setSavingLink] = useState(false)
  const [loadingDefaults, setLoadingDefaults] = useState(false)

  const [patientConsentGranted, setPatientConsentGranted] = useState(false)
  const [guardianConsentGranted, setGuardianConsentGranted] = useState(false)
  const [guardianName, setGuardianName] = useState("")
  const [guardianPhone, setGuardianPhone] = useState("")
  const [guardianRelationship, setGuardianRelationship] = useState("")

  /** Floating: last Zoom URL we opened (popup/tab) — for reopen + short notice */
  const [floatingZoomOpenUrl, setFloatingZoomOpenUrl] = useState<string | null>(null)

  /** Zoom Meeting SDK embed (optional — requires API env + standard /j/######## URL) */
  const [showEmbeddedZoom, setShowEmbeddedZoom] = useState(variant === "floating")
  const [sdkEmbedConfigured, setSdkEmbedConfigured] = useState<boolean | null>(null)
  /** Floating: meeting link / consent block collapsed by default to maximize video area */
  const [meetingDetailsOpen, setMeetingDetailsOpen] = useState(variant !== "floating")
  /** Consent checkboxes (nested inside meeting details) collapsed by default */
  const [consentSectionOpen, setConsentSectionOpen] = useState(false)

  useEffect(() => {
    setFloatingZoomOpenUrl(null)
    setShowEmbeddedZoom(variant === "floating")
    setMeetingDetailsOpen(variant !== "floating")
    setConsentSectionOpen(false)
  }, [sessionId, variant])

  useEffect(() => {
    if (!session) return
    const st = session.status
    if (st === "waiting_for_consent" || st === "created") {
      if (isFloating) setMeetingDetailsOpen(true)
      setConsentSectionOpen(true)
    }
  }, [isFloating, session?.status, sessionId])

  useEffect(() => {
    if (!isFloating || !session?.patientId) return
    const name = [session.patientFirstName, session.patientLastName].filter(Boolean).join(" ").trim()
    setFloatingPatientMeta({
      patientId: String(session.patientId),
      patientDisplayName: name || null,
    })
  }, [isFloating, session?.patientId, session?.patientFirstName, session?.patientLastName, setFloatingPatientMeta])

  useEffect(() => {
    let cancelled = false
    telemedicineApi
      .getZoomMeetingSdkStatus()
      .then((r) => {
        if (!cancelled) setSdkEmbedConfigured(!!r.configured)
      })
      .catch(() => {
        if (!cancelled) setSdkEmbedConfigured(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!sessionId) return
    const load = async () => {
      try {
        setLoading(true)
        const data = await telemedicineApi.getSession(sessionId)
        setSession(data)

        setPatientConsentGranted(!!data.patientConsentGranted)
        setGuardianConsentGranted(!!data.guardianConsentGranted)
        setGuardianName(data.nextOfKinName || data.guardianName || "")
        setGuardianPhone(data.nextOfKinPhone || data.guardianPhone || "")
        setGuardianRelationship(data.nextOfKinRelationship || data.guardianRelationship || "")
        setZoomJoinUrl(data.zoomJoinUrl || "")
        setZoomPassword(data.zoomPassword || "")
      } catch (err: any) {
        toast({
          title: "Error loading session",
          description: err?.message || "Failed to load telemedicine session",
          variant: "destructive",
        })
        if (isFloating) {
          onFloatingDismiss?.()
        } else {
          router.push("/telemedicine")
        }
      } finally {
        setLoading(false)
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const ageYears = useMemo(() => calculateAgeYears(session?.dateOfBirth || null), [session])
  const guardianConsentRequired = useMemo(() => {
    if (ageYears === null) return false
    return ageYears < 18
  }, [ageYears])

  const canRecordConsent = useMemo(() => {
    if (!patientConsentGranted) return false
    if (guardianConsentRequired && !guardianConsentGranted) return false
    return true
  }, [patientConsentGranted, guardianConsentGranted, guardianConsentRequired])

  const handleApplyMyDefaults = async () => {
    if (!isZoomProvider(session?.provider as string)) {
      toast({
        title: "Zoom only",
        description: "Saved defaults apply to Zoom sessions. Paste a link manually for this platform.",
        variant: "destructive",
      })
      return
    }
    try {
      setLoadingDefaults(true)
      const d = await telemedicineApi.getMyDefaults()
      if (!d?.defaultZoomJoinUrl?.trim()) {
        toast({
          title: "No saved defaults",
          description: "Set your default Zoom link under Telemedicine → My Zoom defaults.",
          variant: "destructive",
        })
        return
      }
      setZoomJoinUrl(d.defaultZoomJoinUrl)
      setZoomPassword(d.defaultZoomPassword || "")
      await telemedicineApi.updateSessionLink(sessionId, {
        zoomJoinUrl: d.defaultZoomJoinUrl.trim(),
        zoomPassword: d.defaultZoomPassword?.trim() || null,
      })
      const refreshed = await telemedicineApi.getSession(sessionId)
      setSession(refreshed)
      toast({ title: "Applied", description: "Your saved default Zoom link was copied to this session." })
    } catch (err: any) {
      toast({
        title: "Could not apply defaults",
        description: err?.message || "Failed",
        variant: "destructive",
      })
    } finally {
      setLoadingDefaults(false)
    }
  }

  const handleSaveZoomLink = async () => {
    try {
      setSavingLink(true)
      await telemedicineApi.updateSessionLink(sessionId, {
        zoomJoinUrl: zoomJoinUrl.trim() || null,
        zoomPassword: zoomPassword.trim() || null,
      })
      const refreshed = await telemedicineApi.getSession(sessionId)
      setSession(refreshed)
      toast({ title: "Saved", description: "Meeting link updated." })
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Could not save meeting link",
        variant: "destructive",
      })
    } finally {
      setSavingLink(false)
    }
  }

  const handleRecordConsentAndStart = async () => {
    try {
      if (!patientConsentGranted) {
        toast({ title: "Patient consent required", description: "Enable patient consent before starting.", variant: "destructive" })
        return
      }
      if (guardianConsentRequired && !guardianConsentGranted) {
        toast({ title: "Guardian consent required", description: "Guardian consent is required for minors under 18.", variant: "destructive" })
        return
      }
      if (guardianConsentRequired && (!guardianName || !guardianRelationship)) {
        toast({ title: "Guardian details required", description: "Guardian name and relationship are required.", variant: "destructive" })
        return
      }

      await telemedicineApi.recordConsent(sessionId, {
        patientConsentGranted: true,
        guardianConsentGranted: guardianConsentRequired ? true : false,
        guardianName: guardianConsentRequired ? guardianName : null,
        guardianPhone: guardianConsentRequired ? guardianPhone : null,
        guardianRelationship: guardianConsentRequired ? guardianRelationship : null,
      })

      await telemedicineApi.startSession(sessionId)
      toast({
        title: "Teleconsultation started",
        description: `Session is in progress. Open ${getTelemedicineProviderLabel(session?.provider as string)} when ready.`,
      })

      const refreshed = await telemedicineApi.getSession(sessionId)
      setSession(refreshed)
      setConsentSectionOpen(false)
      if (isFloating) setMeetingDetailsOpen(false)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Failed to start",
        description: err?.message || "Consent/start failed",
        variant: "destructive",
      })
    }
  }

  /**
   * Floating + join URL from API used to open a new tab because `window.open` after `await`
   * is not treated as user-initiated. Fix: open `about:blank` synchronously, then navigate.
   */
  const handleOpenZoom = () => {
    void (async () => {
      try {
        const fromLocal = session?.zoomJoinUrl?.trim() || zoomJoinUrl.trim()
        let resolved: string | null = null
        /** Pre-opened before any await (only when we need getDoctorJoinUrl) */
        let blankPopup: Window | null = null

        if (fromLocal) {
          resolved = normalizeZoomUrl(fromLocal)
        } else {
          if (isFloating) {
            blankPopup = openBlankZoomPopup(sessionId)
            if (!blankPopup) {
              toast({
                title: "Popup blocked",
                description: "Allow popups for this site to open Zoom in a separate window, or use “Open in new tab” in the panel.",
                variant: "destructive",
              })
              return
            }
          }
          const data = await telemedicineApi.getDoctorJoinUrl(sessionId)
          if (data?.joinUrl) {
            resolved = normalizeZoomUrl(String(data.joinUrl))
          }
          if (data?.zoomPassword) {
            toast({
              title: "Meeting password",
              description: `If prompted, use: ${data.zoomPassword}`,
            })
          }
        }

        if (!resolved) {
          if (blankPopup) {
            try {
              blankPopup.close()
            } catch {
              /* ignore */
            }
          }
          toast({
            title: "Cannot open meeting",
            description: "Save a join URL first or check permissions.",
            variant: "destructive",
          })
          return
        }

        if (isFloating) {
          setFloatingZoomOpenUrl(resolved)
          if (blankPopup) {
            try {
              blankPopup.location.replace(resolved)
            } catch {
              try {
                blankPopup.close()
              } catch {
                /* ignore */
              }
              const w = openZoomMeetingPopup(resolved, sessionId)
              if (!w) {
                toast({
                  title: "Could not open meeting window",
                  description: "Use “Open in new tab” below.",
                  variant: "destructive",
                })
              }
            }
          } else {
            const w = openZoomMeetingPopup(resolved, sessionId)
            if (!w) {
              toast({
                title: "Popup blocked",
                description: "Allow popups for this site, or use “Open in new tab” below.",
                variant: "destructive",
              })
            }
          }
          return
        }

        window.open(resolved, "_blank", "noopener,noreferrer")
      } catch (err: any) {
        toast({
          title: "Cannot open meeting",
          description: err?.message || "Save a join URL first or check permissions.",
          variant: "destructive",
        })
      }
    })()
  }

  const handleEndSession = async () => {
    try {
      setShowEmbeddedZoom(false)
      await telemedicineApi.endSession(sessionId)
      const refreshed = await telemedicineApi.getSession(sessionId)
      setSession(refreshed)
      toast({
        title: "Session ended",
        description: "Teleconsultation is closed. Video has been hidden; you can close this panel when ready.",
      })
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Could not end session", variant: "destructive" })
    }
  }

  if (loading) {
    return (
      <Card className={isFloating ? "border-0 shadow-none" : undefined}>
        <CardHeader className={isFloating ? "py-3" : undefined}>
          <CardTitle className={isFloating ? "text-base" : undefined}>Telemedicine session</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className={isFloating ? "border-0 shadow-none" : undefined}>
        <CardHeader className={isFloating ? "py-3" : undefined}>
          <CardTitle className={isFloating ? "text-base" : undefined}>Telemedicine session</CardTitle>
          <CardDescription>Session not found.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    )
  }

  const videoProviderId = (session.provider as string) || "zoom_manual"

  const hasLink = !!(session.zoomJoinUrl || zoomJoinUrl.trim())

  const wrapperClass = isFloating ? "space-y-3 text-sm" : "max-w-3xl mx-auto space-y-4"

  const meetingDetailsInner = (
    <>
      <div className={`space-y-3 rounded-lg border ${isFloating ? "p-3" : "p-4"}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label className={`font-semibold ${isFloating ? "text-sm" : "text-base"}`}>
            {meetingLinkFieldLabel(videoProviderId)}
          </Label>
          <div className="flex flex-wrap gap-2">
            {!isFloating && isZoomProvider(videoProviderId) && (
              <Button type="button" variant="secondary" size="sm" asChild>
                <Link href="/telemedicine/settings">My Zoom defaults</Link>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleApplyMyDefaults}
              disabled={loadingDefaults || !isZoomProvider(videoProviderId)}
              title={!isZoomProvider(videoProviderId) ? "Saved defaults apply to Zoom sessions only" : undefined}
            >
              {loadingDefaults ? "Applying…" : "Apply my saved link"}
            </Button>
          </div>
        </div>
        <Input
          placeholder={
            isZoomProvider(videoProviderId)
              ? "https://zoom.us/j/… or https://us02web.zoom.us/j/…"
              : "https://… (paste the join link from your video app)"
          }
          value={zoomJoinUrl}
          onChange={(e) => setZoomJoinUrl(e.target.value)}
          className={isFloating ? "text-sm" : undefined}
        />
        <div className="space-y-1">
          <Label className={isFloating ? "text-xs" : undefined}>Passcode (optional)</Label>
          <Input
            type="text"
            autoComplete="off"
            placeholder="If the meeting has a passcode, store it here for staff reference"
            value={zoomPassword}
            onChange={(e) => setZoomPassword(e.target.value)}
            className={isFloating ? "text-sm" : undefined}
          />
        </div>
        <Button type="button" variant="secondary" size={isFloating ? "sm" : "default"} onClick={handleSaveZoomLink} disabled={savingLink}>
          {savingLink ? "Saving…" : "Save link"}
        </Button>
      </div>

      <Collapsible open={consentSectionOpen} onOpenChange={setConsentSectionOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "flex h-8 w-full items-center justify-between font-normal text-sm",
              consentSectionOpen && "rounded-b-none border-b-0"
            )}
          >
            <span>Patient &amp; guardian consent</span>
            <ChevronDown
              className={cn("h-4 w-4 shrink-0 transition-transform duration-200", consentSectionOpen && "rotate-180")}
            />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-none">
          <div className="space-y-4 rounded-b-md border border-t-0 p-3">
            <p className={`text-muted-foreground ${isFloating ? "text-[10px]" : "text-xs"}`}>
              Under 18: guardian consent required below. <TelemedicineHelpLink />
            </p>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox checked={patientConsentGranted} onCheckedChange={(v) => setPatientConsentGranted(!!v)} />
                <div>
                  <Label className="font-semibold">Patient consent</Label>
                  <div className="text-sm text-muted-foreground">Consent for this teleconsultation and documentation in the medical record.</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {guardianConsentRequired ? (
                <>
                  <div className="flex items-start gap-3">
                    <Checkbox checked={guardianConsentGranted} onCheckedChange={(v) => setGuardianConsentGranted(!!v)} />
                    <div>
                      <Label className="font-semibold">Guardian consent (required)</Label>
                      <div className="text-sm text-muted-foreground">Required because patient age is under 18.</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2 md:grid-cols-2">
                    <div className="space-y-1">
                      <Label>Guardian name</Label>
                      <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={isFloating ? "h-8 text-sm" : undefined} />
                    </div>
                    <div className="space-y-1">
                      <Label>Guardian phone (optional)</Label>
                      <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} className={isFloating ? "h-8 text-sm" : undefined} />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <Label>Relationship</Label>
                      <Input
                        value={guardianRelationship}
                        onChange={(e) => setGuardianRelationship(e.target.value)}
                        className={isFloating ? "h-8 text-sm" : undefined}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <p className={`text-muted-foreground ${isFloating ? "text-[10px]" : "text-xs"}`}>Adult patient — no guardian consent.</p>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <div className="flex flex-wrap gap-2">
        <Button size={isFloating ? "sm" : "default"} disabled={!canRecordConsent} onClick={handleRecordConsentAndStart}>
          Record consent &amp; start session
        </Button>
        {!isFloating && (
          <>
            <Button
              size="default"
              variant="outline"
              onClick={handleOpenZoom}
              disabled={!hasLink}
              title={!hasLink ? "Paste and save a join link first" : undefined}
            >
              {openMeetingButtonLabel(videoProviderId)}
            </Button>
            <Button size="default" variant="outline" onClick={handleEndSession} disabled={session.status === "ended"}>
              End session
            </Button>
          </>
        )}
      </div>
    </>
  )

  return (
    <div className={wrapperClass}>
      <Card className={isFloating ? "border-0 shadow-none" : undefined}>
        <CardHeader className={isFloating ? "px-0 py-2 pb-1" : undefined}>
          {isFloating ? (
            <CardTitle className="text-sm font-medium">Video visit</CardTitle>
          ) : (
            <>
              <CardTitle>Video visit ({getTelemedicineProviderLabel(videoProviderId)})</CardTitle>
              <CardDescription>
                Patient: {session.patientFirstName} {session.patientLastName} • Status: {session.status}
              </CardDescription>
            </>
          )}
        </CardHeader>
        <CardContent className={`space-y-4 ${isFloating ? "px-0 pb-0" : ""}`}>
          {isFloating ? (
            <>
              {session.status === "ended" && (
                <Alert className="border-amber-200 bg-amber-50 py-2 dark:border-amber-900 dark:bg-amber-950/40">
                  <AlertTitle className="text-sm">Session ended</AlertTitle>
                  <AlertDescription className="text-xs">
                    This teleconsultation is closed and in-page video has been stopped. You can close the panel when you are done.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-medium">
                      {session.patientFirstName} {session.patientLastName}
                    </span>
                    <Badge variant="outline" className="ml-2 align-middle text-[10px] font-normal">
                      {session.status}
                    </Badge>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
                    {hasLink && session.status !== "ended" && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={handleOpenZoom}>
                        Open in browser
                      </Button>
                    )}
                    {isZoomProvider(videoProviderId) && sdkEmbedConfigured && hasLink && session.status !== "ended" && (
                      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setShowEmbeddedZoom((v) => !v)}>
                        {showEmbeddedZoom ? "Hide video" : "Show video"}
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleEndSession}
                      disabled={session.status === "ended"}
                    >
                      End session
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-x-2 text-[10px] text-muted-foreground">
                  {isZoomProvider(videoProviderId) && (
                    <Link href="/telemedicine/settings" className="underline">
                      Zoom defaults
                    </Link>
                  )}
                  <TelemedicineHelpLink />
                </div>
              </div>

              {isZoomProvider(videoProviderId) && sdkEmbedConfigured && hasLink && showEmbeddedZoom && session.status !== "ended" && (
                <div className="min-h-[200px]">
                  <ZoomEmbeddedMeeting sessionId={sessionId} compact />
                </div>
              )}

              <Collapsible open={meetingDetailsOpen} onOpenChange={setMeetingDetailsOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "flex h-9 w-full items-center justify-between font-normal text-sm",
                      meetingDetailsOpen && "rounded-b-none border-b-0"
                    )}
                  >
                    <span>Meeting link &amp; consent</span>
                    <ChevronDown
                      className={cn("h-4 w-4 shrink-0 transition-transform duration-200", meetingDetailsOpen && "rotate-180")}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=closed]:animate-none">
                  <div className="space-y-4 rounded-b-md border border-t-0 p-3">{meetingDetailsInner}</div>
                </CollapsibleContent>
              </Collapsible>

              {isZoomProvider(videoProviderId) && sdkEmbedConfigured === false && hasLink && (
                <p className="flex flex-wrap items-center gap-x-2 text-[10px] text-muted-foreground">
                  <span>In-page video needs API Meeting SDK credentials.</span>
                  <TelemedicineHelpLink />
                </p>
              )}

              {floatingZoomOpenUrl && (
                <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground leading-snug">
                    <span>Meeting may open in a separate window.</span>
                    <TelemedicineHelpLink />
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => {
                        const w = openZoomMeetingPopup(floatingZoomOpenUrl, sessionId)
                        if (!w) {
                          toast({
                            title: "Popup blocked",
                            description: "Allow popups for this site, or use “Open in new tab” below.",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      Open meeting window
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => window.open(floatingZoomOpenUrl, "_blank", "noopener,noreferrer")}
                    >
                      Open in new tab
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setFloatingZoomOpenUrl(null)}>
                      Dismiss
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex justify-end">
                <TelemedicineHelpLink />
              </div>
              {meetingDetailsInner}

              {isZoomProvider(videoProviderId) && sdkEmbedConfigured && hasLink && (
                <div className="space-y-2 rounded-lg border border-dashed border-primary/25 bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">Meeting video</span>
                    <Button
                      type="button"
                      variant={showEmbeddedZoom ? "secondary" : "default"}
                      size="sm"
                      onClick={() => setShowEmbeddedZoom((v) => !v)}
                    >
                      {showEmbeddedZoom ? "Hide video" : "Show video in page"}
                    </Button>
                  </div>
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      In-page Zoom (SDK). Standard <code className="rounded bg-background px-0.5">/j/</code> join URLs.
                    </span>
                    <TelemedicineHelpLink />
                  </p>
                  {showEmbeddedZoom && <ZoomEmbeddedMeeting sessionId={sessionId} compact={false} />}
                </div>
              )}

              {isZoomProvider(videoProviderId) && sdkEmbedConfigured === false && hasLink && (
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                  <span>In-page video needs API Meeting SDK credentials.</span>
                  <TelemedicineHelpLink />
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
