import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Download, UserPlus } from "lucide-react"

export default function EmployeesPage() {
  const employees = [
    {
      id: "EMP-1001",
      name: "James Ndiwa",
      department: "Medical",
      position: "Chief Medical Officer",
      joinDate: "2020-01-15",
      status: "Active",
      contact: "+254 712 345 678",
      email: "james.ndiwa@transelgon.co.ke",
    },
    {
      id: "EMP-1002",
      name: "Sarah Isuvi",
      department: "Medical",
      position: "Senior Doctor",
      joinDate: "2020-03-10",
      status: "Active",
      contact: "+254 723 456 789",
      email: "sarah.isuvi@transelgon.co.ke",
    },
    {
      id: "EMP-1003",
      name: "Michael Siva",
      department: "Medical",
      position: "Specialist",
      joinDate: "2021-02-05",
      status: "Active",
      contact: "+254 734 567 890",
      email: "michael.siva@transelgon.co.ke",
    },
    {
      id: "EMP-1004",
      name: "Emily Logovane",
      department: "Medical",
      position: "Specialist",
      joinDate: "2021-05-20",
      status: "Active",
      contact: "+254 745 678 901",
      email: "emily.logovane@transelgon.co.ke",
    },
    {
      id: "EMP-1005",
      name: "Daniel Mirenja",
      department: "Finance",
      position: "Finance Manager",
      joinDate: "2020-06-15",
      status: "Active",
      contact: "+254 756 789 012",
      email: "daniel.mirenja@transelgon.co.ke",
    },
    {
      id: "EMP-1006",
      name: "Grace Savai",
      department: "HR",
      position: "HR Manager",
      joinDate: "2020-08-01",
      status: "Active",
      contact: "+254 767 890 123",
      email: "grace.savai@transelgon.co.ke",
    },
    {
      id: "EMP-1007",
      name: "Peter Livambula",
      department: "IT",
      position: "IT Manager",
      joinDate: "2021-01-10",
      status: "Active",
      contact: "+254 778 901 234",
      email: "peter.livambula@transelgon.co.ke",
    },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Management</h1>
          <p className="text-muted-foreground">Manage hospital staff and personnel</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Employee Directory</CardTitle>
          <CardDescription>View and manage hospital staff</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="all">All Staff</TabsTrigger>
                <TabsTrigger value="medical">Medical</TabsTrigger>
                <TabsTrigger value="admin">Administrative</TabsTrigger>
                <TabsTrigger value="support">Support</TabsTrigger>
              </TabsList>
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search employees..." className="w-full pl-8" />
              </div>
            </div>

            <TabsContent value="all" className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Join Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">{employee.id}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.department}</TableCell>
                        <TableCell>{employee.position}</TableCell>
                        <TableCell>{employee.joinDate}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              employee.status === "Active"
                                ? "default"
                                : employee.status === "On Leave"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {employee.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{employee.contact}</TableCell>
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
            </TabsContent>

            {/* Similar content for other tabs */}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
