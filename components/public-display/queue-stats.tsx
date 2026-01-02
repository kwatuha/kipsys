import { Card, CardContent } from "@/components/ui/card"
import { getAverageWaitTime, getTotalWaiting, type ServicePoint } from "@/lib/data/public-queue-data"
import { Clock, Users } from "lucide-react"

interface QueueStatsProps {
  servicePoint: ServicePoint
  className?: string
}

export function QueueStats({ servicePoint, className = "" }: QueueStatsProps) {
  const averageWaitTime = getAverageWaitTime(servicePoint)
  const totalWaiting = getTotalWaiting(servicePoint)

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Patients Waiting</div>
              <div className="text-2xl font-bold">{totalWaiting}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-sm font-medium text-muted-foreground">Average Wait</div>
              <div className="text-2xl font-bold">{averageWaitTime} min</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
