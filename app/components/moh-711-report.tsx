"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { generateMOH711PDF } from "@/lib/moh-reports-pdf"

export function MOH711Report() {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [generating, setGenerating] = useState(false)

  const getDefaultDates = () => {
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      start: format(firstDay, "yyyy-MM-dd"),
      end: format(lastDay, "yyyy-MM-dd"),
    }
  }

  const handleGenerate = async () => {
    try {
      setGenerating(true)
      const reportData = {
        facilityName: "Kiplombe Medical Centre",
        facilityCode: "00001",
        period: {
          start: startDate || getDefaultDates().start,
          end: endDate || getDefaultDates().end,
        },
        immunization: {
          // Mock data - replace with actual API call
          bcg: 0,
          opv: 0,
          dpt: 0,
          measles: 0,
          tetanus: 0,
          hepatitisB: 0,
          pentavalent: 0,
        },
      }

      await generateMOH711PDF(reportData)
    } catch (error) {
      console.error("Error generating MOH 711 report:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          MOH 711 - Immunization Report
        </CardTitle>
        <CardDescription>
          Generate immunization services report as required by Kenya Ministry of Health.
          This report tracks vaccinations administered to children and adults.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date-711">Start Date</Label>
            <Input
              id="start-date-711"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              defaultValue={getDefaultDates().start}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date-711">End Date</Label>
            <Input
              id="end-date-711"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              defaultValue={getDefaultDates().end}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Generate & Download PDF
              </>
            )}
          </Button>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Report Includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>BCG (Tuberculosis) vaccinations</li>
            <li>OPV (Oral Polio Vaccine)</li>
            <li>DPT (Diphtheria, Pertussis, Tetanus)</li>
            <li>Measles vaccinations</li>
            <li>Tetanus toxoid</li>
            <li>Hepatitis B vaccinations</li>
            <li>Pentavalent vaccine</li>
            <li>Age-specific immunization coverage</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}



