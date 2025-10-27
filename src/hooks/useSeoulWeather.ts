import { useState, useEffect } from "react";

type WeatherData = {
  temperature: number;
  summary: string;
};

function mapWeatherCodeToText(code: number): string {
  if (code === 0) return "맑음";
  if (code === 1 || code === 2) return "구름 조금";
  if (code === 3) return "흐림";
  if (code >= 45 && code <= 48) return "안개";
  if (code >= 51 && code <= 57) return "이슬비";
  if (code >= 61 && code <= 65) return "비";
  if (code >= 71 && code <= 75) return "눈";
  if (code >= 80 && code <= 82) return "소나기";
  if (code >= 95 && code <= 99) return "뇌우";
  return "기상 정보 없음";
}

export function useSeoulWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const lat = 37.5665;
    const lon = 126.978;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&temperature_unit=celsius`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        const current = data.current_weather;
        if (!current) throw new Error("Invalid weather data");

        setWeather({
          temperature: current.temperature,
          summary: mapWeatherCodeToText(current.weathercode),
        });
      })
      .catch((err) => {
        console.error("Error fetching weather:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return { weather, loading };
}
