import Image from "next/image";
import { AVATAR_PLACEHOLDER_URL } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface NotificationAvatarProps {
  /** URL da foto do usuário; usa placeholder até o cadastro obrigatório de avatar. */
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
    <Image
      src={image ?? AVATAR_PLACEHOLDER_URL}
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
