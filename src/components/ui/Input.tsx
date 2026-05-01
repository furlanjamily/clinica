import { forwardRef } from "react"
import { type VariantProps, tv } from "tailwind-variants"

// ─── Variants ────────────────────────────────────────────────────────────────

export const inputContainerVariants = tv({
  base: "flex flex-col gap-1",
})

export const inputWrapperVariants = tv({
  base: "border border-input bg-transparent rounded-md flex items-center gap-2 transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20",
  variants: {
    size: {
      sm: "h-8 px-2",
      md: "h-10 px-3",
    },
    disabled: {
      true: "pointer-events-none opacity-50 bg-muted",
    },
    readOnly: {
      true: "bg-muted/50",
    },
    error: {
      true: "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
    },
  },
  defaultVariants: {
    size: "md",
  },
})

export const inputFieldVariants = tv({
  base: "bg-transparent outline-none placeholder:text-muted-foreground text-foreground text-sm flex-1 w-full",
})

export const inputLabelVariants = tv({
  base: "text-sm font-medium text-gray-700",
})

export const inputErrorVariants = tv({
  base: "text-xs text-destructive mt-0.5",
})

// ─── Input ───────────────────────────────────────────────────────────────────

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size" | "disabled">,
    Omit<VariantProps<typeof inputWrapperVariants>, "error"> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, size, disabled, readOnly, className, id, leftIcon, rightIcon, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className={inputContainerVariants({ className })}>
        {label && (
          <label htmlFor={inputId} className={inputLabelVariants()}>
            {label}
          </label>
        )}
        <div className={inputWrapperVariants({ size, disabled, readOnly: readOnly as boolean, error: !!error })}>
          {leftIcon && <span className="text-muted-foreground shrink-0">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled as boolean}
            readOnly={readOnly}
            className={inputFieldVariants()}
            {...props}
          />
          {rightIcon && <span className="text-muted-foreground shrink-0">{rightIcon}</span>}
        </div>
        {error && <p className={inputErrorVariants()}>{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

// ─── Textarea ────────────────────────────────────────────────────────────────

export interface TextareaProps
  extends Omit<React.ComponentProps<"textarea">, "disabled">,
    Omit<VariantProps<typeof inputWrapperVariants>, "error" | "readOnly"> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, size, disabled, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className={inputContainerVariants({ className })}>
        {label && (
          <label htmlFor={inputId} className={inputLabelVariants()}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          disabled={disabled as boolean}
          className={inputFieldVariants({
            class: [
              inputWrapperVariants({ size, disabled, error: !!error }),
              "h-auto resize-none py-2",
            ],
          })}
          {...props}
        />
        {error && <p className={inputErrorVariants()}>{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

// ─── FormSelect ──────────────────────────────────────────────────────────────

export interface FormSelectProps
  extends Omit<React.ComponentProps<"select">, "size" | "disabled">,
    Omit<VariantProps<typeof inputWrapperVariants>, "error" | "readOnly"> {
  label?: string
  error?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, error, size, disabled, className, id, children, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    return (
      <div className={inputContainerVariants({ className })}>
        {label && (
          <label htmlFor={inputId} className={inputLabelVariants()}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          disabled={disabled as boolean}
          className={inputWrapperVariants({ size, disabled, error: !!error, class: "w-full text-sm text-foreground" })}
          {...props}
        >
          {children}
        </select>
        {error && <p className={inputErrorVariants()}>{error}</p>}
      </div>
    )
  }
)
FormSelect.displayName = "FormSelect"
