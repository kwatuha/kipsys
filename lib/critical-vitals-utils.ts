import { triageApi } from "@/lib/api"
import { useCriticalNotifications } from "@/lib/critical-notifications-context"

export interface PatientVitals {
  systolicBP?: number | null
  diastolicBP?: number | null
  heartRate?: number | null
  respiratoryRate?: number | null
  temperature?: number | null
  oxygenSaturation?: number | null
  glasgowComaScale?: number | null
  bloodGlucose?: number | null
}

interface CriticalVitalRange {
  criticalVitalId: number
  vitalParameter: string
  unit: string | null
  criticalLowValue: number | null
  criticalHighValue: number | null
  description: string | null
}

interface CriticalAlert {
  parameter: string
  value: number
  unit: string
  range: string
  description: string | null
  severity: 'critical' | 'urgent'
}

const getParameterDisplayName = (param: string): string => {
  const names: Record<string, string> = {
    'systolicBP': 'Systolic Blood Pressure',
    'diastolicBP': 'Diastolic Blood Pressure',
    'heartRate': 'Heart Rate',
    'respiratoryRate': 'Respiratory Rate',
    'temperature': 'Temperature',
    'oxygenSaturation': 'Oxygen Saturation (SpO2)',
    'glasgowComaScale': 'Glasgow Coma Scale (GCS)',
    'bloodGlucose': 'Blood Glucose'
  }
  return names[param] || param
}

/**
 * Check vitals for critical values and add to notifications if found
 * This should be called AFTER saving vitals to the database
 */
export async function checkAndNotifyCriticalVitals(
  vitals: PatientVitals | null,
  patientId: string | number,
  patientName?: string,
  addNotification: (notification: any) => void
): Promise<CriticalAlert[]> {
  if (!vitals) {
    return []
  }

  try {
    // Load critical ranges
    const ranges = await triageApi.getCriticalVitalRanges()
    const criticalRanges = ranges.filter((r: any) => r.isActive !== false) as CriticalVitalRange[]

    if (criticalRanges.length === 0) {
      return []
    }

    const alerts: CriticalAlert[] = []

    criticalRanges.forEach((range) => {
      const param = range.vitalParameter
      let value: number | null = null

      // Map vital parameter names to actual vital values
      switch (param) {
        case 'systolicBP':
          value = vitals.systolicBP || null
          break
        case 'diastolicBP':
          value = vitals.diastolicBP || null
          break
        case 'heartRate':
          value = vitals.heartRate || null
          break
        case 'respiratoryRate':
          value = vitals.respiratoryRate || null
          break
        case 'temperature':
          value = vitals.temperature || null
          break
        case 'oxygenSaturation':
          value = vitals.oxygenSaturation || null
          break
        case 'glasgowComaScale':
          value = vitals.glasgowComaScale || null
          break
        case 'bloodGlucose':
          value = vitals.bloodGlucose || null
          break
      }

      if (value === null || value === undefined) return

      // Check if value is critical
      const isCriticalLow = range.criticalLowValue !== null && value < range.criticalLowValue
      const isCriticalHigh = range.criticalHighValue !== null && value > range.criticalHighValue

      if (isCriticalLow || isCriticalHigh) {
        let rangeText = ''
        if (isCriticalLow && isCriticalHigh) {
          rangeText = `< ${range.criticalLowValue} or > ${range.criticalHighValue}`
        } else if (isCriticalLow) {
          rangeText = `< ${range.criticalLowValue}`
        } else {
          rangeText = `> ${range.criticalHighValue}`
        }

        // Determine severity - very extreme values are critical, others are urgent
        const severity: 'critical' | 'urgent' = 
          (isCriticalLow && range.criticalLowValue && value < range.criticalLowValue * 0.8) ||
          (isCriticalHigh && range.criticalHighValue && value > range.criticalHighValue * 1.2)
            ? 'critical'
            : 'urgent'

        alerts.push({
          parameter: getParameterDisplayName(param),
          value: value,
          unit: range.unit || '',
          range: rangeText,
          description: range.description || null,
          severity
        })
      }
    })

    // Add to global notifications if there are critical alerts
    if (alerts.length > 0) {
      addNotification({
        patientId: patientId.toString(),
        patientName: patientName,
        type: 'vital' as const,
        alerts: alerts.map(alert => ({
          parameter: alert.parameter,
          value: alert.value,
          unit: alert.unit,
          range: alert.range,
          description: alert.description,
          severity: alert.severity,
        })),
      })
    }

    return alerts
  } catch (err: any) {
    console.error('Error checking critical vitals:', err)
    return []
  }
}

