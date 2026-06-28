import Link from "next/link";
import { UnreadCounter } from "@/components/chat/UnreadCounter";

interface LinkItem {
  icon: React.ReactNode;
  name: string;
  href: string;
  badge?: number;
}

interface LinkSideBarProps {
  links: LinkItem[];
  pageActive: string;
}

export function LinkSideBar({ links, pageActive }: LinkSideBarProps) {
  return (
    <ul className="flex flex-col w-full gap-5">
      {links.map((link, index) => {
        const isActive = link.href === pageActive;
        return (
          <li key={index} className="w-full">
            <Link
              href={link.href}
              className={`flex text-xs font-bold border-l-2 items-center pl-7 gap-4 pr-4 ease-in-out duration-300 ${isActive ?  "text-primary border-primary hover:text-primary/80" : "text-accent border-transparent hover:text-primary/30"}`}
            >
              {link.icon}
              <span className="flex-1">{link.name}</span>
              {link.badge != null && link.badge > 0 ? (
                <UnreadCounter count={link.badge} selected={isActive} />
              ) : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
