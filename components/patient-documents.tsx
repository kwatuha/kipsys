import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye } from "lucide-react"

type Document = {
  id: string
  name: string
  type: string
  date: string
  uploadedBy: string
  size: string
  category: string
}

// Mock data for demonstration
const documents: Document[] = [
  {
    id: "doc-1",
    name: "Discharge Summary - Jan 2023",
    type: "PDF",
    date: "2023-01-20",
    uploadedBy: "Dr. James Ndiwa",
    size: "1.2 MB",
    category: "Discharge Summary",
  },
  {
    id: "doc-2",
    name: "ECG Report",
    type: "PDF",
    date: "2023-01-15",
    uploadedBy: "Nurse Jane Kamau",
    size: "0.8 MB",
    category: "Diagnostic Report",
  },
  {
    id: "doc-3",
    name: "Chest X-Ray",
    type: "DICOM",
    date: "2023-01-16",
    uploadedBy: "Radiology Dept",
    size: "15.5 MB",
    category: "Imaging",
  },
  {
    id: "doc-4",
    name: "Blood Test Results",
    type: "PDF",
    date: "2023-01-17",
    uploadedBy: "Laboratory",
    size: "0.5 MB",
    category: "Laboratory Report",
  },
  {
    id: "doc-5",
    name: "Consent Form",
    type: "PDF",
    date: "2023-01-15",
    uploadedBy: "Admin Staff",
    size: "0.3 MB",
    category: "Administrative",
  },
  {
    id: "doc-6",
    name: "Surgical Report",
    type: "PDF",
    date: "2022-07-20",
    uploadedBy: "Dr. Michael Siva",
    size: "1.5 MB",
    category: "Procedure Report",
  },
  {
    id: "doc-7",
    name: "Insurance Claim Form",
    type: "PDF",
    date: "2023-01-21",
    uploadedBy: "Billing Dept",
    size: "0.4 MB",
    category: "Billing",
  },
]

export function PatientDocuments({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the documents data based on the patient ID
  // const { data: docs, isLoading, error } = usePatientDocuments(patientId)

  const docs = documents // Using mock data for demonstration

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Medical Documents</h3>
          <Button size="sm">Upload Document</Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Uploaded By</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {docs.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell className="font-medium">{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.category}</Badge>
                  </TableCell>
                  <TableCell>{doc.date}</TableCell>
                  <TableCell>{doc.type}</TableCell>
                  <TableCell>{doc.size}</TableCell>
                  <TableCell>{doc.uploadedBy}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
