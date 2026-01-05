"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { 
  Users, 
  Calendar, 
  ClipboardList, 
  DollarSign, 
  Pill, 
  FlaskConical, 
  ImageIcon,
  BedDouble,
  HeartPulse,
  ShoppingCart,
  FileText,
  ArrowRight,
  CheckCircle2,
  Clock,
  UserCheck,
  Stethoscope
} from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive guide to using the Kiplombe Medical Centre HMIS system
        </p>
      </div>

      <Tabs defaultValue="workflows" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="quick-start">Quick Start</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="workflows" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Patient Registration & Consultation Workflow
              </CardTitle>
              <CardDescription>
                Complete workflow from patient registration to consultation completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">1</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Patient Registration
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registration officer registers new patient in the system. Patient receives a unique Patient ID number.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Patient Registration</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">2</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Appointment or Queue Entry
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Registration officer creates an appointment or adds patient to the appropriate service queue (e.g., Consultation, Laboratory).
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Appointments or Queue Management</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">3</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <HeartPulse className="h-4 w-4" />
                      Triage Assessment (If Applicable)
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Nurse performs triage assessment, records vital signs, and assigns priority level (Normal, Urgent, Emergency).
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Triage Module</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">4</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Queue Waiting
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient waits in queue. Queue status can be viewed on queue displays. Patient can see their position and estimated wait time.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Queue Management or Public Displays</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">5</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      Doctor Consultation
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Doctor calls patient from queue, conducts consultation, documents clinical notes, diagnoses, and treatment plans in the medical record.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Consultation Queue or Medical Records</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">6</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ClipboardList className="h-4 w-4" />
                      Orders & Prescriptions
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Doctor may order laboratory tests, radiology exams, prescribe medications, or schedule follow-up appointments as needed.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Medical Records or respective modules</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">7</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Billing & Payment
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient proceeds to billing/cashier. Bills are generated, payments are processed, and receipts are issued. Once all invoices are paid, patient is automatically removed from cashier queue.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Billing or Cashier Queue</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">8</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Pill className="h-4 w-4" />
                      Pharmacy (If Prescribed)
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      If medications were prescribed, patient collects them from pharmacy. Pharmacy staff dispenses medications and updates inventory.
                    </p>
                    <Badge variant="outline" className="mt-2">Location: Pharmacy Module</Badge>
                  </div>
                </div>

                <div className="flex items-center justify-center text-muted-foreground">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      Visit Completion
                    </h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Patient completes visit. All records are saved in the system for future reference.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Laboratory Test Workflow
              </CardTitle>
              <CardDescription>
                Process for ordering, processing, and reviewing laboratory tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Doctor orders laboratory test during consultation</p>
                    <p className="text-sm text-muted-foreground">Order appears in Laboratory module automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Patient provides sample at laboratory</p>
                    <p className="text-sm text-muted-foreground">Lab technician receives and logs the sample</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Lab technician processes test and enters results</p>
                    <p className="text-sm text-muted-foreground">Results are verified and report is generated</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Results available in patient's medical record</p>
                    <p className="text-sm text-muted-foreground">Doctor reviews results and informs patient</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Pharmacy Prescription Workflow
              </CardTitle>
              <CardDescription>
                Medication prescription and dispensing process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Doctor prescribes medication during consultation</p>
                    <p className="text-sm text-muted-foreground">Prescription appears in Pharmacy module</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Patient goes to pharmacy</p>
                    <p className="text-sm text-muted-foreground">Pharmacy staff reviews prescription</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Pharmacy checks availability and drug interactions</p>
                    <p className="text-sm text-muted-foreground">System validates prescription against inventory and patient allergies</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Medication dispensed and inventory updated</p>
                    <p className="text-sm text-muted-foreground">Patient receives medication with instructions</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Cashier Queue Payment Workflow
              </CardTitle>
              <CardDescription>
                How to process payments in the cashier queue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Patient arrives at cashier queue</p>
                    <p className="text-sm text-muted-foreground">Cashier selects patient from queue and clicks "View Bill"</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">View Bill dialog opens showing all pending invoices</p>
                    <p className="text-sm text-muted-foreground">All invoices are automatically selected by default</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Payment amount is auto-populated with total of selected invoices</p>
                    <p className="text-sm text-muted-foreground">Cashier can adjust amount or deselect specific invoices if patient wants partial payment</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Select payment method (Cash, M-Pesa, Card, etc.)</p>
                    <p className="text-sm text-muted-foreground">Enter reference number if applicable (receipt number, transaction ID)</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">5</Badge>
                  <div>
                    <p className="font-medium">Review payment distribution</p>
                    <p className="text-sm text-muted-foreground">System shows how payment will be distributed across selected invoices</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">6</Badge>
                  <div>
                    <p className="font-medium">Click "Process Payment"</p>
                    <p className="text-sm text-muted-foreground">System processes payments, updates invoice status, and posts journal entries automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">7</Badge>
                  <div>
                    <p className="font-medium">Automatic queue completion</p>
                    <p className="text-sm text-muted-foreground">If all invoices are paid, patient is automatically removed from cashier queue and entry is archived to history</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BedDouble className="h-5 w-5" />
                Inpatient Admission Workflow
              </CardTitle>
              <CardDescription>
                Process for admitting patients to wards
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">1</Badge>
                  <div>
                    <p className="font-medium">Doctor decides patient needs admission</p>
                    <p className="text-sm text-muted-foreground">Registration checks bed availability in appropriate ward</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">2</Badge>
                  <div>
                    <p className="font-medium">Patient assigned to ward and bed</p>
                    <p className="text-sm text-muted-foreground">Nurse admits patient to ward and completes admission documentation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">3</Badge>
                  <div>
                    <p className="font-medium">Daily rounds and documentation</p>
                    <p className="text-sm text-muted-foreground">Medical staff document daily progress, medications, and observations</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-0.5">4</Badge>
                  <div>
                    <p className="font-medium">Discharge process</p>
                    <p className="text-sm text-muted-foreground">Doctor decides discharge, nurse completes discharge process, final billing is processed</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Patient Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Register new patients, manage patient records, view patient history, and access comprehensive patient information.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Schedule, manage, and track patient appointments. View doctor schedules and appointment calendars.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Queue Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage patient queues across all service points. Track wait times, call patients, and monitor queue status.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Medical Records
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Create and manage electronic health records. Document consultations, diagnoses, and treatment plans.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Billing & Finance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate invoices, process payments, manage receivables, and track financial transactions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Pill className="h-5 w-5" />
                  Pharmacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage prescriptions, dispense medications, track drug inventory, and monitor drug interactions.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Laboratory
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Order lab tests, process samples, enter results, and generate laboratory reports.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Radiology
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Request imaging studies, manage radiology exams, store images, and generate radiology reports.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Inventory & Procurement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage medical supplies, track inventory levels, create purchase orders, and manage vendors.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Human Resources
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Manage employees, track schedules, process payroll, and handle leave management.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quick-start" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Quick guide for new users</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Logging In</h4>
                <p className="text-sm text-muted-foreground">
                  Use your username and password provided by your system administrator. Contact IT support if you need login credentials.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">2. Navigation</h4>
                <p className="text-sm text-muted-foreground">
                  Use the top navigation tabs to switch between main modules (Dashboard, Patient Care, Clinical Services, etc.). 
                  The left sidebar shows items within the current module.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">3. Search Functionality</h4>
                <p className="text-sm text-muted-foreground">
                  Use the global search bar at the top to quickly find patients, invoices, queue entries, or any other data across the system.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">4. Common Actions</h4>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Click "Add" or "+" buttons to create new records</li>
                  <li>Use the three-dot menu (⋯) for additional actions on items</li>
                  <li>Click on any record to view details</li>
                  <li>Use filters to narrow down search results</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Keyboard Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Search</p>
                  <p className="text-xs text-muted-foreground">Ctrl+F / Cmd+F</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Save</p>
                  <p className="text-xs text-muted-foreground">Ctrl+S / Cmd+S</p>
                </div>
                <div>
                  <p className="text-sm font-medium">New Record</p>
                  <p className="text-xs text-muted-foreground">Ctrl+N / Cmd+N</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Refresh</p>
                  <p className="text-xs text-muted-foreground">F5 / Cmd+R</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Close Dialog</p>
                  <p className="text-xs text-muted-foreground">Esc</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq" className="space-y-6 mt-6">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How do I reset my password?</AccordionTrigger>
              <AccordionContent>
                Contact your system administrator or IT support to reset your password. They can reset it for you or provide instructions for self-service password reset.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What should I do if I can't find a patient?</AccordionTrigger>
              <AccordionContent>
                Use the global search function at the top of the page. You can search by patient name, patient number, phone number, or any other identifier. Make sure you're searching in the correct module (Patient Care).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>How do I process a payment in the cashier queue?</AccordionTrigger>
              <AccordionContent>
                Select the patient from the cashier queue, click "View Bill", select the invoices to pay (or use all selected), enter payment amount and method, then click "Process Payment". The system will automatically update invoices and remove the patient from queue when all invoices are paid.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>Can I process partial payments?</AccordionTrigger>
              <AccordionContent>
                Yes! In the View Bill dialog, you can deselect specific invoices or adjust the payment amount. The system will distribute the payment across selected invoices and mark them as partially paid if the amount is less than the total.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>What happens to queue entries after payment?</AccordionTrigger>
              <AccordionContent>
                When all invoices are paid, the queue entry is automatically marked as completed, archived to queue history (with service metrics), and removed from the active queue. This keeps the queue table small and fast while preserving complete history.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>How do I view queue history?</AccordionTrigger>
              <AccordionContent>
                Queue history can be accessed through the Queue Management module. Use the history API endpoint or contact your system administrator to set up a history view page.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7">
              <AccordionTrigger>Where can I find system settings?</AccordionTrigger>
              <AccordionContent>
                System settings are available in the Administration module under "System Configuration". Only administrators have access to system settings.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-8">
              <AccordionTrigger>How do I report a bug or issue?</AccordionTrigger>
              <AccordionContent>
                Contact your IT support team or system administrator. Provide details about the issue, steps to reproduce it, any error messages, and your user role.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </div>
  )
}

