"use client"

import { useState, useEffect } from "react"
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
import { Search, Plus, Minus, AlertTriangle, Loader2 } from "lucide-react"
import { inventoryApi, inventoryTransactionApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      adjustmentType: "add",
      quantity: 1,
      date: new Date(),
    },
  })

  // Load inventory items
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true)
        const data = await inventoryApi.getAll(undefined, "Active")
        setItems(data)
      } catch (error: any) {
        console.error("Error loading inventory items:", error)
        toast({
          title: "Error",
          description: "Failed to load inventory items.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadItems()
  }, [])

  // Filter items based on search term
  const filteredItems = items.filter(
    (item) =>
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.itemCode?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Handle selecting an item
  function selectItem(item: any) {
    setSelectedItem(item)
    form.setValue("itemId", item.itemId.toString(), { shouldValidate: true })
    setSearchTerm("") // Clear search after selection
  }

  // Handle form submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setSubmitting(true)
      
      const payload = {
        itemId: parseInt(values.itemId),
        adjustmentType: values.adjustmentType,
        quantity: values.quantity,
        reason: values.reason,
        date: values.date ? new Date(values.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        referenceNumber: values.referenceNumber || null,
        notes: values.notes || null,
      }

      await inventoryTransactionApi.create(payload)
      
      toast({
        title: "Success",
        description: "Stock adjustment recorded successfully.",
      })
      
      // Reset form
      form.reset({
        adjustmentType: "add",
        quantity: 1,
        date: new Date(),
      })
      setSelectedItem(null)
      setSearchTerm("")
      
      // Optionally refresh the page or navigate
      router.refresh()
    } catch (error: any) {
      console.error("Error recording stock adjustment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to record stock adjustment.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="itemId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Select Item</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or SKU..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1"
                      />
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading items...</span>
                      </div>
                    ) : searchTerm && filteredItems.length > 0 && !selectedItem ? (
                      <Card>
                        <CardContent className="p-2">
                          <ul className="divide-y">
                            {filteredItems.map((item) => (
                              <li
                                key={item.itemId}
                                className="py-2 px-2 hover:bg-muted cursor-pointer rounded-md"
                                onClick={() => {
                                  selectItem(item)
                                  field.onChange(item.itemId.toString())
                                }}
                              >
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground flex justify-between">
                                  <span>{item.itemCode || `INV-${item.itemId}`}</span>
                                  <span>Current Stock: {item.quantity || 0}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    ) : searchTerm && filteredItems.length === 0 ? (
                      <div className="text-sm text-muted-foreground py-2">No items found</div>
                    ) : null}

                    {selectedItem && (
                      <Card>
                        <CardContent className="p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{selectedItem.name}</div>
                              <div className="text-sm text-muted-foreground">{selectedItem.itemCode || `INV-${selectedItem.itemId}`}</div>
                            </div>
                            <Badge>Current Stock: {selectedItem.quantity || 0}</Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="mt-2"
                            onClick={() => {
                              setSelectedItem(null)
                              setSearchTerm("")
                              field.onChange("")
                              form.setValue("itemId", "")
                            }}
                          >
                            Change Item
                          </Button>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
          form.watch("quantity") > (selectedItem.quantity || 0) && (
            <div className="flex items-center p-3 text-amber-800 bg-amber-50 rounded-md border border-amber-200">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
              <div>
                <p className="font-medium">Warning: Insufficient Stock</p>
                <p className="text-sm">
                  The adjustment quantity ({form.watch("quantity")}) exceeds the current stock level (
                  {selectedItem.quantity || 0}).
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
              submitting ||
              !selectedItem ||
              (form.watch("adjustmentType") === "subtract" &&
                selectedItem &&
                form.watch("quantity") > (selectedItem.quantity || 0))
            }
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Record Adjustment
          </Button>
        </div>
      </form>
    </Form>
  )
}
