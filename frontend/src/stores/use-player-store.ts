import { create } from 'zustand'

export interface PlayerTrack {
  id: string;
  title: string | null;
  url: string | null;
  artwork: string | null;
  createdByUsername: string | null;
}

export interface PlayerState {
  track: PlayerTrack | null;   
  setTrack: (track: PlayerTrack) => void;
}

  
// This store will be used across components to affect the song playing in the song bar
export const usePlayerStore = create<PlayerState>((set) => ({ 
   track: null,
   setTrack: (track) => set({ track })
})) 

