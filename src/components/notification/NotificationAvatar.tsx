import Image from "next/image";
import { cn } from "@/lib/utils";

interface NotificationAvatarProps {
  src: string;
  alt: string;
  className?: string;
}

export function NotificationAvatar({
  src,
  alt,
  className,
}: NotificationAvatarProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={40}
      height={40}
      className={cn(
        "h-10 w-10 shrink-0 rounded-full object-cover",
        className
      )}
    />
  );
}
