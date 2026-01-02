"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Activity, Building2, FileText, FlaskConical, ImageIcon, Pill, Stethoscope, UserPlus } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BreadcrumbsEnhanced } from "@/components/breadcrumbs-enhanced"
import { departmentApi } from "@/lib/api"

// Icon mapping for departments
const departmentIcons: Record<string, any> = {
  'Registration': UserPlus,
  'Consultation': Stethoscope,
  'Laboratory': FlaskConical,
  'Pharmacy': Pill,
  'Radiology': ImageIcon,
  'Nursing': Activity,
  'Medical Records': FileText,
  'Administration': Building2,
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await departmentApi.getAll()
      setDepartments(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load departments')
      console.error('Error loading departments:', err)
    } finally {
      setLoading(false)
    }
  }

  // Map departments to include icon and href
  const departmentsWithIcons = departments.map(dept => {
    const iconName = dept.departmentName.split(' ')[0]
    const Icon = departmentIcons[dept.departmentName] || departmentIcons[iconName] || Building2
    
    const href = `/departments/${dept.departmentName.toLowerCase().replace(/\s+/g, '-')}`
    
    return {
      ...dept,
      icon: Icon,
      href,
      status: 'implemented'
    }
  })

  if (loading) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadcrumbsEnhanced segments={[{ title: "Departments", href: "/departments" }]} className="mb-4" />
        <div className="text-center py-8">Loading departments...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <BreadcrumbsEnhanced segments={[{ title: "Departments", href: "/departments" }]} className="mb-4" />
        <div className="text-center py-8 text-red-500">Error: {error}</div>
        <Button onClick={loadDepartments}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbsEnhanced segments={[{ title: "Departments", href: "/departments" }]} className="mb-4" />

      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {departmentsWithIcons.map((department) => {
          const Icon = department.icon
          return (
            <Card key={department.departmentId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{department.departmentName}</CardTitle>
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardDescription>{department.description || 'Department services'}</CardDescription>
              </CardHeader>
              <CardContent>
                {department.status === "implemented" ? (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Available</Badge>
                ) : (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-800 hover:bg-yellow-100">
                    Coming Soon
                  </Badge>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  variant={department.status === "implemented" ? "default" : "outline"}
                  className="w-full"
                  disabled={department.status !== "implemented"}
                >
                  <Link href={department.href}>
                    {department.status === "implemented" ? "Open Department" : "Not Available Yet"}
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {departments.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          No departments found.
        </div>
      )}
    </div>
  )
}
