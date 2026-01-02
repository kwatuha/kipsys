import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { QueueDisplay } from "@/components/queue-display"
import { AddToQueueForm } from "@/components/add-to-queue-form"
import { Monitor, Users } from "lucide-react"

export default function QueueManagement() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Queue Management</h1>
        <p className="text-muted-foreground">Manage patient queues across different service points</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <QueueDisplay />
        </div>
        <div className="md:col-span-1 space-y-6">
          <AddToQueueForm />

          <Card>
            <CardHeader>
              <CardTitle>Queue Summary</CardTitle>
              <CardDescription>Overview of all service points</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Triage</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">2</div>
                      <div className="text-xs text-muted-foreground">Avg: 10 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Consultation</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">2</div>
                      <div className="text-xs text-muted-foreground">Avg: 15 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Laboratory</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-xs text-muted-foreground">Avg: 30 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Radiology</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-xs text-muted-foreground">Avg: 45 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Pharmacy</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-xs text-muted-foreground">Avg: 10 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Cashier</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">3</div>
                      <div className="text-xs text-muted-foreground">Avg: 5 min</div>
                    </div>
                  </div>
                  <div className="rounded-lg border p-3">
                    <div className="text-xs font-medium text-muted-foreground">Billing</div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="text-2xl font-bold">1</div>
                      <div className="text-xs text-muted-foreground">Avg: 8 min</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <div className="text-xs font-medium">Total Patients in Queue</div>
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-2xl font-bold">11</div>
                    <div className="flex items-center gap-1 text-xs">
                      <span className="rounded-full bg-red-500 h-2 w-2"></span>
                      <span className="text-muted-foreground">1 Emergency</span>
                      <span className="rounded-full bg-amber-500 h-2 w-2 ml-2"></span>
                      <span className="text-muted-foreground">3 Urgent</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href="/queue/service">
                  <Users className="mr-2 h-4 w-4" />
                  Service Point Dashboard
                </Link>
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Queue Displays</CardTitle>
              <CardDescription>Access queue displays for different areas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/display">
                  <Monitor className="mr-2 h-4 w-4" />
                  Waiting Area Display
                </Link>
              </Button>
              <Button asChild className="w-full justify-start" variant="outline">
                <Link href="/display/call">
                  <Users className="mr-2 h-4 w-4" />
                  Service Point Display
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
