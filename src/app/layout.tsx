import type { Metadata, Viewport } from "next"
import { Figtree, Fraunces } from "next/font/google"
import "./globals.css"

const display = Fraunces({ variable: "--font-fraunces", subsets: ["latin"] })
const body = Figtree({ variable: "--font-figtree", subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Gift Exchange",
  description: "Run a Secret Santa with friends. No accounts needed.",
}

export const viewport: Viewport = { themeColor: "#fbf6ec" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  )
}
