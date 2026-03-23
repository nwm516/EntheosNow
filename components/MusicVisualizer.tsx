import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { MusicServiceManager } from '../services/MusicServiceManager';
import { HeartbeatVisualizer } from './visualizers/HeartbeatVisualizer';
import { RippleVisualizer } from './visualizers/RippleVisualizer';

interface MusicVisualizerProps {
    energyState: 'warm' | 'cool';
    intensityLevel: number; // 0 to 1
    onBack?: () => void;    // Add callback for back navigation
}

export const MusicVisualizer = ({ energyState, intensityLevel, onBack }: MusicVisualizerProps) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const musicService = useRef(MusicServiceManager.getInstance()).current;

    // Initializing music on mount
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

            // Cleanup on unmount
            return () => {
                musicService.stop();
                };
            }, []);

    const getEnergyColors = () => {
        if (energyState === 'warm') {
            return {
                primary: '#FF6B35',     // Warm orange
                secondary: '#FF4500',   // Deeper orange-red
                accent: '#FFD700',      // Golden highlights
                background: '#1a0600',  // Very dark warm background
            };
        } else {
            return {
                primary: '#4A90E2',     // Cool blue
                secondary: '#1E90FF',   // Brighter blue
                accent: '#00CED1',      // Cyan highlights
                background: '#000615',  // Very dark cool background
            };
        }
    };

    const colors = getEnergyColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Back button - consistent with IntensitySlider design */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                activeOpacity={0.6}
            >
                <View style={styles.backIcon}>
                    <View style={[styles.backArrow, {
                        borderRightColor: colors.primary    // Matches energy state color
                    }]} />
                </View>
            </TouchableOpacity>

        <HeartbeatVisualizer
            intensityLevel={intensityLevel}
            colors={colors}
        />

        <RippleVisualizer
            intensityLevel={intensityLevel}
            colors={colors}
        />
    </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    flowingElements: {
        position: 'absolute',
        width: 300,
        height: 80,
        borderRadius: 40,
        // Slightly transparent floating shapes
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
    }
});