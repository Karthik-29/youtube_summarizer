chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.includes("youtube.com/watch")) {
    // Store the YouTube URL for later use
    chrome.storage.local.set({ currentVideoUrl: tab.url });
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (tab.url && tab.url.includes("youtube.com/watch")) {
    // If on a YouTube page, just open the popup
    // The popup will fetch the URL itself
  } else {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "Invalid Page",
      message: "This extension only works on YouTube videos.",
    });
  }
});