import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface HeartbeatVisualizerProps {
    intensityLevel: number; // 0 to 1
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
}

// One ring's full lifecycle — expand and fade
const HeartbeatRing = ({
    color,
    delay,
    duration,
    maxRadius,
    centerX,
    centerY,
}: {
    color: string;
    delay: number;
    duration: number;
    maxRadius: number;
    centerX: number;
    centerY: number;
}) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = () => {
            // Reset before each beat
            scale.setValue(0);
            opacity.setValue(0);

            Animated.sequence([
                // Wait for our place in the beat pattern
                Animated.delay(delay),
                // Expand and fade simultaneously
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 1,
                        duration,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        // Appear quickly
                        Animated.timing(opacity, {
                            toValue: 0.8,
                            duration: duration * 0.1,
                            useNativeDriver: true,
                        }),
                        // Then fade as ring expands outward
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration * 0.9,
                            useNativeDriver: true,
                        }),
                    ]),
                ]),
            ]).start(() => animate()); // Loop by calling itself
        };

        animate();

        return () => {
            scale.stopAnimation();
            opacity.stopAnimation();
        };
    }, [duration, delay, maxRadius]);

    return (
        <Animated.View
            style={[
                styles.ring,
                {
                    width: maxRadius * 2,
                    height: maxRadius * 2,
                    borderRadius: maxRadius,
                    borderColor: color,
                    left: centerX - maxRadius,
                    top: centerY - maxRadius,
                    opacity,
                    transform: [{ scale }],
                },
            ]}
        />
    );
};

export const HeartbeatVisualizer = ({ intensityLevel, colors }: HeartbeatVisualizerProps) => {
    const { width, height } = Dimensions.get('window');
    const CENTER_X = width / 2;
    const CENTER_Y = height / 2;

    // Intensity drives beat rate. Higher intensity = faster heartbeat.
    const baseDuration = 1200; // ms for one ring to fully expand at zero intensity
    const minDuration = 400;   // fastest it can go at full intensity
    const ringDuration = Math.max(minDuration, baseDuration - (intensityLevel * (baseDuration - minDuration)));

    // Lub-dub: two beats close together, then a pause
    // Delay pattern mimics the double-beat of a real heartbeat
    const lubDelay = 0;
    const dubDelay = ringDuration * 0.25;  // Dub comes shortly after lub
    const cycleLength = ringDuration;

    // Max radius grows with intensity — at full intensity rings reach screen edge
    const maxRadius = 180 + (intensityLevel * (width * 0.9));

    return (
        <View style={styles.container}>
            {/* Central core — always visible, pulses subtly */}
            <Animated.View
                style={[
                    styles.core,
                    {
                        backgroundColor: colors.primary,
                        left: CENTER_X - 20,
                        top: CENTER_Y - 20,
                        // Core brightens with intensity
                        opacity: 0.6 + (intensityLevel * 0.4),
                    },
                ]}
            />

            {/* Lub ring — first beat */}
            <HeartbeatRing
                color={colors.primary}
                delay={lubDelay}
                duration={cycleLength}
                maxRadius={maxRadius}
                centerX={CENTER_X}
                centerY={CENTER_Y}
            />

            {/* Dub ring — second beat, slightly smaller */}
            <HeartbeatRing
                color={colors.secondary}
                delay={dubDelay}
                duration={cycleLength * 0.85}
                maxRadius={maxRadius * 0.75}
                centerX={CENTER_X}
                centerY={CENTER_Y}
            />

            {/* Accent ring — subtle third layer for depth */}
            <HeartbeatRing
                color={colors.accent}
                delay={dubDelay * 0.5}
                duration={cycleLength * 1.2}
                maxRadius={maxRadius * 0.5}
                centerX={CENTER_X}
                centerY={CENTER_Y}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    ring: {
        position: 'absolute',
        borderWidth: 6,
        backgroundColor: 'transparent',
    },
    core: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderRadius: 20,
    },
});