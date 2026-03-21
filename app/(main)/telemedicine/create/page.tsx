"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { telemedicineApi } from "@/lib/api"
import { useAuth } from "@/lib/auth/auth-context"

export default function TelemedicineCreatePage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [originType, setOriginType] = useState<"appointment" | "inpatient" | "standalone">("appointment")
  const [appointmentId, setAppointmentId] = useState<string>("")
  const [admissionId, setAdmissionId] = useState<string>("")
  const [patientId, setPatientId] = useState<string>("")
  const [doctorId, setDoctorId] = useState<string>("")
  const [notes, setNotes] = useState<string>("")
  const [creating, setCreating] = useState(false)

  // Prefill doctor from signed-in user once
  useEffect(() => {
    const uid = user?.id
    if (uid && !doctorId) setDoctorId(String(uid))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const handleCreate = async () => {
    try {
      setCreating(true)
      if (!patientId || !doctorId) {
        toast({ title: "Missing required fields", description: "patientId and doctorId are required.", variant: "destructive" })
        return
      }

      const payload: any = {
        originType,
        patientId: Number(patientId),
        doctorId: Number(doctorId),
        notes: notes || null,
      }
      if (originType === "appointment") payload.appointmentId = appointmentId ? Number(appointmentId) : null
      if (originType === "inpatient") payload.admissionId = admissionId ? Number(admissionId) : null
      // standalone: no appointmentId / admissionId

      const created = await telemedicineApi.createSession(payload)
      toast({ title: "Telemedicine session created", description: `SessionId: ${created.sessionId}` })
      router.push(`/telemedicine/${created.sessionId}`)
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Failed to create session",
        description: err?.message || "Could not create telemedicine session",
        variant: "destructive",
      })
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Create Telemedicine Session</CardTitle>
          <CardDescription>
            Creates a telemedicine record. If you saved a default link under My Zoom defaults, it is copied into the session automatically; you can
            still change it on the next screen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" type="button" asChild>
              <Link href="/telemedicine/settings">My Zoom defaults</Link>
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Origin</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                variant={originType === "appointment" ? "default" : "outline"}
                onClick={() => setOriginType("appointment")}
              >
                Appointment
              </Button>
              <Button
                type="button"
                variant={originType === "inpatient" ? "default" : "outline"}
                onClick={() => setOriginType("inpatient")}
              >
                Inpatient (remote review)
              </Button>
              <Button
                type="button"
                variant={originType === "standalone" ? "default" : "outline"}
                onClick={() => setOriginType("standalone")}
              >
                Standalone (no appointment / ward)
              </Button>
            </div>
          </div>

          {originType === "appointment" ? (
            <div className="space-y-1">
              <Label>Appointment ID</Label>
              <Input value={appointmentId} onChange={(e) => setAppointmentId(e.target.value)} placeholder="e.g. 21" />
            </div>
          ) : originType === "inpatient" ? (
            <div className="space-y-1">
              <Label>Admission ID</Label>
              <Input value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} placeholder="e.g. 3" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Remote visit without a linked appointment or admission (e.g. phone triage, scheduled telehealth). Enter patient and doctor below.
            </p>
          )}

          <div className="space-y-1">
            <Label>Patient ID</Label>
            <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 1" />
          </div>
          <div className="space-y-1">
            <Label>Doctor (user) ID</Label>
            <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} placeholder="e.g. 68" />
          </div>
          <div className="space-y-1">
            <Label>Notes (optional)</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Short notes for the session" />
          </div>

          <Button onClick={handleCreate} disabled={creating}>
            {creating ? "Creating…" : "Create session"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

