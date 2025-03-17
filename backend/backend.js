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
    console.log("Inference complete");
    res.json({ response });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.get('/transcript', async (req, res) => {
  try {
    const videoId = req.query.videoId;
    
    if (!videoId) {
      return res.status(400).json({ error: 'Missing videoId parameter' });
    }
    
    console.log(`Fetching transcript for video ID: ${videoId}`);
    
    // Get transcript directly using videoId
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    
    if (!transcript || transcript.length === 0) {
      return res.status(404).json({ error: 'No transcript available for this video' });
    }
    
    // Process the transcript
    const fullText = transcript
      .map(item => item.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return res.json({ transcript: fullText });
  } catch (error) {
    console.error('Error fetching transcript:', error);
    return res.status(500).json({ error: error.message || 'Failed to get transcript' });
  }
});


// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
