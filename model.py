from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
import extract_subtitles

# Set device (GPU or CPU)
device = "cuda"  # "cuda" if torch.cuda.is_available() else "cpu"

# Load Flan-T5 model and tokenizer
model_name = "google/flan-t5-large"
tokenizer = T5Tokenizer.from_pretrained(model_name)
model = T5ForConditionalGeneration.from_pretrained(model_name).to(device)
# Ensure model is in eval mode
model.eval()

def infer(input_text):
    input_ids = tokenizer.encode(input_text, return_tensors="pt").to(device)
    # Generate text
    with torch.no_grad():  # Optional, avoids unnecessary gradient tracking
        outputs = model.generate(input_ids)

    # Decode and print generated text
    generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return generated_text

# test_input = extract_subtitles.extract_subtitles("https://www.youtube.com/watch?v=C82fqH5QRhc")["script"][0:500]
# test_input = "summerize this: " + test_input

# print(test_input)
# print("Generated text: " + infer(test_input))