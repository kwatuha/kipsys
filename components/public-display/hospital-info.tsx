import { Card, CardContent } from "@/components/ui/card"
import { HospitalLogoWithIcon } from "@/components/hospital-logo-with-icon"

interface HospitalInfoProps {
  className?: string
}

export function HospitalInfo({ className = "" }: HospitalInfoProps) {
  // Get current time
  const now = new Date()
  const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const dateString = now.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <Card className={className}>
      <CardContent className="p-4 flex items-center justify-between">
        <HospitalLogoWithIcon className="h-12" />
        <div className="text-right">
          <div className="text-2xl font-bold">{timeString}</div>
          <div className="text-sm text-muted-foreground">{dateString}</div>
        </div>
      </CardContent>
    </Card>
  )
}
