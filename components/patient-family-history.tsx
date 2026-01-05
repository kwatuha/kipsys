"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, AlertCircle } from "lucide-react"
import { patientApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

type FamilyHistory = {
  id: string
  relation: string
  condition: string
  ageAtDiagnosis: string
  status: string
  notes: string
}

export function PatientFamilyHistory({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [familyHistory, setFamilyHistory] = useState<FamilyHistory[]>([])

  useEffect(() => {
    loadFamilyHistory()
  }, [patientId])

  const loadFamilyHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      const historyData = await patientApi.getFamilyHistory(patientId)

      const history: FamilyHistory[] = historyData.map((entry: any) => ({
        id: `fh-${entry.familyHistoryId}`,
        relation: entry.relation || 'Unknown',
        condition: entry.condition || 'Not specified',
        ageAtDiagnosis: entry.ageAtDiagnosis ? entry.ageAtDiagnosis.toString() : 'N/A',
        status: entry.status || 'Unknown',
        notes: entry.notes || ''
      }))

      setFamilyHistory(history)
    } catch (err: any) {
      console.error("Error loading family history:", err)
      setError(err.message || "Failed to load family history")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

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
