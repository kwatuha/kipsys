"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Users, Building, RefreshCw, Loader2 } from "lucide-react"
import { InsuranceProvidersTable } from "@/components/insurance-providers-table"
import { insuranceApi } from "@/lib/api"

export default function InsurancePage() {
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const data = await insuranceApi.getStats()
      setStats(data)
    } catch (error: any) {
      console.error("Error loading stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Management</h1>
          <p className="text-muted-foreground">Manage insurance providers, packages, and claims processing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={loadStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>

      <Tabs defaultValue="providers" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="claims">Claims</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="packages">Packages</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="claims" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.pendingClaims + stats?.approvedClaims || 0}
                </div>
                <p className="text-xs text-muted-foreground">All claims</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.pendingClaims || 0}
                </div>
                <p className="text-xs text-muted-foreground">Awaiting processing</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Claim Value (KES)</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : formatCurrency(parseFloat(stats?.totalApprovedAmount || 0))}
                </div>
                <p className="text-xs text-muted-foreground">Total approved amount</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Insurance Claims</CardTitle>
              <CardDescription>Claims functionality coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Claims management will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.activeProviders || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Policies</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.activePolicies || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.pendingClaims || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : stats?.approvedClaims || 0}
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Insurance Providers</CardTitle>
              <CardDescription>Manage all insurance providers</CardDescription>
            </CardHeader>
            <CardContent>
              <InsuranceProvidersTable />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="packages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Packages</CardTitle>
              <CardDescription>Packages functionality coming soon</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Insurance packages management will be available in a future update.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Insurance Reports</CardTitle>
              <CardDescription>Generate and view insurance-related reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Claims Settlement Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Provider Performance</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Rejection Analysis</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Utilization Report</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Financial Summary</span>
                </Button>
                <Button variant="outline" className="h-24 flex-col items-center justify-center gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Custom Report</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
