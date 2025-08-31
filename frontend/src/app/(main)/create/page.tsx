import Link from "next/link";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import CreateSong from "~/components/createSong";
import SongPanel from "~/components/create/song-panel";
 
export default async function CreatePage() {

  try {
    // Prevent unauthenticated users from accessing dashboard
    const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
    headers: await headers()                    // Send current cookies over 
    })

    if (!session) {
      redirect("/auth/sign-in")                   // Redirect to sign in
    }
  } catch (PrismaClientInitializationError) {
    redirect("/auth/sign-in")                   // Redirect to sign in if session expired
  }

  
  return ( 
    <div className="flex h-full flex-col lg:flex-row  ">
      <SongPanel/>

    </div>
  );
}
 