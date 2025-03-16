/* global chrome */
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import SummaryRenderer from "./components/SummaryRenderer";

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cachedResults, setCachedResults] = useState({});

  // Extract video ID from URL
  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match && match[1] ? match[1] : null;
  };

  // Check cache for this video ID
  const checkCache = async (videoId) => {
    return new Promise((resolve) => {
      chrome.storage.local.get(['summaryCache'], (result) => {
        const cache = result.summaryCache || {};
        if (cache[videoId]) {
          resolve(cache[videoId]);
        } else {
          resolve(null);
        }
      });
    });
  };

  // Update cache with new result
  const updateCache = (videoId, summary) => {
    chrome.storage.local.get(['summaryCache'], (result) => {
      const cache = result.summaryCache || {};
      // Add new entry to cache
      cache[videoId] = summary;
      
      // Store back to local storage
      chrome.storage.local.set({ summaryCache: cache });
    });
  };

  useEffect(() => {
    // Try to get the current active tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const activeTab = tabs[0];

      if (activeTab?.url && activeTab.url.includes("youtube.com/watch")) {
        const currVideoId = extractVideoId(activeTab.url);
        if (currVideoId) {
          setVideoUrl(activeTab.url);
          setVideoId(currVideoId);
          
          // Check if we have a cached result
          const cachedSummary = await checkCache(currVideoId);
          if (cachedSummary) {
            console.log("Using cached summary");
            setSummary(cachedSummary);
            setVideoUrl(""); // Hide URL once we have summary
          } else {
            handleExtractAndSummarize(activeTab.url, currVideoId);
          }
        }
      } else {
        // Try to get stored URL from background
        chrome.storage.local.get(['currentVideoUrl'], async (result) => {
          if (result.currentVideoUrl) {
            const currVideoId = extractVideoId(result.currentVideoUrl);
            if (currVideoId) {
              setVideoUrl(result.currentVideoUrl);
              setVideoId(currVideoId);
              
              // Check if we have a cached result
              const cachedSummary = await checkCache(currVideoId);
              if (cachedSummary) {
                console.log("Using cached summary");
                setSummary(cachedSummary);
                setVideoUrl(""); // Hide URL once we have summary
              } else {
                handleExtractAndSummarize(result.currentVideoUrl, currVideoId);
              }
            }
          } else {
            setError("Please navigate to a YouTube video first.");
          }
        });
      }
    });
  }, []);

  // Fetch transcript from backend
  const getVideoTranscript = async (videoUrl) => {
    try {
      const response = await axios.get("http://localhost:8000/transcript", {
        params: { videoUrl },
      });
      return response.data.transcript || "No transcript available.";
    } catch (error) {
      console.error("Error fetching transcript:", error);
      setError("Error fetching transcript. Is your backend server running?");
      return null;
    }
  };

  // Send text to backend for summarization
  const infer = async (prompt) => {
    try {
      const response = await axios.post("http://localhost:8000/infer", { prompt });
      return response.data.response || "No response received.";
    } catch (error) {
      console.error("Error in inference:", error);
      setError("Error getting summary. Is your backend server running?");
      return null;
    }
  };

  // Fetch transcript & summarize automatically
  const handleExtractAndSummarize = async (url, videoId) => {
    if (!url || !videoId) return;
    setLoading(true);
    setSummary("");
    setError("");

    const transcript = await getVideoTranscript(url);
    
    if (!transcript) {
      setLoading(false);
      return;
    }

    const summaryResponse = await infer("Summarize this video transcript: " + transcript);

    if (summaryResponse) {
      setSummary(summaryResponse);
      // Cache the result
      updateCache(videoId, summaryResponse);
      // Clear the video URL once we have a summary
      setVideoUrl("");
    }
    
    setLoading(false);
  };

  // Use memoized summary to prevent unnecessary re-renders
  const memoizedSummary = useMemo(() => {
    return summary;
  }, [summary]);

  return (
    <div className="p-6 w-full h-full bg-white">
      {videoUrl && !summary ? (
        <div className="mb-4">
          <p className="text-sm text-gray-500 truncate">Current video: {videoUrl}</p>
        </div>
      ) : null}

      {error ? (
        <div className="p-4 border rounded bg-red-50 text-red-700 mb-4">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center p-6 min-h-32">
          <p className="text-blue-500 mr-3 text-lg">Summarizing video...</p>
          <div className="animate-spin h-6 w-6 border-3 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : memoizedSummary ? (
        <div className="p-5 border rounded-lg bg-gray-50 shadow-sm">
          <h3 className="font-bold mb-3 text-xl text-gray-800 border-b pb-2">Video Summary</h3>
          <div className="max-h-96 overflow-y-auto pr-2">
            <SummaryRenderer summary={memoizedSummary} />
          </div>
        </div>
      ) : !error ? (
        <div className="flex flex-col items-center justify-center min-h-64 text-center p-6">
          <p className="text-gray-500 text-lg mb-3">Open a YouTube video, and the summary will appear here.</p>
          <p className="text-gray-400 text-sm">Click the extension icon while watching a YouTube video.</p>
        </div>
      ) : null}
    </div>
  );
}