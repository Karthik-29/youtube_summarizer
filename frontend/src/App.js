/* global chrome */
import React, { useState, useEffect, useRef } from "react";
import SummaryRenderer from "./components/SummaryRenderer";

export default function App() {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef(null);
  const [theme, setTheme] = useState("light");

  const extractVideoId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  useEffect(() => {
    // Detect theme preference
    const isDarkMode =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(isDarkMode ? "dark" : "light");

    // Listen for theme changes
    const themeChangeHandler = (e) => setTheme(e.matches ? "dark" : "light");
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", themeChangeHandler);

    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", themeChangeHandler);
    };
  }, []);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];

      if (activeTab?.url && activeTab.url.includes("youtube.com/watch")) {
        const url = activeTab.url;
        const vId = extractVideoId(url);

        setVideoUrl(url);
        setVideoId(vId);

        if (vId) {
          checkSummaryStatus(vId);
        } else {
          setError("Could not extract video ID from URL");
        }
      } else {
        chrome.storage.local.get(["currentVideoUrl"], (result) => {
          if (result.currentVideoUrl) {
            const url = result.currentVideoUrl;
            const vId = extractVideoId(url);

            setVideoUrl(url);
            setVideoId(vId);

            if (vId) {
              checkSummaryStatus(vId);
            } else {
              setError("Could not extract video ID from stored URL");
            }
          } else {
            setError("Please navigate to a YouTube video first.");
          }
        });
      }
    });

    return () => clearInterval(pollingRef.current);
  }, []);

  const checkSummaryStatus = (vId) => {
    setLoading(true);
    chrome.runtime.sendMessage(
      {
        action: "checkStatus",
        videoId: vId,
      },
      (response) => {
        if (response.status === "complete") {
          setSummary(response.summary);
          setLoading(false);
        } else if (response.status === "pending") {
          startPolling(vId);
        } else if (response.status === "error") {
          setLoading(false);
          setError(response.message || "An error occurred");
          console.error(response.message);
        } else {
          startSummarization(vId);
        }
      }
    );
  };

  const startPolling = (vId) => {
    let attempts = 0;
    const maxAttempts = 10; // e.g. 10 attempts at 2s intervals = 20 seconds

    pollingRef.current = setInterval(() => {
      attempts++;
      chrome.runtime.sendMessage(
        { action: "checkStatus", videoId: vId },
        (response) => {
          if (response.status === "complete") {
            setSummary(response.summary);
            setLoading(false);
            clearInterval(pollingRef.current);
          } else if (response.status === "error") {
            setError(response.message || "An error occurred");
            setLoading(false);
            clearInterval(pollingRef.current);
            console.error(response.message);
          } else if (attempts >= maxAttempts) {
            // If max attempts reached, stop polling and display an error
            setError(
              "Network error: Unable to fetch summary. Please check your backend server and try again."
            );
            setLoading(false);
            clearInterval(pollingRef.current);
          }
        }
      );
    }, 2000);
  };

  const startSummarization = (vId) => {
    setLoading(true);
    chrome.runtime.sendMessage(
      {
        action: "summarizeVideo",
        videoId: vId,
      },
      (response) => {
        if (
          response.status === "started" ||
          response.status === "pending"
        ) {
          startPolling(vId);
        } else if (response.status === "error") {
          setLoading(false);
          setError(response.message || "An error occurred");
          console.error(response.message);
        }
      }
    );
  };

// Retry handler: clear error, remove any cached summary, and re-check status
const handleRetry = () => {
  console.log("Retrying summary fetch for videoId:", videoId);
  setError("");
  setLoading(true);
  // Remove any cached summary or error stored for this videoId
  chrome.storage.local.get(["summaryCache"], (result) => {
    const cache = result.summaryCache || {};
    if (cache[videoId]) {
      delete cache[videoId];
      chrome.storage.local.set({ summaryCache: cache }, () => {
        console.log("Cleared cached summary for videoId:", videoId);
        if (videoId) {
          checkSummaryStatus(videoId);
        } else {
          setError("No video found to retry.");
          setLoading(false);
        }
      });
    } else {
      if (videoId) {
        checkSummaryStatus(videoId);
      } else {
        setError("Summarization failed on rerty");
        setLoading(false);
      }
    }
  });
};


  return (
    <div
      className={`w-full h-full rounded-lg ${
        theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
      }`}
    >
      <div className="p-6">
        <div className="scroll-container">
          {error && (
            <div className="mb-4">
              <p className="text-red-500">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center space-y-4">
              <p className="text-lg font-medium">Summarizing video...</p>
              <div className="space-y-2">
                <div
                  className={`h-6 w-2/3 mx-auto rounded-md ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  } animate-pulse`}
                ></div>
                <div
                  className={`h-4 w-5/6 mx-auto rounded-md ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  } animate-pulse`}
                ></div>
                <div
                  className={`h-4 w-4/6 mx-auto rounded-md ${
                    theme === "dark" ? "bg-gray-700" : "bg-gray-200"
                  } animate-pulse`}
                ></div>
              </div>
            </div>
          ) : summary ? (
            <SummaryRenderer summary={summary} theme={theme} />
          ) : (
            !error && <p>Open a YouTube video to summarize.</p>
          )}
        </div>
      </div>
    </div>
  );
}
