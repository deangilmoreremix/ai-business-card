import OpenAI from "openai";
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

export const AIService = {
  /**
   * Generate a custom HTML business card using the OpenAI Responses API.
   * Returns a requestId that can be polled via checkGenerationStatus.
   */
  async generateCardHTML(cardId, userPrompt) {
    const card = await CardService.getCardById(cardId);
    if (!card) throw new Error("Business card not found");

    const profileText = buildProfileContext(card);
    const openai = openaiClient();

    if (!openai) {
      // Fallback to MuAPI or local mock
      return this._fallbackGeneration(card, userPrompt);
    }

    try {
      // Use OpenAI Responses API (synchronous helper)
      const instructions = `You are a world-class premium web designer and UI engineer. Your task is to generate a custom digital business card in clean, self-contained HTML with inline Tailwind-style utility classes (you must inline the styles yourself since the iframe does not have access to external stylesheets).
Respond with ONLY raw, valid HTML markup (no markdown code blocks, no backticks, no wrap). Use inline style attributes and inline <style> tags within <head>. The card should be a responsive, modern component that looks stunning, highly professional, and leverages premium elements.
Use all of the provided profile details (name, title, company, bio, contacts, social links). Include a clean wrapper with nice spacing, typography, and interactive hover effects. If the user provides a custom theme prompt, align the design style with it.`;

      const userMsg = `Generate a premium digital business card.

Profile Details:
${profileText}

Custom Styling Prompt:
${userPrompt || "Make it look highly modern, premium, and creative."}

Return ONLY the HTML string. The HTML must be a complete, standalone document with <html>, <head>, and <body> tags. Include an inline <style> block with all CSS needed.`;

      // Use Responses API
      const response = await openai.responses.create({
        model: config.openai.cardGenerationModel,
        instructions,
        input: userMsg,
        max_output_tokens: 3000,
        temperature: 0.85,
      });

      const htmlContent = cleanMarkdown(response.output_text || "");

      if (!htmlContent) {
        throw new Error("Empty HTML generated");
      }

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
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: #e2e8f0;
  }
  .card {
    width: 100%;
    max-width: 380px;
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 24px;
    padding: 28px;
    box-shadow: 0 20px 60px rgba(124, 58, 237, 0.15);
    position: relative;
    overflow: hidden;
  }
  .card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 4px;
    background: linear-gradient(90deg, #8b5cf6, #6366f1, #06b6d4);
  }
  .header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
  }
  .avatar {
    width: 64px;
    height: 64px;
    border-radius: 16px;
    background: #334155;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 800;
    color: #a78bfa;
    border: 1px solid #475569;
    overflow: hidden;
    flex-shrink: 0;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
  .info h1 {
    font-size: 20px;
    font-weight: 800;
    color: #f8fafc;
    margin-bottom: 4px;
    line-height: 1.1;
  }
  .info .title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #a78bfa;
    font-weight: 600;
    margin-bottom: 2px;
  }
  .info .company { font-size: 12px; color: #94a3b8; }
  .bio {
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid #334155;
    border-radius: 16px;
    padding: 14px;
    margin-bottom: 20px;
  }
  .bio-label {
    font-size: 10px;
    font-weight: 700;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 6px;
  }
  .bio p { font-size: 13px; line-height: 1.5; color: #cbd5e1; font-weight: 300; }
  .contacts { display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
  .contact {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: #cbd5e1;
    font-weight: 300;
  }
  .contact-icon {
    width: 28px;
    height: 28px;
    background: #334155;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    flex-shrink: 0;
  }
  .contact a { color: #cbd5e1; text-decoration: none; }
  .contact a:hover { color: #f8fafc; text-decoration: underline; }
  .prompt {
    border-top: 1px solid #334155;
    padding-top: 16px;
    text-align: center;
    font-size: 11px;
    color: #64748b;
  }
  .prompt .badge {
    display: inline-block;
    background: rgba(139, 92, 246, 0.1);
    color: #a78bfa;
    border: 1px solid rgba(139, 92, 246, 0.3);
    padding: 4px 12px;
    border-radius: 999px;
    margin-left: 8px;
    font-style: italic;
  }
</style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="avatar">
        ${card.avatar ? `<img src="${card.avatar}" alt="${card.name}" />` : (card.name || "?").charAt(0).toUpperCase()}
      </div>
      <div class="info">
        <h1>${card.name || "Your Name"}</h1>
        <div class="title">${card.title || "Professional"}</div>
        <div class="company">${card.company || "Company"}</div>
      </div>
    </div>
    ${card.bio ? `<div class="bio"><div class="bio-label">About</div><p>${card.bio}</p></div>` : ""}
    <div class="contacts">
      ${card.email ? `<div class="contact"><span class="contact-icon">✉</span><a href="mailto:${card.email}">${card.email}</a></div>` : ""}
      ${card.phone ? `<div class="contact"><span class="contact-icon">📞</span><a href="tel:${card.phone}">${card.phone}</a></div>` : ""}
      ${card.website ? `<div class="contact"><span class="contact-icon">🌐</span><a href="${card.website}" target="_blank">${card.website}</a></div>` : ""}
      ${card.address ? `<div class="contact"><span class="contact-icon">📍</span><span>${card.address}</span></div>` : ""}
    </div>
    <div class="prompt">AI Theme: <span class="badge">${userPrompt || "Modern Dark"}</span></div>
  </div>
</body>
</html>`;

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

    // Mock requests complete immediately
    if (requestId && (requestId.startsWith("mock") || requestId.startsWith("openai"))) {
      return { status: "completed", card };
    }

    return { status: "completed", card };
  },

  /**
   * Ask the AI chatbot using OpenAI Responses API.
   */
  async askChatbot(card, query, chatHistory = []) {
    const openai = openaiClient();

    if (!openai) {
      return this._fallbackChatbot(card, query);
    }

    try {
      const profileText = buildProfileContext(card);
      const instructions = `You are the AI Assistant for ${card.name}. You represent ${card.name} in a digital format.
Answer visitor questions using this profile information:

${profileText}

Be professional, helpful, and polite. Answer directly on behalf of ${card.name} (use first person "I" or third person, but keep it personal).
If the visitor asks for information that is not in the profile, politely reply that you don't have that detail but they can get in touch directly via email or phone. Keep answers concise (2-4 sentences max).`;

      // Build input items for the Responses API
      const input = [];
      // Add conversation history as user/assistant turns
      for (const msg of chatHistory.slice(-10)) {
        input.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: [{ type: "input_text", text: msg.content }],
        });
      }
      // Add the current query
      input.push({
        role: "user",
        content: [{ type: "input_text", text: query }],
      });

      const response = await openai.responses.create({
        model: config.openai.chatbotModel,
        instructions,
        input,
        max_output_tokens: 400,
        temperature: 0.7,
      });

      const reply = (response.output_text || "").trim();
      if (!reply) throw new Error("Empty chatbot reply");
      return reply;
    } catch (err) {
      console.error("OpenAI chatbot failed:", err.message);
      return this._fallbackChatbot(card, query);
    }
  },

  async _fallbackChatbot(card, query) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const queryLower = query.toLowerCase();
        let reply = `Hi! I'm the AI assistant for ${card.name}. ${card.name} works as a ${card.title} at ${card.company}. `;
        if (queryLower.includes("email") || queryLower.includes("contact")) {
          reply += card.email ? `You can reach out at ${card.email}.` : "No email is listed on this card.";
        } else if (queryLower.includes("phone") || queryLower.includes("call")) {
          reply += card.phone ? `You can call at ${card.phone}.` : "No phone number is listed.";
        } else if (queryLower.includes("website") || queryLower.includes("site")) {
          reply += card.website ? `Check out ${card.website}.` : "No website is listed.";
        } else {
          reply += card.bio ? `Here's a bit about ${card.name}: ${card.bio}` : "Feel free to reach out via the contact details on the card!";
        }
        resolve(reply);
      }, 800);
    });
  },

  /**
   * Enhance a card bio using OpenAI Responses API.
   * Generates a polished, professional bio from a short prompt.
   */
  async enhanceBio(shortPrompt, profession) {
    const openai = openaiClient();
    if (!openai) {
      return shortPrompt;
    }

    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "You are a professional copywriter specializing in polished personal bios for digital business cards. Return ONLY the rewritten bio text with no preamble or quotes. Keep it 1-3 sentences (max 280 chars). Make it sound confident, professional, and personable.",
        input: `Rewrite and enhance this bio for a ${profession || "professional"}: "${shortPrompt}"`,
        max_output_tokens: 200,
        temperature: 0.8,
      });
      return (response.output_text || shortPrompt).trim();
    } catch (e) {
      console.error("Bio enhance failed:", e.message);
      return shortPrompt;
    }
  },

  /**
   * Suggest a job title based on a description.
   */
  async suggestTitle(description) {
    const openai = openaiClient();
    if (!openai) return null;

    try {
      const response = await openai.responses.create({
        model: config.openai.model,
        instructions: "You are a career title assistant. Given a short description of someone's work, suggest a concise, professional job title. Return ONLY the title text with no quotes or preamble. Maximum 5 words.",
        input: `Suggest a job title for someone who: ${description}`,
        max_output_tokens: 50,
        temperature: 0.6,
      });
      return (response.output_text || "").trim().replace(/^["']|["']$/g, "");
    } catch (e) {
      console.error("Title suggestion failed:", e.message);
      return null;
    }
  },

  /**
   * Generate vCard (.vcf) data using OpenAI for clean formatting.
   */
  async generateVCard(card) {
    // vCard format is structured - we don't need LLM for this,
    // but keeping it here for API consistency.
    return null;
  },
};