"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { FileDown, Printer } from "lucide-react"
import { jsPDF } from "jspdf"
import html2canvas from "html2canvas"

interface PatientHistoryProps {
  patientId: string
}

// Mock data for demonstration
const mockPatientData = {
  id: "P-1001",
  name: "John Imbayi",
  age: 45,
  gender: "Male",
  dob: "1978-05-15",
  bloodType: "O+",
  nationalId: "12345678",
  insuranceProvider: "NHIF",
  insuranceNumber: "NHIF-123456789",
}

const mockMedicalHistory = [
  {
    id: "MH001",
    date: "2023-01-15",
    diagnosis: "Hypertension",
    doctor: "Dr. James Ndiwa",
    notes: "Patient presented with elevated blood pressure. Prescribed lisinopril 10mg daily.",
    department: "Cardiology",
  },
  {
    id: "MH002",
    date: "2022-11-03",
    diagnosis: "Acute Bronchitis",
    doctor: "Dr. Sarah Mwangi",
    notes: "Patient had cough and fever for 3 days. Prescribed antibiotics and rest.",
    department: "General Medicine",
  },
  {
    id: "MH003",
    date: "2022-08-22",
    diagnosis: "Sprained Ankle",
    doctor: "Dr. Peter Omondi",
    notes: "Grade 2 sprain of right ankle. RICE therapy recommended. Follow-up in 2 weeks.",
    department: "Orthopedics",
  },
  {
    id: "MH004",
    date: "2022-05-10",
    diagnosis: "Annual Check-up",
    doctor: "Dr. James Ndiwa",
    notes: "All vitals normal. Recommended regular exercise and balanced diet.",
    department: "General Medicine",
  },
  {
    id: "MH005",
    date: "2021-12-18",
    diagnosis: "Influenza",
    doctor: "Dr. Sarah Mwangi",
    notes: "Seasonal flu. Prescribed rest, fluids, and paracetamol for fever.",
    department: "General Medicine",
  },
]

const mockMedications = [
  {
    id: "MED001",
    name: "Lisinopril",
    dosage: "10mg",
    frequency: "Once daily",
    startDate: "2023-01-15",
    endDate: "Ongoing",
    prescribedBy: "Dr. James Ndiwa",
  },
  {
    id: "MED002",
    name: "Amoxicillin",
    dosage: "500mg",
    frequency: "Three times daily",
    startDate: "2022-11-03",
    endDate: "2022-11-10",
    prescribedBy: "Dr. Sarah Mwangi",
  },
  {
    id: "MED003",
    name: "Ibuprofen",
    dosage: "400mg",
    frequency: "As needed for pain",
    startDate: "2022-08-22",
    endDate: "2022-09-05",
    prescribedBy: "Dr. Peter Omondi",
  },
]

const mockLabResults = [
  {
    id: "LAB001",
    date: "2023-01-15",
    test: "Complete Blood Count",
    result: "Normal",
    referenceRange: "WBC: 4.5-11.0 x10^9/L",
    notes: "All parameters within normal range",
    orderedBy: "Dr. James Ndiwa",
  },
  {
    id: "LAB002",
    date: "2023-01-15",
    test: "Lipid Profile",
    result: "Abnormal",
    referenceRange: "Total Cholesterol: <200 mg/dL",
    notes: "Elevated LDL cholesterol (145 mg/dL). Dietary changes recommended.",
    orderedBy: "Dr. James Ndiwa",
  },
  {
    id: "LAB003",
    date: "2022-11-03",
    test: "Chest X-Ray",
    result: "Abnormal",
    referenceRange: "N/A",
    notes: "Signs of bronchial inflammation consistent with acute bronchitis.",
    orderedBy: "Dr. Sarah Mwangi",
  },
]

const mockAllergies = [
  {
    id: "ALG001",
    allergen: "Penicillin",
    reaction: "Rash, difficulty breathing",
    severity: "Severe",
    dateIdentified: "2020-05-12",
    notes: "Avoid all penicillin-based antibiotics",
  },
  {
    id: "ALG002",
    allergen: "Peanuts",
    reaction: "Hives, swelling",
    severity: "Moderate",
    dateIdentified: "2018-03-20",
    notes: "Patient carries epinephrine auto-injector",
  },
]

const mockImmunizations = [
  {
    id: "IMM001",
    vaccine: "Influenza",
    date: "2022-10-05",
    administeredBy: "Nurse Jane Kamau",
    location: "Kiplombe Medical Centre",
    lotNumber: "FL2022-456",
  },
  {
    id: "IMM002",
    vaccine: "COVID-19 (Pfizer)",
    date: "2021-06-15",
    administeredBy: "Nurse John Ochieng",
    location: "Kiplombe Medical Centre",
    lotNumber: "PF2021-789",
  },
  {
    id: "IMM003",
    vaccine: "COVID-19 (Pfizer) - 2nd dose",
    date: "2021-07-06",
    administeredBy: "Nurse Jane Kamau",
    location: "Kiplombe Medical Centre",
    lotNumber: "PF2021-901",
  },
  {
    id: "IMM004",
    vaccine: "Tetanus Booster",
    date: "2019-03-12",
    administeredBy: "Dr. Peter Omondi",
    location: "Kiplombe Medical Centre",
    lotNumber: "TT2019-234",
  },
]

