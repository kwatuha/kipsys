"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { pharmacyApi } from "@/lib/api"

interface Medication {
  medicationId: number
  name?: string
  medicationName?: string
  medicationCode?: string
  genericName?: string
  dosageForm?: string
  strength?: string
  category?: string
}

interface MedicationComboboxProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  onMedicationSelect?: (medication: Medication | null) => void
}

export function MedicationCombobox({
  value,
  onValueChange,
  placeholder = "Search medication by name, code, or generic name...",
  disabled = false,
  onMedicationSelect,
}: MedicationComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [medications, setMedications] = React.useState<Medication[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [inventoryData, setInventoryData] = React.useState<Record<number, { totalQuantity: number; hasStock: boolean }>>({})

  // Load selected medication if value is provided and not in current list
  React.useEffect(() => {
    const loadSelectedMedication = async () => {
      if (value && !medications.find((m) => m.medicationId.toString() === value)) {
        try {
          const medication = await pharmacyApi.getMedication(value)
          if (medication) {
            setMedications((prev) => {
              if (!prev.find((m) => m.medicationId.toString() === value)) {
                return [...prev, medication]
              }
              return prev
            })
          }
        } catch (error) {
          console.error("Error loading selected medication:", error)
        }
      }
    }

    loadSelectedMedication()
  }, [value])

  // Load medications when popover opens
  React.useEffect(() => {
    if (open) {
      loadMedications()
      loadInventoryData()
    }
  }, [open])

  // Debounced search
  React.useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadMedications(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, open])

  const loadMedications = async (search?: string) => {
    try {
      setLoading(true)
      const data = await pharmacyApi.getMedications(search)
      setMedications(data || [])
    } catch (error) {
      console.error("Error loading medications:", error)
      setMedications([])
    } finally {
      setLoading(false)
    }
  }

  const loadInventoryData = async () => {
    try {
      // Load all drug inventory to calculate totals per medication
      const inventoryItems = await pharmacyApi.getDrugInventory()
      
      // Calculate total quantity per medication
      const inventoryMap: Record<number, { totalQuantity: number; hasStock: boolean }> = {}
      
      inventoryItems.forEach((item: any) => {
        const medId = item.medicationId
        const quantity = parseInt(item.quantity || 0)
        
        if (!inventoryMap[medId]) {
          inventoryMap[medId] = { totalQuantity: 0, hasStock: false }
        }
        
        inventoryMap[medId].totalQuantity += quantity
        if (quantity > 0) {
          inventoryMap[medId].hasStock = true
        }
      })
      
      setInventoryData(inventoryMap)
    } catch (error) {
      console.error("Error loading inventory data:", error)
    }
  }

  const selectedMedication = medications.find(
    (m) => m.medicationId.toString() === value
  )

  const getMedicationDisplayName = (medication: Medication) => {
    const name = medication.name || medication.medicationName || "Unknown"
    const code = medication.medicationCode ? `(${medication.medicationCode})` : ""
    const generic = medication.genericName ? `- ${medication.genericName}` : ""
    return `${name} ${code} ${generic}`.trim()
  }

  const getInventoryStatus = (medicationId: number) => {
    const inventory = inventoryData[medicationId]
    if (!inventory) {
      return { hasStock: false, quantity: 0, label: "No inventory data" }
    }
    
    if (!inventory.hasStock || inventory.totalQuantity === 0) {
      return { hasStock: false, quantity: 0, label: "Out of stock" }
    }
    
    return {
      hasStock: true,
      quantity: inventory.totalQuantity,
      label: `${inventory.totalQuantity} available`,
    }
  }

  const handleSelect = (medicationId: string) => {
    onValueChange(medicationId)
    setOpen(false)
    setSearchQuery("")
    
    const selected = medications.find((m) => m.medicationId.toString() === medicationId)
    if (onMedicationSelect) {
      onMedicationSelect(selected || null)
    }
  }

  const filteredMedications = React.useMemo(() => {
    if (!searchQuery) return medications

    const lowerQuery = searchQuery.toLowerCase()
    return medications.filter((medication) => {
      const name = (medication.name || medication.medicationName || "").toLowerCase()
      const code = (medication.medicationCode || "").toLowerCase()
      const generic = (medication.genericName || "").toLowerCase()
      const category = (medication.category || "").toLowerCase()
      const strength = (medication.strength || "").toLowerCase()

      return (
        name.includes(lowerQuery) ||
        code.includes(lowerQuery) ||
        generic.includes(lowerQuery) ||
        category.includes(lowerQuery) ||
        strength.includes(lowerQuery)
      )
    })
  }, [medications, searchQuery])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedMedication
            ? getMedicationDisplayName(selectedMedication)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name, code, generic name, category, or strength..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading medications...
                </span>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchQuery
                    ? "No medications found."
                    : "Start typing to search for medications..."}
                </CommandEmpty>
                <CommandGroup>
                  {filteredMedications.map((medication) => {
                    const inventoryStatus = getInventoryStatus(medication.medicationId)
                    return (
                      <CommandItem
                        key={medication.medicationId}
                        value={medication.medicationId.toString()}
                        onSelect={() => handleSelect(medication.medicationId.toString())}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center flex-1">
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === medication.medicationId.toString()
                                ? "opacity-100"
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {medication.name || medication.medicationName || "Unknown"}
                              </span>
                              {medication.medicationCode && (
                                <span className="text-xs text-muted-foreground">
                                  ({medication.medicationCode})
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              {medication.genericName && (
                                <span>{medication.genericName}</span>
                              )}
                              {medication.strength && (
                                <span>• {medication.strength}</span>
                              )}
                              {medication.dosageForm && (
                                <span>• {medication.dosageForm}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant={inventoryStatus.hasStock ? "default" : "secondary"}
                          className="ml-2"
                        >
                          <Package className="h-3 w-3 mr-1" />
                          {inventoryStatus.label}
                        </Badge>
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

