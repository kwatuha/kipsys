"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Plus, Download } from "lucide-react"
import { AddJournalEntryForm } from "@/components/add-journal-entry-form"

export default function GeneralLedgerPage() {
  const [openAddJournalForm, setOpenAddJournalForm] = useState(false)

  const accounts = [
    {
      id: "1000",
      name: "Cash",
      type: "Asset",
      balance: 1250000,
      lastTransaction: "2023-04-15",
    },
    {
      id: "1001",
      name: "Accounts Receivable",
      type: "Asset",
      balance: 750000,
      lastTransaction: "2023-04-18",
    },
    {
      id: "2000",
      name: "Accounts Payable",
      type: "Liability",
      balance: 450000,
      lastTransaction: "2023-04-12",
    },
    {
      id: "3000",
      name: "Capital",
      type: "Equity",
      balance: 2000000,
      lastTransaction: "2023-01-01",
    },
    {
      id: "4000",
      name: "Revenue",
      type: "Income",
      balance: 1800000,
      lastTransaction: "2023-04-20",
    },
    {
      id: "5000",
      name: "Expenses",
      type: "Expense",
      balance: 950000,
      lastTransaction: "2023-04-19",
    },
  ]

  const transactions = [
    {
      id: "TRX-1001",
      date: "2023-04-20",
      description: "Patient Payment - John Imbayi",
      debitAccount: "1000",
      creditAccount: "4000",
      amount: 25000,
      reference: "INV-2023-1001",
    },
    {
      id: "TRX-1002",
      date: "2023-04-19",
      description: "Supplier Payment - Medical Supplies Ltd",
      debitAccount: "5000",
      creditAccount: "1000",
      amount: 150000,
      reference: "PO-2023-0045",
    },
    {
      id: "TRX-1003",
      date: "2023-04-18",
      description: "Insurance Claim - ABC Insurance",
      debitAccount: "1001",
      creditAccount: "4000",
      amount: 350000,
      reference: "CLM-2023-0078",
    },
    {
      id: "TRX-1004",
      date: "2023-04-15",
      description: "Salary Payment - April 2023",
      debitAccount: "5000",
      creditAccount: "1000",
      amount: 800000,
      reference: "PAY-2023-0004",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">General Ledger</h1>
          <p className="text-muted-foreground">Manage chart of accounts and financial transactions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setOpenAddJournalForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </div>
      </div>

      <Tabs defaultValue="accounts" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Chart of Accounts</CardTitle>
              <CardDescription>Manage financial accounts and their balances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Assets
                  </Button>
                  <Button variant="outline" size="sm">
                    Liabilities
                  </Button>
                  <Button variant="outline" size="sm">
                    Equity
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
                  <Input type="search" placeholder="Search accounts..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account ID</TableHead>
                      <TableHead>Account Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Last Transaction</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.id}</TableCell>
                        <TableCell>{account.name}</TableCell>
                        <TableCell>{account.type}</TableCell>
                        <TableCell>{formatCurrency(account.balance)}</TableCell>
                        <TableCell>{account.lastTransaction}</TableCell>
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

        <TabsContent value="transactions" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal Entries</CardTitle>
              <CardDescription>View and manage financial transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    This Month
                  </Button>
                  <Button variant="outline" size="sm">
                    Last Month
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
                      <TableHead>Description</TableHead>
                      <TableHead>Debit Account</TableHead>
                      <TableHead>Credit Account</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell>{transaction.date}</TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell>{transaction.debitAccount}</TableCell>
                        <TableCell>{transaction.creditAccount}</TableCell>
                        <TableCell>{formatCurrency(transaction.amount)}</TableCell>
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
      </Tabs>

      <AddJournalEntryForm open={openAddJournalForm} onOpenChange={setOpenAddJournalForm} />
    </div>
  )
}
