import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

interface MusicVisualizerProps {
    energyState: 'warm' | 'cool';
    intensityLevel: number; // 0 to 1
    onBack?: () => void;    // Add callback for back navigation
}

export const MusicVisualizer = ({ energyState, intensityLevel, onBack }: MusicVisualizerProps) => {
    const primaryFlow = useRef(new Animated.Value(0)).current;
    const secondaryFlow = useRef(new Animated.Value(0)).current;
    const pulseScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const baseSpeed = 4000; // 4 seconds for calm/low intensity
        const speedMultiplier = 1 - (intensityLevel * 0.7); // More intensity = faster
        const animationDuration = Math.max(1000, baseSpeed * speedMultiplier);

        console.log(`Animation speed for intensity ${intensityLevel.toFixed(2)}: ${animationDuration}ms`);

        // Primary flowing animation
        const primaryAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(primaryFlow, {
                    toValue: 1,
                    duration: animationDuration,
                    useNativeDriver: true,
                }),
                Animated.timing(primaryFlow, {
                    toValue: 0,
                    duration: animationDuration,
                    useNativeDriver: true,
                }),
            ])
        );

        // Secondary flow (different timing for layered effect)
        const secondaryAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(secondaryFlow, {
                    toValue: 1,
                    duration: animationDuration * 1.5,
                    useNativeDriver: true,
                }),
                Animated.timing(secondaryFlow, {
                    toValue: 0,
                    duration: animationDuration * 1.5,
                    useNativeDriver: true,
                }),
            ])
        );

        // Pulse animation
        const pulseAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseScale, {
                    toValue: 1 + (intensityLevel * 0.5),    // Higher intensity = bigger pulse
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseScale, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Start all animations
        primaryAnimation.start();
        secondaryAnimation.start();
        pulseAnimation.start();

        // Cleanup function - CRITICAL for preventing memory leaks
        return () => {
            primaryAnimation.stop();
            secondaryAnimation.stop();
            pulseAnimation.stop();
        };
    }, [energyState, intensityLevel]);  // Re-run when these change

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


            {/* Primary flowing element */}
            <Animated.View
                style={[
                    styles.flowingElements,
                    {
                        backgroundColor: colors.primary,
                        // Opacity REACTS to intensity
                        opacity: 0.4 + (intensityLevel * 0.4), // Range: 0.4 to 0.8
                        transform: [
                            {
                                // Position REACTS to animation
                                translateX: primaryFlow.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-200, width + 200], // Flows across screen
                                }),
                            },
                            {
                                // Size REACTS to pulse animation
                                scale: pulseScale,
                            },
                        ],
                    },
                ]}
            />

            {/* Secondary flowing element - flows opposite direction */}
            <Animated.View
                style={[
                    styles.flowingElements,
                    {
                        backgroundColor: colors.secondary,
                        top: height * 0.6, // Different vertical position
                        opacity: 0.3 + (intensityLevel * 0.3),
                        transform: [
                            {
                                // Flows in OPPOSITE direction
                                translateX: secondaryFlow.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [width + 200, -200], // Right to left
                                }),
                            },
                            {
                                scale: pulseScale,
                            },
                        ],
                    },
                ]}
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