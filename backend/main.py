import modal
import os
import uuid
import base64
from pydantic import BaseModel
import requests

app = modal.App("Synthara") # Initialize modal app

# Define the docker image
image = (
    modal.Image.debian_slim()                                                   # Start with a Linux image
    .apt_install("git")                                                         # Linux command to install git
    .pip_install_from_requirements("requirements.txt")                          # Install local python dependencies
    .run_commands(
        ["git clone https://github.com/ace-step/ACE-Step.git /tmp/ACE-Step",    # Clone in ACE model into a temp dir
         "cd /tmp/ACE-Step && pip install ."]                                   # Install ACE model requirements
    )
    .env({"HF_HOME": "/.cache/huggingface"})                                    # Create an env variable for hugging face models
    .add_local_python_source("prompts")                                         # Inject local file into the docker image
)


model_volume = modal.Volume.from_name("ace-step-models", create_if_missing=True)
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)



aws_secrets = modal.Secret.from_name("synthara-secrets")

class GenerateMusicResponse(BaseModel):
    audio_data: str


 
@app.cls(
    image=image,                                # Pass in our docker image with os and python libraries
    gpu="L40S",                                 # Define GPU
    volumes={
         "/models": model_volume,               # Attach ACE-Step to our server
         "/.cache/huggingface": hf_volume       # Attach our hugging face models to our server
    },
    secrets=[aws_secrets],                      # Pass in our secrets
    scaledown_window=15                         # Keep container running for 15s after invocation
)
class MusicGenServer:

    @modal.enter()
    def load_model(self):
        "Load in model on cold start"
        from acestep.pipeline_ace_step import ACEStepPipeline
        from transformers import AutoModelForCausalLM, AutoTokenizer
        from diffusers import AutoPipelineForText2Image
        import torch

        # Music Generation Model
        self.music_model = ACEStepPipeline(
            checkpoint_dir = '/models',
            dtype="bfloat16",
            torch_compile=False,
            cpu_offload=False,
            overlapped_decode=False
        )

        # Large Language Model
        model_id = "Qwen/Qwen2-7B-Instruct"
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)    # Define tokenizer
        self.llm = AutoModelForCausalLM.from_pretrained(            # Define LLM
            "Qwen/Qwen2-7B-Instruct",
            torch_dtype="auto",
            device_map="auto",
            cache_dir="/.cache/huggingface"
        )

        # Stable Diffusion Model (thumbnails)
        self.image_pipeline = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", 
            torch_dtype=torch.float16, 
            variant="fp16"
        )
        self.image_pipeline.to("cuda")
    

    @modal.fastapi_endpoint(method="POST")
    def generate(self) -> GenerateMusicResponse:
        output_dir = 'tmp/outputs'
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
                prompt= "alternative rock, pop, rock",
                lyrics= "[verse]\nBright lights flashing in the city sky\nRunning fast and we don't know why\nElectric nights got our hearts on fire\nChasing dreams we'll never tire\n\n[verse]\nGrit in our eyes wind in our hair\nBreaking rules we don't even care\nShouting loud above the crowd\nLiving life like we're unbowed\n\n[chorus]\nRunning wild in the night so free\nFeel the beat pumping endlessly\nHearts collide in the midnight air\nWe belong we don't have a care\n\n[verse]\nPiercing through like a lightning strike\nEvery moment feels like a hike\nDaring bold never backing down\nKings and queens without a crown\n\n[chorus]\nRunning wild in the night so free\nFeel the beat pumping endlessly\nHearts collide in the midnight air\nWe belong we don't have a care\n\n[bridge]\nClose your eyes let your spirit soar\nWe are the ones who wanted more\nBreaking chains of the mundane\nIn this world we'll make our claim",
                audio_duration= 202.19997916666668,
                infer_step=60,
                guidance_scale = 15,
                save_path=output_path
        )

        with open(output_path, 'rb') as f:
            audio_bytes = f.read()
        
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        os.remove(output_path) # Cleanup

        return GenerateMusicResponse(audio_data=audio_b64)


  




@app.local_entrypoint()
def main():
   server = MusicGenServer()
   endpoint_url = server.generate.get_web_url() 

   response = requests.post(endpoint_url)
   response.raise_for_status() 
   result = GenerateMusicResponse(**response.json()) 

   audio_bytes = base64.b64decode(result.audio_data)
   output_filename = 'response.wav'

   with open(output_filename, 'wb') as f:
       f.write(audio_bytes)