// IntensitySlider.tsx

import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, TouchableOpacity, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface IntensitySliderProps {
    selectedSide: 'warm' | 'cool';
    initialTouchPoint: {x: number; y: number} | null;
    onBack: () => void;
    onConfirmIntensity?: (energyState: 'warm' | 'cool', intensity: number) => void;
}

const IntensitySlider = ({ selectedSide, initialTouchPoint, onBack, onConfirmIntensity }: IntensitySliderProps) => {
    
    // Screen center — where the circle will live after the slide animation
    const CENTER = { x: width / 2, y: height / 2 };

    const [intensity, setIntensity] = useState(0);
    const [isTransitioningBack, setIsTransitioningBack] = useState(false);
    const [isReady, setIsReady] = useState(false); // Blocks interaction until slide completes
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [showConfirmationPulse, setShowConfirmationPulse] = useState(false);

    // Confirmation swipe state
    const [swipeStartPoint, setSwipeStartPoint] = useState<{x: number, y: number} | null>(null);
    const [isConfirmingSwipe, setIsConfirmingSwipe] = useState(false);
    const confirmationExplosion = useRef(new Animated.Value(0)).current;

    // Hint arrow that fades in once intensity is set
    const confirmZoneOpacity = useRef(new Animated.Value(0)).current;

    // Animation values for back transition
    const circleScale = useRef(new Animated.Value(1)).current;
    const backgroundOpacity = useRef(new Animated.Value(1)).current;

    // Animated position — starts at tap point, slides to center on mount
    // Animated.ValueXY holds two values (x and y) as a pair
    const animatedPosition = useRef(new Animated.ValueXY({
        x: initialTouchPoint?.x ?? CENTER.x,
        y: initialTouchPoint?.y ?? CENTER.y,
    })).current;

    // JS-side mirror of the position — used for gesture math
    // Animated values can't be read synchronously, so we track
    // the final destination here for use in angle calculations
    const currentPosition = useRef({
        x: initialTouchPoint?.x ?? CENTER.x,
        y: initialTouchPoint?.y ?? CENTER.y,
    });

    const netRotationRef = useRef(0);
    const lastAngleRef = useRef<number | null>(null);

    // Slide to center on mount
    useEffect(() => {
        Animated.timing(animatedPosition, {
            toValue: { x: CENTER.x, y: CENTER.y },
            duration: 700,
            useNativeDriver: false, // Must be false — animating layout properties (left/top)
                                    // not transforms. Native driver only supports transforms + opacity.
        }).start(() => {
            // Animation complete — update JS-side position ref and unlock interaction
            currentPosition.current = { x: CENTER.x, y: CENTER.y };
            setIsReady(true);
        });
    }, []);

    // Fade the swipe hint in/out based on whether intensity is meaningfully set
    useEffect(() => {
        Animated.timing(confirmZoneOpacity, {
            toValue: intensity > 0.1 ? 1 : 0,
            duration: 400,
            useNativeDriver: false,
        }).start();
    }, [intensity > 0.1]);

    const handleBack = () => {
        console.log('Starting back transition...');
        setIsTransitioningBack(true);

        Animated.parallel([
            Animated.timing(circleScale, {
                toValue: 0.1,
                duration: 300,
                useNativeDriver: false,
            }),
            Animated.timing(backgroundOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }),
        ]).start(() => {
            console.log('Back transition complete, returning to diagonal');
            onBack();
        });
    };

    const calculateAngle = (x: number, y: number, centerX: number, centerY: number) => {
        return Math.atan2(y - centerY, x - centerX);
    };

    const getAngleDifference = (angle1: number, angle2: number) => {
        let diff = angle1 - angle2;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        if (diff < -Math.PI) diff += 2 * Math.PI;
        return diff;
    };

    const triggerLongPressConfirmation = () => {
        setIsLongPressing(true);
        setShowConfirmationPulse(true);
        console.log('Confirmed! Intensity:', intensity.toFixed(2));
        onConfirmIntensity?.(selectedSide, intensity);
    };

    const panResponder = PanResponder.create({
        // Block all interaction until slide animation completes
        onStartShouldSetPanResponder: () => isReady && !isTransitioningBack,

        onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const pos = currentPosition.current;

            const distanceFromCenter = Math.sqrt(
                Math.pow(locationX - pos.x, 2) +
                Math.pow(locationY - pos.y, 2)
            );

            const currentNodeRadius = intensity * 150;
            const claimRadius = Math.max(60, currentNodeRadius + 40);
            const isInsideCircle = distanceFromCenter <= claimRadius;

            if (isInsideCircle) {
                netRotationRef.current = intensity * (2 * Math.PI);
                lastAngleRef.current = calculateAngle(locationX, locationY, pos.x, pos.y);
                setSwipeStartPoint(null);
                console.log('Spiral started, seeding rotation from intensity:', intensity.toFixed(2));
            } else if (intensity > 0.1 && !isConfirmingSwipe) {
                lastAngleRef.current = null;
                setSwipeStartPoint({ x: locationX, y: locationY });
                console.log('Confirmation gesture started');
            }
        },

        onPanResponderMove: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const pos = currentPosition.current;

            if (lastAngleRef.current !== null) {
                const currentAngle = calculateAngle(locationX, locationY, pos.x, pos.y);
                const angleDiff = getAngleDifference(currentAngle, lastAngleRef.current);
                const rotationDegrees = Math.abs(angleDiff * 180 / Math.PI);

                if (rotationDegrees > 2) {
                    netRotationRef.current = netRotationRef.current + angleDiff;
                    lastAngleRef.current = currentAngle;

                    const newIntensity = Math.max(0, Math.min(1, netRotationRef.current / (2 * Math.PI)));
                    setIntensity(newIntensity);

                    const direction = angleDiff > 0 ? 'clockwise' : 'counter-clockwise';
                    console.log(`${direction}: Net rotation ${(netRotationRef.current * 180 / Math.PI).toFixed(1)}°, Intensity: ${newIntensity.toFixed(2)}`);
                }

            } else if (swipeStartPoint && !isConfirmingSwipe) {
                const deltaX = locationX - swipeStartPoint.x;
                const deltaY = locationY - swipeStartPoint.y;
                const isRightSwipe = deltaX > 80 && deltaX > Math.abs(deltaY) * 2;

                if (isRightSwipe) {
                    console.log('Confirmation swipe detected!');
                    setIsConfirmingSwipe(true);

                    Animated.timing(confirmationExplosion, {
                        toValue: 1,
                        duration: 600,
                        useNativeDriver: false,
                    }).start(() => {
                        triggerLongPressConfirmation();
                    });
                }
            }
        },

        onPanResponderRelease: () => {
            setSwipeStartPoint(null);
            lastAngleRef.current = null;
            console.log('Released. Intensity:', intensity.toFixed(2));
        },
    });

    return (
        <View style={styles.container} {...panResponder.panHandlers}>

            {/* Back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.6}
                disabled={isTransitioningBack}
            >
                <Animated.View style={[styles.backIcon, { opacity: backgroundOpacity }]}>
                    <View style={[styles.backArrow, {
                        borderRightColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2'
                    }]} />
                </Animated.View>
            </TouchableOpacity>

            {/* Dark animated background */}
            <Animated.View style={[styles.darkBackground, { opacity: backgroundOpacity }]} />
            <Animated.View style={[styles.patternBackground, { opacity: backgroundOpacity }]} />

            {/* Starting dot — travels with the animated position */}
            {intensity === 0 && (
                <Animated.View style={[styles.startingDot, {
                    left: Animated.subtract(animatedPosition.x, 8),
                    top: Animated.subtract(animatedPosition.y, 8),
                    borderColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                }]} />
            )}

            {/* Swipe hint arrow */}
            <Animated.View
                style={[styles.confirmZoneHint, { opacity: confirmZoneOpacity }]}
                pointerEvents="none"
            >
                <Text style={styles.swipeHintArrow}>›</Text>
            </Animated.View>

            {/* Intensity circle — anchored to animated position */}
            <Animated.View
                style={[styles.focusCircle, {
                    left: Animated.subtract(animatedPosition.x, intensity * 150),
                    top: Animated.subtract(animatedPosition.y, intensity * 150),
                    width: intensity * 300,
                    height: intensity * 300,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                    opacity: 0.8 + (intensity * 0.2),
                    transform: [{ scale: circleScale }]
                }]}
            />

            {/* Glow effect */}
            {intensity > 0.3 && (
                <Animated.View style={[styles.glowCircle, {
                    left: Animated.subtract(animatedPosition.x, intensity * 180),
                    top: Animated.subtract(animatedPosition.y, intensity * 180),
                    width: intensity * 360,
                    height: intensity * 360,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                    opacity: intensity * 0.2,
                    transform: [{ scale: circleScale }]
                }]} />
            )}

            {/* Confirmation expansion */}
            {isConfirmingSwipe && (
                <Animated.View
                    style={[styles.confirmationExpansion, {
                        left: CENTER.x - (width * 0.5),
                        top: CENTER.y - (height * 0.5),
                        width: width,
                        height: height,
                        backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                        shadowColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.8,
                        shadowRadius: 40,
                        elevation: 10,
                        opacity: confirmationExplosion.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [0.8, 0.6, 0],
                        }),
                        transform: [{
                            scale: confirmationExplosion.interpolate({
                                inputRange: [0, 1],
                                outputRange: [intensity * 0.3, 3],
                            }),
                        }],
                    }]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
    darkBackground: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: '#1a1a1a',
    },
    patternBackground: {
        position: 'absolute',
        width: width,
        height: height,
    },
    startingDot: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 2,
        opacity: 0.8,
    },
    focusCircle: {
        position: 'absolute',
        borderRadius: 1000,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    glowCircle: {
        position: 'absolute',
        borderRadius: 1000,
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
    confirmationPulse: {
        position: 'absolute',
        borderRadius: 1000,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
    },
    confirmationExpansion: {
        position: 'absolute',
        borderRadius: 10000,
        zIndex: 500,
    },
    confirmZoneHint: {
        position: 'absolute',
        right: 40,
        top: '50%',
        marginTop: -30,
        zIndex: 100,
    },
    swipeHintArrow: {
        color: 'rgba(255, 255, 255, 0.25)',
        fontSize: 56,
        fontWeight: '100',
    },
});

export { IntensitySlider };