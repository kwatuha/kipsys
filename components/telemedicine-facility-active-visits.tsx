"use client"

import { useCallback, useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { telemedicineApi } from "@/lib/api"
import { getTelemedicineProviderLabel } from "@/lib/telemedicine-providers"
import { useToast } from "@/hooks/use-toast"
import { TelemedicineMeetingLinkActions } from "@/components/telemedicine-meeting-link-actions"
import { TelemedicineHelpLink } from "@/components/telemedicine-help-link"
import { TelemedicineVisitsHistory } from "@/components/telemedicine-visits-history"
import { History, Loader2, OctagonAlert, RefreshCw, Video } from "lucide-react"

function humanizeStatus(status: string | undefined) {
  if (!status) return "—"
  return status.replace(/_/g, " ")
}

type Props = {
  className?: string
}

/**
 * Facility-wide video visits: Current (active) and Recent sessions (history) in tabs.
 */
export function TelemedicineFacilityActiveVisits({ className }: Props) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<any[]>([])
  const [endConfirmId, setEndConfirmId] = useState<string | null>(null)
  const [ending, setEnding] = useState(false)
  /** Bumped when a visit ends so Visits history refetches. */
  const [historyRefresh, setHistoryRefresh] = useState(0)
  const [facilityTab, setFacilityTab] = useState<"current" | "recent">("current")

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

  const handleEndSession = async () => {
    if (!endConfirmId) return
    try {
      setEnding(true)
      await telemedicineApi.endSession(endConfirmId)
      toast({
        title: "Visit ended",
        description: "Session is closed and listed under Recent sessions for utilization tracking.",
      })
      setEndConfirmId(null)
      await load()
      setHistoryRefresh((n) => n + 1)
    } catch (e: any) {
      toast({
        title: "Could not end session",
        description: e?.message || "Request failed",
        variant: "destructive",
      })
    } finally {
      setEnding(false)
    }
  }

  return (
    <>
      <Card className={`border-primary/20 bg-primary/5 ${className ?? ""}`}>
        <Tabs value={facilityTab} onValueChange={(v) => setFacilityTab(v as "current" | "recent")} className="w-full">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Video className="h-5 w-5 text-primary" />
                    Video visits
                  </CardTitle>
                  <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span>Switch between live visits and ended-session history.</span>
                    <TelemedicineHelpLink />
                  </CardDescription>
                </div>
                {facilityTab === "current" && (
                  <Button type="button" variant="outline" size="sm" onClick={() => void load()} disabled={loading} className="shrink-0">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                )}
              </div>
              <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1 sm:max-w-md">
                <TabsTrigger value="current" className="gap-2 py-2">
                  <Video className="h-4 w-4 shrink-0" />
                  <span className="truncate">Current</span>
                  {!loading && sessions.length > 0 && (
                    <Badge variant="secondary" className="ml-0.5 px-1.5 text-[10px] font-normal">
                      {sessions.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="recent" className="gap-2 py-2">
                  <History className="h-4 w-4 shrink-0" />
                  <span className="truncate">Recent sessions</span>
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <TabsContent value="current" className="mt-0 space-y-4 outline-none focus-visible:ring-0">
              {loading ? (
                <div className="flex justify-center py-10 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="rounded-md border bg-background/50 py-4 text-center text-sm text-muted-foreground">
                  No active visits. <TelemedicineHelpLink className="inline-flex" />
                </p>
              ) : (
                <ul className="space-y-3">
                  {sessions.map((s) => (
                    <li key={s.sessionId} className="space-y-3 rounded-lg border bg-card p-4 shadow-sm">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-base font-semibold">
                            {s.patientFirstName || s.patientLastName
                              ? `${s.patientFirstName || ""} ${s.patientLastName || ""}`.trim()
                              : "Patient"}
                            {s.patientNumber ? (
                              <span className="ml-2 text-sm font-normal text-muted-foreground">· {s.patientNumber}</span>
                            ) : null}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
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

                      <div className="flex flex-col gap-3 border-t pt-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Join &amp; share</p>
                          <TelemedicineMeetingLinkActions
                            sessionId={s.sessionId}
                            zoomJoinUrl={s.zoomJoinUrl}
                            provider={s.provider}
                            hideMeetingLinkField
                          />
                        </div>
                        <div className="flex shrink-0 flex-col items-stretch gap-1 sm:items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                            onClick={() => setEndConfirmId(String(s.sessionId))}
                          >
                            <OctagonAlert className="h-4 w-4" />
                            End visit
                          </Button>
                          <span className="text-center text-[10px] text-muted-foreground sm:text-right">Closes session for everyone</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </TabsContent>
            <TabsContent value="recent" className="mt-0 outline-none focus-visible:ring-0">
              <TelemedicineVisitsHistory refreshTrigger={historyRefresh} embedded />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      <AlertDialog open={endConfirmId != null} onOpenChange={(open) => !open && !ending && setEndConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>End this video visit?</AlertDialogTitle>
            <AlertDialogDescription>
              Session <span className="font-mono">#{endConfirmId}</span> will be marked ended and removed from active boards. Use this for duplicate or
              mistaken sessions. The lead clinician and facility staff can do this.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={ending}
              onClick={(e) => {
                e.preventDefault()
                void handleEndSession()
              }}
            >
              {ending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              End visit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
