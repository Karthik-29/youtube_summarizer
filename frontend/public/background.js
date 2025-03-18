const pendingRequests = {};

function extractVideoId(videoUrl) {
  const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  return match && match[1] ? match[1] : null;
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com/watch")) {
    chrome.storage.local.set({ currentVideoUrl: tab.url });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    return;
  } else {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Invalid Page",
      message: "This extension only works on YouTube videos.",
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Action: ", request.action, "videoId:", request.videoId);
  
  if (!request.videoId) {
    console.error("Missing videoId in request");
    
    // Try to extract videoId from URL if it's provided
    if (request.videoUrl) {
      const extractedId = extractVideoId(request.videoUrl);
      if (extractedId) {
        request.videoId = extractedId;
      } else {
        sendResponse({ status: "error", message: "Invalid video ID" });
        return true;
      }
    } else {
      sendResponse({ status: "error", message: "Missing video ID" });
      return true;
    }
  }

  const videoId = request.videoId;
  console.log("Processing video ID:", videoId);

  if (request.action === "summarizeVideo") {
    if (pendingRequests[videoId]) {
      console.log("Request already pending for video:", videoId);
      sendResponse({ status: "pending" });
      return true;
    }

    chrome.storage.local.get(["summaryCache"], (result) => {
      const cache = result.summaryCache || {};
      if (cache[videoId]) {
        console.log("Found cached summary for video:", videoId);
        sendResponse({ status: "complete", summary: cache[videoId] });
      } else {
        console.log("Starting new summary for video:", videoId);
        pendingRequests[videoId] = true;
        sendResponse({ status: "started" });
        summarizeVideoInBackground(videoId);
      }
    });

    return true;
  }

  if (request.action === "checkStatus") {
    if (pendingRequests[videoId]) {
      sendResponse({ status: "pending" });
    } else {
      chrome.storage.local.get(["summaryCache"], (result) => {
        const cache = result.summaryCache || {};
        if (cache[videoId]) {
          // Check if an error is stored for this video
          if (cache[videoId].error) {
            sendResponse({ status: "error", message: cache[videoId].error });
          } else {
            sendResponse({ status: "complete", summary: cache[videoId] });
          }
        } else {
          sendResponse({ status: "notStarted" });
        }
      });
    }
    return true;
  }
  
});

async function summarizeVideoInBackground(videoId) {
  try {
    console.log("Attempting to summarize video with ID:", videoId);
    
    // Ensure we have a valid video ID
    if (!videoId) {
      console.error("Invalid video ID");
      throw new Error("Invalid video ID");
    }
    
    // Log the exact endpoint being called
    const transcriptEndpoint = `http://localhost:8000/transcript?videoId=${videoId}`;
    console.log("Fetching transcript from:", transcriptEndpoint);
    
    const transcriptResponse = await fetch(transcriptEndpoint);
    
    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error("Transcript API error:", transcriptResponse.status, errorText);
      throw new Error(`Transcript API returned ${transcriptResponse.status}: ${errorText}`);
    }
    
    const transcriptData = await transcriptResponse.json();

    if (!transcriptData.transcript) {
      console.error("No transcript available in response:", transcriptData);
      throw new Error("No transcript available");
    }

    console.log("Transcript received, length:", transcriptData.transcript.length);
    console.log("Sending to inference API...");

    const inferResponse = await fetch("http://localhost:8000/infer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        videoId: videoId,
        prompt: "Summarize this video transcript: " + transcriptData.transcript 
      }),
    });

    if (!inferResponse.ok) {
      const errorText = await inferResponse.text();
      console.error("Inference API error:", inferResponse.status, errorText);
      throw new Error(`Inference API returned ${inferResponse.status}: ${errorText}`);
    }

    const inferData = await inferResponse.json();

    if (inferData.response) {
      console.log("Summary received, storing in cache");
      chrome.storage.local.get(["summaryCache"], (result) => {
        const cache = result.summaryCache || {};
        cache[videoId] = inferData.response;
        chrome.storage.local.set({ summaryCache: cache });

        delete pendingRequests[videoId];

        chrome.notifications.create({
          type: "basic",
          iconUrl: "icon.png",
          title: "Summary Ready",
          message: "Your video summary is now ready! Click the extension icon to view it.",
        });
      });
    } else {
      console.error("No response in inference data:", inferData);
      throw new Error("No summary response received");
    }
  } catch (error) {
    console.error("Error in background summarization:", error);
    delete pendingRequests[videoId];
  
    // Save the error message in the cache (or another key) to propagate the error state.
    chrome.storage.local.get(["summaryCache"], (result) => {
      const cache = result.summaryCache || {};
      cache[videoId] = { error: error.message };
      chrome.storage.local.set({ summaryCache: cache });
      
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "Summary Error",
        message: `Failed to summarize video: ${error.message}`,
      });
    });
  }
}