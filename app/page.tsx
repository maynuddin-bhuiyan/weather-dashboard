"use client"

import { useState, useEffect } from "react"
import { Search, Trash2, Sun, Cloud, CloudSun, CloudRain, CloudLightning, CloudSnow, RefreshCw, Moon, CloudMoon, CloudFog } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"

interface WeatherData {
  city: string
  country: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  icon: string
  description: string
}

interface City {
  name: string
  country: string
  lat: number
  lon: number
}

interface ApiCity {
  name: string
  country: string
  lat: number
  lon: number
  [key: string]: unknown
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

async function searchCities(query: string): Promise<City[]> {
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY
  if (!API_KEY) throw new Error("API key not found")
    console.log("API KEY",API_KEY)
  try {
    const response = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`
    )
    
    if (!response.ok) throw new Error('City search failed')
    
    const data: ApiCity[] = await response.json()
    return data.map((city) => ({
      name: city.name,
      country: city.country,
      lat: city.lat,
      lon: city.lon
    }))
  } catch {
    console.error("City search error")
    return []
  }
}

async function fetchWeatherData(city: City): Promise<WeatherData> {
  const API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY
  if (!API_KEY) throw new Error("API key not found")
    console.log("API KEY",API_KEY)

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${city.lat}&lon=${city.lon}&units=metric&appid=${API_KEY}`
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Weather fetch failed')
    }

    const data = await response.json()
    
    return {
      city: city.name,
      country: city.country,
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6),
      icon: data.weather[0].icon,
      description: data.weather[0].description
    }
  } catch {
    console.error("Weather fetch error")
    throw new Error("Failed to fetch weather data")
  }
}

function WeatherIcon({ code }: { code: string }) {
  const iconMap: Record<string, React.ReactNode> = {
    '01d': <Sun className="h-8 w-8 text-yellow-500" />,
    '01n': <Moon className="h-8 w-8 text-blue-300" />,
    '02d': <CloudSun className="h-8 w-8 text-blue-400" />,
    '02n': <CloudMoon className="h-8 w-8 text-blue-400" />,
    '03d': <Cloud className="h-8 w-8 text-gray-400" />,
    '04d': <Cloud className="h-8 w-8 text-gray-500" />,
    '09d': <CloudRain className="h-8 w-8 text-blue-500" />,
    '10d': <CloudRain className="h-8 w-8 text-blue-600" />,
    '11d': <CloudLightning className="h-8 w-8 text-yellow-600" />,
    '13d': <CloudSnow className="h-8 w-8 text-blue-200" />,
    '50d': <CloudFog className="h-8 w-8 text-gray-300" />
  }

  return iconMap[code] || <Cloud className="h-8 w-8" />
}

