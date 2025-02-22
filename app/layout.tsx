import type React from "react"
import type { Metadata } from "next"
import "@/styles/globals.css"

export const metadata: Metadata = {
  title: "LabelSense AI - Defect Detection",
  description: "AI-powered label defect detection system",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}



import './globals.css'