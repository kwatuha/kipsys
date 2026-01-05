"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"
import { patientApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type VitalRecord = {
  id: string
  date: string
  time: string
  temperature: number
  heartRate: number
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  respiratoryRate: number
  oxygenSaturation: number
  pain: number
  weight: number
  height: number
  bmi: number
  notes: string
  recordedBy: string
}

export function PatientVitals({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [vitalRecords, setVitalRecords] = useState<VitalRecord[]>([])

  useEffect(() => {
    loadVitals()
  }, [patientId])

  const loadVitals = async () => {
    try {
      setLoading(true)
      setError(null)

      const vitalsData = await patientApi.getVitals(patientId)

      const records: VitalRecord[] = vitalsData.map((vital: any, index: number) => {
        const recordDate = new Date(vital.recordedDate || vital.recordedAt || new Date())
        const systolicBP = vital.systolicBP || vital.bloodPressureSystolic || null
        const diastolicBP = vital.diastolicBP || vital.bloodPressureDiastolic || null
        const weight = vital.weight || 0
        const height = vital.height || 0
        const bmi = height > 0 ? (weight / ((height / 100) ** 2)).toFixed(1) : 0

        return {
          id: `vital-${vital.vitalSignId || index}`,
          date: recordDate.toISOString().split('T')[0],
          time: recordDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temperature: vital.temperature || 0,
          heartRate: vital.heartRate || 0,
          bloodPressureSystolic: systolicBP || 0,
          bloodPressureDiastolic: diastolicBP || 0,
          respiratoryRate: vital.respiratoryRate || vital.respRate || 0,
          oxygenSaturation: vital.oxygenSaturation || vital.spO2 || 0,
          pain: vital.pain || 0,
          weight: weight,
          height: height,
          bmi: parseFloat(bmi),
          notes: vital.notes || '',
          recordedBy: vital.recordedBy || vital.recordedByName || 'Unknown'
        }
      })

      // Sort by date descending
      records.sort((a, b) => new Date(b.date + ' ' + b.time).getTime() - new Date(a.date + ' ' + a.time).getTime())

      setVitalRecords(records)
    } catch (err: any) {
      console.error("Error loading vitals:", err)
      setError(err.message || "Failed to load vital signs")
    } finally {
      setLoading(false)
    }
  }

  // Prepare data for charts
  const chartData = vitalRecords
    .map((record) => ({
      date: record.date,
      systolic: record.bloodPressureSystolic,
      diastolic: record.bloodPressureDiastolic,
      heartRate: record.heartRate,
      temperature: record.temperature,
      oxygenSaturation: record.oxygenSaturation,
      weight: record.weight,
    }))
    .reverse()

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs</CardTitle>
          <CardDescription>Historical record of patient vital signs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Vital Signs</CardTitle>
          <CardDescription>Historical record of patient vital signs</CardDescription>
        </CardHeader>
        <CardContent>
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
      <CardHeader>
        <CardTitle>Vital Signs</CardTitle>
        <CardDescription>Historical record of patient vital signs</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table" className="space-y-4">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="space-y-4">
            {vitalRecords.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>BP (mmHg)</TableHead>
                      <TableHead>HR (bpm)</TableHead>
                      <TableHead>Temp (°C)</TableHead>
                      <TableHead>RR (bpm)</TableHead>
                      <TableHead>SpO2 (%)</TableHead>
                      <TableHead>Weight (kg)</TableHead>
                      <TableHead>BMI</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vitalRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>{record.time}</TableCell>
                        <TableCell>
                          {record.bloodPressureSystolic > 0 && record.bloodPressureDiastolic > 0
                            ? `${record.bloodPressureSystolic}/${record.bloodPressureDiastolic}`
                            : 'N/A'}
                        </TableCell>
                        <TableCell>{record.heartRate > 0 ? record.heartRate : 'N/A'}</TableCell>
                        <TableCell>{record.temperature > 0 ? record.temperature : 'N/A'}</TableCell>
                        <TableCell>{record.respiratoryRate > 0 ? record.respiratoryRate : 'N/A'}</TableCell>
                        <TableCell>{record.oxygenSaturation > 0 ? `${record.oxygenSaturation}%` : 'N/A'}</TableCell>
                        <TableCell>{record.weight > 0 ? record.weight : 'N/A'}</TableCell>
                        <TableCell>{record.bmi > 0 ? record.bmi : 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No vital signs recorded for this patient</div>
            )}
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
            {chartData.length > 0 ? (
              <>
                <div>
                  <h3 className="text-sm font-medium mb-2">Blood Pressure Trends</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="systolic" stroke="#ef4444" name="Systolic" />
                        <Line type="monotone" dataKey="diastolic" stroke="#3b82f6" name="Diastolic" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Heart Rate & Temperature</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" domain={[35, 40]} />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="heartRate" stroke="#8b5cf6" name="Heart Rate (bpm)" />
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="temperature"
                          stroke="#f97316"
                          name="Temperature (°C)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {chartData.some(d => d.weight > 0) && (
                  <div>
                    <h3 className="text-sm font-medium mb-2">Weight Trends</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={["dataMin - 5", "dataMax + 5"]} />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="weight" stroke="#10b981" name="Weight (kg)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No chart data available</div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
