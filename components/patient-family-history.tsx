import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

type FamilyHistory = {
  id: string
  relation: string
  condition: string
  ageAtDiagnosis: string
  status: string
  notes: string
}

// Mock data for demonstration
const familyHistoryData: FamilyHistory[] = [
  {
    id: "fh-1",
    relation: "Father",
    condition: "Hypertension",
    ageAtDiagnosis: "45",
    status: "Living",
    notes: "Well controlled with medication",
  },
  {
    id: "fh-2",
    relation: "Mother",
    condition: "Type 2 Diabetes",
    ageAtDiagnosis: "50",
    status: "Living",
    notes: "Diet controlled",
  },
  {
    id: "fh-3",
    relation: "Paternal Grandfather",
    condition: "Coronary Artery Disease",
    ageAtDiagnosis: "60",
    status: "Deceased",
    notes: "Died at age 72 from heart attack",
  },
  {
    id: "fh-4",
    relation: "Maternal Aunt",
    condition: "Breast Cancer",
    ageAtDiagnosis: "55",
    status: "Living",
    notes: "In remission after treatment",
  },
]

export function PatientFamilyHistory({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the family history data based on the patient ID
  // const { data: familyHistory, isLoading, error } = usePatientFamilyHistory(patientId)

  const familyHistory = familyHistoryData // Using mock data for demonstration

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Family Medical History</h3>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Entry
          </Button>
        </div>

        {familyHistory.length > 0 ? (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Relation</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Age at Diagnosis</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familyHistory.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.relation}</TableCell>
                    <TableCell>{entry.condition}</TableCell>
                    <TableCell>{entry.ageAtDiagnosis}</TableCell>
                    <TableCell>{entry.status}</TableCell>
                    <TableCell>{entry.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">No family history recorded for this patient</div>
        )}
      </CardContent>
    </Card>
  )
}
