import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"

type Admission = {
  id: string
  admissionDate: string
  dischargeDate: string | null
  ward: string
  bedNumber: string
  admittingDoctor: string
  diagnosis: string
  status: string
  notes: string
  department: string
}

// Mock data for demonstration
const admissions: Admission[] = [
  {
    id: "ADM-1001",
    admissionDate: "2023-01-15",
    dischargeDate: "2023-01-20",
    ward: "Cardiology",
    bedNumber: "C-105",
    admittingDoctor: "Dr. James Ndiwa",
    diagnosis: "Acute Myocardial Infarction",
    status: "Discharged",
    notes: "Patient responded well to treatment",
    department: "Cardiology",
  },
  {
    id: "ADM-950",
    admissionDate: "2022-10-05",
    dischargeDate: "2022-10-12",
    ward: "General Medicine",
    bedNumber: "G-210",
    admittingDoctor: "Dr. Sarah Isuvi",
    diagnosis: "Pneumonia",
    status: "Discharged",
    notes: "Completed antibiotic course",
    department: "Internal Medicine",
  },
  {
    id: "ADM-875",
    admissionDate: "2022-07-20",
    dischargeDate: "2022-07-25",
    ward: "Surgical",
    bedNumber: "S-305",
    admittingDoctor: "Dr. Michael Siva",
    diagnosis: "Appendicitis",
    status: "Discharged",
    notes: "Successful appendectomy performed",
    department: "Surgery",
  },
  {
    id: "ADM-1050",
    admissionDate: "2023-04-28",
    dischargeDate: null,
    ward: "ICU",
    bedNumber: "ICU-03",
    admittingDoctor: "Dr. James Ndiwa",
    diagnosis: "Congestive Heart Failure",
    status: "Current",
    notes: "Patient under observation",
    department: "Intensive Care",
  },
]

export function PatientAdmissions({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the admissions data based on the patient ID
  // const { data: admissionData, isLoading, error } = usePatientAdmissions(patientId)

  const admissionData = admissions // Using mock data for demonstration
  const currentAdmission = admissionData.find((adm) => adm.status === "Current")
  const pastAdmissions = admissionData.filter((adm) => adm.status === "Discharged")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hospital Admissions</CardTitle>
        <CardDescription>Current and previous hospital stays</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {currentAdmission && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Admission</h3>
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Admission ID</div>
                    <div className="font-medium">{currentAdmission.id}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Admission Date</div>
                    <div className="font-medium">{currentAdmission.admissionDate}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Ward</div>
                    <div className="font-medium">{currentAdmission.ward}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Bed Number</div>
                    <div className="font-medium">{currentAdmission.bedNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Admitting Doctor</div>
                    <div className="font-medium">{currentAdmission.admittingDoctor}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Department</div>
                    <div className="font-medium">{currentAdmission.department}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Diagnosis</div>
                    <div className="font-medium">{currentAdmission.diagnosis}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Notes</div>
                    <div className="font-medium">{currentAdmission.notes}</div>
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button size="sm">View Details</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Admission History</h3>
          {pastAdmissions.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Admission ID</TableHead>
                    <TableHead>Admission Date</TableHead>
                    <TableHead>Discharge Date</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead>Diagnosis</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pastAdmissions.map((admission) => (
                    <TableRow key={admission.id}>
                      <TableCell className="font-medium">{admission.id}</TableCell>
                      <TableCell>{admission.admissionDate}</TableCell>
                      <TableCell>{admission.dischargeDate}</TableCell>
                      <TableCell>{admission.ward}</TableCell>
                      <TableCell>{admission.diagnosis}</TableCell>
                      <TableCell>{admission.admittingDoctor}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">No previous admissions found</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
