import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";
import config from "@/lib/config";
import { CardService } from "./cards";

const openaiClient = () => {
  if (!config.openai.apiKey || config.openai.apiKey.includes("your_")) {
    return null;
  }
  return new OpenAI({ apiKey: config.openai.apiKey });
};

function buildProfileContext(card) {
  let socials = {};
  try {
    socials = typeof card.socialLinks === "string"
      ? JSON.parse(card.socialLinks)
      : card.socialLinks || {};
  } catch (e) {
    socials = {};
  }
  const socialsText = Object.entries(socials)
    .filter(([_, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");

  return `Name: ${card.name}
Title: ${card.title}
Company: ${card.company}
Bio: ${card.bio || "Not provided"}
Phone: ${card.phone || "Not provided"}
Email: ${card.email || "Not provided"}
Website: ${card.website || "Not provided"}
Address: ${card.address || "Not provided"}
Social Links: ${socialsText || "None"}`;
}

function cleanMarkdown(text) {
  let html = (text || "").trim();
  if (html.startsWith("```html")) html = html.substring(7);
  if (html.startsWith("```")) html = html.substring(3);
  if (html.endsWith("```")) html = html.substring(0, html.length - 3);
  return html.trim();
}

// Schema for structured design config (Responses API structured outputs)
const DesignConfigSchema = z.object({
  themeName: z.string().describe("Name of the theme (e.g. 'Cyberpunk Neon')"),
  primaryColor: z.string().describe("Primary hex color, e.g. #8b5cf6"),
  secondaryColor: z.string().describe("Secondary hex color"),
  backgroundColor: z.string().describe("Background hex color"),
  accentColor: z.string().describe("Accent hex color"),
  textColor: z.string().describe("Body text hex color"),
  fontFamily: z.string().describe("CSS font-family value (e.g. 'Inter, sans-serif')"),
  borderRadius: z.string().describe("CSS border-radius value (e.g. '16px')"),
  layoutStyle: z.enum(["minimal", "bold", "elegant", "playful", "futuristic", "organic"]).describe("Overall design vibe"),
  iconStyle: z.enum(["outline", "filled", "duotone"]).describe("Icon style"),
  backgroundEffect: z.enum(["none", "gradient", "mesh", "noise", "particles"]).describe("Background effect"),
  moodKeywords: z.array(z.string()).describe("3-5 keywords describing the design mood"),
});

const ChatAnalysisSchema = z.object({
  sentiment: z.enum(["positive", "neutral", "curious", "interested", "professional"]),
  topics: z.array(z.string()),
  followUpSuggestion: z.string(),
  leadScore: z.number().min(0).max(100),
});

export const AIService = {
  client: () => openaiClient(),

  // ────────────────────────────────────────────────────────
  // IMAGE GENERATION (gpt-image-1)
  // ────────────────────────────────────────────────────────

  /**
   * Generate an avatar using gpt-image-1.
   * Returns a base64 data URL.
   */
  async generateAvatar({ prompt, style = "professional", size = "1024x1024" }) {
    const openai = openaiClient();
    if (!openai) {
      return this._mockImage("avatar", prompt);
    }
    try {
      const fullPrompt = `A professional ${style} portrait avatar, head and shoulders, looking at camera, high-quality, modern look, suitable for a digital business card. Style: ${prompt}. Clean background, no text.`;
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: fullPrompt,
        size: size,
        n: 1,
      });
      const b64 = result.data[0]?.b64_json;
      if (!b64) throw new Error("No image data returned");
      return { url: `data:image/png;base64,${b64}`, revisedPrompt: fullPrompt };
    } catch (e) {
      console.error("Avatar generation failed:", e.message);
      return this._mockImage("avatar", prompt);
    }
  },

  /**
   * Generate a background image for the card.
   */
  async generateBackground({ prompt, theme = "abstract", size = "1536x1024" }) {
    const openai = openaiClient();
    if (!openai) {
      return this._mockImage("background", prompt);
    }
    try {
      const fullPrompt = `A ${theme} background pattern for a digital business card. Theme: ${prompt}. Modern, professional, no people, no text, high-resolution.`;
      const result = await openai.images.generate({
        model: "gpt-image-1",
        prompt: fullPrompt,
        size: size,
        n: 1,
      });
      const b64 = result.data[0]?.b64_json;
      if (!b64) throw new Error("No image data returned");
      return { url: `data:image/png;base64,${b64}`, revisedPrompt: fullPrompt };
    } catch (e) {
      console.error("Background generation failed:", e.message);
      return this._mockImage("background", prompt);
    }
  },

  /**
   * Edit an image using a mask (background removal/replacement).
   */
  async editAvatar(imageBuffer, prompt) {
    const openai = openaiClient();
    if (!openai) return null;
    try {
      const blob = new Blob([imageBuffer], { type: "image/png" });
      const file = new File([blob], "avatar.png", { type: "image/png" });
      const result = await openai.images.edit({
        model: "gpt-image-1",
        image: file,
        prompt: prompt,
      });
      const b64 = result.data[0]?.b64_json;
      if (!b64) throw new Error("No edited image");
      return `data:image/png;base64,${b64}`;
    } catch (e) {
      console.error("Image edit failed:", e.message);
      return null;
    }
  },

  async _mockImage(type, prompt) {
    // SVG fallback when no API key
    const color = type === "avatar" ? "#8b5cf6" : "#1e293b";
    const label = type === "avatar" ? "AI" : "BG";
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${type === "avatar" ? 400 : 800}" height="${type === "avatar" ? 400 : 500}" viewBox="0 0 ${type === "avatar" ? 400 : 800} ${type === "avatar" ? 400 : 500}">
      <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8b5cf6"/><stop offset="100%" stop-color="#06b6d4"/></linearGradient></defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <text x="50%" y="50%" text-anchor="middle" fill="white" font-size="80" font-family="sans-serif" font-weight="bold">${label}</text>
      <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="14" opacity="0.7">${(prompt || "").substring(0, 40)}</text>
    </svg>`;
    const b64 = Buffer.from(svg).toString("base64");
    return { url: `data:image/svg+xml;base64,${b64}`, revisedPrompt: prompt, mock: true };
  },

  // ────────────────────────────────────────────────────────
  // CARD HTML GENERATION (Responses API)
  // ────────────────────────────────────────────────────────

  async generateCardHTML(cardId, userPrompt) {
    const card = await CardService.getCardById(cardId);
    if (!card) throw new Error("Business card not found");

    const openai = openaiClient();
    if (!openai) {
      return this._fallbackGeneration(card, userPrompt);
    }

    try {
      const instructions = `You are a world-class premium web designer and UI engineer. Generate a custom digital business card as a complete, standalone HTML document with inline <style> blocks (the iframe cannot reach external stylesheets). Use modern CSS — gradients, shadows, animations, glassmorphism where appropriate. Respond with ONLY raw HTML (no markdown, no backticks). Include all profile details provided. If a custom theme prompt is given, align the design style with it.`;

      const userMsg = `Generate a premium digital business card.

Profile Details:
${buildProfileContext(card)}

Custom Styling Prompt:
${userPrompt || "Make it look highly modern, premium, and creative."}

Return ONLY the HTML string with <html>, <head>, and <body> tags.`;

      const response = await openai.responses.create({
        model: config.openai.cardGenerationModel,
        instructions,
        input: userMsg,
        max_output_tokens: 3000,
        temperature: 0.85,
      });

      const htmlContent = cleanMarkdown(response.output_text || "");
      if (!htmlContent) throw new Error("Empty HTML generated");

      const requestId = `openai_${Date.now()}`;
      await CardService.updateCard(cardId, {
        userPrompt,
        htmlContent,
        templateId: "custom",
      });

      return requestId;
    } catch (err) {
      console.error("OpenAI generation failed:", err.message);
      return this._fallbackGeneration(card, userPrompt);
    }
  },

  async _fallbackGeneration(card, userPrompt) {
    const requestId = `mock_${Date.now()}`;
    const mockHTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #0f172a, #1e293b); min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; color: #e2e8f0; }
.card { width: 100%; max-width: 380px; background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 28px; box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15); position: relative; overflow: hidden; }
.card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #8b5cf6, #6366f1, #06b6d4); }
.header { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
.avatar { width: 64px; height: 64px; border-radius: 16px; background: #334155; display: flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 800; color: #a78bfa; overflow: hidden; flex-shrink: 0; }
.avatar img { width: 100%; height: 100%; object-fit: cover; }
h1 { font-size: 20px; font-weight: 800; color: #f8fafc; margin-bottom: 4px; }
.title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #a78bfa; font-weight: 600; margin-bottom: 2px; }
.company { font-size: 12px; color: #94a3b8; }
.bio { background: rgba(15, 23, 42, 0.5); border: 1px solid #334155; border-radius: 16px; padding: 14px; margin-bottom: 20px; }
.bio-label { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
.bio p { font-size: 13px; line-height: 1.5; color: #cbd5e1; font-weight: 300; }
.contacts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.contact { display: flex; align-items: center; gap: 10px; font-size: 13px; color: #cbd5e1; font-weight: 300; }
.icon { width: 28px; height: 28px; background: #334155; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
.contact a { color: #cbd5e1; text-decoration: none; }
.prompt { border-top: 1px solid #334155; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b; }
.badge { display: inline-block; background: rgba(139, 92, 246, 0.1); color: #a78bfa; border: 1px solid rgba(139, 92, 246, 0.3); padding: 4px 12px; border-radius: 999px; margin-left: 8px; font-style: italic; }
</style></head><body>
<div class="card">
<div class="header"><div class="avatar">${card.avatar ? `<img src="${card.avatar}" alt="${card.name}" />` : (card.name || "?").charAt(0).toUpperCase()}</div>
<div><h1>${card.name || "Your Name"}</h1><div class="title">${card.title || "Professional"}</div><div class="company">${card.company || "Company"}</div></div></div>
${card.bio ? `<div class="bio"><div class="bio-label">About</div><p>${card.bio}</p></div>` : ""}
<div class="contacts">
${card.email ? `<div class="contact"><span class="icon">✉</span><a href="mailto:${card.email}">${card.email}</a></div>` : ""}
${card.phone ? `<div class="contact"><span class="icon">📞</span><a href="tel:${card.phone}">${card.phone}</a></div>` : ""}
${card.website ? `<div class="contact"><span class="icon">🌐</span><a href="${card.website}" target="_blank">${card.website}</a></div>` : ""}
${card.address ? `<div class="contact"><span class="icon">📍</span><span>${card.address}</span></div>` : ""}</div>
<div class="prompt">AI Theme: <span class="badge">${userPrompt || "Modern Dark"}</span></div>
</div></body></html>`;

    await CardService.updateCard(cardId, {
      userPrompt,
      htmlContent: mockHTML,
      templateId: "custom",
    });
    return requestId;
  },

  async checkGenerationStatus(cardId, requestId) {
    const card = await CardService.getCardById(cardId);
    if (!card) return { status: "failed", error: "Card not found" };
    return { status: "completed", card };
  },

  // ────────────────────────────────────────────────────────
  // STREAMING CHATBOT (Responses API streaming)
  // ────────────────────────────────────────────────────────

  /**
   * Stream chatbot replies using openai.responses.stream().
   * Yields text deltas as they arrive.
   */
  async *streamChatbot(card, query, chatHistory = []) {
    const openai = openaiClient();
    if (!openai) {
      yield* this._streamFallbackChatbot(card, query);
      return;
    }

    try {
      const profileText = buildProfileContext(card);
      const instructions = `You are the AI Assistant for ${card.name}. Answer visitor questions using this profile information:

${profileText}

Be professional, helpful, and polite. Answer directly on behalf of ${card.name}. Use first person "I" or third person — keep it personal. If the visitor asks for information that is not in the profile, politely reply that you don't have that detail but they can reach out via email or phone. Keep answers concise (2-4 sentences max).`;

      const input = [];
      for (const msg of chatHistory.slice(-10)) {
        input.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: [{ type: "input_text", text: msg.content }],
        });
      }
      input.push({
        role: "user",
        content: [{ type: "input_text", text: query }],
      });

      const stream = await openai.responses.stream({
        model: config.openai.chatbotModel,
        instructions,
        input,
        max_output_tokens: 500,
        temperature: 0.7,
      });

      for await (const event of stream) {
        if (event.type === "response.output_text.delta") {
          yield { type: "delta", text: event.delta };
        } else if (event.type === "response.completed") {
          yield { type: "done", responseId: event.response.id };
        }
      }
    } catch (err) {
      console.error("Streaming chatbot failed:", err.message);
      yield* this._streamFallbackChatbot(card, query);
    }
  },

  async *_streamFallbackChatbot(card, query) {
    const reply = `Hi! I'm the AI assistant for ${card.name}. ${card.name} works as a ${card.title} at ${card.company}. Feel free to reach out via the contact details on this card!`;
    const words = reply.split(" ");
    for (const word of words) {
      yield { type: "delta", text: word + " " };
      await new Promise(r => setTimeout(r, 40));
    }
    yield { type: "done", responseId: null };
  },

  // Non-streaming chatbot for backward compat
  async askChatbot(card, query, chatHistory = []) {
    let full = "";
    for await (const event of this.streamChatbot(card, query, chatHistory)) {
      if (event.type === "delta") full += event.text;
      if (event.type === "done") break;
    }
    return full.trim() || `Hi! I'm the AI assistant for ${card.name}.`;
  },

  // ────────────────────────────────────────────────────────
  // STRUCTURED OUTPUTS — Design Config
  // ────────────────────────────────────────────────────────

  /**
   * Extract a complete design configuration from a theme prompt
   * using Responses API structured outputs (Zod schema).
   */
  async extractDesignConfig(themePrompt) {
    const openai = openaiClient();
    if (!openai) {
      return {
        themeName: "Modern Dark",
        primaryColor: "#8b5cf6",
        secondaryColor: "#6366f1",
        backgroundColor: "#0f172a",
        accentColor: "#06b6d4",
        textColor: "#e2e8f0",
        fontFamily: "Inter, sans-serif",
        borderRadius: "16px",
        layoutStyle: "futuristic",
        iconStyle: "outline",
        backgroundEffect: "gradient",
        moodKeywords: ["modern", "premium", "tech"],
      };
    }
    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "You are a senior brand designer. Convert the user's theme description into a precise, harmonious design configuration. Pick colors that work together aesthetically.",
        input: `Theme: "${themePrompt}"`,
        text: {
          format: zodTextFormat(DesignConfigSchema, "design_config"),
        },
        max_output_tokens: 500,
      });

      // Parse structured output from the response
      for (const item of response.output) {
        if (item.type === "message") {
          for (const c of item.content) {
            if (c.type === "output_text" && c.parsed) {
              return c.parsed;
            }
            if (c.type === "output_text" && c.text) {
              try { return JSON.parse(c.text); } catch (e) {}
            }
          }
        }
      }
      throw new Error("No structured output");
    } catch (e) {
      console.error("Design extraction failed:", e.message);
      // Fallback: ask for JSON
      try {
        const fallback = await openai.responses.create({
          model: config.openai.model,
          instructions: "Return ONLY valid JSON matching this schema: {themeName, primaryColor, secondaryColor, backgroundColor, accentColor, textColor, fontFamily, borderRadius, layoutStyle, iconStyle, backgroundEffect, moodKeywords}",
          input: `Theme: "${themePrompt}". Return JSON only.`,
          max_output_tokens: 500,
        });
        return JSON.parse(fallback.output_text || "{}");
      } catch (e2) {
        return null;
      }
    }
  },

  // ────────────────────────────────────────────────────────
  // VISION — Analyze uploaded image
  // ────────────────────────────────────────────────────────

  /**
   * Analyze a profile photo using gpt-4o vision via Responses API.
   * Returns lighting, color, mood, and crop suggestions.
   */
  async analyzeImage(imageDataUrl, purpose = "avatar") {
    const openai = openaiClient();
    if (!openai) {
      return { mock: true, dominantColors: ["#8b5cf6", "#06b6d4"], mood: "professional", suggestion: "Add a brighter background" };
    }
    try {
      const base64 = imageDataUrl.split(",")[1];
      const mimeType = imageDataUrl.split(";")[0].split(":")[1];

      const response = await openai.responses.create({
        model: config.openai.visionModel,
        instructions: `You are an expert photo analyst. Analyze the uploaded image for use as a ${purpose} on a digital business card. Return JSON with: dominantColors (array of 3 hex), mood (string), lighting (string), composition (string), suggestions (array of 2-3 short improvement tips), cropFocus (where to crop - 'center'|'face'|'upper-body'|'full'). Return ONLY valid JSON.`,
        input: [
          {
            role: "user",
            content: [
              { type: "input_image", image_url: `data:${mimeType};base64,${base64}` },
              { type: "input_text", text: `Analyze this image for use as a ${purpose}.` },
            ],
          },
        ],
        max_output_tokens: 400,
      });
      const text = (response.output_text || "").trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    } catch (e) {
      console.error("Vision analysis failed:", e.message);
      return null;
    }
  },

  // ────────────────────────────────────────────────────────
  // FUNCTION / TOOL CALLING — Live web search
  // ────────────────────────────────────────────────────────

  /**
   * Use built-in web_search tool to fetch live info about a person/company.
   * Useful for chatbot context enrichment.
   */
  async webSearchContext(query) {
    const openai = openaiClient();
    if (!openai) return null;
    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "Summarize the search results concisely (max 5 sentences).",
        input: query,
        tools: [{ type: "web_search" }],
        max_output_tokens: 400,
      });
      return response.output_text;
    } catch (e) {
      console.error("Web search failed:", e.message);
      return null;
    }
  },

  /**
   * Define a function tool the AI can call.
   */
  async askChatbotWithTools(card, query, chatHistory = []) {
    const openai = openaiClient();
    if (!openai) return null;

    try {
      const profileText = buildProfileContext(card);
      const instructions = `You are the AI Assistant for ${card.name}. Use the provided profile information and tools to answer visitor questions.

Profile:
${profileText}

If asked about something recent (e.g. latest work, news, projects), use the web_search tool. Otherwise answer from the profile.`;

      const input = [];
      for (const msg of chatHistory.slice(-10)) {
        input.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: [{ type: "input_text", text: msg.content }],
        });
      }
      input.push({
        role: "user",
        content: [{ type: "input_text", text: query }],
      });

      const response = await openai.responses.create({
        model: config.openai.chatbotModel,
        instructions,
        input,
        tools: [
          {
            type: "function",
            name: "request_contact",
            description: "Log that a visitor wants to be contacted. Use when someone asks to be put in touch.",
            parameters: {
              type: "object",
              properties: {
                visitorName: { type: "string" },
                visitorEmail: { type: "string" },
                reason: { type: "string" },
              },
              required: ["reason"],
            },
          },
          {
            type: "function",
            name: "schedule_meeting",
            description: "Schedule a meeting. Use when someone wants to book a call.",
            parameters: {
              type: "object",
              properties: {
                preferredTime: { type: "string" },
                topic: { type: "string" },
              },
              required: ["topic"],
            },
          },
          { type: "web_search" },
        ],
        max_output_tokens: 500,
      });

      const toolCalls = [];
      let textReply = "";
      for (const item of response.output) {
        if (item.type === "function_call") {
          toolCalls.push({
            name: item.name,
            arguments: item.arguments,
            callId: item.call_id,
          });
        } else if (item.type === "message") {
          for (const c of item.content) {
            if (c.type === "output_text") textReply += c.text;
          }
        }
      }
      return { text: textReply, toolCalls };
    } catch (e) {
      console.error("Tool-call chatbot failed:", e.message);
      return null;
    }
  },

  // ────────────────────────────────────────────────────────
  // MULTI-TURN CONVERSATION (previous_response_id)
  // ────────────────────────────────────────────────────────

  /**
   * Multi-turn conversation using previous_response_id for stateful context.
   */
  async continueConversation({ previousResponseId, query, card }) {
    const openai = openaiClient();
    if (!openai) return null;
    try {
      const instructions = `You are the AI Assistant for ${card.name}. Use first-person. Keep answers concise (2-4 sentences).`;
      const response = await openai.responses.create({
        model: config.openai.chatbotModel,
        instructions,
        previous_response_id: previousResponseId,
        input: [{ role: "user", content: [{ type: "input_text", text: query }] }],
        max_output_tokens: 400,
      });
      return {
        text: response.output_text,
        responseId: response.id,
      };
    } catch (e) {
      console.error("Continue conversation failed:", e.message);
      return null;
    }
  },

  // ────────────────────────────────────────────────────────
  // EXISTING HELPERS
  // ────────────────────────────────────────────────────────

  async enhanceBio(shortPrompt, profession) {
    const openai = openaiClient();
    if (!openai) return shortPrompt;
    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "You are a professional copywriter. Polish the user's bio for a digital business card. Return ONLY the rewritten bio text (1-3 sentences, max 280 chars). No quotes or preamble.",
        input: `Profession: ${profession || "professional"}\nBio draft: "${shortPrompt}"`,
        max_output_tokens: 200,
        temperature: 0.8,
      });
      return (response.output_text || shortPrompt).trim();
    } catch (e) {
      return shortPrompt;
    }
  },

  async suggestTitle(description) {
    const openai = openaiClient();
    if (!openai) return null;
    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "Suggest a concise professional job title. Return ONLY the title (max 5 words). No quotes or preamble.",
        input: description,
        max_output_tokens: 50,
        temperature: 0.6,
      });
      return (response.output_text || "").trim().replace(/^["']|["']$/g, "");
    } catch (e) {
      return null;
    }
  },

  async analyzeChatIntent(message) {
    const openai = openaiClient();
    if (!openai) return null;
    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "Analyze the visitor's chat message and classify it.",
        input: message,
        text: {
          format: zodTextFormat(ChatAnalysisSchema, "chat_analysis"),
        },
        max_output_tokens: 200,
      });
      for (const item of response.output) {
        if (item.type === "message") {
          for (const c of item.content) {
            if (c.type === "output_text" && c.parsed) return c.parsed;
          }
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  },
};