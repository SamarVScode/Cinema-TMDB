import { Movie, Review, FilterConfig, SpotlightItem, countActiveFilters, MovieCast, MovieVideo, MovieDetail, GENRE_MAP } from "./types";

// Map the abstract Mood tags to TMDB genre ID arrays
export function mapMoodToGenres(mood: string | null): number[] {
  if (!mood) return [];
  switch (mood) {
    case "comedy":
      return [35]; // Comedy
    case "adrenaline":
      return [28]; // Action
    case "horror":
      return [27]; // Horror
    case "thoughtful":
      return [18]; // Drama
    case "feelgood":
      return [10749]; // Romance
    case "family":
      return [10751]; // Family
    case "mystery":
      return [9648]; // Mystery
    case "documentary":
      return [99]; // Documentary
    case "adult":
      return [10749, 18, 53]; // Romance, Drama, Thriller
    default:
      return [];
  }
}

/**
 * Checks if a TMDB API Key looks valid
 */
export function isValidApiKey(key: string): boolean {
  if (!key) return false;
  const tidied = key.trim();
  if (tidied === "" || tidied === "MOCK") {
    return false;
  }
  return true;
}

/**
 * Unified fetch helper that automatically routes requests through our secure Express backend proxy.
 * If the user inputs their own API key/token, it will be forwarded via a custom header ("X-TMDB-Key"),
 * otherwise the backend will securely inject its server-side environment key/token.
 */
export async function tmdbFetch(apiKey: string, urlStr: string, queryParams: Record<string, string> = {}): Promise<Response> {
  let targetUrlStr = urlStr;
  
  // If the URL is absolute TMDB, rewrite it to our local proxy endpoint
  if (urlStr.startsWith("https://api.themoviedb.org/3/")) {
    const subpath = urlStr.replace("https://api.themoviedb.org/3/", "");
    targetUrlStr = `/api/tmdb/${subpath}`;
  }

  // Create local URL relative to the browser window origin
  const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const url = new URL(targetUrlStr, origin);
  
  // Set query parameters
  Object.entries(queryParams).forEach(([key, val]) => {
    url.searchParams.set(key, val);
  });

  const headers: Record<string, string> = {
    "Accept": "application/json"
  };

  // If a custom API Key / Token has been entered by the user in the UI, forward it.
  // We check that it's a non-empty string and not the default fallback or a placeholder.
  if (apiKey && apiKey.trim() !== "" && !apiKey.includes("PASTE_YOUR_TMDB") && apiKey.length > 10) {
    headers["X-TMDB-Key"] = apiKey.trim();
  }

  return fetch(url.toString(), { headers });
}

/**
 * Fetches filtered results from TMDB strictly (no local fallbacks)
 */
