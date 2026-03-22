"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { telemedicineApi } from "@/lib/api"
import {
  getTelemedicineProviderLabel,
  isZoomProvider,
  meetingLinkFieldLabel,
  openMeetingButtonLabel,
} from "@/lib/telemedicine-providers"

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

  useEffect(() => {
    setFloatingZoomOpenUrl(null)
  }, [sessionId])

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
      await telemedicineApi.endSession(sessionId)
      const refreshed = await telemedicineApi.getSession(sessionId)
      setSession(refreshed)
      toast({ title: "Session ended", description: "Teleconsultation marked as ended." })
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

  return (
    <div className={wrapperClass}>
      <Card className={isFloating ? "border-0 shadow-none" : undefined}>
        <CardHeader className={isFloating ? "py-3 px-0" : undefined}>
          <CardTitle className={isFloating ? "text-base" : undefined}>
            Video visit ({getTelemedicineProviderLabel(videoProviderId)})
          </CardTitle>
          <CardDescription className={isFloating ? "text-xs" : undefined}>
            Patient: {session.patientFirstName} {session.patientLastName} • Status: {session.status}
          </CardDescription>
        </CardHeader>
        <CardContent className={`space-y-4 ${isFloating ? "px-0 pb-0" : ""}`}>
          {!isFloating && (
            <Alert>
              <AlertTitle>How it works</AlertTitle>
              <AlertDescription>
                {isZoomProvider(videoProviderId) ? (
                  <>
                    For <strong>Zoom</strong>, new sessions can use your{" "}
                    <Link href="/telemedicine/settings" className="underline font-medium">
                      saved Zoom defaults
                    </Link>{" "}
                    when available. HMIS does not call vendor APIs—only stores the join link, optional passcode, consent, and audit.
                  </>
                ) : (
                  <>
                    Paste the <strong>{getTelemedicineProviderLabel(videoProviderId)}</strong> join link below. HMIS stores the link, optional
                    passcode, consent, and audit. Vendor APIs are not integrated yet.
                  </>
                )}
              </AlertDescription>
            </Alert>
          )}
          {isFloating && (
            <p className="text-xs text-muted-foreground">
              Minimize this panel to browse charts or notes.
              {isZoomProvider(videoProviderId) && (
                <>
                  {" "}
                  <Link href="/telemedicine/settings" className="underline">
                    Zoom defaults
                  </Link>
                </>
              )}
            </p>
          )}

          <div className={`space-y-3 rounded-lg border p-4 ${isFloating ? "p-3" : ""}`}>
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

          <Alert className={isFloating ? "py-2" : undefined}>
            <AlertTitle className={isFloating ? "text-sm" : undefined}>Minors</AlertTitle>
            <AlertDescription className={isFloating ? "text-xs" : undefined}>
              If the patient is under 18, capture guardian consent below before starting the teleconsultation.
            </AlertDescription>
          </Alert>

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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="space-y-1">
                    <Label>Guardian name</Label>
                    <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} className={isFloating ? "text-sm h-8" : undefined} />
                  </div>
                  <div className="space-y-1">
                    <Label>Guardian phone (optional)</Label>
                    <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} className={isFloating ? "text-sm h-8" : undefined} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Relationship</Label>
                    <Input
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value)}
                      className={isFloating ? "text-sm h-8" : undefined}
                    />
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="default" className={isFloating ? "py-2" : undefined}>
                <AlertTitle className={isFloating ? "text-sm" : undefined}>No guardian consent needed</AlertTitle>
                <AlertDescription className={isFloating ? "text-xs" : undefined}>Patient age is 18 or above.</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size={isFloating ? "sm" : "default"} disabled={!canRecordConsent} onClick={handleRecordConsentAndStart}>
              Record consent &amp; start session
            </Button>
            <Button
              size={isFloating ? "sm" : "default"}
              variant="outline"
              onClick={handleOpenZoom}
              disabled={!hasLink}
              title={!hasLink ? "Paste and save a join link first" : undefined}
            >
              {openMeetingButtonLabel(videoProviderId)}
            </Button>
            <Button size={isFloating ? "sm" : "default"} variant="outline" onClick={handleEndSession} disabled={session.status === "ended"}>
              End session
            </Button>
          </div>

          {isFloating && floatingZoomOpenUrl && (
            <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground leading-snug">
                Many providers block embedding. The meeting opens in a{" "}
                <strong>separate window</strong> so you can keep this panel open.
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
        </CardContent>
      </Card>
    </div>
  )
}
