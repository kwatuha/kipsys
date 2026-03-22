"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { telemedicineApi } from "@/lib/api"
import { getTelemedicineProviderLabel } from "@/lib/telemedicine-providers"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Loader2, Plus, Settings, Video } from "lucide-react"
import { TelemedicineFacilityActiveVisits } from "@/components/telemedicine-facility-active-visits"
import { TelemedicineMeetingLinkActions } from "@/components/telemedicine-meeting-link-actions"

const PAGE_SIZE = 25

export default function TelemedicineHubPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [total, setTotal] = useState(0)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        const res = await telemedicineApi.listSessions({
          page,
          limit: PAGE_SIZE,
          scope: "facility",
        })
        if (cancelled) return
        setSessions(res.sessions || [])
        setTotal(res.total ?? 0)
      } catch (err: any) {
        if (!cancelled) {
          console.error(err)
          toast({
            title: "Could not load sessions",
            description: err?.message || "Failed to list telemedicine sessions",
            variant: "destructive",
          })
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [page, toast])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const formatWhen = (v: string | null | undefined) => {
    if (!v) return "—"
    try {
      return new Date(v).toLocaleString()
    } catch {
      return String(v)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Video className="h-7 w-7" />
            Telemedicine
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
            Active visits show the <strong>meeting link</strong> stored in HMIS. Other providers use <strong>Join meeting</strong> (browser) or{" "}
            <strong>Join in HMIS</strong> (same session panel) — no second video room for the same patient.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/telemedicine/settings">
              <Settings className="h-4 w-4 mr-2" />
              My Zoom defaults
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/telemedicine/create">
              <Plus className="h-4 w-4 mr-2" />
              New session
            </Link>
          </Button>
        </div>
      </div>

      <TelemedicineFacilityActiveVisits />

      <Card>
        <CardHeader>
          <CardTitle>All sessions (recent)</CardTitle>
          <CardDescription>
            Paginated history — facility staff see all visits when your role allows. Use{" "}
            <Link href="/telemedicine/create" className="underline">
              Telemedicine sessions
            </Link>{" "}
            for a larger board with filters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No sessions yet. Create one from{" "}
              <Link href="/telemedicine/create" className="underline">
                New session
              </Link>
              , from an appointment, or from inpatient care.
            </p>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Origin</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="min-w-[200px]">Join</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((s) => (
                      <TableRow key={s.sessionId}>
                        <TableCell className="font-mono text-sm">
                          <Link href={`/telemedicine/${s.sessionId}`} className="text-primary hover:underline">
                            #{s.sessionId}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {s.patientFirstName || s.patientLastName
                                ? `${s.patientFirstName || ""} ${s.patientLastName || ""}`.trim()
                                : "—"}
                            </p>
                            {s.patientNumber && <p className="text-xs text-muted-foreground">{s.patientNumber}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {s.doctorFirstName || s.doctorLastName
                            ? `${s.doctorFirstName || ""} ${s.doctorLastName || ""}`.trim()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {getTelemedicineProviderLabel(s.provider)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{s.originType || "—"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{s.status || "—"}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {formatWhen(s.createdAt)}
                        </TableCell>
                        <TableCell className="align-top">
                          <TelemedicineMeetingLinkActions
                            compact
                            sessionId={s.sessionId}
                            zoomJoinUrl={s.zoomJoinUrl}
                            provider={s.provider}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} · {total} total
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
