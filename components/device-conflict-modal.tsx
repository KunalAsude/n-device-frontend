"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Smartphone, X } from "lucide-react"

interface Device {
  device_id: string
  device_name: string
  last_active: string
  is_current: boolean
}

interface DeviceConflictModalProps {
  devices: Device[]
  onForceLogin: (deviceId: string) => void
  onCancel: () => void
}

export function DeviceConflictModal({ devices, onForceLogin, onCancel }: DeviceConflictModalProps) {
  const [selectedDevice, setSelectedDevice] = useState<string>("")

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-xl text-foreground">Device Limit Reached</CardTitle>
          <CardDescription className="text-center">
            You&apos;ve reached the maximum number of devices (3). Please select a device to sign out or cancel to stay
            signed out on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">Active Devices:</p>
            {devices.map((device) => (
              <div
                key={device.device_id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedDevice === device.device_id
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card/50 hover:bg-card"
                }`}
                onClick={() => setSelectedDevice(device.device_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{device.device_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Last active: {new Date(device.last_active).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {selectedDevice === device.device_id && (
                    <Badge variant="secondary" className="text-xs">
                      Selected
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button variant="outline" onClick={onCancel} className="flex-1 bg-transparent">
              <X className="h-4 w-4 mr-2" />
              Cancel Login
            </Button>
            <Button
              onClick={() => selectedDevice && onForceLogin(selectedDevice)}
              disabled={!selectedDevice}
              className="flex-1"
            >
              Force Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
