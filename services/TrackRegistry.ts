// TrackRegistry.ts
// Central catalog of all available tracks.
// Adding new tracks = add an entry to the relevant category array.
// Nothing else in the codebase needs to change.

export interface TrackEntry {
    id: string;
    file: any;
    title?: string;
    artist?: string;
    license?: string;
}

const REGISTRY: Record<string, TrackEntry[]> = {
    'warm-low': [
        {
            id: 'warm-low-1',
            file: require('../assets/audio/warm/warm-low.mp3'),
            // Metadata unknown — omitted intentionally
        },
    ],
    'warm-medium': [
        {
            id: 'warm-medium-1',
            file: require('../assets/audio/warm/warm-medium.mp3'),
        },
        {
            id: 'warm-medium-2',
            file: require('../assets/audio/warm/holizna-jump.mp3'),
            title: 'Jump!',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
    ],
    'warm-high': [
        {
            id: 'warm-high-1',
            file: require('../assets/audio/warm/warm-high.mp3'),
            title: 'WE',
            artist: 'Play House',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'warm-high-2',
            file: require('../assets/audio/warm/holizna-witchcraft.mp3'),
            title: 'WitchCraft',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'warm-high-3',
            file: require('../assets/audio/warm/metre-path.mp3'),
            title: 'Path',
            artist: 'Metre',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'warm-high-4',
            file: require('../assets/audio/warm/playhouse-free.mp3'),
            title: 'FREE',
            artist: 'Play House',
            license: 'CC0 1.0 Universal',
        },
    ],
    'cool-low': [
        {
            id: 'cool-low-1',
            file: require('../assets/audio/cool/cool-low.mp3'),
            title: 'NPC Theme',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-low-2',
            file: require('../assets/audio/cool/holizna-tokyo-sunset.mp3'),
            title: 'Tokyo Sunset',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
    ],
    'cool-medium': [
        {
            id: 'cool-medium-1',
            file: require('../assets/audio/cool/cool-medium.mp3'),
        },
        {
            id: 'cool-medium-2',
            file: require('../assets/audio/cool/holizna-2-hour-delay.mp3'),
            title: '2 Hour Delay',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-medium-3',
            file: require('../assets/audio/cool/holizna-one-night-in-france.mp3'),
            title: 'One Night In France',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-medium-4',
            file: require('../assets/audio/cool/holizna-waiting-around.mp3'),
            title: 'Waiting Around',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
    ],
    'cool-high': [
        {
            id: 'cool-high-1',
            file: require('../assets/audio/cool/cool-high.mp3'),
        },
        {
            id: 'cool-high-2',
            file: require('../assets/audio/cool/holizna-confusion.mp3'),
            title: 'Confusion',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-high-3',
            file: require('../assets/audio/cool/holizna-when-time-called-me-darling.mp3'),
            title: 'When Time Called Me Darling',
            artist: 'HoliznaCC0',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-high-4',
            file: require('../assets/audio/cool/metre-conduit.mp3'),
            title: 'Conduit',
            artist: 'Metre',
            license: 'CC0 1.0 Universal',
        },
        {
            id: 'cool-high-5',
            file: require('../assets/audio/cool/metre-slipshod.mp3'),
            title: 'Slipshod',
            artist: 'Metre',
            license: 'CC0 1.0 Universal',
        },
    ],
}

export class TrackRegistry {
    private static lastPlayedPerCategory: Record<string, string> = {};

    static getTracksForCategory(category: string): TrackEntry[] {
        return REGISTRY[category] ?? [];
    }

    static selectTrack(category: string): TrackEntry | null {
        const tracks = REGISTRY[category];

        if (!tracks || tracks.length === 0) {
            console.warn(`No tracks found for category: ${category}`);
            return null;
        }

        if (tracks.length === 1) {
            TrackRegistry.lastPlayedPerCategory[category] = tracks[0].id;
            return tracks[0];
        }

        const lastPlayed = TrackRegistry.lastPlayedPerCategory[category];
        const available = tracks.filter(track => track.id !== lastPlayed);
        const selected = available[Math.floor(Math.random() * available.length)];
        TrackRegistry.lastPlayedPerCategory[category] = selected.id;

        console.log(`Selected track: ${selected.id} from category: ${category}`);
        return selected;
    }

    static getCategoriesForEnergyState(energyState: 'warm' | 'cool'): string[] {
        return [`${energyState}-low`, `${energyState}-medium`, `${energyState}-high`];
    }
}