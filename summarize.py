import extract_subtitles
from flask import Flask, request, jsonify
import requests
import pyperclip

def infer(prompt, url="http://localhost:8000/infer"):
    try:
        response = requests.post(url, json={"prompt": prompt})
        response.raise_for_status() 
        return response.json().get("response", "No response received")
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"


app = Flask(__name__)

@app.route('/summarize', methods=['POST'])
def extract_subtitles_api():
    data = request.get_json()
    video_url = data.get('video_url')
    if not video_url:
        return jsonify({"error": "Missing video_url"}), 400
    subs = extract_subtitles.extract_subtitles(video_url)
    result = infer("summarize this video transcript:" + subs)
    summary = {"summary": result}
    return jsonify(summary)

if __name__ == '__main__':
    app.run(debug=True)