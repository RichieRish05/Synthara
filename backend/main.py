import modal
import os
import uuid
import base64
from pydantic import BaseModel
import requests
from prompts import PROMPT_GENERATOR_PROMPT, LYRICS_GENERATOR_PROMPT, CATEGORIES_GENERATOR_PROMPT
import boto3
from typing import List

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


model_volume = modal.Volume.from_name("ace-step-models", create_if_missing=True)    # Volume to store music gen model weights
hf_volume = modal.Volume.from_name("qwen-hf-cache", create_if_missing=True)         # Volume to cache hugging face models



aws_secrets = modal.Secret.from_name("synthara-secrets")

class GenerateMusicResponse(BaseModel):
    audio_data: str

class AudioGenerationRequest(BaseModel):
    audio_duration: float = 120.0
    seed: int = -1
    guidance_scale: float = 15.0
    infer_step: int = 60 
    instrumental: bool = False

class GenerateFromDescriptionRequest(AudioGenerationRequest):
    description: str

class GenerateWithLyricsRequest(AudioGenerationRequest):
    prompt: str
    lyrics: str

class GenerateWithDescribedLyricsRequest(AudioGenerationRequest):
    prompt: str
    described_lyrics: str

class GenerateMusicResponseS3(BaseModel):
    s3_key: str
    s3_thumbnail_key: str
    categories: List[str]
 
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
        """Test endpoint for generating music """
        output_dir = 'tmp/outputs'
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
                prompt= "alternative rock, pop, rock",
                lyrics= "[verse]\nBright lights flashing in the city sky\nRunning fast and we don't know why\nElectric nights got our hearts on fire\nChasing dreams we'll never tire\n\n[verse]\nGrit in our eyes wind in our hair\nBreaking rules we don't even care\nShouting loud above the crowd\nLiving life like we're unbowed\n\n[chorus]\nRunning wild in the night so free\nFeel the beat pumping endlessly\nHearts collide in the midnight air\nWe belong we don't have a care\n\n[verse]\nPiercing through like a lightning strike\nEvery moment feels like a hike\nDaring bold never backing down\nKings and queens without a crown\n\n[chorus]\nRunning wild in the night so free\nFeel the beat pumping endlessly\nHearts collide in the midnight air\nWe belong we don't have a care\n\n[bridge]\nClose your eyes let your spirit soar\nWe are the ones who wanted more\nBreaking chains of the mundane\nIn this world we'll make our claim",
                audio_duration= 120,
                infer_step=60,
                guidance_scale = 15,
                save_path=output_path
        )

        with open(output_path, 'rb') as f:
            audio_bytes = f.read()
        
        audio_b64 = base64.b64encode(audio_bytes).decode('utf-8')
        os.remove(output_path) # Cleanup

        return GenerateMusicResponse(audio_data=audio_b64)

    def prompt_qwen(self, message):
        """
        Prompt Qwen 72b instruct
        """
        messages = [{"role": "user", "content": message}]

        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )

        model_inputs = self.tokenizer([text], return_tensors="pt").to(self.llm.device)

        generated_ids = self.llm.generate(
            model_inputs.input_ids,
            max_new_tokens=512
        )
        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]

        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]

        return response

    def generate_prompt(self, description):
        """
        Generates song tags for the ACE-Step model

        Args:
            - A user description of the song they want
        Returns: 
            - A comma separated string of music tags
        """
        full_prompt = PROMPT_GENERATOR_PROMPT.format(user_prompt=description) 
        return self.prompt_qwen(full_prompt)

    def generate_lyrics(self, description):
        """
        Generates lyrics for the ACE-Step model

        Args:
            - A user description of the lyrics they want
        Returns:
            - AI generated lyrics
        """

        full_prompt = LYRICS_GENERATOR_PROMPT.format(description=description) 
        return self.prompt_qwen(full_prompt)

    def generate_categories(self, description) -> List[str]:
        """
        Generates categories for the AI generated song

        Args:
            - A user description of song
        Returns:
            - AI generated lyrics
        """
        full_prompt = CATEGORIES_GENERATOR_PROMPT.format(description=description) 
        categories = self.prompt_qwen(full_prompt)
        return [category.strip() for category in categories.split(',') if category.strip()]
    
    def generate_music_and_upload_toS3(
            self, 
            song_tags: str,
            lyrics: str,
            instrumental: bool,
            audio_duration: float,
            infer_step: int,
            guidance_scale: float,
            seed: int,
            description_for_categorization: str
        ) -> GenerateMusicResponseS3:
         
        final_lyrics = "[instrumental]" if instrumental else lyrics
        print(f"Song Tags {song_tags}")
        print(f"Generated Lyrics {final_lyrics}")

        s3_client = boto3.client("s3")
        s3_bucket_name = os.environ["S3_BUCKET_NAME"]

        output_dir = 'tmp/outputs'
        os.makedirs(output_dir, exist_ok=True)
        output_path = os.path.join(output_dir, f"{uuid.uuid4()}.wav")

        self.music_model(
                prompt=song_tags,
                lyrics=final_lyrics,
                audio_duration=audio_duration,
                infer_step=infer_step,
                guidance_scale=guidance_scale,
                save_path=output_path,
                manual_seeds=str(seed)
        )

        audio_s3_key = f"{uuid.uuid4()}.wav"  
        s3_client.upload_file(output_path, s3_bucket_name, audio_s3_key)
        os.remove(output_path) # Cleanup

        # Thumbnail Generation
        thumbnail_prompt = f"{song_tags}, album cover art"
        image = self.image_pipeline(prompt=thumbnail_prompt, num_inference_steps=2, guidance_scale=0.0).images[0]
        image_output_path = os.path.join(output_dir, f"{uuid.uuid4()}.png")
        image.save(image_output_path) 

        image_s3_key = f"{uuid.uuid4()}.png"
        s3_client.upload_file(image_output_path, s3_bucket_name, image_s3_key)

 
        # Category Generation (e.g. hip-hop, rock)
        categories = self.generate_categories(description_for_categorization)

        return GenerateMusicResponseS3(
            s3_key=audio_s3_key,
            s3_thumbnail_key=image_s3_key,
            categories=categories  
        )

    



    @modal.fastapi_endpoint(method="POST")
    def generate_from_description(self, request: GenerateFromDescriptionRequest) -> GenerateMusicResponseS3:
        # Generate a prompt for the music generation model
        song_tags = self.generate_prompt(request.description) 
        # Generate the lyrics for the music generation model if wanted
        lyrics = ""
        if not request.instrumental:
            lyrics = self.generate_lyrics(request.description)
        
        return self.generate_music_and_upload_toS3(
            song_tags=song_tags,
            lyrics=lyrics,
            instrumental=request.instrumental,
            audio_duration=request.audio_duration,
            infer_step=request.infer_step,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
            description_for_categorization=request.description
        )
         

    @modal.fastapi_endpoint(method="POST")
    def generate_with_lyrics(self, request: GenerateWithLyricsRequest) -> GenerateMusicResponseS3:  

        return self.generate_music_and_upload_toS3(
            song_tags=request.prompt,
            lyrics=request.lyrics,
            instrumental=request.instrumental,
            audio_duration=request.audio_duration,
            infer_step=request.infer_step,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
            description_for_categorization=request.prompt
        )

        
 
    @modal.fastapi_endpoint(method="POST")
    def generate_with_described_lyrics(self, request: GenerateWithDescribedLyricsRequest) -> GenerateMusicResponseS3:
        # Generating the lyrics for the music generation model
        lyrics = ""
        if not request.instrumental:
            lyrics = self.prompt_qwen(request.described_lyrics)

        return self.generate_music_and_upload_toS3(
            song_tags=request.prompt,
            lyrics=lyrics,
            instrumental=request.instrumental,
            audio_duration=request.audio_duration,
            infer_step=request.infer_step,
            guidance_scale=request.guidance_scale,
            seed=request.seed,
            description_for_categorization=request.prompt
        )


  




@app.local_entrypoint()
def main():
    server = MusicGenServer()
    endpoint_url = server.generate_from_description.get_web_url() 

    request_data = GenerateFromDescriptionRequest(
        audio_duration=120,
        seed=42,
        guidance_scale=15,
        infer_step=60,
        instrumental=False,
        description="Gangster Rap, 100bpm, soulful"
    )
    
    payload = request_data.model_dump()
    response  = requests.post(endpoint_url, json=payload)
    response.raise_for_status() 
    result = GenerateMusicResponseS3(**response.json()) 
    print('Success')
    print(f"Audio: {result.s3_key}")
    print(f"Image: {result.s3_thumbnail_key}")
    print(f"Categories: {result.categories}")

