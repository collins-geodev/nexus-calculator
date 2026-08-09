# 📱 Android APK Build & Play Store Publishing Guide

This guide shows you **three ways to build an APK**, then walks through publishing on Google Play Store and monetizing the app.

---

## Table of Contents
1. [Method 1: PWA Builder (Easiest — 5 min, no setup)](#method-1-pwa-builder-easiest)
2. [Method 2: Capacitor (Local build, full control)](#method-2-capacitor-local-build)
3. [Method 3: Bubblewrap TWA (Lightweight)](#method-3-bubblewrap-twa)
4. [Installing the APK on your Android device](#installing-the-apk-on-your-device)
5. [Publishing to Google Play Store](#publishing-to-google-play-store)
6. [Monetization Strategies](#monetization-strategies)
7. [Legal Requirements](#legal-requirements)

---

## Method 1: PWA Builder (Easiest)

**Best for:** Getting an APK in 5 minutes with zero local setup. Uses your already-deployed Vercel URL.

### Steps

1. Make sure your app is deployed and publicly accessible (it is: https://nexus-calculator-ten.vercel.app)

2. Go to **https://www.pwabuilder.com**

3. Paste your URL: `https://nexus-calculator-ten.vercel.app` and click **Start**

4. PWA Builder will score your PWA. You should see high scores since we added:
   - ✅ manifest.json
   - ✅ Service Worker (sw.js)
   - ✅ HTTPS (Vercel provides this)
   - ✅ Icons at multiple sizes

5. Click **Package for Stores** → **Android**

6. Configure:
   - **Package ID**: `com.polosoft.nexuscalculator`
   - **App name**: `Nexus Calculator`
   - **App version**: `1.0.0`
   - **Display mode**: `Standalone`
   - **Signing key**: Choose "Create new" (they'll generate one for you) — **IMPORTANT: download and save this keystore, you'll need it forever**

7. Click **Download Package**. You'll get:
   - `app-release-signed.apk` — install this on your phone
   - `app-release-bundle.aab` — upload this to Play Store
   - Signing key (`.keystore` file) — **BACK THIS UP SECURELY**

### Pros
- No local tools needed
- Automatic PWA → TWA wrapper
- Pre-signed for Play Store
- Small APK (~1-2 MB)

### Cons
- Depends on PWA Builder service
- Less customization

---

## Method 2: Capacitor (Local Build)

**Best for:** Full control, offline builds, custom native features.

### Prerequisites

Your Node.js is already set up. You still need:

#### 1. Install JDK 17+

Your current Java is version 8, which is too old. Install JDK 17:

- **Windows (recommended)**: Download [Adoptium Temurin JDK 17](https://adoptium.net/temurin/releases/?version=17) — choose `.msi` installer
- After install, verify: `java -version` should show `17.x.x`

#### 2. Install Android Studio

Android Studio includes the Android SDK, build tools, and emulator.

- Download: https://developer.android.com/studio (~1 GB installer, 3-4 GB installed)
- During setup, accept default SDK components
- Open **SDK Manager** (`Tools` → `SDK Manager`) and install:
  - **Android SDK Platform 34** (or latest)
  - **Android SDK Build-Tools 34.0.0+**
  - **Android SDK Command-line Tools**

#### 3. Set environment variables

Open **System Properties** → **Environment Variables** → **User variables** and add:

| Variable | Value |
|----------|-------|
| `ANDROID_HOME` | `C:\Users\Collins Anyanwu\AppData\Local\Android\Sdk` |
| `JAVA_HOME` | `C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot` |

Then edit `Path` and add:
- `%ANDROID_HOME%\platform-tools`
- `%ANDROID_HOME%\emulator`
- `%ANDROID_HOME%\cmdline-tools\latest\bin`
- `%JAVA_HOME%\bin`

**Restart your terminal** after this.

Verify: `adb --version` and `java -version` should both work.

### First-time setup: add the Android platform & generate the app icon

From the project root, run these once:

```bash
# 1. Build the web assets into www/
npm run build:www

# 2. Create the native Android project (only needed once)
npx cap add android

# 3. Generate the native launcher icon (your ∑ logo) + splash into the project
npm run assets
```

> ⚠️ **Why step 3 matters — this is what makes your logo show on the phone.**
> Capacitor scaffolds `android/` with a **placeholder** launcher icon. Your ∑ logo
> in `icon.svg` and `icons/*.png` is only used by the **web/PWA layer**
> (`manifest.json`) — it is **NOT** the icon Android draws on the home screen.
> `npm run assets` reads the source images in `assets/` (`icon-only.png`,
> `icon-foreground.png`, `icon-background.png`) and writes the real launcher icons —
> including Android 8+ **adaptive icons** — into `android/app/src/main/res/mipmap-*`.
> **If you skip this step, the app installs with the generic default icon.**
>
> Changed the logo? Regenerate the source images first with `npm run assets:source`,
> then re-run `npm run assets`.

### Build the APK

From the project root:

```bash
# 1. Sync web files to Android project (this now also regenerates the icons)
npm run cap:sync

# 2. Build debug APK (unsigned, for testing)
npm run build:apk:debug
```

`npm run cap:sync` runs `npm run assets` at the end, so every build refreshes the
native launcher icon automatically — you don't have to remember it after the
one-time setup above.

Your APK will be at:
```
android\app\build\outputs\apk\debug\app-debug.apk
```

Copy this to your phone and install (see [Installing section](#installing-the-apk-on-your-device)).

### Build a signed release APK for Play Store

#### Generate a signing key (one-time)

```bash
keytool -genkey -v -keystore nexus-release-key.keystore -alias nexus -keyalg RSA -keysize 2048 -validity 10000
```

It will ask for:
- A **keystore password** (remember it!)
- Your name, org, location
- A **key password** (remember it!)

⚠️ **BACK UP THIS KEYSTORE FILE SECURELY.** If you lose it, you can never update your app on Play Store.

#### Configure signing

Create `android/keystore.properties`:

```properties
storeFile=../nexus-release-key.keystore
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=nexus
keyPassword=YOUR_KEY_PASSWORD
```

Edit `android/app/build.gradle`, inside the `android { }` block add:

```gradle
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

signingConfigs {
    release {
        if (keystorePropertiesFile.exists()) {
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile file(keystoreProperties['storeFile'])
            storePassword keystoreProperties['storePassword']
        }
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

Then build:

```bash
npm run build:apk:release   # APK for sideloading
npm run build:bundle        # AAB for Play Store upload
```

Outputs:
- `android/app/build/outputs/apk/release/app-release.apk`
- `android/app/build/outputs/bundle/release/app-release.aab` ← **upload this to Play Store**

---

## Method 3: Bubblewrap TWA

**Best for:** Minimum size, just a thin wrapper over your web app.

```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://nexus-calculator-ten.vercel.app/manifest.json
bubblewrap build
```

Requires Android SDK + JDK 17 (same as Capacitor).

> **Icon note (PWA Builder & Bubblewrap):** these methods build a TWA and take the
> launcher icon from your **`manifest.json`** — specifically the `512x512` entry with
> `"purpose": "maskable"` (`icons/icon-maskable-512.png`). That entry is already in
> the manifest, so make sure your deployed site is serving the latest
> `manifest.json` and icons before you package, then hard-refresh PWA Builder.

---

## Troubleshooting: the app icon shows a default / blank logo

**Symptom:** After installing from the Play Store (or sideloading), the home-screen
icon is the generic Capacitor/Android default instead of your ∑ logo.

**Cause:** On Android the launcher icon is a **native resource**
(`android/app/src/main/res/mipmap-*/ic_launcher*.png` + the adaptive-icon XML in
`mipmap-anydpi-v26/`). It is **not** taken from `icon.svg`, the `icons/` folder, or
`manifest.json` when you build with Capacitor. A freshly-scaffolded `android/` project
ships with a placeholder icon, so if you never generated real icons, that placeholder
is what gets published.

**Fix (Capacitor builds):**

```bash
# from the project root
npm run assets:source   # (re)build the source images in ./assets  — only if you changed the logo
npm run assets          # write native launcher icons into android/app/src/main/res/mipmap-*
npm run cap:sync        # sync (also re-runs `npm run assets`)
```

Then rebuild and re-publish:

```bash
npm run build:bundle    # produces a new app-release.aab to upload to Play Console
```

Verify before publishing — you should see non-placeholder files here:

```
android/app/src/main/res/mipmap-hdpi/ic_launcher.png
android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png
android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml
```

> **Play Store caching:** after you upload a new build with the correct icon, the new
> icon appears once the release is reviewed and rolled out. On a device that already
> has the old build, uninstall and reinstall (or clear the launcher cache) to force the
> new icon to show.

**Fix (PWA Builder / Bubblewrap builds):** confirm `manifest.json` on your live URL
includes the `maskable` 512×512 icon (it does), re-package, and upload the new build.

---

## Installing the APK on your Device

### Option A: Via USB cable
1. Enable **Developer Options** on your phone: Settings → About → tap "Build number" 7 times
2. In Developer Options, enable **USB Debugging**
3. Connect phone via USB, accept the debug prompt on your phone
4. Run:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```

### Option B: Direct install
1. Copy the `.apk` file to your phone (email, Google Drive, USB transfer)
2. On your phone, enable **Install unknown apps** for your file manager (Settings → Apps → Your file manager → Install unknown apps)
3. Open the APK in your file manager and tap Install

---

## Publishing to Google Play Store

### Step 1: Create a Google Play Developer Account

- Go to https://play.google.com/console/signup
- Cost: **$25 one-time fee** (lifetime)
- Required: Government ID, valid payment method
- Approval takes 1-2 days

### Step 2: Prepare store assets

You already have these generated in `icons/`:
- ✅ **High-res icon**: `icons/icon-512.png` (512×512)
- ✅ **Feature graphic**: `icons/feature-graphic-1024x500.png` (1024×500)

You still need:
- **Phone screenshots** (at least 2): 1080×1920 or similar, taken on a real phone or emulator
  - Open your deployed URL on your phone, take screenshots of calculator, currency, metric, AI tabs
- **Short description** (80 chars max)
- **Full description** (4000 chars max)
- **Privacy policy URL** (required — host on GitHub Pages or Vercel)

### Step 3: Create the app listing

1. Play Console → **Create app**
2. Fill in:
   - App name: `Nexus Calculator`
   - Default language: English (US)
   - App or game: App
   - Free or paid: Free (start free, add ads/IAP later)
   - Declarations: accept all policies

3. Complete **App content** sections:
   - Privacy policy
   - Ads declaration (Yes if using AdMob)
   - Content rating (fill questionnaire — yours will be **Everyone**)
   - Target audience
   - News app: No
   - COVID-19 contact tracing: No
   - Data safety form

4. **Store listing**:
   - Short description: `Smart AI calculator with 75+ currencies, 150+ unit conversions, voice, and 10 themes`
   - Full description: (use the README feature list, formatted nicely)
   - Upload screenshots, icon, feature graphic
   - Category: **Tools** or **Productivity**

### Step 4: Upload your AAB

1. Go to **Production** → **Create new release**
2. Upload `app-release.aab`
3. Write release notes (e.g., "Initial release — smart calculator with currency converter, metric converter, voice commands, and AI assistant")
4. Review & **Start rollout to production**

Review takes **3-7 days** for first release.

### Step 5: After approval

Your app will be live at:
```
https://play.google.com/store/apps/details?id=com.polosoft.nexuscalculator
```

---

## Monetization Strategies

### Option 1: Google AdMob (Easiest passive income)

**Revenue model:** Ad impressions + clicks. Typical CPM: $1-$5 (Tier 1 countries).

#### Setup

1. Create AdMob account: https://admob.google.com
2. Add your app, get App ID and Ad Unit IDs
3. Install the Capacitor AdMob plugin:

```bash
npm install @capacitor-community/admob
npx cap sync android
```

4. Add to `app.js`:

```javascript
import { AdMob, BannerAdPosition, BannerAdSize } from '@capacitor-community/admob';

await AdMob.initialize({
    testingDevices: [],
    initializeForTesting: false
});

// Banner ad
await AdMob.showBanner({
    adId: 'YOUR_AD_UNIT_ID',
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0
});

// Interstitial (show occasionally, e.g. every 10 calculations)
await AdMob.prepareInterstitial({ adId: 'YOUR_INTERSTITIAL_AD_ID' });
await AdMob.showInterstitial();

// Rewarded (user watches ad for a benefit)
await AdMob.prepareRewardVideoAd({ adId: 'YOUR_REWARDED_AD_ID' });
await AdMob.showRewardVideoAd();
```

**Best practice:** Don't spam ads. Use banners at the bottom + an interstitial every 20-30 interactions.

**Potential earnings:** 1,000 daily active users × $1 CPM × 10 ad impressions = ~$10/day = ~$300/month. Scales with users.

### Option 2: Freemium (In-App Purchases)

Free tier + Pro tier with premium features.

**Free version:**
- Basic calculator
- Limited conversions per day (e.g., 10)
- 3 themes

**Pro version ($2.99 one-time or $0.99/month):**
- Unlimited conversions
- All 10 themes
- Live exchange rates
- AI assistant
- Remove ads
- Custom presets

#### Setup

```bash
npm install @capacitor-community/in-app-purchases
```

See docs: https://github.com/capacitor-community/in-app-purchases

Google takes **15%** of subscription revenue under $1M/year, 30% above.

### Option 3: One-Time Purchase App

Sell the app for a flat price (e.g. $1.99). No ads, no gates.

**Pros:** Simple, clean UX, upfront revenue
**Cons:** Fewer downloads vs free

On Play Console, switch to "Paid app" during initial listing (cannot change to paid later if you launched free).

### Option 4: Sponsored features

- Partner with a finance brand (e.g., a currency exchange service) to link out from your currency converter
- Affiliate links on rate cards
- Brand-sponsored themes

### Option 5: Donation / Pay What You Want

Add a "Tip the developer" button using Google Play Billing for one-time purchases. Lower revenue but great user relationship.

### Realistic earnings expectations

| Users/mo | Free + AdMob | Freemium (5% conv) | Paid App ($1.99) |
|----------|--------------|--------------------|--------------------|
| 1,000    | $10-30      | $5-50              | $1,400 total once  |
| 10,000   | $100-300    | $50-500            | $14,000            |
| 100,000  | $1k-3k      | $500-5k            | $140,000           |

**Key insight:** Getting to 10k+ organic installs on Play Store requires:
- Good app quality (you have this)
- Keyword-optimized title + description (ASO)
- At least 50+ 5-star reviews
- Consistent updates
- Some marketing (social media, Product Hunt, Reddit)

---

## Legal Requirements

### Privacy Policy (REQUIRED)

Play Store will reject your app without one. Template:

```markdown
# Nexus Calculator Privacy Policy

Last updated: April 2026

Nexus Calculator does not collect, store, or transmit any personal information.

## Data we DON'T collect
- Your name, email, or contact info
- Your calculations or conversion history (stored only on your device)
- Your location
- Any personally identifiable information

## Data stored locally on your device
- App settings (theme, preferences)
- Calculation history
- Conversion presets
All stored in your device's local storage and never sent anywhere.

## Third-party services
- Exchange rates are fetched anonymously from open.er-api.com when you enable live rates
- Voice recognition uses your device's built-in speech API
- Google Play Services for app distribution
- [If using AdMob: Google AdMob may collect advertising IDs for personalized ads. Opt out via device settings.]

## Contact
Email: polosoft.collins@gmail.com
```

Host this at: https://github.com/collins-geodev/nexus-calculator/blob/main/PRIVACY.md (GitHub URL works as privacy policy link).

### Content Rating

For Nexus Calculator, answer the questionnaire honestly:
- No violence, no sexual content, no drugs, no gambling
- Result: **Everyone** rating
- Age: 3+

### Data Safety Form

Declare truthfully:
- No data collected
- No data shared
- App encrypts data in transit (HTTPS)
- Users can delete data via app settings (your Reset All button)

### GDPR / CCPA

Since you don't collect personal data, you're largely compliant by default. If adding AdMob:
- Show a consent banner for EU users (AdMob provides one)
- Add a "Do Not Sell My Info" link for California users

---

## ASO (App Store Optimization) Tips

1. **Title**: Include keywords. "Nexus Calculator - Currency & Units" beats "Nexus Calculator"
2. **Short desc**: Pack keywords. Users see this first.
3. **Full desc**: Use bullets, emojis, headings. First 160 chars are what Google indexes heaviest.
4. **Keywords**: calculator, currency converter, unit converter, scientific calculator, metric converter, voice calculator, AI calculator
5. **Screenshots**: Add text captions showing key features on each
6. **Video**: 30-sec promo video boosts conversion by ~25%
7. **Reviews**: Ask users to rate after 10 successful calculations (not immediately)
8. **Updates**: Release monthly — Play Store rewards active apps

---

## Timeline to first dollar

| Step | Time |
|------|------|
| Build APK via PWA Builder | 5 min |
| Test on your phone | 10 min |
| Sign up for Play Console + pay $25 | 30 min |
| Prepare screenshots + descriptions | 1-2 hours |
| Upload + submit for review | 30 min |
| Google review | 3-7 days |
| App goes live | Day 4-8 |
| First 100 organic installs | Week 2-4 |
| First AdMob payout ($100 threshold) | Month 2-6 |

**Total to launch: ~1 week. Total to first $100: 2-6 months.**

---

## Next Steps for You

1. ✅ **Right now**: Use Method 1 (PWA Builder) to get an APK and install on your phone
2. ✅ **Today**: Sign up for Google Play Console ($25)
3. ✅ **This week**: Take screenshots, write descriptions, upload privacy policy to GitHub
4. ✅ **Next week**: Submit to Play Store
5. ✅ **Month 2**: Add AdMob banner + interstitial
6. ✅ **Month 3+**: Iterate based on reviews, add Pro features, market on Reddit/TikTok/ProductHunt

---

**Questions? Open an issue on the GitHub repo or email polosoft.collins@gmail.com.**

Good luck, and enjoy your app store journey! 🚀
