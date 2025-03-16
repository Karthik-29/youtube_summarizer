import re
import yt_dlp 
import os
from flask import Flask, request, jsonify
import pyperclip

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

    cleaned_lines = [""]
    for line in lines:
        line = line.strip()

        # Remove timestamp lines like "00:00:02.149 --> 00:00:04.789"
        if line == "" or "-->" in line:
            continue

        # Remove text enclosed in <...> including tags like <c>
        line = re.sub(r"<.*?>", "", line)

        # Add cleaned line if not empty
        if line!=cleaned_lines[-1]: # a lot of lines are repated in the extracted subtitles
            cleaned_lines.append(line)

    # Join lines into coherent speech
    cleaned_text = " ".join(cleaned_lines[4:])
    os.remove("video.en.vtt")
    return cleaned_text


def extract_subtitles(video_url):
    download_subtitles(video_url)
    res = clean_subtitles("video.en.vtt")
    pyperclip.copy(res)
    return res

# extract_subtitles("https://www.youtube.com/watch?v=Lv8BD8xefJs")
