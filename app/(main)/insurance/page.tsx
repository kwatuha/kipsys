import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, FileText, Users, Building, RefreshCw } from "lucide-react"
import { AddInsuranceProviderForm } from "@/components/add-insurance-provider-form"
import { InsuranceClaimsTable } from "@/components/insurance-claims-table"
import { InsuranceProvidersTable } from "@/components/insurance-providers-table"
import { InsurancePackagesTable } from "@/components/insurance-packages-table"

export default function InsurancePage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insurance Management</h1>
          <p className="text-muted-foreground">Manage insurance providers, packages, and claims processing</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Claim
          </Button>
        </div>
      </div>

      <Tabs defaultValue="claims" className="w-full">
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
                <div className="text-2xl font-bold">1,248</div>
                <p className="text-xs text-muted-foreground">+12% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">342</div>
                <p className="text-xs text-muted-foreground">-4% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Claim Value (KES)</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2M</div>
                <p className="text-xs text-muted-foreground">+8% from last month</p>
              </CardContent>
            </Card>
          </div>
          <InsuranceClaimsTable />
        </TabsContent>
        <TabsContent value="providers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Providers</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Covered Patients</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8,942</div>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Insurance Providers</CardTitle>
                <CardDescription>Manage all insurance providers</CardDescription>
              </CardHeader>
              <CardContent>
                <InsuranceProvidersTable />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Add New Provider</CardTitle>
                <CardDescription>Register a new insurance provider</CardDescription>
              </CardHeader>
              <CardContent>
                <AddInsuranceProviderForm />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="packages" className="space-y-4">
          <InsurancePackagesTable />
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
