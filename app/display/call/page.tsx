import { PatientCallDisplay } from "@/components/patient-call-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getServicePointName } from "@/lib/data/queue-data"
import type { ServicePoint } from "@/lib/data/queue-data"

export default function PatientCallDisplayPage() {
  const servicePoints: ServicePoint[] = ["triage", "consultation", "laboratory", "radiology", "pharmacy", "billing"]

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold text-center mb-6">Patient Call Display</h1>

      <Tabs defaultValue="triage" className="w-full">
        <TabsList className="w-full">
          {servicePoints.map((point) => (
            <TabsTrigger key={point} value={point} className="flex-1">
              {getServicePointName(point)}
            </TabsTrigger>
          ))}
        </TabsList>

        {servicePoints.map((point) => (
          <TabsContent key={point} value={point} className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <PatientCallDisplay servicePoint={point} counterNumber={1} />
              <PatientCallDisplay servicePoint={point} counterNumber={2} />
              <PatientCallDisplay servicePoint={point} counterNumber={3} />
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
