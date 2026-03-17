import { MusicProvider } from './MusicProvider';
import { LocalAudioProvider } from './LocalAudioProvider';

export class MusicServiceManager {
    private static instance: MusicServiceManager;
    private activeProvider: MusicProvider | null = null;

    private constructor() {}

    static getInstance(): MusicServiceManager {
        if (!MusicServiceManager.instance) {
            MusicServiceManager.instance = new MusicServiceManager();
        }
        return MusicServiceManager.instance;
    }

    async initializeLocalProvider(): Promise<void> {
        const provider = new LocalAudioProvider();
        await provider.initialize();
        this.activeProvider = provider;
        console.log('Music service initialized with LocalAudioProvider');
    }

    async playForState(energyType: 'warm' | 'cool', intensity: number): Promise<void> {
        if (!this.activeProvider) {
            throw new Error('No music provider initialized');
        }

        const trackId = LocalAudioProvider.getTrackId(energyType, intensity);

        try {
            await this.activeProvider.loadTrack(trackId);
            await this.activeProvider.play();
        } catch (error) {
            console.error('Error playing track:', error);
            throw error;
        }
    }

    async pause(): Promise<void> {
        if (this.activeProvider) {
            await this.activeProvider.pause();
        }
    }

    async stop(): Promise<void> {
        if (this.activeProvider) {
            await this.activeProvider.stop();
        }
    }

    isPlaying(): boolean {
        return this.activeProvider?.isPlaying() || false;
    }

    async cleanup(): Promise<void> {
        if (this.activeProvider) {
            await this.activeProvider.cleanup();
            this.activeProvider = null;
        }
    }
}