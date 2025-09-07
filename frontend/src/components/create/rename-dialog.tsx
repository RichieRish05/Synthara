"use client"

import type { Track } from "./track-list";
import { useState } from "react";
import { Input } from "~/components/ui/input"
import { Button } from "~/components/ui/button"
import { Label  } from "~/components/ui/label"

type RenameDialogProps = {
    track: Track, 
    onClose: () => void, 
    onRename: (trackId: string, newTitle: string) => void
}

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "~/components/ui/dialog"


export default function RenameDialog({track, onRename, onClose } : RenameDialogProps){
    const [title, setTitle] = useState<string>(track.title)
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (title.trim()){
            onRename(track.id, title)
        }
        onClose()        
    }
 

    return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
            <DialogHeader className="text-center mb-2">
                <DialogTitle>Rename Song</DialogTitle>
                <DialogDescription>
                    Rename your song to something else!
                </DialogDescription>
            </DialogHeader>
            <Label htmlFor="title" className="text-md p-2">Title</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="p-5"/>
            <DialogFooter className="sm:justify-start mt-5">
            <DialogClose> 
                <Button type="button" variant="secondary">
                Cancel
                </Button>
            </DialogClose>
            <Button type="submit">
                Save
            </Button> 
            </DialogFooter>
        </form>
      </DialogContent>

    </Dialog>
  )
}
