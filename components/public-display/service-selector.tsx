"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getActiveServicePoints, getDisplayName, type ServicePoint } from "@/lib/data/public-queue-data"

interface ServiceSelectorProps {
  onChange: (servicePoint: ServicePoint) => void
  defaultValue?: ServicePoint
  className?: string
}

export function ServiceSelector({ onChange, defaultValue = "triage", className = "" }: ServiceSelectorProps) {
  const [activeServicePoints, setActiveServicePoints] = useState<ServicePoint[]>([])

  useEffect(() => {
    // In a real implementation, this would fetch from an API
    const points = getActiveServicePoints()
    // Make sure triage is included and is first
    setActiveServicePoints(points.length > 0 ? points : ["triage", "consultation", "pharmacy"])
  }, [])

  return (
    <Tabs defaultValue={defaultValue} className={className} onValueChange={(value) => onChange(value as ServicePoint)}>
      <TabsList className="grid grid-cols-3 h-auto">
        {activeServicePoints.map((point) => (
          <TabsTrigger key={point} value={point} className="py-3">
            {getDisplayName(point)}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
