"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Thermometer, Droplets, RefreshCw, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SensorData {
  temperature: number;
  humidity: number;
  timestamp: string;
}

export function SensorDataDisplay() {
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [cheatMode, setCheatMode] = useState<"normal" | "water" | "mud">(
    "normal"
  );

  const fetchSensorData = async () => {
    try {
      setRefreshing(true);
      setError(null);

      await new Promise((resolve) => setTimeout(resolve, 800));

      let temperature = Math.round((Math.random() * 0.5 + 33) * 10) / 10; // 32–34°C
      let humidity = Math.round(Math.random() * 10 + 60); // 60–90%

      if (cheatMode === "water") {
        temperature = Math.max(temperature - 4.5, 30);
        humidity = Math.min(humidity + 20, 100);
      }

      if (cheatMode === "mud") {
        temperature = Math.max(temperature - 3.5, 30);
        humidity = Math.min(humidity + 30, 100);
      }

      const mockData: SensorData = {
        temperature,
        humidity,
        timestamp: new Date().toISOString(),
      };

      setSensorData(mockData);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch sensor data:", err);
      setError("Failed to fetch sensor data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSensorData();
    const intervalId = setInterval(fetchSensorData, 5000);

    // Hidden keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "w") setCheatMode("water");
      else if (e.key === "m") setCheatMode("mud");
      else if (e.key === "n") setCheatMode("normal");
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [cheatMode]);

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 31) return "text-blue-500";
    if (temp > 34) return "text-red-500";
    return "text-green-500";
  };

  const getHumidityColor = (humidity: number) => {
    if (humidity < 60) return "text-amber-500";
    if (humidity > 85) return "text-blue-500";
    return "text-green-500";
  };

  return (
    <Card className="border-green-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg text-green-800">
            Environmental Conditions
          </CardTitle>
          <div className="flex items-center text-xs text-gray-500">
            <RefreshCw
              className={`h-3 w-3 mr-1 ${refreshing ? "animate-spin" : ""}`}
            />
            <span>Auto-refreshing</span>
          </div>
        </div>
        <CardDescription>
          Real-time temperature and humidity data
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Temperature Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-2">
              <Thermometer className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium">Temperature</h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline">
                  <span
                    className={`text-3xl font-bold ${getTemperatureColor(
                      sensorData?.temperature || 0
                    )}`}
                  >
                    {sensorData?.temperature}
                  </span>
                  <span className="ml-1 text-gray-600">°C</span>
                </div>
                <Progress
                  value={((sensorData?.temperature || 32) - 15) * 10}
                  className="h-2 mt-2"
                  indicatorClassName={getTemperatureColor(
                    sensorData?.temperature || 0
                  ).replace("text-", "bg-")}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>15°C</span>
                  <span>35°C</span>
                </div>
              </>
            )}
          </div>

          {/* Humidity Card */}
          <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center mb-2">
              <Droplets className="h-5 w-5 text-green-600 mr-2" />
              <h3 className="font-medium">Humidity</h3>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-baseline">
                  <span
                    className={`text-3xl font-bold ${getHumidityColor(
                      sensorData?.humidity || 0
                    )}`}
                  >
                    {sensorData?.humidity}
                  </span>
                  <span className="ml-1 text-gray-600">%</span>
                </div>
                <Progress
                  value={sensorData?.humidity}
                  className="h-2 mt-2"
                  indicatorClassName={getHumidityColor(
                    sensorData?.humidity || 0
                  ).replace("text-", "bg-")}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {sensorData && (
          <div className="text-xs text-gray-500 mt-4 text-right">
            Last updated: {formatTime(sensorData.timestamp)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
