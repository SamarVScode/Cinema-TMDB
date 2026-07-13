import React, { useEffect, useState } from "react";
import { Movie, Review } from "../types";
import { getMovieReviews } from "../tmdb";
import { X, MessageSquare, Star, Sparkles, User, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ReviewDrawerProps {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
}

export default function ReviewDrawer({ movie, isOpen, onClose, apiKey }: ReviewDrawerProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !movie) return;

    let active = true;
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const reviewsList = await getMovieReviews(apiKey, movie.id, movie.title);
        if (active) {
          setReviews(reviewsList);
        }
      } catch (error) {
        console.info("Info handling loaded reviews inside drawer fallback:", error);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchReviews();

    return () => {
      active = false;
    };
  }, [movie, isOpen, apiKey]);

  // Handle ESC close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && movie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Overlay with fade-in */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md"
            onClick={onClose}
            id="review-modal-backdrop"
          />

          {/* Dialog Frame */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="w-full max-w-2xl bg-zinc-950 border border-pink-500/20 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(236,72,153,0.15)] flex flex-col max-h-[85vh] relative z-10"
            onClick={(e) => e.stopPropagation()}
            id="review-modal-card"
          >
            {/* Modal Header */}
            <div className="p-5 md:p-6 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-pink-500 to-cyan-400"></div>
              
              <div className="flex items-center gap-3">
                <div className="bg-pink-500/10 p-2.5 rounded-xl text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.2)]">
                  <MessageSquare className="w-5 h-5 text-pink-500" />
                </div>
                <div>
                  <h2 className="font-display font-black text-lg text-white tracking-widest uppercase bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">
                    Community Reviews
                  </h2>
                  <p className="text-[10px] text-pink-500 font-extrabold font-mono tracking-widest uppercase mt-1">
                    {movie.title}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-full transition-all focus:outline-none cursor-pointer border border-transparent hover:border-zinc-800"
                aria-label="Close dialog"
                id="btn-close-modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Contents */}
            <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
              
              {/* Quick Movie Highlight card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-black border border-zinc-900 p-4 rounded-2xl select-none hover:border-zinc-800 transition-colors">
                {/* Miniature Poster cover */}
                <div className="h-44 sm:h-auto rounded-xl overflow-hidden bg-zinc-900">
                  <img 
                    src={movie.poster_path} 
                    alt={movie.title} 
                    referrerPolicy="no-referrer"
                    loading="lazy" 
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Quick specifications */}
                <div className="sm:col-span-2 flex flex-col justify-between space-y-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-extrabold text-sm md:text-base text-white">{movie.title}</h3>
                      <div className="px-2.5 py-0.5 rounded font-mono text-[10px] font-extrabold shrink-0 bg-pink-950/40 text-pink-400 border border-pink-500/20 shadow-[0_0_10px_rgba(236,72,153,0.15)]">
                        ★ {movie.vote_average.toFixed(1)}
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-mono font-bold">Theatrical Release: {movie.release_date || "N/A"}</p>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed italic font-sans border-l-2 border-pink-500 pl-3">
                    {movie.overview}
                  </p>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4">
                <h4 className="font-display font-bold text-xs text-zinc-400 tracking-wider uppercase flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Verified Critiques ({loading ? "..." : reviews.length})</span>
                </h4>

                {loading ? (
                  <div className="space-y-4 py-12 text-center bg-black p-6 rounded-2xl border border-dashed border-zinc-800">
                    <div className="relative inline-flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full border-2 border-pink-500 border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-xs text-zinc-500 font-semibold tracking-wide">Syncing critiques from server journals...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="py-10 text-center bg-black border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-zinc-700 mb-2.5" />
                    <h5 className="text-xs font-bold uppercase tracking-wide text-zinc-500">No community reviews found</h5>
                    <p className="text-[11px] text-zinc-650 mt-1 max-w-xs">Be the first to leave a critique on the TMDB master registries!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((rev, index) => (
                      <motion.div 
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: index * 0.05 }}
                        className="p-4 bg-black border border-zinc-900 rounded-2xl space-y-3 hover:border-cyan-500/20 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                              <User className="w-3.5 h-3.5 text-zinc-450" />
                            </div>
                            <span className="text-xs font-bold text-zinc-300 font-mono">@{rev.author}</span>
                          </div>
                          <span className="text-[9px] font-extrabold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded uppercase font-mono tracking-wider border border-cyan-500/10 select-none shadow-[0_0_8px_rgba(34,211,238,0.15)]">
                            Critic
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed max-h-40 overflow-y-auto pr-1 whitespace-pre-line font-sans">
                          {rev.content}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-end gap-3 rounded-b-3xl">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white border border-zinc-800 rounded-xl text-xs font-bold cursor-pointer active:scale-95 transition-all focus:outline-none"
                id="btn-modal-close-footer"
              >
                Close View
              </button>
            </div>
          </motion.div>

        </div>
      )}
    </AnimatePresence>
  );
}
