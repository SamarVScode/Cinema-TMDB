export interface Movie {
  id: number;
  title: string;
  original_language: string;
  release_date: string;
  vote_average: number;
  overview: string;
  poster_path: string;
  genre_ids: number[];
  popularity: number;
  adult?: boolean;
}

export interface Review {
  author: string;
  content: string;
}

export interface FilterConfig {
  industry: "all" | "en" | "hi";
  era: "all" | "latest" | "2010s" | "2000s" | "classic";
  minRating: number;
  mood: string | null;
  exactYear: string; // "any" or 4-digit string like "2024"
  sortBy: "popularity.desc" | "vote_average.desc" | "primary_release_date.desc" | "revenue.desc";
  minRuntime: number; // 0, 90, 120, 150
  searchQuery?: string;
}

// Global Static TMDB Genre Dictionary
export const GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western"
};

export function countActiveFilters(config: FilterConfig): number {
  let count = 0;
  if (config.industry && config.industry !== "all") count++;
  if (config.exactYear && config.exactYear !== "any") {
    count++;
  } else if (config.era && config.era !== "latest") {
    count++;
  }
  if (config.minRating !== undefined && config.minRating !== 5.0) count++;
  if (config.minRuntime !== undefined && config.minRuntime > 0) count++;
  if (config.mood) count++;
  if (config.searchQuery && config.searchQuery.trim() !== "") count++;
  return count;
}

export interface SpotlightItem {
  id: number;
  title: string;
  year: string;
  rating: number;
  moodId: string;
  moodName: string;
  quote: string;
  tagline: string;
  backdropUrl: string;
  industry: "en" | "hi";
  genreIds: number[];
  overview: string;
}

export interface MovieCast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface MovieVideo {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MovieDetail extends Movie {
  tagline?: string;
  runtime?: number;
  budget?: number;
  revenue?: number;
  backdrop_path?: string;
  genres?: { id: number; name: string }[];
  production_companies?: { id: number; name: string; logo_path: string | null; origin_country: string }[];
  cast?: MovieCast[];
  videos?: MovieVideo[];
  similar?: Movie[];
}

