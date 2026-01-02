"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface StaffMember {
  id: string
  name: string
  role: string
  avatar?: string
  initials: string
  status: "on-duty" | "off-duty" | "on-break"
  assignedWard: string
  shiftTime: string
}

const morningShift: StaffMember[] = [
  {
    id: "N1",
    name: "Sarah Kamau",
    role: "Head Nurse",
    initials: "SK",
    status: "on-duty",
    assignedWard: "General Ward",
    shiftTime: "7:00 AM - 3:00 PM",
  },
  {
    id: "N2",
    name: "James Omondi",
    role: "Registered Nurse",
    avatar: "/diverse-group-meeting.png",
    initials: "JO",
    status: "on-duty",
    assignedWard: "Pediatric Ward",
    shiftTime: "7:00 AM - 3:00 PM",
  },
  {
    id: "N3",
    name: "Lucy Wanjiku",
    role: "Registered Nurse",
    initials: "LW",
    status: "on-break",
    assignedWard: "Maternity Ward",
    shiftTime: "7:00 AM - 3:00 PM",
  },
  {
    id: "N4",
    name: "Daniel Kiprop",
    role: "Nursing Assistant",
    avatar: "/diverse-group-meeting.png",
    initials: "DK",
    status: "on-duty",
    assignedWard: "Surgical Ward",
    shiftTime: "7:00 AM - 3:00 PM",
  },
]

const eveningShift: StaffMember[] = [
  {
    id: "N5",
    name: "Mary Njeri",
    role: "Registered Nurse",
    initials: "MN",
    status: "off-duty",
    assignedWard: "General Ward",
    shiftTime: "3:00 PM - 11:00 PM",
  },
  {
    id: "N6",
    name: "Peter Mwangi",
    role: "Registered Nurse",
    avatar: "/diverse-group-meeting.png",
    initials: "PM",
    status: "off-duty",
    assignedWard: "ICU",
    shiftTime: "3:00 PM - 11:00 PM",
  },
  {
    id: "N7",
    name: "Grace Akinyi",
    role: "Nursing Assistant",
    initials: "GA",
    status: "off-duty",
    assignedWard: "Pediatric Ward",
    shiftTime: "3:00 PM - 11:00 PM",
  },
]

const nightShift: StaffMember[] = [
  {
    id: "N8",
    name: "John Mutua",
    role: "Registered Nurse",
    avatar: "/diverse-group-meeting.png",
    initials: "JM",
    status: "off-duty",
    assignedWard: "General Ward",
    shiftTime: "11:00 PM - 7:00 AM",
  },
  {
    id: "N9",
    name: "Elizabeth Wafula",
    role: "Registered Nurse",
    initials: "EW",
    status: "off-duty",
    assignedWard: "Maternity Ward",
    shiftTime: "11:00 PM - 7:00 AM",
  },
  {
    id: "N10",
    name: "Michael Otieno",
    role: "Nursing Assistant",
    avatar: "/diverse-group-meeting.png",
    initials: "MO",
    status: "off-duty",
    assignedWard: "Surgical Ward",
    shiftTime: "11:00 PM - 7:00 AM",
  },
]

export function ShiftSchedule() {
  const getStatusBadge = (status: StaffMember["status"]) => {
    switch (status) {
      case "on-duty":
        return <Badge className="bg-green-100 text-green-800">On Duty</Badge>
      case "off-duty":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800">
            Off Duty
          </Badge>
        )
      case "on-break":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            On Break
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Schedule</CardTitle>
        <CardDescription>Nursing staff assignments and schedules</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="morning">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="morning">Morning</TabsTrigger>
            <TabsTrigger value="evening">Evening</TabsTrigger>
            <TabsTrigger value="night">Night</TabsTrigger>
          </TabsList>
          <TabsContent value="morning" className="mt-4">
            <div className="space-y-4">
              {morningShift.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                      <AvatarFallback>{staff.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(staff.status)}
                    <div className="text-xs text-muted-foreground">{staff.assignedWard}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="evening" className="mt-4">
            <div className="space-y-4">
              {eveningShift.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                      <AvatarFallback>{staff.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(staff.status)}
                    <div className="text-xs text-muted-foreground">{staff.assignedWard}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="night" className="mt-4">
            <div className="space-y-4">
              {nightShift.map((staff) => (
                <div key={staff.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={staff.avatar || "/placeholder.svg"} alt={staff.name} />
                      <AvatarFallback>{staff.initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {getStatusBadge(staff.status)}
                    <div className="text-xs text-muted-foreground">{staff.assignedWard}</div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
