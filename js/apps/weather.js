// weather.js - Weather: live conditions + 7-day forecast via the free
// Open-Meteo API (no API key needed). City search uses Open-Meteo's
// geocoding API. Remembers the last city in localStorage.

const WeatherApp = (function() {
  const LS_KEY = 'moonos-weather-city';

  // WMO weather codes -> description + emoji
  const CODES = {
    0: ['Clear sky', '☀️'], 1: ['Mainly clear', '🌤️'], 2: ['Partly cloudy', '⛅'],
    3: ['Overcast', '☁️'], 45: ['Foggy', '🌫️'], 48: ['Icy fog', '🌫️'],
    51: ['Light drizzle', '🌦️'], 53: ['Drizzle', '🌦️'], 55: ['Heavy drizzle', '🌧️'],
    56: ['Freezing drizzle', '🌧️'], 57: ['Freezing drizzle', '🌧️'],
    61: ['Light rain', '🌧️'], 63: ['Rain', '🌧️'], 65: ['Heavy rain', '⛈️'],
    66: ['Freezing rain', '🌧️'], 67: ['Freezing rain', '🌧️'],
    71: ['Light snow', '🌨️'], 73: ['Snow', '❄️'], 75: ['Heavy snow', '❄️'],
    77: ['Snow grains', '❄️'], 80: ['Light showers', '🌦️'],
    81: ['Showers', '🌧️'], 82: ['Violent showers', '⛈️'],
    85: ['Light snow showers', '🌨️'], 86: ['Snow showers', '❄️'],
    95: ['Thunderstorm', '⛈️'], 96: ['Storm + hail', '⛈️'], 99: ['Storm + hail', '⛈️']
  };

  function codeInfo(code) {
    return CODES[code] || ['Unknown', '🌡️'];
  }

  function open() {
    WM.createWindow({
      id: 'weather',
      title: 'Weather',
      width: 480,
      height: 560,
      minWidth: 400,
      minHeight: 480,
      iconSvg: '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="4"></circle><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"></path></svg>',
      render: (bodyEl) => {
        initWeather(bodyEl);
      }
    });
  }

  function initWeather(container) {
    container.innerHTML = `
      <div class="weather-app">
        <div class="weather-search-row">
          <input class="weather-search" type="text" placeholder="Search city..." />
          <button class="weather-go">Go</button>
        </div>
        <div class="weather-results"></div>
        <div class="weather-body">
          <div class="weather-empty">Search a city to see live weather.</div>
        </div>
      </div>
    `;

    const searchEl = container.querySelector('.weather-search');
    const goBtn = container.querySelector('.weather-go');
    const resultsEl = container.querySelector('.weather-results');
    const bodyEl = container.querySelector('.weather-body');

    function fmtDay(iso) {
      try {
        return new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
      } catch (e) {
        return iso;
      }
    }

    async function loadWeather(place) {
      bodyEl.innerHTML = '<div class="weather-empty">Loading...</div>';
      const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + place.latitude +
        '&longitude=' + place.longitude +
        '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m' +
        '&daily=weather_code,temperature_2m_max,temperature_2m_min' +
        '&timezone=auto&forecast_days=7';
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        renderWeather(place, d);
        try {
          localStorage.setItem(LS_KEY, JSON.stringify(place));
        } catch (e) {}
      } catch (e) {
        bodyEl.innerHTML = '<div class="weather-empty">Could not load weather. Check your internet.</div>';
      }
    }

    function renderWeather(place, d) {
      const cur = d.current || {};
      const [desc, emoji] = codeInfo(cur.weather_code);
      const daily = d.daily || {};
      const days = (daily.time || []).map((t, i) => {
        const [dd, ee] = codeInfo((daily.weather_code || [])[i]);
        return {
          day: i === 0 ? 'Today' : fmtDay(t),
          emoji: ee, desc: dd,
          max: Math.round((daily.temperature_2m_max || [])[i]),
          min: Math.round((daily.temperature_2m_min || [])[i])
        };
      });

      bodyEl.innerHTML = `
        <div class="weather-now">
          <div class="weather-city">${escapeHtml(place.name)}${place.country ? ', ' + escapeHtml(place.country) : ''}</div>
          <div class="weather-emoji">${emoji}</div>
          <div class="weather-temp">${Math.round(cur.temperature_2m)}°C</div>
          <div class="weather-desc">${desc}</div>
          <div class="weather-meta">
            <span>💧 ${cur.relative_humidity_2m}%</span>
            <span>💨 ${Math.round(cur.wind_speed_10m)} km/h</span>
          </div>
        </div>
        <div class="weather-week">
          ${days.map(x => `
            <div class="weather-day">
              <div class="wd-day">${x.day}</div>
              <div class="wd-emoji">${x.emoji}</div>
              <div class="wd-temp">${x.max}° / ${x.min}°</div>
            </div>`).join('')}
        </div>
      `;
    }

    function escapeHtml(s) {
      return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    async function search(q) {
      q = q.trim();
      if (!q) return;
      resultsEl.innerHTML = '<div class="weather-results-loading">Searching...</div>';
      try {
        const res = await fetch('https://geocoding-api.open-meteo.com/v1/search?name=' +
          encodeURIComponent(q) + '&count=5&language=en&format=json');
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const d = await res.json();
        const list = d.results || [];
        if (list.length === 0) {
          resultsEl.innerHTML = '<div class="weather-results-loading">No cities found.</div>';
          return;
        }
        resultsEl.innerHTML = '';
        list.forEach(p => {
          const b = document.createElement('button');
          b.className = 'weather-result-item';
          b.textContent = p.name + (p.country ? ', ' + p.country : '');
          b.addEventListener('click', () => {
            resultsEl.innerHTML = '';
            searchEl.value = p.name;
            loadWeather(p);
          });
          resultsEl.appendChild(b);
        });
      } catch (e) {
        resultsEl.innerHTML = '<div class="weather-results-loading">Search failed. Check your internet.</div>';
      }
    }

    goBtn.addEventListener('click', () => search(searchEl.value));
    searchEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') search(searchEl.value);
    });

    // restore last city
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && saved.latitude != null) {
        searchEl.value = saved.name || '';
        loadWeather(saved);
      }
    } catch (e) {}
  }

  return { open };
})();

window.WeatherApp = WeatherApp;
