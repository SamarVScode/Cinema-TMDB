/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import FilterSidebar from "./components/FilterSidebar";
import MovieGrid from "./components/MovieGrid";
import ReviewDrawer from "./components/ReviewDrawer";
import CinematicRow from "./components/CinematicRow";
import SensoryMoodSelector from "./components/SensoryMoodSelector";
import SpotlightHero from "./components/SpotlightHero";
import Footer from "./components/Footer";
import WatchlistAlert from "./components/WatchlistAlert";
import MovieDetailsView from "./components/MovieDetailsView";
import IntelligenceHub from "./components/IntelligenceHub";
import { fetchFilteredMovies, fetchSpotlightMovies, fetchLandingFeeds, LandingFeeds } from "./tmdb";
import { Movie, FilterConfig, SpotlightItem, countActiveFilters, WatchlistItem } from "./types";
import { SlidersHorizontal, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

// =========================================================================
// 🔑 TMDB (THE MOVIE DATABASE) API KEY LOADED FROM STORAGE OR ENV
// =========================================================================
const getSavedApiKey = (): string => {
  try {
    const saved = localStorage.getItem("moodmatch_tmdb_api_key");
    if (saved && saved.trim() !== "") {
      return saved.trim();
    }
  } catch {}
  const envKey = ((import.meta as any).env.VITE_TMDB_API_KEY || "").trim();
  if (envKey) return envKey;
  
  // High-fidelity fallback TMDB Read Access Token (v4 JWT Bearer Token)
  return "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJjZGZkOTY1M2VmZjFhOWI3ZTBmMTFmYmM3NTAyYWQ5YiIsIm5iZiI6MTc4MDg0MDExNS4zMDIsInN1YiI6IjZhMjU3NmIzYzlkYTA3YzRjYWRiNjRlZCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.NybgKek-wrcE4hkTFe1Ktp7RrQHlXLQCABfNXRw0K7M";
};

export default function App() {
  // ---------------------------------------------------------
  // State Hook Initialization
  // ---------------------------------------------------------

  // Watchlist array state
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(() => {
    try {
      const saved = localStorage.getItem("moodmatch_watchlist");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Migration from number[] to WatchlistItem[]
        if (parsed.length > 0 && typeof parsed[0] === "number") {
          return parsed.map((id: number) => ({ id, type: "movie" as const }));
        }
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Media type toggle state
  const [mediaType, setMediaType] = useState<"movie" | "tv">("movie");

  // Dynamic state for active navigation tab
  const [activeTab, setActiveTab] = useState<"showcase" | "search" | "wishlist" | "intelligence">("showcase");

  // Dynamic API key state
  const [apiKey, setApiKey] = useState<string>(getSavedApiKey);

  const handleUpdateApiKey = (newKey: string) => {
    try {
      localStorage.setItem("moodmatch_tmdb_api_key", newKey.trim());
    } catch {}
    setApiKey(newKey.trim());
  };

  // Advanced Filters State
  const [filters, setFilters] = useState<FilterConfig>({
    industry: "all",
    era: "latest",
    minRating: 5.0,
    mood: null,
    exactYear: "any",
    sortBy: "popularity.desc",
    minRuntime: 0,
    searchQuery: "",
  });

  const [draftFilters, setDraftFilters] = useState<FilterConfig>({ ...filters });

  // Dynamic Spotlights fetched from TMDB
  const [spotlights, setSpotlights] = useState<SpotlightItem[]>([]);

  // Dynamic search input box state (prevents slow re-renders of list on each key event)
  const [searchVal, setSearchVal] = useState("");

  // Movie Query Output States
  const [moviesList, setMoviesList] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMockMode, setIsMockMode] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Cinematic Landing Page Feeds States
  const [landingFeeds, setLandingFeeds] = useState<LandingFeeds | null>(null);
  const [loadingLanding, setLoadingLanding] = useState(true);

  // Expanded/Collapsed Search and Filters Tray
  const [isSearchExpanded, setIsSearchExpanded] = useState(true);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedMovieForReviews, setSelectedMovieForReviews] = useState<Movie | null>(null);

  // Selected Movie for comprehensive details view
  const [selectedMovieIdForDetails, setSelectedMovieIdForDetails] = useState<number | null>(null);
  const [selectedMovieBaseForDetails, setSelectedMovieBaseForDetails] = useState<Movie | null>(null);

  const handleSelectMovieForDetails = (movie: Movie) => {
    setSelectedMovieIdForDetails(movie.id);
    setSelectedMovieBaseForDetails(movie);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBackFromDetails = () => {
    setSelectedMovieIdForDetails(null);
    setSelectedMovieBaseForDetails(null);
  };

  // Active spotlight highlight index on landing deck slideshow
  const [activeSpotlightIdx, setActiveSpotlightIdx] = useState(0);

  // Tooltip toast tracker
  const [showWatchlistTooltip, setShowWatchlistTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("");

  // ---------------------------------------------------------
  // Side Effects
  // ---------------------------------------------------------

  // If user changes navigation tab, exit movie details view
  useEffect(() => {
    setSelectedMovieIdForDetails(null);
    setSelectedMovieBaseForDetails(null);
  }, [activeTab]);

  // Save watchlist updates to LocalStorage
  useEffect(() => {
    localStorage.setItem("moodmatch_watchlist", JSON.stringify(watchlist));
  }, [watchlist]);

  // Fetch real spotlight movies from TMDB on API key trigger
  useEffect(() => {
    let active = true;
    async function loadDynamicSpotlights() {
      try {
        const dynamicItems = await fetchSpotlightMovies(apiKey, mediaType);
        if (active) {
          setSpotlights(dynamicItems);
        }
      } catch (err) {
        console.info("Failed to load dynamic showcases (using fallback):", err);
      }
    }
    loadDynamicSpotlights();
    return () => {
      active = false;
    };
  }, [apiKey, mediaType]);

  // Fetch parallel landing sub-categories on API key trigger
  useEffect(() => {
    let active = true;
    async function loadHomeLandingFeeds() {
      setLoadingLanding(true);
      try {
        const feeds = await fetchLandingFeeds(apiKey, mediaType);
        if (active) {
          setLandingFeeds(feeds);
        }
      } catch (err) {
        console.info("Failed loading home landing feeds (using fallback):", err);
      } finally {
        if (active) {
          setLoadingLanding(false);
        }
      }
    }
    loadHomeLandingFeeds();
    return () => {
      active = false;
    };
  }, [apiKey, mediaType]);

  // Main Coordinator: Fetches movies upon Filter modifications using Environment Key
  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setErrorMessage(null);
      setPage(1);
      setHasMore(true);
      try {
        const result = await fetchFilteredMovies(apiKey, filters, 1, mediaType);
        if (active) {
          setIsMockMode(result.isMock);
          setMoviesList(result.movies);
          if (result.movies.length < 8) {
            setHasMore(false);
          }
        }
      } catch (err: any) {
        if (active) {
          console.info("Discovery engine fallback logic:", err);
          setErrorMessage(err.message || "Request failed. Check API key validity in your local environment setup.");
          setMoviesList([]);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [filters, apiKey, mediaType]);

  // Load more movies for infinite scrolling
  const loadMoreMovies = async () => {
    if (loading || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const result = await fetchFilteredMovies(apiKey, filters, nextPage, mediaType);
      if (result.movies.length === 0) {
        setHasMore(false);
      } else {
        setMoviesList((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filteredNew = result.movies.filter((m) => !existingIds.has(m.id));
          if (filteredNew.length === 0) {
            setHasMore(false);
          }
          return [...prev, ...filteredNew];
        });
        setPage(nextPage);
      }
    } catch (err) {
      console.info("Failed to load more movies:", err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  // Keep draftFilters and searchVal synced to active filters if filters are changed globally / reset
  useEffect(() => {
    setDraftFilters(filters);
    if (filters.searchQuery !== undefined) {
      setSearchVal(filters.searchQuery);
    }
  }, [filters]);

  // ---------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------

  const handleApplyFilters = () => {
    setFilters({
      ...draftFilters,
      searchQuery: searchVal,
    });
  };

  const triggerSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    handleApplyFilters();
  };

  const handleClearSearch = () => {
    setSearchVal("");
    setFilters(prev => ({ ...prev, searchQuery: "" }));
  };

  // Toggles item inclusion in user watchlist
  const handleToggleWatchlist = (movie: Movie) => {
    setWatchlist((prev) => {
      const exists = prev.some(w => w.id === movie.id);
      if (!exists) {
        setTooltipText("Saved to Watchlist!");
        setShowWatchlistTooltip(true);
        setTimeout(() => setShowWatchlistTooltip(false), 2500);
        return [...prev, { id: movie.id, type: movie.media_type || mediaType }];
      } else {
        setTooltipText("Removed from Watchlist.");
        setShowWatchlistTooltip(true);
        setTimeout(() => setShowWatchlistTooltip(false), 2500);
        return prev.filter((w) => w.id !== movie.id);
      }
    });
  };

  // Completely resets filters
  const handleResetFilters = () => {
    setFilters({
      industry: "all",
      era: "latest",
      minRating: 5.0,
      mood: null,
      exactYear: "any",
      sortBy: "popularity.desc",
      minRuntime: 0,
      searchQuery: "",
    });
    setSearchVal("");
  };

  // Activates a recommended spotlight directly in the filter deck
  const handleActivateSpotlight = (item: SpotlightItem) => {
    setFilters(prev => ({
      ...prev,
      industry: item.industry === "hi" ? "hi" : "en",
      mood: item.moodId,
      exactYear: item.year,
      minRating: 5.0,
      searchQuery: "",
    }));
    setSearchVal("");
    setActiveTab("search");
    // Scroll down directly to the Grid section so they feel the instant match!
    setTimeout(() => {
      const targetElement = document.getElementById("discover-feed-anchor");
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth" });
      }
    }, 150);
  };

  // Convert spotlight to mock movie for direct reviews popup
  const handleViewSpotlightReviews = (item: SpotlightItem | Movie) => {
    if ("original_language" in item) {
      setSelectedMovieForReviews(item as Movie);
    } else {
      const movieObj: Movie = {
        id: item.id,
        title: item.title,
        original_language: item.industry,
        release_date: `${item.year}-06-01`,
        vote_average: item.rating,
        overview: item.overview,
        poster_path: item.backdropUrl,
        genre_ids: item.genreIds,
        popularity: 900
      };
      setSelectedMovieForReviews(movieObj);
    }
  };

  // Determine what movie to showcase in the Hero frame
  const moodMatchedBaseMovie = (filters.mood !== null && moviesList.length > 0) ? moviesList[0] : null;

  const isDynamicHeroActive = moodMatchedBaseMovie !== null;
  const currentActiveSpotlight = spotlights[activeSpotlightIdx] || null;

  const heroTitle = isDynamicHeroActive 
    ? moodMatchedBaseMovie.title 
    : (currentActiveSpotlight ? currentActiveSpotlight.title : "");
  const heroYear = isDynamicHeroActive 
    ? (moodMatchedBaseMovie.release_date ? new Date(moodMatchedBaseMovie.release_date).getFullYear().toString() : "N/A") 
    : (currentActiveSpotlight ? currentActiveSpotlight.year : "");
  const heroRating = isDynamicHeroActive 
    ? moodMatchedBaseMovie.vote_average 
    : (currentActiveSpotlight ? currentActiveSpotlight.rating : 0);
  const heroBackdrop = isDynamicHeroActive 
    ? moodMatchedBaseMovie.poster_path 
    : (currentActiveSpotlight ? currentActiveSpotlight.backdropUrl : "");
  const heroOverview = isDynamicHeroActive 
    ? moodMatchedBaseMovie.overview 
    : (currentActiveSpotlight ? currentActiveSpotlight.overview : "");
  
  const heroQuote = isDynamicHeroActive 
    ? "Sensory Aligned Top Match" 
    : (currentActiveSpotlight ? currentActiveSpotlight.quote : "");
    
  const heroTagline = isDynamicHeroActive 
    ? moodMatchedBaseMovie.overview 
    : (currentActiveSpotlight ? currentActiveSpotlight.tagline : "");

  const heroMoodId = isDynamicHeroActive 
    ? (filters.mood || "thoughtful") 
    : (currentActiveSpotlight ? currentActiveSpotlight.moodId : "thoughtful");

  const heroMoodName = isDynamicHeroActive 
    ? (filters.mood === "comedy" ? "Comedy & Satire" :
       filters.mood === "adrenaline" ? "Action & Thriller" :
       filters.mood === "horror" ? "Horror & Suspense" :
       filters.mood === "thoughtful" ? "Drama & Sci-Fi" :
       filters.mood === "feelgood" ? "Romance & Feel-Good" :
       filters.mood === "family" ? "Kids & Family" :
       filters.mood === "mystery" ? "Mystery & Crime" :
       filters.mood === "documentary" ? "Real & Documentary" :
       filters.mood === "adult" ? "Intense & Steamy (18+)" : "Matched Mood")
    : (currentActiveSpotlight ? currentActiveSpotlight.moodName : "");

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-pink-500/30 selection:text-white">
      
      {/* 1. BRANDING HEADER */}
      <Header 
        watchlistCount={watchlist.length} 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiKey={apiKey}
        onChangeApiKey={handleUpdateApiKey}
        onResetAll={handleResetFilters}
        mediaType={mediaType}
        setMediaType={setMediaType}
      />

      {/* Floating Watchlist Alerts */}
      <WatchlistAlert isVisible={showWatchlistTooltip} message={tooltipText} />

      <div className="flex-1 flex flex-col pt-16">

      {/* =========================================================================
          🎨 SENSORY MOOD SELECTOR ON TOP (Always accessible except in wishlist tab)
          ========================================================================= */}
      {selectedMovieIdForDetails === null && activeTab !== "wishlist" && (
        <SensoryMoodSelector 
          currentMood={filters.mood}
          onSelectMood={(moodId) => {
            setFilters(prev => ({ ...prev, mood: moodId }));
            setDraftFilters(prev => ({ ...prev, mood: moodId }));
            setActiveTab("search");
          }}
          onExploreAll={() => {
            handleResetFilters();
            setActiveTab("search");
          }}
        />
      )}

      {/* =========================================================================
          🔥 DYNAMIC SPOTLIGHT HERO SHOWCASE (Showcase Tab only)
          ========================================================================= */}
      {selectedMovieIdForDetails === null && activeTab === "showcase" && (isDynamicHeroActive || (spotlights.length > 0 && currentActiveSpotlight)) && (
        <SpotlightHero 
          isDynamicHeroActive={isDynamicHeroActive}
          heroTitle={heroTitle}
          heroYear={heroYear}
          heroRating={heroRating}
          heroBackdrop={heroBackdrop}
          heroOverview={heroOverview}
          heroQuote={heroQuote}
          heroTagline={heroTagline}
          heroMoodId={heroMoodId}
          heroMoodName={heroMoodName}
          spotlights={spotlights}
          activeSpotlightIdx={activeSpotlightIdx}
          setActiveSpotlightIdx={setActiveSpotlightIdx}
          onExploreReviews={() => handleViewSpotlightReviews(isDynamicHeroActive ? moodMatchedBaseMovie! : currentActiveSpotlight!)}
          onInstantMatchMood={() => handleActivateSpotlight(currentActiveSpotlight!)}
          onToggleWatchlist={() => handleToggleWatchlist(isDynamicHeroActive ? (moodMatchedBaseMovie as unknown as Movie)! : (currentActiveSpotlight as unknown as Movie)!)}
          isFavorited={watchlist.some(w => w.id === (isDynamicHeroActive ? moodMatchedBaseMovie!.id : currentActiveSpotlight!.id))}
        />
      )}

      {/* =========================================================================
          🧭 ADVANCED CONTROLS TRAY (Hides Search and Filters neatly together!)
          ========================================================================= */}
      {selectedMovieIdForDetails === null && activeTab === "search" && (
        <section className="bg-black py-4 px-4 md:px-8 border-b border-zinc-900/40 shrink-0 select-none">
          <div className="max-w-7xl mx-auto space-y-4">
            
            {/* Header Bar representing matched catalog details and search toggle */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-zinc-950/80 border border-zinc-900 px-5 py-4 rounded-3xl shadow-xl">
              <div>
                <h2 className="font-display font-black text-sm text-white tracking-wider flex items-center gap-2">
                  <span>Sensory Discovery Catalog</span>
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 bg-zinc-900 border border-zinc-800 text-cyan-400 rounded-full">
                    {moviesList.length} movies
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                  Explore curated movies aligned with your emotional filters.
                </p>
              </div>

              {/* Collapsible Toggles for Search and Filters (Separated) */}
              <div className="flex flex-wrap items-center gap-3 self-end sm:self-center">
                <button
                  onClick={() => setIsSearchExpanded(!isSearchExpanded)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer focus:outline-none ${
                    isSearchExpanded
                      ? "bg-cyan-950/35 border-cyan-500/30 text-cyan-400 font-extrabold shadow-md shadow-cyan-500/5"
                      : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                  id="btn-desktop-search-toggle"
                >
                  <Search className="w-4 h-4 text-cyan-400" />
                  <span>Search</span>
                  {filters.searchQuery && filters.searchQuery.trim() !== "" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block animate-pulse" />
                  )}
                </button>

                <button
                  onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border cursor-pointer focus:outline-none ${
                    isFilterExpanded
                      ? "bg-pink-950/35 border-pink-500/30 text-pink-400 font-extrabold shadow-md shadow-pink-500/5"
                      : "bg-zinc-900 hover:bg-zinc-850 border-zinc-800 text-zinc-300 hover:text-white"
                  }`}
                  id="btn-desktop-filters-toggle"
                >
                  <SlidersHorizontal className="w-4 h-4 text-pink-400" />
                  <span>Filters</span>
                  
                  {countActiveFilters(filters) > 0 && (
                    <span className="bg-pink-500 text-black font-mono text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center">
                      {countActiveFilters(filters)}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Collapsible Search Panel */}
            <AnimatePresence>
              {isSearchExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Search By Keyword</span>
                      </label>
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          triggerSearchSubmit(e);
                        }} 
                        className="relative flex items-center w-full"
                      >
                        <div className="absolute left-4.5 text-zinc-500 pointer-events-none">
                          <Search className="w-4 h-4" />
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Type movie titles, plot words, actor keywords..."
                          value={searchVal}
                          onChange={(e) => setSearchVal(e.target.value)}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-12 pr-16 py-4 text-xs text-zinc-250 placeholder:text-zinc-650 focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                          id="main-search-input"
                        />

                        {searchVal && (
                          <button
                            type="button"
                            onClick={handleClearSearch}
                            className="absolute right-24 p-2 text-zinc-500 hover:text-zinc-300 rounded-full transition-colors focus:outline-none cursor-pointer"
                          >
                            <X className="w-4.5 h-4.5" />
                          </button>
                        )}

                        <button
                          type="submit"
                          className="absolute right-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-black font-black rounded-xl text-xs transition-colors cursor-pointer focus:outline-none"
                        >
                          Search
                        </button>
                      </form>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Collapsible Filters Panel */}
            <AnimatePresence>
              {isFilterExpanded && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl relative">
                    <FilterSidebar 
                      config={draftFilters}
                      onChange={setDraftFilters}
                      isMockMode={isMockMode}
                      onReset={handleResetFilters}
                      onApply={handleApplyFilters}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </section>
      )}

      {/* =========================================================================
          🎬 MAIN CATALOG VIEW
          ========================================================================= */}
      <span id="discover-feed-anchor" />
      {selectedMovieIdForDetails !== null ? (
        <MovieDetailsView 
          movieId={selectedMovieIdForDetails}
          baseMovie={selectedMovieBaseForDetails || undefined}
          apiKey={apiKey}
          onBack={handleBackFromDetails}
          onToggleWatchlist={handleToggleWatchlist}
          watchlist={watchlist}
          onSelectMovie={handleSelectMovieForDetails}
        />
      ) : (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-6 md:py-8 relative select-none">
          <div className="space-y-12">
          
          {activeTab === "showcase" ? (
            // Immersive Landing Page curations
            loadingLanding ? (
              <div className="space-y-14">
                {[1, 2, 3].map((rowIdx) => (
                  <div key={rowIdx} className="space-y-4">
                    <div className="h-5 bg-zinc-900 rounded-md w-1/4 animate-pulse"></div>
                    <div className="flex gap-6 overflow-hidden">
                      {[1, 2, 3, 4].map((colIdx) => (
                        <div key={colIdx} className="bg-zinc-950 border border-zinc-900 w-[250px] md:w-[280px] h-[340px] rounded-3xl shrink-0 p-4 flex flex-col justify-between animate-pulse">
                          <div className="h-40 bg-zinc-900 rounded-2xl w-full"></div>
                          <div className="h-4 bg-zinc-900 rounded-lg w-3/4 mt-4"></div>
                          <div className="h-3 bg-zinc-900/50 rounded-lg w-1/2 mt-2"></div>
                          <div className="h-9 bg-zinc-900 rounded-xl w-full mt-4"></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : landingFeeds ? (
              <div className="space-y-14">
                {/* Row 1: Featured Masterpieces */}
                <CinematicRow 
                  title="Featured Masterpieces"
                  subtitle="🔥 Critic's Choice Highlights"
                  movies={landingFeeds.featured}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenReviews={handleViewSpotlightReviews}
                  accentColor="text-pink-500"
                  onClickMovie={handleSelectMovieForDetails}
                />

                {/* Row 2: Bollywood Blockbusters */}
                <CinematicRow 
                  title="Bollywood Movies Feed"
                  subtitle="🌟 Discover Indian Blockbusters & Masala Sagas"
                  movies={landingFeeds.bollywood}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenReviews={handleViewSpotlightReviews}
                  accentColor="text-amber-400"
                  onClickMovie={handleSelectMovieForDetails}
                />

                {/* Row 3: Hollywood Legends */}
                <CinematicRow 
                  title="Hollywood Movies Feed"
                  subtitle="🎬 Major League Studio Classics & Sci-Fi"
                  movies={landingFeeds.hollywood}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenReviews={handleViewSpotlightReviews}
                  accentColor="text-cyan-400"
                  onClickMovie={handleSelectMovieForDetails}
                />

                {/* Row 4: 18+ Steamy & Erotic content */}
                <div className="relative p-6 px-1 md:px-6 rounded-3xl bg-gradient-to-r from-red-950/10 via-black to-transparent border border-red-950/30 overflow-hidden shadow-xl">
                  <CinematicRow 
                    title="18+ Adult Content Feed"
                    subtitle="🔞 Sexually Explicit & Erotic Romances Only"
                    movies={landingFeeds.adult18}
                    watchlist={watchlist}
                    onToggleWatchlist={handleToggleWatchlist}
                    onOpenReviews={handleViewSpotlightReviews}
                    accentColor="text-red-500 animate-pulse"
                    isMature={true}
                    onClickMovie={handleSelectMovieForDetails}
                  />
                </div>

                {/* Row 5: Highest Rated Action Movies */}
                <CinematicRow 
                  title="Highest Rated Action Movies"
                  subtitle="💥 High Octane Speed, Combat & Survival Thrillers"
                  movies={landingFeeds.highestRatedAction}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onOpenReviews={handleViewSpotlightReviews}
                  accentColor="text-emerald-400"
                  onClickMovie={handleSelectMovieForDetails}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-zinc-600 text-xs">Failed to populate landing layout. Check TMDB credentials.</p>
              </div>
            )
          ) : activeTab === "wishlist" ? (
            // Watchlisted screenings view
            <div className="space-y-6">
              <div>
                <h3 className="font-display font-black text-white tracking-widest text-base md:text-lg uppercase">
                  My Saved Screenings Wishlist
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  Displaying movies saved for your personal watchlist queue.
                </p>
              </div>

              {watchlist.length === 0 ? (
                <div className="p-12 bg-zinc-950 border border-zinc-900 rounded-3xl text-center space-y-4 max-w-md mx-auto">
                  <span className="text-3xl animate-pulse inline-block">💖</span>
                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    Your Saved screenings watchlist is empty. Tap the heart icon on any movie card to include it.
                  </p>
                  <button
                    onClick={() => setActiveTab("showcase")}
                    className="px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-black font-black text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Explore Curated Showcase
                  </button>
                </div>
              ) : (
                <MovieGrid 
                  movies={moviesList.filter(m => watchlist.includes(m.id))}
                  loading={loading}
                  onOpenReviews={setSelectedMovieForReviews}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onReset={handleResetFilters}
                  onClickMovie={handleSelectMovieForDetails}
                />
              )}
            </div>
          ) : activeTab === "intelligence" ? (
            // Cinema Intelligence Web Scraper
            <IntelligenceHub 
              watchlist={(() => {
                const allMovies = [...moviesList];
                if (landingFeeds) {
                  allMovies.push(
                    ...landingFeeds.featured,
                    ...landingFeeds.bollywood,
                    ...landingFeeds.hollywood,
                    ...landingFeeds.adult18,
                    ...landingFeeds.highestRatedAction
                  );
                }
                const uniqueMap = new Map<number, Movie>();
                allMovies.forEach(m => {
                  if (watchlist.includes(m.id)) {
                    uniqueMap.set(m.id, m);
                  }
                });
                return Array.from(uniqueMap.values());
              })()}
              onSelectMovie={handleSelectMovieForDetails}
            />
          ) : (
            // Search / Filter discoveries view
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display font-black text-white tracking-widest text-base md:text-lg uppercase">
                    Sensory Discovery Coordinates
                  </h3>
                  <p className="text-zinc-500 text-xs mt-0.5 font-sans">
                    Displaying matching live results with exact sensory emotional filters.
                  </p>
                </div>
                {countActiveFilters(filters) > 0 && (
                  <button 
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[10px] uppercase font-mono tracking-widest font-extrabold text-pink-500 hover:text-white transition-colors underline cursor-pointer focus:outline-none"
                  >
                    Clear Filter Coordinates
                  </button>
                )}
              </div>

              {errorMessage ? (
                <div className="p-12 bg-zinc-950 border border-zinc-900 text-slate-400 text-center rounded-3xl space-y-4 max-w-lg mx-auto">
                  <p className="text-sm font-semibold leading-relaxed">{errorMessage}</p>
                  <button 
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 border border-zinc-800 text-xs rounded-xl font-bold cursor-pointer transition-all"
                  >
                    Reset Discoveries parameters
                  </button>
                </div>
              ) : (
                <MovieGrid 
                  movies={moviesList}
                  loading={loading}
                  onOpenReviews={setSelectedMovieForReviews}
                  watchlist={watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  onReset={handleResetFilters}
                  onClickMovie={handleSelectMovieForDetails}
                  hasMore={hasMore}
                  loadingMore={loadingMore}
                  onLoadMore={loadMoreMovies}
                />
              )}
            </div>
          )}

          {/* Informational Footer Component */}
          <Footer />

          </div>
        </main>
      )}

      </div>

      {/* Community Reviews Drawer modal */}
      <ReviewDrawer 
        movie={selectedMovieForReviews}
        isOpen={selectedMovieForReviews !== null}
        onClose={() => setSelectedMovieForReviews(null)}
        apiKey={apiKey}
      />

    </div>
  );
}
