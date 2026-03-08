import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/toast/provider"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "GitHub Global | GitHub 仓库自动化翻译平台",
  description: "自动化翻译您的 GitHub 仓库文档，统一配置、执行与任务追踪体验。",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} min-h-screen bg-background text-foreground`}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  )
}
