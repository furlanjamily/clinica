"use client"

import { forwardRef, useEffect, useMemo } from "react"
import { useIMask } from "react-imask"
import { type VariantProps, tv } from "tailwind-variants"

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

export const MASKS = {
  cpf: { mask: "000.000.000-00" },
  cnpj: { mask: "00.000.000/0000-00" },
  telefone: { mask: [{ mask: "(00) 0000-0000" }, { mask: "(00) 00000-0000" }] },
  cep: { mask: "00000-000" },
  data: { mask: "00/00/0000" },
  moeda: {
    mask: "R$ num",
    blocks: {
      num: {
        mask: Number,
        thousandsSeparator: ".",
        radix: ",",
        scale: 2,
        padFractionalZeros: true,
      },
    },
  },
} as const

export type MaskPreset = keyof typeof MASKS

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined | null>): React.RefCallback<T> {
  return (instance) => {
    for (const ref of refs) {
      if (ref == null) continue
      if (typeof ref === "function") ref(instance)
      else (ref as React.MutableRefObject<T | null>).current = instance
    }
  }
}

export interface InputProps
  extends Omit<React.ComponentProps<"input">, "size" | "disabled" | "onChange" | "value">,
    Omit<VariantProps<typeof inputWrapperVariants>, "error"> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  mask?: MaskPreset
  value?: React.ComponentProps<"input">["value"] | null
  onChange?: React.ChangeEventHandler<HTMLInputElement> | ((value: string) => void)
}

type InputPropsWithRef = InputProps & { ref?: React.Ref<HTMLInputElement | null> }

const InputMasked = forwardRef<HTMLInputElement, InputProps & { mask: MaskPreset }>(
  (
    {
      mask,
      label,
      error,
      size,
      disabled,
      readOnly,
      className,
      id,
      leftIcon,
      rightIcon,
      value: valueProp,
      onChange,
      onBlur,
      name,
      placeholder,
      defaultValue: _ignoredDefault,
      ...rest
    },
    forwardedRef
  ) => {
    const value =
      valueProp == null ? "" : typeof valueProp === "string" ? valueProp : String(valueProp)
    const maskOpts = MASKS[mask] as object
    const { ref: imaskRef, setValue: setMaskValue } = useIMask(maskOpts, {
      onAccept: (val) => (onChange as ((v: string) => void) | undefined)?.(val),
    })

    useEffect(() => {
      setMaskValue(value)
    }, [value, setMaskValue])

    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
    const mergedRef = useMemo(
      () => mergeRefs(imaskRef as React.Ref<HTMLInputElement>, forwardedRef),
      [imaskRef, forwardedRef]
    )

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
            ref={mergedRef}
            id={inputId}
            name={name}
            disabled={disabled as boolean}
            readOnly={readOnly}
            onBlur={onBlur}
            placeholder={placeholder}
            className={inputFieldVariants()}
            {...rest}
          />
          {rightIcon && <span className="text-muted-foreground shrink-0">{rightIcon}</span>}
        </div>
        {error && <p className={inputErrorVariants()}>{error}</p>}
      </div>
    )
  }
)
InputMasked.displayName = "InputMasked"

export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const { ref: rhfRef, ...rest } = props as InputPropsWithRef
  const mergedRef = useMemo(() => mergeRefs(ref, rhfRef), [ref, rhfRef])

  if (rest.mask) {
    return <InputMasked ref={mergedRef} {...(rest as InputProps & { mask: MaskPreset })} />
  }

  const {
    label,
    error,
    size,
    disabled,
    readOnly,
    className,
    id,
    leftIcon,
    rightIcon,
    mask: _mask,
    onChange,
    value,
    ...inputProps
  } = rest
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-")
  const valueProps: { value?: Exclude<InputProps["value"], null> } =
    value !== undefined ? { value: value === null ? undefined : value } : {}

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
          ref={mergedRef}
          id={inputId}
          disabled={disabled as boolean}
          readOnly={readOnly}
          className={inputFieldVariants()}
          {...valueProps}
          onChange={onChange as React.ChangeEventHandler<HTMLInputElement> | undefined}
          {...inputProps}
        />
        {rightIcon && <span className="text-muted-foreground shrink-0">{rightIcon}</span>}
      </div>
      {error && <p className={inputErrorVariants()}>{error}</p>}
    </div>
  )
})
Input.displayName = "Input"

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
