"use client"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

type ConfirmAddToTriageDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientName: string
  patientNumber?: string
  /** Called when user confirms; close dialog in parent after success (or always) */
  onConfirm: () => Promise<void>
  loading?: boolean
}

export function ConfirmAddToTriageDialog({
  open,
  onOpenChange,
  patientName,
  patientNumber,
  onConfirm,
  loading = false,
}: ConfirmAddToTriageDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!loading) onOpenChange(next)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add to triage queue?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              This will add{" "}
              <span className="font-medium text-foreground">{patientName}</span>
              {patientNumber ? (
                <span className="text-foreground"> ({patientNumber})</span>
              ) : null}{" "}
              to the <strong>triage</strong> queue so they can be seen in order.
            </span>
            <span className="block text-muted-foreground">Only continue if the patient should wait for triage.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={loading}
            onClick={async () => {
              await onConfirm()
            }}
          >
            {loading ? "Adding…" : "Add to queue"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
