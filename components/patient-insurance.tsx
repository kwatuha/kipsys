import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, FileText } from "lucide-react"

type Insurance = {
  provider: string
  policyNumber: string
  groupNumber: string
  startDate: string
  endDate: string
  policyHolder: string
  relationship: string
  coverageType: string
  status: string
  contactNumber: string
  notes: string
}

// Mock data for demonstration
const insuranceInfo: Insurance = {
  provider: "NHIF",
  policyNumber: "NHIF-123456789",
  groupNumber: "GRP-001",
  startDate: "2022-01-01",
  endDate: "2023-12-31",
  policyHolder: "John Imbayi",
  relationship: "Self",
  coverageType: "Comprehensive",
  status: "Active",
  contactNumber: "+254 20 123 4567",
  notes: "Annual renewal required",
}

export function PatientInsurance({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the insurance data based on the patient ID
  // const { data: insurance, isLoading, error } = usePatientInsurance(patientId)

  const insurance = insuranceInfo // Using mock data for demonstration

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Insurance Information</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-1" />
              Verify Coverage
            </Button>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Insurance Provider</div>
            <div className="font-medium">{insurance.provider}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Status</div>
            <div>
              <Badge variant={insurance.status === "Active" ? "default" : "outline"}>{insurance.status}</Badge>
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Policy Number</div>
            <div className="font-medium">{insurance.policyNumber}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Group Number</div>
            <div className="font-medium">{insurance.groupNumber}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Policy Holder</div>
            <div className="font-medium">{insurance.policyHolder}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Relationship to Patient</div>
            <div className="font-medium">{insurance.relationship}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Coverage Type</div>
            <div className="font-medium">{insurance.coverageType}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Contact Number</div>
            <div className="font-medium">{insurance.contactNumber}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Start Date</div>
            <div className="font-medium">{insurance.startDate}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">End Date</div>
            <div className="font-medium">{insurance.endDate}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm font-medium text-muted-foreground">Notes</div>
            <div className="font-medium">{insurance.notes}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
