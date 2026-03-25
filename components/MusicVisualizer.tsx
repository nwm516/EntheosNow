import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { MusicServiceManager } from '../services/MusicServiceManager';
import { HeartbeatVisualizer } from './visualizers/HeartbeatVisualizer';
import { RippleVisualizer } from './visualizers/RippleVisualizer';

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

    useEffect(() => {
        const initMusic = async () => {
            try {
                await musicService.initializeLocalProvider();
                await musicService.playForState(energyState, intensityLevel);
                setIsPlaying(true);
            } catch (error) {
                console.error('Failed to initialize music:', error);
            }
        };

        initMusic();

        return () => {
            musicService.stop();
        };
    }, []);

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
                    <HeartbeatVisualizer
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
                    <RippleVisualizer
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
});