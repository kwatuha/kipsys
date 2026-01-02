"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

// Mock data for inventory analytics
const stockValueByCategory = [
  { name: "Medical Supplies", value: 125000 },
  { name: "Pharmaceuticals", value: 85000 },
  { name: "Equipment", value: 210000 },
  { name: "PPE", value: 45000 },
  { name: "Furniture", value: 75000 },
  { name: "Hygiene Products", value: 25000 },
  { name: "Office Supplies", value: 15000 },
  { name: "Laboratory Supplies", value: 65000 },
]

const stockMovementData = [
  { name: "Jan", stockIn: 12500, stockOut: 10200 },
  { name: "Feb", stockIn: 15000, stockOut: 12800 },
  { name: "Mar", stockIn: 18000, stockOut: 15500 },
  { name: "Apr", stockIn: 16000, stockOut: 14200 },
  { name: "May", stockIn: 14000, stockOut: 13800 },
  { name: "Jun", stockIn: 17000, stockOut: 15000 },
]

const topMovingItems = [
  { name: "Surgical Gloves", value: 8500 },
  { name: "Paracetamol 500mg", value: 7200 },
  { name: "Disposable Syringes", value: 6800 },
  { name: "Surgical Masks", value: 5500 },
  { name: "Amoxicillin 250mg", value: 4200 },
]

const expiryData = [
  { name: "0-30 days", value: 12 },
  { name: "31-60 days", value: 18 },
  { name: "61-90 days", value: 25 },
  { name: "91-180 days", value: 42 },
  { name: "181-365 days", value: 78 },
  { name: ">365 days", value: 125 },
]

// Colors for charts
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FF6B6B", "#6B66FF"]

export function InventoryAnalytics() {
  const [timeRange, setTimeRange] = useState("6months")

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Inventory Analytics</h2>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="3months">Last 3 Months</SelectItem>
            <SelectItem value="6months">Last 6 Months</SelectItem>
            <SelectItem value="1year">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="movement">Stock Movement</TabsTrigger>
          <TabsTrigger value="expiry">Expiry Analysis</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Stock Value by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockValueByCategory} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`KES ${value.toLocaleString()}`, "Value"]} />
                      <Bar dataKey="value" fill="#0088FE" name="Value (KES)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Top Moving Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topMovingItems}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topMovingItems.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} units`, "Quantity"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="movement">
          <Card>
            <CardHeader>
              <CardTitle>Stock Movement Analysis</CardTitle>
              <CardDescription>Comparison of stock in vs stock out over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockMovementData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="stockIn" fill="#82ca9d" name="Stock In" />
                    <Bar dataKey="stockOut" fill="#ff7c7c" name="Stock Out" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiry">
          <Card>
            <CardHeader>
              <CardTitle>Expiry Analysis</CardTitle>
              <CardDescription>Number of items expiring in different time periods</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expiryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#ff7300" name="Number of Items" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>Category Analysis</CardTitle>
              <CardDescription>Detailed breakdown of inventory by categories</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Category analysis content will go here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
