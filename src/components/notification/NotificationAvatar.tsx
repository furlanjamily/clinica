import { Avatar } from "@/components/common/Avatar";
import { cn } from "@/lib/utils";

interface NotificationAvatarProps {
  image: string | null;
  alt: string;
  className?: string;
}

export function NotificationAvatar({
  image,
  alt,
  className,
}: NotificationAvatarProps) {
  return (
    <Avatar
      name={alt}
      image={image}
      size={40}
      alt={alt}
      className={cn("h-10 w-10 shrink-0", className)}
    />
  );
}
