# YouTube Video Summarizer Chrome Extension

This project consists of a Node.js backend server and a Chrome extension that summarizes YouTube video transcripts. The extension extracts a transcript from a YouTube video, optionally splits it into chunks, and uses a machine learning inference API (via the backend server) to generate a summary. The summaries from individual chunks are then combined into a final summary.

## Project Structure

```
project-root/
├── backend/
│   ├── backend.js         # Node.js backend server
│   ├── package.json
│   └── ...                # Other backend-related files
├── frontend/
│   ├── config.js          # Shared configuration file
│   ├── src/               # React source code for the extension
│   ├── public/
│   │   ├── background.js  # Chrome extension background script
│   │   └── manifest.json  # Chrome extension manifest (ensure it uses "module" if needed)
│   ├── package.json
│   └── ...                # Other frontend-related files
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) (v12 or later)
- npm (comes with Node.js) or yarn
- Chrome browser (for testing the extension)

## Setup and Usage

### 1. Start the Node Backend

The backend server provides API endpoints for fetching YouTube transcripts and for performing the summarization inference.

1. Open a terminal and navigate to the `backend` directory:

   ```bash
   cd backend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   node backend.js
   ```

   The server will start on `http://localhost:8000` (by default). The backend URL and port are set in the configuration file.

### 2. Build and Load the Chrome Extension

The Chrome extension is built using React and is located in the `frontend` folder.

1. Open another terminal and navigate to the `frontend` directory:

   ```bash
   cd frontend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

   This creates a `build` folder containing the compiled extension files.

4. Load the extension in Chrome:
    - Open Chrome and go to `chrome://extensions/`.
    - Enable "Developer mode" (toggle is at the top-right corner).
    - Click "Load unpacked" and select the `build` folder from the `frontend` directory.

5. Test the extension by navigating to a YouTube video page. Click the extension icon to generate and view the summary.

## Configuration
- The backend currently uses a quantized llama 3.2B model, this can be modified in backend.js
- Chunking is set to 50k tokens and a timeout of 60s for the inference api call, this can be modified in App.js

## Troubleshooting

- **Backend Issues:**  
  Make sure that the Node.js server is running (check the terminal output). The extension depends on the backend being available at the configured URL.

- **Extension Loading Problems:**  
  Verify that the correct folder is loaded as an unpacked extension and that the manifest file is correctly configured (especially if using ES modules).

- **Chunking or Inference Errors:**  
  Check the console logs (both in the Node.js terminal and in Chrome’s Developer Tools) for error messages regarding API calls or transcript processing.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to fork the repository and submit pull requests.

---

Enjoy summarizing YouTube videos with your Chrome extension!

