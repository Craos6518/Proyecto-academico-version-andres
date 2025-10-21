import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import AuthRehydrate from "@/components/auth-rehydrate"

// Using Geist package fonts via `geist/font/*`

export const metadata: Metadata = {
  title: "Sistema Académico - Gestión de Calificaciones",
  description: "Sistema de gestión académica para administración de calificaciones y estudiantes",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/placeholder-logo.svg" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthRehydrate />
        <Suspense fallback={null}>{children}</Suspense>
        {process.env.NODE_ENV === 'production' ? <Analytics /> : null}
      </body>
    </html>
  )
}
