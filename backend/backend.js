const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");
const { YoutubeTranscript } = require("youtube-transcript");

const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",  // Allow React development server
      "chrome-extension://*",   // Allow all Chrome extensions
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

// Function to execute ollama and return response
const runOllama = async (prompt) => {
  return new Promise((resolve, reject) => {
    const process = spawn("ollama", ["run", "llama3.2"]);

    let output = "";
    let error = "";

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
    });

    process.on("close", (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(error.trim() || `Ollama exited with code ${code}`));
      }
    });

    process.on("error", (err) => reject(err));

    // Send prompt to ollama
    process.stdin.write(prompt + "\n");
    process.stdin.end();
  });
};

// API routes
app.post("/infer", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const response = await runOllama(prompt);
    res.json({ response });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get("/transcript", async (req, res) => {
  const { videoUrl } = req.query;

  // Extract video ID from URL
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = videoUrl.match(regExp);
  const videoId = match && match[7].length === 11 ? match[7] : false;
  console.log("videoId: "+videoId);
  if (!videoId) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
  }

  try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
      const text = transcript.map(line => line.text).join(" ");
      res.json({ transcript: text });
  } catch (error) {
      console.error("Error fetching subtitles:", error);
      res.status(500).json({ error: "Failed to fetch transcript" });
  }
});


// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
