"use client"

import { useState, useMemo, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { MoreHorizontal } from "lucide-react"
import {
  getQueueByServicePoint,
  getServicePointName,
  getPriorityColor,
  calculateWaitTime,
  type ServicePoint,
} from "@/lib/data/queue-data"
import { QueueTabsIndicator } from "@/components/queue-tabs-indicator"
import { useScreenSize } from "@/hooks/use-screen-size"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface QueueDisplayProps {
  initialServicePoint?: ServicePoint
}

export function QueueDisplay({ initialServicePoint = "triage" }: QueueDisplayProps) {
  // Define service points with triage first
  const allServicePoints: ServicePoint[] = [
    "triage",
    "registration",
    "consultation",
    "laboratory",
    "radiology",
    "pharmacy",
    "billing",
    "cashier",
  ]

  const [selectedTab, setSelectedTab] = useState<ServicePoint>(initialServicePoint)
  const screenSize = useScreenSize()

  // Determine how many tabs to show based on screen size
  const visibleTabCount = useMemo(() => {
    switch (screenSize) {
      case "xs":
        return 2
      case "sm":
        return 3
      case "md":
        return 4
      case "lg":
        return 6
      case "xl":
      case "2xl":
        return 8
      default:
        return 4
    }
  }, [screenSize])

  // Determine which tabs to show
  // Priority: 1. Selected tab, 2. Common tabs, 3. Others in order
  const visibleTabs = useMemo(() => {
    // Always include the selected tab
    // Make sure triage is the first priority tab
    const priorityTabs: ServicePoint[] = ["triage", "consultation", "pharmacy"]

    // Start with the selected tab if it's not already in priority tabs
    const result: ServicePoint[] = []
    if (!priorityTabs.includes(selectedTab)) {
      result.push(selectedTab)
    }

    // Add priority tabs
    for (const tab of priorityTabs) {
      if (result.length < visibleTabCount) {
        if (!result.includes(tab)) {
          result.push(tab)
        }
      }
    }

    // Fill remaining slots with other tabs
    for (const tab of allServicePoints) {
      if (result.length < visibleTabCount) {
        if (!result.includes(tab)) {
          result.push(tab)
        }
      }
    }

    return result
  }, [selectedTab, visibleTabCount, allServicePoints])

  // Determine which tabs to show in the "More" dropdown
  const dropdownTabs = useMemo(() => {
    return allServicePoints.filter((tab) => !visibleTabs.includes(tab))
  }, [allServicePoints, visibleTabs])

  // Check if we need to show the "More" dropdown
  const showMoreDropdown = dropdownTabs.length > 0

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle>Patient Queue</CardTitle>
        <CardDescription>Current queue status for each service point</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="triage"
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as ServicePoint)}
          className="w-full"
        >
          <div className="relative mb-4">
            <ScrollArea className="w-full whitespace-nowrap">
              {visibleTabCount < allServicePoints.length && <QueueTabsIndicator />}
              <TabsList className="inline-flex h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
                {visibleTabs.map((point) => {
                  const pointData = getQueueByServicePoint(point)
                  return (
                    <TabsTrigger
                      key={point}
                      value={point}
                      className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                    >
                      {getServicePointName(point)}
                      {pointData.length > 0 && (
                        <Badge variant="secondary" className="ml-1">
                          {pointData.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}

                {showMoreDropdown && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="relative h-10 rounded-none border-b-2 border-b-transparent bg-transparent px-3 pb-3 pt-2 font-medium text-muted-foreground shadow-none transition-none hover:text-foreground focus:outline-none">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">More tabs</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {dropdownTabs.map((point) => {
                        const pointData = getQueueByServicePoint(point)
                        return (
                          <DropdownMenuItem
                            key={point}
                            onClick={() => setSelectedTab(point)}
                            className="flex items-center justify-between"
                          >
                            {getServicePointName(point)}
                            {pointData.length > 0 && (
                              <Badge variant="secondary" className="ml-2">
                                {pointData.length}
                              </Badge>
                            )}
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TabsList>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          <TabsContent value={selectedTab} className="mt-6">
            <Suspense fallback={<div className="h-64 animate-pulse bg-muted rounded-md" />}>
              <QueueContent servicePoint={selectedTab} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Separate the content to allow for better code splitting
function QueueContent({ servicePoint }: { servicePoint: ServicePoint }) {
  const queueData = getQueueByServicePoint(servicePoint)

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-12 bg-muted/50 p-3 text-sm font-medium">
        <div className="col-span-1">#</div>
        <div className="col-span-4">Patient</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-3">Wait Time</div>
      </div>

      {queueData.length > 0 ? (
        <div className="divide-y">
          {queueData.map((entry) => (
            <div key={entry.id} className="grid grid-cols-12 p-3 text-sm">
              <div className="col-span-1">{entry.queueNumber}</div>
              <div className="col-span-4 font-medium">{entry.patientName}</div>
              <div className="col-span-2">
                <Badge variant="outline" className={`${getPriorityColor(entry.priority)}`}>
                  {entry.priority}
                </Badge>
              </div>
              <div className="col-span-2">
                <Badge variant={entry.status === "waiting" ? "secondary" : "default"}>
                  {entry.status === "waiting" ? "Waiting" : "In Service"}
                </Badge>
              </div>
              <div className="col-span-3 text-muted-foreground">
                {calculateWaitTime(entry)} min
                {entry.estimatedWaitTime && entry.status === "waiting" && (
                  <span> (Est. {entry.estimatedWaitTime} min)</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-muted-foreground">
          No patients in queue for {getServicePointName(servicePoint)}
        </div>
      )}
    </div>
  )
}
