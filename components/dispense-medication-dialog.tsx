"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Pill, AlertCircle, CheckCircle } from "lucide-react"
import { pharmacyApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

interface DispenseMedicationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: number
  onDispensed?: () => void
}

interface PrescriptionItem {
  itemId: number
  prescriptionId: number
  medicationId: number | null
  medicationName: string
  dosage: string
  frequency: string
  duration: string
  prescribedQuantity: number
  instructions: string | null
  status: string
  prescriptionNumber: string
  prescriptionDate: string
  drugInventoryId: number | null
  batchNumber: string | null
  expiryDate: string | null
  availableQuantity: number | null
  unitPrice: number | null
  totalPrice: number | null
}

interface DispensingItem {
  prescriptionItem: PrescriptionItem
  quantityToDispense: number
  notes: string
}

export function DispenseMedicationDialog({
  open,
  onOpenChange,
  patientId,
  onDispensed,
}: DispenseMedicationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>([])
  const [dispensingItems, setDispensingItems] = useState<Map<number, DispensingItem>>(new Map())
  const [dispensing, setDispensing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (open && patientId) {
      loadPrescriptionItems()
    }
  }, [open, patientId])

  const loadPrescriptionItems = async () => {
    try {
      setLoading(true)
      const items = await pharmacyApi.getPaidPrescriptionItemsReadyForDispensing(patientId.toString())
      setPrescriptionItems(items || [])
      
      // Initialize dispensing items with pre-selected batch from invoice
      const initialDispensing = new Map<number, DispensingItem>()
      for (const item of items || []) {
        // Only include items that have drug_inventory (drugInventoryId is not null)
        if (item.drugInventoryId) {
          initialDispensing.set(item.itemId, {
            prescriptionItem: item,
            quantityToDispense: Math.min(item.prescribedQuantity, item.availableQuantity || item.prescribedQuantity),
            notes: "",
          })
        }
      }
      setDispensingItems(initialDispensing)
    } catch (error: any) {
      console.error("Error loading prescription items:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load prescription items",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Quantity is fixed to the paid amount - no editing allowed

  const handleNotesChange = (itemId: number, notes: string) => {
    const dispensingItem = dispensingItems.get(itemId)
    if (dispensingItem) {
      setDispensingItems(
        new Map(dispensingItems).set(itemId, {
          ...dispensingItem,
          notes,
        })
      )
    }
  }

  const handleDispense = async () => {
    // Validate all items
    for (const [itemId, dispensingItem] of dispensingItems.entries()) {
      const item = dispensingItem.prescriptionItem
      
      if (!item.drugInventoryId) {
        toast({
          title: "Missing inventory batch",
          description: `No inventory batch found for ${item.medicationName}`,
          variant: "destructive",
        })
        return
      }

      if (dispensingItem.quantityToDispense > (item.availableQuantity || 0)) {
        toast({
          title: "Insufficient quantity",
          description: `Insufficient stock for ${item.medicationName}. Available: ${item.availableQuantity || 0}`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      setDispensing(true)

      // Dispense each item
      const results = []
      for (const [itemId, dispensingItem] of dispensingItems.entries()) {
        const item = dispensingItem.prescriptionItem
        
        if (!item.drugInventoryId) {
          console.error(`Skipping item ${itemId}: No drugInventoryId`)
          results.push({ itemId, success: false, error: "No drug inventory ID" })
          continue
        }

        try {
          await pharmacyApi.createDispensation({
            prescriptionItemId: itemId,
            drugInventoryId: item.drugInventoryId,
            quantityDispensed: dispensingItem.quantityToDispense,
            batchNumber: item.batchNumber || null,
            expiryDate: item.expiryDate || null,
            notes: dispensingItem.notes || null,
          })
          results.push({ itemId, success: true })
        } catch (error: any) {
          console.error(`Error dispensing item ${itemId}:`, error)
          results.push({ itemId, success: false, error: error.message })
        }
      }

      const successCount = results.filter((r) => r.success).length
      const failCount = results.length - successCount

      if (results.length === 0) {
        toast({
          title: "No items to dispense",
          description: "No items were processed. Please check the items and try again.",
          variant: "destructive",
        })
        return
      }

      if (successCount > 0) {
        toast({
          title: "Medications dispensed",
          description: `Successfully dispensed ${successCount} medication(s)${failCount > 0 ? `, ${failCount} failed` : ""}`,
        })
        onOpenChange(false)
        if (onDispensed) {
          onDispensed()
        }
      } else {
        // All failed
        toast({
          title: "Failed to dispense medications",
          description: `${failCount} medication(s) could not be dispensed. Please check and retry.`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error dispensing medications:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to dispense medications",
        variant: "destructive",
      })
    } finally {
      setDispensing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Dispense Medications
          </DialogTitle>
          <DialogDescription>
            Review and dispense paid prescription medications to the patient
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading prescription items...</span>
          </div>
        ) : prescriptionItems.length === 0 ? (
          <div className="py-8 text-center">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No paid prescription items ready for dispensing</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Prescribed</TableHead>
                    <TableHead>Batch / Expiry</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(dispensingItems.values()).map((dispensingItem) => {
                    const item = dispensingItem.prescriptionItem
                    return (
                      <TableRow key={item.itemId}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.medicationName}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.dosage} - {item.frequency} - {item.duration}
                            </div>
                            {item.instructions && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {item.instructions}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{item.prescribedQuantity}</div>
                          <div className="text-xs text-muted-foreground">
                            Prescription: {item.prescriptionNumber}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {item.batchNumber || "N/A"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Exp: {formatDate(item.expiryDate)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {item.availableQuantity || 0}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {dispensingItem.quantityToDispense}
                          </div>
                          {item.totalPrice && (
                            <div className="text-xs text-muted-foreground">
                              Paid: {formatCurrency(item.totalPrice)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={dispensingItem.notes}
                            onChange={(e) => handleNotesChange(item.itemId, e.target.value)}
                            placeholder="Optional notes"
                            className="w-32 min-h-[60px]"
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={dispensing}>
            Cancel
          </Button>
          <Button onClick={handleDispense} disabled={dispensing || prescriptionItems.length === 0}>
            {dispensing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Dispensing...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Dispense Medications
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
