"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Search, Trash2, Sun, Cloud, CloudSun, CloudRain, CloudLightning, CloudSnow, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

// data Types
interface WeatherData {
  city: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  icon: string
}

// Cities for search
const CITIES = [
  "New York",
  "London",
  "Tokyo",
  "Paris",
  "Sydney",
  "Berlin",
  "Toronto",
  "Singapore",
  "Dubai",
  "San Francisco",
  "Barcelona",
  "Rome",
  "Amsterdam",
]

// Generate mock weather data
function generateWeatherData(city: string): WeatherData {
  const CONDITIONS = [
    { condition: "Sunny", icon: "sun" },
    { condition: "Partly Cloudy", icon: "cloud-sun" },
    { condition: "Cloudy", icon: "cloud" },
    { condition: "Rainy", icon: "cloud-rain" },
    { condition: "Thunderstorm", icon: "cloud-lightning" },
    { condition: "Snowy", icon: "cloud-snow" },
  ]

  const randomCondition = CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)]

  return {
    city,
    temperature: Math.floor(Math.random() * 35) - 5,
    condition: randomCondition.condition,
    humidity: Math.floor(Math.random() * 100),
    windSpeed: Math.floor(Math.random() * 30),
    icon: randomCondition.icon,
  }
}

// icon component
function WeatherIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    sun: <Sun className="h-8 w-8 text-yellow-500" />,
    "cloud-sun": <CloudSun className="h-8 w-8 text-blue-400" />,
    cloud: <Cloud className="h-8 w-8 text-gray-400" />,
    "cloud-rain": <CloudRain className="h-8 w-8 text-blue-500" />,
    "cloud-lightning": <CloudLightning className="h-8 w-8 text-purple-500" />,
    "cloud-snow": <CloudSnow className="h-8 w-8 text-blue-200" />,
  }

  return icons[name] || <Cloud className="h-8 w-8" />
}

export default function WeatherDashboard() {
  const [cities, setCities] = useState<string[]>([])
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [searchQuery, setSearchQuery] = useState("")
  const [unit, setUnit] = useState<"C" | "F">("C")
  const [showDropdown, setShowDropdown] = useState(false)

  // Load saved cities from localStorage
  useEffect(() => {
    const savedCities = localStorage.getItem("weatherCities")
    if (savedCities) {
      setCities(JSON.parse(savedCities))
    }
  }, [])

  // Save cities to localStorage
  useEffect(() => {
    localStorage.setItem("weatherCities", JSON.stringify(cities))
  }, [cities])

  // Fetch weather data for cities
  useEffect(() => {
    const fetchData = async () => {
      for (const city of cities) {
        if (!weatherData[city] && !loading[city]) {
          setLoading((prev) => ({ ...prev, [city]: true }))

          // API delay
          await new Promise((resolve) => setTimeout(resolve, 500))

          // Generate mock data
          const data = generateWeatherData(city)
          setWeatherData((prev) => ({ ...prev, [city]: data }))
          setLoading((prev) => ({ ...prev, [city]: false }))
        }
      }
    }

    fetchData()
  }, [cities, weatherData, loading])

  // Add a city to the dashboard
  const addCity = (city: string) => {
    if (!cities.includes(city)) {
      setCities((prev) => [...prev, city])
    }
    setSearchQuery("")
    setShowDropdown(false)
  }

  // Remove a city from the dashboard
  const removeCity = (city: string) => {
    setCities((prev) => prev.filter((c) => c !== city))
    setWeatherData((prev) => {
      const newData = { ...prev }
      delete newData[city]
      return newData
    })
  }

  // Convert temperature between Celsius and Fahrenheit
  const convertTemperature = (temp: number, unit: "C" | "F"): number => {
    if (unit === "C") return temp
    return Math.round((temp * 9) / 5 + 32)
  }

  // Refresh all weather data
  const refreshData = () => {
    setWeatherData({})
  }

  // Filter cities based on search query
  const filteredCities = CITIES.filter(
    (city) => city.toLowerCase().includes(searchQuery.toLowerCase()) && !cities.includes(city),
  )

  return (
    <div className="my-5 lg:my-10">
      <div className="custom-container">
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Weather Dashboard</h1>
            <Button variant="ghost" size="icon" onClick={refreshData} className="mt-1">
              <RefreshCw className="h-5 w-5" />
              <span className="sr-only">Refresh weather data</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
            <div className="flex items-center space-x-2">
              <Switch
                id="unit-toggle"
                checked={unit === "F"}
                onCheckedChange={(checked) => setUnit(checked ? "F" : "C")}
              />
              <Label htmlFor="unit-toggle">°{unit}</Label>
            </div>

            <div className="relative flex-1 sm:flex-initial">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a city..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowDropdown(true)
                  }}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full"
                />
                <Button variant="outline" onClick={() => setShowDropdown(!showDropdown)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>

              {showDropdown && searchQuery && (
                <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg">
                  {filteredCities.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">No cities found</div>
                  ) : (
                    <ul>
                      {filteredCities.map((city) => (
                        <li
                          key={city}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => addCity(city)}
                        >
                          {city}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {cities.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium text-muted-foreground">
              No cities added yet. Add a city to see weather information.
            </h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {cities.map((city) => (
              <Card key={city} className="overflow-hidden">
                <CardContent className="p-0">
                  {loading[city] ? (
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-8 rounded-full" />
                      </div>
                      <Skeleton className="h-16 w-24" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                      </div>
                    </div>
                  ) : weatherData[city] ? (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                        onClick={() => removeCity(city)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="p-6">
                        <h2 className="text-xl font-semibold mb-4">{city}</h2>
                        <div className="flex items-center mb-4">
                          <div className="text-4xl font-bold">
                            {convertTemperature(weatherData[city].temperature, unit)}°{unit}
                          </div>
                          <div className="ml-4">
                            <WeatherIcon name={weatherData[city].icon} />
                          </div>
                        </div>
                        <div className="text-lg mb-2">{weatherData[city].condition}</div>
                        <div className="text-sm text-muted-foreground">
                          <div className="flex justify-between py-1">
                            <span>Humidity</span>
                            <span>{weatherData[city].humidity}%</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span>Wind</span>
                            <span>{weatherData[city].windSpeed} km/h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  )
}

