"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Download, Eye } from "lucide-react"

type LabTest = {
  id: string
  date: string
  time: string
  testName: string
  category: string
  status: string
  results: LabResult[]
  orderedBy: string
  performedBy: string
  reportUrl: string
}

type LabResult = {
  parameter: string
  value: string
  unit: string
  referenceRange: string
  flag: string
}

// Mock data for demonstration
const labTests: LabTest[] = [
  {
    id: "lab-1",
    date: "2023-04-17",
    time: "02:30 PM",
    testName: "Complete Blood Count (CBC)",
    category: "Hematology",
    status: "Completed",
    results: [
      { parameter: "WBC", value: "7.5", unit: "x10^9/L", referenceRange: "4.0-11.0", flag: "Normal" },
      { parameter: "RBC", value: "4.8", unit: "x10^12/L", referenceRange: "4.5-5.5", flag: "Normal" },
      { parameter: "Hemoglobin", value: "14.2", unit: "g/dL", referenceRange: "13.5-17.5", flag: "Normal" },
      { parameter: "Hematocrit", value: "42", unit: "%", referenceRange: "41-50", flag: "Normal" },
      { parameter: "Platelets", value: "250", unit: "x10^9/L", referenceRange: "150-450", flag: "Normal" },
    ],
    orderedBy: "Dr. James Ndiwa",
    performedBy: "Lab Technician John Doe",
    reportUrl: "#",
  },
  {
    id: "lab-2",
    date: "2023-04-17",
    time: "02:30 PM",
    testName: "Lipid Panel",
    category: "Chemistry",
    status: "Completed",
    results: [
      { parameter: "Total Cholesterol", value: "210", unit: "mg/dL", referenceRange: "<200", flag: "High" },
      { parameter: "HDL Cholesterol", value: "45", unit: "mg/dL", referenceRange: ">40", flag: "Normal" },
      { parameter: "LDL Cholesterol", value: "130", unit: "mg/dL", referenceRange: "<100", flag: "High" },
      { parameter: "Triglycerides", value: "150", unit: "mg/dL", referenceRange: "<150", flag: "Normal" },
    ],
    orderedBy: "Dr. James Ndiwa",
    performedBy: "Lab Technician Jane Smith",
    reportUrl: "#",
  },
  {
    id: "lab-3",
    date: "2023-04-17",
    time: "02:30 PM",
    testName: "Comprehensive Metabolic Panel",
    category: "Chemistry",
    status: "Completed",
    results: [
      { parameter: "Glucose", value: "95", unit: "mg/dL", referenceRange: "70-99", flag: "Normal" },
      { parameter: "BUN", value: "15", unit: "mg/dL", referenceRange: "7-20", flag: "Normal" },
      { parameter: "Creatinine", value: "0.9", unit: "mg/dL", referenceRange: "0.6-1.2", flag: "Normal" },
      { parameter: "Sodium", value: "140", unit: "mmol/L", referenceRange: "135-145", flag: "Normal" },
      { parameter: "Potassium", value: "4.0", unit: "mmol/L", referenceRange: "3.5-5.0", flag: "Normal" },
      { parameter: "Calcium", value: "9.5", unit: "mg/dL", referenceRange: "8.5-10.5", flag: "Normal" },
    ],
    orderedBy: "Dr. James Ndiwa",
    performedBy: "Lab Technician John Doe",
    reportUrl: "#",
  },
  {
    id: "lab-4",
    date: "2023-02-10",
    time: "10:15 AM",
    testName: "Urinalysis",
    category: "Urine",
    status: "Completed",
    results: [
      { parameter: "Color", value: "Yellow", unit: "", referenceRange: "Yellow", flag: "Normal" },
      { parameter: "Clarity", value: "Clear", unit: "", referenceRange: "Clear", flag: "Normal" },
      { parameter: "pH", value: "6.0", unit: "", referenceRange: "4.5-8.0", flag: "Normal" },
      { parameter: "Protein", value: "Negative", unit: "", referenceRange: "Negative", flag: "Normal" },
      { parameter: "Glucose", value: "Negative", unit: "", referenceRange: "Negative", flag: "Normal" },
    ],
    orderedBy: "Dr. Sarah Isuvi",
    performedBy: "Lab Technician Jane Smith",
    reportUrl: "#",
  },
  {
    id: "lab-5",
    date: "2022-12-05",
    time: "09:45 AM",
    testName: "Liver Function Tests",
    category: "Chemistry",
    status: "Completed",
    results: [
      { parameter: "ALT", value: "30", unit: "U/L", referenceRange: "7-56", flag: "Normal" },
      { parameter: "AST", value: "25", unit: "U/L", referenceRange: "5-40", flag: "Normal" },
      { parameter: "ALP", value: "70", unit: "U/L", referenceRange: "44-147", flag: "Normal" },
      { parameter: "Total Bilirubin", value: "0.8", unit: "mg/dL", referenceRange: "0.1-1.2", flag: "Normal" },
    ],
    orderedBy: "Dr. James Ndiwa",
    performedBy: "Lab Technician John Doe",
    reportUrl: "#",
  },
]

