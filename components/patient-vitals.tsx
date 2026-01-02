import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

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

// Mock data for demonstration
const vitalRecords: VitalRecord[] = [
  {
    id: "vital-1",
    date: "2023-04-15",
    time: "09:15 AM",
    temperature: 37.1,
    heartRate: 72,
    bloodPressureSystolic: 138,
    bloodPressureDiastolic: 88,
    respiratoryRate: 16,
    oxygenSaturation: 98,
    pain: 0,
    weight: 78.5,
    height: 175,
    bmi: 25.6,
    notes: "Patient appears well",
    recordedBy: "Nurse Jane Kamau",
  },
  {
    id: "vital-2",
    date: "2023-03-20",
    time: "10:30 AM",
    temperature: 36.8,
    heartRate: 68,
    bloodPressureSystolic: 142,
    bloodPressureDiastolic: 90,
    respiratoryRate: 14,
    oxygenSaturation: 97,
    pain: 1,
    weight: 79.2,
    height: 175,
    bmi: 25.9,
    notes: "Patient reports occasional headaches",
    recordedBy: "Nurse David Omondi",
  },
  {
    id: "vital-3",
    date: "2023-02-10",
    time: "11:45 AM",
    temperature: 37.0,
    heartRate: 70,
    bloodPressureSystolic: 145,
    bloodPressureDiastolic: 92,
    respiratoryRate: 15,
    oxygenSaturation: 96,
    pain: 2,
    weight: 80.1,
    height: 175,
    bmi: 26.2,
    notes: "Patient reports stress at work",
    recordedBy: "Nurse Sarah Lwikane",
  },
  {
    id: "vital-4",
    date: "2023-01-05",
    time: "09:00 AM",
    temperature: 36.9,
    heartRate: 74,
    bloodPressureSystolic: 148,
    bloodPressureDiastolic: 94,
    respiratoryRate: 16,
    oxygenSaturation: 97,
    pain: 0,
    weight: 81.3,
    height: 175,
    bmi: 26.5,
    notes: "Patient started new diet",
    recordedBy: "Nurse Jane Kamau",
  },
  {
    id: "vital-5",
    date: "2022-12-12",
    time: "02:15 PM",
    temperature: 37.2,
    heartRate: 76,
    bloodPressureSystolic: 150,
    bloodPressureDiastolic: 96,
    respiratoryRate: 18,
    oxygenSaturation: 95,
    pain: 1,
    weight: 82.0,
    height: 175,
    bmi: 26.8,
    notes: "Patient reports feeling tired",
    recordedBy: "Nurse David Omondi",
  },
]

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

export function PatientVitals({ patientId }: { patientId: string }) {
  // In a real application, you would fetch the vitals data based on the patient ID
  // const { data: vitals, isLoading, error } = usePatientVitals(patientId)

  const vitals = vitalRecords // Using mock data for demonstration

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
                  {vitals.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{record.date}</TableCell>
                      <TableCell>{record.time}</TableCell>
                      <TableCell>
                        {record.bloodPressureSystolic}/{record.bloodPressureDiastolic}
                      </TableCell>
                      <TableCell>{record.heartRate}</TableCell>
                      <TableCell>{record.temperature}</TableCell>
                      <TableCell>{record.respiratoryRate}</TableCell>
                      <TableCell>{record.oxygenSaturation}%</TableCell>
                      <TableCell>{record.weight}</TableCell>
                      <TableCell>{record.bmi}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="charts" className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
