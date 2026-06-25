# 🌐 CivicHero: Urban Infrastructure & Community Ledger

Welcome to the comprehensive technical documentation for **CivicHero**—a full-stack, real-time community engagement platform designed to report, verify, resolve, and co-fund neighborhood issues. 

Built with **React 19**, **Vite**, **Express**, **Tailwind CSS v4**, and **Drizzle ORM** backed by **PostgreSQL (Cloud SQL)**, CivicHero features modern real-time WebSockets, dynamic micro-missions, and smart AI inspection powered by the **Google Gemini API** (`gemini-3.5-flash`).

---

## 🗺️ System Architecture & File Structure

The application is structured into a full-stack monorepo featuring a server-side Express backend and a client-side React SPA, designed for optimal modularity and separation of concerns.

```
├── .env.example                # Example configuration of secret variables (GEMINI_API_KEY)
├── package.json                # Project dependencies, dev-dependencies, build and runtime scripts
├── tsconfig.json               # TypeScript path mapping and type safety constraints
├── vite.config.ts              # Vite configurations integrating React and Tailwind CSS v4 plugins
├── server.ts                   # Unified entry-point for Express, static production serving, and Vite middlewares
│
├── server/                     # Backend Source Code
│   ├── analyzer.ts             # Google GenAI SDK wrapper conducting smart visual issue analysis
│   ├── db.ts                   # Mock server-side database fallbacks & memory data configurations
│   ├── routes.ts               # Primary backend router mapping API modules
│   ├── ws.ts                   # WebSocket server broadcasting live updates (e.g. report alerts, issue updates)
│   └── routes/                 # Endpoint-specific Route Controllers
│       ├── auth.ts             # Handlers for user synchronization, session mapping, and profile editing
│       ├── issues.ts           # Handlers for submitting, verifying, resolving, and co-funding issues
│       ├── missions.ts         # Handlers for accepting, updating, and claiming community missions
│       └── users.ts            # Handlers for leaderboard queries, statistics, and user profiles
│
└── src/                        # Frontend React Source Code
    ├── main.tsx                # Client application bootstrap and style imports
    ├── App.tsx                 # Core Dashboard Shell, handles active theme selection, tabs, and socket sync
    ├── index.css               # Global CSS entry importing Tailwind v4 and Custom Font pairings
    ├── types.ts                # Unified TypeScript type declarations for users, issues, and missions
    │
    ├── components/             # Reusable UI & Widget Modules
    │   ├── AuthScreen.tsx      # Sign-In/Register overlay with credential syncing to local state
    │   ├── InteractiveMap.tsx  # Leaflet interactive map rendering issue status layers and live pin plotting
    │   ├── IssueDetailsModal.tsx # Full modal for issue assessment, verification, volunteering, and funding
    │   ├── IssueReportForm.tsx # Coordinate-aware report sidebar supporting image upload and description
    │   ├── Leaderboard.tsx     # Neomorphic competitive community ranking board sorted by XP
    │   ├── Placeholders.tsx    # Widget displaying accepted, active, and available weekly civic micro-missions
    │   ├── ProfileView.tsx     # Profile page with level indicators and GitHub-style contribution heatmap
    │   └── StatsDashboard.tsx  # Analytical view displaying responsive Recharts charts (D3 under the hood)
    │
    ├── db/                     # Database schemas and Drizzle connection pool
    │   ├── drizzle.config.ts   # Configuration detailing database migration folders and credentials
    │   ├── index.ts            # PostgreSQL pooled connection pooling layer utilizing 'pg' and Drizzle
    │   ├── schema.ts           # Schema models (users, issues, verifications, user_missions, user_fundings)
    │   ├── seed.ts             # Seeds mock community issues, credentials, and verification histories
    │   ├── users.ts            # Persistent user queries, profile creation, and sync transactions
    │   └── issues.ts           # Primary business operations (reporting, co-funding, calculations, levels)
    │
    └── middleware/             # Route guards and gated session validation
        └── auth.ts             # Express authentication middleware validating Bearer auth tokens
```

