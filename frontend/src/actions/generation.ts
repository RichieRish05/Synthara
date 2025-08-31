"use server"

import { redirect } from "next/navigation";
import { db } from "../server/db";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { inngest } from "~/inngest/client";




export default async function queueSong(){
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if (!session) {
        redirect("/auth/sign-in")                   // Redirect to sign in
    } 

    const song = await db.song.create({
        data: {
            userId: session.user.id,
            title: "Test Song",
            fullDescribedSong: "A happy song",
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
}