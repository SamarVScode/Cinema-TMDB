import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const urlObj = new URL(req.url || "", `http://${req.headers.host}`);
    const subpath = urlObj.pathname.replace(/^\/api\/relay\//, "");
    const backendUrl = (process.env.RELAY_API_URL || "http://localhost:8000").replace(/\/$/, "");
    const targetUrl = new URL(`${backendUrl}/${subpath}`);
    
    urlObj.searchParams.forEach((v, k) => {
      targetUrl.searchParams.set(k, v);
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
      return res.status(relayResponse.status).send(errText);
    }

    const data = await relayResponse.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Relay Proxy Error:", error);
    return res.status(500).json({ error: error.message || "Internal server error during relay proxy fetch." });
  }
}
