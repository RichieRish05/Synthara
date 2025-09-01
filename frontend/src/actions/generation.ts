"use server"

import { redirect } from "next/navigation";
import { db } from "../server/db";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { inngest } from "~/inngest/client";
import { revalidatePath } from "next/cache";



export interface GenerateRequest {
    instrumental: boolean;  
    title?: string;
    prompt?: string
    lyrics?: string;
    fullDescribedSong?: string;
    describedLyrics?: string;
    audioDuration?: number;
}


export default async function queueSong(generateRequest: GenerateRequest) {
    try {
        // Prevent unauthenticated users from accessing dashboard
        const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
        headers: await headers()                    // Send current cookies over 
        })

        if (!session) {
            redirect("/auth/sign-in")                   // Redirect to sign in
        }

        // Clean the title string
        generateRequest.title = generateRequest.title?.trim() || "Untitled"
        generateRequest.title = generateRequest.title.charAt(0).toUpperCase() + generateRequest.title.slice(1)
 
        const song = await db.song.create({
            data: {
                userId: session.user.id,
                title: generateRequest.title,
                prompt: generateRequest.prompt || null,
                lyrics: generateRequest.lyrics || null,
                describedLyrics: generateRequest.describedLyrics || null,
                instrumental: generateRequest.instrumental || false,
                audioDuration: generateRequest.audioDuration || 120,
                fullDescribedSong: generateRequest.fullDescribedSong || null,
                status: "queued"
            } 
        })

        await inngest.send({
            name: "generate-song-event",
            data: {
                songId: song.id,
                userId: session.user.id
            }
        })

        revalidatePath("/create") // Revalidate the create page to show the new song in the list. 

    } catch (PrismaClientInitializationError) {
        redirect("/auth/sign-in")                   // Redirect to sign in if session expired
    }

}