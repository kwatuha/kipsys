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
import { laboratoryApi } from "@/lib/api"

interface TestType {
  testTypeId: number
  testName: string
  testCode?: string
  category?: string
  cost?: number
}

interface TestTypeComboboxProps {
  value?: string
  onValueChange: (value: string, testType?: TestType) => void
  placeholder?: string
  disabled?: boolean
  category?: string
}

export function TestTypeCombobox({
  value,
  onValueChange,
  placeholder = "Search test type...",
  disabled = false,
  category,
}: TestTypeComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [testTypes, setTestTypes] = React.useState<TestType[]>([])
  const [loading, setLoading] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")

  // Load test types when popover opens - load all first
  React.useEffect(() => {
    if (open) {
      // Load all test types first, then filter as user types
      loadTestTypes("")
    } else {
      // Clear results when closed
      setSearchQuery("")
    }
  }, [open, category])

  // Debounced search - reload when search query changes
  React.useEffect(() => {
    if (!open) return

    const timer = setTimeout(() => {
      loadTestTypes(searchQuery.trim() || "")
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, open, category])

  const loadTestTypes = async (search?: string) => {
    try {
      setLoading(true)
      const data = await laboratoryApi.getTestTypes(search || "", category, 1, 1000)
      setTestTypes(Array.isArray(data) ? data : [])

      // Log for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log(`Loaded ${data?.length || 0} test types${search ? ` for search: "${search}"` : ''}`)
      }
    } catch (error: any) {
      console.error("Error loading test types:", error)
      setTestTypes([])
    } finally {
      setLoading(false)
    }
  }

  const selectedTestType = testTypes.find(
    (t) => t.testTypeId.toString() === value
  )

  const getTestTypeDisplay = (testType: TestType) => {
    let display = testType.testName
    if (testType.category) {
      display += ` (${testType.category})`
    }
    if (testType.cost) {
      display += ` - KES ${parseFloat(testType.cost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return display
  }

  const handleSelect = (testType: TestType) => {
    onValueChange(testType.testTypeId.toString(), testType)
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
          {selectedTestType ? (
            <span className="truncate">{getTestTypeDisplay(selectedTestType)}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search test type by name, code, or category..."
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
                  {searchQuery ? `No test types found for "${searchQuery}"` : "No test types available"}
                </CommandEmpty>
                <CommandGroup>
                  {testTypes.map((testType) => (
                    <CommandItem
                      key={testType.testTypeId}
                      value={`${testType.testName} ${testType.testCode || ''} ${testType.category || ''}`}
                      onSelect={() => handleSelect(testType)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === testType.testTypeId.toString()
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{testType.testName}</div>
                        {(testType.category || testType.cost) && (
                          <div className="text-xs text-muted-foreground">
                            {testType.category && `${testType.category}`}
                            {testType.category && testType.cost && " • "}
                            {testType.cost && `KES ${parseFloat(testType.cost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
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
