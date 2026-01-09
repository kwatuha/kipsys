"use client"

import { useState, useEffect } from "react"
import { useCriticalNotifications } from "@/lib/critical-notifications-context"
import { useAuth } from "@/lib/auth/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function FloatingCriticalNotifications() {
  const { notifications, removeNotification } = useCriticalNotifications()
  const { user } = useAuth()
  const [isMinimized, setIsMinimized] = useState(true) // Start minimized by default

  // Only show notifications to doctors and system administrators
  const userRole = user?.role?.toLowerCase() || ""
  const canViewNotifications = userRole === "doctor" || userRole === "admin" || userRole === "administrator"

  // Don't render if user doesn't have permission
  if (!canViewNotifications) {
    return null
  }

  if (notifications.length === 0) {
    return null
  }

  const criticalCount = notifications.reduce(
    (sum, n) => sum + n.alerts.filter((a) => a.severity === 'critical').length,
    0
  )
  const urgentCount = notifications.reduce(
    (sum, n) => sum + n.alerts.filter((a) => a.severity === 'urgent').length,
    0
  )

  return (
    <div
      className={cn(
        "fixed top-20 right-4 z-[9999] transition-all duration-300",
        isMinimized ? "w-72" : "w-[380px]", // Narrower to avoid blocking
        "max-w-[calc(100vw-20rem)]" // Ensure it doesn't overlap sidebar + margin
      )}
    >
      <div className="bg-background border-2 border-red-500 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm">
        {/* Header */}
        <div className="bg-red-600 text-white p-3 flex items-center justify-between cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="rounded-full bg-red-700 p-1.5 flex-shrink-0">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate">
                Critical Alerts
              </h3>
              <p className="text-xs text-red-100 truncate">
                {notifications.length} patient{notifications.length > 1 ? 's' : ''} • {criticalCount} critical
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-red-700 h-7 w-7 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation()
                setIsMinimized(!isMinimized)
              }}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {criticalCount > 0 && (
              <Alert variant="destructive" className="m-3 border-2 border-red-500 py-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-sm font-bold">
                  {criticalCount} CRITICAL Value{criticalCount > 1 ? 's' : ''} - Immediate Action Required
                </AlertTitle>
                <AlertDescription className="mt-1 text-xs">
                  Life-threatening conditions requiring immediate medical intervention.
                </AlertDescription>
              </Alert>
            )}

            <div className="p-3 space-y-3">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="border-2 border-red-300 rounded-lg p-3 bg-red-50 dark:bg-red-950/20"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-red-900 dark:text-red-100 truncate">
                        {notification.patientName || `Patient ID: ${notification.patientId}`}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-red-600 hover:text-red-800 hover:bg-red-100 flex-shrink-0 ml-2"
                      onClick={() => removeNotification(notification.patientId)}
                      title="Dismiss (will reappear if patient not served)"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    {notification.alerts.map((alert, index) => (
                      <Alert
                        key={index}
                        variant={alert.severity === 'critical' ? 'destructive' : 'default'}
                        className={cn(
                          "py-2",
                          alert.severity === 'critical'
                            ? 'border-2 border-red-500'
                            : 'border-2 border-orange-500'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <AlertTitle className="flex items-center justify-between text-xs mb-1">
                              <span className="font-semibold truncate">{alert.parameter}</span>
                              <Badge
                                variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                                className="ml-2 text-[10px] px-1.5 py-0 flex-shrink-0"
                              >
                                {alert.severity === 'critical' ? 'CRITICAL' : 'URGENT'}
                              </Badge>
                            </AlertTitle>
                            <AlertDescription className="space-y-1 text-xs">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-sm">
                                  {alert.value} {alert.unit}
                                </span>
                                <span className="text-muted-foreground text-[10px]">
                                  (Range: {alert.range})
                                </span>
                              </div>
                              {alert.description && (
                                <p className="text-[10px] mt-1 italic line-clamp-2">{alert.description}</p>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer note */}
            <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 border-t border-yellow-200">
              <p className="text-[10px] text-muted-foreground text-center">
                ⚠️ Remains until patient is served
              </p>
            </div>
          </div>
        )}

        {/* Minimized view */}
        {isMinimized && (
          <div className="p-2.5 bg-red-50 dark:bg-red-950/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 text-red-600 flex-shrink-0" />
                <span className="text-xs font-semibold truncate">
                  {notifications.length} patient{notifications.length > 1 ? 's' : ''}
                </span>
              </div>
              <Badge variant="destructive" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                {criticalCount}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

