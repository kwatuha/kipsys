"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { AddBudgetForm } from "@/components/add-budget-form"

export default function BudgetingPage() {
  const [openAddBudgetForm, setOpenAddBudgetForm] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const budgets = [
    {
      id: "BUD-1001",
      department: "Medical",
      fiscalYear: "2023",
      amount: 12500000,
      spent: 5250000,
      remaining: 7250000,
      status: "Active",
      lastUpdated: "2023-04-15",
    },
    {
      id: "BUD-1002",
      department: "Laboratory",
      fiscalYear: "2023",
      amount: 5000000,
      spent: 2800000,
      remaining: 2200000,
      status: "Active",
      lastUpdated: "2023-04-18",
    },
    {
      id: "BUD-1003",
      department: "Pharmacy",
      fiscalYear: "2023",
      amount: 8000000,
      spent: 3500000,
      remaining: 4500000,
      status: "Active",
      lastUpdated: "2023-04-20",
    },
    {
      id: "BUD-1004",
      department: "Administration",
      fiscalYear: "2023",
      amount: 4500000,
      spent: 2100000,
      remaining: 2400000,
      status: "Active",
      lastUpdated: "2023-04-10",
    },
    {
      id: "BUD-1005",
      department: "Maintenance",
      fiscalYear: "2023",
      amount: 3000000,
      spent: 1200000,
      remaining: 1800000,
      status: "Active",
      lastUpdated: "2023-04-12",
    },
  ]

  const expenses = [
    {
      id: "EXP-1001",
      department: "Medical",
      category: "Equipment",
      amount: 1500000,
      date: "2023-04-05",
      description: "Purchase of new cardiac monitors",
      approvedBy: "Dr. James Ndiwa",
      status: "Approved",
    },
    {
      id: "EXP-1002",
      department: "Laboratory",
      category: "Supplies",
      amount: 800000,
      date: "2023-04-08",
      description: "Laboratory reagents and test kits",
      approvedBy: "Dr. Michael Siva",
      status: "Approved",
    },
    {
      id: "EXP-1003",
      department: "Pharmacy",
      category: "Inventory",
      amount: 1200000,
      date: "2023-04-10",
      description: "Medication stock replenishment",
      approvedBy: "Dr. Sarah Isuvi",
      status: "Pending",
    },
    {
      id: "EXP-1004",
      department: "Administration",
      category: "Utilities",
      amount: 350000,
      date: "2023-04-12",
      description: "Electricity and water bills",
      approvedBy: "Daniel Mirenja",
      status: "Approved",
    },
    {
      id: "EXP-1005",
      department: "Maintenance",
      category: "Repairs",
      amount: 450000,
      date: "2023-04-15",
      description: "HVAC system maintenance",
      approvedBy: "Daniel Mirenja",
      status: "Pending",
    },
  ]

  const budgetData = [
    {
      name: "Medical",
      Budget: 12500000,
      Spent: 5250000,
      Remaining: 7250000,
    },
    {
      name: "Laboratory",
      Budget: 5000000,
      Spent: 2800000,
      Remaining: 2200000,
    },
    {
      name: "Pharmacy",
      Budget: 8000000,
      Spent: 3500000,
      Remaining: 4500000,
    },
    {
      name: "Admin",
      Budget: 4500000,
      Spent: 2100000,
      Remaining: 2400000,
    },
    {
      name: "Maintenance",
      Budget: 3000000,
      Spent: 1200000,
      Remaining: 1800000,
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgeting</h1>
          <p className="text-muted-foreground">Manage departmental budgets and expenses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpenAddBudgetForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Budget
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Budget Overview - Fiscal Year 2023</CardTitle>
          <CardDescription>Departmental budget allocation and utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={budgetData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? "#333" : "#eee"} />
                <XAxis dataKey="name" stroke={isDark ? "#888" : "#333"} tick={{ fill: isDark ? "#888" : "#333" }} />
                <YAxis
                  stroke={isDark ? "#888" : "#333"}
                  tick={{ fill: isDark ? "#888" : "#333" }}
                  tickFormatter={(value) => formatCurrency(value).replace("KES", "")}
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
                <Bar dataKey="Budget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Spent" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Remaining" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="budgets" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="budgets">Budgets</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="budgets" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Departmental Budgets</CardTitle>
              <CardDescription>View and manage departmental budgets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Medical
                  </Button>
                  <Button variant="outline" size="sm">
                    Laboratory
                  </Button>
                  <Button variant="outline" size="sm">
                    Pharmacy
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search budgets..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Budget ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Fiscal Year</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Spent</TableHead>
                      <TableHead>Remaining</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.id}</TableCell>
                        <TableCell>{budget.department}</TableCell>
                        <TableCell>{budget.fiscalYear}</TableCell>
                        <TableCell>{formatCurrency(budget.amount)}</TableCell>
                        <TableCell>{formatCurrency(budget.spent)}</TableCell>
                        <TableCell>{formatCurrency(budget.remaining)}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{budget.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Edit
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

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Expense Transactions</CardTitle>
              <CardDescription>View and manage expense transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Approved
                  </Button>
                  <Button variant="outline" size="sm">
                    Pending
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search expenses..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense ID</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell className="font-medium">{expense.id}</TableCell>
                        <TableCell>{expense.department}</TableCell>
                        <TableCell>{expense.category}</TableCell>
                        <TableCell>{formatCurrency(expense.amount)}</TableCell>
                        <TableCell>{expense.date}</TableCell>
                        <TableCell className="max-w-xs truncate">{expense.description}</TableCell>
                        <TableCell>
                          <Badge variant={expense.status === "Approved" ? "default" : "secondary"}>
                            {expense.status}
                          </Badge>
                        </TableCell>
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

      <AddBudgetForm open={openAddBudgetForm} onOpenChange={setOpenAddBudgetForm} />
    </div>
  )
}
