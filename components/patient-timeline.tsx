import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

type TimelineEvent = {
  id: string
  date: string
  time: string
  type: string
  title: string
  description: string
  provider: string
}

// Mock data for demonstration
const timelineEvents: TimelineEvent[] = [
  {
    id: "event-1",
    date: "2023-04-15",
    time: "09:30 AM",
    type: "appointment",
    title: "Cardiology Consultation",
    description: "Regular checkup for hypertension management",
    provider: "Dr. James Ndiwa",
  },
  {
    id: "event-2",
    date: "2023-04-15",
    time: "10:15 AM",
    type: "prescription",
    title: "Medication Prescribed",
    description: "Lisinopril 10mg daily, Aspirin 81mg daily",
    provider: "Dr. James Ndiwa",
  },
  {
    id: "event-3",
    date: "2023-04-15",
    time: "11:00 AM",
    type: "lab",
    title: "Blood Work Ordered",
    description: "Complete blood count, lipid panel, and metabolic panel",
    provider: "Dr. James Ndiwa",
  },
  {
    id: "event-4",
    date: "2023-04-17",
    time: "02:30 PM",
    type: "lab",
    title: "Lab Results Received",
    description: "Cholesterol levels slightly elevated, other results normal",
    provider: "Lab Technician",
  },
  {
    id: "event-5",
    date: "2023-04-20",
    time: "03:45 PM",
    type: "phone",
    title: "Follow-up Call",
    description: "Discussed lab results and medication adjustment",
    provider: "Dr. James Ndiwa",
  },
]

export function PatientTimeline({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the timeline data based on the patient ID
  // const { data: events, isLoading, error } = usePatientTimeline(patientId)

  const events = timelineEvents // Using mock data for demonstration

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Timeline of recent medical events</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div className="relative flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-muted bg-background">
                  <div className="h-2 w-2 rounded-full bg-primary"></div>
                </div>
                {event.id !== events[events.length - 1].id && (
                  <div className="absolute top-8 bottom-0 w-px bg-muted"></div>
                )}
              </div>
              <div className="flex flex-col gap-1 pb-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {event.date} • {event.time}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {event.type}
                  </Badge>
                </div>
                <h4 className="text-sm font-semibold">{event.title}</h4>
                <p className="text-sm text-muted-foreground">{event.description}</p>
                <p className="text-xs text-muted-foreground">Provider: {event.provider}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
