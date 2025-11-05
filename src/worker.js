// Polyfill
import { EventEmitter } from 'events';
globalThis.EventEmitter = EventEmitter;

// Polyfill 
import { Buffer } from 'buffer';
globalThis.Buffer = Buffer;

import * as stream from 'stream-browserify';
globalThis.stream = stream;

import { PDFDocument } from 'pdf-lib';

// frontend
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Resume Insight Chat</title>
    <style>
        #chat-box {
            width: 100%;
            height: 300px;
            border: 1px solid #ccc;
            overflow-y: scroll;
            padding: 10px;
            margin-bottom: 20px;
            font-family: Arial, sans-serif;
        }
        .chat-bubble {
            padding: 10px;
            margin: 5px 0;
            border-radius: 8px;
        }
        .user-msg {
            background-color: #e1f5fe;
        }
        .bot-msg {
            background-color: #f1f1f1;
        }
        #user-input {
            width: 100%;
            padding: 10px;
        }
    </style>
</head>
<body>
    <h1>Resume Insight Chat</h1>
    <div id="chat-box"></div>
    <input type="file" id="file-upload" style="display: none;">
    <input type="url" id="job-link" placeholder="Paste the job link here" style="display: none;">
    <button id="upload-btn">Upload Resume</button>
    <button id="job-link-btn">Send Job Link</button>
    <input type="text" id="user-input" placeholder="Type a message..." />
    <button id="send-btn">Send</button>

    <script>
        let resumeText = ''; // Variable to store the extracted resume text
        let jobDescription = ''; // Variable to store the job description

        // Restore memory when page loads
window.addEventListener("load", async () => {
  try {
    const res = await fetch("/get-memory");
    if (res.ok) {
      const { data } = await res.json();
      if (data) {
        addChatBubble("🧠 Restored previous session from memory.", "bot-msg");
        if (data.resumeText) addChatBubble("Previous resume loaded.", "bot-msg");
        if (data.jobDescription) addChatBubble("Previous job description loaded.", "bot-msg");
        if (data.finalAnalysis) addChatBubble(data.finalAnalysis, "bot-msg");
        resumeText = data.resumeText || '';
        jobDescription = data.jobDescription || '';
      }
    }
  } catch (err) {
    console.error("Failed to restore memory:", err);
  }
});
            document.getElementById("upload-btn").addEventListener("click", () => {
            document.getElementById("file-upload").click();
        });

        document.getElementById("job-link-btn").addEventListener("click", () => {
            document.getElementById("job-link").style.display = "block";
        });

        // file upload
        document.getElementById("file-upload").addEventListener("change", async (event) => {
            const file = event.target.files[0];

            if (file) {
                const formData = new FormData();
                formData.append("resume", file);

                const response = await fetch("/upload", {
                    method: "POST",
                    body: formData
                });

                const result = await response.json();
                resumeText = result.resumeText;  

                addChatBubble("Resume uploaded successfully!", "bot-msg");
                addChatBubble(resumeText, "bot-msg");
            }
        });

        // job link input
        document.getElementById("job-link-btn").addEventListener("click", async () => {
            const jobUrl = document.getElementById("job-link").value;
            if (jobUrl) {
                const response = await fetch("/scrape", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ jobUrl })
                });

                const result = await response.json();
                jobDescription = result.jobDescription; 

                addChatBubble("Job description scraped successfully!", "bot-msg");
                addChatBubble(jobDescription, "bot-msg");
            }
        });

        // Triggering Analysis
     document.getElementById("send-btn").addEventListener("click", async () => {
  if (resumeText && jobDescription) {
    const response = await fetch('/process-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resumeText, jobDescription })
    });

    if (!response.ok) {
      addChatBubble("Error: Failed to start AI analysis.", "bot-msg");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");

    addChatBubble("AI is analyzing your resume and job description...", "bot-msg");

    let buffer = "";
let collectingAnalysis = false;
let finalAnalysis = "";

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });

  const lines = buffer.split(/\\r?\\n/);
  buffer = lines.pop(); 

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("AI analysis started")) {
      addChatBubble("AI analysis started...", "bot-msg");
      continue;
    }
    if (trimmed.startsWith("Analyzing resume")) {
      addChatBubble("Analyzing your resume...", "bot-msg");
      continue;
    }
    if (trimmed.startsWith("Analyzing job description")) {
      addChatBubble("Analyzing job description...", "bot-msg");
      continue;
    }

    if (trimmed.startsWith("data:")) {
      const jsonText = trimmed.slice(5).trim();
      if (jsonText === "[DONE]") continue;

      try {
        const parsed = JSON.parse(jsonText);

        if (parsed.response) {
          finalAnalysis += parsed.response;
        }
      } catch (err) {
        console.warn("Bad SSE line:", trimmed);
      }
    }
  }

  // update the chat box in real-time
  if (finalAnalysis) {
    const chatBox = document.getElementById("chat-box");
    const existing = chatBox.querySelector(".streaming-output");

    if (existing) {
      existing.textContent = finalAnalysis;
    } else {
      const bubble = document.createElement("div");
      bubble.classList.add("chat-bubble", "bot-msg", "streaming-output");
      bubble.textContent = finalAnalysis;
      chatBox.appendChild(bubble);
    }

    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

//  After stream ends, finalize output
if (finalAnalysis.trim()) {
  addChatBubble(finalAnalysis.trim(), "bot-msg");
  const existing = document.querySelector(".streaming-output");
  if (existing) existing.remove();
}
try {
    await fetch("/save-memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeText,
        jobDescription,
        finalAnalysis
      })
    });
    console.log("Memory saved successfully!");
  } catch (err) {
    console.error("Failed to save memory:", err);
  }

  } else {
    addChatBubble("Please ensure both resume and job description are provided.", "bot-msg");
  }

  document.getElementById("user-input").value = "";
});


