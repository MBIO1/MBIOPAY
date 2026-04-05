import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, ...props }, ref) => {
    return (
      <div className="relative w-full">
        {icon ? (
          <div className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <input
          type={type}
          className={cn(
            "flex h-14 w-full rounded-xl border border-border bg-input/50 px-4 py-2 text-base shadow-inner transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-12" : null,
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
