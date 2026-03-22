"use client"

import { useCallback, useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { telemedicineApi } from "@/lib/api"
import { getTelemedicineProviderLabel } from "@/lib/telemedicine-providers"
import { useToast } from "@/hooks/use-toast"
import { TelemedicineMeetingLinkActions } from "@/components/telemedicine-meeting-link-actions"
import { Loader2, RefreshCw, Video } from "lucide-react"

function humanizeStatus(status: string | undefined) {
  if (!status) return "—"
  return status.replace(/_/g, " ")
}

type Props = {
  className?: string
}

/**
 * Facility-wide active telemedicine visits with visible meeting links and Join actions for all clinical staff.
 */
export function TelemedicineFacilityActiveVisits({ className }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const res = await telemedicineApi.listSessions({
        page: 1,
        limit: 50,
        scope: "facility",
        statusGroup: "active",
      })
      setSessions(res.sessions || [])
    } catch (e: any) {
      console.error(e)
      toast({
        title: "Could not load active visits",
        description: e?.message || "Failed to list telemedicine sessions",
        variant: "destructive",
      })
      setSessions([])
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card className={`border-primary/20 bg-primary/5 ${className ?? ""}`}>
      <CardHeader className="pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Active video visits
            </CardTitle>
            <CardDescription className="text-sm max-w-3xl">
              <strong>One active session per patient</strong> — everyone joins the same HMIS session. The meeting URL appears here after it is saved: for
              <strong> Zoom</strong> that can happen automatically if the clinician has <strong>My Zoom defaults</strong> (or an optional link was
              entered when starting); otherwise the clinician pastes the link in the visit panel first. Use <strong>Join meeting</strong> for the
              browser, or <strong>Join in HMIS</strong> for consent and documentation.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="shrink-0">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center border rounded-md bg-background/50">
            No active telemedicine visits right now. When a clinician starts a visit, it will appear here for everyone who can see the facility board.
          </p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => (
              <li
                key={s.sessionId}
                className="rounded-lg border bg-card p-4 shadow-sm space-y-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-base">
                      {s.patientFirstName || s.patientLastName
                        ? `${s.patientFirstName || ""} ${s.patientLastName || ""}`.trim()
                        : "Patient"}
                      {s.patientNumber ? (
                        <span className="text-muted-foreground font-normal text-sm ml-2">· {s.patientNumber}</span>
                      ) : null}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Session <span className="font-mono">#{s.sessionId}</span>
                      <span className="mx-2">·</span>
                      Lead:{" "}
                      {s.doctorFirstName || s.doctorLastName
                        ? `${s.doctorFirstName || ""} ${s.doctorLastName || ""}`.trim()
                        : "—"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{getTelemedicineProviderLabel(s.provider)}</Badge>
                    <Badge variant="outline">{humanizeStatus(s.status)}</Badge>
                    <Badge variant="outline" className="font-normal">
                      {s.originType || "—"}
                    </Badge>
                  </div>
                </div>

                <TelemedicineMeetingLinkActions sessionId={s.sessionId} zoomJoinUrl={s.zoomJoinUrl} provider={s.provider} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
