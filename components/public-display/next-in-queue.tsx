import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getNextInQueue, type ServicePoint } from "@/lib/data/public-queue-data"

interface NextInQueueProps {
  servicePoint: ServicePoint
  className?: string
}

export function NextInQueue({ servicePoint, className = "" }: NextInQueueProps) {
  const nextInQueue = getNextInQueue(servicePoint, 3)

  return (
    <Card className={className}>
      <CardHeader className="bg-muted py-2">
        <CardTitle className="text-center text-lg">NEXT IN QUEUE</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center justify-center">
        {nextInQueue.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {nextInQueue.map((number) => (
              <div
                key={number}
                className="flex items-center justify-center w-16 h-16 bg-muted/50 rounded-full border-2 border-muted"
              >
                <span className="text-3xl font-bold">{number}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xl font-medium text-muted-foreground py-4">Queue is empty</div>
        )}
      </CardContent>
    </Card>
  )
}