export default function WeatherDashboard() {
  const [cities, setCities] = useState<City[]>([])
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [searchTerm, setSearchTerm] = useState("")
  const [citySuggestions, setCitySuggestions] = useState<City[]>([])
  const [unit, setUnit] = useState<"C" | "F">("C")
  const [error, setError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  useEffect(() => {
    const savedCities = localStorage.getItem("weatherCities")
    if (savedCities) setCities(JSON.parse(savedCities))
  }, [])

  useEffect(() => {
    localStorage.setItem("weatherCities", JSON.stringify(cities))
  }, [cities])

  useEffect(() => {
    const fetchCitySuggestions = async () => {
      if (debouncedSearchTerm.length >= 3) {
        try {
          const results = await searchCities(debouncedSearchTerm)
          setCitySuggestions(results)
          setError(null)
        } catch {
          setError("Failed to search cities")
          setCitySuggestions([])
        }
      } else {
        setCitySuggestions([])
      }
    }

    fetchCitySuggestions()
  }, [debouncedSearchTerm])

  useEffect(() => {
    const fetchData = async () => {
      setError(null)
      try {
        const weatherPromises = cities.map(async (city) => {
          const cityKey = `${city.name},${city.country}`
          if (!weatherData[cityKey] && !loading[cityKey]) {
            setLoading(prev => ({ ...prev, [cityKey]: true }))
            try {
              const data = await fetchWeatherData(city)
              setWeatherData(prev => ({ ...prev, [cityKey]: data }))
            } finally {
              setLoading(prev => ({ ...prev, [cityKey]: false }))
            }
          }
        })

        await Promise.all(weatherPromises)
      } catch {
        setError("Failed to fetch weather data for some cities")
      }
    }

    if (cities.length > 0) fetchData()
  }, [cities, loading, weatherData])

  const addCity = (city: City) => {
    const cityKey = `${city.name},${city.country}`
    if (!cities.some(c => `${c.name},${c.country}` === cityKey)) {
      setCities(prev => [...prev, city])
    }
    setSearchTerm("")
    setCitySuggestions([])
  }

  const removeCity = (cityKey: string) => {
    setCities(prev => prev.filter(c => `${c.name},${c.country}` !== cityKey))
    setWeatherData(prev => {
      const newData = { ...prev }
      delete newData[cityKey]
      return newData
    })
  }

  const convertTemperature = (temp: number, unit: "C" | "F") => 
    unit === "C" ? temp : Math.round((temp * 9) / 5 + 32)

  const refreshData = async () => {
    setWeatherData({})
    setError(null)
    try {
      const weatherPromises = cities.map(async (city) => {
        const cityKey = `${city.name},${city.country}`
        setLoading(prev => ({ ...prev, [cityKey]: true }))
        try {
          const data = await fetchWeatherData(city)
          setWeatherData(prev => ({ ...prev, [cityKey]: data }))
        } finally {
          setLoading(prev => ({ ...prev, [cityKey]: false }))
        }
      })

      await Promise.all(weatherPromises)
    } catch {
      setError("Failed to refresh weather data")
    }
  }

  return (
    <div className="my-5 lg:my-10">
      <div className="custom-container">
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Weather Dashboard</h1>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refreshData} 
                className="mt-1"
                disabled={Object.values(loading).some(Boolean)}
              >
                <RefreshCw className="h-5 w-5" />
                <span className="sr-only">Refresh weather data</span>
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex items-center space-x-2">
                <Switch
                  id="unit-toggle"
                  checked={unit === "F"}
                  onCheckedChange={checked => setUnit(checked ? "F" : "C")}
                />
                <Label htmlFor="unit-toggle">°{unit}</Label>
              </div>

              <div className="relative flex-1 sm:flex-initial">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for a city..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                  <Button variant="outline" disabled={searchTerm.length === 0}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {citySuggestions.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-background border rounded-md shadow-lg">
                    <ul>
                      {citySuggestions.map((city) => (
                        <li
                        key={`${city.name}-${city.country}-${city.lat}-${city.lon}`}
                          className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                          onClick={() => addCity(city)}
                        >
                          {city.name}, {city.country}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {cities.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-xl font-medium text-muted-foreground">
                No cities added yet. Search for a city to see weather information.
              </h2>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {cities.map(city => {
                 const uniqueKey = `${city.name}-${city.country}-${city.lat}-${city.lon}`
                const cityKey = `${city.name},${city.country}`
                const data = weatherData[cityKey]
                const isLoading = loading[cityKey]

                return (
                  <Card key={uniqueKey} className="overflow-hidden">
                    <CardContent className="p-0">
                      {isLoading ? (
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
                      ) : (
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 text-muted-foreground hover:text-destructive cursor-pointer"
                            onClick={() => removeCity(cityKey)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>

                          <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">
                              {data?.city || city.name}
                              <span className="text-sm ml-2 text-muted-foreground">
                                {data?.country || city.country}
                              </span>
                            </h2>
                            <div className="flex items-center mb-4">
                              <div className="text-4xl font-bold">
                                {convertTemperature(data?.temperature || 0, unit)}°{unit}
                              </div>
                              <div className="ml-4">
                                <WeatherIcon code={data?.icon || "01d"} />
                              </div>
                            </div>
                            <div className="text-lg mb-2 capitalize">
                              {data?.description || "Loading..."}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div className="flex justify-between py-1">
                                <span>Humidity</span>
                                <span>{data?.humidity ?? "--"}%</span>
                              </div>
                              <div className="flex justify-between py-1">
                                <span>Wind</span>
                                <span>{data?.windSpeed ?? "--"} km/h</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}