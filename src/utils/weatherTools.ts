// 天气查询工具
import axios from 'axios';

// 高德API配置
const AMAP_WEATHER_API =
  'https://restapi.amap.com/v3/weather/weatherInfo?parameters';
const AMAP_API_KEY = 'd1f6c64780e5f4c14080de229b177872';

/**
 * 天气信息类型定义
 */
export interface WeatherData {
  city: string;
  weather: string; // 天气状况（如“晴”“多云”）
  temperature_float: string; // 温度（如“25”表示25℃）
  winddirection: string; // 风向（如“东北”）
  windpower: string; // 风力（如“2”表示2级）
  humidity_float: string; // 湿度（百分比）
}

/**
 * 调用高德天气API查询实时天气
 * @param city 城市名称（如“北京”“上海”）
 * @returns 天气信息或错误提示
 */
export const getRealTimeWeather = async (city: string): Promise<string> => {
  try {
    if (!AMAP_API_KEY) throw new Error('未配置高德API密钥');

    const response = await axios.get(AMAP_WEATHER_API, {
      params: {
        city,
        key: AMAP_API_KEY,
        extensions: 'base', // 返回实时天气
      },
    });

    const { status, lives } = response.data;
    if (status !== '1' || lives.length === 0) {
      return `无法获取 ${city} 的天气信息，请检查城市名称是否正确`;
    }

    const weather = lives[0] as WeatherData;
    console.log(weather);
    // 格式化天气信息
    return `### ${weather.city} 实时天气：
      - 天气状况：${weather.weather} \n
      - 温度：${weather.temperature_float}℃
      - 风向：${weather.winddirection}风
      - 风力：${weather.windpower}级
      - 湿度：${weather.humidity_float}%`;
  } catch (error) {
    console.error('天气查询失败：', error);
    return `天气查询失败：${(error as Error).message}`;
  }
};
