import React, { useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Text } from 'react-native';

const { width, height } = Dimensions.get('window');

interface IntensitySliderProps {
    selectedSide: 'warm' | 'cool';
    initialTouchPoint: {x: number; y: number} | null;
}

const IntensitySlider = ({ selectedSide, initialTouchPoint }: IntensitySliderProps) => {
    const [startPoint, setStartPoint] = useState<{x: number, y: number} | null>(initialTouchPoint);
    const [intensity, setIntensity] = useState(0); // 0 to 1
    const [dragDistance, setDragDistance] = useState(0);

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            // Record where user first touched
            const { locationX, locationY } = evt.nativeEvent;
            setStartPoint({ x: locationX, y: locationY });
            console.log('Started drag at:', locationX, locationY);
        },
        onPanResponderMove: (evt) => {
            if (!startPoint) return;

            const { locationX, locationY } = evt.nativeEvent;

            // Calculate distance from start point
            const deltaX = locationX - startPoint.x;
            const deltaY = locationY - startPoint.y;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            // Convert distance to intensity (0 to 1)
            // Max distance of 200 pixels = intensity 1.0
            const newIntensity = Math.min(distance / 200, 1);

            setDragDistance(distance);
            setIntensity(newIntensity);

            console.log('Drag distance:', Math.round(distance), 'Intensity:', newIntensity.toFixed(2));
        },
        onPanResponderRelease: () => {
            console.log('Released! Final intensity:', intensity.toFixed(2));
            // Here we'll eventually trigger the long press confirmation
        },
    });

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
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

            {/* Debug info */}
            <View style={styles.debugInfo}>
                <Text style={styles.debugText}>
                    Distance: {Math.round(dragDistance)}px
                </Text>
                <Text style={styles.debugText}>
                    Intensity: {(intensity * 100).toFixed(0)}%
                </Text>
            </View>

            {/* Start point indicator */}
            {startPoint && (
                <View style={[styles.startIndicator, {
                    left: startPoint.x - 5,
                    top: startPoint.y - 5,
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
    debugInfo: {
        position: 'absolute',
        top: 100,
        left: 20,
        backgroundColor: 'rgba(0,0,0,0.7)',
        padding: 10,
        borderRadius: 5,
    },
    debugText: {
        color: 'white',
        fontSize: 16,
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
});

export { IntensitySlider };