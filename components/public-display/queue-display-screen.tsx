"use client"

import { useState, useEffect } from "react"
import type { ServicePoint } from "@/lib/data/public-queue-data"
import { ServiceSelector } from "./service-selector"
import { NowServing } from "./now-serving"
import { NextInQueue } from "./next-in-queue"
import { QueueStats } from "./queue-stats"
import { QueueList } from "./queue-list"
import { LastCalled } from "./last-called"
import { HospitalInfo } from "./hospital-info"

export function QueueDisplayScreen() {
  const [selectedService, setSelectedService] = useState<ServicePoint>("triage")
  const [currentTime, setCurrentTime] = useState(new Date())

  // Auto-refresh the display every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto">
      <HospitalInfo className="mb-2" />

      <ServiceSelector onChange={setSelectedService} defaultValue={selectedService} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <NowServing servicePoint={selectedService} className="mb-4" />
          <NextInQueue servicePoint={selectedService} />
        </div>

        <div className="flex flex-col gap-4">
          <QueueStats servicePoint={selectedService} />
          <QueueList servicePoint={selectedService} className="flex-grow" />
        </div>
      </div>

      <LastCalled className="mt-2" />

      <div className="fixed bottom-0 left-0 right-0 bg-primary text-primary-foreground py-2 text-center">
        <marquee scrollamount="3">
          Welcome to Kiplombe Medical Centre. Please take a queue number at the reception desk if you don't have
          one. For assistance, please speak to any of our staff members. Thank you for your patience.
        </marquee>
      </div>
    </div>
  )
}