export async function fetchFilteredMovies(apiKey: string, config: FilterConfig, page: number = 1, mediaType: "movie" | "tv" = "movie"): Promise<{ movies: Movie[]; isMock: boolean }> {
  const hasSearchQuery = config.searchQuery && config.searchQuery.trim() !== "";
  const activeCount = countActiveFilters(config);
  const isDefaultOverview = activeCount === 0 && !hasSearchQuery;

  // 1. HOME SCREEN MIX: When no filters are selected, pull & interleave standard trending/imdb feeds
  if (isDefaultOverview) {
    try {
      const responses = await Promise.all([
        tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/top_rated`, { language: "en-US", page: page.toString() }).then(res => res.ok ? res.json() : null),
        tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/popular`, { language: "en-US", page: page.toString() }).then(res => res.ok ? res.json() : null),
        tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${mediaType === "tv" ? "on_the_air" : "now_playing"}`, { language: "en-US", page: page.toString() }).then(res => res.ok ? res.json() : null)
      ]);
      
      const topRated = responses[0]?.results || [];
      const popular = responses[1]?.results || [];
      const nowPlaying = responses[2]?.results || [];

      // Interleave feeds to match user requested "mix of featured movies list given by IMDb"
      const mixed: any[] = [];
      const maxLength = Math.max(nowPlaying.length, topRated.length, popular.length);
      const seenIds = new Set<number>();

      for (let i = 0; i < maxLength; i++) {
        if (topRated[i] && !seenIds.has(topRated[i].id)) {
          mixed.push(topRated[i]);
          seenIds.add(topRated[i].id);
        }
        if (popular[i] && !seenIds.has(popular[i].id)) {
          mixed.push(popular[i]);
          seenIds.add(popular[i].id);
        }
        if (nowPlaying[i] && !seenIds.has(nowPlaying[i].id)) {
          mixed.push(nowPlaying[i]);
          seenIds.add(nowPlaying[i].id);
        }
        if (mixed.length >= 24) break;
      }

      const moviesList: Movie[] = mixed.slice(0, 24).map((m: any) => ({
        id: m.id,
        title: m.title || m.name || "Untitled",
        original_language: m.original_language || "en",
        release_date: m.release_date || m.first_air_date || "",
        vote_average: m.vote_average || 0.0,
        overview: m.overview || "No plot overview provided.",
        poster_path: m.poster_path 
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500",
        genre_ids: m.genre_ids || [],
        popularity: m.popularity || 0,
        media_type: mediaType
      }));

      return {
        movies: moviesList,
        isMock: false
      };
    } catch (mixError) {
      console.warn("Failed to compose parallel IMDb feed mix, sliding back to Discovery endpoint...", mixError);
    }
  }

  // 2. DISCOVER & FILTRATION ENGINE (Standard parameter builds)
  let finalUrl = "";
  const params = new URLSearchParams();
  params.append("page", page.toString());

  if (hasSearchQuery) {
    // Use Live TMDB Search API (requires query string)
    finalUrl = `https://api.themoviedb.org/3/search/${mediaType}`;
    params.append("query", config.searchQuery!.trim());
    if (config.mood === "adult") { params.append("include_adult", "true"); } else { params.append("include_adult", "false"); }
  } else {
    // Use premium TMDB Discover Service
    finalUrl = `https://api.themoviedb.org/3/discover/${mediaType}`;
    params.append("sort_by", config.sortBy);
    
    // Strict thresholds to avoid obscure movies; lower requirements for Bollywood releases
    if (config.industry === "hi") {
      params.append("vote_count.gte", "15");
    } else if (config.sortBy === "vote_average.desc") {
      params.append("vote_count.gte", "1000"); // Standard high-rated criteria
    } else {
      params.append("vote_count.gte", "100"); // General baseline
    }

    // Adult content parameter (mainstream R-rated erotic films are false on TMDB)
    if (config.mood === "adult") { params.append("include_adult", "true"); } else { params.append("include_adult", "false"); }
    
    // Bollywood and Hollywood Origin Specifications
    if (config.industry === "hi") {
      params.append("with_original_language", "hi");
      params.append("with_origin_country", "IN"); // Bollywood combination
    } else if (config.industry === "en") {
      params.append("with_original_language", "en");
      params.append("with_origin_country", "US"); // Hollywood combination
    }

    // Rating score
    params.append("vote_average.gte", config.minRating.toString());

    // Exact Year or Era Bounds
    const dateField = mediaType === "tv" ? "first_air_date" : "primary_release_date";
    if (config.exactYear && config.exactYear !== "any") {
      params.append(mediaType === "tv" ? "first_air_date_year" : "primary_release_year", config.exactYear);
    } else {
      const currentYear = 2026;
      if (config.era === "latest") {
        params.append(`${dateField}.gte`, `${currentYear - 3}-01-01`);
        params.append(`${dateField}.lte`, `${currentYear}-12-31`);
      } else if (config.era === "2010s") {
        params.append(`${dateField}.gte`, "2010-01-01");
        params.append(`${dateField}.lte`, "2019-12-31");
      } else if (config.era === "2000s") {
        params.append(`${dateField}.gte`, "2000-01-01");
        params.append(`${dateField}.lte`, "2009-12-31");
      } else if (config.era === "classic") {
        params.append(`${dateField}.lte`, "1999-12-31");
      }
    }

    // Mood mapped to explicit TMDB Genre code lists
    if (config.mood) {
      if (config.mood === "adult") {
        const genres = [10749, 18, 53]; // Romance, Drama, Thriller
        params.append("with_genres", genres.join("|"));
        params.append("with_keywords", "9748|10334|180545|190342|254884|155255|170707|12241|12242"); // Eroticism, Erotic Thriller, Erotic Romance, Erotic Drama, Erotic Film, Softcore, Sensual, Nudity, Female Nudity
        params.append("without_genres", "27,16,14,10751,99"); // Explicitly block Horror, Animation, Fantasy, Family, Documentary
      } else {
        const genres = mapMoodToGenres(config.mood);
        params.append("with_genres", genres.join("|")); // Use vertical bar/pipe separated format for logical OR matching!
      }
    }

    // Min Runtime TMDB code parameter
    if (config.minRuntime > 0) {
      params.append("with_runtime.gte", config.minRuntime.toString());
    }
  }

  const queryParams: Record<string, string> = {};
  params.forEach((value, key) => {
    queryParams[key] = value;
  });

  const response = await tmdbFetch(apiKey, finalUrl, queryParams);
  if (!response.ok) {
    throw new Error(`TMDB HTTP failure: Status code ${response.status}`);
  }

  const data = await response.json();
  let results = data.results || [];

  // If we fetched via keyword search, let's filter client-side to keep mood & active states!
  if (hasSearchQuery) {
    if (config.industry === "en") {
      results = results.filter((m: any) => m.original_language === "en");
    } else if (config.industry === "hi") {
      results = results.filter((m: any) => m.original_language === "hi");
    }

    if (config.minRating > 1) {
      results = results.filter((m: any) => (m.vote_average || 0) >= config.minRating);
    }

    if (config.exactYear && config.exactYear !== "any") {
      results = results.filter((m: any) => {
        const year = m.release_date ? new Date(m.release_date).getFullYear().toString() : "";
        return year === config.exactYear;
      });
    }

    if (config.mood) {
      const genres = mapMoodToGenres(config.mood);
      results = results.filter((m: any) => {
        const mGenreIds = m.genre_ids || [];
        if (config.mood === "adult") {
          const hasAdultGenre = mGenreIds.some((gId: number) => genres.includes(gId));
          const hasHorror = mGenreIds.includes(27);
          return hasAdultGenre && !hasHorror;
        }
        return mGenreIds.some((gId: number) => genres.includes(gId));
      });
    }
  }

  const moviesList: Movie[] = results.slice(0, 24).map((m: any) => ({
    id: m.id,
    title: m.title || m.name || "Untitled",
    original_language: m.original_language || "en",
    release_date: m.release_date || m.first_air_date || "",
    vote_average: m.vote_average || 0.0,
    overview: m.overview || "No plot overview provided.",
    poster_path: m.poster_path 
      ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500",
    genre_ids: m.genre_ids || [],
    popularity: m.popularity || 0,
    adult: m.adult || (config.mood === "adult"),
    media_type: mediaType
  }));

  return {
    movies: moviesList,
    isMock: false
  };
}

/**
 * Map list of TMDB genre IDs to one of our sensory moods dynamically
 */
export function getMoodForMovie(genreIds: number[], isAdultMovie?: boolean): { id: string; name: string } {
  if (isAdultMovie) {
    return { id: "adult", name: "18+ Movies" };
  }
  if (!genreIds || genreIds.length === 0) return { id: "thoughtful", name: "Drama" };
  
  // High-precision category ordering mapping
  const categoryOrder = [
    { id: "comedy", name: "Comedy", ids: [35] },
    { id: "adrenaline", name: "Action", ids: [28] },
    { id: "horror", name: "Horror", ids: [27] },
    { id: "feelgood", name: "Romance", ids: [10749] },
    { id: "family", name: "Family", ids: [10751, 16] },
    { id: "mystery", name: "Mystery", ids: [9648, 80, 53] }, // Thriller is mapped to Mystery/Thriller
    { id: "documentary", name: "Documentary", ids: [99] },
    { id: "adult", name: "18+ Movies", ids: [] },
    { id: "thoughtful", name: "Drama", ids: [18, 878] }
  ];

  // Try matching primary genre first
  const primaryGenre = genreIds[0];
  if (primaryGenre) {
    const primaryMatch = categoryOrder.find(cat => cat.ids.includes(primaryGenre));
    if (primaryMatch) {
      return { id: primaryMatch.id, name: primaryMatch.name };
    }
  }

  // Fallback to any matching genre
  for (const cat of categoryOrder) {
    if (genreIds.some(id => cat.ids.includes(id))) {
      return { id: cat.id, name: cat.name };
    }
  }
  
  return { id: "thoughtful", name: "Drama" };
}

/**
 * Fetches premium spotlight/featured movies directly from TMDB on the fly.
 */
export async function fetchSpotlightMovies(apiKey: string, mediaType: "movie" | "tv" = "movie"): Promise<SpotlightItem[]> {
  try {
    const trendRes = await tmdbFetch(apiKey, `https://api.themoviedb.org/3/trending/${mediaType}/day`, { page: "1" });
    if (!trendRes.ok) {
      throw new Error(`Failed to fetch trending ${mediaType}: ${trendRes.status}`);
    }
    const trendData = await trendRes.json();
    const trendMovies = (trendData.results || []).slice(0, 5); // Take the top 5 trending items

    const results: SpotlightItem[] = [];

    await Promise.all(
      trendMovies.map(async (movie: any) => {
        try {
          const detailRes = await tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movie.id}`);
          if (detailRes.ok) {
            const m = await detailRes.json();
            const bgUrl = m.backdrop_path 
              ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}`
              : `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`;

            const genreIds = m.genres ? m.genres.map((g: any) => g.id) : (movie.genre_ids || []);
            const moodInfo = getMoodForMovie(genreIds, m.adult);

            results.push({
              id: m.id,
              title: m.title || m.name || movie.title || movie.name,
              year: (m.release_date || m.first_air_date) ? new Date(m.release_date || m.first_air_date).getFullYear().toString() : "N/A",
              rating: m.vote_average || movie.vote_average || 0.0,
              moodId: moodInfo.id,
              moodName: moodInfo.name,
              quote: m.tagline || m.overview?.split(".")[0] || "An outstanding cinematic experience.",
              tagline: m.tagline || m.overview || "No tagline available.",
              backdropUrl: bgUrl,
              industry: m.original_language === "hi" ? "hi" : "en",
              genreIds: genreIds,
              overview: m.overview || movie.overview || "No overview available.",
              media_type: mediaType
            });
          }
        } catch (err) {
          console.error(`Error fetching details for ID ${movie.id}:`, err);
        }
      })
    );

    return results.sort((a, b) => b.rating - a.rating);
  } catch (error) {
    console.warn(`Failed to fetch dynamic spotlight ${mediaType} from TMDB:`, error);
    return [];
  }
}

