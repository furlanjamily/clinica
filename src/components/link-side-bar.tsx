import { IconDashboard } from "@tabler/icons-react";
import Link from "next/link";

interface LinkItem {
  icon: React.ReactNode;
  name: string;
  href: string;
}

interface LinkSideBarProps {
  links: LinkItem[];
  pageActive: string;
}

export function LinkSideBar({ links, pageActive }: LinkSideBarProps) {
  return (
    <ul className="flex flex-col w-full gap-5">
      {links.map((link, index) => (
        <li key={index} className="w-full">
          <Link
            href={link.href}
            className={`flex text-xs font-bold border-l-2 items-center pl-7 gap-4 ease-in-out duration-300 ${link.href === pageActive ?  "text-primary border-primary hover:text-primary/80" : "text-accent border-transparent hover:text-primary/30"}`}
          >
            {link.icon}
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}
