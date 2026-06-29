import { supabaseAdmin } from "@/lib/supabase";

function generateHash(length = 8) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export const CardService = {
  async generateUniqueHash() {
    let hash = "";
    let exists = true;
    while (exists) {
      hash = generateHash();
      const { data, error } = await supabaseAdmin
        .from("business_cards")
        .select("id")
        .eq("url_hash", hash)
        .limit(1);
      if (error) throw error;
      if (!data || data.length === 0) {
        exists = false;
      }
    }
    return hash;
  },

  mapCardFromDB(row) {
    if (!row) return null;
    return {
      id: row.id,
      name: row.name || "",
      title: row.title || "",
      company: row.company || "",
      address: row.address || "",
      phone: row.phone || "",
      email: row.email || "",
      website: row.website || "",
      bio: row.bio || "",
      avatar: row.avatar || "",
      backgroundImage: row.background_image || "",
      socialLinks: row.social_links || "{}",
      showAiAssistant: row.show_ai_assistant !== false,
      templateId: row.template_id || "classic",
      htmlContent: row.html_content || "",
      urlHash: row.url_hash,
      userPrompt: row.user_prompt || "",
      createTime: row.create_time,
      updateTime: row.update_time,
    };
  },

  async listCards() {
    const { data, error } = await supabaseAdmin
      .from("business_cards")
      .select("*")
      .order("create_time", { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapCardFromDB);
  },

  async getCardById(id) {
    const { data, error } = await supabaseAdmin
      .from("business_cards")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return this.mapCardFromDB(data);
  },

  async getCardByHash(urlHash) {
    const { data, error } = await supabaseAdmin
      .from("business_cards")
      .select("*")
      .eq("url_hash", urlHash)
      .maybeSingle();
    if (error) throw error;
    return this.mapCardFromDB(data);
  },

  async createCard(cardData) {
    const urlHash = cardData.urlHash || (await this.generateUniqueHash());
    const row = {
      name: cardData.name,
      title: cardData.title,
      company: cardData.company,
      address: cardData.address || null,
      phone: cardData.phone || null,
      email: cardData.email || null,
      website: cardData.website || null,
      bio: cardData.bio || null,
      avatar: cardData.avatar || null,
      background_image: cardData.backgroundImage || null,
      social_links:
        typeof cardData.socialLinks === "string"
          ? cardData.socialLinks
          : JSON.stringify(cardData.socialLinks || {}),
      show_ai_assistant: cardData.showAiAssistant !== false,
      template_id: cardData.templateId || "classic",
      html_content: cardData.htmlContent || null,
      url_hash: urlHash,
      user_prompt: cardData.userPrompt || null,
    };
    const { data, error } = await supabaseAdmin
      .from("business_cards")
      .insert([row])
      .select()
      .single();
    if (error) throw error;
    return this.mapCardFromDB(data);
  },

  async updateCard(id, cardData) {
    const updateRow = {};
    if (cardData.name !== undefined) updateRow.name = cardData.name;
    if (cardData.title !== undefined) updateRow.title = cardData.title;
    if (cardData.company !== undefined) updateRow.company = cardData.company;
    if (cardData.address !== undefined) updateRow.address = cardData.address;
    if (cardData.phone !== undefined) updateRow.phone = cardData.phone;
    if (cardData.email !== undefined) updateRow.email = cardData.email;
    if (cardData.website !== undefined) updateRow.website = cardData.website;
    if (cardData.bio !== undefined) updateRow.bio = cardData.bio;
    if (cardData.avatar !== undefined) updateRow.avatar = cardData.avatar;
    if (cardData.backgroundImage !== undefined)
      updateRow.background_image = cardData.backgroundImage;
    if (cardData.socialLinks !== undefined) {
      updateRow.social_links =
        typeof cardData.socialLinks === "string"
          ? cardData.socialLinks
          : JSON.stringify(cardData.socialLinks || {});
    }
    if (cardData.showAiAssistant !== undefined)
      updateRow.show_ai_assistant = cardData.showAiAssistant;
    if (cardData.templateId !== undefined)
      updateRow.template_id = cardData.templateId;
    if (cardData.htmlContent !== undefined)
      updateRow.html_content = cardData.htmlContent;
    if (cardData.userPrompt !== undefined)
      updateRow.user_prompt = cardData.userPrompt;
    if (cardData.templateId !== undefined && cardData.templateId !== "custom") {
      updateRow.html_content = null;
    }

    const { data, error } = await supabaseAdmin
      .from("business_cards")
      .update(updateRow)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return this.mapCardFromDB(data);
  },

  async deleteCard(id) {
    const { error } = await supabaseAdmin
      .from("business_cards")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  },

  async recordView(urlHash, viewerInfo = {}) {
    try {
      await supabaseAdmin.from("card_views").insert([
        {
          card_url_hash: urlHash,
          visitor_ip: viewerInfo.ip || null,
          user_agent: viewerInfo.userAgent || null,
          referrer: viewerInfo.referrer || null,
        },
      ]);
    } catch (e) {
      console.error("Failed to record view:", e);
    }
  },

  async getCardAnalytics(urlHash) {
    const { count, error } = await supabaseAdmin
      .from("card_views")
      .select("*", { count: "exact", head: true })
      .eq("card_url_hash", urlHash);
    if (error) {
      console.error("Analytics error:", error);
      return { views: 0 };
    }
    return { views: count || 0 };
  },
};

export const ChatService = {
  async saveMessage(cardUrlHash, sessionId, role, content) {
    try {
      await supabaseAdmin.from("chat_messages").insert([
        {
          card_url_hash: cardUrlHash,
          session_id: sessionId,
          role,
          content,
        },
      ]);
    } catch (e) {
      console.error("Failed to save chat message:", e);
    }
  },

  async getRecentMessages(cardUrlHash, sessionId, limit = 20) {
    const { data, error } = await supabaseAdmin
      .from("chat_messages")
      .select("*")
      .eq("card_url_hash", cardUrlHash)
      .eq("session_id", sessionId)
      .order("create_time", { ascending: true })
      .limit(limit);
    if (error) {
      console.error("Chat history error:", error);
      return [];
    }
    return data || [];
  },
};