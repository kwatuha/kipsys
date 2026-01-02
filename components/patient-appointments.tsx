import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, MapPin } from "lucide-react"

type Appointment = {
  id: string
  date: string
  time: string
  doctor: string
  department: string
  reason: string
  status: string
  location: string
  notes: string
}

// Mock data for demonstration
const appointments: Appointment[] = [
  {
    id: "apt-1",
    date: "2023-05-20",
    time: "10:30 AM",
    doctor: "Dr. James Ndiwa",
    department: "Cardiology",
    reason: "Follow-up on hypertension",
    status: "Scheduled",
    location: "Main Hospital, Room 305",
    notes: "Bring current medication list",
  },
  {
    id: "apt-2",
    date: "2023-04-15",
    time: "09:30 AM",
    doctor: "Dr. James Ndiwa",
    department: "Cardiology",
    reason: "Regular checkup",
    status: "Completed",
    location: "Main Hospital, Room 305",
    notes: "Patient reported occasional headaches",
  },
  {
    id: "apt-3",
    date: "2023-03-20",
    time: "11:15 AM",
    doctor: "Dr. Sarah Isuvi",
    department: "Internal Medicine",
    reason: "Annual physical",
    status: "Completed",
    location: "Main Hospital, Room 210",
    notes: "All vitals normal, recommended diet changes",
  },
  {
    id: "apt-4",
    date: "2023-02-10",
    time: "02:45 PM",
    doctor: "Dr. Michael Siva",
    department: "Neurology",
    reason: "Headache evaluation",
    status: "Completed",
    location: "Neurology Clinic, Room 110",
    notes: "Prescribed pain medication, ordered MRI",
  },
  {
    id: "apt-5",
    date: "2023-06-15",
    time: "01:30 PM",
    doctor: "Dr. Emily Logovane",
    department: "Ophthalmology",
    reason: "Eye examination",
    status: "Scheduled",
    location: "Eye Clinic, Room 205",
    notes: "Annual eye check",
  },
]

export function PatientAppointments({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the appointments data based on the patient ID
  // const { data: appts, isLoading, error } = usePatientAppointments(patientId)

  const appts = appointments // Using mock data for demonstration
  const upcomingAppts = appts.filter((apt) => apt.status === "Scheduled")
  const pastAppts = appts.filter((apt) => apt.status === "Completed")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appointments</CardTitle>
        <CardDescription>Upcoming and past appointments</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="upcoming" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
            </TabsList>
            <Button size="sm">Schedule New Appointment</Button>
          </div>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingAppts.length > 0 ? (
              <div className="space-y-4">
                {upcomingAppts.map((apt) => (
                  <Card key={apt.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{apt.department}</Badge>
                            <Badge variant="outline">{apt.status}</Badge>
                          </div>
                          <h4 className="text-lg font-semibold">{apt.reason}</h4>
                          <p className="text-sm text-muted-foreground">with {apt.doctor}</p>

                          <div className="flex flex-col sm:flex-row gap-4 text-sm mt-2">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{apt.date}</span>
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{apt.time}</span>
                            </div>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                              <span>{apt.location}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            Reschedule
                          </Button>
                          <Button variant="outline" size="sm">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No upcoming appointments found</div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastAppts.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastAppts.map((apt) => (
                      <TableRow key={apt.id}>
                        <TableCell>{apt.date}</TableCell>
                        <TableCell>{apt.time}</TableCell>
                        <TableCell>{apt.doctor}</TableCell>
                        <TableCell>{apt.department}</TableCell>
                        <TableCell>{apt.reason}</TableCell>
                        <TableCell>{apt.notes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No past appointments found</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
