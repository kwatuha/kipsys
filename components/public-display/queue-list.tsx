import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPublicQueueData, type ServicePoint } from "@/lib/data/public-queue-data"
import { Badge } from "@/components/ui/badge"

interface QueueListProps {
  servicePoint: ServicePoint
  className?: string
}

export function QueueList({ servicePoint, className = "" }: QueueListProps) {
  const queueData = getPublicQueueData(servicePoint)
  const waitingEntries = queueData.filter((entry) => entry.status === "waiting")

  return (
    <Card className={className}>
      <CardHeader className="py-2">
        <CardTitle className="text-lg">Current Queue</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {waitingEntries.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="text-left p-2 text-sm font-medium">Queue #</th>
                  <th className="text-left p-2 text-sm font-medium">Patient</th>
                  <th className="text-left p-2 text-sm font-medium">Est. Wait</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {waitingEntries.map((entry) => (
                  <tr key={entry.queueNumber} className="hover:bg-muted/20">
                    <td className="p-2">
                      <div className="flex items-center justify-center w-10 h-10 bg-muted/30 rounded-full">
                        <span className="font-bold">{entry.queueNumber}</span>
                      </div>
                    </td>
                    <td className="p-2">
                      {entry.isAnonymous ? (
                        <span className="text-muted-foreground">Anonymous</span>
                      ) : (
                        <span>{entry.displayInitials}</span>
                      )}
                    </td>
                    <td className="p-2">
                      {entry.estimatedWaitTime ? (
                        <Badge variant="outline">{entry.estimatedWaitTime} min</Badge>
                      ) : (
                        <Badge variant="outline">--</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-center text-muted-foreground">No patients waiting</div>
        )}
      </CardContent>
    </Card>
  )
}
