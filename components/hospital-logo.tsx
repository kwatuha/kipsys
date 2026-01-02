import Link from "next/link"

interface HospitalLogoProps {
  className?: string
}

export function HospitalLogo({ className }: HospitalLogoProps) {
  return (
    <Link href="/" className={`flex items-center ${className}`}>
      <div className="flex flex-col items-center">
        <div className="text-xl font-bold tracking-tight">
          <span className="text-blue-600">KIPLOMBE</span>
        </div>
        <div className="text-xs text-gray-600 font-medium">Medical Centre</div>
        <div className="text-xs text-blue-500 italic font-normal">For Quality Healthcare Service Delivery</div>
      </div>
    </Link>
  )
}
