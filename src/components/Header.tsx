import React, { useState } from "react";
import { Film, Sparkles, Heart, Search, Key, Check, Bot } from "lucide-react";
import { motion } from "motion/react";

interface HeaderProps {
  watchlistCount: number;
  activeTab: "showcase" | "search" | "wishlist" | "intelligence";
  setActiveTab: (tab: "showcase" | "search" | "wishlist" | "intelligence") => void;
  apiKey: string;
  onChangeApiKey: (key: string) => void;
  onResetAll: () => void;
  mediaType: "movie" | "tv";
  setMediaType: (mediaType: "movie" | "tv") => void;
}

export default function Header({
  watchlistCount,
  activeTab,
  setActiveTab,
  apiKey,
  onChangeApiKey,
  onResetAll,
  mediaType,
  setMediaType
}: HeaderProps) {
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [tempKey, setTempKey] = useState(apiKey);

  const handleSaveKey = () => {
    onChangeApiKey(tempKey);
    setShowKeyInput(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-black/95 backdrop-blur-md border-b border-zinc-900 z-40 flex items-center justify-between px-4 md:px-8 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
      {/* Glow highlight line on top */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400"></div>
      
      {/* App Logo */}
      <motion.div 
        onClick={() => {
          onResetAll();
          setActiveTab("showcase");
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2.5 cursor-pointer group"
        id="app-branding"
      >
        <div className="bg-gradient-to-tr from-pink-500 via-purple-600 to-cyan-400 p-2 rounded-xl shadow-[0_0_15px_rgba(236,72,153,0.3)] group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
          <Film className="w-5 h-5 text-black stroke-[2.5]" />
        </div>
        <h1 className="font-display font-black text-lg md:text-xl tracking-widest text-white flex items-center gap-1.5 selection:bg-pink-500/30">
          <span className="bg-gradient-to-r from-pink-500 via-purple-400 to-cyan-400 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
            MoodMatch
          </span>
        </h1>
      </motion.div>

      {/* Navigation Controls */}
      <nav className="flex items-center gap-2 sm:gap-4 md:gap-5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("showcase")}
          className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 focus:outline-none cursor-pointer tracking-wider ${
            activeTab === "showcase" 
              ? "bg-zinc-900/90 text-amber-400 border border-amber-500/35 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
              : "text-zinc-400 hover:text-white"
          }`}
          id="btn-nav-showcase"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden sm:inline">Showcase</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("search")}
          className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 focus:outline-none cursor-pointer tracking-wider ${
            activeTab === "search" 
              ? "bg-zinc-900/90 text-cyan-400 border border-cyan-500/35 shadow-[0_0_12px_rgba(34,211,238,0.2)]"
              : "text-zinc-400 hover:text-white"
          }`}
          id="btn-nav-search"
        >
          <Search className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Discovery</span>
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("wishlist")}
          className={`relative px-4.5 py-1.5 rounded-full transition-all duration-300 flex items-center gap-1.5 text-xs font-black focus:outline-none cursor-pointer tracking-wider ${
            activeTab === "wishlist"
              ? "bg-zinc-900/90 text-pink-400 border border-pink-500/35 shadow-[0_0_12px_rgba(236,72,153,0.2)]"
              : "text-zinc-400 hover:text-white"
          }`}
          id="btn-nav-watchlist"
        >
          <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${watchlistCount > 0 ? "fill-pink-500 text-pink-500 animate-pulse scale-110" : "text-zinc-500"}`} />
          <span className="hidden sm:inline">Wishlist</span>
          {watchlistCount > 0 && (
            <motion.span 
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className="bg-pink-600 text-black font-mono text-[9px] w-5 h-5 flex items-center justify-center rounded-full border border-black font-extrabold"
            >
              {watchlistCount}
            </motion.span>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("intelligence")}
          className={`px-4.5 py-1.5 rounded-full text-xs font-black transition-all duration-300 flex items-center gap-1.5 focus:outline-none cursor-pointer tracking-wider ${
            activeTab === "intelligence" 
              ? "bg-zinc-900/90 text-purple-400 border border-purple-500/35 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              : "text-zinc-400 hover:text-white"
          }`}
          id="btn-nav-intelligence"
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">Intelligence</span>
        </motion.button>

        {/* Type Toggle for Movie/TV mode */}
        <div className="flex bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 ml-4 hidden sm:flex">
          <button
            onClick={() => setMediaType("movie")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
              mediaType === "movie"
                ? "bg-pink-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Movies
          </button>
          <button
            onClick={() => setMediaType("tv")}
            className={`px-3 py-1 text-[10px] font-bold rounded-md uppercase tracking-wider ${
              mediaType === "tv"
                ? "bg-pink-500 text-black shadow-md"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            TV Shows
          </button>
        </div>

        {/* Dynamic API Key Badge Selector */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all duration-300 ${
              apiKey && apiKey.length > 15
                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-900/40"
                : "bg-red-950/40 text-red-400 border border-red-500/30 animate-pulse hover:bg-red-900/40"
            }`}
            id="btn-api-key-config"
          >
            <Key className="w-3 h-3" />
            <span className="hidden md:inline">{apiKey ? "API Key: Active" : "Key Needed"}</span>
          </motion.button>

          {showKeyInput && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 mt-3 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl w-64 z-50 space-y-3"
            >
              <h4 className="text-xs font-mono font-extrabold text-[#ffffff] uppercase tracking-wide">
                TMDB API Gateway Key
              </h4>
              <p className="text-[10px] text-zinc-500">
                Supply your custom TMDB API key to load live streams:
              </p>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="Paste v3 API key..."
                  value={tempKey}
                  onChange={(e) => setTempKey(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] px-2.5 py-1.5 focus:outline-none focus:border-pink-500/50 text-zinc-200"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSaveKey}
                  className="p-1.5 bg-pink-600 hover:bg-pink-500 text-black rounded-lg px-2.5 text-xs font-bold cursor-pointer transition-colors"
                >
                  <Check className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </nav>
    </header>
  );
}