export function PatientHistory({ patientId }: PatientHistoryProps) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // In a real application, you would fetch this data based on the patientId
  const patient = mockPatientData
  const medicalHistory = mockMedicalHistory
  const medications = mockMedications
  const labResults = mockLabResults
  const allergies = mockAllergies
  const immunizations = mockImmunizations

  const generatePDF = async () => {
    setIsGeneratingPdf(true)

    try {
      const element = document.getElementById("patient-history-content")
      if (!element) {
        console.error("Could not find element to convert to PDF")
        return
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
      })

      const imgData = canvas.toDataURL("image/png")

      // A4 size: 210 x 297 mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add new pages if content overflows
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      pdf.save(`${patient.name.replace(/\s+/g, "_")}_Medical_History.pdf`)
    } catch (error) {
      console.error("Error generating PDF:", error)
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const printHistory = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Patient Medical History</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={printHistory} className="print:hidden">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button onClick={generatePDF} disabled={isGeneratingPdf} className="print:hidden">
            <FileDown className="mr-2 h-4 w-4" />
            {isGeneratingPdf ? "Generating PDF..." : "Download PDF"}
          </Button>
        </div>
      </div>

      <div id="patient-history-content" className="space-y-6">
        {/* Patient Information Header */}
        <Card>
          <CardHeader>
            <CardTitle>Patient Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Patient ID</p>
                <p className="font-medium">{patient.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{patient.dob}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium">{patient.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Blood Type</p>
                <p className="font-medium">{patient.bloodType}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">National ID</p>
                <p className="font-medium">{patient.nationalId}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical History Tabs */}
        <Tabs defaultValue="diagnoses" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
            <TabsTrigger value="diagnoses">Diagnoses</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
            <TabsTrigger value="lab-results">Lab Results</TabsTrigger>
            <TabsTrigger value="allergies">Allergies</TabsTrigger>
            <TabsTrigger value="immunizations">Immunizations</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnoses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Diagnoses & Treatments</CardTitle>
                <CardDescription>History of all diagnoses and treatments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {medicalHistory.map((record) => (
                    <div key={record.id} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{record.diagnosis}</h3>
                        <span className="text-sm text-muted-foreground">{record.date}</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Doctor:</span> {record.doctor}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Department:</span> {record.department}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span> {record.notes}
                      </p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Medication History</CardTitle>
                <CardDescription>Current and past medications</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {medications.map((medication) => (
                    <div key={medication.id} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">
                          {medication.name} ({medication.dosage})
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {medication.startDate} - {medication.endDate}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Frequency:</span> {medication.frequency}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Prescribed by:</span> {medication.prescribedBy}
                      </p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lab-results" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Laboratory Results</CardTitle>
                <CardDescription>History of laboratory and diagnostic tests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {labResults.map((result) => (
                    <div key={result.id} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{result.test}</h3>
                        <span className="text-sm text-muted-foreground">{result.date}</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Result:</span>{" "}
                        <span className={result.result === "Abnormal" ? "text-red-500 font-medium" : ""}>
                          {result.result}
                        </span>
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Reference Range:</span> {result.referenceRange}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span> {result.notes}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Ordered by:</span> {result.orderedBy}
                      </p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="allergies" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Allergies</CardTitle>
                <CardDescription>Known allergies and reactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {allergies.map((allergy) => (
                    <div key={allergy.id} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{allergy.allergen}</h3>
                        <span
                          className={`text-sm font-medium ${
                            allergy.severity === "Severe"
                              ? "text-red-500"
                              : allergy.severity === "Moderate"
                                ? "text-amber-500"
                                : "text-yellow-500"
                          }`}
                        >
                          {allergy.severity}
                        </span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Reaction:</span> {allergy.reaction}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Identified:</span> {allergy.dateIdentified}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Notes:</span> {allergy.notes}
                      </p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="immunizations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Immunization History</CardTitle>
                <CardDescription>Record of vaccinations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {immunizations.map((immunization) => (
                    <div key={immunization.id} className="space-y-2">
                      <div className="flex justify-between">
                        <h3 className="font-semibold">{immunization.vaccine}</h3>
                        <span className="text-sm text-muted-foreground">{immunization.date}</span>
                      </div>
                      <p className="text-sm">
                        <span className="font-medium">Administered by:</span> {immunization.administeredBy}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Location:</span> {immunization.location}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Lot Number:</span> {immunization.lotNumber}
                      </p>
                      <Separator className="mt-4" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