// Pending lab tests
const pendingLabTests = [
  {
    id: "pending-1",
    date: "2023-04-20",
    time: "10:00 AM",
    testName: "Hemoglobin A1C",
    category: "Chemistry",
    status: "Pending",
    orderedBy: "Dr. James Ndiwa",
  },
  {
    id: "pending-2",
    date: "2023-04-20",
    time: "10:00 AM",
    testName: "Thyroid Function Panel",
    category: "Endocrinology",
    status: "In Progress",
    orderedBy: "Dr. James Ndiwa",
  },
]

export function PatientLabResults({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the lab data based on the patient ID
  // const { data: labs, isLoading, error } = usePatientLabResults(patientId)

  const labs = labTests // Using mock data for demonstration
  const pending = pendingLabTests // Using mock data for demonstration

  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null)
  const [viewResultsOpen, setViewResultsOpen] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Laboratory Results</CardTitle>
          <CardDescription>Complete history of laboratory tests and results</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="completed" className="space-y-4">
            <TabsList>
              <TabsTrigger value="completed">Completed Tests</TabsTrigger>
              <TabsTrigger value="pending">Pending Tests</TabsTrigger>
            </TabsList>

            <TabsContent value="completed" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {labs.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          {test.date}
                          <div className="text-xs text-muted-foreground">{test.time}</div>
                        </TableCell>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>{test.category}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{test.status}</Badge>
                        </TableCell>
                        <TableCell>{test.orderedBy}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedTest(test)
                                setViewResultsOpen(true)
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date Ordered</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pending.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell>
                          {test.date}
                          <div className="text-xs text-muted-foreground">{test.time}</div>
                        </TableCell>
                        <TableCell>{test.testName}</TableCell>
                        <TableCell>{test.category}</TableCell>
                        <TableCell>
                          <Badge variant={test.status === "Pending" ? "outline" : "secondary"}>{test.status}</Badge>
                        </TableCell>
                        <TableCell>{test.orderedBy}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={viewResultsOpen} onOpenChange={setViewResultsOpen}>
        {selectedTest && (
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedTest.testName} Results</DialogTitle>
              <DialogDescription>
                Test performed on {selectedTest.date} at {selectedTest.time}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Ordered By</p>
                  <p className="font-medium">{selectedTest.orderedBy}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Performed By</p>
                  <p className="font-medium">{selectedTest.performedBy}</p>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Result</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Reference Range</TableHead>
                      <TableHead>Flag</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedTest.results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>{result.parameter}</TableCell>
                        <TableCell className="font-medium">{result.value}</TableCell>
                        <TableCell>{result.unit}</TableCell>
                        <TableCell>{result.referenceRange}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              result.flag === "Normal"
                                ? "outline"
                                : result.flag === "High" || result.flag === "Low"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {result.flag}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  Download Full Report
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
