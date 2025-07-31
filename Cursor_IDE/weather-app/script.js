// Replace 'YOUR_API_KEY' with your OpenWeatherMap API key
async function getWeather() {
  const city = document.getElementById('cityInput').value.trim();
  const resultDiv = document.getElementById('weatherResult');
  if (!city) {
    resultDiv.textContent = 'Please enter a city name.';
    return;
  }
  resultDiv.textContent = 'Loading...';
  try {
    const apiKey = '370c8aff943d36a460c9fd87bad5fab0'; // <-- Insert your real OpenWeatherMap API key here
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`);
    if (!response.ok) {
      resultDiv.textContent = 'City not found or API error.';
      return;
    }
    const data = await response.json();
    const weather = data.weather[0].description;
    const temp = data.main.temp;
    const cityName = data.name;
    resultDiv.innerHTML = `<strong>${cityName}</strong><br>Weather: ${weather}<br>Temperature: ${temp}°C`;
  } catch (error) {
    resultDiv.textContent = 'Error fetching weather data.';
  }
}
