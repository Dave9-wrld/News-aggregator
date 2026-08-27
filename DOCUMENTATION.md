# NEXA / THE GLOBAL DISPATCH
### Commercial-Grade Global News & Financial Intelligence Aggregator
**Version:** 2.0.0 (Enterprise Commercial Release)  
**Framework:** Next.js 16.3 (Turbopack, App Router) • React 19 • Tailwind CSS v4

---

## 1. Executive Architecture Overview

**The Global Dispatch (Nexa)** is a high-speed, real-time news intelligence aggregator and financial journal. It syndicates dispatches from over 80,000 global sources and wire services, with an automatic multi-tier fallback architecture, built-in semantic AI summarization, neural translation into 9 languages, and hands-free text-to-speech audio narration.

### Key Highlights
- **High-Availability Ingestion Pipeline**: GNews API $\rightarrow$ NewsAPI $\rightarrow$ Google News Live RSS Wire $\rightarrow$ Offline Safety Net.
- **Zero Blank Screen Guarantee**: If an API key hits rate limits or internet connectivity is unstable, the app automatically switches to the next live wire provider without interrupting user experience.
- **AI Executive Briefing Engine**: Automatic 3-point bullet takeaway synthesis, market impact analysis, reading time metrics, and sentiment grading for every article.
- **In-App Neural Translation**: Real-time language translation for 9 world languages (EN, ES, FR, DE, IT, PT, ZH, JA, AR) with Gemini AI & GTX fallback.
- **Text-to-Speech (TTS) Narration**: Built-in voice reader for articles, lead stories, and morning briefings.
- **Smart Editorial Image Engine**: Dynamic keyword-to-topic inference ensuring distinct, high-resolution visuals across all cards.
- **Lossless Article Permalinks**: Dedicated shareable article reader URLs with full metadata preservation.

---

## 2. API Endpoints Architecture (5 Endpoints Explained)

The platform provides **5 specialized Next.js App Router API endpoints**:

### 1. `GET /api/news` (Main News & Search Ingestion Engine)
The core endpoint handling headlines, search queries, publisher filtering, virtual deduplication, and paginated slicing.
* **Query Parameters**:
  * `type` (*string*, optional): `"headlines"` (default) or `"search"`.
  * `q` (*string*, optional): Search query (e.g., `"mbappe"`, `"artificial intelligence"`, `"quantum"`).
  * `category` (*string*, optional): `"general"`, `"technology"`, `"business"`, `"science"`, `"sports"`, `"entertainment"`, `"health"`.
  * `country` (*string*, optional): `"us"`, `"gb"`, `"ca"`, `"au"`.
  * `sources` (*string*, optional): Filter by publisher ID or name (e.g., `"bbc-news"`, `"bloomberg"`).
  * `sortBy` (*string*, optional): `"publishedAt"` (newest), `"relevancy"`, `"popularity"`.
  * `page` (*number*, default: `1`): Virtual pagination page number.
  * `pageSize` (*number*, default: `15`): Batch size per slice.
* **Response Payload**:
  ```json
  {
    "status": "ok",
    "source": "gnews", // "gnews" | "newsapi" | "global_wire" | "curated_fallback"
    "totalResults": 45,
    "page": 1,
    "pageSize": 15,
    "hasMore": true,
    "articles": [
      {
        "source": { "id": "bloomberg", "name": "Bloomberg" },
        "author": "Claire Ballentine",
        "title": "Global Central Banks Issue Unified Guidance...",
        "description": "Equities surged across Tokyo, London, and Wall Street...",
        "url": "https://bloomberg.com/...",
        "urlToImage": "https://images.unsplash.com/...",
        "publishedAt": "2026-08-20T08:30:00.000Z",
        "content": "...",
        "category": "business",
        "sentiment": "positive",
        "sentimentLabel": "Bullish / Positive",
        "tag": "Finance",
        "readTime": "3m read"
      }
    ]
  }
  ```

---

### 2. `GET /api/news/headlines` (Headlines Alias Wrapper)
A streamlined convenience endpoint tailored specifically for top breaking world headlines.
* **Behavior**: Forwards requests to `/api/news` with `type=headlines` pre-configured.

---

### 3. `GET /api/news/search` (Search Query Wrapper)
A dedicated endpoint optimized for external search integrations or query-first clients.
* **Behavior**: Forwards requests to `/api/news` with `type=search` pre-configured.

---

### 4. `GET /api/news/sources` (Publishers & Outlets Directory)
Returns a list of top verified international publishers and editorial outlets categorized by domain.
* **Response Payload**:
  ```json
  {
    "status": "ok",
    "source": "curated",
    "sources": [
      { "id": "reuters", "name": "Reuters", "category": "general" },
      { "id": "bloomberg", "name": "Bloomberg", "category": "business" },
      { "id": "techcrunch", "name": "TechCrunch", "category": "technology" }
    ]
  }
  ```

---

