import React from "react";
import { Movie, GENRE_MAP, WatchlistItem } from "../types";
import { Star, Eye, Calendar, Languages, Heart, Sparkles, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getMoodForMovie } from "../tmdb";
import { MoodIcon } from "./FilterSidebar";

interface MovieGridProps {
  movies: Movie[];
  loading: boolean;
  onOpenReviews: (movie: Movie) => void;
  watchlist: WatchlistItem[];
  onToggleWatchlist: (movie: Movie) => void;
  onReset: () => void;
  onClickMovie?: (movie: Movie) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

// Custom category badge colors based on resolved Mood ID
const getMoodBadgeStyle = (moodId: string) => {
  switch (moodId) {
    case "comedy":
      return "text-amber-400 bg-amber-950/25 border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.12)]";
    case "adrenaline":
      return "text-orange-400 bg-orange-950/25 border-orange-500/30 shadow-[0_0_8px_rgba(249,115,22,0.12)]";
    case "horror":
      return "text-violet-400 bg-violet-950/25 border-violet-500/30 shadow-[0_0_8px_rgba(139,92,246,0.12)]";
    case "thoughtful":
      return "text-indigo-400 bg-indigo-950/25 border-indigo-500/30 shadow-[0_0_8px_rgba(129,140,248,0.12)]";
    case "feelgood":
      return "text-pink-400 bg-pink-950/25 border-pink-500/30 shadow-[0_0_8px_rgba(236,72,153,0.12)]";
    case "family":
      return "text-emerald-400 bg-emerald-950/25 border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.12)]";
    case "mystery":
      return "text-cyan-400 bg-cyan-950/25 border-cyan-500/30 shadow-[0_0_8px_rgba(6,182,212,0.12)]";
    case "documentary":
      return "text-lime-400 bg-lime-950/25 border-lime-500/30 shadow-[0_0_8px_rgba(132,204,22,0.12)]";
    case "adult":
      return "text-red-400 bg-red-950/25 border-red-500/30 shadow-[0_0_8px_rgba(239,68,68,0.12)]";
    default:
      return "text-pink-400 bg-pink-950/20 border-pink-900/40";
  }
};

export default function MovieGrid({
  movies,
  loading,
  onOpenReviews,
  watchlist,
  onToggleWatchlist,
  onReset,
  onClickMovie,
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: MovieGridProps) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!onLoadMore || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      {
        rootMargin: "300px",
      }
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }

    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [onLoadMore, hasMore, loading, loadingMore]);

  // Custom rating badge colors based on score (Neon Popping theme)
  const getRatingBadgeClass = (score: number) => {
    if (score >= 8.0) {
      return "bg-emerald-950/65 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
    }
    if (score >= 7.0) {
      return "bg-cyan-950/65 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]";
    }
    return "bg-pink-950/65 text-pink-400 border border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.2)]";
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Desktop Skeleton */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div 
              key={idx} 
              className="bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[480px] animate-pulse"
            >
              <div className="relative h-64 bg-zinc-900/30 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-zinc-800 animate-pulse" />
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="h-5 bg-zinc-900 rounded-lg w-3/4"></div>
                  <div className="h-3 bg-zinc-900/60 rounded-lg w-1/2"></div>
                </div>
                <div className="space-y-1.5 flex-1 mt-2">
                  <div className="h-3 bg-zinc-900/40 rounded-lg w-full"></div>
                  <div className="h-3 bg-zinc-900/40 rounded-lg w-full"></div>
                </div>
                <div className="h-11 bg-zinc-900 rounded-xl w-full mt-4"></div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Skeleton */}
        <div className="block md:hidden space-y-4">
          <div className="h-4 bg-zinc-900 rounded-lg w-1/3 animate-pulse mb-3"></div>
          <div className="flex gap-4 overflow-hidden">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-900 rounded-2xl w-[260px] h-[380px] shrink-0 animate-pulse p-4 flex flex-col justify-between">
                <div className="h-48 bg-zinc-900 rounded-xl"></div>
                <div className="h-4 bg-zinc-900 rounded-lg w-3/4 mt-3"></div>
                <div className="h-10 bg-zinc-900 rounded-lg w-full mt-4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="text-center py-16 px-4 bg-zinc-950/80 border border-zinc-900 rounded-3xl shadow-2xl flex flex-col items-center justify-center max-w-lg mx-auto"
      >
        <div className="bg-pink-500/5 p-4 rounded-full border border-pink-500/15 text-pink-500 mb-4 animate-bounce">
          <Star className="w-8 h-8 fill-pink-500 text-pink-400" />
        </div>
        <h3 className="font-display font-extrabold text-lg text-white tracking-widest uppercase">No Matches for Your Mood</h3>
        <p className="text-zinc-400 text-xs mt-3 max-w-sm leading-relaxed font-sans">
          Your combined filter coordinates are extremely specific. Try lowering your minimum rating, choosing "All Masterpieces", or resetting the search engine parameters.
        </p>
        <button
          onClick={onReset}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 via-purple-600 to-cyan-400 hover:opacity-90 text-black font-black rounded-xl text-xs hover:shadow-[0_0_20px_rgba(236,72,153,0.3)] transition-all flex items-center gap-2 cursor-pointer focus:outline-none"
          id="btn-no-results-reset"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Filter Engine</span>
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-10">
      
      {/* ==========================================
          🎬 UNIFIED SENSORY MOVIE CATALOG GRID (DOWN SCROLLING)
          ========================================== */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" 
        id="movies-discover-grid"
      >
        <AnimatePresence mode="popLayout">
          {movies.map((movie, index) => {
            const isFavorited = watchlist.some(w => w.id === movie.id);
            const releaseYear = movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : "N/A";
              
            return (
              <motion.article
                key={movie.id}
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.25 } }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -6, scale: 1.015, transition: { duration: 0.25, ease: "easeOut" } }}
                className="group bg-zinc-950/80 border border-zinc-900 hover:border-pink-500/45 hover:shadow-[0_0_25px_rgba(236,72,153,0.15)] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[480px] select-none transition-[border-color,box-shadow,background-color] duration-300"
                id={`movie-card-${movie.id}`}
              >
              {/* Poster Element */}
              <div 
                onClick={() => onClickMovie?.(movie)}
                className="relative h-64 overflow-hidden bg-black shrink-0 cursor-pointer"
              >
                <img
                  src={movie.poster_path}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-85"></div>
                
                {/* Live Rank Badge */}
                <div className="absolute top-3 left-3 bg-black/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-zinc-800 text-zinc-400 text-[9px] font-mono font-bold tracking-wider uppercase select-none">
                  # {index + 1} Recommendation
                </div>

                {/* Watchlist Quick Heart Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist(movie);
                  }}
                  className="absolute top-3 right-3 p-2 bg-black/80 hover:bg-black backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 hover:text-pink-500 focus:text-pink-500 transition-all cursor-pointer focus:outline-none"
                  aria-label="Add to Watchlist"
                  id={`watch-toggle-${movie.id}`}
                >
                  <Heart className={`w-4 h-4 transition-all duration-300 ${isFavorited ? "fill-pink-500 text-pink-500 scale-110" : "text-zinc-650 group-hover:scale-110"}`} />
                </button>
              </div>

              {/* Card Content body */}
              <div className="p-5 flex-1 flex flex-col justify-between overflow-hidden">
                <div 
                  onClick={() => onClickMovie?.(movie)}
                  className="space-y-2 cursor-pointer flex-1"
                >
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-display font-extrabold text-sm md:text-base text-zinc-200 group-hover:text-white line-clamp-1 group-hover:line-clamp-2 transition-colors leading-snug">
                      {movie.title}
                    </h3>
                    
                    {/* Score Badge */}
                    <div className={`px-2 py-0.5 rounded font-mono text-[10px] font-extrabold shrink-0 ${getRatingBadgeClass(movie.vote_average)}`}>
                      {movie.vote_average.toFixed(1)}
                    </div>
                  </div>

                  {/* Sub-meta details row */}
                  <div className="flex items-center gap-3 text-zinc-500 text-xs font-bold font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-zinc-650" />
                      <span>{releaseYear}</span>
                    </span>
                    <span className="text-zinc-800">•</span>
                    <span className="flex items-center gap-1 uppercase tracking-wider">
                      <Languages className="w-3.5 h-3.5 text-zinc-650" />
                      <span>{movie.original_language}</span>
                    </span>
                  </div>

                  {/* Genre tags */}
                  {movie.genre_ids && movie.genre_ids.length > 0 && (() => {
                    const moodInfo = getMoodForMovie(movie.genre_ids, movie.adult);
                    const badgeStyle = getMoodBadgeStyle(moodInfo.id);
                    return (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <span className={`text-[10px] font-mono font-black tracking-wider uppercase px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${badgeStyle}`}>
                          <MoodIcon id={moodInfo.id} className="w-3 h-3 text-current" />
                          <span>{moodInfo.name}</span>
                        </span>
                        
                        {movie.genre_ids.map((gId) => {
                          const label = GENRE_MAP[gId];
                          if (!label || label.toLowerCase() === moodInfo.name.toLowerCase()) return null;
                          return (
                            <span 
                              key={gId} 
                              className="text-[9px] font-mono font-medium tracking-tight text-zinc-500 bg-zinc-900/40 border border-zinc-900/60 px-1.5 py-0.5 rounded-md"
                            >
                              {label}
                            </span>
                          );
                        }).filter(Boolean).slice(0, 2)}
                      </div>
                    );
                  })()}

                  {/* Snippet summary */}
                  <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 group-hover:line-clamp-3 transition-all duration-350 pt-1 font-sans">
                    {movie.overview}
                  </p>
                </div>

                {/* View Reviews CTA button */}
                <div className="pt-4 shrink-0">
                  <button
                    onClick={() => onOpenReviews(movie)}
                    className="w-full py-2.5 bg-zinc-900/30 border border-zinc-900 text-zinc-400 group-hover:text-white group-hover:bg-pink-950/20 group-hover:border-pink-500/30 hover:border-pink-500/50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-350 cursor-pointer active:scale-[0.98] focus:outline-none"
                    id={`btn-reviews-${movie.id}`}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0 text-pink-400" />
                    <span>View Reviews</span>
                  </button>
                </div>
              </div>
            </motion.article>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Infinite Scroll Sentinel indicator */}
      {onLoadMore && hasMore && (
        <div ref={sentinelRef} className="py-8 w-full flex items-center justify-center border-t border-zinc-900/30 mt-6">
          <div className="flex items-center gap-2 text-pink-400 font-mono text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
            <span>Aligning more matched films...</span>
          </div>
        </div>
      )}

    </div>
  );
}