/**
 * Fetches reviews from TMDB API strictly
 */
export async function getMovieReviews(apiKey: string, movieId: number, movieTitle: string, mediaType: "movie" | "tv" = "movie"): Promise<Review[]> {
  try {
    const response = await tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}/reviews`);
    if (!response.ok) {
      throw new Error(`TMDB Reviews error ${response.status}`);
    }
    const data = await response.json();
    const results = data.results || [];
    
    if (results.length === 0) {
      return [];
    }

    return results.slice(0, 3).map((r: any) => ({
      author: r.author || "Anonymous Critic",
      content: r.content ? r.content : "This reviewer did not write any body content."
    }));

  } catch (err) {
    console.warn(`Live TMDB Reviews fetch failed for Movie ID ${movieId}:`, err);
    return [];
  }
}

export interface LandingFeeds {
  featured: Movie[];
  bollywood: Movie[];
  hollywood: Movie[];
  adult18: Movie[];
  highestRatedAction: Movie[];
  isMock: boolean;
}

/**
 * Dynamic landing feeds for Featured, Bollywood, Hollywood, 18+ adult, and Highest Rated Action using Discovery engine
 */
export async function fetchLandingFeeds(apiKey: string, mediaType: "movie" | "tv" = "movie"): Promise<LandingFeeds> {
  try {
    const [featRes, bollyRes, hollyRes, adultRes, actionRes] = await Promise.all([
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/top_rated`, { language: "en-US", page: "1" })
        .then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] })),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/discover/${mediaType}`, {
        with_original_language: "hi",
        with_origin_country: "IN",
        sort_by: "popularity.desc"
      }).then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] })),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/discover/${mediaType}`, {
        with_original_language: "en",
        with_origin_country: "US",
        sort_by: "popularity.desc"
      }).then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] })),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/discover/${mediaType}`, {
        include_adult: "true",
        sort_by: "popularity.desc",
        with_genres: mediaType === "tv" ? "10766|18" : "18|10749|53", // Soap/Drama for TV, Romance/Drama/Thriller for Movie
        with_keywords: mediaType === "tv" ? "" : "9748|10334|180545|190342|254884|155255|170707|12241|12242",
        without_genres: mediaType === "tv" ? "16,10751,10762" : "27,16,14,10751,99",
        "vote_count.gte": "100"
      }).then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] })),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/discover/${mediaType}`, {
        with_genres: mediaType === "tv" ? "10759" : "28", // Action&Adv vs Action
        sort_by: "vote_average.desc",
        "vote_count.gte": "100"
      }).then(r => r.ok ? r.json() : { results: [] })
        .catch(() => ({ results: [] }))
    ]);

    const mapper = (results: any[]) => (results || []).slice(0, 16).map((m: any) => ({
      id: m.id,
      title: m.title || m.name || "Untitled",
      original_language: m.original_language || "en",
      release_date: m.release_date || m.first_air_date || "",
      vote_average: m.vote_average || 0.0,
      overview: m.overview || "No plot overview provided.",
      poster_path: m.poster_path 
        ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
        : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500",
      genre_ids: m.genre_ids || [],
      popularity: m.popularity || 0,
      media_type: mediaType
    }));

    const rawFeatured = mapper(featRes.results || []);
    const rawAdult = mapper(adultRes.results || []);
    let adult18 = rawAdult.filter(m => {
      const badGenres = [27, 16, 14, 10751]; // Horror, Animation, Fantasy, Family
      const hasBadGenre = m.genre_ids && m.genre_ids.some(g => badGenres.includes(g));
      return !hasBadGenre;
    });

    if (adult18.length === 0) {
      adult18 = rawAdult;
    }

    // Set adult flag explicitly to true for 18+ feed
    adult18.forEach((m: any) => {
      m.adult = true;
    });

    const bollywoodList = mapper(bollyRes.results || []);
    const hollywoodList = mapper(hollyRes.results || []);
    const actionList = mapper(actionRes.results || []);

    return {
      featured: rawFeatured,
      bollywood: bollywoodList,
      hollywood: hollywoodList,
      adult18: adult18,
      highestRatedAction: actionList,
      isMock: false
    };

  } catch (error) {
    console.error("Failed to load landing feeds from TMDB:", error);
    return {
      featured: [],
      bollywood: [],
      hollywood: [],
      adult18: [],
      highestRatedAction: [],
      isMock: false
    };
  }
}

