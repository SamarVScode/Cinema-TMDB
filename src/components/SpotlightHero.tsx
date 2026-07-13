import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Award, Star, Play, Heart } from "lucide-react";
import { MoodIcon } from "./FilterSidebar";
import { SpotlightItem, Movie } from "../types";

interface SpotlightHeroProps {
  isDynamicHeroActive: boolean;
  heroTitle: string;
  heroYear: string;
  heroRating: number;
  heroBackdrop: string;
  heroOverview: string;
  heroQuote: string;
  heroTagline: string;
  heroMoodId: string;
  heroMoodName: string;
  spotlights: SpotlightItem[];
  activeSpotlightIdx: number;
  setActiveSpotlightIdx: (idx: number) => void;
  onExploreReviews: () => void;
  onInstantMatchMood: () => void;
  onToggleWatchlist: () => void;
  isFavorited: boolean;
}

export default function SpotlightHero({
  isDynamicHeroActive,
  heroTitle,
  heroYear,
  heroRating,
  heroBackdrop,
  heroOverview,
  heroQuote,
  heroTagline,
  heroMoodId,
  heroMoodName,
  spotlights,
  activeSpotlightIdx,
  setActiveSpotlightIdx,
  onExploreReviews,
  onInstantMatchMood,
  onToggleWatchlist,
  isFavorited,
}: SpotlightHeroProps) {

  return (
    <section className="w-full bg-black border-b border-zinc-900/60 pb-8 pt-4 px-4 md:px-8 relative overflow-hidden shrink-0 select-none">
      {/* Glowing Ambient Background Lights */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto space-y-4 relative">
        
        {/* Header / Dots Row */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono tracking-widest font-semibold text-amber-400 uppercase bg-amber-950/40 border border-amber-500/20 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 w-fit shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Award className="w-3.5 h-3.5 fill-amber-400 text-amber-400 animate-bounce" />
            <span>{isDynamicHeroActive ? "Top Curated Discovery Match" : "Trending Masterpieces"}</span>
          </span>

          {/* Slider Dots (Only show dots when rotating static showcases) */}
          {!isDynamicHeroActive && spotlights.length > 0 && (
            <div className="flex items-center gap-1.5 bg-zinc-950/90 px-3 py-2 rounded-full border border-zinc-900 shadow-md">
              {spotlights.map((spot, index) => (
                <button
                  key={`spot-dot-${spot.id}`}
                  onClick={() => setActiveSpotlightIdx(index)}
                  className={`h-2 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
                    activeSpotlightIdx === index 
                      ? "w-6 bg-gradient-to-r from-pink-500 to-cyan-400 shadow-[0_0_10px_rgba(236,72,153,0.5)]" 
                      : "w-2 bg-zinc-800 hover:bg-zinc-700"
                  }`}
                  aria-label={`Slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Immersive Cinematic Frame */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full h-[320px] md:h-[440px] rounded-3xl relative overflow-hidden border border-zinc-900 group/hero shadow-2xl shadow-black/80"
          id="hero-spotlight-display"
        >
          {/* Image backdrop */}
          <AnimatePresence mode="wait">
            <motion.img 
              key={heroTitle}
              src={heroBackdrop} 
              alt={heroTitle}
              referrerPolicy="no-referrer"
              initial={{ opacity: 0, filter: "brightness(0.3) blur(4px)" }}
              animate={{ opacity: 1, filter: "brightness(0.7) blur(0px)" }}
              exit={{ opacity: 0, filter: "brightness(0.3) blur(4px)" }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0 w-full h-full object-cover transform duration-700 group-hover/hero:scale-[1.015]"
            />
          </AnimatePresence>

          {/* Shadow Overlays */}
          <div className="absolute inset-y-0 left-0 w-2/3 bg-gradient-to-r from-black via-black/85 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-transparent to-black/30"></div>

          {/* Showcase Info blocks */}
          <div className="absolute inset-y-0 left-0 max-w-lg md:max-w-2xl p-6 md:p-10 flex flex-col justify-between z-10">
            
            {/* Mood and Rating badges */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 bg-pink-950/80 backdrop-blur-md text-pink-300 border border-pink-500/30 px-3 py-1 rounded-full text-[11px] font-extrabold shadow-[0_0_15px_rgba(236,72,153,0.25)]">
                <MoodIcon id={heroMoodId} className="w-3.5 h-3.5 text-pink-400" />
                <span>{heroMoodName}</span>
              </span>
              <span className="bg-zinc-950/95 backdrop-blur-md border border-zinc-800 px-3 py-1 rounded-full text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.15)]">
                <Star className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400 shrink-0" />
                <span>{heroRating.toFixed(1)} Rating</span>
              </span>
            </div>

            {/* Plot text info */}
            <AnimatePresence mode="wait">
              <motion.div 
                key={heroTitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className="space-y-2 md:space-y-3 pt-6"
              >
                <h3 className="font-display font-extrabold text-xl md:text-3xl text-white tracking-widest leading-none uppercase">
                  {heroTitle} <span className="text-zinc-550 text-base md:text-lg font-mono">({heroYear})</span>
                </h3>
                <p className="text-zinc-300 text-xs md:text-sm font-semibold tracking-wide italic leading-relaxed border-l-2 border-pink-500 pl-3 line-clamp-2 md:line-clamp-3 font-sans">
                  "{heroQuote}"
                </p>
                <p className="text-zinc-550 text-xs max-w-md hidden md:block leading-relaxed font-sans line-clamp-2">
                  {heroTagline}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Play, reviews, favoriting row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              {isDynamicHeroActive ? (
                <motion.button
                  whileHover={{ scale: 1.03, shadow: "0 0 20px rgba(236,72,153,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onExploreReviews}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-rose-400 text-black text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer text-center focus:outline-none"
                >
                  <Play className="w-3.5 h-3.5 fill-black stroke-none" />
                  <span>Explore Movie Reviews</span>
                </motion.button>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.03, shadow: "0 0 20px rgba(34,211,238,0.4)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={onInstantMatchMood}
                  className="px-5 py-2.5 bg-gradient-to-r from-cyan-400 to-indigo-500 text-black text-xs font-bold rounded-xl shadow-lg transition-all flex items-center gap-1.5 cursor-pointer text-center focus:outline-none"
                >
                  <Play className="w-3.5 h-3.5 fill-black stroke-none" />
                  <span>Instant Match Mood</span>
                </motion.button>
              )}

              {!isDynamicHeroActive && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onExploreReviews}
                  className="px-4 py-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  View Reviews
                </motion.button>
              )}

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onToggleWatchlist}
                className="p-2.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-pink-500 transition-colors cursor-pointer focus:outline-none"
                aria-label="Toggle watchlist"
              >
                <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorited ? "fill-pink-500 text-pink-500 scale-110" : "text-zinc-600"}`} />
              </motion.button>
            </div>

          </div>

          {/* Corner badge */}
          <div className="absolute top-4 right-4 bg-zinc-900/90 backdrop-blur-md px-3 py-1 rounded-lg border border-zinc-850 text-pink-500 font-mono text-[9px] font-bold tracking-widest select-none uppercase shadow-md">
            {isDynamicHeroActive ? "Top Selection" : "Premium Showcase"}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
