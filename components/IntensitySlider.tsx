import React, { useState, useRef } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

interface IntensitySliderProps {
    selectedSide: 'warm' | 'cool';
    initialTouchPoint: {x: number; y: number} | null;
    onBack: () => void;
    onConfirmIntensity?: (energyState: 'warm' | 'cool', intensity: number) => void;
}

const IntensitySlider = ({ selectedSide, initialTouchPoint, onBack, onConfirmIntensity }: IntensitySliderProps) => {
    const startPoint = initialTouchPoint;
    const [intensity, setIntensity] = useState(0); // 0 to 1
    const [netRotation, setNetRotation] = useState(0); // Tracks cumulative rotations
    const [lastAngle, setLastAngle] = useState<number | null>(null);
    const [isTransitioningBack, setIsTransitioningBack] = useState(false);
    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
    const [isLongPressing, setIsLongPressing] = useState(false);
    const [showConfirmationPulse, setShowConfirmationPulse] = useState(false);

    // Animation values for back transition
    const circleScale = useRef(new Animated.Value(1)).current;
    const backgroundOpacity = useRef(new Animated.Value(1)).current;

    const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

    const handleBack = () => {
        console.log('Starting back transition...');
        setIsTransitioningBack(true);

        Animated.parallel([
            Animated.timing(circleScale, {
                toValue: 0.1,
                duration: 300, // CHANGE this to 300
                useNativeDriver: true,
            }),
            Animated.timing(backgroundOpacity, {
                toValue: 0,
                duration: 300, // CHANGE this to 300
                useNativeDriver: true,
            }),
        ]).start(() => {
            console.log('Back transition complete, returning to diagonal');
            onBack();
        });
    };

    //Helper function to calculate angle from center
    const calculateAngle = (x: number, y: number, centerX: number, centerY: number) => {
        return Math.atan2(y - centerY, x - centerX);
    };

    // Handle function to calculate angle difference (handling wraparound)
   const getAngleDifference = (angle1: number, angle2: number) => {
       let diff = angle1 - angle2;
       // Handle wraparound (e.g., from -pi to pi)
       if (diff > Math.PI) diff -= 2 * Math.PI;
       if (diff < -Math.PI) diff += 2 * Math.PI;
       return diff;
   };

   // Long press logic
    const triggerLongPressConfirmation = () => {

        console.log('Long press confirmed! Intensity: ', intensity.toFixed(2));

        // Call the parent callback to navigate to visualizer
        onConfirmIntensity?.(selectedSide, intensity);
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => !isTransitioningBack,   // Disable during transition
        onPanResponderGrant: (evt) => {
            if (!startPoint) return;

            const { locationX, locationY } = evt.nativeEvent;
            const initialAngle = calculateAngle(locationX, locationY, startPoint.x, startPoint.y);
            setLastAngle(initialAngle);

            // Start long press timer
            const timer = setTimeout(() => {
                triggerLongPressConfirmation();
            }, 800);    // 800 ms for long press

            setLongPressTimer(timer);
            console.log('Started spiral drag, long press timer active');
        },
        onPanResponderMove: (evt) => {
            if (!startPoint || lastAngle === null) return;

            const { locationX, locationY } = evt.nativeEvent;

            // Regular spiral interaction
            const currentAngle = calculateAngle(locationX, locationY, startPoint.x, startPoint.y);
            const angleDiff = getAngleDifference(currentAngle, lastAngle);

            // Update cumulative rotation
            const newNetRotation = netRotation + angleDiff;
            setNetRotation(newNetRotation);
            setLastAngle(currentAngle);

            // Convert rotation to intensity (0 to 1)
            const newIntensity = Math.max(0, Math.min(1, newNetRotation / (2 * Math.PI)));
            setIntensity(newIntensity);

            // Check if still within selection node for long press
            const distanceFromAnchor = Math.sqrt(
                Math.pow(locationX - startPoint.x, 2) +
                Math.pow(locationY - startPoint.y, 2)
            );

            const currentNodeRadius = newIntensity * 150;

            // Cancel long press if moved too far from center
            if (distanceFromAnchor > currentNodeRadius + 50) {
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    setLongPressTimer(null);
                }
            }

            const direction = angleDiff > 0 ? 'clockwise' : 'counter-clockwise';
            const rotationDegrees = newNetRotation * 180 / Math.PI;
            console.log(`${direction}: Net rotation ${rotationDegrees.toFixed(1)}°, Intensity: ${newIntensity.toFixed(2)}`);
        },
        onPanResponderRelease: () => {
            // Cancel long press timer on release
            if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
            }
            //setIsLongPressing(false);
            //setShowConfirmationPulse(false);
            setLastAngle(null);
            console.log('Released! Final intensity: ', intensity.toFixed(2));
        },
    });

    const triggerLongPressConfirmation = () => {
        setIsLongPressing(true);
        setShowConfirmationPulse(true);
        console.log('Long press confirmed! Intensity: ', intensity.toFixed(2));

        //ToDo: Trigger transition to visualizer and music screen
        console.log('Ready to transition to visualizer with: ', {
            energyState: selectedSide,
            intensityLevel: intensity,
        });
    };

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {/* Subtle back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.6}
                disabled={isTransitioningBack}  // Disable during transition
            >
                <Animated.View
                    style={[styles.backIcon, { opacity: backgroundOpacity }]}
                >
                    <View style={[styles.backArrow, {
                        borderRightColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2'
                    }]} />
                </Animated.View>
            </TouchableOpacity>

            {/* Dark animated background */}
            <Animated.View style={[styles.darkBackground, {
                opacity: backgroundOpacity,
            }]} />

            {/* Subtle moving pattern background */}
            <Animated.View style={[styles.patternBackground, {
                opacity: backgroundOpacity
            }]}>
                {/* We can add animated dark patterns here */}
            </Animated.View>

            {/* Starting point indicator - shows where to begin spiraling */}
            {startPoint && intensity === 0 && (
                <View style={[styles.startingDot, {
                    left: startPoint.x - 8,
                    top: startPoint.y - 8,
                    borderColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                }]} />
            )}

            {/* The focused color circle that grows from touch point */}
            {startPoint && (
                <Animated.View style={[styles.focusCircle, {
                    left: startPoint.x - (intensity * 150), // Center the circle
                    top: startPoint.y - (intensity * 150),
                    width: intensity * 300,  // Circle grows with intensity
                    height: intensity * 300,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2', // Original colors
                    opacity: 0.8 + (intensity * 0.2), // Gets more opaque with intensity
                    transform: [{ scale: circleScale }]
                }]} />
            )}

            {/* Subtle glow effect around the circle */}
            {startPoint && intensity > 0.3 && (
                <Animated.View style={[styles.glowCircle, {
                    left: startPoint.x - (intensity * 180),
                    top: startPoint.y - (intensity * 180),
                    width: intensity * 360,
                    height: intensity * 360,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                    opacity: intensity * 0.2, // Subtle glow
                    transform: [{ scale: circleScale }]
                }]} />
            )}

            {/* Confirmation pulse when long press is detected */}
            {showConfirmationPulse && startPoint && (
                <Animated.View
                    style={[
                        styles.confirmationPulse,
                        {
                            left: startPoint.x - (intensity * 180),
                            top: startPoint.y - (intensity * 180),
                            width: intensity * 360,
                            height: intensity * 360,
                            backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                            opacity: 0.4,
                        }
                    ]}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Base black background
    },
    darkBackground: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: '#1a1a1a', // Dark gray overlay
    },
    patternBackground: {
        position: 'absolute',
        width: width,
        height: height,
        // We can add subtle animated patterns here later
    },
    startingDot: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 2,
        // borderColor will be set dynamically to match energy choice
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
        // Larger, more transparent circle for glow effect
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
        // borderRightColor will be set dynamically
    },
    confirmationPulse: {
        position: 'absolute',
        borderRadius: 1000,
        borderWidth: 3,
        borderColor: 'rgba(255,255,255,0.8)',
        // Subtle animations could be added here later...
    },
});

export { IntensitySlider };