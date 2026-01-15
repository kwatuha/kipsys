"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { insuranceApi } from "@/lib/api"

interface Patient {
  patientId?: number
  patientNumber?: string
  firstName: string
  lastName: string
  middleName?: string
  dateOfBirth?: string
  gender?: string
  patientType?: string
  insuranceCompanyId?: number | string
  insuranceNumber?: string
  phone?: string
  email?: string
  address?: string
  county?: string
  subcounty?: string
  ward?: string
  idNumber?: string
  idType?: string
  bloodGroup?: string
}

interface PatientFormProps {
  patient?: Patient | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function PatientForm({ patient, open, onOpenChange, onSuccess }: PatientFormProps) {
  const [formData, setFormData] = useState<Patient>({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '',
    patientType: 'paying',
    insuranceCompanyId: '',
    insuranceNumber: '',
    phone: '',
    email: '',
    address: '',
    county: '',
    subcounty: '',
    ward: '',
    idNumber: '',
    idType: '',
    bloodGroup: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [insuranceCompanies, setInsuranceCompanies] = useState<any[]>([])
  const [loadingCompanies, setLoadingCompanies] = useState(false)

  // Load insurance companies when form opens
  useEffect(() => {
    if (open) {
      loadInsuranceCompanies()
    }
  }, [open])

  const loadInsuranceCompanies = async () => {
    try {
      setLoadingCompanies(true)
      const companies = await insuranceApi.getProviders('active')
      setInsuranceCompanies(companies || [])
    } catch (error) {
      console.error('Error loading insurance companies:', error)
    } finally {
      setLoadingCompanies(false)
    }
  }

  useEffect(() => {
    if (patient) {
      setFormData({
        firstName: patient.firstName || '',
        lastName: patient.lastName || '',
        middleName: patient.middleName || '',
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split('T')[0] : '',
        gender: patient.gender || '',
        patientType: patient.patientType || 'paying',
        insuranceCompanyId: patient.insuranceCompanyId || '',
        insuranceNumber: patient.insuranceNumber || '',
        phone: patient.phone || '',
        email: patient.email || '',
        address: patient.address || '',
        county: patient.county || '',
        subcounty: patient.subcounty || '',
        ward: patient.ward || '',
        idNumber: patient.idNumber || '',
        idType: patient.idType || '',
        bloodGroup: patient.bloodGroup || '',
      })
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        gender: '',
        patientType: 'paying',
        insuranceCompanyId: '',
        insuranceNumber: '',
        phone: '',
        email: '',
        address: '',
        county: '',
        subcounty: '',
        ward: '',
        idNumber: '',
        idType: '',
        bloodGroup: '',
      })
    }
    setError(null)
  }, [patient, open])

  // Clear insurance fields when patient type changes to "paying"
  useEffect(() => {
    if (formData.patientType === 'paying') {
      setFormData(prev => ({
        ...prev,
        insuranceCompanyId: '',
        insuranceNumber: '',
      }))
    }
  }, [formData.patientType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { patientApi } = await import('@/lib/api')

      // Format data for API
      const patientData = {
        ...formData,
        insuranceCompanyId: formData.insuranceCompanyId ? parseInt(formData.insuranceCompanyId.toString()) : null,
      }

      if (patient?.patientId) {
        // Update existing patient
        await patientApi.update(patient.patientId.toString(), patientData)
      } else {
        // Create new patient
        await patientApi.create(patientData)
      }

      onSuccess()
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Failed to save patient')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{patient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          <DialogDescription>
            {patient ? 'Update patient information' : 'Enter patient details to create a new record'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="middleName">Middle Name</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="patientType">Patient Type</Label>
              <Select
                value={formData.patientType}
                onValueChange={(value) => setFormData({ ...formData, patientType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select patient type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paying">Paying</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.patientType === 'insurance' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="insuranceCompanyId">Insurance Company</Label>
                <Select
                  value={formData.insuranceCompanyId?.toString() || ''}
                  onValueChange={(value) => setFormData({ ...formData, insuranceCompanyId: value })}
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCompanies ? "Loading..." : "Select insurance company"} />
                  </SelectTrigger>
                  <SelectContent>
                    {insuranceCompanies.map((company) => (
                      <SelectItem key={company.providerId} value={company.providerId.toString()}>
                        {company.providerName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="insuranceNumber">Insurance Number</Label>
                <Input
                  id="insuranceNumber"
                  value={formData.insuranceNumber}
                  onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                  placeholder="INS-12345678"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bloodGroup">Blood Group</Label>
              <Select
                value={formData.bloodGroup}
                onValueChange={(value) => setFormData({ ...formData, bloodGroup: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="county">County</Label>
              <Input
                id="county"
                value={formData.county}
                onChange={(e) => setFormData({ ...formData, county: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="subcounty">Subcounty</Label>
              <Input
                id="subcounty"
                value={formData.subcounty}
                onChange={(e) => setFormData({ ...formData, subcounty: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="ward">Ward</Label>
              <Input
                id="ward"
                value={formData.ward}
                onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="idNumber">ID Number</Label>
              <Input
                id="idNumber"
                value={formData.idNumber}
                onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="idType">ID Type</Label>
              <Select
                value={formData.idType}
                onValueChange={(value) => setFormData({ ...formData, idType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ID type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="National ID">National ID</SelectItem>
                  <SelectItem value="Passport">Passport</SelectItem>
                  <SelectItem value="Birth Certificate">Birth Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : patient ? 'Update Patient' : 'Create Patient'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}








