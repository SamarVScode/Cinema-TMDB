import React from "react";
import { Sparkles } from "lucide-react";
import { MOODS, MoodIcon } from "./FilterSidebar";
import { motion } from "motion/react";

interface SensoryMoodSelectorProps {
  currentMood: string | null;
  onSelectMood: (moodId: string | null) => void;
  onExploreAll: () => void;
}

export default function SensoryMoodSelector({
  currentMood,
  onSelectMood,
  onExploreAll,
}: SensoryMoodSelectorProps) {

  // Dynamic Neon Active Styles for popping eye scheme
  const getPoppingActiveStyle = (id: string) => {
    switch (id) {
      case "comedy":
        return "border-amber-400 text-amber-300 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3)] font-black border-2";
      case "adrenaline":
        return "border-orange-500 text-orange-300 bg-orange-950/40 shadow-[0_0_15px_rgba(249,115,22,0.3)] font-black border-2";
      case "horror":
        return "border-violet-500 text-violet-300 bg-violet-950/40 shadow-[0_0_15px_rgba(139,92,246,0.3)] font-black border-2";
      case "thoughtful":
        return "border-indigo-400 text-indigo-300 bg-indigo-950/40 shadow-[0_0_15px_rgba(129,140,248,0.3)] font-black border-2";
      case "feelgood":
        return "border-pink-500 text-pink-300 bg-pink-950/40 shadow-[0_0_15px_rgba(236,72,153,0.3)] font-black border-2";
      case "family":
        return "border-emerald-400 text-emerald-300 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black border-2";
      case "mystery":
        return "border-cyan-400 text-cyan-300 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] font-black border-2";
      case "documentary":
        return "border-lime-400 text-lime-300 bg-lime-950/40 shadow-[0_0_15px_rgba(132,204,22,0.3)] font-black border-2";
      case "adult":
        return "border-red-500 text-red-400 bg-red-950/50 shadow-[0_0_20px_rgba(239,68,68,0.4)] animate-pulse font-black border-2";
      default:
        return "border-pink-500 text-pink-300 bg-pink-950/30";
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <section className="w-full bg-black pt-6 pb-6 px-4 md:px-8 shrink-0 select-none border-b border-zinc-900/40 relative">
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-pink-500/20 to-transparent"></div>
      
      <div className="max-w-7xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono tracking-[0.3em] font-extrabold text-pink-500 uppercase drop-shadow-[0_0_6px_rgba(236,72,153,0.4)]">
              Sensory Frequencies
            </span>
            <h2 className="font-display font-extrabold text-base md:text-lg text-white tracking-widest uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Explore Curated Moods
            </h2>
          </div>
          <p className="text-zinc-500 text-[11px] hidden sm:block tracking-wide">
            Tap on any sensory mood frequency to tune into live recommendations instantly.
          </p>
        </div>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 -mx-4 px-4 md:mx-0 md:px-0"
        >
          <motion.button
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onExploreAll}
            className={`flex items-center gap-1.5 px-4 md:px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all duration-300 active:scale-95 cursor-pointer ${
              currentMood === null
                ? "bg-zinc-900 border-pink-500/50 text-pink-400 shadow-[0_0_15px_rgba(236,72,153,0.2)] font-black"
                : "bg-zinc-950/75 border-zinc-900 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className={`w-4 h-4 ${currentMood === null ? "text-pink-400 animate-spin" : "text-amber-500"}`} />
            <span>All Masterpieces</span>
          </motion.button>

          {MOODS.map((m) => {
            const isSelected = currentMood === m.id;
            return (
              <motion.button
                key={`top-mood-${m.id}`}
                variants={itemVariants}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectMood(currentMood === m.id ? null : m.id)}
                className={`flex items-center gap-2.5 px-4.5 md:px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap shrink-0 border transition-all duration-300 active:scale-95 cursor-pointer tracking-wider ${
                  isSelected
                    ? getPoppingActiveStyle(m.id)
                    : "bg-zinc-950/75 border-zinc-900 text-zinc-500 hover:text-zinc-350 hover:border-zinc-800"
                }`}
              >
                <MoodIcon id={m.id} className={`w-4 h-4 transition-all duration-300 ${isSelected ? "text-white scale-110" : "text-zinc-500"}`} />
                <span>{m.label}</span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