---

## 💾 Database Schema & Relationships (`/src/db/schema.ts`)

CivicHero runs on a structured relational schema built using Drizzle ORM.

```
       ┌──────────────────────┐             ┌───────────────────────┐
       │        users         │             │        issues         │
       ├──────────────────────┤             ├───────────────────────┤
       │ uid (PK - text)      │             │ id (PK - serial)      │
       │ displayName (text)   │             │ title (text)          │
       │ email (text)         │             │ description (text)    │
       │ points (integer)     │             │ status (text)         │
       │ level (integer)      │             │ reporterId (FK) ──────┼──┐
       │ impactScore (integer)│             │ verifiedCount(integer)│  │
       │ reportedCount(integer)             │ fundingGoal (integer) │  │
       │ verifiedCount(integer)             │ fundingCurrent(integer)  │
       │ resolvedCount(integer)             │ latitude/longitude    │  │
       │ fundingTotal(integer)│             │ resolvedAt (timestamp)│  │
       │ contributions(jsonb) │             └───────────────────────┘  │
       └─────┬──────────┬─────┘                                        │
             │          │                                              │
             │          │            ┌──────────────────────┐          │
             │          │            │    verifications     │          │
             │          │            ├──────────────────────┤          │
             │          └───────────►│ id (PK - serial)     │          │
             │                       │ issueId (FK)  ───────┼──────────┘
             │                       │ userId (FK)          │
             └───────────┐           └──────────────────────┘
                         │
             ┌───────────▼──────────┐       ┌──────────────────────┐
             │    user_fundings     │       │    user_missions     │
             ├──────────────────────┤       ├──────────────────────┤
             │ id (PK - serial)     │       │ id (PK - serial)     │
             │ userId (FK)          │       │ userId (FK)          │
             │ issueId (FK)         │       │ missionId (text)     │
             │ amount (integer)     │       │ status (text)        │
             │ createdAt (timestamp)│       │ progress (integer)   │
             └──────────────────────┘       └──────────────────────┘
```

### Table Definitions

1. **`users`**:
   - Tracks a citizen's profile and credentials.
   - Computes dynamic level thresholds (`level`, `points`, `impactScore`).
   - Counts completed transactions (`reportedCount`, `verifiedCount`, `resolvedCount`).
   - Accumulates financial support (`fundingTotal`).
   - Houses `contributions` as a JSONB heatmap of dates mapped to activity frequency (`{ "YYYY-MM-DD": number }`).

2. **`issues`**:
   - Models the core community tickets.
   - Includes geolocation coordinates (`latitude`, `longitude`), `address`, `imageUrl`, and tracking statuses (`reported` | `verified` | `resolved`).
   - Tracks crowdfunding dynamics (`fundingGoal`, `fundingCurrent`).

3. **`verifications`**:
   - Logs unique endorsements. Represents a high-trust verification that prevents double-voting by linking `userId` to `issueId`.

4. **`userMissions`**:
   - Maps users to their active and completed weekly civic challenges, updating their individual progression.

5. **`userFundings`**:
   - Stores granular transactional histories. Connects crowdfunding contributions from a user to a specific urban issue.

---

## ⚙️ Core Business Logic & Function Flows

### 1. Reputation Points, Level, & Impact Calculations
Reputation XP and levels are computed dynamically via `recalculateUserStats` in `/src/db/issues.ts`. Whenever a user takes an action, their stats are updated based on weighted metrics:

$$\text{Points (XP)} = (\text{Reports} \times 10) + (\text{Verifications} \times 5) + (\text{Resolutions} \times 50) + \text{Mission Bonuses} + \text{FundingTotal}$$

$$\text{Level} = \left\lfloor \frac{\text{Points}}{100} \right\rfloor + 1$$

$$\text{Impact Score} = \text{Round}(\text{Points} \times 0.35 + \text{Resolutions} \times 25)$$

