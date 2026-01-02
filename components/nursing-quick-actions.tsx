"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Bed, Clipboard, FileText, Pill, Stethoscope, UserPlus } from "lucide-react"

export function NursingQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common nursing tasks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <Stethoscope className="h-5 w-5" />
            <span>Record Vitals</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <Pill className="h-5 w-5" />
            <span>Administer Medication</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <Clipboard className="h-5 w-5" />
            <span>Care Plan</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <Bed className="h-5 w-5" />
            <span>Bed Assignment</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <FileText className="h-5 w-5" />
            <span>Document Care</span>
          </Button>
          <Button variant="outline" className="h-24 flex flex-col gap-2 items-center justify-center">
            <UserPlus className="h-5 w-5" />
            <span>Patient Transfer</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
