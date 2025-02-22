"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const CircularProgress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    size?: number
    strokeWidth?: number
  }
>(({ className, value, size = 64, strokeWidth = 4, ...props }, ref) => {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - ((value || 0) / 100) * circumference

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn("relative", className)}
      {...props}
      style={{
        width: size,
        height: size,
      }}
    >
      <svg width={size} height={size}>
        <circle className="stroke-muted" fill="none" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
        <circle
          className="stroke-primary transition-all duration-300 ease-in-out"
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
    </ProgressPrimitive.Root>
  )
})
CircularProgress.displayName = ProgressPrimitive.Root.displayName

export { CircularProgress }

