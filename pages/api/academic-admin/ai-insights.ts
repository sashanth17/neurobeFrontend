import type { NextApiRequest, NextApiResponse } from "next";

// In-memory server cache for memory continuity across serverless calls
let memoryCache: any[] = [];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === "GET") {
      const type = (req.query.type as string)?.toUpperCase();
      let filtered = memoryCache;
      if (type === "CIA" || type === "MCQ") {
        filtered = memoryCache.filter((x) => x.type === type);
      }
      return res.status(200).json({ success: true, count: filtered.length, data: filtered });
    }

    if (req.method === "POST") {
      const body = req.body;
      if (!body) {
        return res.status(400).json({ success: false, error: "Missing body" });
      }

      // If body is already a full report, cache it
      if (body.id && body.points) {
        memoryCache = [body, ...memoryCache.filter((x) => x.id !== body.id)].slice(0, 50);
        return res.status(200).json({ success: true, data: body });
      }

      // If body is input metrics, we can return confirmation
      return res.status(200).json({ success: true, received: true });
    }

    if (req.method === "DELETE") {
      const type = (req.query.type as string)?.toUpperCase();
      if (type === "CIA" || type === "MCQ") {
        memoryCache = memoryCache.filter((x) => x.type !== type);
      } else {
        memoryCache = [];
      }
      return res.status(200).json({ success: true, message: "Memory cleared" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error: any) {
    console.error("AI Insights API error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Internal server error" });
  }
}
