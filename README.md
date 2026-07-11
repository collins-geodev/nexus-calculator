# 🧮 Nexus Calculator

> A next-generation, AI-powered smart calculator with currency conversion, metric conversion, voice commands, and 10 customizable themes — all in a single-page web app.

**🔗 Live Demo:** [nexus-calculator-ten.vercel.app](https://nexus-calculator-ten.vercel.app)

---

## ✨ Features

### 🧮 Smart Calculator (3 modes)
- **Standard** — Arithmetic with memory functions (MC, MR, MS, M+, M-)
- **Scientific** — Trigonometry (sin, cos, tan + inverses), logarithms (log, ln), exponentials (eˣ, 10ˣ), powers, roots (√, ∛), factorial, constants (π, e), DEG/RAD toggle
- **Programmer** — Live HEX / DEC / OCT / BIN display, bitwise operations (AND, OR, XOR, NOT, shifts), base selector

### 💱 Currency Converter
- **75+ currencies** — fiat (USD, EUR, GBP, JPY, CNY, INR, BRL, ZAR, NGN, AED, SAR…), cryptocurrencies (BTC, ETH), and precious metals (Gold, Silver)
- **Live exchange rates** via [open.er-api.com](https://open.er-api.com) (togglable in settings)
- **Popular rates grid** for quick reference
- **Custom presets** — save your most-used pairs
- Swap button with 180° rotation animation

### 📏 Metric Converter
**15 categories, 150+ units:**

| Category | Sample Units |
|----------|--------------|
| Length | mm, cm, m, km, in, ft, yd, mi, nautical mile, light year, AU, parsec, furlong, fathom |
| Weight | mg, g, kg, metric ton, oz, lb, stone, carat, grain, dram, slug, troy oz |
| Temperature | Celsius, Fahrenheit, Kelvin, Rankine, Réaumur |
| Volume | ml, l, m³, US/UK gallon, cup, pint, quart, fl oz, tbsp, tsp, oil barrel |
| Area | mm², cm², m², km², in², ft², yd², mi², hectare, acre, are, rood |
| Speed | m/s, km/h, mph, ft/s, knot, Mach, speed of light |
| Time | ns, µs, ms, s, min, h, day, week, month, year, decade, century, millennium |
| Energy | J, kJ, cal, kcal, Wh, kWh, BTU, ft-lb, eV, erg, therm |
| Pressure | Pa, kPa, MPa, bar, mbar, psi, atm, mmHg, inHg |
| Data | bit, byte, KB, MB, GB, TB, PB, EB, KiB, MiB, GiB, TiB |
| Angle | deg, rad, grad, turn, arcmin, arcsec |
| Frequency | Hz, kHz, MHz, GHz, THz, RPM |
| Power | W, kW, MW, GW, hp, metric hp, BTU/hr, ft-lb/s |
| Fuel Economy | MPG (US/UK), km/L, L/100km |
| Cooking | tsp, tbsp, cup, pint, quart, ml, l, fl oz, dash, pinch |

### 🤖 AI Math Assistant
Natural-language math, conversions, and explanations:
- `"what is 15% of 200"` → percentage
- `"convert 100 USD to EUR"` → currency
- `"how many km in 10 miles"` → unit conversion
- `"area of circle radius 7"` → geometry
- `"average of 45, 67, 89, 23"` → statistics
- `"tip for 85 at 18%"` → utility math
- `"explain quadratic formula"` → concept explanations

### 🎤 Voice Commands
- Web Speech API integration with **10 languages** (English US/UK, Spanish, French, German, Italian, Portuguese BR, Japanese, Korean, Chinese)
- `Ctrl + Space` keyboard shortcut
- Animated listening overlay with ripple effect
- Voice-dispatched to the right mode (math → AI, conversions → AI)

### 🎨 10 Built-in Themes + Custom
**Pre-built:** Dark, Midnight, Cyberpunk, Forest, Ocean, Sunset, Monochrome, Rose, Light, Cream
**Custom:** Pick your own primary, secondary, and background colors via color pickers

### 💾 Custom Presets
- Save unlimited currency conversion presets (`100 USD → EUR`, etc.)
- Save unlimited metric conversion presets across any category
- One-click recall from preset chips
- All stored in `localStorage` — persists across sessions

### ✨ Extras
- **Animated orb background** (3 floating gradient orbs with parallax)
- **Breathing logo** with rotating gradient badge
- **Sound effects** (Web Audio API synthesized tones, togglable)
- **Haptic feedback** on supported devices (navigator.vibrate)
- **History panel** — last 100 calculations, click to recall any result
- **Toast notifications** for user feedback
- **Keyboard shortcuts** for all calculator operations
- **Responsive design** — mobile-first, tablet-optimized, desktop-rich

---

## 🚀 Getting Started

### Run Locally

No build tools required — it's pure HTML/CSS/JS.

```bash
# Clone the repository
git clone https://github.com/collins-geodev/nexus-calculator.git
cd nexus-calculator

# Open directly in your browser
start index.html    # Windows
open index.html     # macOS
xdg-open index.html # Linux
```

Or serve with any static server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000`.

### Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

The project ships with no configuration — Vercel auto-detects it as a static site.

---

## 📁 Project Structure

```
nexus-calculator/
├── index.html       # Main HTML structure (all UI components)
├── styles.css       # All styles, themes, and responsive breakpoints
├── app.js           # Complete app logic (calculator, converters, AI, voice)
└── README.md        # You are here
```

**Single-page app**, no build step, no dependencies — just open it in a browser.

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `0-9` | Input numbers |
| `.` | Decimal point |
| `+` `-` `*` `/` | Operators |
| `Enter` / `=` | Calculate |
| `Backspace` | Delete last digit |
| `Escape` | Clear |
| `%` | Percentage |
| `Ctrl + Space` | Activate voice input |

---

## 📱 Responsive Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| > 1024px | Desktop | Side-by-side panels |
| ≤ 1024px | Tablet landscape | Stacked, scrollable |
| ≤ 900px | Tablet portrait | Single column |
| ≤ 768px | Mobile | Icon+label tabs, bottom-sheet panels |
| ≤ 480px | Small mobile | Stacked converter inputs, 4-col scientific |
| ≤ 360px | Very small | Icon-only tabs, 3-col scientific |

Supports `safe-area-inset` for notched devices (iPhone X+), `100dvh` for mobile viewport handling, and `prefers-reduced-motion` for accessibility.

---

## 🎯 Browser Support

| Browser | Support |
|---------|---------|
| Chrome / Edge (Chromium) | ✅ Full support |
| Firefox | ✅ Full support |
| Safari | ✅ Full support (voice may need permission) |
| Mobile Safari / Chrome | ✅ Full support |

**Voice commands** require a browser implementing the Web Speech API. Chromium-based browsers have the best support.

---

## 🛠️ Tech Stack

- **HTML5** — semantic markup with accessibility hints
- **CSS3** — CSS variables for theming, CSS Grid + Flexbox for layout, CSS animations
- **Vanilla JavaScript (ES2020+)** — no frameworks, no dependencies
- **Web APIs** — Speech Recognition, Web Audio, Vibration, localStorage, Fetch

**Zero dependencies. Zero build step. 100% static.**

---

## 🔐 Privacy

- All calculations run **locally in your browser**
- Presets and settings stored in **your browser's localStorage only**
- Voice recognition uses your browser's built-in Speech API
- Live exchange rates fetched anonymously from `open.er-api.com` (no API key, no tracking)
- **No analytics, no tracking, no accounts**

---

## 📸 Screenshots

### Calculator Mode
Standard, Scientific, and Programmer calculators in a unified interface with 3-mode toggle, live display, and history panel.

### Currency Converter
75+ currencies with flags, live rates toggle, popular rates grid, and saveable presets.

### Metric Converter
15 categories with 150+ units. All-conversions grid shows the input value in every other unit simultaneously.

### AI Assistant
Chat-like interface accepting natural language queries with 8 quick-suggestion chips.

### Theme Panel
10 curated themes + custom color picker for primary, secondary, and background colors.

---

## 🗺️ Roadmap

- [ ] PWA support (service worker + manifest) for offline use
- [ ] Export calculation history as CSV/PDF
- [ ] Graphing mode for function plotting
- [ ] Statistical functions (stdev, variance, regression)
- [ ] More cryptocurrencies and live crypto rates
- [ ] Multi-language UI (not just voice)
- [ ] Shareable calculation links

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome. Feel free to:

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- **Exchange rates:** [open.er-api.com](https://www.exchangerate-api.com) — free, no API key required
- **Fonts:** [Inter](https://rsms.me/inter/) and [JetBrains Mono](https://www.jetbrains.com/lp/mono/) via Google Fonts
- **Icons:** Custom SVG glyphs inspired by [Feather](https://feathericons.com/)
- **Built with:** [Claude Code](https://claude.com/claude-code) by Anthropic

---

**Made with ❤️ and lots of math.**
