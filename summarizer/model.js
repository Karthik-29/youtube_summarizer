const express = require("express");
const { spawn } = require("child_process");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json()); // Parse JSON request body

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

// API route
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

// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
