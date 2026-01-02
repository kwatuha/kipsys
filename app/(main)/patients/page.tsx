"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PatientForm } from "@/components/patient-form"
import { patientApi } from "@/lib/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Trash2, Edit, Plus } from "lucide-react"

interface Patient {
  patientId: number
  patientNumber: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  email?: string
  address?: string
  county?: string
  subcounty?: string
  ward?: string
  idNumber?: string
  idType?: string
  bloodGroup?: string
  createdAt?: string
}

export default function PatientsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    loadPatients()
  }, [searchQuery])

  const loadPatients = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await patientApi.getAll(searchQuery || undefined)
      setPatients(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load patients')
      console.error('Error loading patients:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingPatient(null)
    setIsFormOpen(true)
  }

  const handleEdit = (patient: Patient) => {
    setEditingPatient(patient)
    setIsFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingPatient) return

    setDeleteLoading(true)
    try {
      await patientApi.delete(deletingPatient.patientId.toString())
      setDeletingPatient(null)
      loadPatients() // Reload the list
    } catch (err: any) {
      setError(err.message || 'Failed to delete patient')
      console.error('Error deleting patient:', err)
    } finally {
      setDeleteLoading(false)
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

  const formatDate = (date?: string): string => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">View and manage patient records</p>
        </div>
        <div className="text-center py-8">Loading patients...</div>
      </div>
    )
  }

  if (error && !patients.length) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">View and manage patient records</p>
        </div>
        <div className="text-center py-8 text-red-500">Error: {error}</div>
        <Button onClick={loadPatients}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Patients</h1>
          <p className="text-sm text-muted-foreground">View and manage patient records</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Patient
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {patients.map((patient) => (
          <Card key={patient.patientId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">{patient.firstName} {patient.lastName}</CardTitle>
              <CardDescription>Patient ID: {patient.patientNumber}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm">
                  {patient.dateOfBirth && <p>Age: {calculateAge(patient.dateOfBirth) || 'N/A'}</p>}
                  {patient.gender && <p>Gender: {patient.gender}</p>}
                  {patient.phone && <p>Phone: {patient.phone}</p>}
                  {patient.createdAt && <p>Registered: {formatDate(patient.createdAt)}</p>}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button asChild size="sm" variant="outline" className="flex-1">
                    <Link href={`/patients/${patient.patientId}`}>View</Link>
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleEdit(patient)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setDeletingPatient(patient)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {patients.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No patients found. {searchQuery && "Try adjusting your search."}
        </div>
      )}

      <PatientForm
        patient={editingPatient}
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={loadPatients}
      />

      <AlertDialog open={!!deletingPatient} onOpenChange={(open) => !open && setDeletingPatient(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Patient</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingPatient?.firstName} {deletingPatient?.lastName}? 
              This will soft delete the patient record (set voided = 1). The record will be hidden but not permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
