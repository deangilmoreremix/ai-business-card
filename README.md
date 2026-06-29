# 📇 CardAI Creator — Open-Source AI Digital Business Card Generator

> **Design, share, and chat through interactive digital business cards in seconds.** A production-ready Next.js app with 7 premium templates, AI-styled custom layouts (powered by **OpenAI Responses API**), QR sharing, a visitor-facing AI chatbot, **vCard export**, and **built-in analytics**. Self-hostable, no authentication required.

**Tech stack:** Next.js 16 (App Router) · Supabase (PostgreSQL) · OpenAI Responses API · Tailwind CSS · QRCode · MuAPI (optional fallback)

**Use cases:** Networking events · Conference badges · Sales rep cards · Real estate agent cards · Freelancer portfolios · Creator landing pages · Lead capture pages · QR vCard sharing · Personal branding

---

## 🌐 Project Details

**Live Demo Preview:** `https://your-app.netlify.app`

---

CardAI Creator lets anyone create interactive digital business cards. It features a modern layout designer, real-time preview, QR code sharing, a visual cards dashboard, and a floating AI chatbot widget that lets visitors ask questions about the card owner.

**Why use CardAI Creator?**

- **No Sign-up Required** — Jump straight in and build cards. Everything is public.
- **AI Custom Layouts** — Enter prompts like *"make this look retro cyberpunk"* and OpenAI generates custom HTML/Tailwind styling.
- **Interactive AI Clone Assistant** — Every shared card has a chatbot widget. Visitors can ask questions (e.g. *"What is her email?"*) answered by the card's profile via OpenAI.
- **OpenAI Responses API** — All AI features use OpenAI's Responses API, with structured prompts and conversation memory.
- **AI Bio Enhancer & Title Suggester** — Quick in-form actions to polish your copy using OpenAI.
- **vCard Export** — Download a `.vcf` file to import the contact into any phone book.
- **QR Code Sharing** — Automatic QR codes point directly to the card's public URL.
- **View Analytics** — Track how many people have visited each card.
- **7 Premium Pre-designed Styles** — Neumorphism, Cyberpunk Glitch, Holographic Glassmorphism, Interactive 3D Tilt, Swiss International Style, Classic Minimal, and Brutalist Marquee.
- **Split Save Protections** — When editing an existing card, users can **Save Changes** or **Save as New Copy**.

---

## ✨ Core Features

### 🧠 AI Card Customizer (OpenAI Responses API)
- Enter a style prompt. OpenAI generates a custom HTML/CSS card design tailored to your profile.
- Asynchronous polling displays progress while OpenAI crafts the design.

### 🤖 Visitor AI Clone Chatbot
- Visitors viewing `/card/[hash]` can open a floating chat drawer.
- Powered by OpenAI Responses API with conversation history for context-aware replies.
- Chat history is persisted in Supabase.

### ✍️ AI Bio Enhancer & Title Suggester
- One-click buttons inside the editor to refine your bio or suggest a job title using OpenAI.

### 📂 My Cards Dashboard (`/my-cards`)
- Visual grid of all saved cards.
- Quick actions: Edit, View, Delete, Copy Link, Show QR Code, Download vCard.
- Per-card analytics (view count).

### 📱 Responsive Previews
- Left sidebar for form parameters.
- Center live viewport with mobile-device iframe.
- Three-tab mobile layout (Edit / Preview / Share).

### 📇 vCard Export (`/api/vcard`)
- Download a standards-compliant `.vcf` file to add the contact to any device.

### 📊 View Analytics
- Supabase tracks each visit and aggregates per-card counts on the dashboard.

---

## 🔑 Required Environment Variables

Configure these keys in your local `.env` or in the Netlify dashboard:

| Category              | Variable                             | Purpose & Source                                                                             |
| :-------------------- | :----------------------------------- | :------------------------------------------------------------------------------------------- |
| **Supabase**          | `NEXT_PUBLIC_SUPABASE_URL`           | Your Supabase project URL                                                                    |
|                       | `NEXT_PUBLIC_SUPABASE_ANON_KEY`      | Public anon key                                                                              |
|                       | `SUPABASE_SERVICE_ROLE_KEY`          | Service role key (server-only)                                                               |
| **OpenAI**            | `OPENAI_API_KEY`                     | OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)             |
| **MuAPI (optional)**  | `MUAPIAPP_API_KEY`                   | Optional fallback for AI generation                                                          |
| **App**               | `NEXT_PUBLIC_APP_URL`                | Public URL of the deployment (e.g. `https://your-app.netlify.app`)                            |

---

## 🛠️ Local Development & Launch

### Prerequisites
- Node.js 18+
- A Supabase project (free tier works)

### Step-by-step Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Supabase + OpenAI credentials
   ```

3. **Create the Supabase tables**
   - Open the Supabase SQL Editor for your project.
   - Paste & run the SQL in `supabase-schema.sql`.

4. **Create a Storage bucket (optional, for avatars)**
   - In Supabase: Storage → New bucket → name: `card-avatars` → Public.

5. **Start the dev server**
   ```bash
   npm run dev
   # Runs locally on http://localhost:3000
   ```

6. **Build for production**
   ```bash
   npm run build
   ```

---

## 🚀 Deploy to Netlify

1. Push the repo to GitHub/GitLab.
2. Connect the repo in [Netlify](https://app.netlify.com/).
3. Netlify auto-detects the `netlify.toml` and installs `@netlify/plugin-nextjs`.
4. Add the environment variables from `.env.example` in **Site settings → Environment variables**.
5. Deploy. The first build installs the Next.js plugin and configures the Netlify adapter.

---

## 🧩 OpenAI Responses API — Features We Use

The OpenAI Responses API powers all AI features in this app:

| Feature | Endpoint / Method | Inputs |
|---------|-------------------|--------|
| Card HTML generation | `openai.responses.create()` | Profile context + style prompt |
| Chatbot replies | `openai.responses.create()` | Card profile + chat history + visitor query |
| Bio enhancement | `openai.responses.create()` | Short bio + profession |
| Title suggestion | `openai.responses.create()` | Bio / company description |

### Possible Enhancements with the Responses API
- **Streaming chat replies** — Use the streaming variant to token-stream chatbot responses for a snappier UX.
- **Structured JSON outputs** — Force the AI to return strict JSON (e.g. card color palette, layout config).
- **Vision** — Use GPT-4o vision to analyze uploaded profile photos and suggest crops, filters, or backgrounds.
- **Function calling** — Connect the chatbot to live actions like scheduling meetings, sending emails, or adding contacts.
- **Web search tool** — When a visitor asks about the person's recent work, allow the chatbot to fetch live web results.
- **File inputs** — Allow users to upload their resume / portfolio as context for the AI chatbot.
- **Built-in tools** — Use code interpreter to render in-browser previews from a single design prompt.