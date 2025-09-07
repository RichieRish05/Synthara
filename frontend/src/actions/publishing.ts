"use server"

import { db } from "../server/db";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function toggleTrackPublishedState(trackId: string, published: boolean) {

    // Prevent unauthenticated users from accessing dashboard
    const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
        headers: await headers()                    // Send current cookies over 
    })
    
    if (!session) {
        redirect("/auth/sign-in")                   // Redirect to sign in
    }
    
    await db.song.update({
        where: {
            id: trackId
        },
        data: {
            published: !published
        }
    })
   
    revalidatePath('/create')
}



export async function renameSong(trackId: string, newTitle: string) {

    // Prevent unauthenticated users from accessing dashboard
    const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
        headers: await headers()                    // Send current cookies over 
    })
    
    if (!session) {
        redirect("/auth/sign-in")                   // Redirect to sign in
    }
    
    await db.song.update({
        where: {
            id: trackId,
            userId: session.user.id
        },  
        data: {
            title: newTitle
        }
    })
   
    revalidatePath('/create')
} 