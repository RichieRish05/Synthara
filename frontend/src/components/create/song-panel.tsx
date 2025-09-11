"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";
import { Button } from "../ui/button";
import { Loader2, Music, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { Switch } from "../ui/switch";
import { toast } from "sonner";
import { Input } from "~/components/ui/input";
import type { GenerateRequest } from "~/actions/generation";
import { queueSong } from "~/actions/generation";
import { set } from "better-auth";

const inspirationTags = [
    '80s Synth Pop',
    'Acoustic Ballad',
    'Lo-fi Hip Hop',
    'Summer Beach Vibes',
    'Epic Cinematic',
    'Dark and Moody',
    'Upbeat Pop',
    'Chillwave',
    'Indie Rock',
    'Jazz Fusion',
    'Classical Symphony',
]

const styleTags = [
    'Jazz',
    'Rock',
    'Pop',
    'Classical',
    'Hip Hop',
    'Country',
    'Electronic',
    'Reggae',
    'Trance',
]


export default function SongPanel() {
    const [tab, setTab] = useState<"simple" | "custom">("simple");
    const [description, setDescription] = useState<string>("");
    const [instrumental, setInstrumental] = useState<boolean>(false);
    const [lyricsMode, setLyricsMode] = useState<"auto" | "write">("auto");
    const [lyrics, setLyrics] = useState<string>("");
    const [styles, setStyles] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [title, setTitle] = useState<string>("");
    const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

    const handleInspoButtonClick = (tag: string) => {
        if (tag) {
            setDescription((prev) => prev ? `${prev}, ${tag}` : tag)
        }
    }

    const handleStyleTagClick = (tag: string) => {
        if (tag) {
            setStyles((prev) => prev ? `${prev}, ${tag}` : tag)
        }
    }

    const handleCreate = async () => {
        if  (tab === "simple" && !description.trim() ) {
            toast.error("Please enter a description for your song.");
            return;
        }

        if  (tab === "custom" && !styles.trim()) {
            toast.error("Please enter style tags for your song. .");
            return;
        }


        setLoading(true);
        let requestBody = {} as GenerateRequest
        if (tab === "simple") {
            requestBody = {
                title: title.trim(),
                fullDescribedSong: description.trim(),
                instrumental: instrumental,
            }
        }
        else if (tab === "custom" && lyricsMode === "auto") {
            requestBody = {
                title: title.trim(),
                describedLyrics: lyrics.trim(),
                instrumental: instrumental,
                prompt: styles.trim()
            }
        }
        else if (tab === "custom" && lyricsMode === "write") {
            requestBody = {
                title: title.trim(),
                lyrics: lyrics.trim(),
                instrumental: instrumental,
                prompt: styles.trim()
            }
        }

        if (!requestBody) {
            toast.error("Something went wrong.");
            setLoading(false);
            return;
        }
        try {
            await queueSong(requestBody);
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
            setTitle("");
            setDescription("");
            setLyrics("");
            setStyles("");
            setInstrumental(false);
            setLoading(false);
        }
    }

    return (
        <div className="bg-muted/30 flex w-full flex-col border-r lg:w-80">
            {/* Mobile collapse button */}
            <div className="flex lg:hidden items-center justify-between p-4 border-b">
                <h2 className="font-semibold">Create Song</h2>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCollapsed(!isCollapsed)}
                >
                    {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
            </div>
            
            <div className={`flex-1 overflow-y-auto p-4 lg:block ${isCollapsed ? 'hidden' : 'block'}`}> 
                <Tabs value={tab} onValueChange={(value) => setTab(value as "simple" || "custom ") }>
                    <TabsList className="w-full">
                        <TabsTrigger value="simple">Simple</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>


                    <TabsContent value="simple" className="mt-6 space-y-6">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium">Title Your Song</label>
                            <Input
                                value={title}
                                className="min-h-[30px] resize-none" 
                                placeholder="Song Title"
                                onChange={(e) => setTitle(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium">Describe Your Song</label>
                            <Textarea 
                                value={description}
                                className="min-h-[120px] resize-none" 
                                placeholder="Write a short description of the song you want to create."
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center justify-between ">
                            <Button size="sm" onClick={() => setTab("custom")}>
                                <Plus/>
                                Lyrics
                            </Button>
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium">
                                    Instrumental
                                </label>
                                <Switch 
                                    checked={instrumental} 
                                    onCheckedChange={setInstrumental}
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium">Inspiration</label>
                        </div>
                        <div className="w-full overflow-x-auto whitespace-nowrap">
                            <div className="flex items-center gap-2 pb-2">
                                {inspirationTags.map(tag => (
                                    <Button 
                                        key={tag} 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-7 flex-shrink-0 bg-transparent text-sm"
                                        onClick={() => handleInspoButtonClick(tag)}
                                    >
                                        <Plus className="mr-1"/>
                                        {tag}
                                    </Button>)
                                )}
          
                            </div>
                               

                        </div>
                    </TabsContent>
                    <TabsContent value="custom" className="mt-6 space-y-6">
                        <div className="flex flex-col gap-3 ">
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium">Title Your Song</label>
                                <Input
                                    value={title}
                                    className="min-h-[30px] resize-none" 
                                    placeholder="Song Title"
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium">Lyrics</label>
                                <div className="flex items-center gap-1">
                                    <Button 
                                    variant={lyricsMode === "write" ? "secondary" : "ghost"}
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        setLyricsMode("write")
                                        setLyrics("")
                                    }}>
                                        Write
                                    </Button>
                                    <Button 
                                    variant={lyricsMode === "auto" ? "secondary" : "ghost"}
                                    className="h-7 text-xs"
                                    onClick={() => {
                                        setLyricsMode("auto")
                                        setLyrics("")
                                    }}>
                                        Auto
                                    </Button>
                                </div>
                            </div>
                            <Textarea 
                                value={lyrics}
                                onChange={(e) => setLyrics(e.target.value)}
                                className="min-h-[100px]"
                                placeholder={lyricsMode === "auto" ? "Describe the lyrics you want" : "Write your own lyrics here"}  
                            />
                            <div className="flex justify-between fgap-2">
                                <label className="text-sm font-medium">
                                    Instrumental
                                </label>
                                <Switch 
                                    checked={instrumental} 
                                    onCheckedChange={setInstrumental}
                                />
                            </div>
                        
                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-medium">Styles</label>
                                <Textarea 
                                    value={styles}
                                    onChange={(e) => setStyles(e.target.value)}
                                    className="min-h-[100px]"
                                    placeholder="Enter style tags"
                                />
                            </div>
                            <div className="w-full overflow-x-auto whitespace-nowrap">
                                <div className="flex items-center gap-2 pb-2">
                                    {styleTags.map(tag => (
                                        <Button 
                                            key={tag} 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 flex-shrink-0 bg-transparent text-sm"
                                            onClick={() => handleStyleTagClick(tag)}
                                        >
                                            <Plus className="mr-1"/>
                                            {tag}
                                        </Button>)
                                    )}
            
                                </div>
                            </div>

 

                        </div> 
                    </TabsContent>
                </Tabs>

                <div className="border-t p-4">
                    <Button 
                        className="w-full cursor-pointer bg-gradient-to-r from-orange-500 to-purple-600 font-medium text-white hover:from-orange-600 hover:to-purple-800"
                        onClick={handleCreate}
                        disabled={loading || !(title.trim()) || (tab === "simple" && !description.trim()) || (tab === "custom" && !styles.trim()) || (tab === "custom" && !instrumental && !lyrics.trim())}
                    >
                        {loading ? <Loader2 className="animate-spin"/> : <Music/>}
                        {loading ? "Creating..." : "Create Song"}
                    </Button>
                </div> 

            </div>
        </div>
    )

}