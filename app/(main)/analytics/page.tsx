"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts"
import { useTheme } from "next-themes"

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const patientData = [
    {
      name: "Jan",
      Inpatients: 65,
      Outpatients: 120,
      Emergency: 28,
    },
    {
      name: "Feb",
      Inpatients: 59,
      Outpatients: 110,
      Emergency: 32,
    },
    {
      name: "Mar",
      Inpatients: 80,
      Outpatients: 145,
      Emergency: 35,
    },
    {
      name: "Apr",
      Inpatients: 81,
      Outpatients: 132,
      Emergency: 30,
    },
    {
      name: "May",
      Inpatients: 56,
      Outpatients: 125,
      Emergency: 27,
    },
    {
      name: "Jun",
      Inpatients: 55,
      Outpatients: 105,
      Emergency: 24,
    },
    {
      name: "Jul",
      Inpatients: 40,
      Outpatients: 98,
      Emergency: 20,
    },
  ]

  const revenueData = [
    {
      name: "Jan",
      Revenue: 1250000,
      Expenses: 950000,
    },
    {
      name: "Feb",
      Revenue: 1320000,
      Expenses: 980000,
    },
    {
      name: "Mar",
      Revenue: 1450000,
      Expenses: 1050000,
    },
    {
      name: "Apr",
      Revenue: 1380000,
      Expenses: 1020000,
    },
    {
      name: "May",
      Revenue: 1520000,
      Expenses: 1080000,
    },
    {
      name: "Jun",
      Revenue: 1620000,
      Expenses: 1150000,
    },
    {
      name: "Jul",
      Revenue: 1750000,
      Expenses: 1200000,
    },
  ]

  const departmentData = [
    { name: "Cardiology", value: 25 },
    { name: "Orthopedics", value: 18 },
    { name: "Pediatrics", value: 15 },
    { name: "Gynecology", value: 12 },
    { name: "Neurology", value: 10 },
    { name: "Others", value: 20 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Hospital performance metrics and statistics</p>
      </div>

      <Tabs defaultValue="patients" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="patients">Patient Statistics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue & Expenses</TabsTrigger>
          <TabsTrigger value="departments">Department Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="patients" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Admissions</CardTitle>
              <CardDescription>Monthly patient statistics by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={patientData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis dataKey="name" stroke={isDark ? "#888" : "#333"} tick={{ fill: isDark ? "#888" : "#333" }} />
                    <YAxis stroke={isDark ? "#888" : "#333"} tick={{ fill: isDark ? "#888" : "#333" }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        color: isDark ? "#fff" : "#000",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="Inpatients" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Outpatients" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Emergency" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Performance</CardTitle>
              <CardDescription>Monthly revenue and expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                    <XAxis dataKey="name" stroke={isDark ? "#888" : "#333"} tick={{ fill: isDark ? "#888" : "#333" }} />
                    <YAxis
                      stroke={isDark ? "#888" : "#333"}
                      tick={{ fill: isDark ? "#888" : "#333" }}
                      tickFormatter={(value) => formatCurrency(value)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        color: isDark ? "#fff" : "#000",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      }}
                      formatter={(value) => [formatCurrency(value as number), ""]}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Department Distribution</CardTitle>
              <CardDescription>Patient distribution by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={departmentData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {departmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? "#1f2937" : "#fff",
                        color: isDark ? "#fff" : "#000",
                        border: `1px solid ${isDark ? "#374151" : "#e5e7eb"}`,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
