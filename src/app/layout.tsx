 // layout.tsx
import { Provider } from "@/components/provider";
import { inter } from "@/utils/font";
import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "ClinySOFT",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased min-h-dvh w-full overflow-hidden`}
        suppressHydrationWarning
      >
        <Provider>
          {children}
          <Toaster richColors position="top-right" />
        </Provider>
      </body>
    </html>
  );
}