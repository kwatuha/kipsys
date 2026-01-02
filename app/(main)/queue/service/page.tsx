import { CallPatientPanel } from "@/components/call-patient-panel"
import { QueueDisplay } from "@/components/queue-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getServicePointName } from "@/lib/data/queue-data"
import type { ServicePoint } from "@/lib/data/queue-data"

export default function ServicePointDashboard() {
  // In a real app, this would be determined by the logged-in user's role
  const staffName = "Dr. James Ndiwa"

  // Service points this staff member can serve - make sure triage is first
  const servicePoints: ServicePoint[] = ["triage", "consultation", "laboratory", "radiology", "pharmacy", "cashier"]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Service Point Dashboard</h1>
        <p className="text-muted-foreground">Manage patient queue and service delivery</p>
      </div>

      <Tabs defaultValue="triage" className="w-full">
        <div className="relative mb-6">
          <ScrollArea className="w-full whitespace-nowrap">
            <TabsList className="inline-flex h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
              {servicePoints.map((point) => (
                <TabsTrigger
                  key={point}
                  value={point}
                  className="relative h-12 rounded-none border-b-2 border-b-transparent bg-transparent px-6 pb-3 pt-3 font-medium text-muted-foreground shadow-none transition-none data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
                >
                  {getServicePointName(point)}
                </TabsTrigger>
              ))}
            </TabsList>
            <ScrollBar orientation="horizontal" className="invisible" />
          </ScrollArea>
        </div>

        {servicePoints.map((point) => (
          <TabsContent key={point} value={point} className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <CallPatientPanel servicePoint={point} staffName={staffName} counterNumber={1} />
              </div>
              <div className="lg:col-span-2">
                <QueueDisplay initialServicePoint={point} />
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
