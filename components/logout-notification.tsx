"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertTriangle, X } from "lucide-react"

interface LogoutNotificationProps {
  onClose: () => void
}

export function LogoutNotification({ onClose }: LogoutNotificationProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Allow fade out animation
    }, 8000) // Auto-dismiss after 8 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  if (!isVisible) return null

  return (
    <Alert className="mb-6 border-destructive/50 bg-destructive/5">
      <AlertTriangle className="h-4 w-4 text-destructive" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-destructive">
          You were signed out from this device because you logged in from another device that exceeded your device
          limit.
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 300)
          }}
          className="ml-4 h-auto p-1 text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </AlertDescription>
    </Alert>
  )
}
