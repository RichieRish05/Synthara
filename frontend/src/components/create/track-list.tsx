"use client"
import { Trash, Download, MoreHorizontalIcon, RefreshCcw, Search, XCircle } from "lucide-react"
import TrackListFetcher from "./track-list-fetcher"
import { Input } from "../ui/input"
import { useState } from "react"
import { Button  } from "../ui/button"
import { Loader2, Music, Play, Pencil} from "lucide-react"
import { getPlayURL } from "~/actions/generation"
import { toggleTrackPublishedState, renameSong, deleteSong } from "~/actions/publishing"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu"
import RenameDialog from "./rename-dialog"
import { useRouter } from "next/navigation"
import { usePlayerStore } from "~/stores/use-player-store" 


export interface Track {
    id: string, 
    title: string,
    createdAt: Date, 
    thumbnailURL: string,
    playURL: string | null, 
    status: "processing" | "processed" | "failed" | "queued",
    createdByUserName: string
    published: boolean
    songTags: string
} 

export default function TrackList({tracks} : {tracks: Track[]} ) {
    const [searchQuery, setSearchQuery] = useState<string>("")
    const [refreshing, setIsRefreshing] = useState<boolean>(false)
    const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null)
    const [trackToRename, setTrackToRename] = useState<Track | null>(null);  
    const [trackToDelete, setTrackToDelete] = useState<Track | null>(null);  
    const { track, setTrack } = usePlayerStore()

    const router = useRouter()
    let filteredTracks = tracks
    console.log('All tracks:', tracks)
    console.log('Track thumbnails:', tracks.map(track => ({ title: track.title, thumbnailURL: track.thumbnailURL })))

    if (searchQuery.trim()){
        filteredTracks = tracks.filter((track) => track.title.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    console.log('Filtered tracks:', filteredTracks)

    
    const handleTrackSelect = async (track: Track) => {
        if (loadingTrackId) return
        setLoadingTrackId(track.id)
        const playURl = await getPlayURL(track.id)
        console.log(playURl)
        setLoadingTrackId(null)

        setTrack({
            id: track.id,
            url: playURl,
            artwork: track.thumbnailURL,
            title: track.title,
            createdByUsername: track.createdByUserName
        })
    }

    const handleRefresh = async () => {
        setIsRefreshing(true) 
        router.refresh()
        setTimeout(() => setIsRefreshing(false), 1000) 
    }
   
    return (
        <div className="flex flex-1 flex-col overflow-y-scroll min-h-0">
            <div className="flex-1 p-6">
                <div className="mb-4 flex items-center justify-between gap-4f">
                    <div className="relative max-w-md flex-1">
                        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"/>   
                        <Input 
                            placeholder="Search..." 
                            className="pl-10"
                            onChange={(e) => setSearchQuery(e.target.value)}
                            value={searchQuery}
                        /> 
                    </div>
                    <Button
                        variant="outline"
                        disabled={refreshing}
                        size="sm"
                        onClick={handleRefresh}
                    >
                        {refreshing ? (
                            <Loader2 className="mr-2 animate-spin"/>
                             
                        ) : (
                            <RefreshCcw className="mr-2"/> 
                        )}
                        Refresh
                    </Button>
                </div>

            {/* Track List */}
            <div className="space-y-2 h-full">
                 {filteredTracks.length > 0 ? 
                    (
                    filteredTracks.map(track => {
                        switch(track.status){
                            case "failed": 
                            return (
                            <div key={track.id} className="flex cursor-not-allowed items-center gap-4 rounded-lg p-3">
                                <div className="bg-destructive/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                                      <XCircle className="text-destructive h-6 w-6"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-destructive truncate text-sm font-md">Generation Failed</h3>
                                    <p className="text-muted-foreground text-xs truncate">Please try to generate once more</p>
                                </div>   
                            </div>) 

                            case "queued": 
                            case "processing":
                            return (
                            <div key={track.id} className="flex cursor-not-allowed items-center justify-between gap-4 rounded-lg p-3">
                                <div className="bg-muted/10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-md">
                                      <Loader2 className="text-muted-foreground animate-spin h-6 w-6"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-muted-foreground truncate text-sm font-md">{track.title}</h3>
                                    <p className="text-muted-foreground text-xs truncate">Refresh to Check Status</p>
                                </div>   
                            </div>)

                            default: 
                            return (
                            <div key={track.id} 
                            className={`group flex cursor-pointer items-center gap-4 rounded-lg p-3 transition-colors 
                            ${trackToDelete?.id === track.id ? "pointer-events-none opacity-50" : "hover:bg-gray-100"}`}
                            onClick={() => handleTrackSelect(track)}
                            >
                                <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                                    {track.thumbnailURL ? 
                                    <img 
                                        src={track.thumbnailURL} 
                                        alt={`${track.title} thumbnail`}
                                        className="h-full w-full object-cover"
                                    /> : 
                                    <div className="bg-muted flex h-full w-full rounded-md items-center justify-center">
                                        <Music className="text-muted-foreground h-6 w-6"/>
                                    </div>}
                                     <div className="absolute inset-0 flex items-center justify-center bg-black/20  opacity-0 transition-opacity group-hover:opacity-100">
                                        {loadingTrackId === track.id ? <Loader2 className="animate-spin text-white"/> : <Play className="text-white"/>}
                                    </div>
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="text-muted-foreground truncate text-sm font-md">{track.title}</h3>
                                    <p className="text-muted-foreground text-xs truncate">{track.createdByUserName}</p>
                                </div>   
                                

                                {/*Actions*/}
                                <div className="flex items-center gap-2">
                                    <Button 
                                    className={`cursor-pointer ${track.published ? 'border-red-200' : ''}`} 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={async (e) => {
                                        e.stopPropagation()
                                        await toggleTrackPublishedState(track.id, track.published)
                                    }}>
                                        {track.published ? "Unpublish" : "Publish"}
                                    </Button>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant='ghost' size='icon'>
                                                <MoreHorizontalIcon/>
                                            </Button>
                                        </DropdownMenuTrigger>
            
                                        <DropdownMenuContent align="end" className="w-30">
                                            <DropdownMenuItem 
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                const presignedURL = await getPlayURL(track.id)
                                                window.open(presignedURL, "_blank")
                                            }}
                                            > 
                                                <Download  className="mr-2"/>
                                                Download
                   
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setTrackToRename(track)
                                            }}
                                            > 
                                                <Pencil className="mr-2"/>
                                                Rename
                   
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                            onClick={async (e) => {
                                                e.stopPropagation()
                                                setTrackToDelete(track)
                                                await deleteSong(track.id)
                                                // setTrackToDelete(null)
                                            }}
                                            > 
                                                <Trash className="mr-2"/>
                                                Delete
                   
                                            </DropdownMenuItem>

                                        </DropdownMenuContent>

                                    </DropdownMenu>

                                </div>


                            </div>)
                        }  
                    })  
                    ) : (
                    <div className="flex h-full flex-col gap-3 items-center justify-center">
                        <div>No Tracks Found</div>
                    </div>
                    )
                 }

            </div>
            </div> 
                 
            {trackToRename ? <RenameDialog track={trackToRename} onClose={()=> setTrackToRename(null)} onRename={renameSong}/> : ""}
        </div>
    )
     

}    