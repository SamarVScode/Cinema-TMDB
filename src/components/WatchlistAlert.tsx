import React from "react";
import { Info, CheckCircle, Heart } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface WatchlistAlertProps {
  isVisible: boolean;
  message: string;
}

export default function WatchlistAlert({ isVisible, message }: WatchlistAlertProps) {
  const isRemoval = message.toLowerCase().includes("remove") || message.toLowerCase().includes("emptied") || message.toLowerCase().includes("clear");

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          initial={{ opacity: 0, y: -25, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className={`fixed top-20 right-4 md:right-8 border backdrop-blur-xl px-5 py-3.5 rounded-2xl shadow-2xl z-50 flex items-center gap-3 ${
            isRemoval 
              ? "bg-black/95 border-pink-500/30 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)]" 
              : "bg-black/95 border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.15)]"
          }`}
        >
          {isRemoval ? (
            <Heart className="w-5 h-5 shrink-0 text-pink-500 fill-pink-500/20 animate-pulse" />
          ) : (
            <CheckCircle className="w-5 h-5 shrink-0 text-cyan-400 animate-bounce" />
          )}
          <span className="text-xs font-mono font-bold tracking-wide">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
