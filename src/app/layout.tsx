import type { Metadata, Viewport } from "next";
import { Quicksand } from "next/font/google";
import { ThemeScript } from "@/components/theme/theme-script";
import { Providers } from "@/components/providers";
import { AmbientLeeks } from "@/components/ambient/ambient-leeks";
import "./globals.css";

const display = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Leeklet · 大葱管理后台",
    template: "%s · Leeklet",
  },
  description:
    "基于 mioku-plugin-crystelf 的初音未来主题管理面板：卡密、群管理、AI 控制、邀请审批与反馈。",
  applicationName: "Leeklet",
  icons: { icon: "/leek.png", apple: "/leek.png" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfdfc" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1316" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={display.variable}>
      <head>
        <ThemeScript />
      </head>
      <body>
        <Providers>
          {children}
          <AmbientLeeks />
        </Providers>
      </body>
    </html>
  );
}
