"use client"

import { useParams } from "next/navigation"
import { TelemedicineSessionPanel } from "@/components/telemedicine-session-panel"

export default function TelemedicineSessionPage() {
  const params = useParams()
  const sessionId = String(params.sessionId || "")
  if (!sessionId) return null
  return <TelemedicineSessionPanel sessionId={sessionId} variant="page" />
}
