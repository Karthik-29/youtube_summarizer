import { useState } from "react";
import axios from "axios";

export default function Summarizer() {
  const [videoUrl, setVideoUrl] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const getVideoTranscript = async (videoUrl) => {
    try {
      const response = await axios.get("http://localhost:8000/transcript", {
        params: { videoUrl },
      });
      return response.data.transcript || "No transcript available.";
    } catch (error) {
      console.error("Error fetching transcript:", error);
      return "Error fetching transcript.";
    }
  };

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
          <SummaryRenderer summary={summary} />
        </div>
      )}
    </div>
  );
}

// Extracted SummaryRenderer component
const SummaryRenderer = ({ summary }) => {
  if (!summary) return <p>No summary available.</p>;

  // Split into paragraphs for readability and replace **bold** text
  const paragraphs = summary.split("\n\n").map((para, index) => {
    const formattedPara = para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n/g, "<br />");
    return <p key={index} dangerouslySetInnerHTML={{ __html: formattedPara }} />;
  });

  return <div className="text-gray-700 space-y-2">{paragraphs}</div>;
};
