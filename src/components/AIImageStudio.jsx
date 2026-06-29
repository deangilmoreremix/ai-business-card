"use client";

import { useState } from "react";
import {
  FaImage, FaMagic, FaSpinner, FaDownload, FaCheck, FaPalette,
  FaUserCircle, FaPhotoVideo, FaTimes, FaEye
} from "react-icons/fa";

const AVATAR_STYLES = [
  { id: "professional", label: "Professional", emoji: "👔" },
  { id: "creative", label: "Creative", emoji: "🎨" },
  { id: "friendly", label: "Friendly", emoji: "😊" },
  { id: "corporate", label: "Corporate", emoji: "🏢" },
  { id: "artistic", label: "Artistic", emoji: "✨" },
];

const BG_THEMES = [
  { id: "abstract", label: "Abstract", emoji: "🌀" },
  { id: "gradient", label: "Gradient", emoji: "🌈" },
  { id: "geometric", label: "Geometric", emoji: "📐" },
  { id: "organic", label: "Organic", emoji: "🌿" },
  { id: "tech", label: "Tech", emoji: "⚡" },
];

export function AIImageStudio({ formData, setFormData, onClose }) {
  const [activeTab, setActiveTab] = useState("avatar");
  const [avatarPrompt, setAvatarPrompt] = useState("");
  const [avatarStyle, setAvatarStyle] = useState("professional");
  const [bgPrompt, setBgPrompt] = useState("");
  const [bgTheme, setBgTheme] = useState("abstract");
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [designConfig, setDesignConfig] = useState(null);
  const [extractingConfig, setExtractingConfig] = useState(false);

  const handleGenerateAvatar = async () => {
    if (!avatarPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/image/avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: avatarPrompt, style: avatarStyle }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImages(prev => [{ ...data, type: "avatar" }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateBackground = async () => {
    if (!bgPrompt.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch("/api/image/background", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: bgPrompt, theme: bgTheme }),
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedImages(prev => [{ ...data, type: "background" }, ...prev]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(false);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!formData.avatar) return;
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/vision/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: formData.avatar, purpose: "avatar" }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExtractDesign = async () => {
    const prompt = activeTab === "avatar" ? avatarPrompt : bgPrompt;
    if (!prompt.trim()) return;
    setExtractingConfig(true);
    try {
      const res = await fetch("/api/design/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (res.ok) {
        const data = await res.json();
        setDesignConfig(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setExtractingConfig(false);
    }
  };

  const applyImage = (img) => {
    if (img.type === "avatar") {
      setFormData(p => ({ ...p, avatar: img.url }));
    } else {
      setFormData(p => ({ ...p, backgroundImage: img.url }));
    }
  };

  const applyDesignConfig = () => {
    if (!designConfig) return;
    // Apply colors to a custom CSS var that the templates use
    document.documentElement.style.setProperty("--ai-primary", designConfig.primaryColor);
    document.documentElement.style.setProperty("--ai-secondary", designConfig.secondaryColor);
    document.documentElement.style.setProperty("--ai-accent", designConfig.accentColor);
  };

  return (
    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-200 rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FaPhotoVideo className="text-violet-600 text-xs" />
          <span className="text-xs font-bold text-violet-700">AI Image Studio</span>
          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
            GPT-Image-1
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <FaTimes />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-violet-200">
        {[
          { id: "avatar", label: "Avatar", icon: FaUserCircle },
          { id: "background", label: "Background", icon: FaImage },
          { id: "design", label: "Design Tokens", icon: FaPalette },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-semibold border-b-2 transition-all ${
              activeTab === tab.id
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="text-[10px]" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Avatar Tab */}
      {activeTab === "avatar" && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1">
            {AVATAR_STYLES.map(s => (
              <button
                key={s.id}
                onClick={() => setAvatarStyle(s.id)}
                className={`p-1.5 rounded text-[10px] font-semibold border transition-all ${
                  avatarStyle === s.id
                    ? "bg-violet-100 border-violet-300 text-violet-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-violet-200"
                }`}
                title={s.label}
              >
                <div className="text-base">{s.emoji}</div>
              </button>
            ))}
          </div>
          <textarea
            value={avatarPrompt}
            onChange={(e) => setAvatarPrompt(e.target.value)}
            rows={2}
            placeholder="Describe your avatar... e.g. 'warm smile, modern look, soft lighting'"
            className="w-full bg-white border border-violet-100 rounded px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
          />
          <button
            onClick={handleGenerateAvatar}
            disabled={generating || !avatarPrompt.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {generating ? <FaSpinner className="animate-spin" /> : <FaMagic />}
            Generate Avatar
          </button>

          {formData.avatar && (
            <button
              onClick={handleAnalyzePhoto}
              disabled={analyzing}
              className="w-full bg-white border border-violet-200 text-violet-700 hover:bg-violet-50 rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              {analyzing ? <FaSpinner className="animate-spin" /> : <FaEye />}
              Analyze with Vision AI
            </button>
          )}

          {analysis && (
            <div className="bg-white border border-violet-100 rounded p-2 text-[10px] space-y-1">
              {analysis.mood && (
                <p><span className="font-semibold text-gray-700">Mood:</span> <span className="text-gray-600">{analysis.mood}</span></p>
              )}
              {analysis.lighting && (
                <p><span className="font-semibold text-gray-700">Lighting:</span> <span className="text-gray-600">{analysis.lighting}</span></p>
              )}
              {analysis.dominantColors && (
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-gray-700">Colors:</span>
                  {analysis.dominantColors.map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded border border-gray-200" style={{ background: c }} title={c} />
                  ))}
                </div>
              )}
              {analysis.suggestions && (
                <div>
                  <p className="font-semibold text-gray-700">Tips:</p>
                  <ul className="list-disc list-inside text-gray-600">
                    {analysis.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Background Tab */}
      {activeTab === "background" && (
        <div className="space-y-2">
          <div className="grid grid-cols-5 gap-1">
            {BG_THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setBgTheme(t.id)}
                className={`p-1.5 rounded text-[10px] font-semibold border transition-all ${
                  bgTheme === t.id
                    ? "bg-violet-100 border-violet-300 text-violet-700"
                    : "bg-white border-gray-200 text-gray-600 hover:border-violet-200"
                }`}
                title={t.label}
              >
                <div className="text-base">{t.emoji}</div>
              </button>
            ))}
          </div>
          <textarea
            value={bgPrompt}
            onChange={(e) => setBgPrompt(e.target.value)}
            rows={2}
            placeholder="Describe your background... e.g. 'neon city skyline at night'"
            className="w-full bg-white border border-violet-100 rounded px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
          />
          <button
            onClick={handleGenerateBackground}
            disabled={generating || !bgPrompt.trim()}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {generating ? <FaSpinner className="animate-spin" /> : <FaMagic />}
            Generate Background
          </button>
        </div>
      )}

      {/* Design Tokens Tab */}
      {activeTab === "design" && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Use AI to extract a complete design system (colors, fonts, layout) from a theme prompt.
          </p>
          <textarea
            value={activeTab === "design" ? (designConfig ? designConfig.themeName : bgPrompt || avatarPrompt) : ""}
            onChange={(e) => activeTab === "avatar" ? setAvatarPrompt(e.target.value) : setBgPrompt(e.target.value)}
            rows={2}
            placeholder="e.g. 'warm sunset tech with retro futurism'"
            className="w-full bg-white border border-violet-100 rounded px-2 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none"
          />
          <button
            onClick={handleExtractDesign}
            disabled={extractingConfig}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded py-1.5 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            {extractingConfig ? <FaSpinner className="animate-spin" /> : <FaPalette />}
            Extract Design System
          </button>

          {designConfig && (
            <div className="bg-white border border-violet-100 rounded p-2 text-[10px] space-y-1.5">
              <p className="font-bold text-violet-700">{designConfig.themeName}</p>
              <div className="grid grid-cols-2 gap-1">
                <ColorSwatch label="Primary" color={designConfig.primaryColor} />
                <ColorSwatch label="Secondary" color={designConfig.secondaryColor} />
                <ColorSwatch label="Accent" color={designConfig.accentColor} />
                <ColorSwatch label="Background" color={designConfig.backgroundColor} />
              </div>
              <p><span className="font-semibold text-gray-700">Style:</span> <span className="text-gray-600">{designConfig.layoutStyle}</span></p>
              <p><span className="font-semibold text-gray-700">Font:</span> <span className="text-gray-600">{designConfig.fontFamily}</span></p>
              {designConfig.moodKeywords && (
                <div className="flex flex-wrap gap-1">
                  {designConfig.moodKeywords.map((k, i) => (
                    <span key={i} className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 text-violet-700 rounded text-[9px] font-semibold">
                      {k}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={applyDesignConfig}
                className="w-full mt-1 bg-violet-100 hover:bg-violet-200 text-violet-700 rounded py-1 text-[10px] font-bold"
              >
                Apply Colors
              </button>
            </div>
          )}
        </div>
      )}

      {/* Generated Images Gallery */}
      {generatedImages.length > 0 && (
        <div className="space-y-2">
          <p className={lbl}>Generated</p>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {generatedImages.map((img, idx) => (
              <div key={idx} className="relative group border border-violet-100 rounded overflow-hidden">
                <img src={img.url} alt={img.revisedPrompt || "Generated"} className="w-full h-20 object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                  <button
                    onClick={() => applyImage(img)}
                    className="bg-white text-violet-700 rounded px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                  >
                    <FaCheck /> Use
                  </button>
                  <a
                    href={img.url}
                    download={`${img.type}-${Date.now()}.png`}
                    className="bg-white text-gray-700 rounded px-2 py-1 text-[10px] font-bold flex items-center gap-1"
                  >
                    <FaDownload />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ColorSwatch({ label, color }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 rounded p-1">
      <span className="w-4 h-4 rounded border border-gray-200 flex-shrink-0" style={{ background: color }} />
      <div className="min-w-0">
        <p className="text-[9px] font-bold text-gray-500 uppercase leading-none">{label}</p>
        <p className="text-[9px] text-gray-700 font-mono truncate">{color}</p>
      </div>
    </div>
  );
}

const lbl = "block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1";