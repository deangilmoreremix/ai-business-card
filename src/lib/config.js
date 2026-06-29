const config = {
  appName: "CardAI Creator",
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    publishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    secretKey: process.env.SUPABASE_SECRET_KEY,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4o",
    cardGenerationModel: "gpt-4o",
    chatbotModel: "gpt-4o",
    visionModel: "gpt-4o",
  },
  ai: {
    apiKey: process.env.MUAPIAPP_API_KEY,
    provider: process.env.OPENAI_API_KEY ? "openai" : "muapi",
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    theme: process.env.NEXT_PUBLIC_THEME || "light",
  },
};

export default config;