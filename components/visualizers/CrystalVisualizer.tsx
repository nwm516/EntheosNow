import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface CrystalVisualizerProps {
    intensityLevel: number;
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
}

const PARTICLE_COUNT = 8;

interface ParticleConfig {
    angle: number;
    distance: number;
    size: number;
    duration: number;
    delay: number;
    isDiamond: boolean;
}

// Ripple ring — same as RippleVisualizer
const CrystalRing = ({
    color,
    delay,
    duration,
    maxRadius,
    centerX,
    centerY,
    borderWidth,
}: {
    color: string;
    delay: number;
    duration: number;
    maxRadius: number;
    centerX: number;
    centerY: number;
    borderWidth: number;
}) => {
    const scale = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

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
                        Animated.timing(opacity, {
                            toValue: 0.7,
                            duration: duration * 0.05,
                            useNativeDriver: false,
                        }),
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
                    borderWidth,
                    left: centerX - maxRadius,
                    top: centerY - maxRadius,
                    opacity,
                    transform: [{ scale }],
                },
            ]}
        />
    );
};

// Particle or diamond drifting outward from center
const DriftingShape = ({
    initialConfig,
    centerX,
    centerY,
    colors,
    rippleDuration,
    screenWidth,
}: {
    initialConfig: ParticleConfig;
    centerX: number;
    centerY: number;
    colors: { primary: string; secondary: string; accent: string; background: string };
    rippleDuration: number;
    screenWidth: number;
}) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(0)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    // Mutable ref holds current trip's config — updated each loop
    const configRef = useRef<ParticleConfig>(initialConfig);

    // Generates a fresh random config for the next trip
    const generateConfig = (): ParticleConfig => {
        const angle = Math.random() * Math.PI * 2; // Full 360 degrees
        const isDiamond = Math.random() < (1 / 8);
        return {
            angle,
            distance: 60 + Math.random() * (screenWidth * 0.3),
            size: isDiamond
                ? 6 + Math.random() * 5
                : 3 + Math.random() * 4,
            duration: 2500 + Math.random() * 2000,
            delay: Math.random() * 800, // Shorter delay on loops so gaps aren't too long
            isDiamond,
        };
    };

    useEffect(() => {
        const animate = () => {
            // Get fresh config for this trip
            const config = configRef.current;
            const destX = Math.cos(config.angle) * config.distance;
            const destY = Math.sin(config.angle) * config.distance;

            translateX.setValue(0);
            translateY.setValue(0);
            opacity.setValue(0);

            Animated.sequence([
                Animated.delay(config.delay),
                Animated.parallel([
                    Animated.timing(translateX, {
                        toValue: destX,
                        duration: config.duration,
                        useNativeDriver: false,
                    }),
                    Animated.timing(translateY, {
                        toValue: destY,
                        duration: config.duration,
                        useNativeDriver: false,
                    }),
                    Animated.sequence([
                        Animated.timing(opacity, {
                            toValue: config.isDiamond ? 0.9 : 0.6,
                            duration: config.duration * 0.1,
                            useNativeDriver: false,
                        }),
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: config.duration * 0.9,
                            useNativeDriver: false,
                        }),
                    ]),
                ]),
            ]).start(() => {
                // Generate new random config before next trip
                configRef.current = generateConfig();
                animate();
            });
        };

        animate();

        return () => {
            translateX.stopAnimation();
            translateY.stopAnimation();
            opacity.stopAnimation();
        };
    }, []);

    const config = configRef.current;
    const color = config.isDiamond
        ? 'rgba(255, 255, 255, 0.8)'
        : colors.primary;

    return (
        <Animated.View
            style={[
                config.isDiamond ? styles.diamond : styles.particle,
                {
                    width: config.size,
                    height: config.size,
                    borderRadius: config.isDiamond ? 0 : config.size / 2,
                    backgroundColor: color,
                    left: centerX - config.size / 2,
                    top: centerY - config.size / 2,
                    opacity,
                    transform: [
                        { translateX },
                        { translateY },
                        ...(config.isDiamond ? [{ rotate: '45deg' }] : []),
                    ],
                },
            ]}
        />
    );
};

export const CrystalVisualizer = ({ intensityLevel, colors }: CrystalVisualizerProps) => {
    const { width, height } = Dimensions.get('window');
    const CENTER_X = width / 2;
    const CENTER_Y = height / 2;

    // Ripple ring behavior — same tuning as RippleVisualizer
    const effectiveIntensity = Math.min(intensityLevel, 0.25);
    const baseDuration = 2800;
    const minDuration = 1800;
    const rippleDuration = Math.max(
        minDuration,
        baseDuration - (effectiveIntensity * (baseDuration - minDuration))
    );

    const ringCount = Math.round(2 + (1 - effectiveIntensity) * 2);
    const ringSpacing = rippleDuration / ringCount;
    const maxRadius = width * (0.6 + (1 - effectiveIntensity) * 0.25);
    const ringBorderWidth = 6 + (effectiveIntensity * 4);

    // Generate stable particle/diamond configs once on mount
    // Simpler initial configs. Just need count and staggered initial delays
    const particleConfigs = useRef<ParticleConfig[]>(
        Array.from({ length: PARTICLE_COUNT }, (_, index) => {
            const angle = Math.random() * Math.PI * 2;
            const isDiamond = Math.random() < (1 / 8);
            return {
                angle,
                distance: 60 + Math.random() * (width * 0.3),
                size: isDiamond ? 6 + Math.random() * 5 : 3 + Math.random() * 4,
                duration: 2500 + Math.random() * 2000,
                // Stagger initial launches so they don't all start simultaneously
                delay: (index / PARTICLE_COUNT) * 2000,
                isDiamond,
            };
        })
    ).current;

    return (
        <View style={styles.container}>
            {/* Ripple rings — foundation layer */}
            {[...Array(ringCount)].map((_, index) => (
                <CrystalRing
                    key={`ring-${index}`}
                    color={index % 2 === 0 ? colors.primary : colors.secondary}
                    delay={index * ringSpacing}
                    duration={rippleDuration}
                    maxRadius={maxRadius}
                    centerX={CENTER_X}
                    centerY={CENTER_Y}
                    borderWidth={ringBorderWidth}
                />
            ))}

            {/* Drifting particles and occasional diamonds */}
            {particleConfigs.map((config, index) => (
                <DriftingShape
                    key={`shape-${index}`}
                    initialConfig={config}
                    centerX={CENTER_X}
                    centerY={CENTER_Y}
                    colors={colors}
                    rippleDuration={rippleDuration}
                    screenWidth={width}
                />
            ))}

            {/* Subtle origin point */}
            <View
                style={[
                    styles.origin,
                    {
                        left: CENTER_X - 4,
                        top: CENTER_Y - 4,
                        opacity: 0.5 + (effectiveIntensity * 0.3),
                    },
                ]}
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
        backgroundColor: 'transparent',
    },
    particle: {
        position: 'absolute',
    },
    diamond: {
        position: 'absolute',
    },
    origin: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
    },
});