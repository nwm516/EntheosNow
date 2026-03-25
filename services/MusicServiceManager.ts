import { MusicProvider } from './MusicProvider';
import { LocalAudioProvider } from './LocalAudioProvider';
import { TrackRegistry } from './TrackRegistry';

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
        // Skip if already initialized
        if (this.activeProvider) {
            console.log('Music service already initialized, reusing provider');
            return;
        }

        const provider = new LocalAudioProvider();
        await provider.initialize();
        this.activeProvider = provider;
        console.log('Music service initialized with LocalAudioProvider');
    }

    // Preloads all tracks for an energy state in parallel
    // Called as fire-and-forget from App.tsx during intensity selection
    async preloadTracksForState(energyState: 'warm' | 'cool'): Promise<void> {
        if (!this.activeProvider?.preloadTrack) return;

        const categories = TrackRegistry.getCategoriesForEnergyState(energyState);

        // For each category, pick a random track and preload it
        // Promise.all fires all preloads simultaneously rather than sequentially
        await Promise.all(
            categories.map(async (category) => {
                const track = TrackRegistry.selectTrack(category);
                if (track && this.activeProvider?.preloadTrack) {
                    await this.activeProvider.preloadTrack(track);
                }
            })
        );

        console.log(`Preloaded all ${energyState} tracks`);
    }

    async playForState(energyType: 'warm' | 'cool', intensity: number): Promise<void> {
        if (!this.activeProvider) {
            throw new Error('No music provider initialized');
        }

        // Determine category from intensity
        const category = `${energyType}-${this.getIntensityLevel(intensity)}`;

        // Select a track — no-repeat logic lives in TrackRegistry
        const track = TrackRegistry.selectTrack(category);
        if (!track) {
            throw new Error(`No tracks available for category: ${category}`);
        }

        try {
            await this.activeProvider.loadTrack(track);
            await this.activeProvider.play();
        } catch (error) {
            console.error('Error playing track:', error);
            throw error;
        }
    }

    private getIntensityLevel(intensity: number): 'low' | 'medium' | 'high' {
        if (intensity < 0.33) return 'low';
        if (intensity < 0.66) return 'medium';
        return 'high';
    }

    async pause(): Promise<void> {
        if (this.activeProvider) await this.activeProvider.pause();
    }

    async stop(): Promise<void> {
        if (this.activeProvider) await this.activeProvider.stop();
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