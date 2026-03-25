// TrackRegistry.ts
// Central catalog of all available tracks.
// Adding new tracks = add an entry to the relevant category array.
// Nothing else in the codebase needs to change.

export interface TrackEntry {
    id: string;
    file: any; // require() result — typed as any because RN asset requires vary
}

// All available tracks organized by category
const REGISTRY: Record<string, TrackEntry[]> = {
    'warm-low': [
        { id: 'warm-low-1', file: require('../assets/audio/warm/warm-low.mp3') },
    ],
    'warm-medium': [
        { id: 'warm-medium-1', file: require('../assets/audio/warm/warm-medium.mp3') },
    ],
    'warm-high': [
        { id: 'warm-high-1', file: require('../assets/audio/warm/warm-high.mp3') },
    ],
    'cool-low': [
        { id: 'cool-low-1', file: require('../assets/audio/cool/cool-low.mp3') },
    ],
    'cool-medium': [
        { id: 'cool-medium-1', file: require('../assets/audio/cool/cool-medium.mp3') },
    ],
    'cool-high': [
        { id: 'cool-high-1', file: require('../assets/audio/cool/cool-high.mp3') },
    ],
};

export class TrackRegistry {
    // Tracks the last played ID per category to prevent repeats
    private static lastPlayedPerCategory: Record<string, string> = {};

    // Returns all tracks in a category
    static getTracksForCategory(category: string): TrackEntry[] {
        return REGISTRY[category] ?? [];
    }

    // Picks a random track from a category, avoiding the last played
    static selectTrack(category: string): TrackEntry | null {
        const tracks = REGISTRY[category];

        if (!tracks || tracks.length === 0) {
            console.warn(`No tracks found for category: ${category}`);
            return null;
        }

        // Only one track — no choice, just return it
        if (tracks.length === 1) {
            TrackRegistry.lastPlayedPerCategory[category] = tracks[0].id;
            return tracks[0];
        }

        // Filter out the last played track to prevent repeat
        const lastPlayed = TrackRegistry.lastPlayedPerCategory[category];
        const available = tracks.filter(track => track.id !== lastPlayed);

        // Pick randomly from available tracks
        const selected = available[Math.floor(Math.random() * available.length)];
        TrackRegistry.lastPlayedPerCategory[category] = selected.id;

        console.log(`Selected track: ${selected.id} from category: ${category}`);
        return selected;
    }

    // Returns all categories for a given energy state
    // Used by preloading to know which categories to prepare
    static getCategoriesForEnergyState(energyState: 'warm' | 'cool'): string[] {
        return [`${energyState}-low`, `${energyState}-medium`, `${energyState}-high`];
    }
}