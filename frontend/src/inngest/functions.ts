import { inngest } from "./client";
import { db } from "../server/db";
import { guid, number } from "better-auth";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);

export const generateSong = inngest.createFunction(
    { id: "generate-song", 
      concurrency: {limit: 1, key: "event.data.userId"}, // Limit to 1 concurrent job per user
      onFailure: async({event, error}) => { // On failure, set the song status to failed
        await db.song.update({
          where: { 
            id: event?.data?.event?.data?.songId
          },
          data: { status: "failed" }
        })  
      } 
    },
    { event: "generate-song-event" },
    async ({ event, step }) => { 
      const {songId} = event.data as {
        songId: string;
        userId: string;
      }

      const {userId, body, endpoint} = await step.run("fetch-song", async () => {
        const song = await db.song.findUniqueOrThrow({ 
          where: { id: songId },
          select: { 
            user: {
              select: { id: true}
            },
            prompt: true,
            lyrics: true,
            describedLyrics: true,
            fullDescribedSong: true,
            instrumental: true,
            guidanceScale: true,
            inferStep: true,
            audioDuration: true
          }
      })
    
      type RequestBody = {
        prompt?: string;
        description?: string;
        lyrics?: string;
        described_lyrics?: string;
        audio_duration?: number;
        guidance_scale?: number;   
        infer_step?: number;
        instrumental?: boolean;
        seed?: number;
      }
        
      let body: RequestBody = {}
      let endpoint: string | undefined = undefined;

      const commonParams = {
        guidance_scale: song.guidanceScale ?? undefined,
        infer_step: song.inferStep ?? undefined,
        audio_duration: song.audioDuration ?? undefined,
        seed: Math.floor(Math.random() * 100), // Random seed for variability
        instrumental: song.instrumental ?? undefined,
      }

      // Description of a song
      if (song.fullDescribedSong) {                         
        endpoint = process.env.GENERATE_FROM_DESCRIPTION;
        body = { 
          description: song.fullDescribedSong,
          ...commonParams
        }
      }

      // Custom Mode: Lyrics + prompt
      else if (song.lyrics && song.prompt) { 
        endpoint = process.env.GENERATE_WITH_LYRICS;                     
        body = { 
          lyrics: song.lyrics,
          prompt: song.prompt,
          ...commonParams
        }
      }

      // Custom Mode: Prompt + described lyrics
      else if (song.prompt && song.describedLyrics) {   
        endpoint = process.env.GENERATE_FROM_DESCRIBED_LYRICS;       
        body = { 
          prompt: song.prompt,
          described_lyrics: song.describedLyrics,
          ...commonParams
        }
      }

      return {
        userId: song.user.id,
        body,
        endpoint 
      }
    }); 

    // Set the song status to processing
    await step.run("set-song-processing", async () => {
      await db.song.update({
        where: { id: songId },
        data: { status: "processing" }
      })
    });

    if (!endpoint) {
      throw new Error("No endpoint defined");
    }

    // Call the Modal API to generate the song
    const res = await step.fetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          "Content-Type": "application/json",
          "Modal-Key": process.env.MODAL_KEY ?? "",
          "Modal-Secret": process.env.MODAL_SECRET ?? ""
        },
      });

    // Update the song with the result
    await step.run("update-song-result", async () => {
        const data = res.ok ? await res.json() : null; 

        await db.song.update({
          where: { id: songId },
          data: {
            s3Key: data?.s3_key,
            thumbnails3Key: data?.s3_thumbnail_key,
            status: res.ok ? "processed" : "failed"
          }
        });

        if (data && data?.categories.length > 0) {
          await db.song.update({
            where: { id: songId },
            data: {
              categories: {
                connectOrCreate: data.categories.map((category: string) => ({
                  where: { name: category },
                  create: { name: category }
                }))
              }
            }
          });
        }
    });
    }


  
)
