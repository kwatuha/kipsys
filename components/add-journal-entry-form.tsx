"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { CalendarIcon, Loader2, Plus, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"

const journalEntrySchema = z.object({
  entryDate: z.date({
    required_error: "Entry date is required.",
  }),
  reference: z.string().min(1, {
    message: "Reference is required.",
  }),
  description: z.string().min(1, {
    message: "Description is required.",
  }),
  entries: z
    .array(
      z.object({
        account: z.string().min(1, {
          message: "Account is required.",
        }),
        description: z.string().optional(),
        debit: z.string().optional(),
        credit: z.string().optional(),
      }),
    )
    .min(2, {
      message: "At least two entries are required for a journal entry.",
    }),
  notes: z.string().optional(),
})

type JournalEntryFormValues = z.infer<typeof journalEntrySchema>

const defaultValues: Partial<JournalEntryFormValues> = {
  reference: "",
  description: "",
  entries: [
    { account: "", description: "", debit: "", credit: "" },
    { account: "", description: "", debit: "", credit: "" },
  ],
  notes: "",
}

export function AddJournalEntryForm({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<JournalEntryFormValues>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "entries",
  })

  function onSubmit(data: JournalEntryFormValues) {
    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      console.log(data)
      toast({
        title: "Journal entry created",
        description: `Journal entry ${data.reference} has been created.`,
      })
      setIsSubmitting(false)
      onOpenChange(false)
      form.reset()
    }, 1000)
  }

  // Calculate totals
  const watchedEntries = form.watch("entries")
  const totalDebit = watchedEntries.reduce((sum, entry) => {
    const debitValue = Number.parseFloat(entry.debit || "0")
    return sum + (isNaN(debitValue) ? 0 : debitValue)
  }, 0)

  const totalCredit = watchedEntries.reduce((sum, entry) => {
    const creditValue = Number.parseFloat(entry.credit || "0")
    return sum + (isNaN(creditValue) ? 0 : creditValue)
  }, 0)

  const isBalanced = totalDebit === totalCredit

  // Mock data for accounts
  const accounts = [
    { id: "1000", name: "Cash" },
    { id: "1100", name: "Accounts Receivable" },
    { id: "1200", name: "Inventory" },
    { id: "1300", name: "Prepaid Expenses" },
    { id: "1400", name: "Equipment" },
    { id: "2000", name: "Accounts Payable" },
    { id: "2100", name: "Accrued Liabilities" },
    { id: "2200", name: "Unearned Revenue" },
    { id: "3000", name: "Common Stock" },
    { id: "3100", name: "Retained Earnings" },
    { id: "4000", name: "Revenue" },
    { id: "5000", name: "Cost of Goods Sold" },
    { id: "6000", name: "Salaries Expense" },
    { id: "6100", name: "Rent Expense" },
    { id: "6200", name: "Utilities Expense" },
    { id: "6300", name: "Depreciation Expense" },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Journal Entry</DialogTitle>
          <DialogDescription>Create a new journal entry. Ensure debits equal credits.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Entry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Select date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="JE-2023-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief description of the journal entry" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Journal Entry Lines</h3>
                <div className="flex items-center gap-2">
                  <div className={`text-sm ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                    {isBalanced ? "Balanced" : "Not Balanced"}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ account: "", description: "", debit: "", credit: "" })}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add Line
                  </Button>
                </div>
              </div>

              <div className="rounded-md border">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">Account</th>
                      <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground">
                        Description
                      </th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Debit</th>
                      <th className="h-10 px-4 text-right align-middle font-medium text-muted-foreground">Credit</th>
                      <th className="h-10 w-[50px] px-4 align-middle font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((field, index) => (
                      <tr key={field.id} className="border-b">
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.account`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <Select onValueChange={field.onChange} defaultValue={field.value || ""}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select account" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {accounts.map((account) => (
                                      <SelectItem key={account.id} value={account.id}>
                                        {account.id} - {account.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.description`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input placeholder="Line description" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.debit`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="text-right"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      // Clear credit if debit has a value
                                      if (e.target.value) {
                                        form.setValue(`entries.${index}.credit`, "")
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2">
                          <FormField
                            control={form.control}
                            name={`entries.${index}.credit`}
                            render={({ field }) => (
                              <FormItem className="space-y-0">
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="0.00"
                                    className="text-right"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      // Clear debit if credit has a value
                                      if (e.target.value) {
                                        form.setValue(`entries.${index}.debit`, "")
                                      }
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </td>
                        <td className="p-2 text-center">
                          {index > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t-2 font-medium">
                      <td colSpan={2} className="p-2 text-right">
                        Totals:
                      </td>
                      <td className="p-2 text-right">{totalDebit.toFixed(2)}</td>
                      <td className="p-2 text-right">{totalCredit.toFixed(2)}</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td colSpan={2} className="p-2 text-right">
                        Difference:
                      </td>
                      <td colSpan={2} className={`p-2 text-right ${isBalanced ? "text-green-600" : "text-red-600"}`}>
                        {Math.abs(totalDebit - totalCredit).toFixed(2)}
                      </td>
                      <td></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes or supporting information"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Optional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !isBalanced}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isBalanced ? "Save Journal Entry" : "Entries Must Balance"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