### 5. `POST /api/summary` (AI Executive Intelligence & Key Takeaways)
Generates structured bullet-point executive intelligence, market impact, sentiment score, and reading metrics for any news article.
* **Request Body**:
  ```json
  {
    "title": "Next-Gen Quantum Computing Architecture Sustains Millisecond Coherence",
    "description": "Researchers announce 10x improvement in qubit stability...",
    "content": "Researchers at leading institutions have unveiled...",
    "source": { "name": "TechCrunch" },
    "category": "technology"
  }
  ```
* **Response Payload**:
  ```json
  {
    "status": "ok",
    "summary": {
      "takeaways": [
        "Core Event: Next-Gen Quantum Computing Architecture Sustains Millisecond Coherence.",
        "Context: Researchers announce 10x improvement in qubit stability...",
        "Strategic Outlook: Accelerates sector competitiveness and signals rapid transition toward commercial automated architectures."
      ],
      "marketImpact": "High relevance for enterprise infrastructure, venture capital allocation, and developer ecosystems.",
      "sentiment": {
        "tone": "Positive",
        "score": "+84%",
        "color": "emerald"
      },
      "metrics": {
        "totalWords": 48,
        "fastSummarySeconds": "15 sec overview",
        "fullReadMinutes": "1 min read"
      },
      "generatedAt": "2026-08-20T09:00:00.000Z"
    }
  }
  ```

---

### 6. `POST /api/translate` (Universal Multi-Language Neural Translator)
Translates headlines, descriptions, and full article text into 9 supported global languages with automated source language detection.
* **Request Body**:
  ```json
  {
    "title": "El Real Madrid celebra la victoria con gol de Mbappé",
    "description": "El delantero francés brilló en el partido de anoche.",
    "targetLang": "en"
  }
  ```
* **Supported `targetLang` codes**:
  * `"en"`: English
  * `"es"`: Spanish (Español)
  * `"fr"`: French (Français)
  * `"de"`: German (Deutsch)
  * `"it"`: Italian (Italiano)
  * `"pt"`: Portuguese (Português)
  * `"zh-CN"`: Chinese (中文)
  * `"ja"`: Japanese (日本語)
  * `"ar"`: Arabic (العربية)
* **Response Payload**:
  ```json
  {
    "status": "ok",
    "targetLang": "en",
    "translatedTitle": "Real Madrid celebrates the victory with a goal from Mbappé",
    "translatedDescription": "The French striker shone in last night's game.",
    "translatedContent": ""
  }
  ```

---

## 3. Directory Structure & Key Files

```text
nexa/
├── app/
│   ├── api/
│   │   ├── news/
│   │   │   ├── headlines/route.js   # Fast headlines wrapper
│   │   │   ├── search/route.js      # Fast search wrapper
│   │   │   ├── sources/route.js     # Sources directory endpoint
│   │   │   └── route.js             # Main news ingestion & pagination pipeline
│   │   ├── summary/
│   │   │   └── route.js             # AI Executive intelligence & takeaways API
│   │   └── translate/
│   │       └── route.js             # Neural multi-language translation API
│   ├── globals.css                  # Global styles, fonts, and dark theme
│   ├── layout.js                    # HTML root layout & typography configuration
│   └── page.js                      # Main newspaper frontend interface
├── components/
│   ├── ArticleModal.jsx             # Smart Executive Reader with AI & Translator
│   ├── BookmarksDrawer.jsx          # Reading list with live search & JSON export
│   ├── BriefingDrawer.jsx           # Daily Morning Intelligence Briefing compiler
│   ├── CategoryBar.jsx              # Topic tabs, source filter, sorting controls
│   ├── Footer.jsx                   # Newspaper footer & syndication notes
│   ├── HeroFeatured.jsx             # Lead story banner with audio narration
│   ├── LoadingSkeleton.jsx          # Responsive animated loading state
│   ├── Navbar.jsx                   # Newspaper masthead, search, and edition selector
│   └── NewsCard.jsx                 # Grid article cards with sentiment & read-time
├── lib/
│   ├── imageUtils.js                # Topic photo pools & dynamic fallback engine
│   ├── mockNews.js                  # Emergency offline safety net data
│   └── rssNews.js                   # High-speed Google News RSS wire engine
├── .env.local                       # Environment variables (API keys)
├── next.config.mjs                  # Next.js configuration & image remote patterns
├── package.json                     # Dependencies and build scripts
└── README.md                        # Quick start guide
```

---

## 4. Environment Configuration (`.env.local`)

```env
# Primary API Provider (Optional, free tier supported)
GNEWS_API_KEY=your_gnews_api_key_here

# Secondary API Provider (Optional, free tier supported)
NEWS_API_KEY=your_news_api_key_here

# Tertiary Provider (Optional)
CURRENTS_API_KEY=

# Branding
NEXT_PUBLIC_SITE_NAME=THE GLOBAL DISPATCH
```
> *Note: If no API keys are provided, the platform automatically utilizes its high-speed Google News Live RSS Engine with zero downtime.*

---

## 5. Development & Deployment

### Run Locally:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### Build for Production:
```bash
npm run build
npm run start
```

### Deploy to Vercel:
1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add your environment variables in the Vercel project settings.
4. Deploy with 1 click.
