"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import { telemedicineApi } from "@/lib/api"

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

export default function TelemedicineSessionPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()

  const sessionId = String(params.sessionId || "")
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
        router.push("/telemedicine")
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
      toast({ title: "Saved", description: "Zoom meeting link updated." })
    } catch (err: any) {
      toast({
        title: "Save failed",
        description: err?.message || "Could not save Zoom link",
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
        description: "Session is in progress. Open Zoom when ready.",
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

  const handleOpenZoom = async () => {
    try {
      const url = session?.zoomJoinUrl?.trim()
      if (url) {
        window.open(url.startsWith("http") ? url : `https://${url}`, "_blank", "noopener,noreferrer")
        return
      }
      const data = await telemedicineApi.getDoctorJoinUrl(sessionId)
      if (data?.joinUrl) {
        window.open(
          String(data.joinUrl).startsWith("http") ? data.joinUrl : `https://${data.joinUrl}`,
          "_blank",
          "noopener,noreferrer"
        )
        if (data.zoomPassword) {
          toast({
            title: "Meeting password",
            description: `If prompted, use: ${data.zoomPassword}`,
          })
        }
      }
    } catch (err: any) {
      toast({
        title: "Cannot open Zoom",
        description: err?.message || "Save a join URL first or check permissions.",
        variant: "destructive",
      })
    }
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
      <Card>
        <CardHeader>
          <CardTitle>Telemedicine session</CardTitle>
          <CardDescription>Loading…</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    )
  }

  if (!session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Telemedicine session</CardTitle>
          <CardDescription>Session not found.</CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    )
  }

  const hasLink = !!(session.zoomJoinUrl || zoomJoinUrl.trim())

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Telemedicine (Zoom)</CardTitle>
          <CardDescription>
            Patient: {session.patientFirstName} {session.patientLastName} • Status: {session.status}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertTitle>How it works</AlertTitle>
            <AlertDescription>
              New sessions use your <Link href="/telemedicine/settings" className="underline font-medium">saved Zoom defaults</Link> when
              available. You can still paste a different link for this visit. HMIS does not call the Zoom API—only stores the link, consent, and audit.
            </AlertDescription>
          </Alert>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label className="text-base font-semibold">Zoom meeting link</Label>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="secondary" size="sm" asChild>
                  <Link href="/telemedicine/settings">My Zoom defaults</Link>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleApplyMyDefaults}
                  disabled={loadingDefaults}
                >
                  {loadingDefaults ? "Applying…" : "Apply my saved link"}
                </Button>
              </div>
            </div>
            <Input
              placeholder="https://zoom.us/j/… or https://us02web.zoom.us/j/…"
              value={zoomJoinUrl}
              onChange={(e) => setZoomJoinUrl(e.target.value)}
            />
            <div className="space-y-1">
              <Label>Passcode (optional)</Label>
              <Input
                type="text"
                autoComplete="off"
                placeholder="If the meeting has a passcode, store it here for staff reference"
                value={zoomPassword}
                onChange={(e) => setZoomPassword(e.target.value)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={handleSaveZoomLink} disabled={savingLink}>
              {savingLink ? "Saving…" : "Save link"}
            </Button>
          </div>

          <Alert>
            <AlertTitle>Minors</AlertTitle>
            <AlertDescription>
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
                    <Input value={guardianName} onChange={(e) => setGuardianName(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Guardian phone (optional)</Label>
                    <Input value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label>Relationship</Label>
                    <Input value={guardianRelationship} onChange={(e) => setGuardianRelationship(e.target.value)} />
                  </div>
                </div>
              </>
            ) : (
              <Alert variant="default">
                <AlertTitle>No guardian consent needed</AlertTitle>
                <AlertDescription>Patient age is 18 or above.</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button disabled={!canRecordConsent} onClick={handleRecordConsentAndStart}>
              Record consent &amp; start session
            </Button>
            <Button variant="outline" onClick={handleOpenZoom} disabled={!hasLink} title={!hasLink ? "Paste and save a Zoom join link first" : undefined}>
              Open Zoom
            </Button>
            <Button variant="outline" onClick={handleEndSession} disabled={session.status === "ended"}>
              End session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
