"use client"

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Shield, Smartphone, LogOut, AlertTriangle, User, Phone } from "lucide-react"
import { DeviceConflictModal } from "@/components/device-conflict-modal"
import { LogoutNotification } from "@/components/logout-notification"

interface UserData {
  user_id: string
  full_name: string
  phone: string
}

interface Device {
  device_id: string
  device_name: string
  last_active: string
  is_current: boolean
}

function Dashboard() {
  const { user, isLoading } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [devices, setDevices] = useState<Device[]>([])
  const [showConflictModal, setShowConflictModal] = useState(false)
  const [conflictDevices, setConflictDevices] = useState<Device[]>([])
  const [showLogoutNotification, setShowLogoutNotification] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchUserData()
      checkDeviceStatus()

      // Check for logout notification in localStorage
      const wasLoggedOut = localStorage.getItem("forcedLogout")
      if (wasLoggedOut) {
        setShowLogoutNotification(true)
        localStorage.removeItem("forcedLogout")
      }
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const response = await fetch(`/api/user/${user?.sub}`)
      if (response.ok) {
        const data = await response.json()
        setUserData(data)
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error)
    }
  }

  const checkDeviceStatus = async () => {
    try {
      const deviceId = localStorage.getItem("deviceId") || generateDeviceId()
      localStorage.setItem("deviceId", deviceId)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.sub,
          device_id: deviceId,
          device_name: navigator.userAgent.split(" ")[0] || "Unknown Device",
        }),
      })

      const result = await response.json()

      if (result.status === "device_limit_exceeded") {
        setConflictDevices(result.active_devices)
        setShowConflictModal(true)
      } else if (result.status === "success") {
        fetchActiveDevices()
      }
    } catch (error) {
      console.error("Device status check failed:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActiveDevices = async () => {
    try {
      const response = await fetch(`/api/devices/${user?.sub}`)
      if (response.ok) {
        const data = await response.json()
        setDevices(data.devices || [])
      }
    } catch (error) {
      console.error("Failed to fetch devices:", error)
    }
  }

  const generateDeviceId = () => {
    return "device_" + Math.random().toString(36).substr(2, 9)
  }

  const handleForceLogin = async (deviceToRemove: string) => {
    try {
      await fetch(`/api/auth/logout/${deviceToRemove}`, { method: "POST" })
      setShowConflictModal(false)
      checkDeviceStatus()
    } catch (error) {
      console.error("Force login failed:", error)
    }
  }

  const handleLogoutDevice = async (deviceId: string) => {
    try {
      await fetch(`/api/auth/logout/${deviceId}`, { method: "POST" })
      fetchActiveDevices()
    } catch (error) {
      console.error("Logout device failed:", error)
    }
  }

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SecureAuth</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">Welcome, {user?.name}</span>
            <Button variant="outline" asChild>
              <a href="/api/auth/logout">Sign Out</a>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Logout Notification */}
        {showLogoutNotification && <LogoutNotification onClose={() => setShowLogoutNotification(false)} />}

        {/* User Profile Section */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">User Profile</CardTitle>
                <CardDescription>Your account information and details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-semibold text-foreground">
                    {userData?.full_name || user?.name || "Not provided"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="text-lg text-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                    <p className="text-lg text-foreground">{userData?.phone || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User ID</label>
                  <p className="text-sm font-mono text-muted-foreground">{user?.sub}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Device Management Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Device Management</CardTitle>
                  <CardDescription>Manage your active devices and sessions</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                {devices.length}/3 Devices
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>No active devices found. This may indicate a session issue.</AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {devices.map((device, index) => (
                  <div key={device.device_id}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {device.device_name}
                            {device.is_current && (
                              <Badge variant="secondary" className="ml-2 text-xs">
                                Current Device
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last active: {new Date(device.last_active).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!device.is_current && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLogoutDevice(device.device_id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Sign Out
                        </Button>
                      )}
                    </div>
                    {index < devices.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Device Conflict Modal */}
      {showConflictModal && (
        <DeviceConflictModal
          devices={conflictDevices}
          onForceLogin={handleForceLogin}
          onCancel={() => setShowConflictModal(false)}
        />
      )}
    </div>
  )
}

export default withPageAuthRequired(Dashboard)
