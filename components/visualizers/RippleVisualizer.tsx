import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

interface RippleVisualizerProps {
    intensityLevel: number; // 0 to 1
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
    };
}

// One ripple's full lifecycle — spawn at center, expand outward, fade to nothing
const RippleRing = ({
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
                    // Ring expands steadily outward
                    Animated.timing(scale, {
                        toValue: 1,
                        duration,
                        useNativeDriver: true,
                    }),
                    Animated.sequence([
                        // Appear at full opacity immediately
                        Animated.timing(opacity, {
                            toValue: 0.7,
                            duration: duration * 0.05,
                            useNativeDriver: true,
                        }),
                        // Fade linearly as it travels — water ripple dissipates evenly
                        Animated.timing(opacity, {
                            toValue: 0,
                            duration: duration * 0.95,
                            useNativeDriver: true,
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

export const RippleVisualizer = ({ intensityLevel, colors }: RippleVisualizerProps) => {
    const effectiveIntensity = Math.min(intensityLevel, 0.25);
    const { width, height } = Dimensions.get('window');
    const CENTER_X = width / 2;
    const CENTER_Y = height / 2;

    // Ripple speed — higher intensity means rings spawn and travel faster
    const baseDuration = 2800; // slow, wide ripples at low intensity
    const minDuration = 2600;   // quick tight ripples at high intensity
    const rippleDuration = Math.max(
        minDuration,
        baseDuration - (effectiveIntensity * (baseDuration - minDuration))
    );

    // Spacing between rings — at low intensity rings are far apart (peaceful)
    // At high intensity rings overlap (urgent, dense)
    const ringCount = Math.round(1 + (1 - effectiveIntensity) * 1); // Range: 1 to 2 rings
    const ringSpacing = rippleDuration / ringCount;

    // Max radius — ripples always reach screen edge regardless of intensity
    // but at higher intensity they get there faster
    const maxRadius = width * (0.6 + (1 - effectiveIntensity) * 0.25); // Range: 0.6 to 0.85

    // Ring thickness decreases slightly as intensity increases —
    // fast ripples feel lighter, slow ripples feel more substantial
    const ringBorderWidth = 4 + (effectiveIntensity * 4); // Range: 4 to 8

    return (
        <View style={styles.container}>
            {/* Central origin point — subtle, just marks where ripples come from */}
            <View
                style={[
                    styles.origin,
                    {
                        backgroundColor: colors.primary,
                        left: CENTER_X - 6,
                        top: CENTER_Y - 6,
                        opacity: 0.4 + (effectiveIntensity * 0.4),
                    },
                ]}
            />

            {/* Four rings staggered evenly across the cycle */}
            {[...Array(ringCount)].map((_, index) => (
                <RippleRing
                    key={index}
                    color={index % 2 === 0 ? colors.primary : colors.secondary}
                    delay={index * ringSpacing}
                    duration={rippleDuration}
                    maxRadius={maxRadius}
                    centerX={CENTER_X}
                    centerY={CENTER_Y}
                    borderWidth={ringBorderWidth}
                />
            ))}

            {/* Accent ring — slightly smaller, offset timing, adds depth */}
            {effectiveIntensity < 0.15 && (
                <RippleRing
                    color={colors.accent}
                    delay={ringSpacing * 0.5}
                    duration={rippleDuration * 1.2}
                    maxRadius={maxRadius * 0.6}
                    centerX={CENTER_X}
                    centerY={CENTER_Y}
                    borderWidth={ringBorderWidth * 0.75}
                />
            )}
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
    origin: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});