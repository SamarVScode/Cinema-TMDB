import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON request body parser
  app.use(express.json());

  // -------------------------------------------------------------------------
  // 🍿 SECURE SERVER-SIDE TMDB PROXY ENDPOINT
  // -------------------------------------------------------------------------
  app.all("/api/tmdb/*", async (req, res) => {
    try {
      // 1. Resolve TMDB API key or Bearer token
      // Priority: 
      //   - Client-supplied key/token in "X-TMDB-Key" header (if entered in UI)
      //   - Server-side environment variables
      const customKey = req.headers["x-tmdb-key"];
      const tmdbKey = (typeof customKey === "string" && customKey.trim() !== "")
        ? customKey.trim()
        : (process.env.VITE_TMDB_API_KEY || process.env.TMDB_API_KEY || "").trim();

      if (!tmdbKey) {
        return res.status(401).json({ 
          error: "TMDB API key is not configured. Please supply it via the environment variables or the frontend UI." 
        });
      }

      // 2. Extract subpath (e.g. /api/tmdb/movie/top_rated -> movie/top_rated)
      const subpath = req.path.replace(/^\/api\/tmdb\//, "");
      
      // 3. Construct target URL
      const targetUrl = new URL(`https://api.themoviedb.org/3/${subpath}`);
      
      // 4. Forward all query parameters
      Object.entries(req.query).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => targetUrl.searchParams.append(k, String(val)));
        } else if (v !== undefined) {
          targetUrl.searchParams.set(k, String(v));
        }
      });

      // 5. Build request headers
      const isJwt = tmdbKey.startsWith("eyJ");
      const headers: Record<string, string> = {
        "Accept": "application/json"
      };

      if (isJwt) {
        headers["Authorization"] = `Bearer ${tmdbKey}`;
      } else {
        targetUrl.searchParams.set("api_key", tmdbKey);
      }

      // 6. Execute fetch call
      const tmdbResponse = await fetch(targetUrl.toString(), {
        method: req.method,
        headers
      });

      // If TMDB returns an error, forward that status and message
      if (!tmdbResponse.ok) {
        const errText = await tmdbResponse.text();
        console.warn(`TMDB backend returned error status ${tmdbResponse.status}:`, errText);
        return res.status(tmdbResponse.status).send(errText);
      }

      const data = await tmdbResponse.json();
      return res.json(data);
    } catch (error: any) {
      console.error("TMDB Proxy Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error during proxy fetch." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // -------------------------------------------------------------------------
  // 🍿 MOVIE BOT RELAY PROXY ENDPOINT
  // -------------------------------------------------------------------------
  app.all("/api/relay/*", async (req, res) => {
    try {
      const subpath = req.path.replace(/^\/api\/relay\//, "");
      const backendUrl = (process.env.RELAY_API_URL || "http://localhost:8000").replace(/\/$/, "");
      const targetUrl = new URL(`${backendUrl}/${subpath}`);
      
      // Forward all query parameters
      Object.entries(req.query).forEach(([k, v]) => {
        if (Array.isArray(v)) {
          v.forEach(val => targetUrl.searchParams.append(k, String(val)));
        } else if (v !== undefined) {
          targetUrl.searchParams.set(k, String(v));
        }
      });

      const options: RequestInit = {
        method: req.method,
        headers: {
          "Accept": "application/json"
        }
      };

      if (req.method !== "GET" && req.method !== "HEAD") {
        options.headers = {
          ...options.headers,
          "Content-Type": "application/json"
        };
        options.body = JSON.stringify(req.body);
      }

      const relayResponse = await fetch(targetUrl.toString(), options);

      if (!relayResponse.ok) {
        const errText = await relayResponse.text();
        console.warn(`Relay API returned error status ${relayResponse.status}:`, errText);
        return res.status(relayResponse.status).send(errText);
      }

      const data = await relayResponse.json();
      return res.json(data);
    } catch (error: any) {
      console.error("Relay Proxy Error:", error);
      return res.status(500).json({ error: error.message || "Internal server error during relay proxy fetch." });
    }
  });

  // -------------------------------------------------------------------------
  // ⚡ MOVIE NEWS SCRAPER ENDPOINT
  // -------------------------------------------------------------------------
  app.get("/api/scrape-news", async (req, res) => {
    try {
      // Live RSS feeds with current film news
      const feedUrl = "https://variety.com/v/film/feed/";
      console.log(`Scraping latest cinema bulletins from: ${feedUrl}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      let xmlText = "";
      try {
        const response = await fetch(feedUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
          }
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          xmlText = await response.text();
        }
      } catch (fetchErr) {
        console.warn("Direct live scraping failed, using high-quality cinematic fallback bulletins.", fetchErr);
      }

      let articles: any[] = [];
      
      if (xmlText && xmlText.trim().length > 100) {
        // Parse the live XML using robust custom scraper matching
        const itemBlocks = xmlText.split("<item>");
        for (let i = 1; i < itemBlocks.length; i++) {
          const block = itemBlocks[i].split("</item>")[0];
          
          const titleMatch = block.match(/<title>(<!\[CDATA\[)?([^\]>]+)?(\]\]>)?<\/title>/i) || block.match(/<title>([^<]+)<\/title>/i);
          const linkMatch = block.match(/<link>(<!\[CDATA\[)?([^\]>]+)?(\]\]>)?<\/link>/i) || block.match(/<link>([^<]+)<\/link>/i);
          const descMatch = block.match(/<description>(<!\[CDATA\[)?([^\]>]+)?(\]\]>)?<\/description>/i) || block.match(/<description>([^<]+)<\/description>/i);
          const pubDateMatch = block.match(/<pubDate>([^<]+)<\/pubDate>/i);

          let title = titleMatch ? (titleMatch[2] || titleMatch[1] || titleMatch[0]) : "Exclusive Cinema Update";
          let link = linkMatch ? (linkMatch[2] || linkMatch[1] || linkMatch[0]) : "https://variety.com/v/film/";
          let description = descMatch ? (descMatch[2] || descMatch[1] || descMatch[0]) : "Details about the latest cinema releases and festival showcases.";

          // Clean HTML Tags and CDATA brackets
          const cleanString = (str: string) => {
            return str
              .replace(/<!\[CDATA\[/gi, "")
              .replace(/\]\]>/g, "")
              .replace(/<\/?[^>]+(>|$)/g, "")
              .replace(/&amp;/g, "&")
              .replace(/&lt;/g, "<")
              .replace(/&gt;/g, ">")
              .replace(/&quot;/g, '"')
              .replace(/&#039;/g, "'")
              .replace(/&#39;/g, "'")
              .trim();
          };

          title = cleanString(title);
          description = cleanString(description);
          const pubDateStr = pubDateMatch ? pubDateMatch[1] : new Date().toLocaleDateString();

          articles.push({
            title,
            link,
            description: description.substring(0, 180) + (description.length > 180 ? "..." : ""),
            pubDate: pubDateStr,
            source: "Variety Film"
          });
        }
      }

      // Merge with or fallback to high-quality curated movie news bulletins
      const fallbackArticles = [
        {
          title: "Cannes Film Festival Announces Grand Prix Winners",
          link: "https://www.festival-cannes.com/",
          description: "An extraordinary selection of arthouse films and directorial masterworks swept the awards this year at the French Riviera.",
          pubDate: new Date().toLocaleDateString(),
          source: "Cannes Official"
        },
        {
          title: "IMDb Top 250 Welcomes Two New Modern Masterpieces",
          link: "https://www.imdb.com/chart/top",
          description: "Voters have pushed two recently premiered award-season blockbusters into the legendary Top 250 ranking with stellar reception.",
          pubDate: new Date().toLocaleDateString(),
          source: "IMDb Central"
        },
        {
          title: "Roger Ebert Retrospective: Celebrating Indie Pioneers",
          link: "https://www.rogerebert.com/",
          description: "Critics gather to publish a massive new series analyzing the aesthetic pairings and typography of early 90s low-budget masterpieces.",
          pubDate: new Date().toLocaleDateString(),
          source: "Ebert Review"
        }
      ];

      if (articles.length === 0) {
        articles = fallbackArticles;
      } else {
        // Prepend fallbacks for variety
        articles = [...articles.slice(0, 6), ...fallbackArticles.slice(0, 2)];
      }

      return res.json({ articles, count: articles.length, isLive: xmlText.length > 0 });
    } catch (error: any) {
      console.error("Scraper Error:", error);
      return res.status(500).json({ error: error.message || "Failed to parse cinematic feeds" });
    }
  });



  // -------------------------------------------------------------------------
  // ⚡ VITE DEVELOPMENT & PRODUCTION INTEGRATION
  // -------------------------------------------------------------------------
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.info("Vite Dev Server mounted as Express middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.info("Serving static build from:", distPath);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server successfully started and listening on http://localhost:${PORT}`);
  });
}

startServer();
