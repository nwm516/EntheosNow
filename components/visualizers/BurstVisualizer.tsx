import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface BurstVisualizerProps {
    intensityLevel: number;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
}

// Number of rings in the burst cycle
const RING_COUNT = 6;

// Each ring has stable random characteristics generated once on mount
interface RingConfig {
    radiusMultiplier: number; // 0.5 to 1.0 — controls max travel distance
    colorIndex: number;       // 0, 1, or 2 — maps to primary/secondary/accent
}

const BurstRing = ({
    config,
    delay,
    duration,
    maxRadius,
    centerX,
    centerY,
    colors,
    borderWidth,
}: {
    config: RingConfig;
    delay: number;
    duration: number;
    maxRadius: number;
    centerX: number;
    centerY: number;
    colors: { primary: string; secondary: string; accent: string; background: string };
    borderWidth: number;
}) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Resolve color from index — cycles through primary, secondary, accent
    const color = [colors.primary, colors.secondary, colors.accent][config.colorIndex];

    // This ring's actual radius — stable because config is generated once on mount
    const ringRadius = maxRadius * config.radiusMultiplier;

    useEffect(() => {
        const animate = () => {
            scale.setValue(0);
            opacity.setValue(0);

            Animated.sequence([
                Animated.delay(delay),
                Animated.parallel([
                    Animated.timing(scale, {
                        toValue: 1,
                        duration,
                        useNativeDriver: false,
                    }),
                    Animated.sequence([
                        // Flash in very quickly — burst energy
                        Animated.timing(opacity, {
                            toValue: 0.9,
                            duration: duration * 0.05,
                            useNativeDriver: false,
                        }),
                        // Fade out as it expands
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration * 0.95,
                            useNativeDriver: false,
                        }),
                    ]),
                ]),
            ]).start(() => animate());
        };

        animate();

        return () => {
            scale.stopAnimation();
            opacity.stopAnimation();
        };
    }, [duration, delay, ringRadius]);

    return (
        <Animated.View
            style={[
                styles.ring,
                {
                    width: ringRadius * 2,
                    height: ringRadius * 2,
                    borderRadius: ringRadius,
                    borderColor: color,
                    borderWidth,
                    left: centerX - ringRadius,
                    top: centerY - ringRadius,
                    opacity,
                    transform: [{ scale }],
                },
            ]}
        />
    );
};

export const BurstVisualizer = ({ intensityLevel, colors }: BurstVisualizerProps) => {
    const { width, height } = Dimensions.get('window');
    const CENTER_X = width / 2;
    const CENTER_Y = height / 2;

    // Generate stable random ring configs once on mount
    // useRef ensures these don't regenerate on re-render
    const ringConfigs = useRef<RingConfig[]>(
        Array.from({ length: RING_COUNT }, (_, index) => ({
            // Random radius between 50% and 100% of max
            radiusMultiplier: 0.5 + Math.random() * 0.5,
            // Cycle through colors: 0=primary, 1=secondary, 2=accent
            colorIndex: index % 3,
        }))
    ).current;

    // Burst fires faster than heartbeat — high intensity energy
    const baseDuration = 1200;
    const minDuration = 500;
    const burstDuration = Math.max(
        minDuration,
        baseDuration - (intensityLevel * (baseDuration - minDuration))
    );

    // Rings fire in rapid succession — tight spacing creates burst feel
    const ringSpacing = burstDuration / RING_COUNT;

    // All rings travel to screen edge — burst fills the whole space
    const maxRadius = width * 0.9;

    // Thinner rings at high intensity — fast rings feel lighter
    const ringBorderWidth = Math.max(2, 5 - (intensityLevel * 2));

    return (
        <View style={styles.container}>
            {/* Intense core — brighter and larger than heartbeat core */}
            <Animated.View
                style={[
                    styles.core,
                    {
                        backgroundColor: colors.accent,
                        left: CENTER_X - 30,
                        top: CENTER_Y - 30,
                        // Core fully bright at high intensity
                        opacity: 0.7 + (intensityLevel * 0.3),
                    },
                ]}
            />

            {/* Burst rings — randomized size, cycling colors */}
            {ringConfigs.map((config, index) => (
                <BurstRing
                    key={index}
                    config={config}
                    delay={index * ringSpacing}
                    duration={burstDuration}
                    maxRadius={maxRadius}
                    centerX={CENTER_X}
                    centerY={CENTER_Y}
                    colors={colors}
                    borderWidth={ringBorderWidth}
                />
            ))}
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
        backgroundColor: 'transparent',
    },
    core: {
        position: 'absolute',
        width: 60,
        height: 60,
        borderRadius: 30,
    },
});