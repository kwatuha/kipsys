"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, AlertTriangle } from "lucide-react"

// Mock data for inventory items
const inventoryItems = [
  {
    id: "1",
    name: "Surgical Gloves (Medium)",
    sku: "SG-M-001",
    category: "Medical Supplies",
    currentStock: 1250,
  },
  {
    id: "2",
    name: "Paracetamol 500mg",
    sku: "MED-P500-002",
    category: "Pharmaceuticals",
    currentStock: 350,
  },
  {
    id: "3",
    name: "Disposable Syringes 5ml",
    sku: "DS-5ML-003",
    category: "Medical Supplies",
    currentStock: 3200,
  },
  {
    id: "4",
    name: "Amoxicillin 250mg",
    sku: "MED-A250-004",
    category: "Pharmaceuticals",
    currentStock: 180,
  },
  {
    id: "5",
    name: "Blood Pressure Monitor",
    sku: "EQ-BPM-005",
    category: "Equipment",
    currentStock: 25,
  },
]

// Form schema
const formSchema = z.object({
  itemId: z.string({
    required_error: "Please select an item.",
  }),
  adjustmentType: z.enum(["add", "subtract"], {
    required_error: "Please select an adjustment type.",
  }),
  quantity: z.coerce.number().positive({
    message: "Quantity must be a positive number.",
  }),
  reason: z.enum(["purchase", "return", "damage", "expiry", "correction", "use", "transfer", "other"], {
    required_error: "Please select a reason.",
  }),
  notes: z.string().optional(),
  referenceNumber: z.string().optional(),
  date: z.date({
    required_error: "Please select a date.",
  }),
})

export function StockAdjustmentForm() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: "add",
      quantity: 1,
      date: new Date(),
    },
  })

  // Filter items based on search term
  const filteredItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle selecting an item
  function selectItem(item: any) {
    setSelectedItem(item)
    form.setValue("itemId", item.id)
  }

  // Handle form submission
  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real application, you would send this data to your backend
    console.log(values)
    alert("Stock adjustment recorded successfully!")
    // Reset form
    form.reset()
    setSelectedItem(null)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormLabel>Select Item</FormLabel>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          {searchTerm && filteredItems.length > 0 && !selectedItem && (
            <Card>
              <CardContent className="p-2">
                <ul className="divide-y">
                  {filteredItems.map((item) => (
                    <li
                      key={item.id}
                      className="py-2 px-2 hover:bg-muted cursor-pointer rounded-md"
                      onClick={() => selectItem(item)}
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-muted-foreground flex justify-between">
                        <span>{item.sku}</span>
                        <span>Current Stock: {item.currentStock}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {selectedItem && (
            <Card>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{selectedItem.name}</div>
                    <div className="text-sm text-muted-foreground">{selectedItem.sku}</div>
                  </div>
                  <Badge>Current Stock: {selectedItem.currentStock}</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    setSelectedItem(null)
                    form.setValue("itemId", "")
                  }}
                >
                  Change Item
                </Button>
              </CardContent>
            </Card>
          )}

          {!selectedItem && <FormMessage>Please select an item to adjust</FormMessage>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="adjustmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Adjustment Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="add">
                      <div className="flex items-center">
                        <Plus className="mr-2 h-4 w-4 text-green-500" />
                        Add Stock
                      </div>
                    </SelectItem>
                    <SelectItem value="subtract">
                      <div className="flex items-center">
                        <Minus className="mr-2 h-4 w-4 text-red-500" />
                        Subtract Stock
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantity</FormLabel>
                <FormControl>
                  <Input type="number" min="1" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reason</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="purchase">New Purchase</SelectItem>
                    <SelectItem value="return">Return from Department</SelectItem>
                    <SelectItem value="damage">Damaged/Broken</SelectItem>
                    <SelectItem value="expiry">Expired</SelectItem>
                    <SelectItem value="correction">Inventory Correction</SelectItem>
                    <SelectItem value="use">Used in Procedure</SelectItem>
                    <SelectItem value="transfer">Transfer to Another Location</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={field.value ? new Date(field.value).toISOString().split("T")[0] : ""}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value) : null
                      field.onChange(date)
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="referenceNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Reference Number</FormLabel>
              <FormControl>
                <Input placeholder="e.g., PO-2023-089, REQ-2023-112" {...field} />
              </FormControl>
              <FormDescription>Purchase order, requisition, or other reference number</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea placeholder="Additional notes about this adjustment" className="min-h-[100px]" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {form.watch("adjustmentType") === "subtract" &&
          selectedItem &&
          form.watch("quantity") > selectedItem.currentStock && (
            <div className="flex items-center p-3 text-amber-800 bg-amber-50 rounded-md border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="font-medium">Warning: Insufficient Stock</p>
                <p className="text-sm">
                  The adjustment quantity ({form.watch("quantity")}) exceeds the current stock level (
                  {selectedItem.currentStock}).
                </p>
              </div>
            </div>
          )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              !selectedItem ||
              (form.watch("adjustmentType") === "subtract" &&
                selectedItem &&
                form.watch("quantity") > selectedItem.currentStock)
            }
          >
            Record Adjustment
          </Button>
        </div>
      </form>
    </Form>
  )
}
