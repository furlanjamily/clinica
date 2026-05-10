import React from "react"
import { tv, type VariantProps } from "tailwind-variants"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export const buttonVariants = tv({
  base: "flex items-center justify-center cursor-pointer transition-colors rounded-full gap-1.5 font-medium select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
  variants: {
    variant: {
      primary:     "bg-primary text-white hover:bg-primary/90",
      secondary:   "bg-gray-100 text-gray-700 hover:bg-gray-200",
      destructive: "bg-red-50 text-red-600 hover:bg-red-100",
      ghost:       "bg-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100",
      "ghost-danger":  "bg-transparent text-red-500 hover:text-red-700 hover:bg-red-50",
      "ghost-blue":    "bg-transparent text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      "ghost-orange":  "bg-transparent text-orange-600 hover:text-orange-800 hover:bg-orange-50",
      outline:     "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50",
      success:     "bg-green-600 text-white hover:bg-green-700",
      warning:     "bg-yellow-500 text-white hover:bg-yellow-600",
      purple:      "bg-purple-500 text-white hover:bg-purple-600",
      blue:        "bg-blue-500 text-white hover:bg-blue-600",
      teal:        "bg-teal-500 text-white hover:bg-teal-600",
      "badge-green":  "bg-green-100 text-green-700 hover:bg-green-200",
      "badge-orange": "bg-orange-100 text-orange-700 hover:bg-orange-200",
    },
    size: {
      icon: "p-2 text-xs sm:p-1.5",
      sm:   "py-1 px-2 text-xs sm:py-1.5 sm:px-3",
      md:   "py-1.5 px-2.5 text-sm sm:py-2 sm:px-3",
      lg:   "py-2 px-3 text-sm sm:py-2.5 sm:px-4 lg:py-2 lg:px-3",
    },
    disabled: {
      true: "opacity-40 pointer-events-none",
    },
    loading: {
      true: "pointer-events-none",
    },
  },
  defaultVariants: {
    variant: "primary",
    size:    "sm",
    disabled: false,
    loading:  false,
  },
})

export interface ButtonProps
  extends Omit<React.ComponentProps<"button">, "size" | "disabled">,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant, size, disabled, loading, className, children, type = "button", asChild, ...props }, ref) => {
    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        className: cn(buttonVariants({ variant, size, disabled: !!disabled, loading: !!loading }), className),
        ...props,
      })
    }

    return (
      <button
        ref={ref}
        type={type}
        disabled={!!disabled}
        className={cn(buttonVariants({ variant, size, disabled: !!disabled, loading: !!loading }), className)}
        {...props}
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        {children}
      </button>
    )
  }
)

Button.displayName = "Button"

export { Button, buttonVariants as buttonVariantsLegacy }
export default Button
