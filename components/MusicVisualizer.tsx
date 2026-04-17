import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Animated } from 'react-native';
import { MusicServiceManager } from '../services/MusicServiceManager';
import { HeartbeatVisualizer } from './visualizers/HeartbeatVisualizer';
import { RippleVisualizer } from './visualizers/RippleVisualizer';
import { BurstVisualizer } from './visualizers/BurstVisualizer';
import { CrystalVisualizer } from './visualizers/CrystalVisualizer';
import { TrackEntry } from '../services/TrackRegistry';

const INTENSITY_THRESHOLD = 0.7;

interface MusicVisualizerProps {
    energyState: 'warm' | 'cool';
    intensityLevel: number;
    onBack?: () => void;
}

// Resolves which visualizer style to render based on energy state and intensity.
// Adding a new style later = add a new return value here and a new case in renderVisualizer.
const resolveVisualizer = (
    energyState: 'warm' | 'cool',
    intensity: number
): string => {
    if (energyState === 'warm') {
        return intensity < INTENSITY_THRESHOLD ? 'heartbeat' : 'heartbeat-high';
    } else {
        return intensity < INTENSITY_THRESHOLD ? 'ripple' : 'ripple-high';
    }
};

export const MusicVisualizer = ({ energyState, intensityLevel, onBack }: MusicVisualizerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const musicService = useRef(MusicServiceManager.getInstance()).current;

    const [showTrackInfo, setShowTrackInfo] = useState(false);
    const trackInfoOpacity = useRef(new Animated.Value(0)).current;
    const [currentTrack, setCurrentTrack] = useState<TrackEntry | null>(null);

    useEffect(() => {
        const initMusic = async () => {
            try {
                await musicService.initializeLocalProvider();
                await musicService.playForState(energyState, intensityLevel);
                setIsPlaying(true);
            } catch (error) {
                console.error('Failed to initialize music:', error);
            }
            const track = musicService.getCurrentTrack();
            setCurrentTrack(track);
        };

        initMusic();

        return () => {
            musicService.stop();
        };
    }, []);

    const toggleTrackInfo = () => {
        if (showTrackInfo) {
            Animated.timing(trackInfoOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start(() => setShowTrackInfo(false));
        } else {
            setShowTrackInfo(true);
            Animated.timing(trackInfoOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
    };

    const getEnergyColors = () => {
        if (energyState === 'warm') {
            return {
                primary: '#FF6B35',
                secondary: '#FF4500',
                accent: '#FFD700',
                background: '#1a0600',
            };
        } else {
            return {
                primary: '#4A90E2',
                secondary: '#1E90FF',
                accent: '#00CED1',
                background: '#000615',
            };
        }
    };

    const colors = getEnergyColors();
    const visualizerKey = resolveVisualizer(energyState, intensityLevel);

    // Renders the correct visualizer component based on the resolved key.
    // Placeholder cases fall back to the base style until high-intensity
    // components are designed and built.
    const renderVisualizer = () => {
        switch (visualizerKey) {
            case 'heartbeat':
                return (
                    <HeartbeatVisualizer
                        intensityLevel={intensityLevel}
                        colors={colors}
                    />
                );
            case 'heartbeat-high':
                // Placeholder — HeartbeatVisualizer until high intensity warm style is built
                return (
                    <BurstVisualizer
                        intensityLevel={intensityLevel}
                        colors={colors}
                    />
                );
            case 'ripple':
                return (
                    <RippleVisualizer
                        intensityLevel={intensityLevel}
                        colors={colors}
                    />
                );
            case 'ripple-high':
                // Placeholder — RippleVisualizer until high intensity cool style is built
                return (
                    <CrystalVisualizer
                        intensityLevel={intensityLevel}
                        colors={colors}
                    />
                );
            default:
                // Safety fallback — should never reach here
                console.warn(`Unknown visualizer key: ${visualizerKey}`);
                return (
                    <HeartbeatVisualizer
                        intensityLevel={intensityLevel}
                        colors={colors}
                    />
                );
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.6}
            >
                <View style={styles.backIcon}>
                    <View style={[styles.backArrow, {
                        borderRightColor: colors.primary
                    }]} />
                </View>
            </TouchableOpacity>

            {/* Music note icon — only shows if current track has metadata */}
            {currentTrack?.title && (
                <TouchableOpacity
                    style={styles.trackInfoButton}
                    onPress={toggleTrackInfo}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.musicNoteIcon, { color: colors.primary }]}>♪</Text>
                </TouchableOpacity>
            )}

            {/* Track info overlay */}
            {showTrackInfo && (
                <Animated.View
                    style={[styles.trackInfoOverlay, { opacity: trackInfoOpacity }]}
                >
                    <TouchableOpacity
                        style={styles.trackInfoContent}
                        onPress={toggleTrackInfo}
                        activeOpacity={1}
                    >
                        <Text style={styles.trackTitle}>{currentTrack?.title}</Text>
                        <Text style={styles.trackArtist}>{currentTrack?.artist}</Text>
                        <Text style={styles.trackLicense}>{currentTrack?.license}</Text>
                    </TouchableOpacity>
                </Animated.View>
            )}

            {renderVisualizer()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    backIcon: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backArrow: {
        width: 0,
        height: 0,
        borderTopWidth: 8,
        borderBottomWidth: 8,
        borderRightWidth: 12,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
    },
    trackInfoButton: {
        position: 'absolute',
        bottom: 100,
        right: 30,
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    musicNoteIcon: {
        fontSize: 40,
        opacity: 0.6,
    },
    trackInfoOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 900,
    },
    trackInfoContent: {
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    trackTitle: {
        color: 'rgba(255, 255, 255, 0.95)',
        fontSize: 22,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 8,
    },
    trackArtist: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 16,
        fontWeight: '300',
        textAlign: 'center',
        marginBottom: 16,
    },
    trackLicense: {
        color: 'rgba(255, 255, 255, 0.4)',
        fontSize: 12,
        fontWeight: '300',
        textAlign: 'center',
    },
});