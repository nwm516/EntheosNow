// Abstract interface for all music providers
export interface MusicProvider {
    name: string;
    initialize(): Promise<void>;
    loadTrack(trackId: string): Promise<void>;
    play(): Promise<void>;
    pause(): Promise<void>;
    stop(): Promise<void>;
    setVolume(volume: number): Promise<void>;
    isPlaying(): boolean;
    cleanup(): Promise<void>;
}

export interface Track {
    id: string;
    name: string;
    energyType: 'warm' | 'cool';
    intensityLevel: 'low' | 'medium' | 'high';
    artist?: string;
    duration?: number;
}