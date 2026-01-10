"use client"

import React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Download, Calendar, Building2, Loader2 } from "lucide-react"
import { BreadcrumbsEnhanced } from "@/components/breadcrumbs-enhanced"
import { MOH717Report } from "@/components/moh-717-report"
import { MOH731PlusReport } from "@/components/moh-731-plus-report"
import { MOH705Report } from "@/components/moh-705-report"
import { MOH711Report } from "@/components/moh-711-report"
import { MOH708Report } from "@/components/moh-708-report"
import { MOH730Report } from "@/components/moh-730-report"

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <BreadcrumbsEnhanced
        segments={[
          { title: "Reports", href: "/reports" },
        ]}
        className="mb-4"
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">MOH Reports</h1>
          <p className="text-muted-foreground">
            Generate and download Kenya Ministry of Health (MOH) reports as required
          </p>
        </div>
      </div>

      <Tabs defaultValue="workload" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
          <TabsTrigger value="workload">MOH 717</TabsTrigger>
          <TabsTrigger value="keypopulations">MOH 731+</TabsTrigger>
          <TabsTrigger value="morbidity">MOH 705</TabsTrigger>
          <TabsTrigger value="immunization">MOH 711</TabsTrigger>
          <TabsTrigger value="mch">MOH 708</TabsTrigger>
          <TabsTrigger value="facility">MOH 730</TabsTrigger>
        </TabsList>

        <TabsContent value="workload" className="space-y-4">
          <MOH717Report />
        </TabsContent>

        <TabsContent value="keypopulations" className="space-y-4">
          <MOH731PlusReport />
        </TabsContent>

        <TabsContent value="morbidity" className="space-y-4">
          <MOH705Report />
        </TabsContent>

        <TabsContent value="immunization" className="space-y-4">
          <MOH711Report />
        </TabsContent>

        <TabsContent value="mch" className="space-y-4">
          <MOH708Report />
        </TabsContent>

        <TabsContent value="facility" className="space-y-4">
          <MOH730Report />
        </TabsContent>
      </Tabs>
    </div>
  )
}

