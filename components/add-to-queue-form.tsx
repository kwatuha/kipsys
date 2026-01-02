"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { PatientCombobox } from "@/components/patient-combobox"
import { queueApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface AddToQueueFormProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSuccess?: () => void
  queueEntry?: any
}

export function AddToQueueForm({ open, onOpenChange, onSuccess, queueEntry }: AddToQueueFormProps) {
  const [patientId, setPatientId] = useState<string>("")
  const [patientName, setPatientName] = useState<string>("")
  const [servicePoint, setServicePoint] = useState("consultation")
  const [priority, setPriority] = useState("normal")
  const [estimatedWaitTime, setEstimatedWaitTime] = useState<string>("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!queueEntry

  // Set form values when editing
  useEffect(() => {
    if (queueEntry && open) {
      setPatientId(queueEntry.patientId?.toString() || "")
      setPatientName(
        queueEntry.patientFirstName && queueEntry.patientLastName
          ? `${queueEntry.patientFirstName} ${queueEntry.patientLastName}`
          : ""
      )
      setServicePoint(queueEntry.servicePoint || "consultation")
      setPriority(queueEntry.priority || "normal")
      setEstimatedWaitTime(queueEntry.estimatedWaitTime?.toString() || "")
      setNotes(queueEntry.notes || "")
    } else if (!queueEntry && open) {
      // Reset form for new entry
      setPatientId("")
      setPatientName("")
      setServicePoint("consultation")
      setPriority("normal")
      setEstimatedWaitTime("")
      setNotes("")
      setError(null)
    }
  }, [queueEntry, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!patientId) {
      setError("Please select a patient")
      setLoading(false)
      return
    }

    try {
      const payload: any = {
        patientId: parseInt(patientId),
        servicePoint,
        priority,
        notes: notes && notes.trim() !== "" ? notes.trim() : null,
      }

      if (estimatedWaitTime && estimatedWaitTime.trim() !== "") {
        payload.estimatedWaitTime = parseInt(estimatedWaitTime)
      } else {
        payload.estimatedWaitTime = null
      }

      if (isEditing) {
        await queueApi.update(queueEntry.queueId.toString(), payload)
        toast({
          title: "Queue entry updated",
          description: "Queue entry has been updated successfully.",
        })
      } else {
        await queueApi.create(payload)
        toast({
          title: "Patient added to queue",
          description: "Patient has been added to the queue successfully.",
        })
      }

      setLoading(false)
      onOpenChange?.(false)
      onSuccess?.()

      // Reset form
      setPatientId("")
      setPatientName("")
      setServicePoint("consultation")
      setPriority("normal")
      setEstimatedWaitTime("")
      setNotes("")
    } catch (err: any) {
      console.error("Error saving queue entry:", err)
      setError(err.message || "Failed to save queue entry")
      setLoading(false)
      toast({
        title: "Error",
        description: err.message || "Failed to save queue entry",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Queue Entry" : "Add Patient to Queue"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the queue entry details."
              : "Assign this patient to a service queue and set priority level."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{error}</div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="patient">Patient {isEditing && "(Read-only)"}</Label>
              {isEditing ? (
                <Input id="patient" value={patientName || ""} readOnly className="bg-muted" />
              ) : (
                <PatientCombobox
                  value={patientId}
                  onValueChange={(value, patient) => {
                    setPatientId(value)
                    if (patient) {
                      setPatientName(`${patient.firstName || ""} ${patient.lastName || ""}`.trim())
                    } else {
                      setPatientName("")
                    }
                  }}
                  placeholder="Search for a patient..."
                />
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="servicePoint">Service Point</Label>
              <Select value={servicePoint} onValueChange={setServicePoint} required>
                <SelectTrigger id="servicePoint">
                  <SelectValue placeholder="Select service point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="triage">Triage</SelectItem>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                  <SelectItem value="radiology">Radiology</SelectItem>
                  <SelectItem value="pharmacy">Pharmacy</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority} required>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="estimatedWaitTime">Estimated Wait Time (minutes, optional)</Label>
              <Input
                id="estimatedWaitTime"
                type="number"
                min="0"
                placeholder="e.g., 15"
                value={estimatedWaitTime}
                onChange={(e) => setEstimatedWaitTime(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any special instructions or notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange?.(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !patientId}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? "Updating..." : "Adding..."}
                </>
              ) : isEditing ? (
                "Update Queue Entry"
              ) : (
                "Add to Queue"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
