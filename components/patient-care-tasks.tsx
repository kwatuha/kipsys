"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle2, Clock, Filter } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

type Priority = "high" | "medium" | "low"
type Status = "pending" | "in-progress" | "completed"

interface Task {
  id: string
  patientId: string
  patientName: string
  patientAvatar?: string
  patientInitials: string
  task: string
  priority: Priority
  status: Status
  dueTime: string
  assignedTo: string
}

const tasks: Task[] = [
  {
    id: "T1001",
    patientId: "P1234",
    patientName: "John Imbayi",
    patientAvatar: "/thoughtful-portrait.png",
    patientInitials: "JI",
    task: "Administer IV medication",
    priority: "high",
    status: "pending",
    dueTime: "10:30 AM",
    assignedTo: "Nurse Sarah",
  },
  {
    id: "T1002",
    patientId: "P2345",
    patientName: "Mary Wangari",
    patientInitials: "MW",
    task: "Check vital signs",
    priority: "medium",
    status: "in-progress",
    dueTime: "11:00 AM",
    assignedTo: "Nurse James",
  },
  {
    id: "T1003",
    patientId: "P3456",
    patientName: "David Kimutai",
    patientAvatar: "/thoughtful-portrait.png",
    patientInitials: "DK",
    task: "Change wound dressing",
    priority: "high",
    status: "pending",
    dueTime: "11:15 AM",
    assignedTo: "Nurse Sarah",
  },
  {
    id: "T1004",
    patientId: "P4567",
    patientName: "Sarah Lwikane",
    patientAvatar: "/diverse-group-chatting.png",
    patientInitials: "SL",
    task: "Assist with ambulation",
    priority: "low",
    status: "pending",
    dueTime: "11:30 AM",
    assignedTo: "Nurse James",
  },
  {
    id: "T1005",
    patientId: "P5678",
    patientName: "Michael Imbunya",
    patientAvatar: "/diverse-group-chatting.png",
    patientInitials: "MI",
    task: "Administer oral medication",
    priority: "medium",
    status: "pending",
    dueTime: "12:00 PM",
    assignedTo: "Nurse Sarah",
  },
]

export function PatientCareTasks() {
  const [filter, setFilter] = useState<Priority | "all">("all")

  const filteredTasks = filter === "all" ? tasks : tasks.filter((task) => task.priority === filter)

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>
      case "medium":
        return <Badge variant="default">Medium</Badge>
      case "low":
        return <Badge variant="secondary">Low</Badge>
    }
  }

  const getStatusBadge = (status: Status) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
            Pending
          </Badge>
        )
      case "in-progress":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-800">
            In Progress
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-800">
            Completed
          </Badge>
        )
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Patient Care Tasks</CardTitle>
            <CardDescription>Manage and track patient care activities</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                {filter === "all" ? "All Priorities" : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Priority`}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilter("all")}>All Priorities</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("high")}>High Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("medium")}>Medium Priority</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilter("low")}>Low Priority</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Patient</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={task.patientAvatar || "/placeholder.svg"} alt={task.patientName} />
                      <AvatarFallback>{task.patientInitials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{task.patientName}</div>
                      <div className="text-xs text-muted-foreground">{task.patientId}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{task.task}</TableCell>
                <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>{task.dueTime}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Complete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
