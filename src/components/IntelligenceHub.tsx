import React, { useState, useEffect } from "react";
import { Movie } from "../types";
import { 
  Bot, 
  Send, 
  Newspaper, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  Share2, 
  Sliders, 
  SlidersHorizontal,
  Globe2,
  Tv,
  FileText
} from "lucide-react";
import { motion } from "motion/react";

interface NewsArticle {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
}

interface IntelligenceHubProps {
  watchlist: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export default function IntelligenceHub({ watchlist, onSelectMovie }: IntelligenceHubProps) {
  // Telegram States
  const [botToken, setBotToken] = useState(() => {
    try {
      return localStorage.getItem("moodmatch_telegram_bot_token") || "";
    } catch {
      return "";
    }
  });
  
  const [chatId, setChatId] = useState(() => {
    try {
      return localStorage.getItem("moodmatch_telegram_chat_id") || "";
    } catch {
      return "";
    }
  });

  const [customMessage, setCustomMessage] = useState("");
  const [selectedMovieId, setSelectedMovieId] = useState<number | "">("");
  const [dispatchStatus, setDispatchStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Scraper States
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scraperError, setScraperError] = useState<string | null>(null);
  const [scraperLog, setScraperLog] = useState<string[]>([]);
  const [isLiveNews, setIsLiveNews] = useState(false);

  // Persist Bot credentials
  const handleSaveCredentials = () => {
    try {
      localStorage.setItem("moodmatch_telegram_bot_token", botToken.trim());
      localStorage.setItem("moodmatch_telegram_chat_id", chatId.trim());
      addLog("⚡ [CONFIG] Telegram credentials synchronized with local storage.");
    } catch (err) {
      addLog("❌ [CONFIG] Failed to write credentials to local storage.");
    }
  };

  const addLog = (msg: string) => {
    setScraperLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Scrape Cinema Bulletins
  const triggerScraper = async () => {
    setIsScraping(true);
    setScraperError(null);
    addLog("🌐 [CRAWLER] Activating cinema scraper pipeline...");
    addLog("🌐 [CRAWLER] Dispatching HTTP GET to Variety film feeds...");
    
    try {
      const response = await fetch("/api/scrape-news");
      if (!response.ok) {
        throw new Error(`Scraper API returned status ${response.status}`);
      }
      const data = await response.json();
      setNews(data.articles || []);
      setIsLiveNews(data.isLive);
      
      if (data.isLive) {
        addLog(`✅ [CRAWLER] Successfully extracted ${data.articles.length} news bulletins live!`);
      } else {
        addLog("⚠️ [CRAWLER] Feed timeout or offline. Resolved high-quality fallback bulletins.");
      }
    } catch (err: any) {
      setScraperError(err.message || "Failed to contact scraper pipeline.");
      addLog("❌ [CRAWLER] Scraping session aborted due to an internal exception.");
    } finally {
      setIsScraping(false);
    }
  };

  // Initial News load
  useEffect(() => {
    triggerScraper();
  }, []);

  // Telegram dispatch function
  const handleTelegramSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!botToken.trim() || !chatId.trim()) {
      setDispatchStatus("error");
      setDispatchError("Bot Token and Chat ID are mandatory to establish connection.");
      return;
    }

    setDispatchStatus("sending");
    setDispatchError(null);
    handleSaveCredentials();

    addLog("📤 [DISPATCH] Constructing message package...");

    const targetMovie = selectedMovieId ? watchlist.find(m => m.id === Number(selectedMovieId)) : null;

    try {
      const response = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          message: customMessage.trim() || undefined,
          movie: targetMovie || undefined
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to dispatch message.");
      }

      setDispatchStatus("success");
      addLog(`✨ [DISPATCH] Message successfully delivered to Telegram chat ID: ${chatId}`);
      setCustomMessage("");
      setTimeout(() => setDispatchStatus("idle"), 5000);
    } catch (err: any) {
      setDispatchStatus("error");
      setDispatchError(err.message || "Failed to dispatch message.");
      addLog("❌ [DISPATCH] Transmission failed. Verify bot token, chat ID, and privacy rules.");
    }
  };

  const handleQuickShareNews = async (article: NewsArticle) => {
    if (!botToken.trim() || !chatId.trim()) {
      alert("Please configure your Telegram Bot Token and Chat ID in the configuration panel first!");
      return;
    }
    
    addLog(`📤 [DISPATCH] Sharing news bulletin: "${article.title}"`);
    
    try {
      const text = `<b>📰 SCAPE BULLETINS: ${article.title.toUpperCase()}</b>\n\n` +
        `<i>${article.description}</i>\n\n` +
        `<a href="${article.link}">🔗 Read Full Article on ${article.source}</a>\n\n` +
        `<i>📡 Dispatched from Cinema Intelligence Center</i>`;

      const response = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: botToken.trim(),
          chatId: chatId.trim(),
          message: text
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to share.");
      }

      addLog(`✨ [DISPATCH] News shared successfully to Telegram!`);
      alert("News bulletin shared to Telegram chat!");
    } catch (err: any) {
      alert(`Failed to share: ${err.message}`);
      addLog(`❌ [DISPATCH] News share failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-10" id="intelligence-center">
      
      {/* HEADER SECTION */}
      <div className="p-6 md:p-8 bg-zinc-950/80 border border-zinc-900 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-950/50 border border-purple-500/30 rounded-xl text-[10px] text-purple-400 font-mono font-bold uppercase tracking-wider">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
              <span>Express Integration Active</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-display font-black text-white tracking-wide uppercase">
              Cinema Intelligence Hub
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Scrape real-time cinema headlines via direct web feeds and dispatch rich, formatted movie cards or custom updates directly to Telegram Chats using the bot pipeline.
            </p>
          </div>
          
          <button 
            onClick={triggerScraper}
            disabled={isScraping}
            className="px-5 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 text-black font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${isScraping ? "animate-spin" : ""}`} />
            <span>Refetch Web Feeds</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ==================== LEFT COLUMN: TELEGRAM DISPATCHER (lg:span-5) ==================== */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* CONFIGURATION & TRANSMISSION BOX */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl relative">
            <h3 className="font-mono text-xs font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2 pb-4 border-b border-zinc-900 mb-6">
              <Send className="w-4 h-4" />
              <span>Telegram Bot Transmitter</span>
            </h3>

            <form onSubmit={handleTelegramSend} className="space-y-5">
              
              {/* Token Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Bot Token
                </label>
                <input
                  type="password"
                  placeholder="E.g., 123456789:ABCdefGhIJKlmNoPQ..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                />
              </div>

              {/* Chat ID Input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Target Chat ID / Channel Username
                </label>
                <input
                  type="text"
                  placeholder="E.g., -100123456789 or @mychannel"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-purple-500/50 transition-colors font-mono"
                />
                <p className="text-[9px] text-zinc-500 font-mono">
                  Tip: Get chat IDs via <span className="text-purple-400">@userinfobot</span> or make the bot an admin in your public channel.
                </p>
              </div>

              {/* Watchlist Movie selector (Optional) */}
              <div className="space-y-1.5 pt-2 border-t border-zinc-900/50">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider block">
                  Select Movie Card (From Watchlist)
                </label>
                <select
                  value={selectedMovieId}
                  onChange={(e) => setSelectedMovieId(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  <option value="">-- Optional: Custom message only --</option>
                  {watchlist.map(movie => (
                    <option key={movie.id} value={movie.id}>
                      🎬 {movie.title} ({movie.vote_average.toFixed(1)} ★)
                    </option>
                  ))}
                </select>
                {watchlist.length === 0 && (
                  <span className="text-[9px] text-zinc-600 block mt-1 font-mono">
                    💡 Watchlist empty. Add some movies to dispatch formatted rich cards!
                  </span>
                )}
              </div>

              {/* Custom message input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Custom Text Alert (HTML Supported)
                </label>
                <textarea
                  placeholder="Enter custom notice or annotations..."
                  rows={4}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-purple-500/50 transition-colors font-sans"
                />
              </div>

              {/* Save Creds Button */}
              <div className="flex items-center justify-between gap-4 pt-2">
                <button
                  type="button"
                  onClick={handleSaveCredentials}
                  className="text-[10px] text-zinc-400 hover:text-white font-mono underline cursor-pointer"
                >
                  Save Credentials Locally
                </button>
                
                <button
                  type="submit"
                  disabled={dispatchStatus === "sending"}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-black font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {dispatchStatus === "sending" ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  ) : (
                    <Send className="w-4 h-4 text-black" />
                  )}
                  <span>Transmit Alert</span>
                </button>
              </div>

              {/* Dispatch status feedback */}
              {dispatchStatus === "success" && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Alert dispatched successfully! Check your Telegram.</span>
                </div>
              )}

              {dispatchStatus === "error" && (
                <div className="p-4 bg-red-950/40 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{dispatchError}</span>
                </div>
              )}

            </form>
          </div>

          {/* BACKGROUND CRAWLER CONSOLE */}
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-xl relative font-mono text-[10px]">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-3 border-b border-zinc-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
              <span>Pipeline Logs & Telemetry</span>
            </h4>
            <div className="bg-[#000000] border border-zinc-900 rounded-xl p-4 h-44 overflow-y-auto space-y-1.5 scrollbar-thin text-zinc-400 select-text">
              {scraperLog.length === 0 ? (
                <div className="text-zinc-600 italic">No logs generated. Refetch feeds or dispatch a message.</div>
              ) : (
                scraperLog.map((log, index) => (
                  <div key={index} className="leading-relaxed hover:text-white transition-colors">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* ==================== RIGHT COLUMN: LIVE MOVIE HEADLINES (lg:span-7) ==================== */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-xl relative min-h-[500px]">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-900 mb-6">
              <h3 className="font-mono text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                <span>Web Feed: Live Cinema Bulletins</span>
              </h3>
              
              <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md border ${
                isLiveNews 
                  ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20" 
                  : "bg-amber-950/40 text-amber-400 border-amber-500/20"
              }`}>
                {isLiveNews ? "📡 Real-time Scrape" : "💾 Offline Bulletins"}
              </span>
            </div>

            {/* ERROR FEEDBACK */}
            {scraperError && (
              <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 rounded-2xl text-xs mb-6 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Error contacting film feeds: {scraperError}. fallbacks resolved.</span>
              </div>
            )}

            {/* NEWS LIST */}
            {isScraping ? (
              <div className="space-y-6 py-12">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="space-y-3 animate-pulse">
                    <div className="flex gap-4">
                      <div className="h-4 bg-zinc-900 rounded-md w-1/3"></div>
                      <div className="h-4 bg-zinc-900 rounded-md w-1/6"></div>
                    </div>
                    <div className="h-10 bg-zinc-900 rounded-xl w-full"></div>
                    <div className="h-3 bg-zinc-900/50 rounded-md w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-5">
                {news.length === 0 ? (
                  <div className="text-center py-20 text-zinc-500 font-mono text-xs">
                    No cinematic news bulletins loaded.
                  </div>
                ) : (
                  news.map((article, index) => (
                    <motion.article 
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="p-5 bg-zinc-900/50 border border-zinc-900 hover:border-zinc-800 rounded-2xl space-y-3 transition-colors relative group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span className="text-cyan-400 font-bold uppercase">
                            [{article.source}]
                          </span>
                          <span className="text-zinc-500">
                            • {article.pubDate}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleQuickShareNews(article)}
                            className="p-1.5 bg-purple-950/30 border border-purple-500/20 text-purple-400 hover:bg-purple-600 hover:text-black rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                            title="Share article via Telegram Bot"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                          
                          <a
                            href={article.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg text-[9px] font-mono flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Read</span>
                          </a>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-sans font-bold text-sm text-zinc-150 group-hover:text-white transition-colors leading-snug">
                          {article.title}
                        </h4>
                        <p className="font-sans text-xs text-zinc-400 leading-relaxed">
                          {article.description}
                        </p>
                      </div>
                    </motion.article>
                  ))
                )}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
