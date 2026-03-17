import { Audio, AVPlaybackStatus } from "expo-av";
import { MusicProvider, Track } from './MusicProvider';

export class LocalAudioProvider implements MusicProvider {
    name = 'Local';
    private sound: Audio.Sound | null = null;
    private currentTrack: Track | null = null;
    private playing: boolean = false;

    // Map track IDs to local audio files
    private trackMap: Record<string, any> = {
        // Warm energy tracks
        'warm-low': require('../assets/audio/warm/warm-low.mp3'),
        'warm-medium': require('../assets/audio/warm/warm-medium.mp3'),
        'warm-high': require('../assets/audio/warm/warm-high.mp3'),

        // Cool energy tracks
        'cool-low': require('../assets/audio/cool/cool-low.mp3'),
        'cool-medium': require('../assets/audio/cool/cool-medium.mp3'),
        'cool-high': require('../assets/audio/cool/cool-high.mp3'),
    };

    async initialize(): Promise<void> {
        // Set audio mode for playback
        await Audio.setAudioModeAsync({
            allowsRecordingIOS: false,
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });

        console.log('LocalAudioProvider initialized.');
    }

    async loadTrack(trackId: string): Promise<void> {
        try{
            // Unload previous track if exists
            if (this.sound) {
                await this.sound.unloadAsync();
                this.sound = null;
            }

            // Check if track exists
            const audioFile = this.trackMap[trackId];
            if (!audioFile) {
                throw new Error(`Track ${trackId} not found`);
            }

            // Load new track
            const { sound } = await Audio.Sound.createAsync(
                audioFile,
                { shouldPlay: false,
                    volume: 1.0,             },
                this.onPlaybackStatusUpdate
            );

            this.sound = sound;
            this.playing = false;

            console.log(`Loaded track: ${trackId}`);
        } catch (error) {
            console.error('Error loading track: ', error);
            throw error;
        }
    }

    async play(): Promise<void> {
        if (!this.sound) {
            throw new Error('No track loaded');
        }

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

        // Volume range: 0.0 to 1.0
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
        this.playing = false;
        console.log('LocalAudioProvider cleaned up');
    }

    // Callback for playback status updates
    private onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
        if (!status.isLoaded) return;

        if (status.didJustFinish) {
            this.playing = false;
            console.log('Track finished playing');
        }
    };

    // Helper: Get track ID based on energy and intensity
    static getTrackId(energyType: 'warm' | 'cool', intensity: number): string {
        let level: 'low' | 'medium' | 'high';

        if (intensity < 0.33) {
            level = 'low';
        } else if (intensity < 0.66) {
            level = 'medium';
        } else {
            level = 'high';
        }

        return `${energyType}-${level}`;
    }
}