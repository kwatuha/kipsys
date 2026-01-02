import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentlyServing, type ServicePoint } from "@/lib/data/public-queue-data"

interface NowServingProps {
  servicePoint: ServicePoint
  className?: string
}

export function NowServing({ servicePoint, className = "" }: NowServingProps) {
  const currentlyServing = getCurrentlyServing(servicePoint)

  return (
    <Card className={`${className} border-2 border-primary`}>
      <CardHeader className="bg-primary text-primary-foreground py-2">
        <CardTitle className="text-center text-xl font-bold">NOW SERVING</CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex flex-col items-center justify-center">
        {currentlyServing.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {currentlyServing.map((number) => (
              <div
                key={number}
                className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full border-4 border-primary"
              >
                <span className="text-4xl font-bold text-primary">{number}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-2xl font-medium text-muted-foreground py-4">No patients currently being served</div>
        )}
      </CardContent>
    </Card>
  )
}
