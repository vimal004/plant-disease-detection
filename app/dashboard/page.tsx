"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileText, Leaf } from "lucide-react"
import { SensorDataDisplay } from "@/components/sensor-data-display"

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ name: string } | null>(null)
  const [diagnosisCount, setDiagnosisCount] = useState(0)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (!storedUser) {
      router.push("/login")
    } else {
      setUser(JSON.parse(storedUser))

      // Get diagnosis history count
      const history = JSON.parse(localStorage.getItem("diagnosisHistory") || "[]")
      setDiagnosisCount(history.length)
    }
  }, [router])

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-xl text-green-800">Welcome, {user.name}!</CardTitle>
            <CardDescription>Upload plant images to detect diseases and get treatment recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6">
              <div className="bg-green-100 p-6 rounded-full">
                <Leaf className="h-12 w-12 text-green-600" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <p className="text-sm text-gray-600">You have {diagnosisCount} plant diagnosis in your history</p>
          </CardFooter>
        </Card>
      </div>

      {/* Add the SensorDataDisplay component here */}
      <SensorDataDisplay />

      <h2 className="text-xl font-semibold text-green-800 mt-8 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card
          className="border-green-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 cursor-pointer"
          onClick={() => router.push("/dashboard/upload")}
        >
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Upload className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">Upload Image</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">Upload a photo of your plant to detect diseases and get instant diagnosis</p>
          </CardContent>
          <CardFooter>
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push("/dashboard/upload")}>
              Upload Now
            </Button>
          </CardFooter>
        </Card>

        <Card
          className="border-green-200 shadow-sm hover:shadow-md transition-all hover:border-green-300 cursor-pointer"
          onClick={() => router.push("/dashboard/diagnosis")}
        >
          <CardHeader>
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-green-600" />
              <CardTitle className="text-lg text-green-800">View Diagnosis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">View your previous plant diagnoses and treatment recommendations</p>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => router.push("/dashboard/diagnosis")}
            >
              View History
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
