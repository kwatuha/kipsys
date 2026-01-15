"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  Activity,
  Calendar,
  ClipboardList,
  CreditCard,
  FileText,
  FlaskRoundIcon as Flask,
  HeartPulse,
  History,
  Home,
  PillIcon as Pills,
  Stethoscope,
  Package,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PatientTimeline } from "@/components/patient-timeline"
import { PatientVitals } from "@/components/patient-vitals"
import { PatientAlerts } from "@/components/patient-alerts"
import { PatientMedicalOverview } from "@/components/patient-medical-overview"
import { PatientLabResults } from "@/components/patient-lab-results"
import { PatientMedications } from "@/components/patient-medications"
import { PatientProcedures } from "@/components/patient-procedures"
import { PatientOrders } from "@/components/patient-orders"
import { PatientAppointments } from "@/components/patient-appointments"
import { PatientBilling } from "@/components/patient-billing"
import { PatientAdmissions } from "@/components/patient-admissions"
import { PatientDocuments } from "@/components/patient-documents"
import { PatientAllergies } from "@/components/patient-allergies"
import { PatientInsurance } from "@/components/patient-insurance"
import { PatientFamilyHistory } from "@/components/patient-family-history"
import { PatientQueueStatus } from "@/components/patient-queue-status"
import { patientApi, insuranceApi } from "@/lib/api"
import Link from "next/link"

