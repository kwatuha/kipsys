"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { useTheme } from "next-themes"
import { AddTransactionForm } from "@/components/add-transaction-form"

export default function CashManagementPage() {
  const [openAddTransactionForm, setOpenAddTransactionForm] = useState(false)
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const transactions = [
    {
      id: "TRX-1001",
      date: "2023-04-20",
      type: "Income",
      category: "Patient Payment",
      amount: 25000,
      account: "Main Account",
      reference: "INV-2023-1001",
      description: "Payment from John Imbayi",
    },
    {
      id: "TRX-1002",
      date: "2023-04-19",
      type: "Expense",
      category: "Supplier Payment",
      amount: 150000,
      account: "Main Account",
      reference: "PO-2023-0045",
      description: "Payment to Medical Supplies Ltd",
    },
    {
      id: "TRX-1003",
      date: "2023-04-18",
      type: "Income",
      category: "Insurance Claim",
      amount: 350000,
      account: "Insurance Account",
      reference: "CLM-2023-0078",
      description: "Payment from NHIF",
    },
    {
      id: "TRX-1004",
      date: "2023-04-15",
      type: "Expense",
      category: "Salary Payment",
      amount: 800000,
      account: "Payroll Account",
      reference: "PAY-2023-0004",
      description: "Staff salaries for April 2023",
    },
    {
      id: "TRX-1005",
      date: "2023-04-12",
      type: "Income",
      category: "Patient Payment",
      amount: 18000,
      account: "Main Account",
      reference: "INV-2023-1005",
      description: "Payment from David Kimutai",
    },
  ]

  const accounts = [
    {
      id: "ACC-1001",
      name: "Main Account",
      bank: "Kenya Commercial Bank",
      accountNumber: "1234567890",
      balance: 2500000,
      lastTransaction: "2023-04-20",
      status: "Active",
    },
    {
      id: "ACC-1002",
      name: "Insurance Account",
      bank: "Equity Bank",
      accountNumber: "0987654321",
      balance: 1800000,
      lastTransaction: "2023-04-18",
      status: "Active",
    },
    {
      id: "ACC-1003",
      name: "Payroll Account",
      bank: "Cooperative Bank",
      accountNumber: "5678901234",
      balance: 1200000,
      lastTransaction: "2023-04-15",
      status: "Active",
    },
    {
      id: "ACC-1004",
      name: "Petty Cash",
      bank: "Cash on Hand",
      accountNumber: "N/A",
      balance: 50000,
      lastTransaction: "2023-04-19",
      status: "Active",
    },
  ]

  const cashFlowData = [
    {
      name: "Jan",
      Income: 2500000,
      Expenses: 1800000,
      Balance: 700000,
    },
    {
      name: "Feb",
      Income: 2700000,
      Expenses: 2000000,
      Balance: 700000,
    },
    {
      name: "Mar",
      Income: 3000000,
      Expenses: 2200000,
      Balance: 800000,
    },
    {
      name: "Apr",
      Income: 2800000,
      Expenses: 2100000,
      Balance: 700000,
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <AddTransactionForm open={openAddTransactionForm} setOpen={setOpenAddTransactionForm} />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Management</h1>
          <p className="text-muted-foreground">Manage cash flow and bank accounts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpenAddTransactionForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Cash Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(5550000)}</div>
            <p className="text-xs text-muted-foreground">Across all accounts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Income (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(2800000)}</div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expenses (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(2100000)}</div>
            <p className="text-xs text-muted-foreground">-3% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(700000)}</div>
            <p className="text-xs text-muted-foreground">For April 2023</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cash Flow Trend</CardTitle>
          <CardDescription>Monthly income, expenses, and balance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashFlowData}>
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
                <Line type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Balance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="transactions" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cash Transactions</CardTitle>
              <CardDescription>View and manage cash transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Income
                  </Button>
                  <Button variant="outline" size="sm">
                    Expenses
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search transactions..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Transaction ID</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {transaction.type === "Income" ? (
                              <ArrowUpRight className="mr-1 h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownLeft className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span className={transaction.type === "Income" ? "text-green-600" : "text-red-600"}>
                              {transaction.type}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{transaction.category}</TableCell>
                        <TableCell className={transaction.type === "Income" ? "text-green-600" : "text-red-600"}>
                          {transaction.type === "Income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </TableCell>
                        <TableCell>{transaction.account}</TableCell>
                        <TableCell>{transaction.reference}</TableCell>
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

        <TabsContent value="accounts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Bank Accounts</CardTitle>
              <CardDescription>View and manage bank accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Active
                  </Button>
                  <Button variant="outline" size="sm">
                    Inactive
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search accounts..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Bank</TableHead>
                      <TableHead>Account Number</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Last Transaction</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.id}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.bank}</TableCell>
                        <TableCell>{account.accountNumber}</TableCell>
                        <TableCell>{formatCurrency(account.balance)}</TableCell>
                        <TableCell>{account.lastTransaction}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{account.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              Transactions
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
      </Tabs>
    </div>
  )
}
