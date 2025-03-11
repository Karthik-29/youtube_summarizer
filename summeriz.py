import model
import extract_subtitles
from flask import Flask, request, jsonify



app = Flask(__name__)

@app.route('/summerize', methods=['POST'])
def extract_subtitles_api():
    data = request.get_json()
    video_url = data.get('video_url')
    if not video_url:
        return jsonify({"error": "Missing video_url"}), 400
    result = model.infer(extract_subtitles.extract_subtitles(video_url))
    summary = {"summary": result}
    return jsonify(summary)

if __name__ == '__main__':
    app.run(debug=True)