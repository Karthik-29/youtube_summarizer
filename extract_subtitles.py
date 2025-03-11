import re
import yt_dlp  # Ensure yt-dlp is installed
import os
from flask import Flask, request, jsonify

def download_subtitles(video_url, output_file="video.en.vtt"):
    """ Downloads English subtitles from a YouTube video. """
    ydl_opts = {
        'writesubtitles': True,
        'subtitleslangs': ['en'],
        'skip_download': True,
        'writeautomaticsub': True,
        'outtmpl': 'video'
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([video_url])

    print(f"Subtitles downloaded: {output_file}")

def clean_subtitles(vtt_file, output_file="clean_subtitles.txt"):
    """Removes timestamps, tags, and cleans up subtitle text."""

    with open(vtt_file, "r", encoding="utf-8") as file:
        lines = file.readlines()

    cleaned_lines = []
    for line in lines:
        line = line.strip()

        # Skip "WEBVTT" header and metadata
        if line.startswith("WEBVTT") or "Kind:" in line or "Language:" in line:
            continue

        # Remove timestamp lines like "00:00:02.149 --> 00:00:04.789"
        if "-->" in line:
            continue

        # Remove text enclosed in <...> including tags like <c>
        line = re.sub(r"<.*?>", "", line)

        # Add cleaned line if not empty
        if line:
            cleaned_lines.append(line)

    # Join lines into coherent speech
    cleaned_text = " ".join(cleaned_lines)
    os.remove("video.en.vtt")
    json_script = {"script": cleaned_text}
    return cleaned_text


def extract_subtitles(video_url):
    download_subtitles(video_url)
    return clean_subtitles("video.en.vtt")

app = Flask(__name__)

@app.route('/extract_subtitles', methods=['POST'])
def extract_subtitles_api():
    data = request.get_json()
    video_url = data.get('video_url')
    if not video_url:
        return jsonify({"error": "Missing video_url"}), 400
    result = extract_subtitles(video_url)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)