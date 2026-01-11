"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Minus } from "lucide-react"
import { pharmacyApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"

interface StockAdjustmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  drugInventoryId?: number
  medicationId?: number
}

interface DrugInventoryItem {
  drugInventoryId: number
  medicationId: number
  batchNumber: string
  quantity: number
  unitPrice: number
  sellPrice: number
  expiryDate?: string
  location?: string
}

export function StockAdjustmentForm({
  open,
  onOpenChange,
  onSuccess,
  drugInventoryId: initialDrugInventoryId,
  medicationId: initialMedicationId,
}: StockAdjustmentFormProps) {
  const [loading, setLoading] = useState(false)
  const [drugInventories, setDrugInventories] = useState<DrugInventoryItem[]>([])
  const [medications, setMedications] = useState<any[]>([])
  const [loadingData, setLoadingData] = useState(false)

  // Form state
  const [selectedDrugInventoryId, setSelectedDrugInventoryId] = useState<string>(
    initialDrugInventoryId?.toString() || ""
  )
  const [selectedMedicationId, setSelectedMedicationId] = useState<string>(
    initialMedicationId?.toString() || ""
  )
  const [adjustmentType, setAdjustmentType] = useState<string>("RECEIPT")
  const [adjustmentDate, setAdjustmentDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [quantity, setQuantity] = useState<string>("")
  const [batchNumber, setBatchNumber] = useState("")
  const [unitPrice, setUnitPrice] = useState<string>("")
  const [sellPrice, setSellPrice] = useState<string>("")
  const [manufactureDate, setManufactureDate] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [minPrice, setMinPrice] = useState<string>("")
  const [location, setLocation] = useState("")
  const [referenceNumber, setReferenceNumber] = useState("")
  const [notes, setNotes] = useState("")

  // Load medications and drug inventories
  useEffect(() => {
    if (open) {
      loadMedications()
      if (selectedMedicationId) {
        loadDrugInventories(selectedMedicationId)
      }
    } else {
      // Reset form when closed
      resetForm()
    }
  }, [open, selectedMedicationId])

  // Load selected drug inventory details (only for non-RECEIPT adjustments)
  useEffect(() => {
    if (selectedDrugInventoryId && drugInventories.length > 0 && adjustmentType !== "RECEIPT") {
      const selected = drugInventories.find(
        (di) => di.drugInventoryId.toString() === selectedDrugInventoryId
      )
      if (selected) {
        if (!batchNumber) setBatchNumber(selected.batchNumber)
        if (!unitPrice) setUnitPrice(selected.unitPrice.toString())
        if (!sellPrice) setSellPrice(selected.sellPrice.toString())
        if (!expiryDate && selected.expiryDate)
          setExpiryDate(selected.expiryDate.split("T")[0])
        if (!location && selected.location) setLocation(selected.location)
        setSelectedMedicationId(selected.medicationId.toString())
      }
    }
  }, [selectedDrugInventoryId, drugInventories, adjustmentType])

  const loadMedications = async () => {
    try {
      setLoadingData(true)
      const data = await pharmacyApi.getMedications(undefined, 1, 100)
      setMedications(data || [])
    } catch (err: any) {
      console.error("Error loading medications:", err)
      toast({
        title: "Error",
        description: "Failed to load medications",
        variant: "destructive",
      })
    } finally {
      setLoadingData(false)
    }
  }

  const loadDrugInventories = async (medId: string) => {
    try {
      const data = await pharmacyApi.getDrugInventory(medId)
      setDrugInventories(Array.isArray(data) ? data : [])
    } catch (err: any) {
      console.error("Error loading drug inventories:", err)
    }
  }

  const resetForm = () => {
    setSelectedDrugInventoryId(initialDrugInventoryId?.toString() || "")
    setSelectedMedicationId(initialMedicationId?.toString() || "all")
    setAdjustmentType("RECEIPT")
    setAdjustmentDate(new Date().toISOString().split("T")[0])
    setQuantity("")
    setBatchNumber("")
    setUnitPrice("")
    setSellPrice("")
    setManufactureDate("")
    setExpiryDate("")
    setMinPrice("")
    setLocation("")
    setReferenceNumber("")
    setNotes("")
  }

  const handleMedicationChange = (medId: string) => {
    setSelectedMedicationId(medId)
    setSelectedDrugInventoryId("")
    if (medId && medId !== "all") {
      loadDrugInventories(medId)
    } else {
      setDrugInventories([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedMedicationId || selectedMedicationId === "all") {
      toast({
        title: "Error",
        description: "Please select a medication",
        variant: "destructive",
      })
      return
    }

    // For RECEIPT adjustments, drugInventoryId is optional (can create new batch)
    // For other adjustments, drugInventoryId is required
    if (adjustmentType !== "RECEIPT" && !selectedDrugInventoryId) {
      toast({
        title: "Error",
        description: "Please select a drug inventory batch",
        variant: "destructive",
      })
      return
    }

    if (!adjustmentType || !adjustmentDate || !quantity) {
      toast({
        title: "Error",
        description: "Adjustment type, date, and quantity are required",
        variant: "destructive",
      })
      return
    }

    if (adjustmentType === "RECEIPT" && !batchNumber) {
      toast({
        title: "Error",
        description: "Batch number is required for receipt adjustments",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      const adjustmentData: any = {
        medicationId: parseInt(selectedMedicationId),
        adjustmentType,
        adjustmentDate,
        quantity: Math.abs(parseInt(quantity)), // Always positive, API handles sign based on type
        batchNumber: batchNumber || undefined,
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        sellPrice: sellPrice ? parseFloat(sellPrice) : undefined,
        manufactureDate: manufactureDate || undefined,
        expiryDate: expiryDate || undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        location: location || undefined,
        referenceType: adjustmentType === "RECEIPT" ? "purchase_order" : "adjustment",
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
      }

      // For non-RECEIPT adjustments, include drugInventoryId
      if (adjustmentType !== "RECEIPT" && selectedDrugInventoryId) {
        adjustmentData.drugInventoryId = parseInt(selectedDrugInventoryId)
      } else if (adjustmentType === "RECEIPT" && selectedDrugInventoryId) {
        // For RECEIPT, if batch is selected, use it; otherwise create new
        adjustmentData.drugInventoryId = parseInt(selectedDrugInventoryId)
      }

      await pharmacyApi.createStockAdjustment(adjustmentData)

      toast({
        title: "Success",
        description: "Stock adjustment created successfully",
      })

      onSuccess?.()
      onOpenChange(false)
      resetForm()
    } catch (err: any) {
      console.error("Error creating stock adjustment:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to create stock adjustment",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getQuantityLabel = () => {
    switch (adjustmentType) {
      case "RECEIPT":
        return "Quantity to Add"
      case "DISPENSATION":
        return "Quantity to Dispense"
      case "EXPIRY":
      case "DAMAGE":
        return "Quantity to Remove"
      case "ADJUSTMENT":
      case "CORRECTION":
        return "Quantity Adjustment (can be positive or negative)"
      default:
        return "Quantity"
    }
  }

  const isQuantityPositive = () => {
    return ["RECEIPT", "ADJUSTMENT", "CORRECTION"].includes(adjustmentType)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Adjustment</DialogTitle>
          <DialogDescription>
            Record a stock movement: receipt, adjustment, expiry, damage, or transfer
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="medication">Medication *</Label>
              <Select
                value={selectedMedicationId}
                onValueChange={handleMedicationChange}
                disabled={!!initialMedicationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medication" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Select medication</SelectItem>
                  {medications.map((med) => (
                    <SelectItem key={med.medicationId} value={med.medicationId.toString()}>
                      {med.name || med.medicationName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">
                Drug Inventory Batch {adjustmentType !== "RECEIPT" ? "*" : ""}
              </Label>
              {loadingData ? (
                <div className="flex items-center justify-center p-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : adjustmentType === "RECEIPT" ? (
                <>
                  <Input
                    id="batch"
                    value={selectedDrugInventoryId}
                    onChange={(e) => setSelectedDrugInventoryId(e.target.value)}
                    placeholder="Leave empty for new batch or select existing"
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    For RECEIPT: Enter batch number below. A new batch will be created if it doesn't exist.
                  </p>
                </>
              ) : (
                <Select
                  value={selectedDrugInventoryId}
                  onValueChange={setSelectedDrugInventoryId}
                  disabled={!selectedMedicationId || selectedMedicationId === "all"}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch" />
                  </SelectTrigger>
                  <SelectContent>
                    {drugInventories.map((di) => (
                      <SelectItem key={di.drugInventoryId} value={di.drugInventoryId.toString()}>
                        {di.batchNumber} (Qty: {di.quantity})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adjustmentType">Adjustment Type *</Label>
              <Select value={adjustmentType} onValueChange={setAdjustmentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIPT">Receipt (Add Stock)</SelectItem>
                  <SelectItem value="DISPENSATION">Dispensation (Remove Stock)</SelectItem>
                  <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  <SelectItem value="CORRECTION">Correction</SelectItem>
                  <SelectItem value="EXPIRY">Expiry (Remove Stock)</SelectItem>
                  <SelectItem value="DAMAGE">Damage (Remove Stock)</SelectItem>
                  <SelectItem value="RETURN">Return</SelectItem>
                  <SelectItem value="TRANSFER">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adjustmentDate">Adjustment Date *</Label>
              <Input
                id="adjustmentDate"
                type="date"
                value={adjustmentDate}
                onChange={(e) => setAdjustmentDate(e.target.value)}
                required
              />
            </div>
          </div>

          {adjustmentType === "RECEIPT" && (
            <div className="space-y-2">
              <Label htmlFor="batchNumber">Batch Number *</Label>
              <Input
                id="batchNumber"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="Enter batch number"
                required={adjustmentType === "RECEIPT"}
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{getQuantityLabel()} *</Label>
              <Input
                id="quantity"
                type="number"
                min={isQuantityPositive() ? "0" : undefined}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                required
              />
              {selectedDrugInventoryId && drugInventories.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Current quantity:{" "}
                  {
                    drugInventories.find(
                      (di) => di.drugInventoryId.toString() === selectedDrugInventoryId
                    )?.quantity
                  }
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Storage location"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Buy Price (Unit Price)</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellPrice">Sell Price</Label>
              <Input
                id="sellPrice"
                type="number"
                step="0.01"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="manufactureDate">Manufacture Date</Label>
              <Input
                id="manufactureDate"
                type="date"
                value={manufactureDate}
                onChange={(e) => setManufactureDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">Expiry Date</Label>
              <Input
                id="expiryDate"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minPrice">Minimum Price</Label>
              <Input
                id="minPrice"
                type="number"
                step="0.01"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referenceNumber">Reference Number</Label>
              <Input
                id="referenceNumber"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="PO number, adjustment ID, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this adjustment..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Adjustment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
