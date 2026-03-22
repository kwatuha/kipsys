"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { queueApi, telemedicineApi } from "@/lib/api"
import { useAuth } from "@/lib/auth/auth-context"
import { useTelemedicineFloating } from "@/lib/telemedicine-floating-context"
import {
  Loader2,
  ListOrdered,
  Stethoscope,
  UserRound,
  RefreshCw,
  Video,
  Copy,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const SESSION_PAGE_SIZE = 40

function humanizeSessionStatus(status: string | undefined) {
  if (!status) return "—"
  const m: Record<string, string> = {
    created: "Created",
    waiting_for_consent: "Waiting for consent",
    in_progress: "In progress",
    ended: "Ended",
    recording_started: "Recording",
    recording_ready: "Recording ready",
    recording_failed: "Recording failed",
  }
  return m[status] || status.replace(/_/g, " ")
}

function sessionStatusBadgeVariant(
  status: string | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline"
  if (status === "ended") return "secondary"
  if (status === "in_progress" || status === "recording_started") return "default"
  if (status === "waiting_for_consent" || status === "created") return "outline"
  return "secondary"
}

export default function TelemedicineCreatePage() {
  const { toast } = useToast()
  const { user } = useAuth()
  const { openSession: openTelemedicineFloating } = useTelemedicineFloating()

  const [mainTab, setMainTab] = useState<"queue" | "sessions">("queue")
  const [sessionScope, setSessionScope] = useState<"active" | "ended" | "all">("active")

  const [queueEntries, setQueueEntries] = useState<any[]>([])
  const [queueLoading, setQueueLoading] = useState(true)
  const [startingQueueId, setStartingQueueId] = useState<string | number | null>(null)

  const [sessions, setSessions] = useState<any[]>([])
  const [sessionsTotal, setSessionsTotal] = useState(0)
  const [sessionsPage, setSessionsPage] = useState(1)
  const [sessionsLoading, setSessionsLoading] = useState(false)

  /** Manual / inpatient / standalone */
  const [manualOpen, setManualOpen] = useState(false)
  const [manualKind, setManualKind] = useState<"inpatient" | "standalone">("standalone")
  const [admissionId, setAdmissionId] = useState("")
  const [patientId, setPatientId] = useState("")
  const [doctorId, setDoctorId] = useState("")
  const [notes, setNotes] = useState("")
  const [creatingManual, setCreatingManual] = useState(false)

  useEffect(() => {
    const uid = user?.id
    if (uid && !doctorId) setDoctorId(String(uid))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadQueue = useCallback(async () => {
    try {
      setQueueLoading(true)
      const rows = await queueApi.getAll("telemedicine", undefined, 1, 200, false)
      setQueueEntries(Array.isArray(rows) ? rows : [])
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Could not load queue",
        description: e?.message || "Failed to fetch telemedicine queue",
        variant: "destructive",
      })
      setQueueEntries([])
    } finally {
      setQueueLoading(false)
    }
  }, [toast])

  const loadSessions = useCallback(async () => {
    try {
      setSessionsLoading(true)
      const statusGroup = sessionScope === "all" ? undefined : sessionScope
      const res = await telemedicineApi.listSessions({
        page: sessionsPage,
        limit: SESSION_PAGE_SIZE,
        scope: "facility",
        statusGroup,
      })
      setSessions(res.sessions || [])
      setSessionsTotal(res.total ?? 0)
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Could not load sessions",
        description: e?.message || "Failed to list telemedicine sessions",
        variant: "destructive",
      })
      setSessions([])
      setSessionsTotal(0)
    } finally {
      setSessionsLoading(false)
    }
  }, [toast, sessionsPage, sessionScope])

  useEffect(() => {
    void loadQueue()
  }, [loadQueue])

  useEffect(() => {
    if (mainTab !== "sessions") return
    void loadSessions()
  }, [mainTab, sessionsPage, sessionScope, loadSessions])

  const actorDoctorId = (user as { userId?: string; id?: string })?.userId ?? (user as { id?: string })?.id

  const handleStartFromQueueRow = async (entry: any) => {
    const pid = entry.patientId
    if (!pid) {
      toast({ title: "Missing patient", description: "This queue row has no patient.", variant: "destructive" })
      return
    }
    const doc = actorDoctorId != null && actorDoctorId !== "" ? Number(actorDoctorId) : NaN
    if (!Number.isFinite(doc)) {
      toast({
        title: "Missing clinician",
        description: "Sign in as the clinician who will run the telemedicine visit.",
        variant: "destructive",
      })
      return
    }
    const rowKey = entry.queueId ?? entry.id
    if (startingQueueId != null) return
    setStartingQueueId(rowKey)
    try {
      const qid = Number(entry.queueId ?? entry.id)
      const useQueueOrigin = Number.isFinite(qid) && qid > 0
      const created = await telemedicineApi.createSession(
        useQueueOrigin
          ? {
              originType: "queue",
              queueEntryId: qid,
              doctorId: doc,
              notes: `Telemedicine from queue (ticket ${entry.ticketNumber || rowKey || "—"})`,
            }
          : {
              originType: "standalone",
              patientId: Number(pid),
              doctorId: doc,
              notes: `Telemedicine from queue (ticket ${entry.ticketNumber || rowKey || "—"})`,
            },
      )
      if (created?.sessionId) {
        openTelemedicineFloating(created.sessionId)
        toast({
          title: "Telemedicine session started",
          description: "Use the floating panel — share the meeting link from the Sessions tab so others can join.",
        })
        void loadQueue()
        void loadSessions()
      }
    } catch (error: any) {
      console.error(error)
      toast({
        title: "Could not start session",
        description: error?.message || "Telemedicine create failed",
        variant: "destructive",
      })
    } finally {
      setStartingQueueId(null)
    }
  }

  const copyMeetingLink = async (url: string | null | undefined) => {
    if (!url?.trim()) {
      toast({ title: "No link yet", description: "Open the session and paste the Zoom join URL first.", variant: "destructive" })
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: "Copied", description: "Meeting link copied to clipboard." })
    } catch {
      toast({ title: "Copy failed", description: "Select and copy the link manually.", variant: "destructive" })
    }
  }

  const handleManualCreate = async () => {
    if (!doctorId) {
      toast({ title: "Doctor required", description: "Enter the clinician (user) ID.", variant: "destructive" })
      return
    }
    try {
      setCreatingManual(true)
      if (manualKind === "inpatient") {
        if (!admissionId.trim()) {
          toast({ title: "Admission required", variant: "destructive" })
          return
        }
        if (!patientId.trim()) {
          toast({ title: "Patient required", variant: "destructive" })
          return
        }
        const created = await telemedicineApi.createSession({
          originType: "inpatient",
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          admissionId: Number(admissionId.trim()),
          notes: notes?.trim() || null,
        })
        openTelemedicineFloating(created.sessionId)
        toast({ title: "Session created", description: `Session #${created.sessionId}` })
      } else {
        if (!patientId.trim()) {
          toast({ title: "Patient required", variant: "destructive" })
          return
        }
        const created = await telemedicineApi.createSession({
          originType: "standalone",
          patientId: Number(patientId),
          doctorId: Number(doctorId),
          notes: notes?.trim() || null,
        })
        openTelemedicineFloating(created.sessionId)
        toast({ title: "Session created", description: `Session #${created.sessionId}` })
      }
      void loadSessions()
    } catch (err: any) {
      toast({ title: "Failed", description: err?.message || "Could not create session", variant: "destructive" })
    } finally {
      setCreatingManual(false)
    }
  }

  const totalSessionPages = Math.max(1, Math.ceil(sessionsTotal / SESSION_PAGE_SIZE))

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Video className="h-7 w-7" />
            Telemedicine sessions
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Start visits from the live <strong>telemedicine queue</strong>, track <strong>active and ended</strong> sessions, and copy the Zoom link
            for nurses or other staff to join.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" type="button" asChild>
            <Link href="/queue">Open full queue</Link>
          </Button>
          <Button variant="outline" size="sm" type="button" asChild>
            <Link href="/telemedicine/settings">My Zoom defaults</Link>
          </Button>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as "queue" | "sessions")} className="w-full">
        <TabsList className="grid w-full max-w-lg grid-cols-2">
          <TabsTrigger value="queue" className="gap-2">
            <ListOrdered className="h-4 w-4" />
            Telemedicine queue
          </TabsTrigger>
          <TabsTrigger value="sessions" className="gap-2">
            <Video className="h-4 w-4" />
            Current sessions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle className="text-lg">Patients waiting (telemedicine)</CardTitle>
                <CardDescription>
                  Same list as the Telemedicine tab on Queue Management. Click <strong>Start telemedicine</strong> to open the session — your Zoom
                  defaults apply when no link is pasted yet.
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => void loadQueue()} disabled={queueLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${queueLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {queueLoading ? (
                <div className="flex justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : queueEntries.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  No one in the telemedicine queue. Add patients from registration or the service desk queue screen.
                </p>
              ) : (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ticket</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right w-[160px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {queueEntries.map((entry: any) => {
                        const key = entry.queueId ?? entry.id
                        const busy = startingQueueId === key
                        return (
                          <TableRow key={key}>
                            <TableCell className="font-mono text-sm">{entry.ticketNumber || key}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {entry.patientFirstName || entry.patientLastName
                                  ? `${entry.patientFirstName || ""} ${entry.patientLastName || ""}`.trim()
                                  : "—"}
                              </div>
                              {entry.patientNumber && (
                                <div className="text-xs text-muted-foreground">{entry.patientNumber}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{entry.status || "—"}</Badge>
                            </TableCell>
                            <TableCell>{entry.priority || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => void handleStartFromQueueRow(entry)}
                                disabled={busy || entry.status === "completed" || entry.status === "cancelled"}
                              >
                                {busy ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Starting…
                                  </>
                                ) : (
                                  <>
                                    <Video className="h-4 w-4 mr-2" />
                                    Start telemedicine
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session board</CardTitle>
              <CardDescription>
                Facility-wide view for clinical staff: <strong>Active</strong> visits are in progress or not yet ended; <strong>Ended</strong> are
                completed. Copy the <strong>Zoom link</strong> for nurses or others to join the same meeting (link must be set on the session).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={sessionScope === "active" ? "default" : "outline"}
                  onClick={() => {
                    setSessionScope("active")
                    setSessionsPage(1)
                  }}
                >
                  Active / in progress
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sessionScope === "ended" ? "default" : "outline"}
                  onClick={() => {
                    setSessionScope("ended")
                    setSessionsPage(1)
                  }}
                >
                  Ended
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={sessionScope === "all" ? "default" : "outline"}
                  onClick={() => {
                    setSessionScope("all")
                    setSessionsPage(1)
                  }}
                >
                  All
                </Button>
              </div>

              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={() => void loadSessions()} disabled={sessionsLoading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${sessionsLoading ? "animate-spin" : ""}`} />
                  Refresh
                </Button>
              </div>

              {sessionsLoading ? (
                <div className="flex justify-center py-12 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No sessions in this filter.</p>
              ) : (
                <>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Session</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Clinician</TableHead>
                          <TableHead>Origin</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Meeting link</TableHead>
                          <TableHead className="text-right">Open</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessions.map((s) => (
                          <TableRow key={s.sessionId}>
                            <TableCell className="font-mono text-sm">#{s.sessionId}</TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {s.patientFirstName || s.patientLastName
                                  ? `${s.patientFirstName || ""} ${s.patientLastName || ""}`.trim()
                                  : "—"}
                              </div>
                              {s.patientNumber && <div className="text-xs text-muted-foreground">{s.patientNumber}</div>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {s.doctorFirstName || s.doctorLastName
                                ? `${s.doctorFirstName || ""} ${s.doctorLastName || ""}`.trim()
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{s.originType || "—"}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={sessionStatusBadgeVariant(s.status)}>{humanizeSessionStatus(s.status)}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[220px]">
                              {s.zoomJoinUrl ? (
                                <div className="flex flex-col gap-1">
                                  <p className="text-xs truncate text-muted-foreground" title={s.zoomJoinUrl}>
                                    {s.zoomJoinUrl}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="sm"
                                      className="h-7 text-xs"
                                      onClick={() => void copyMeetingLink(s.zoomJoinUrl)}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      Copy
                                    </Button>
                                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" asChild>
                                      <a href={s.zoomJoinUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open
                                      </a>
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground">Pending — set on session page</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button type="button" variant="outline" size="sm" asChild>
                                <Link href={`/telemedicine/${s.sessionId}`}>Session page</Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {totalSessionPages > 1 && (
                    <div className="flex items-center justify-between pt-2">
                      <p className="text-sm text-muted-foreground">
                        Page {sessionsPage} of {totalSessionPages} · {sessionsTotal} total
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sessionsPage <= 1}
                          onClick={() => setSessionsPage((p) => Math.max(1, p - 1))}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={sessionsPage >= totalSessionPages}
                          onClick={() => setSessionsPage((p) => p + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
        <Card>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-6 h-auto">
              <div className="text-left">
                <p className="font-medium">Other ways to start</p>
                <p className="text-sm text-muted-foreground font-normal">Inpatient (admission) or standalone visit without a queue row</p>
              </div>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${manualOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0 border-t">
              <div className="flex flex-wrap gap-2 pt-4">
                <Button
                  type="button"
                  variant={manualKind === "standalone" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setManualKind("standalone")}
                  className="gap-2"
                >
                  <UserRound className="h-4 w-4" />
                  Standalone
                </Button>
                <Button
                  type="button"
                  variant={manualKind === "inpatient" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setManualKind("inpatient")}
                  className="gap-2"
                >
                  <Stethoscope className="h-4 w-4" />
                  Inpatient
                </Button>
              </div>
              {manualKind === "inpatient" && (
                <div className="space-y-1">
                  <Label>Admission ID</Label>
                  <Input value={admissionId} onChange={(e) => setAdmissionId(e.target.value)} placeholder="e.g. 3" />
                </div>
              )}
              <div className="space-y-1">
                <Label>Patient ID</Label>
                <Input value={patientId} onChange={(e) => setPatientId(e.target.value)} placeholder="e.g. 1" />
              </div>
              <div className="space-y-1">
                <Label>Doctor (user) ID</Label>
                <Input value={doctorId} onChange={(e) => setDoctorId(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Notes (optional)</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
              </div>
              <Button type="button" onClick={() => void handleManualCreate()} disabled={creatingManual}>
                {creatingManual ? "Creating…" : "Create session"}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  )
}
