import React, { useEffect, useState } from "react";
import { MovieDetail, Movie, Review } from "../types";
import { ArrowLeft, Heart, Calendar, Clock, Globe2, DollarSign, Film, Sparkles, Star, Play, Send, Bot, CheckCircle, RefreshCw } from "lucide-react";
import { getMovieReviews } from "../tmdb";
import { motion } from "motion/react";

interface MovieDetailsViewProps {
  movieId: number;
  baseMovie?: Movie;
  apiKey: string;
  onBack: () => void;
  onToggleWatchlist: (movieId: number) => void;
  watchlist: number[];
  onSelectMovie: (movie: Movie) => void;
}

export default function MovieDetailsView({
  movieId,
  baseMovie,
  apiKey,
  onBack,
  onToggleWatchlist,
  watchlist,
  onSelectMovie
}: MovieDetailsViewProps) {
  const [detail, setDetail] = useState<MovieDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeVideoKey, setActiveVideoKey] = useState<string | null>(null);

  // Telegram Integration States & Handler
  const [telegramStatus, setTelegramStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSendToTelegram = async () => {
    let token = "";
    let cid = "";
    try {
      token = localStorage.getItem("moodmatch_telegram_bot_token") || "";
      cid = localStorage.getItem("moodmatch_telegram_chat_id") || "";
    } catch {}

    if (!token || !cid) {
      alert("Telegram credentials are not configured yet.\n\nPlease navigate to the 'Intelligence' tab in the main header to set up your Bot Token and Chat ID first!");
      return;
    }

    setTelegramStatus("sending");

    try {
      const response = await fetch("/api/telegram/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          botToken: token,
          chatId: cid,
          movie: detail
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to transmit card.");
      }

      setTelegramStatus("success");
      setTimeout(() => setTelegramStatus("idle"), 4000);
    } catch (err: any) {
      setTelegramStatus("error");
      alert(`Telegram transmission failed: ${err.message}`);
    }
  };

  // Fetch full details
  useEffect(() => {
    let active = true;
    async function loadFullDetails() {
      setLoading(true);
      try {
        const { fetchFullMovieDetails } = await import("../tmdb");
        const data = await fetchFullMovieDetails(apiKey, movieId, baseMovie);
        if (active) {
          setDetail(data);
          // Set first available YouTube video key by default
          if (data.videos && data.videos.length > 0) {
            setActiveVideoKey(data.videos[0].key);
          } else {
            setActiveVideoKey(null);
          }
        }
      } catch (err) {
        console.error("Failed loading full movie details:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadFullDetails();
    return () => {
      active = false;
    };
  }, [movieId, apiKey, baseMovie]);

  // Fetch reviews
  useEffect(() => {
    let active = true;
    if (!detail) return;
    
    async function loadReviews() {
      setReviewsLoading(true);
      try {
        const data = await getMovieReviews(apiKey, movieId, detail!.title);
        if (active) {
          setReviews(data);
        }
      } catch (err) {
        console.error("Failed loading reviews:", err);
      } finally {
        if (active) {
          setReviewsLoading(false);
        }
      }
    }

    loadReviews();
    return () => {
      active = false;
    };
  }, [detail, movieId, apiKey]);

  // Utility formatters
  const formatCurrency = (val?: number) => {
    if (!val || val === 0) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatRuntime = (mins?: number) => {
    if (!mins) return "N/A";
    const hrs = Math.floor(mins / 60);
    const m = mins % 60;
    return hrs > 0 ? `${hrs}h ${m}m` : `${m}m`;
  };

  const isFavorited = watchlist.includes(movieId);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-4 py-20 px-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-pink-500/25 border-t-pink-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-bold text-pink-400">
            LOAD
          </div>
        </div>
        <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase animate-pulse">
          Fetching cinematic feeds & credits...
        </p>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center space-y-6 text-center py-20 px-4">
        <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-500 rounded-full">
          <Film className="w-10 h-10" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-sm uppercase text-white tracking-widest">
            Movie Details Missing
          </h3>
          <p className="text-xs text-zinc-500 mt-2 max-w-sm leading-relaxed">
            We couldn't retrieve full details for this movie. Check your connection or retry later.
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-xs text-white font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </button>
      </div>
    );
  }

  const releaseYear = detail.release_date
    ? new Date(detail.release_date).getFullYear().toString()
    : "N/A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="min-h-screen bg-black text-zinc-100 flex flex-col pb-20 relative select-none"
    >
      {/* -------------------------------------------------------------------------
          🎬 AMBIENT HERO BACKDROP
          ------------------------------------------------------------------------- */}
      <div className="absolute top-0 left-0 w-full h-[600px] z-0 overflow-hidden">
        <img
          src={detail.backdrop_path || detail.poster_path}
          alt={detail.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-35 scale-[1.02] filter blur-[2px]"
        />
        {/* Cinematic ambient dark overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        <div className="absolute inset-x-0 bottom-0 h-[250px] bg-gradient-to-t from-black to-transparent"></div>
        <div className="absolute inset-y-0 left-0 w-[150px] bg-gradient-to-r from-black to-transparent"></div>
        <div className="absolute inset-y-0 right-0 w-[150px] bg-gradient-to-l from-black to-transparent"></div>
      </div>

      {/* -------------------------------------------------------------------------
          🧭 BACK ACTION NAV
          ------------------------------------------------------------------------- */}
      <div className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-8 pt-8 pb-4 shrink-0">
        <button
          onClick={onBack}
          className="group flex items-center gap-2 px-4 py-2.5 bg-black/60 hover:bg-black border border-zinc-800 hover:border-pink-500/50 text-zinc-400 hover:text-white rounded-full text-xs font-bold transition-all cursor-pointer backdrop-blur-md shadow-lg"
          id="btn-details-back"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Catalog</span>
        </button>
      </div>

      {/* -------------------------------------------------------------------------
          🍿 MAIN DETAILS BOX (TWO-COLUMN BENTO GRID)
          ------------------------------------------------------------------------- */}
      <main className="relative z-10 max-w-7xl w-full mx-auto px-4 md:px-8 mt-6 flex-1 space-y-12">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Poster & Metadata Grid (lg:span-4) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="relative group rounded-3xl overflow-hidden border border-zinc-900/60 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] bg-zinc-950 aspect-[2/3] max-w-sm mx-auto lg:max-w-none">
              <img
                src={detail.poster_path}
                alt={detail.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
              />
              <div className="absolute top-4 left-4 bg-black/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-800 text-amber-400 font-mono text-xs font-black flex items-center gap-1.5 shadow-md">
                ★ {detail.vote_average.toFixed(1)}
              </div>
            </div>

            {/* Watchlist Toggle Hero CTA Button */}
            <button
              onClick={() => onToggleWatchlist(detail.id)}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer focus:outline-none active:scale-[0.98] border ${
                isFavorited
                  ? "bg-pink-950/40 hover:bg-pink-900/50 border-pink-500/50 text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.15)]"
                  : "bg-white text-black hover:bg-zinc-200 border-transparent shadow-xl"
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? "fill-pink-500 text-pink-500 animate-pulse" : "text-black"}`} />
              <span>{isFavorited ? "Remove from Watchlist" : "Add to Watchlist"}</span>
            </button>

            {/* Telegram Dispatch Button */}
            <button
              onClick={handleSendToTelegram}
              disabled={telegramStatus === "sending"}
              className={`w-full py-3.5 px-6 rounded-2xl text-xs font-black tracking-wider uppercase flex items-center justify-center gap-2.5 transition-all cursor-pointer focus:outline-none active:scale-[0.98] border ${
                telegramStatus === "success"
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
                  : telegramStatus === "sending"
                  ? "bg-zinc-900 border-zinc-800 text-zinc-500 animate-pulse"
                  : "bg-purple-950/40 hover:bg-purple-900/50 border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              }`}
            >
              {telegramStatus === "sending" ? (
                <RefreshCw className="w-4 h-4 animate-spin text-purple-400" />
              ) : telegramStatus === "success" ? (
                <CheckCircle className="w-4 h-4 text-emerald-400" />
              ) : (
                <Bot className="w-4 h-4 text-purple-400" />
              )}
              <span>
                {telegramStatus === "sending"
                  ? "Transmitting..."
                  : telegramStatus === "success"
                  ? "Dispatched!"
                  : "Send to Telegram"}
              </span>
            </button>

            {/* Basic Movie Specs Box */}
            <div className="bg-zinc-950/80 border border-zinc-900/60 rounded-3xl p-5 space-y-4 backdrop-blur-md">
              <h4 className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-900">
                Specifications
              </h4>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-zinc-500 block font-mono text-[10px]">Released</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    <span>{detail.release_date || "N/A"}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 block font-mono text-[10px]">Duration</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-pink-500" />
                    <span>{formatRuntime(detail.runtime)}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 block font-mono text-[10px]">Language</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1.5 uppercase">
                    <Globe2 className="w-3.5 h-3.5 text-pink-500" />
                    <span>{detail.original_language}</span>
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-zinc-500 block font-mono text-[10px]">Budget</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-pink-500" />
                    <span>{formatCurrency(detail.budget)}</span>
                  </span>
                </div>

                <div className="space-y-1 col-span-2">
                  <span className="text-zinc-500 block font-mono text-[10px]">Revenue</span>
                  <span className="text-zinc-200 font-medium flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-pink-500" />
                    <span>{formatCurrency(detail.revenue)}</span>
                  </span>
                </div>
              </div>

              {/* Genres badges */}
              {detail.genres && detail.genres.length > 0 && (
                <div className="pt-3 border-t border-zinc-900 space-y-2">
                  <span className="text-zinc-500 block font-mono text-[10px]">Genres</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.genres.map((g) => (
                      <span
                        key={g.id}
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md text-pink-400 bg-pink-950/20 border border-pink-900/40"
                      >
                        {g.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL: Info details & media files (lg:span-8) */}
          <div className="lg:col-span-8 space-y-8">
            <div className="space-y-2">
              <h1 className="font-display font-black text-2xl md:text-4xl text-white tracking-wide uppercase leading-tight">
                {detail.title}
              </h1>
              
              {detail.tagline && (
                <p className="text-sm md:text-base font-medium italic text-pink-400 font-serif">
                  " {detail.tagline} "
                </p>
              )}
            </div>

            {/* Synopsis overview card */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono font-black uppercase text-zinc-500 tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-pink-500" />
                <span>Synopsis Plot</span>
              </h3>
              <p className="text-sm md:text-base text-zinc-300 leading-relaxed font-sans font-normal max-w-3xl">
                {detail.overview || "No synopsis overview description has been catalogued for this title."}
              </p>
            </div>

            {/* Cast & Credits scroll */}
            {detail.cast && detail.cast.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-pink-500" />
                    <span>The Cast & Credits</span>
                  </h3>
                  <span className="text-[10px] text-zinc-600 font-mono">Scroll horizontally➔</span>
                </div>

                <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-none scroll-smooth">
                  {detail.cast.map((c) => (
                    <div
                      key={c.id}
                      className="shrink-0 w-[120px] md:w-[140px] h-[145px] md:h-[165px] bg-zinc-950/40 border border-zinc-900 rounded-2xl p-3 flex flex-col items-center justify-between text-center space-y-2"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden border border-zinc-850 shadow-md shrink-0">
                        <img
                          src={c.profile_path || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150"}
                          alt={c.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="space-y-0.5 w-full">
                        <p className="text-[11px] font-bold text-zinc-200 line-clamp-1 w-full">{c.name}</p>
                        <p className="text-[9px] font-mono text-zinc-500 line-clamp-1 w-full">{c.character}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Trailer section */}
            {activeVideoKey && (
              <div className="space-y-4 pt-4 border-t border-zinc-900">
                <h3 className="text-xs font-mono font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                  <Play className="w-4 h-4 text-pink-500" />
                  <span>Trailers & Clips</span>
                </h3>
                
                {/* Embedded YouTube Player with ambient glow */}
                <div className="relative aspect-video rounded-3xl overflow-hidden border border-zinc-900/80 shadow-2xl bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${activeVideoKey}`}
                    title={`${detail.title} Trailer`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    loading="lazy"
                  ></iframe>
                </div>

                {/* Additional video selector buttons */}
                {detail.videos && detail.videos.length > 1 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {detail.videos.map((vid) => (
                      <button
                        key={vid.id}
                        onClick={() => setActiveVideoKey(vid.key)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-semibold transition-all border cursor-pointer ${
                          activeVideoKey === vid.key
                            ? "bg-pink-950/40 border-pink-500/50 text-pink-400"
                            : "bg-zinc-900/30 hover:bg-zinc-850 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {vid.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Production Companies */}
            {detail.production_companies && detail.production_companies.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-900">
                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block">
                  Studio Partners
                </span>
                <div className="flex flex-wrap gap-3 items-center">
                  {detail.production_companies.map((company) => (
                    <span
                      key={company.id}
                      className="bg-zinc-950/50 border border-zinc-900 text-zinc-400 text-[10px] px-3 py-1.5 rounded-xl font-mono"
                    >
                      {company.name} ({company.origin_country || "Int"})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Community Reviews Section */}
            <div className="space-y-4 pt-4 border-t border-zinc-900">
              <h3 className="text-xs font-mono font-black uppercase text-zinc-400 tracking-widest flex items-center gap-1.5">
                <Star className="w-4 h-4 text-pink-500" />
                <span>Community Review Insights</span>
              </h3>

              {reviewsLoading ? (
                <p className="text-xs font-mono text-zinc-650 animate-pulse">Loading review boards...</p>
              ) : reviews.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">No community reviews have been logged yet. Be the first to watch!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev, rIdx) => (
                    <div
                      key={rIdx}
                      className="p-5 bg-zinc-950/40 border border-zinc-900/60 rounded-2xl relative"
                    >
                      <p className="text-[11px] font-mono font-bold text-pink-400 uppercase tracking-widest mb-2">
                        @ {rev.author}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed font-sans italic">
                        "{rev.content}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

        {/* -------------------------------------------------------------------------
            🌟 SIMILAR RECOMMENDED SCREENINGS
            ------------------------------------------------------------------------- */}
        {detail.similar && detail.similar.length > 0 && (
          <div className="pt-8 border-t border-zinc-900 space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-black tracking-[0.2em] uppercase text-pink-500">
                Endless Match Exploration
              </span>
              <h3 className="font-display font-extrabold text-sm md:text-base text-white tracking-widest uppercase">
                Similar Cinema Recommendations
              </h3>
            </div>

            <div className="flex overflow-x-auto gap-5 pb-4 scrollbar-none scroll-smooth">
              {detail.similar.map((simMovie) => {
                const simReleaseYear = simMovie.release_date
                  ? new Date(simMovie.release_date).getFullYear()
                  : "N/A";
                return (
                  <button
                    key={simMovie.id}
                    onClick={() => onSelectMovie(simMovie)}
                    className="shrink-0 w-[180px] md:w-[200px] h-[175px] md:h-[195px] text-left bg-zinc-950/80 border border-zinc-900 hover:border-pink-500/40 rounded-2xl overflow-hidden group transition-all duration-300 focus:outline-none cursor-pointer flex flex-col justify-between"
                  >
                    <div className="h-28 md:h-32 bg-black overflow-hidden relative shrink-0">
                      <img
                        src={simMovie.poster_path}
                        alt={simMovie.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute top-2 left-2 bg-black/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-amber-400 font-mono text-[9px] font-bold">
                        ★ {simMovie.vote_average.toFixed(1)}
                      </div>
                    </div>
                    <div className="p-3 space-y-1 flex-1 flex flex-col justify-center">
                      <h4 className="text-[11px] font-bold text-zinc-200 line-clamp-1 group-hover:text-pink-400 transition-colors">
                        {simMovie.title}
                      </h4>
                      <p className="text-[9px] text-zinc-500 font-mono">
                        {simReleaseYear} • {simMovie.original_language.toUpperCase()}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </motion.div>
  );
}
