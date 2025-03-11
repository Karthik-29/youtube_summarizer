import re
import yt_dlp  # Ensure yt-dlp is installed

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
    """ Removes timestamps but keeps all subtitle text intact. """

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

        # Keep all other text
        cleaned_lines.append(line)

    # Join lines into coherent speech
    cleaned_text = " ".join(cleaned_lines)

    # Remove extra spaces
    cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()

    # Save to a text file
    with open(output_file, "w", encoding="utf-8") as file:
        file.write(cleaned_text)

    print(f"Cleaned subtitles saved to {output_file}")
    return cleaned_text

# === RUN THE FULL PIPELINE ===
video_url = input("Enter YouTube video URL: ")

# Step 1: Download subtitles
download_subtitles(video_url)

# Step 2: Clean the subtitles
cleaned_text = clean_subtitles("video.en.vtt")

# Step 3: Show a preview
print("\nPreview of Cleaned Text:\n")
print(cleaned_text[:1000])  # Print first 1000 characters as preview
