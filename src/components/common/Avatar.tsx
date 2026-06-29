"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { getAvatarColor } from "@/lib/avatar/colors"
import { getInitials } from "@/lib/avatar/initials"

export type AvatarSize = "sm" | "md" | "lg" | number

export interface AvatarProps {
  name?: string | null
  image?: string | null
  size?: AvatarSize
  className?: string
  alt?: string
  initialsClassName?: string
}

const PRESET_SIZES: Record<"sm" | "md" | "lg", { px: number; text: string }> = {
  sm: { px: 32, text: "text-xs" },
  md: { px: 40, text: "text-sm" },
  lg: { px: 56, text: "text-base" },
}

function resolveSize(size: AvatarSize): { px: number; text: string } {
  if (typeof size === "number") {
    const text =
      size >= 56 ? "text-base" : size >= 40 ? "text-sm" : "text-xs"
    return { px: size, text }
  }
  return PRESET_SIZES[size]
}

export function Avatar({ name, image, size = "md", className, alt, initialsClassName }: AvatarProps) {
  const { px, text } = resolveSize(size)
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => {
    setImageFailed(false)
  }, [image])

  const showImage = Boolean(image) && !imageFailed
  const initials = getInitials(name)
  const colors = getAvatarColor(name)
  const label = alt ?? name ?? "Avatar"

  const baseClass = cn(
    "relative flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold",
    text,
    className
  )

  if (showImage && image) {
    return (
      <div
        className={baseClass}
        style={{ width: px, height: px }}
        aria-label={label}
      >
        <Image
          key={image}
          src={image}
          alt={label}
          fill
          className="object-cover"
          unoptimized={image.startsWith("/uploads/")}
          onError={() => setImageFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(baseClass, initialsClassName)}
      style={
        initialsClassName
          ? { width: px, height: px }
          : {
              width: px,
              height: px,
              backgroundColor: colors.background,
              color: colors.color,
            }
      }
      aria-label={label}
      title={name ?? undefined}
    >
      {initials}
    </div>
  )
}
