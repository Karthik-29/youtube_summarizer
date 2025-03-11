from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from transformers import BitsAndBytesConfig


device = "cuda"
# device = "cpu"
model_name = "google/flan-t5-large"
tokenizer = T5Tokenizer.from_pretrained(model_name)

# Load the model (without quantization for now)
model = T5ForConditionalGeneration.from_pretrained(model_name)

# Move the model to GPU if available
model.to(device)

input_text="hello, how are uou doing"
input_ids = tokenizer.encode(input_text, return_tensors="pt").to(device)
model.eval()
with torch.no_grad():
    outputs = model.generate(
    input_ids,
    max_length=200,
    num_return_sequences=1,
    do_sample=True,  # Enable sampling
    top_p=0.9,       # Use nucleus sampling
    temperature=0.7  # Control randomness
)

generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
print(generated_text)