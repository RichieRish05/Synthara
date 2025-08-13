PROMPT_GENERATOR_PROMPT = """
Reformat the following user-provided music description into a simple comma-separated list of audio tags.

User Description: "{user_prompt}"

Follow these guidelines strictly when reformatting. Include a tag from each category below in you final list:
- Include genre (e.g., "rap", "pop", "rock", "electronic")
- Include vocal type (e.g., "male vocal", "female vocal", "spoken word")
- Include instruments actually heard (e.g., "guitar", "piano", "synthesizer", "drums")
- Include mood/energy (e.g., "energetic", "calm", "aggressive", "melancholic")
- Include tempo if known (e.g., "120 bpm", "fast tempo", "slow tempo")
- Include key if known (e.g., "major key", "minor key", "C major")
- The output must be a single line of comma-separated tags. Do not add any other text or explanation. For example: melodic techno, male vocal, electronic, emotional, minor key, 124 bpm, synthesizer, driving, atmospheric

If already a few tags, infer what the user wants and add 2-3 more tags that are synonyms to the users tags with no new categories.

Formatted Tags:
"""

LYRICS_GENERATOR_PROMPT = """
You are a professional songwriter assistant.
Your task is to generate song lyrics strictly based on the provided description. 
Do not add unrelated content, themes, or characters that are not implied by the description.

Requirements:
1. Output only the lyrics — no commentary, explanations, or extra text.
2. Structure the lyrics using only these section tags: [intro], [verse], [chorus], [bridge], [outro].
3. Use the exact tag format: lowercase, in square brackets, at the start of each section.
4. Do not create any sections that are not listed above.
5. Keep section formatting exactly as shown in the example — no extra punctuation around tags.
6. Ensure the tone, imagery, and themes directly match the description.
7. Keep output between 3–6 sections total.
8. Maintain consistent rhyme and rhythm patterns.

Example format:
[verse]
Woke up in a city that's always alive
Neon lights they shimmer they thrive
Electric pulses beat they drive
My heart races just to survive

[chorus]
Oh electric dreams they keep me high
Through the wires I soar and fly
Midnight rhythms in the sky
Electric dreams together we’ll defy

[bridge]
Silent whispers in my ear
Pixelated love serene and clear
Through the chaos find you near
In electric dreams no fear

Description:
"{description}"

Lyrics:
"""


CATEGORIES_GENERATOR_PROMPT = """
Based on the following music description, list 3-5 relevant genres or categories as a comma-separated list. 
For example: Pop, Electronic, Sad, 80s. Description: '{description}'
"""
