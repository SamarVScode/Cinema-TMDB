import React, { useState, useRef, useEffect } from "react";
import { Movie } from "../types";
import { Heart, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface CinematicRowProps {
  title: string;
  subtitle: string;
  movies: Movie[];
  onOpenReviews: (movie: Movie) => void;
  watchlist: number[];
  onToggleWatchlist: (movie: Movie) => void;
  accentColor?: string;
  isMature?: boolean;
  onClickMovie?: (movie: Movie) => void;
}

export default function CinematicRow({
  title,
  subtitle,
  movies = [],
  onOpenReviews,
  watchlist,
  onToggleWatchlist,
  accentColor = "text-pink-500",
  isMature = false,
  onClickMovie
}: CinematicRowProps) {
  const [locked, setLocked] = useState(isMature);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  // Dynamic border glow styling matching the accent colour
  const getGlowStyle = (color: string) => {
    if (color.includes("text-pink") || color.includes("text-rose")) {
      return "hover:border-pink-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.25)]";
    }
    if (color.includes("text-cyan")) {
      return "hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.25)]";
    }
    if (color.includes("text-amber")) {
      return "hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(251,191,36,0.25)]";
    }
    if (color.includes("text-blue") || color.includes("text-indigo")) {
      return "hover:border-indigo-400/50 hover:shadow-[0_0_20px_rgba(129,140,248,0.25)]";
    }
    if (color.includes("text-red")) {
      return "hover:border-red-500 hover:shadow-[0_0_25px_rgba(239,68,68,0.35)]";
    }
    return "hover:border-violet-500/50 hover:shadow-[0_0_20px_rgba(167,139,250,0.25)]";
  };

  const getHeartColor = (color: string) => {
    if (color.includes("text-cyan")) return "text-cyan-400 fill-cyan-400";
    if (color.includes("text-amber")) return "text-amber-400 fill-amber-400";
    if (color.includes("text-indigo") || color.includes("text-blue")) return "text-indigo-400 fill-indigo-400";
    return "text-pink-500 fill-pink-500";
  };

  const getButtonBg = (color: string) => {
    if (color.includes("text-cyan")) return "hover:bg-cyan-950/40 hover:text-cyan-300 hover:border-cyan-800/40";
    if (color.includes("text-amber")) return "hover:bg-amber-950/40 hover:text-amber-300 hover:border-amber-800/40";
    if (color.includes("text-indigo") || color.includes("text-blue")) return "hover:bg-indigo-950/40 hover:text-indigo-300 hover:border-indigo-800/40";
    return "hover:bg-pink-950/40 hover:text-pink-300 hover:border-pink-850/40";
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      // Run initial check
      checkScroll();

      // Setup ResizeObserver for responsive layout updates
      const observer = new ResizeObserver(checkScroll);
      observer.observe(el);

      return () => {
        el.removeEventListener("scroll", checkScroll);
        observer.disconnect();
      };
    }
  }, [movies]);

  const handleScroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = clientWidth * 0.75;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      });
    }
  };

  return (
    <div className={`space-y-4 px-1 pb-4 relative ${isMature && locked ? "group/mature" : ""}`}>
      <div className="flex items-end justify-between px-1">
        <div className="space-y-1">
          <span className={`text-[10px] font-mono tracking-[0.2em] font-extrabold uppercase ${accentColor} drop-shadow-[0_0_8px_currentColor]`}>
            {subtitle}
          </span>
          <h3 className="font-display font-extrabold text-sm md:text-base text-white tracking-widest uppercase bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            {title}
          </h3>
        </div>
        
        {isMature && locked ? (
          <button 
            type="button"
            onClick={() => setLocked(false)}
            className="text-[10px] bg-red-950/80 hover:bg-red-900 border-2 border-red-500/50 text-red-400 font-mono font-bold px-4 py-1.5 rounded-full flex items-center gap-2 transition-all duration-300 shadow-[0_0_15px_rgba(239,68,68,0.2)] animate-pulse cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>🔓 Reveal Mature (18+) content</span>
          </button>
        ) : (
          <span className="text-[10px] text-zinc-600 font-mono hidden sm:inline tracking-wider">Scroll horizontally ➔</span>
        )}
      </div>

      <div className="relative group/row">
        {/* Left Scroll Arrow */}
        {showLeftArrow && !(isMature && locked) && (
          <button
            type="button"
            onClick={() => handleScroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/80 hover:bg-black text-white rounded-full border border-zinc-800 backdrop-blur-md transition-all duration-300 hover:scale-115 active:scale-90 shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-pointer md:opacity-0 md:group-hover/row:opacity-100"
            aria-label="Scroll Left"
          >
            <ChevronLeft className="w-5 h-5 text-zinc-300 hover:text-white" />
          </button>
        )}

        {/* Right Scroll Arrow */}
        {showRightArrow && !(isMature && locked) && (
          <button
            type="button"
            onClick={() => handleScroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2.5 bg-black/80 hover:bg-black text-white rounded-full border border-zinc-800 backdrop-blur-md transition-all duration-300 hover:scale-115 active:scale-90 shadow-[0_0_15px_rgba(0,0,0,0.8)] cursor-pointer md:opacity-0 md:group-hover/row:opacity-100"
            aria-label="Scroll Right"
          >
            <ChevronRight className="w-5 h-5 text-zinc-300 hover:text-white" />
          </button>
        )}

        <div 
          ref={scrollRef}
          className={`flex overflow-x-auto gap-6 pb-2 scrollbar-none scroll-smooth snap-x ${isMature && locked ? "blur-[20px] pointer-events-none select-none" : ""}`}
        >
          <AnimatePresence mode="popLayout">
            {movies.map((movie, index) => {
              const isFavorited = watchlist.includes(movie.id);
              const releaseYear = movie.release_date
                ? new Date(movie.release_date).getFullYear()
                : "N/A";
                
              return (
                <motion.div
                  key={`movie-row-card-${movie.id}`}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                  whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
                  className={`snap-start shrink-0 w-[240px] md:w-[270px] h-[350px] md:h-[380px] bg-zinc-950/80 border border-zinc-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between transition-[border-color,box-shadow,background-color] duration-300 backdrop-blur-md ${getGlowStyle(accentColor)}`}
                >
                  {/* Poster Element */}
                  <div 
                    onClick={() => onClickMovie?.(movie)}
                    className="relative h-44 md:h-[190px] overflow-hidden bg-black shrink-0 cursor-pointer"
                  >
                    <img
                      src={movie.poster_path}
                      alt={movie.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.08]"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#000000] via-black/25 to-transparent"></div>
                    
                    {/* Rating indicator */}
                    <div className="absolute top-2.5 left-2.5 bg-black/90 backdrop-blur-md px-2.5 py-0.5 rounded border border-zinc-800 text-amber-400 font-mono text-[9px] font-extrabold flex items-center gap-1 shadow-md">
                      ★ {movie.vote_average.toFixed(1)}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatchlist(movie);
                      }}
                      className="absolute top-2.5 right-2.5 p-2 bg-black/80 hover:bg-black backdrop-blur-md rounded-xl border border-zinc-800 text-zinc-400 hover:text-pink-500 transition-colors cursor-pointer focus:outline-none"
                    >
                      <Heart className={`w-3.5 h-3.5 transition-all duration-300 ${isFavorited ? getHeartColor(accentColor) + " animate-pulse scale-110" : "text-zinc-500 hover:scale-110"}`} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                    <div 
                      onClick={() => onClickMovie?.(movie)}
                      className="space-y-1 cursor-pointer"
                    >
                      <h4 className="font-display font-bold text-xs md:text-sm text-zinc-200 line-clamp-1 hover:text-white transition-colors">
                        {movie.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-mono">
                        {releaseYear} • {movie.original_language.toUpperCase()}
                      </p>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-sans line-clamp-2 mt-1.5">
                        {movie.overview}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenReviews(movie)}
                      className={`w-full py-2 bg-zinc-900/30 text-zinc-400 hover:text-white border border-zinc-900 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 transition-all duration-300 cursor-pointer focus:outline-none active:scale-[0.98] ${getButtonBg(accentColor)}`}
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Reviews</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
