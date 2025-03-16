import { useState } from "react";
import { YoutubeTranscript } from "youtube-transcript"; 
import axios from "axios";

export default function Summarizer() {
  const [videoUrl, setVideoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);


  async function getVideoTranscript(videoUrl) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const videoId = match && match[7].length === 11 ? match[7] : false;
    if (!videoId) {
        console.error("Invalid YouTube URL");
        return "";
    }
    try {
        const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
        return transcript.map(line => line.text).join(" ");
    } catch (error) {
        console.error("Error fetching subtitles:", error);
        return "";
    }
}

const infer = async (prompt) => {
  try {
    const response = await axios.post(
      "http://localhost:8000/infer",
      { prompt },
      { headers: { "Content-Type": "application/json" } }
    );
    return response.data.response || "No response received";
  } catch (error) {
    console.error("Error in inference:", error);
    return "Error fetching response";
  }
};
  const handleExtractAndSummarize = async () => {
    if (!videoUrl) return alert("Please enter a YouTube URL");
    setLoading(true);
    setSummary("");

    const subtitles = await getVideoTranscript(videoUrl);
    const result = await infer("Summarize this video transcript: " + subtitles);
    setSummary(result);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">YouTube Subtitle Summarizer</h1>
      <input
        type="text"
        placeholder="Enter YouTube URL"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleExtractAndSummarize}
        className="bg-blue-500 text-white px-4 py-2 rounded"
        disabled={loading}
      >
        {loading ? "Processing..." : "Summarize"}
      </button>
      {summary && (
        <div className="mt-4 p-3 border rounded bg-gray-100">
          <h2 className="font-semibold">Summary:</h2>
          <p>{summary}</p>
        </div>
      )}
    </div>
  );
}