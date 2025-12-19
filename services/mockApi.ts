
import { GoogleGenAI } from "@google/genai";
import { VideoMetadata, Format, VideoType } from "../types";

/**
 * Robust YouTube Video ID extraction.
 */
const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const fetchVideoMetadata = async (url: string): Promise<VideoMetadata & { sources?: any[] }> => {
  const videoId = extractVideoId(url);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

  // Tight timeout for speed
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    // Ultra-low latency model
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: `Video info for: ${url}. Return ONLY:
      T:[Title]
      C:[Channel]
      D:[Duration]
      V:[video/shorts]`,
      config: {
        tools: [{ googleSearch: {} }],
        thinkingConfig: { thinkingBudget: 0 }, // Disable reasoning for speed
        maxOutputTokens: 150, // Minimize generation time
      }
    });

    clearTimeout(timeoutId);

    const text = response.text || "";
    
    // Quick parse
    const title = text.match(/T:\s*(.*)/i)?.[1]?.trim() || "Video Content";
    const author = text.match(/C:\s*(.*)/i)?.[1]?.trim() || "Creator";
    const duration = text.match(/D:\s*(.*)/i)?.[1]?.trim() || "Duration unknown";
    const typeStr = text.match(/V:\s*(shorts|video)/i)?.[1]?.toLowerCase().trim() || "video";

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;

    const videoFormats: Format[] = [
      { id: '1080p', quality: '1080p', extension: 'mp4', size: '98 MB', label: '1080p Full HD' },
      { id: '720p', quality: '720p', extension: 'mp4', size: '42 MB', label: '720p HD' },
      { id: '360p', quality: '360p', extension: 'mp4', size: '11 MB', label: '360p SD' },
      { id: 'mp3-320', quality: '320kbps', extension: 'mp3', size: '7 MB', label: 'Audio (Hi-Res)', isAudioOnly: true },
    ];

    return {
      id: videoId || 'unknown',
      title: title,
      thumbnail: videoId 
        ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` 
        : `https://picsum.photos/seed/tube/800/450`,
      duration: duration,
      author: author,
      type: typeStr as VideoType,
      formats: videoFormats,
      sources: groundingChunks
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error("Analysis timed out. Try again in a moment.");
    }
    throw new Error("Could not reach video data. Check link.");
  }
};

export const simulateDownload = (onProgress: (progress: number) => void): Promise<void> => {
  return new Promise((resolve) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 45; // Rapid simulation
      if (progress >= 100) {
        progress = 100;
        onProgress(progress);
        clearInterval(interval);
        resolve();
      } else {
        onProgress(progress);
      }
    }, 100);
  });
};
