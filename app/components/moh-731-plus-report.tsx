"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Download, FileText, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { generateMOH731PlusPDF } from "@/lib/moh-reports-pdf"

export function MOH731PlusReport() {
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
        keyPopulations: {
          // Mock data - replace with actual API call
          hivTesting: 0,
          hivPositive: 0,
          onART: 0,
          viralLoad: 0,
          tuberculosis: 0,
          stiServices: 0,
        },
      }

      await generateMOH731PlusPDF(reportData)
    } catch (error) {
      console.error("Error generating MOH 731 Plus report:", error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          MOH 731 Plus - Key Populations Report
        </CardTitle>
        <CardDescription>
          Generate HIV/AIDS and key populations health services report as required by Kenya Ministry of Health.
          This report tracks HIV testing, treatment, and related health services.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="start-date-731">Start Date</Label>
            <Input
              id="start-date-731"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              defaultValue={getDefaultDates().start}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-date-731">End Date</Label>
            <Input
              id="end-date-731"
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
            <li>HIV testing services</li>
            <li>HIV positive cases identified</li>
            <li>Patients on ART (Antiretroviral Therapy)</li>
            <li>Viral load testing and results</li>
            <li>Tuberculosis screening and treatment</li>
            <li>Sexually Transmitted Infections (STI) services</li>
            <li>Prevention of Mother-to-Child Transmission (PMTCT)</li>
            <li>Key population services</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}




