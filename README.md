# 💬 Resume Insight Chat — Cloudflare AI App

This project analyzes resumes and job descriptions using **Cloudflare Workers AI** and provides **real-time feedback** about missing skills, improvement areas, and keyword suggestions.  
Built as part of the **Cloudflare AI App Assignment**.

---

## 🎥 Demo
Watch the demo here:  
👉 [Demo Recording](Demo-Recording.mp4)

🌐 **Live Deployed App:**  
👉 [https://resume-insight.jkauser.workers.dev/](https://resume-insight.jkauser.workers.dev/)

---

## 🧠 Overview

**Resume Insight Chat** is an interactive AI-powered application that helps users optimize their resumes for specific job postings.  
Users upload their resume and paste a job link — the app uses Cloudflare’s **Llama 3.3 (via Workers AI)** model to generate tailored insights in real time.

---

## 🧩 Components (Required for Cloudflare AI Assignment)

| Component | Implementation | Description |
|------------|----------------|--------------|
| **LLM** | `@cf/meta/llama-3-8b-instruct` | Cloudflare-hosted Large Language Model analyzes resume-job fit. |
| **Workflow / Coordination** | Cloudflare **Worker** | Orchestrates PDF upload, job scraping, AI call, and streaming output. |
| **User Input via Chat** | HTML + JS frontend | Users upload resume files, enter job links, and interact through a simple chat UI. |
| **Memory / State** | Cloudflare **Durable Object (SQLite)** | Stores session data (resume, job, AI feedback) and restores it on reload. |

✅ Meets all **4 Cloudflare AI assignment requirements.**

---

## 🧠 Features
- **AI Resume Analysis** with Cloudflare `@cf/meta/llama-3-8b-instruct`
- **Streaming Output** — token-by-token real-time analysis
- **Durable Object Memory** — saves and restores session automatically
- **Frontend Chat UI** — upload a resume, paste a job link, and chat with AI

---

## ⚙️ Tech Stack
- **Cloudflare Workers** (Backend & Routing)
- **Cloudflare Workers AI** (LLM Inference)
- **Cloudflare Durable Objects (SQLite)** (Session Persistence)
- **HTML, CSS, and Vanilla JavaScript** (Frontend UI)

---

## 🧩 Local Development

### Prerequisites
- Node.js v18+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)  
  *(install via `npm install -g wrangler`)*

### Run Locally
```bash
# Install dependencies
npm install

# Build
npm run build

# Run locally
npx wrangler dev
