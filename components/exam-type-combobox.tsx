"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"
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
import { radiologyApi } from "@/lib/api"

interface ExamType {
  examTypeId: number
  examName: string
  examCode?: string
  category?: string
  cost?: number
}

interface ExamTypeComboboxProps {
  value?: string
  onValueChange: (value: string, examType?: ExamType) => void
  placeholder?: string
  disabled?: boolean
  category?: string
}

export function ExamTypeCombobox({
  value,
  onValueChange,
  placeholder = "Search examination type...",
  disabled = false,
  category,
}: ExamTypeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [examTypes, setExamTypes] = React.useState<ExamType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Load exam types when popover opens - load all first
  React.useEffect(() => {
    if (open) {
      // Load all exam types first, then filter as user types
      loadExamTypes("")
    } else {
      // Clear results when closed
      setSearchQuery("")
    }
  }, [open, category])

  // Debounced search - reload when search query changes
  React.useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadExamTypes(searchQuery.trim() || "")
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, open, category])

  const loadExamTypes = async (search?: string) => {
    try {
      setLoading(true)
      const data = await radiologyApi.getExamTypes(search || "", category, 1, 1000)
      setExamTypes(Array.isArray(data) ? data : [])

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded ${data?.length || 0} exam types${search ? ` for search: "${search}"` : ''}`)
      }
    } catch (error: any) {
      console.error("Error loading exam types:", error)
      setExamTypes([])
    } finally {
      setLoading(false)
    }
  }

  const selectedExamType = examTypes.find(
    (e) => e.examTypeId.toString() === value
  )

  const getExamTypeDisplay = (examType: ExamType) => {
    let display = examType.examName
    if (examType.category) {
      display += ` (${examType.category})`
    }
    if (examType.cost) {
      display += ` - KES ${parseFloat(examType.cost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return display
  }

  const handleSelect = (examType: ExamType) => {
    onValueChange(examType.examTypeId.toString(), examType)
    setOpen(false)
    setSearchQuery("")
  }

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
          {selectedExamType ? (
            <span className="truncate">{getExamTypeDisplay(selectedExamType)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search examination type by name, code, or category..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <CommandEmpty>
                  {searchQuery ? `No examination types found for "${searchQuery}"` : "No examination types available"}
                </CommandEmpty>
                <CommandGroup>
                  {examTypes.map((examType) => (
                    <CommandItem
                      key={examType.examTypeId}
                      value={`${examType.examName} ${examType.examCode || ''} ${examType.category || ''}`}
                      onSelect={() => handleSelect(examType)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === examType.examTypeId.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{examType.examName}</div>
                        {(examType.category || examType.cost) && (
                          <div className="text-xs text-muted-foreground">
                            {examType.category && `${examType.category}`}
                            {examType.category && examType.cost && " • "}
                            {examType.cost && `KES ${parseFloat(examType.cost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