export default function PatientProfilePage() {
  const params = useParams()
  const patientId = params.id as string
  const [patient, setPatient] = useState<any>(null)
  const [insuranceCompanyName, setInsuranceCompanyName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPatient()
  }, [patientId])

  const loadPatient = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await patientApi.getById(patientId)
      setPatient(data)

      // Fetch insurance company name if insuranceCompanyId exists
      if (data.insuranceCompanyId) {
        try {
          const provider = await insuranceApi.getProviderById(data.insuranceCompanyId.toString())
          setInsuranceCompanyName(provider.providerName || null)
        } catch (err) {
          console.error('Error loading insurance provider:', err)
          setInsuranceCompanyName(null)
        }
      } else {
        setInsuranceCompanyName(null)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load patient')
      console.error('Error loading patient:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (dateOfBirth?: string): number | null => {
    if (!dateOfBirth) return null
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const getInitials = (firstName?: string, lastName?: string): string => {
    const first = firstName?.charAt(0) || ''
    const last = lastName?.charAt(0) || ''
    return (first + last).toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8">Loading patient data...</div>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col gap-6">
        <div className="text-center py-8 text-red-500">
          {error || 'Patient not found'}
        </div>
        <Button onClick={loadPatient}>Retry</Button>
      </div>
    )
  }

  // Transform API data to match component expectations
  const getInsuranceDisplay = () => {
    if (patient.patientType === 'insurance') {
      const providerName = insuranceCompanyName || 'Unknown Provider'
      const insuranceNum = patient.insuranceNumber || 'N/A'
      return `${providerName}${insuranceNum !== 'N/A' ? ` - ${insuranceNum}` : ''}`
    }
    return 'Paying Patient'
  }

  const patientDisplay = {
    id: patient.patientNumber,
    name: `${patient.firstName} ${patient.lastName}`,
    age: calculateAge(patient.dateOfBirth),
    gender: patient.gender,
    dob: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A',
    bloodType: patient.bloodGroup || 'N/A',
    contact: patient.phone || 'N/A',
    email: patient.email || 'N/A',
    address: patient.address || 'N/A',
    emergencyContact: patient.nextOfKinName
      ? `${patient.nextOfKinName} (${patient.nextOfKinRelationship || 'N/A'}) - ${patient.nextOfKinPhone || 'N/A'}`
      : 'N/A',
    occupation: 'N/A', // Not in current schema
    maritalStatus: 'N/A', // Not in current schema
    nationalId: patient.idNumber || 'N/A',
    patientType: patient.patientType || 'paying',
    insuranceProvider: insuranceCompanyName || 'N/A',
    insuranceNumber: patient.insuranceNumber || 'N/A',
    insuranceDisplay: getInsuranceDisplay(),
    registrationDate: patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'N/A',
    status: patient.voided === 0 ? "Active" : "Inactive",
    avatar: "/thoughtful-portrait.png",
    initials: getInitials(patient.firstName, patient.lastName),
    primaryDoctor: 'N/A', // Will be fetched from appointments/doctors
    lastVisit: 'N/A', // Will be calculated from appointments
    nextAppointment: 'N/A', // Will be fetched from appointments
    alerts: [], // Will be populated from allergies and other sources
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Profile</h1>
          <p className="text-muted-foreground">Comprehensive view of patient information and medical history</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={`/patients/${patientId}/history`}>
              <FileText className="mr-2 h-4 w-4" />
              View & Download History
            </Link>
          </Button>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            Export Summary
          </Button>
          <Button>
            <ClipboardList className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Patient Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Patient Information</CardTitle>
            <Badge variant={patientDisplay.status === "Active" ? "default" : "outline"}>{patientDisplay.status}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-3 pb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={patientDisplay.avatar || "/placeholder.svg"} alt={patientDisplay.name} />
                <AvatarFallback>{patientDisplay.initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1 text-center">
                <h3 className="text-xl font-semibold">{patientDisplay.name}</h3>
                <p className="text-sm text-muted-foreground">
                  #{patientDisplay.id} • {patientDisplay.age !== null ? `${patientDisplay.age} years` : 'Age N/A'} • {patientDisplay.gender}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Date of Birth</p>
                  <p className="text-sm font-medium">{patientDisplay.dob}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Blood Type</p>
                  <p className="text-sm font-medium">{patientDisplay.bloodType}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Contact</p>
                <p className="text-sm font-medium">{patientDisplay.contact}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{patientDisplay.email}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Address</p>
                <p className="text-sm font-medium">{patientDisplay.address}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Emergency Contact</p>
                <p className="text-sm font-medium">{patientDisplay.emergencyContact}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Occupation</p>
                  <p className="text-sm font-medium">{patientDisplay.occupation}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Marital Status</p>
                  <p className="text-sm font-medium">{patientDisplay.maritalStatus}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">National ID</p>
                <p className="text-sm font-medium">{patientDisplay.nationalId}</p>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Patient Type</p>
                <p className="text-sm font-medium capitalize">{patientDisplay.patientType}</p>
              </div>
              {patientDisplay.patientType === 'insurance' && (
                <>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Insurance Company</p>
                    <p className="text-sm font-medium">{patientDisplay.insuranceProvider}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Insurance Number</p>
                    <p className="text-sm font-medium">{patientDisplay.insuranceNumber}</p>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Primary Doctor</p>
                <p className="text-sm font-medium">{patientDisplay.primaryDoctor}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Registration Date</p>
                  <p className="text-sm font-medium">{patientDisplay.registrationDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Last Visit</p>
                  <p className="text-sm font-medium">{patientDisplay.lastVisit}</p>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Next Appointment</p>
                <p className="text-sm font-medium">{patientDisplay.nextAppointment}</p>
              </div>

              <PatientQueueStatus patientId={patientDisplay.id} />
            </div>
          </CardContent>
        </Card>

        {/* Patient Medical Information Tabs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Medical Information</CardTitle>
            <CardDescription>Comprehensive medical history and current health status</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-6">
              {/* Improved tab spacing and responsiveness */}
              <TabsList className="flex flex-wrap w-full h-auto p-1 gap-1">
                <TabsTrigger value="overview" className="flex-grow py-2 px-3">
                  <Activity className="h-4 w-4 mr-2" />
                  <span>Overview</span>
                </TabsTrigger>
                <TabsTrigger value="vitals" className="flex-grow py-2 px-3">
                  <HeartPulse className="h-4 w-4 mr-2" />
                  <span>Vitals</span>
                </TabsTrigger>
                <TabsTrigger value="lab" className="flex-grow py-2 px-3">
                  <Flask className="h-4 w-4 mr-2" />
                  <span>Lab Results</span>
                </TabsTrigger>
                <TabsTrigger value="medications" className="flex-grow py-2 px-3">
                  <Pills className="h-4 w-4 mr-2" />
                  <span>Medications</span>
                </TabsTrigger>
                <TabsTrigger value="procedures" className="flex-grow py-2 px-3">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  <span>Procedures</span>
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex-grow py-2 px-3">
                  <Package className="h-4 w-4 mr-2" />
                  <span>Orders</span>
                </TabsTrigger>
                <TabsTrigger value="appointments" className="flex-grow py-2 px-3">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>Appointments</span>
                </TabsTrigger>
                <TabsTrigger value="billing" className="flex-grow py-2 px-3">
                  <CreditCard className="h-4 w-4 mr-2" />
                  <span>Billing</span>
                </TabsTrigger>
                <TabsTrigger value="admissions" className="flex-grow py-2 px-3">
                  <Home className="h-4 w-4 mr-2" />
                  <span>Admissions</span>
                </TabsTrigger>
                <TabsTrigger value="more" className="flex-grow py-2 px-3">
                  <History className="h-4 w-4 mr-2" />
                  <span>More</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <PatientMedicalOverview patientId={patientId} />
              </TabsContent>

              <TabsContent value="vitals" className="space-y-4">
                <PatientVitals patientId={patientId} />
              </TabsContent>

              <TabsContent value="lab" className="space-y-4">
                <PatientLabResults patientId={patientId} />
              </TabsContent>

              <TabsContent value="medications" className="space-y-4">
                <PatientMedications patientId={patientId} />
              </TabsContent>

              <TabsContent value="procedures" className="space-y-4">
                <PatientProcedures patientId={patientId} />
              </TabsContent>

              <TabsContent value="orders" className="space-y-4">
                <PatientOrders patientId={patientId} />
              </TabsContent>

              <TabsContent value="appointments" className="space-y-4">
                <PatientAppointments patientId={patientId} />
              </TabsContent>

              <TabsContent value="billing" className="space-y-4">
                <PatientBilling patientId={patientId} />
              </TabsContent>

              <TabsContent value="admissions" className="space-y-4">
                <PatientAdmissions patientId={patientId} />
              </TabsContent>

              <TabsContent value="more" className="space-y-4">
                <Tabs defaultValue="documents" className="space-y-4">
                  {/* Improved secondary tabs spacing */}
                  <TabsList className="flex w-full h-auto p-1 gap-2">
                    <TabsTrigger value="documents" className="flex-1">
                      Documents
                    </TabsTrigger>
                    <TabsTrigger value="allergies" className="flex-1">
                      Allergies
                    </TabsTrigger>
                    <TabsTrigger value="insurance" className="flex-1">
                      Insurance
                    </TabsTrigger>
                    <TabsTrigger value="family" className="flex-1">
                      Family History
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="documents" className="space-y-4">
                    <PatientDocuments patientId={patientId} />
                  </TabsContent>

                  <TabsContent value="allergies" className="space-y-4">
                    <PatientAllergies patientId={patientId} />
                  </TabsContent>

                  <TabsContent value="insurance" className="space-y-4">
                    <PatientInsurance patientId={patientId} />
                  </TabsContent>

                  <TabsContent value="family" className="space-y-4">
                    <PatientFamilyHistory patientId={patientId} />
                  </TabsContent>
                </Tabs>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
