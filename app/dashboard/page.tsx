"use client"

import { useUser, withPageAuthRequired } from "@auth0/nextjs-auth0"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Shield, Smartphone, LogOut, AlertTriangle, User, Phone, Edit, Check, X } from "lucide-react"
import { DeviceConflictModal } from "@/components/device-conflict-modal"
import { LogoutNotification } from "@/components/logout-notification"
import API from "@/lib/api"
import { getDeviceId } from "@/lib/device"

interface UserData {
  user_id: string
  full_name: string
  email: string
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
  const [currentDeviceLoggedIn, setCurrentDeviceLoggedIn] = useState(false)
  const [deviceRegistrationLoading, setDeviceRegistrationLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editedUserData, setEditedUserData] = useState({
    full_name: "",
    email: "",
    phone: ""
  })
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserData()
      checkDeviceStatus()

      const wasLoggedOut = localStorage.getItem("forcedLogout")
      if (wasLoggedOut) {
        setShowLogoutNotification(true)
        localStorage.removeItem("forcedLogout")
      }
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      const response = await API.get(`/auth/me/${user?.sub}`)
      const data = response.data
      setUserData(data)
      setEditedUserData({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || ""
      })
    } catch (error) {
      // Handle error silently
    }
  }

  const checkDeviceStatus = async () => {
    try {
      const deviceId = getDeviceId()
      if (!deviceId) {
        return
      }

      await fetchUserData()
      await fetchActiveDevices()

    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false)
    }
  }

  const registerCurrentDevice = async () => {
    try {
      setDeviceRegistrationLoading(true)
      const deviceId = getDeviceId()
      if (!deviceId) {
        return
      }

      const deviceName = navigator.userAgent?.split(" ")[0] || "Unknown Device"

      const response = await API.post(`/auth/login/${user?.sub}`, {
        device_id: deviceId,
        device_name: deviceName,
        full_name: user?.name || "Unknown User",
        email: user?.email || "no-email@example.com",
        phone: user?.phone_number || "Not provided"
      })
      
      const result = response.data

      if (result.status === "limit_reached") {
        setConflictDevices(result.active_sessions.map((s: any) => ({
          device_id: s.device_id,
          device_name: s.device_name || "Unknown Device",
          last_active: s.created_at || new Date().toISOString(),
          is_current: false,
        })))
        setShowConflictModal(true)
      } else if (result.status === "logged_in" || result.status === "already_logged_in") {
        setUserData(result.user)
        setCurrentDeviceLoggedIn(true)
        fetchActiveDevices()
      }
    } catch (error) {
      console.error("Device registration failed:", error)
    } finally {
      setDeviceRegistrationLoading(false)
    }
  }

  const fetchActiveDevices = async () => {
    try {
      const response = await API.get(`/auth/devices/${user?.sub}`)
      const data = response.data
      
      const currentDeviceId = getDeviceId()
      const transformedDevices = (data.devices || []).map((device: any) => ({
        device_id: device.device_id,
        device_name: device.device_name || "Unknown Device",
        last_active: device.last_active || device.created_at || new Date().toISOString(),
        is_current: device.device_id === currentDeviceId,
      }))
      
      setDevices(transformedDevices)
      
      const currentDeviceInList = transformedDevices.some((device: Device) => device.is_current)
      setCurrentDeviceLoggedIn(currentDeviceInList)
      
    } catch (error: any) {
      console.error("Failed to fetch devices:", error)
      if (error.response?.status === 404) {
        setCurrentDeviceLoggedIn(false)
      }
    }
  }


  const handleLogoutDevice = async (deviceId: string) => {
    try {
      await API.post(`/auth/logout/${deviceId}`)
      
      const currentDeviceId = getDeviceId()
      if (deviceId === currentDeviceId) {
        setCurrentDeviceLoggedIn(false)
      }
      
      fetchActiveDevices()
    } catch (error) {
      console.error("Logout device failed:", error)
    }
  }

  const handleRemoveCurrentDevice = async () => {
    const currentDeviceId = getDeviceId()
    if (currentDeviceId) {
      await handleLogoutDevice(currentDeviceId)
    }
  }

  const handleLogoutAllOtherDevices = async () => {
    try {
      const currentDeviceId = getDeviceId()
      const otherDevices = devices.filter(device => !device.is_current)
      
      // Logout all other devices
      await Promise.all(
        otherDevices.map(device => API.post(`/auth/logout/${device.device_id}`))
      )
      
      fetchActiveDevices()
    } catch (error) {
      console.error("Failed to logout other devices:", error)
    }
  }

  const handleForceLogin = async (deviceToRemove?: string) => {
    try {
      const deviceId = getDeviceId()
      if (!deviceId) return
      
      const deviceName = navigator.userAgent?.split(" ")[0] || "Unknown Device"
      
      if (deviceToRemove) {
        await API.post(`/auth/logout/${deviceToRemove}`)
      }
      
      const response = await API.post(`/auth/login/${user?.sub}`, {
        device_id: deviceId,
        device_name: deviceName,
        full_name: user?.name || "Unknown User",
        email: user?.email || "no-email@example.com",
        phone: user?.phone_number || "Not provided",
        force: true
      })
      
      const result = response.data
      
      if (result.status === "logged_in") {
        setUserData(result.user)
        setShowConflictModal(false)
        fetchActiveDevices()
      }
    } catch (error) {
      console.error("Force login failed:", error)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      setProfileUpdateLoading(true)
      
      // Only send fields that have been changed
      const updateData: any = {}
      
      if (editedUserData.full_name !== (userData?.full_name || "")) {
        updateData.full_name = editedUserData.full_name
      }
      if (editedUserData.email !== (userData?.email || "")) {
        updateData.email = editedUserData.email
      }
      if (editedUserData.phone !== (userData?.phone || "")) {
        updateData.phone = editedUserData.phone
      }
      
      // Only make API call if there are changes
      if (Object.keys(updateData).length > 0) {
        const response = await API.put(`/auth/user/${user?.sub}`, updateData)
        
        if (response.status === 200) {
          setUserData(response.data)
        }
      }
      
      setIsEditingProfile(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
    } finally {
      setProfileUpdateLoading(false)
    }
  }

  const handleCancelProfileEdit = () => {
    setEditedUserData({
      full_name: userData?.full_name || "",
      email: userData?.email || "",
      phone: userData?.phone || ""
    })
    setIsEditingProfile(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setEditedUserData(prev => ({
      ...prev,
      [field]: value
    }))
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
              <a href="/auth/logout">Sign Out</a>
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">User Profile</CardTitle>
                  <CardDescription>Your account information and details</CardDescription>
                </div>
              </div>
              {!isEditingProfile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProfile(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isEditingProfile ? (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        value={editedUserData.full_name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('full_name', e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <input
                        type="email"
                        value={editedUserData.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('email', e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                      <input
                        type="tel"
                        value={editedUserData.phone}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('phone', e.target.value)}
                        className="mt-1 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">User ID</label>
                      <p className="text-sm font-mono text-muted-foreground mt-1">{user?.sub}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-4 border-t">
                  <Button
                    onClick={handleUpdateProfile}
                    disabled={profileUpdateLoading}
                  >
                    {profileUpdateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelProfileEdit}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
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
                    <p className="text-lg text-foreground">
                      {userData?.email || user?.email || "Not provided"}
                    </p>
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
            )}
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
            {/* Current Device Status */}
            <div className="mb-6 p-4 rounded-lg border border-border bg-card/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">This Device</p>
                    <p className="text-sm text-muted-foreground">
                      Current browser session
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {currentDeviceLoggedIn ? (
                    <>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveCurrentDevice}
                        className="text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout Device
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={registerCurrentDevice}
                      disabled={deviceRegistrationLoading}
                      size="sm"
                    >
                      {deviceRegistrationLoading ? "Registering..." : "Register Device"}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Other Devices Actions */}
            {devices.filter(d => !d.is_current).length > 0 && (
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Other Devices</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogoutAllOtherDevices}
                  className="text-destructive hover:text-destructive"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Logout All Others
                </Button>
              </div>
            )}

            {/* Device List */}
            {devices.filter(d => !d.is_current).length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {!currentDeviceLoggedIn 
                    ? "No other devices found. Register this device to get started."
                    : "No other devices found. Only this device is currently active."
                  }
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-4">
                {devices.filter(device => !device.is_current).map((device, index) => (
                  <div key={device.device_id}>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card/50">
                      <div className="flex items-center space-x-3">
                        <Smartphone className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">
                            {device.device_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Last active: {new Date(device.last_active).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLogoutDevice(device.device_id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        Logout
                      </Button>
                    </div>
                    {index < devices.filter(d => !d.is_current).length - 1 && <Separator className="my-2" />}
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
