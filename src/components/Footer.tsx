import React from "react";
import { ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="pt-8 text-center text-[10px] text-zinc-500 font-mono flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-900/40 mt-12 w-full relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>
      
      <span className="tracking-wide">Powered by TMDB Metadata Protocols</span>
      
      <div className="flex items-center gap-4">
        <a 
          href="https://www.themoviedb.org/" 
          target="_blank" 
          rel="noreferrer" 
          className="hover:text-cyan-400 flex items-center gap-1.5 transition-colors group"
         >
          <span>TMDB Registry</span>
          <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>
        <span>•</span>
        <span>© {new Date().getFullYear()} MoodMatch™</span>
      </div>
    </footer>
  );
}
