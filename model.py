from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__)

@app.route("/infer", methods=["POST"])
def generate():
    try:
        data = request.get_json()
        prompt = data.get("prompt", "")

        if not prompt:
            return jsonify({"error": "No prompt provided"}), 400

        process = subprocess.Popen(
            ["ollama", "run", "llama3.2"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        output, error = process.communicate(input=prompt)

        if error:
            return jsonify({"error": error}), 500

        return jsonify({"response": output.strip()})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
