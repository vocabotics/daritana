import React, { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, CloudDrizzle, Wind, Droplets, MapPin } from 'lucide-react';
import { dashboardService } from '@/services/dashboard.service';

interface WeatherData {
  location: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
  }>;
}

export default function WeatherWidget({ data }: { data?: WeatherData }) {
  const [weather, setWeather] = useState<WeatherData | null>(data || null);
  const [loading, setLoading] = useState(!data);

  useEffect(() => {
    if (!data) {
      // Fetch weather data if not provided
      dashboardService.getWeather().then(weatherData => {
        if (weatherData) {
          setWeather(weatherData);
        }
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [data]);

  const getWeatherIcon = (condition: string) => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return <CloudRain className="h-8 w-8 text-blue-500" />;
    }
    if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-8 w-8 text-gray-500" />;
    }
    if (lowerCondition.includes('drizzle')) {
      return <CloudDrizzle className="h-8 w-8 text-gray-400" />;
    }
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return <CloudRain className="h-8 w-8 text-purple-600" />;
    }
    return <Sun className="h-8 w-8 text-yellow-500" />;
  };

  const getSmallWeatherIcon = (condition: string) => {
    const lowerCondition = condition?.toLowerCase() || '';
    if (lowerCondition.includes('rain') || lowerCondition.includes('shower')) {
      return <CloudRain className="h-4 w-4 text-blue-500" />;
    }
    if (lowerCondition.includes('cloud')) {
      return <Cloud className="h-4 w-4 text-gray-500" />;
    }
    if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
      return <CloudRain className="h-4 w-4 text-purple-600" />;
    }
    return <Sun className="h-4 w-4 text-yellow-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse space-y-4 w-full">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Cloud className="h-12 w-12 mb-2 text-gray-300" />
        <p className="text-sm">Weather data unavailable</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Weather */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
            <MapPin className="h-3 w-3" />
            <span>{weather.location}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{weather.temperature}°C</span>
          </div>
          <p className="text-sm text-gray-600 mt-1">{weather.condition}</p>
        </div>
        <div className="flex flex-col items-center">
          {getWeatherIcon(weather.condition)}
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y">
        <div className="flex items-center gap-2">
          <Droplets className="h-4 w-4 text-blue-400" />
          <div>
            <p className="text-xs text-gray-500">Humidity</p>
            <p className="text-sm font-medium">{weather.humidity}%</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Wind className="h-4 w-4 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Wind</p>
            <p className="text-sm font-medium">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* 3-Day Forecast */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-gray-700">3-Day Forecast</h4>
        {weather.forecast && weather.forecast.map((day, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              {getSmallWeatherIcon(day.condition)}
              <span className="text-sm font-medium">{day.day}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">{day.condition}</span>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-blue-600">{day.low}°</span>
                <span className="text-gray-400">/</span>
                <span className="text-red-600">{day.high}°</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}