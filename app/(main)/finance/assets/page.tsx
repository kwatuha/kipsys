"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download } from "lucide-react"
import { Pie, PieChart, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export default function FixedAssetsPage() {
  const assets = [
    {
      id: "AST-1001",
      name: "MRI Machine",
      category: "Medical Equipment",
      location: "Radiology Department",
      purchaseDate: "2020-05-15",
      purchaseValue: 15000000,
      currentValue: 12000000,
      depreciationRate: "10%",
      condition: "Good",
      status: "In Use",
    },
    {
      id: "AST-1002",
      name: "X-Ray Machine",
      category: "Medical Equipment",
      location: "Radiology Department",
      purchaseDate: "2019-08-20",
      purchaseValue: 8000000,
      currentValue: 5600000,
      depreciationRate: "10%",
      condition: "Good",
      status: "In Use",
    },
    {
      id: "AST-1003",
      name: "Hospital Beds (20)",
      category: "Furniture",
      location: "Medical Ward",
      purchaseDate: "2021-02-10",
      purchaseValue: 2000000,
      currentValue: 1800000,
      depreciationRate: "5%",
      condition: "Good",
      status: "In Use",
    },
    {
      id: "AST-1004",
      name: "Ambulance",
      category: "Vehicles",
      location: "Emergency Department",
      purchaseDate: "2018-11-05",
      purchaseValue: 5000000,
      currentValue: 3000000,
      depreciationRate: "10%",
      condition: "Fair",
      status: "In Use",
    },
    {
      id: "AST-1005",
      name: "Laboratory Equipment Set",
      category: "Medical Equipment",
      location: "Laboratory",
      purchaseDate: "2022-01-15",
      purchaseValue: 3500000,
      currentValue: 3325000,
      depreciationRate: "5%",
      condition: "Excellent",
      status: "In Use",
    },
  ]

  const maintenance = [
    {
      id: "MNT-1001",
      assetId: "AST-1001",
      assetName: "MRI Machine",
      date: "2023-02-15",
      type: "Preventive",
      cost: 250000,
      vendor: "Medical Equipment Services Ltd",
      description: "Regular maintenance and calibration",
      nextScheduled: "2023-08-15",
    },
    {
      id: "MNT-1002",
      assetId: "AST-1002",
      assetName: "X-Ray Machine",
      date: "2023-03-10",
      type: "Preventive",
      cost: 150000,
      vendor: "Medical Equipment Services Ltd",
      description: "Regular maintenance and calibration",
      nextScheduled: "2023-09-10",
    },
    {
      id: "MNT-1003",
      assetId: "AST-1004",
      assetName: "Ambulance",
      date: "2023-01-20",
      type: "Repair",
      cost: 80000,
      vendor: "Auto Repair Shop",
      description: "Engine repair and service",
      nextScheduled: "2023-07-20",
    },
    {
      id: "MNT-1004",
      assetId: "AST-1005",
      assetName: "Laboratory Equipment Set",
      date: "2023-04-05",
      type: "Preventive",
      cost: 100000,
      vendor: "Lab Solutions Inc.",
      description: "Calibration and maintenance",
      nextScheduled: "2023-10-05",
    },
  ]

  const assetCategoryData = [
    { name: "Medical Equipment", value: 20925000 },
    { name: "Furniture", value: 1800000 },
    { name: "Vehicles", value: 3000000 },
    { name: "IT Equipment", value: 1500000 },
    { name: "Buildings", value: 50000000 },
  ]

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fixed Assets</h1>
          <p className="text-muted-foreground">Manage hospital fixed assets and maintenance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Asset
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Assets Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(77225000)}</div>
            <p className="text-xs text-muted-foreground">Current book value</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medical Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(20925000)}</div>
            <p className="text-xs text-muted-foreground">27% of total assets</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Cost (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(580000)}</div>
            <p className="text-xs text-muted-foreground">4 maintenance records</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Depreciation (YTD)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(3575000)}</div>
            <p className="text-xs text-muted-foreground">For fiscal year 2023</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-4">
          <CardHeader>
            <CardTitle>Asset Distribution</CardTitle>
            <CardDescription>Distribution of assets by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={assetCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Maintenance</CardTitle>
            <CardDescription>Scheduled maintenance in the next 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">MRI Machine</h3>
                    <p className="text-sm text-muted-foreground">Preventive Maintenance</p>
                  </div>
                  <Badge>May 15, 2023</Badge>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Laboratory Equipment</h3>
                    <p className="text-sm text-muted-foreground">Calibration</p>
                  </div>
                  <Badge>May 20, 2023</Badge>
                </div>
              </div>
              <div className="rounded-md border p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Ambulance</h3>
                    <p className="text-sm text-muted-foreground">Regular Service</p>
                  </div>
                  <Badge>June 5, 2023</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="assets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="assets">Assets</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
        </TabsList>

        <TabsContent value="assets" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Registry</CardTitle>
              <CardDescription>View and manage fixed assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Medical Equipment
                  </Button>
                  <Button variant="outline" size="sm">
                    Furniture
                  </Button>
                  <Button variant="outline" size="sm">
                    Vehicles
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search assets..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Purchase Value</TableHead>
                      <TableHead>Current Value</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assets.map((asset) => (
                      <TableRow key={asset.id}>
                        <TableCell className="font-medium">{asset.id}</TableCell>
                        <TableCell>{asset.name}</TableCell>
                        <TableCell>{asset.category}</TableCell>
                        <TableCell>{asset.location}</TableCell>
                        <TableCell>{formatCurrency(asset.purchaseValue)}</TableCell>
                        <TableCell>{formatCurrency(asset.currentValue)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              asset.condition === "Excellent"
                                ? "default"
                                : asset.condition === "Good"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {asset.condition}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Maintenance
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Records</CardTitle>
              <CardDescription>View and manage asset maintenance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Preventive
                  </Button>
                  <Button variant="outline" size="sm">
                    Repair
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search maintenance..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Maintenance ID</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Next Scheduled</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenance.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.id}</TableCell>
                        <TableCell>
                          {record.assetName}
                          <div className="text-xs text-muted-foreground">{record.assetId}</div>
                        </TableCell>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <Badge variant={record.type === "Preventive" ? "default" : "secondary"}>{record.type}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(record.cost)}</TableCell>
                        <TableCell>{record.vendor}</TableCell>
                        <TableCell>{record.nextScheduled}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