function addChatBubble(message, type) {
  const chatBox = document.getElementById("chat-box");
  const bubble = document.createElement("div");
  bubble.classList.add("chat-bubble", type);
  bubble.textContent = message;
  chatBox.appendChild(bubble);
  chatBox.scrollTop = chatBox.scrollHeight;
}
    </script>
</body>
</html>

`;

class ResumeInsightWorker {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === '/' && request.method === 'GET') {
      return this.serveHtml();
    }
    if (url.pathname === '/upload' && request.method === 'POST') {
      return this.handleResumeUpload(request);
    } else if (url.pathname === '/scrape' && request.method === 'POST') {
      return this.handleJobScraping(request);
    } else if (url.pathname === '/process-analysis' && request.method === 'POST') {
      return this.handleAIAnalysis(request);
    }
    if (url.pathname === "/save-memory" && request.method === "POST") {
    const id = this.env.SESSION_DO.idFromName("global-session");
    const obj = this.env.SESSION_DO.get(id);
    return obj.fetch("https://dummy/save", request);
  }

  if (url.pathname === "/get-memory" && request.method === "GET") {
    const id = this.env.SESSION_DO.idFromName("global-session");
    const obj = this.env.SESSION_DO.get(id);
    return obj.fetch("https://dummy/get");
  }
    return new Response('Not Found', { status: 404 });
  }

  async serveHtml() {
    return new Response(indexHtml, {
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // resume upload (PDF file)
  async handleResumeUpload(request) {
    const formData = await request.formData();
    const resumeFile = formData.get("resume");

    const resumeText = await this.extractTextFromPdf(resumeFile);

    return new Response(JSON.stringify({ message: 'Resume uploaded successfully!', resumeText }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

async  extractTextFromPdf(pdfFile) {
  const pdfBytes = await pdfFile.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const pages = pdfDoc.getPages();
  let text = '';

  for (const page of pages) {
    const { width, height } = page.getSize();

    const pageContent = await page.getContentStream();

    console.log(pageContent);

    // PDF parser has to be implemented but for initial working application, we have added test skills (static)
    const textFromPage = `SKILLS  
Languages & Frameworks: Java, C/C++, Python, HTML/CSS, SQL, React, Flask, Node.js, TensorFlow, RESTful APIs 
Tools: Jira, Git, Trello, SSMS, VM, Figma, Linux, MATLAB, MS Office, Salesforce CRM, Tableau `;
    text += textFromPage + '\n';
  }

  return text;
}


  async handleJobScraping(request) {
    const { jobUrl } = await request.json();
    const jobDescription = await this.scrapeJobDescription(jobUrl);
    return new Response(JSON.stringify({ jobDescription }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  async scrapeJobDescription(jobUrl) {
    // For now, returning mock job description/requirements based on the job URL.
    return `Previous experience as a software engineer intern.

Commercial product software development experience.

Experience with agile development methodologies.

Strong prioritization and problem-solving skills, collaboration skills, verbal and written communication skills, and information research and gathering skills.

Demonstrated analytical and technical skills. Knowledge of basic structured programming, systems analysis and design, database design, and business concepts

`;
  }
 

  async  run(model, input) {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/10bafe56a915c8b24ce715bc667a93ee/ai/run/${model}`,
    {
      headers: { Authorization: "Bearer A8IlP3npfjOUWDQ5f7_pbINLB-YpAaIv8ZOv-qnG" },
      method: "POST",
      body: JSON.stringify({ ...input, stream: true })

    }
  );
  return response.body;
}


async handleAIAnalysis(request) {
  const { resumeText, jobDescription } = await request.json();

  try {
    const chat = `
      Analyze the following resume and job description:
      Resume Text: ${resumeText}
      Job Description: ${jobDescription}

      Provide feedback on missing skills, areas for improvement, and suggest relevant keywords to optimize the resume.
      Be concise and structured with headings.
    `;

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start: async (controller) => {
        controller.enqueue(encoder.encode("AI analysis started...\n"));
        await new Promise(r => setTimeout(r, 1000));
        controller.enqueue(encoder.encode("Analyzing resume...\n"));
        await new Promise(r => setTimeout(r, 1500));
        controller.enqueue(encoder.encode("Analyzing job description...\n"));
        await new Promise(r => setTimeout(r, 1500));

        const response = await fetch(
          "https://api.cloudflare.com/client/v4/accounts/10bafe56a915c8b24ce715bc667a93ee/ai/run/@cf/meta/llama-3-8b-instruct",
          {
            method: "POST",
            headers: {
              "Authorization": "Bearer A8IlP3npfjOUWDQ5f7_pbINLB-YpAaIv8ZOv-qnG",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ prompt: chat, stream: true, max_tokens: 1000 })
          }
        );

        const reader = response.body.getReader();
        controller.enqueue(encoder.encode("Final Analysis:\n"));

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          controller.enqueue(value);
        }

        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "AI Analysis failed: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}


async delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
}

export class MemoryDurableObject {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/save" && request.method === "POST") {
      const data = await request.json();
      await this.state.storage.put("sessionData", data);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (url.pathname === "/get") {
      const data = await this.state.storage.get("sessionData");
      return new Response(JSON.stringify({ data }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Durable Object active");
  }
}

export default {
  async fetch(request, env, ctx) {
    const worker = new ResumeInsightWorker(ctx, env);
    return worker.fetch(request);
  },
};


