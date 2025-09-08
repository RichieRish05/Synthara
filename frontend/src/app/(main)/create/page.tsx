import Link from "next/link";
import { auth } from "~/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import SongPanel from "~/components/create/song-panel";
import { Suspense } from "react";
import TrackListFetcher from "~/components/create/track-list-fetcher";
import { Loader2 } from "lucide-react";

 
export default async function CreatePage() {


    // Prevent unauthenticated users from accessing dashboard
    const session = await auth.api.getSession({   // Check db to see if user is authenticated from browser headers
    headers: await headers()                    // Send current cookies over 
    })

    if (!session) {
      redirect("/auth/sign-in")                   // Redirect to sign in
    }

  
  return ( 
    <div className="flex h-full flex-col lg:flex-row  ">
      <SongPanel/>
      <Suspense fallback={
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin"/>Loading Tracks...
      </div>} >
        <TrackListFetcher />
     </Suspense>

    </div>
  );
}
 