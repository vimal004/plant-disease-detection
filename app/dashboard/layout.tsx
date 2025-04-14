"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Leaf, Upload, FileText, LogOut, User } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(JSON.parse(storedUser))
    }
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out",
    })
    router.push("/login")
  }

  if (!user) {
    return null
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-green-50">
        <Sidebar variant="floating" className="border-green-200">
          <SidebarHeader className="flex flex-col items-center justify-center p-4">
            <div className="bg-green-100 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-2">
              <Leaf className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-green-800">Plant Doctor</h2>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard" isActive={router.pathname === "/dashboard"}>
                  <button onClick={() => router.push("/dashboard")}>
                    <User />
                    <span>Dashboard</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Upload Image" isActive={router.pathname === "/dashboard/upload"}>
                  <button onClick={() => router.push("/dashboard/upload")}>
                    <Upload />
                    <span>Upload Image</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Diagnosis History"
                  isActive={router.pathname === "/dashboard/diagnosis"}
                >
                  <button onClick={() => router.push("/dashboard/diagnosis")}>
                    <FileText />
                    <span>Diagnosis History</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Logout">
                  <button onClick={handleLogout}>
                    <LogOut />
                    <span>Logout</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="bg-white">
          <header className="border-b border-green-100 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <SidebarTrigger className="mr-4" />
              <h1 className="text-xl font-semibold text-green-800">Plant Disease Detection</h1>
            </div>
            <div className="flex items-center">
              <span className="text-sm text-gray-600 mr-2">Welcome, {user.name}</span>
              <Button variant="ghost" size="icon" className="text-green-600" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </header>
          <main className="p-6 overflow-auto h-[calc(100vh-64px)]">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
