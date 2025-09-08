"use client"

import { Music, Pause, PauseIcon, Play, Volume2 } from "lucide-react"
import { usePlayerStore } from "~/stores/use-player-store"
import { Card } from "./ui/card"
import { useState } from "react"
import { Slider } from "~/components/ui/slider"



export default function SoundBar(){
    const { track, setTrack } = usePlayerStore()
    const [isPlaying, setIsPlaying] = useState<boolean>(false)
    const [volume, setVolume] = useState<Array<number>>([100]);

    return (
        <div className="pb-2 px-4">
        <Card className="bg-background/60 relative w-full shrink-0 border-t   py-0 backdrop-blur">
            <div className="space-y-2 p-3">
                <div className="flex items-center justify-between">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md  bg-gradient-to-br from-purple-500 to-pink-500">
                            {track?.artwork ? <img src={track?.artwork} className="h-full w-full rounded-md object-cover"/> : <Music className="text-white h-4 w-4"/>}
                        </div> 
                        <div className="max-w-24 min-w-0 flex-1 md:max-w-full">
                            <div className="truncate text-sm">
                                {track?.title}
                            </div> 
                            <div className="text-muted-foreground truncate text-sm">
                                <p>{track?.createdByUsername}</p>
                            </div>
                        </div>
                    </div>

                    {/* Play Controls */}
                    <div className="absolute left-1/2 -translate-x-1/2">
                        {
                            isPlaying ? 
                            <Pause className="h-4 w-4" onClick={() => {setIsPlaying(false)}}/> : 
                            <Play className="h-4 w-4" onClick={() => setIsPlaying(true)}/>
                        }
                    </div>
                    

                    {/* Additional Controls */}

                    <div className="flex items-center gap-1">
                        <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4"/>
                            <Slider value={volume} onValueChange={setVolume} step={1} className="w-20" max={100} min={0}/>
                        </div>
                    </div>
                
                </div>
            </div>
        </Card>
        </div>
    )
      
}