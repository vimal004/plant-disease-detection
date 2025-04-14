"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Leaf } from "lucide-react"

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (user) {
      router.push("/dashboard")
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-green-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full">
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 p-3 rounded-full w-16 h-16 flex items-center justify-center mb-4">
              <Leaf className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">Plant Disease Detection</CardTitle>
            <CardDescription>Identify plant diseases instantly with AI-powered analysis</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-gray-600">
              Upload images of your plants and get instant diagnosis and treatment recommendations.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => router.push("/login")}>
              Login
            </Button>
            <Button
              variant="outline"
              className="w-full border-green-600 text-green-600 hover:bg-green-50"
              onClick={() => router.push("/signup")}
            >
              Sign Up
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
