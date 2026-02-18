"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Database, Server, Shield, Bell, Trash2, Loader2 } from "lucide-react"
import { useState } from "react"
import { queueApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function SystemConfiguration() {
  const [cleaningUp, setCleaningUp] = useState(false)
  const [cleanupResult, setCleanupResult] = useState<any>(null)
  const [isDryRun, setIsDryRun] = useState(true)

  const handleCleanupOldQueues = async (dryRun: boolean) => {
    try {
      setCleaningUp(true)
      setCleanupResult(null)

      const result = await queueApi.cleanupOld(dryRun)
      setCleanupResult(result)

      if (dryRun) {
        toast({
          title: "Dry Run Completed",
          description: `Found ${result.totalFound} queue entries older than 48 hours. No changes were made.`,
        })
      } else {
        toast({
          title: "Queue Cleanup Completed",
          description: `Successfully completed ${result.completed} queue entries.`,
        })
      }
    } catch (error: any) {
      console.error("Error cleaning up old queues:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to clean up old queue entries",
        variant: "destructive",
      })
    } finally {
      setCleaningUp(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">System Configuration</h2>
        <p className="text-sm text-muted-foreground">
          Configure system-wide settings and preferences
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Database Settings</CardTitle>
            </div>
            <CardDescription>Database connection and backup settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Select defaultValue="daily">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto Backup</Label>
                <p className="text-sm text-muted-foreground">Enable automatic backups</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Button variant="outline" className="w-full">
              Create Backup Now
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              <CardTitle>System Settings</CardTitle>
            </div>
            <CardDescription>General system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>System Name</Label>
              <Input defaultValue="Kiplombe Medical Centre HMIS" />
            </div>
            <div className="space-y-2">
              <Label>System Timezone</Label>
              <Select defaultValue="africa/nairobi">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="africa/nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="utc">UTC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Enable maintenance mode</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Security Settings</CardTitle>
            </div>
            <CardDescription>Security and authentication settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" defaultValue="30" />
            </div>
            <div className="space-y-2">
              <Label>Password Policy</Label>
              <Select defaultValue="medium">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low (6+ characters)</SelectItem>
                  <SelectItem value="medium">Medium (8+ characters, mixed case)</SelectItem>
                  <SelectItem value="high">High (12+ characters, special chars)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">Require 2FA for admins</p>
              </div>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Password Expiration</Label>
                <p className="text-sm text-muted-foreground">Require password change every 90 days</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>System notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send system notifications via email</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Notifications</Label>
                <p className="text-sm text-muted-foreground">Send critical alerts via SMS</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="space-y-2">
              <Label>Notification Email</Label>
              <Input type="email" placeholder="admin@example.com" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            <CardTitle>Queue Maintenance</CardTitle>
          </div>
          <CardDescription>Clean up old queue entries that have been inactive for more than 48 hours</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Dry Run Mode</Label>
              <p className="text-sm text-muted-foreground">Preview changes without applying them</p>
            </div>
            <Switch
              checked={isDryRun}
              onCheckedChange={setIsDryRun}
              disabled={cleaningUp}
            />
          </div>

          {cleanupResult && (
            <Alert>
              <AlertTitle>
                {cleanupResult.dryRun ? "Dry Run Results" : "Cleanup Results"}
              </AlertTitle>
              <AlertDescription className="space-y-2 mt-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Total Found:</span> {cleanupResult.totalFound}
                  </div>
                  {!cleanupResult.dryRun && (
                    <>
                      <div>
                        <span className="font-medium">Completed:</span> {cleanupResult.completed}
                      </div>
                      <div>
                        <span className="font-medium">Errors:</span> {cleanupResult.errors}
                      </div>
                    </>
                  )}
                </div>
                {cleanupResult.summary && Object.keys(cleanupResult.summary).length > 0 && (
                  <div className="mt-2">
                    <p className="font-medium text-sm mb-1">By Service Point:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(cleanupResult.summary).map(([servicePoint, count]) => (
                        <Badge key={servicePoint} variant="secondary">
                          {servicePoint}: {count as number}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => handleCleanupOldQueues(true)}
              disabled={cleaningUp}
              variant="outline"
              className="flex-1"
            >
              {cleaningUp && isDryRun ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running...
                </>
              ) : (
                "Preview Changes"
              )}
            </Button>
            <Button
              onClick={() => handleCleanupOldQueues(false)}
              disabled={cleaningUp}
              variant="default"
              className="flex-1"
            >
              {cleaningUp && !isDryRun ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cleaning Up...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clean Up Now
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            This will complete queue entries older than 48 hours. Entries are marked as completed (not deleted) to maintain audit trail.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>Current system status and version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Version</p>
              <p className="text-sm font-semibold">1.0.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Database Version</p>
              <p className="text-sm font-semibold">MySQL 8.0</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
              <p className="text-sm font-semibold">—</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">System Status</p>
              <Badge variant="default">Operational</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

