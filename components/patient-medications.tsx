import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type Medication = {
  id: string
  name: string
  dosage: string
  frequency: string
  startDate: string
  endDate: string | null
  status: string
  prescribedBy: string
  instructions: string
  reason: string
  dispensed: boolean
}

// Mock data for demonstration
const medications: Medication[] = [
  {
    id: "med-1",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: "2023-04-15",
    endDate: null,
    status: "Active",
    prescribedBy: "Dr. James Ndiwa",
    instructions: "Take in the morning with food",
    reason: "Hypertension",
    dispensed: true,
  },
  {
    id: "med-2",
    name: "Aspirin",
    dosage: "81mg",
    frequency: "Once daily",
    startDate: "2023-04-15",
    endDate: null,
    status: "Active",
    prescribedBy: "Dr. James Ndiwa",
    instructions: "Take with food",
    reason: "Cardiovascular prophylaxis",
    dispensed: true,
  },
  {
    id: "med-3",
    name: "Atorvastatin",
    dosage: "20mg",
    frequency: "Once daily at bedtime",
    startDate: "2023-04-15",
    endDate: null,
    status: "Active",
    prescribedBy: "Dr. James Ndiwa",
    instructions: "Take at night",
    reason: "Hyperlipidemia",
    dispensed: false,
  },
  {
    id: "med-4",
    name: "Metformin",
    dosage: "500mg",
    frequency: "Twice daily",
    startDate: "2022-10-10",
    endDate: "2023-01-15",
    status: "Discontinued",
    prescribedBy: "Dr. Sarah Isuvi",
    instructions: "Take with meals",
    reason: "Type 2 Diabetes",
    dispensed: true,
  },
  {
    id: "med-5",
    name: "Amoxicillin",
    dosage: "500mg",
    frequency: "Three times daily",
    startDate: "2022-08-05",
    endDate: "2022-08-12",
    status: "Completed",
    prescribedBy: "Dr. Michael Siva",
    instructions: "Take until completed",
    reason: "Bacterial infection",
    dispensed: true,
  },
]

export function PatientMedications({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the medications data based on the patient ID
  // const { data: meds, isLoading, error } = usePatientMedications(patientId)

  const meds = medications // Using mock data for demonstration
  const activeMeds = meds.filter((med) => med.status === "Active")
  const pastMeds = meds.filter((med) => med.status !== "Active")
  const pendingMeds = meds.filter((med) => !med.dispensed)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Medications</CardTitle>
        <CardDescription>Current and past medication history</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="space-y-4">
          <TabsList>
            <TabsTrigger value="current">Current Medications</TabsTrigger>
            <TabsTrigger value="past">Past Medications</TabsTrigger>
            <TabsTrigger value="pending">Pending Dispensing</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="space-y-4">
            {activeMeds.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>Prescribed By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeMeds.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.frequency}</TableCell>
                        <TableCell>{med.startDate}</TableCell>
                        <TableCell>{med.prescribedBy}</TableCell>
                        <TableCell>{med.reason}</TableCell>
                        <TableCell>
                          <Badge variant="default">{med.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No active medications found</div>
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4">
            {pastMeds.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Medication</TableHead>
                      <TableHead>Dosage</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead>Prescribed By</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastMeds.map((med) => (
                      <TableRow key={med.id}>
                        <TableCell className="font-medium">{med.name}</TableCell>
                        <TableCell>{med.dosage}</TableCell>
                        <TableCell>{med.startDate}</TableCell>
                        <TableCell>{med.endDate}</TableCell>
                        <TableCell>{med.prescribedBy}</TableCell>
                        <TableCell>{med.reason}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{med.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No past medications found</div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingMeds.length > 0 ? (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Attention Required</AlertTitle>
                  <AlertDescription>
                    The following medications have been prescribed but not yet dispensed by the pharmacy.
                  </AlertDescription>
                </Alert>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Prescribed On</TableHead>
                        <TableHead>Prescribed By</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingMeds.map((med) => (
                        <TableRow key={med.id}>
                          <TableCell className="font-medium">{med.name}</TableCell>
                          <TableCell>{med.dosage}</TableCell>
                          <TableCell>{med.frequency}</TableCell>
                          <TableCell>{med.startDate}</TableCell>
                          <TableCell>{med.prescribedBy}</TableCell>
                          <TableCell>{med.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No pending medications found</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
