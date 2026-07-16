import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const customKey = req.headers["x-tmdb-key"];
    const tmdbKey = (typeof customKey === "string" && customKey.trim() !== "")
      ? customKey.trim()
      : (process.env.VITE_TMDB_API_KEY || "").trim();

    if (!tmdbKey) {
      return res.status(401).json({ 
        error: "TMDB API key is not configured. Please supply it via the environment variables or the frontend UI." 
      });
    }

    const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
    const subpath = urlObj.pathname.replace(/^\/api\/tmdb\//, "");
    const targetUrl = new URL(`https://api.themoviedb.org/3/${subpath}`);
    
    urlObj.searchParams.forEach((v, k) => {
      targetUrl.searchParams.set(k, v);
    });

    const isJwt = tmdbKey.startsWith("eyJ");
    const headers: Record<string, string> = {
      "Accept": "application/json"
    };

    if (isJwt) {
      headers["Authorization"] = `Bearer ${tmdbKey}`;
    } else {
      targetUrl.searchParams.set("api_key", tmdbKey);
    }

    const tmdbResponse = await fetch(targetUrl.toString(), {
      method: req.method,
      headers
    });

    if (!tmdbResponse.ok) {
      const errText = await tmdbResponse.text();
      return res.status(tmdbResponse.status).send(errText);
    }

    const data = await tmdbResponse.json();
    return res.json(data);
  } catch (error: any) {
    console.error("TMDB Proxy Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error during proxy fetch." });
  }
}
