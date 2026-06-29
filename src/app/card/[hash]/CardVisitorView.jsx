"use client";

import { useState, useRef, useEffect } from "react";
import { generateCardDocument } from "@/lib/templates";
import {
  FaRobot, FaPaperPlane, FaTimes, FaQrcode, FaShareAlt, FaSpinner,
  FaCopy, FaCheck, FaHandSparkles, FaChartBar
} from "react-icons/fa";

function getOrCreateSessionId() {
  if (typeof window === "undefined") return "ssr-session";
  let sid = sessionStorage.getItem("card_chat_session");
  if (!sid) {
    sid = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    sessionStorage.setItem("card_chat_session", sid);
  }
  return sid;
}

export function CardVisitorView({ card }) {
  const [chatOpen, setChatOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewCount, setViewCount] = useState(null);

  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", content: `Hi! I'm the AI Assistant for ${card.name}. Ask me anything about ${card.name}'s professional background, skills, or contact info!` }
  ]);
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [intentInfo, setIntentInfo] = useState(null);

  const chatEndRef = useRef(null);
  const sessionId = useRef(getOrCreateSessionId());

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingText]);

  // Fetch view count for this card
  useEffect(() => {
    fetch(`/api/analytics?urlHash=${card.urlHash}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setViewCount(d.views); })
      .catch(() => {});
  }, [card.urlHash]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage = { role: "user", content: query.trim() };
    setMessages(prev => [...prev, userMessage]);
    const currentQuery = query.trim();
    setQuery("");
    setLoading(true);
    setStreamingText("");

    // Analyze intent in parallel
    fetch("/api/chat/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: currentQuery }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setIntentInfo(d); })
      .catch(() => {});

    try {
      const res = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urlHash: card.urlHash,
          query: currentQuery,
          chatHistory: messages,
          sessionId: sessionId.current,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "delta") {
                accumulated += data.text;
                setStreamingText(accumulated);
              } else if (data.type === "done") {
                if (accumulated) {
                  setMessages(prev => [...prev, { role: "assistant", content: accumulated }]);
                  setStreamingText("");
                }
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (e) {
              // ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
      setStreamingText("");
    } finally {
      setLoading(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    typeof window !== "undefined" ? window.location.href : ""
  )}`;

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-slate-950 text-slate-100 font-sans relative overflow-hidden h-full min-h-screen">

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(124,58,237,0.15),rgba(255,255,255,0))] z-0"></div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">

        <div className="w-full max-w-md flex items-center justify-between mb-4 bg-slate-900/60 backdrop-blur-md border border-slate-800 p-3 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400">Digital Business Card</span>
            {viewCount !== null && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                <FaChartBar className="text-[8px]" /> {viewCount} views
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setQrOpen(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl p-2.5 text-sm flex items-center justify-center active:scale-95 transition-all"
              title="Show QR Code"
            >
              <FaQrcode />
            </button>
            <button
              onClick={handleCopyLink}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl p-2.5 text-sm flex items-center justify-center active:scale-95 transition-all"
              title="Copy URL Link"
            >
              {copied ? <FaCheck className="text-emerald-500" /> : <FaShareAlt />}
            </button>
          </div>
        </div>

        <div className="w-full max-w-md aspect-[9/16] max-h-[680px] bg-slate-900 rounded-[36px] border-8 border-slate-800 shadow-2xl relative flex flex-col overflow-hidden">
          <iframe
            title="Business Card"
            className="w-full h-full border-none bg-slate-900"
            srcDoc={generateCardDocument(card)}
            sandbox="allow-scripts"
          />
        </div>
      </div>

      {card.showAiAssistant && !chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full p-4 shadow-xl active:scale-95 hover:shadow-indigo-500/25 transition-all flex items-center gap-2 font-bold text-sm cursor-pointer border border-violet-500/30"
        >
          <FaRobot className="text-lg animate-bounce" />
          <span>Ask AI Assistant</span>
        </button>
      )}

      {card.showAiAssistant && chatOpen && (
        <div className="fixed bottom-0 right-0 md:bottom-6 md:right-6 w-full md:w-[380px] h-[500px] md:h-[550px] bg-slate-900 border-t md:border border-slate-800 rounded-t-3xl md:rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-up">

          <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400">
                <FaRobot />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  {card.name}'s AI Clone
                  <FaHandSparkles className="text-[10px] text-violet-400" />
                </h3>
                <span className="text-[10px] text-slate-400 block">Streaming · powered by OpenAI</span>
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all"
            >
              <FaTimes />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-900/40">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col max-w-[85%] ${
                  m.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <span className="text-[9px] font-bold text-slate-500 mb-0.5 uppercase">
                  {m.role === "user" ? "You" : card.name?.split(" ")[0] || "AI Clone"}
                </span>
                <div
                  className={`px-3 py-2.5 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? "bg-violet-600 text-white rounded-tr-none"
                      : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {streamingText && (
              <div className="flex flex-col items-start max-w-[85%]">
                <span className="text-[9px] font-bold text-slate-500 mb-0.5 uppercase">
                  {card.name?.split(" ")[0]} (AI)
                </span>
                <div className="bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2.5 rounded-2xl rounded-tl-none text-xs leading-relaxed">
                  {streamingText}
                  <span className="inline-block w-1.5 h-3 bg-violet-400 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}
            {loading && !streamingText && (
              <div className="flex flex-col items-start max-w-[80%]">
                <span className="text-[9px] font-bold text-slate-500 mb-0.5 uppercase">
                  {card.name?.split(" ")[0]} (AI)
                </span>
                <div className="bg-slate-800 text-slate-400 border border-slate-700 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <FaSpinner className="animate-spin text-violet-500 text-xs" />
                  <span className="text-[10px] italic">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form
            onSubmit={handleSendChat}
            className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-3 py-2 text-xs font-bold flex items-center justify-center disabled:opacity-50 transition-all"
            >
              <FaPaperPlane />
            </button>
          </form>
        </div>
      )}

      {qrOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm text-center relative animate-zoom-in">
            <button
              onClick={() => setQrOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition-all"
            >
              <FaTimes />
            </button>

            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Scan QR Code</h3>
            <p className="text-xs text-slate-400 mb-6">Scan this QR code to view this digital card on your mobile phone</p>

            <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-xl">
              <img src={qrCodeUrl} alt="Card QR Code" className="w-48 h-48" />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-2 px-3 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                {copied ? (
                  <>
                    <FaCheck className="text-emerald-500" />
                    <span>Link Copied!</span>
                  </>
                ) : (
                  <>
                    <FaCopy />
                    <span>Copy Card Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}