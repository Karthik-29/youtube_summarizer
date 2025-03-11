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