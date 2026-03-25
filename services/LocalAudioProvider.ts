import { Audio, AVPlaybackStatus } from "expo-av";
import { MusicProvider, Track } from './MusicProvider';
import { TrackEntry } from './TrackRegistry';

export class LocalAudioProvider implements MusicProvider {
    name = 'Local';
    private sound: Audio.Sound | null = null;
    private currentTrackId: string | null = null;
    private playing: boolean = false;

    // Cache for preloaded sounds — keyed by track ID
    private preloadedSounds: Record<string, Audio.Sound> = {};

    async initialize(): Promise<void> {
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        console.log('LocalAudioProvider initialized.');
    }

    // Preloads a track into memory without playing it
    async preloadTrack(trackEntry: TrackEntry): Promise<void> {
        // Skip if already preloaded or currently active
        if (this.preloadedSounds[trackEntry.id] || this.currentTrackId === trackEntry.id) {
            return;
        }

        try {
            const { sound } = await Audio.Sound.createAsync(
                trackEntry.file,
                { shouldPlay: false, volume: 1.0 },
                this.onPlaybackStatusUpdate
            );
            this.preloadedSounds[trackEntry.id] = sound;
            console.log(`Preloaded: ${trackEntry.id}`);
        } catch (error) {
            // Preload failures are silent — fall back to normal loading
            console.warn(`Failed to preload ${trackEntry.id}:`, error);
        }
    }

    async loadTrack(trackEntry: TrackEntry): Promise<void> {
        try {
            // Already loaded and active — just rewind
            if (this.currentTrackId === trackEntry.id && this.sound) {
                console.log(`Track ${trackEntry.id} already loaded, rewinding`);
                await this.sound.setPositionAsync(0);
                return;
            }

            // Unload current track
            if (this.sound) {
                await this.sound.unloadAsync();
                this.sound = null;
            }

            // Use preloaded sound if available — instant
            if (this.preloadedSounds[trackEntry.id]) {
                console.log(`Using preloaded track: ${trackEntry.id}`);
                this.sound = this.preloadedSounds[trackEntry.id];
                delete this.preloadedSounds[trackEntry.id];
                await this.sound.setPositionAsync(0);
            } else {
                // Fall back to loading fresh
                console.log(`Loading track fresh: ${trackEntry.id}`);
                const { sound } = await Audio.Sound.createAsync(
                    trackEntry.file,
                    { shouldPlay: false, volume: 1.0 },
                    this.onPlaybackStatusUpdate
                );
                this.sound = sound;
            }

            this.currentTrackId = trackEntry.id;
            this.playing = false;
            console.log(`Loaded track: ${trackEntry.id}`);

        } catch (error) {
            console.error('Error loading track:', error);
            throw error;
        }
    }

    async play(): Promise<void> {
        if (!this.sound) throw new Error('No track loaded');
        await this.sound.playAsync();
        this.playing = true;
        console.log('Playing track');
    }

    async pause(): Promise<void> {
        if (!this.sound) return;
        await this.sound.pauseAsync();
        this.playing = false;
        console.log('Paused track');
    }

    async stop(): Promise<void> {
        if (!this.sound) return;
        await this.sound.stopAsync();
        this.playing = false;
        console.log('Stopped track');
    }

    async setVolume(volume: number): Promise<void> {
        if (!this.sound) return;
        await this.sound.setVolumeAsync(Math.max(0, Math.min(1, volume)));
    }

    isPlaying(): boolean {
        return this.playing;
    }

    async cleanup(): Promise<void> {
        if (this.sound) {
            await this.sound.unloadAsync();
            this.sound = null;
        }

        // Clean up all preloaded sounds
        for (const trackId in this.preloadedSounds) {
            await this.preloadedSounds[trackId].unloadAsync();
        }
        this.preloadedSounds = {};
        this.playing = false;
        console.log('LocalAudioProvider cleaned up');
    }

    private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;
        if (status.didJustFinish) {
            this.playing = false;
            console.log('Track finished playing');
        }
    };
}