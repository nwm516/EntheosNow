import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

interface IntensitySliderProps {
    selectedSide: 'warm' | 'cool';
    initialTouchPoint: {x: number; y: number} | null;
    onBack: () => void;
}

const IntensitySlider = ({ selectedSide, initialTouchPoint, onBack }: IntensitySliderProps) => {
    const startPoint = initialTouchPoint;

    const [intensity, setIntensity] = useState(0); // 0 to 1
    const [totalRotation, setTotalRotation] = useState(0); // Tracks cumulative rotations
    const [lastAngle, setLastAngle] = useState<number | null>(null);

    const handleBack = () => {
        console.log('Going back to diagonal screen...');
        onBack();
    }

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

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            if (!startPoint) return;

            const { locationX, locationY } = evt.nativeEvent;
            const initialAngle = calculateAngle(locationX, locationY, startPoint.x, startPoint.y);
            setLastAngle(initialAngle);

            console.log('Started spiral drag from angle: ', (initialAngle * 180 / Math.PI).toFixed(1), 'degrees');
        },
        onPanResponderMove: (evt) => {
            if (!startPoint || lastAngle === null) return;

            const { locationX, locationY } = evt.nativeEvent;

            // Regular spiral interaction
            const currentAngle = calculateAngle(locationX, locationY, startPoint.x, startPoint.y);
            const angleDiff = getAngleDifference(currentAngle, lastAngle);

            // Update cumulative rotation
            const newTotalRotation = totalRotation + angleDiff;
            setTotalRotation(newTotalRotation);
            setLastAngle(currentAngle);

            // Convert rotation to intensity (0 to 1)
            const newIntensity = Math.max(0, Math.min(1, newTotalRotation / (2 * Math.PI)));
            setIntensity(newIntensity);

            const direction = angleDiff > 0 ? 'clockwise' : 'counter-clockwise';
            console.log(`Rotation: ${direction}, Total: ${(newTotalRotation * 180 / Math.PI).toFixed(1)}°, Intensity: ${newIntensity.toFixed(2)}`);
        },
        onPanResponderRelease: () => {
            console.log('Released! Final intensity: ', intensity.toFixed(2));
            setLastAngle(null);
        },
    });

    return (
        <View style={styles.container} {...panResponder.panHandlers}>

            {/* Subtle back button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={handleBack}
                activeOpacity={0.6}
            >
                <View style={styles.backIcon}>
                    <View style={[styles.backArrow, {
                        borderRightColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2'
                    }]} />
                </View>

            </TouchableOpacity>

            {/* Dark animated background */}
            <Animated.View style={[styles.darkBackground, {
                opacity: 0.9 + (intensity * 0.1), // Gets slightly darker with intensity
            }]} />

            {/* Subtle moving pattern background */}
            <View style={styles.patternBackground}>
                {/* We can add animated dark patterns here */}
            </View>

            {/* The focused color circle that grows from touch point */}
            {startPoint && (
                <View style={[styles.focusCircle, {
                    left: startPoint.x - (intensity * 150), // Center the circle
                    top: startPoint.y - (intensity * 150),
                    width: intensity * 300,  // Circle grows with intensity
                    height: intensity * 300,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2', // Original colors
                    opacity: 0.8 + (intensity * 0.2), // Gets more opaque with intensity
                }]} />
            )}

            {/* Subtle glow effect around the circle */}
            {startPoint && intensity > 0.3 && (
                <View style={[styles.glowCircle, {
                    left: startPoint.x - (intensity * 180),
                    top: startPoint.y - (intensity * 180),
                    width: intensity * 360,
                    height: intensity * 360,
                    backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                    opacity: intensity * 0.2, // Subtle glow
                }]} />
            )}

            {/* Start point indicator */}
            {startPoint && (
                <View style={[styles.startIndicator, {
                    left: startPoint.x - 5,
                    top: startPoint.y - 5,
                    backgroundColor: 'white',
                    borderWidth: 2,
                    borderColor: 'red',
                }]} />
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
    startIndicator: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)',
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
});

export { IntensitySlider };