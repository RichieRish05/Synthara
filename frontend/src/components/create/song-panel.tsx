"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { useState } from "react";
import { Textarea } from "~/components/ui/textarea";

export default function SongPanel() {
    const [tab, setTab] = useState<"simple" | "custom">("simple");
    const [description, setDescription] = useState<string>("");

    return (
        <div className="bg-muted/30 flex w-full flex-col border-r lg:w-80">
            <div className="flex-1 overflow-y-auto p-4"> 
                <Tabs value={tab} onValueChange={(value) => setTab(value as "simple" || "custom ") }>
                    <TabsList className="w-full">
                        <TabsTrigger value="simple">Simple</TabsTrigger>
                        <TabsTrigger value="custom">Custom</TabsTrigger>
                    </TabsList>


                    <TabsContent value="simple" className="mt-6 space-y-6">
                        <div className="flex flex-col gap-3">
                            <label className="text-sm font-medium">Describe Your Song</label>
                            <Textarea 
                                value={description}
                                className="min-h-[120px] resize-none" 
                                placeholder="Write a short description of the song you want to create."
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        

                        </div>
                    </TabsContent>
                    <TabsContent value="custom">
                        Custom
                    </TabsContent>

                </Tabs>
            </div>
        </div>
    )

}