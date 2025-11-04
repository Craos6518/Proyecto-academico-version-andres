"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import Loader from "@/components/loader"

type LoadingContextType = {
  isLoading: boolean
  show: (ms?: number, role?: string) => Promise<void>
  hide: () => void
}

const LoadingContext = createContext<LoadingContextType | null>(null)

function preloadForRole(role?: string) {
  const urls = ["/api/auth/me"]
  const r = role ?? ""
  if (r === "admin") {
    urls.push("/api/admin/stats", "/api/admin/users", "/api/admin/subjects")
  } else if (r === "director") {
    urls.push("/api/teacher/grades", "/api/teacher/assignments")
  } else if (r === "teacher") {
    urls.push("/api/teacher/stats", "/api/admin/subjects")
  } else if (r === "student") {
    urls.push("/api/student/stats", "/api/student/secure-data")
  }

  return Promise.allSettled(
    urls.map((u) =>
      fetch(u, { method: "GET", credentials: "same-origin" }).catch(() => null)
    )
  )
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)

  const hide = useCallback(() => setIsLoading(false), [])

  const show = useCallback(async (ms = 20000, role?: string) => {
    setIsLoading(true)
    try {
      const preload = preloadForRole(role)
      const timeout = new Promise((res) => setTimeout(res, ms))
      // Wait until either preload finishes or timeout occurs
      await Promise.race([preload, timeout])
    } catch {
      // ignore
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <LoadingContext.Provider value={{ isLoading, show, hide }}>
      {children}
      {isLoading ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <Loader />
        </div>
      ) : null}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const ctx = useContext(LoadingContext)
  if (!ctx) throw new Error("useLoading must be used within LoadingProvider")
  return ctx
}

export default LoadingContext
