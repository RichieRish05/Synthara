"use server"

import { db } from "../../server/db"; 
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getPresignedURL } from "~/actions/generation";
import TrackList from "./track-list";
import type { Track } from "./track-list";


export default async function TrackListFetcher() {
    let songsWithThumbnails: Track[] = [];


      // Prevent unauthenticated users from accessing dashboard
      const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
        headers: await headers()                    // Send current cookies over 
      })
    
      if (!session) {
        redirect("/auth/sign-in")                   // Redirect to sign in
      }

      console.log(session.user.id)

      const songs = await db.song.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true
                    }
                }
            }
        })

        console.log(songs)
        songsWithThumbnails = await Promise.all(songs.map(async (song) => { // Run all these presigned url requests in parallel
            const thumbnailURL = song.thumbnails3Key ? await getPresignedURL(song.thumbnails3Key) : null
            console.log(song.prompt)
            return {
                id: song.id,
                title: song.title,
                songTags: song.prompt, 
                createdAt: song.createdAt,
                thumbnailURL: thumbnailURL,
                playURL: null, 
                status: song.status, 
                createdByUserName: song.user?.name,
                published: song.published
            } as Track
        }))    

    

      return (
        <TrackList tracks={songsWithThumbnails}/> 
      )
    
}