"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { analyticsApi } from "@/lib/api"
import { Loader2, TrendingUp, DollarSign, Users, Calendar } from "lucide-react"

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d", "#FF6B6B", "#6B66FF"]

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const [loading, setLoading] = useState(true)
  const [patientData, setPatientData] = useState<any[]>([])
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [departmentData, setDepartmentData] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [months, setMonths] = useState(12)

  useEffect(() => {
    loadAnalytics()
  }, [months])

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      const [patients, revenue, departments, summaryData] = await Promise.all([
        analyticsApi.getPatients(months).catch(() => []),
        analyticsApi.getRevenue(months).catch(() => []),
        analyticsApi.getDepartments().catch(() => []),
        analyticsApi.getSummary().catch(() => null),
      ])

      setPatientData(Array.isArray(patients) ? patients : [])
      // Ensure revenue data has proper numeric values
      const processedRevenue = Array.isArray(revenue) ? revenue.map(item => ({
        ...item,
        Revenue: typeof item.Revenue === 'string' ? parseFloat(item.Revenue) || 0 : (item.Revenue || 0),
        Expenses: typeof item.Expenses === 'string' ? parseFloat(item.Expenses) || 0 : (item.Expenses || 0),
      })) : []
      setRevenueData(processedRevenue)
      setDepartmentData(Array.isArray(departments) ? departments : [])
      setSummary(summaryData)
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Hospital performance metrics and statistics</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Hospital performance metrics and statistics</p>
        </div>
        <Select value={months.toString()} onValueChange={(value) => setMonths(parseInt(value))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="24">Last 24 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalPatients || 0}</div>
              <p className="text-xs text-muted-foreground">All registered patients</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">All-time revenue</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary.monthlyRevenue || 0)}</div>
              <p className="text-xs text-muted-foreground">Current month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Inpatients</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.activeInpatients || 0}</div>
              <p className="text-xs text-muted-foreground">Currently admitted</p>
            </CardContent>
          </Card>
        </div>
      )}

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
              {patientData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p>No patient data available</p>
                    <p className="text-sm mt-2">Data will appear as patients are registered and admitted</p>
                  </div>
                </div>
              ) : (
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
              )}
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
              {revenueData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p>No revenue data available</p>
                    <p className="text-sm mt-2">Data will appear as invoices are created and paid</p>
                  </div>
                </div>
              ) : (
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
              )}
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
              {departmentData.length === 0 ? (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <p>No department data available</p>
                    <p className="text-sm mt-2">Data will appear as appointments are scheduled</p>
                  </div>
                </div>
              ) : (
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
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