*   **Flow**: Action occurs $\rightarrow$ Drizzle queries aggregate user metadata $\rightarrow$ Math is applied $\rightarrow$ Dynamic levels are pushed back to the DB $\rightarrow$ Profile and Leaderboard component updates over sockets.
*   *Note*: **Crowdfunding now rewards XP!** For every **$1** a user contributes towards any issue campaign, they receive **1 XP** directly towards their level progression.

---

### 2. Smart AI Assessment (Gemini 3.5 Flash)
When users select coordinates on the map and submit an image, the backend runs an automated AI triage loop.

```
[Reporter Uploads Photo]
       │
       ▼
[Express Router: POST /api/issues/analyze]
       │
       ▼
[Check GEMINI_API_KEY]
       ├── (Missing) ──► [Local Heuristic Rule Engine] ─────────────────┐
       └── (Present) ──► [Google GenAI SDK: Models.GenerateContent]    │
                               │                                        │
                               ▼                                        ▼
                  Sends Image Base64 + Prompt             Returns Best-Guess Category,
                  Requesting Application/JSON             Severity, and Summary
                               │                                        │
                               ▼                                        │
                  [Gemini 3.5 Flash Inspector]                          │
                  Resolves Category, Severity, Summary                 │
                               │                                        │
                               ▼                                        ▼
                      [Parse Structured Output] ◄───────────────────────┘
                               │
                               ▼
            [Autofills Forms & Previews Client-Side UI]
```

---

### 3. Co-Funding Transactional Flow
Crowdfunding allows community backing to expedite community repairs:

```
[User Selects Issue] ──► [Enters $ Amount] ──► [Clicks Contribute]
                                                      │
                                                      ▼
                                         [POST /api/issues/:id/fund]
                                                      │
                                                      ▼
                                         [Check Authentication Token]
                                                      │
                                                      ▼
                                            [Drizzle Database]
                                  • Update issue.fundingCurrent (capped)
                                  • Insert transaction log into userFundings
                                  • Increment user.fundingTotal by amount
                                  • Update user.contributions activity date
                                                      │
                                                      ▼
                                        [Recalculate Level & Stats]
                                  • Recalculates Points (Adds +1 XP per $1)
                                  • Recalculates Levels and Impact Score
                                                      │
                                                      ▼
                                      [Real-Time WebSocket Broadcast]
                                  • Emits 'issue_updated' event to all
                                  • Live updates map pins and progress bars
```

---

## 🌐 Complete REST API Blueprint

All routes are mounted under `/api` in `server.ts`. Routes using `requireAuth` validate session JSON Web Tokens (JWT) inside their authorization headers (`Authorization: Bearer <token>`).

### 🔑 Authentication & Profiles (`/server/routes/auth.ts`)
*   **`POST /api/auth/sync`** (Protected):
    - **Flow**: Compares incoming user session credentials with the PostgreSQL state. If the profile doesn't exist, it creates a new database entry with default values and returns the synced record.
*   **`GET /api/auth/me`** (Protected):
    - **Flow**: Fetches the authenticated user's profile metadata including points, level, counts, and their contributions heatmap representation.
*   **`PUT /api/auth/profile`** (Protected):
    - **Flow**: Edits profile attributes such as `displayName` or `photoUrl`.

### 🚨 Civic Issues (`/server/routes/issues.ts`)
*   **`GET /api/issues`**:
    - **Flow**: Returns all issues currently logged in the neighborhood directory, including their coordinates, statuses, image URLs, and crowdfunding milestones.
*   **`POST /api/issues/analyze`**:
    - **Flow**: Proxies the base64-encoded snapshot and description to the **Gemini 3.5 Flash** visual model. Returns structured JSON containing a verified category, severity label, and descriptive summary.
*   **`POST /api/issues`**:
    - **Flow**: Commits a new issue report to the PostgreSQL database. Triggers a real-time event broadcasting the new report to all open map clients.
*   **`POST /api/issues/:id/verify`**:
    - **Flow**: Attaches a verification endorsement log to an issue. Increments the verified counter, awards the verifying citizen +5 XP, updates mission progression, and recalculates level tiers.