/**
 * Fetches comprehensive details for a single movie, including casts, videos/trailers, and recommendations strictly from TMDB.
 */
export async function fetchFullMovieDetails(apiKey: string, movieId: number, baseMovie?: Movie, mediaType: "movie" | "tv" = "movie"): Promise<MovieDetail> {
  try {
    const [detailRes, creditRes, videoRes, similarRes] = await Promise.all([
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}`),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}/credits`),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}/videos`),
      tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}/similar`)
    ]);

    let detailData: any = {};
    if (detailRes.ok) {
      detailData = await detailRes.json();
    } else {
      detailData = baseMovie || {};
    }

    let castList: MovieCast[] = [];
    if (creditRes.ok) {
      const creditData = await creditRes.json();
      castList = (creditData.cast || []).slice(0, 10).map((c: any) => ({
        id: c.id,
        name: c.name || "Unknown Actor",
        character: c.character || "Supporting Role",
        profile_path: c.profile_path 
          ? `https://image.tmdb.org/t/p/w185${c.profile_path}`
          : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150",
        order: c.order || 0
      }));
    }

    let videoList: MovieVideo[] = [];
    if (videoRes.ok) {
      const videoData = await videoRes.json();
      videoList = (videoData.results || [])
        .filter((v: any) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
        .slice(0, 3)
        .map((v: any) => ({
          id: v.id,
          key: v.key,
          name: v.name,
          site: v.site,
          type: v.type
        }));
    }

    let similarList: Movie[] = [];
    if (similarRes.ok) {
      const similarData = await similarRes.json();
      similarList = (similarData.results || []).slice(0, 6).map((m: any) => ({
        id: m.id,
        title: m.title || m.name || "Untitled",
        original_language: m.original_language || "en",
        release_date: m.release_date || m.first_air_date || "",
        vote_average: m.vote_average || 0.0,
        overview: m.overview || "No plot overview provided.",
        poster_path: m.poster_path 
          ? `https://image.tmdb.org/t/p/w500${m.poster_path}`
          : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500",
        genre_ids: m.genre_ids || [],
        popularity: m.popularity || 0,
        media_type: mediaType
      }));
    }

    const backdropPathUrl = detailData.backdrop_path 
      ? `https://image.tmdb.org/t/p/original${detailData.backdrop_path}`
      : (detailData.poster_path 
          ? `https://image.tmdb.org/t/p/original${detailData.poster_path}` 
          : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=1200");

    const posterPathUrl = detailData.poster_path
      ? (detailData.poster_path.startsWith("http") ? detailData.poster_path : `https://image.tmdb.org/t/p/w500${detailData.poster_path}`)
      : "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=500";

    return {
      id: detailData.id || movieId,
      title: detailData.title || detailData.name || baseMovie?.title || "Untitled",
      original_language: detailData.original_language || baseMovie?.original_language || "en",
      release_date: detailData.release_date || detailData.first_air_date || baseMovie?.release_date || "",
      vote_average: detailData.vote_average || baseMovie?.vote_average || 0.0,
      overview: detailData.overview || baseMovie?.overview || "No plot overview provided.",
      poster_path: posterPathUrl,
      genre_ids: detailData.genres ? detailData.genres.map((g: any) => g.id) : (baseMovie?.genre_ids || []),
      popularity: detailData.popularity || baseMovie?.popularity || 0,
      tagline: detailData.tagline || "",
      media_type: mediaType,
      runtime: detailData.runtime || 0,
      budget: detailData.budget || 0,
      revenue: detailData.revenue || 0,
      backdrop_path: backdropPathUrl,
      genres: detailData.genres || [],
      production_companies: detailData.production_companies || [],
      cast: castList,
      videos: videoList,
      similar: similarList
    };

  } catch (error) {
    console.error(`Live movie details fetch failed for ID ${movieId}:`, error);
    throw error;
  }
}

/**
 * Fetches watch providers for a single movie or TV show.
 */
export async function fetchWatchProviders(apiKey: string, movieId: number, mediaType: "movie" | "tv" = "movie"): Promise<any> {
  try {
    const res = await tmdbFetch(apiKey, `https://api.themoviedb.org/3/${mediaType}/${movieId}/watch/providers`);
    if (!res.ok) {
      throw new Error(`Failed to fetch watch providers: ${res.status}`);
    }
    const data = await res.json();
    return data.results || {};
  } catch (err) {
    console.warn(`Watch providers fetch failed for ID ${movieId}:`, err);
    return {};
  }
}