*   **`POST /api/issues/:id/resolve`**:
    - **Flow**: Marks a community issue as officially "resolved". Sets a completion timestamp (`resolvedAt`), increments the resolver's resolution metrics, awards +50 XP, updates active missions, and triggers a real-time socket refresh.
*   **`POST /api/issues/:id/volunteer`**:
    - **Flow**: Registers an authenticated user as an active community volunteer for a specific neighborhood issue.
*   **`POST /api/issues/:id/fund`** (Protected):
    - **Flow**: Backs an issue with crowdfunding. Dynamically adjusts the issue's pooled current funds, updates the user's total contributed ledger, logs the transaction, increments the user's daily contribution count, and rewards **+1 XP per $1 contributed**.

### 🏆 Community Micro-Missions (`/server/routes/missions.ts`)
*   **`GET /api/missions`** (Protected):
    - **Flow**: Returns static community challenges (e.g., *Streetlight Watch*, *Clean Entrance*, *First Responder*) along with the user's real-time progression statistics queried from database history logs.
*   **`POST /api/missions/:missionId/accept`** (Protected):
    - **Flow**: Officially registers and instantiates a community challenge, setting its tracking progression to active.
*   **`POST /api/missions/:missionId/claim`** (Protected):
    - **Flow**: Verifies that a user has successfully completed a community mission's criteria. Updates its status to 'completed', registers completion points, awards bonus XP, and triggers a full profile recalibration.

### 📊 Citizens & Statistics (`/server/routes/users.ts`)
*   **`GET /api/users`**:
    - **Flow**: Returns list of registered citizens.
*   **`GET /api/users/leaderboard`**:
    - **Flow**: Queries and returns top citizens ranked by their total accumulated reputation XP.
*   **`GET /api/users/stats`**:
    - **Flow**: Performs statistical counts (e.g., ratio of issues resolved, severity distribution) returning aggregated charts ready for Recharts compilation.
*   **`GET /api/users/:id`**:
    - **Flow**: Returns detailed profiling metrics for a specific neighborhood citizen.

---

## 🛠️ Technology Stack & Libraries

### Backend
-   **Node.js & Express**: Extensible runtime and router handling low-latency HTTP queries.
-   **TypeScript**: Type-safe development with native compilation via `tsx` (dev) and `esbuild` (production bundling).
-   **Drizzle ORM & PostgreSQL**: High-performance SQL queries, schema-mapping, and connection pooling.
-   **Google GenAI SDK (`@google/genai`)**: Integrates advanced vision-language models for smart visual categorization.
-   **WebSockets (`ws`)**: Broadcasts dynamic real-time updates (like new reports, verifications, and resolutions) across connected clients.

### Frontend
-   **React 19 & Vite**: Ultra-fast hot-reloading rendering pipeline and modular components.
-   **Tailwind CSS v4**: Utility-first CSS compiling highly optimized UI styles.
-   -   **Leaflet**: Leverages open-source maps for coordinate plotting, custom icon layers, and live navigation.
-   -   **Recharts**: Formulates clean community dashboard visual statistics.
-   -   **Framer Motion (`motion/react`)**: Renders smooth, delightful micro-animations, transitions, and tab switches.
-   -   **Lucide React**: Clean and elegant modern icon sets.

---

## 🚀 Getting Started & Local Development

### Prerequisites
Make sure you have [Node.js](https://nodejs.org) installed on your system.

### Installation
1.  Clone or export your project repository and navigate into the root directory.
2.  Install all packages:
    ```bash
    npm install
    ```
3.  Set up your environment. Copy `.env.example` to `.env` or `.env.local` and configure your Gemini API Key:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

### Running the App
-   **Development Mode**:
    Starts the full-stack server with hot reload and asset-compiling.
    ```bash
    npm run dev
    ```
    Open your browser and visit `http://localhost:3000`.

-   **Production Build & Run**:
    Compiles the frontend files into static files, bundles the server entry points with esbuild, and runs the compiled CommonJS server:
    ```bash
    npm run build
    npm start
    ```
