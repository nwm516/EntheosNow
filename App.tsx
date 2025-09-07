import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Dimensions, Animated, PanResponder, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { IntensitySlider } from './components/IntensitySlider';

const { width, height } = Dimensions.get('window');

export default function App() {
    const warmPulse = useRef(new Animated.Value(1)).current;
    const coolOpacity = useRef(new Animated.Value(1)).current;

    const [selectedSide, setSelectedSide] = useState<'warm' | 'cool' | null>(null);
    const [touchPoint, setTouchPoint] = useState<{x: number, y: number} | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Animation values for transition
    const backgroundOpacity = useRef(new Animated.Value(1)).current;
    const circleScale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Warm side: gentle pulsing
        const warmAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(warmPulse, {
                    toValue: 1.1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(warmPulse, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );

        // Cool Side: subtle flowing
        const coolAnimation = Animated.loop(
            Animated.sequence([
                Animated.timing(coolOpacity, {
                    toValue: 0.7,
                    duration: 3000,
                    useNativeDriver: true,
                }),
                Animated.timing(coolOpacity, {
                    toValue: 1,
                    duration: 3000,
                    useNativeDriver: true,
                }),
            ])
        );

        warmAnimation.start();
        coolAnimation.start();

        return () => {
            warmAnimation.stop();
            coolAnimation.stop();
        };
    }, []);

    const startTransition = (side: 'warm' | 'cool', point: {x: number, y: number}) => {
        setSelectedSide(side);
        setTouchPoint(point);
        setIsTransitioning(true);

        // Start the transition animation
        Animated.parallel([
            // Fade both triangles to black
            Animated.timing(backgroundOpacity, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
            // Grow circle at touch point
            Animated.timing(circleScale, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setIsTransitioning(false);
        });
    };

    const handleWarmPress = (point: {x: number, y: number}) => {
        console.log('Warm side tapped at:', point);
        startTransition('warm', point);
    };

    const handleCoolPress = (point: {x: number, y: number}) => {
        console.log('Cool side tapped at:', point);
        startTransition('cool', point);
    };

    // Function to determine which side of the diagonal was touched
    const isPointInWarmTriangle = (x: number, y: number) => {
        // Our visual diagonal goes from bottom-left (0, height) to top-right (width, 0)
        // Line equation: y = height - (height * x) / width
        // Points BELOW this line are in the warm triangle
        const diagonalY = height - (height * x) / width;

        console.log(`Touch at (${x.toFixed(1)}, ${y.toFixed(1)})`);
        console.log(`Diagonal at x=${x.toFixed(1)} should be y=${diagonalY.toFixed(1)}`);
        console.log(`Point is ${y < diagonalY ? 'ABOVE' : 'BELOW'} diagonal line`);
        console.log(`Should be ${y < diagonalY ? 'WARM (orange, top-left)' : 'COOL (blue, bottom-right)'}`);

        return y < diagonalY;
    };

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
            const { locationX, locationY } = evt.nativeEvent;
            const point = { x: locationX, y: locationY };

            if (isPointInWarmTriangle(locationX, locationY)) {
                handleWarmPress(point);
            } else {
                handleCoolPress(point);
            }
        },
    });

    if (selectedSide && !isTransitioning) {
        return (
            <IntensitySlider
                selectedSide={selectedSide}
                initialTouchPoint={touchPoint}
                onBack={() => {
                    console.log('Starting reverse transition...');
                    setIsTransitioning(true);

                    Animated.sequence([
                        // Circle disappears quickly
                        Animated.timing(circleScale, {
                            toValue: 0,
                            duration: 200,
                            useNativeDriver: true,
                        }),
                        // Then colors fade in
                        Animated.timing(backgroundOpacity, {
                            toValue: 1,
                            duration: 250,
                            useNativeDriver: true,
                        }),
                    ]).start(() => {
                        setSelectedSide(null);
                        setTouchPoint(null);
                        setIsTransitioning(false);

                        backgroundOpacity.setValue(1);
                        circleScale.setValue(0);
                    });
                }}
            />
        );
    }

    return (
        <View style={styles.container} {...panResponder.panHandlers}>
            {/* Cool background with subtle movement */}
            <Animated.View
                style={[
                    styles.coolTriangle,
                    {
                        opacity: Animated.multiply(coolOpacity, backgroundOpacity),
                    }
                ]}
            />

            {/* Warm triangle with gentle pulse */}
            <Animated.View
                style={[
                    styles.warmTriangle,
                    {
                        opacity: Animated.multiply(warmPulse, backgroundOpacity),
                    }
                ]}
            />

            {/* Gradient blend overlay - use simple Animated.View wrapper */}
            <Animated.View
                style={[
                    styles.gradientOverlay,
                    { opacity: backgroundOpacity }
                ]}
                pointerEvents="none"
            >
                <LinearGradient
                    colors={['#4A90E2', 'transparent', '#FF6B35']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={{ flex: 1, opacity: 0.3 }}
                    pointerEvents="none"
                />
            </Animated.View>

            {/* Transition circle that appears at touch point */}
            {isTransitioning && touchPoint && selectedSide && (
                <Animated.View
                    style={[
                        styles.transitionCircle,
                        {
                            left: touchPoint.x - 25,
                            top: touchPoint.y - 25,
                            backgroundColor: selectedSide === 'warm' ? '#FF6B35' : '#4A90E2',
                            transform: [{ scale: circleScale }]
                        }
                    ]}
                />
            )}

            {/* Dark background overlay during transition */}
            {isTransitioning && (
                <Animated.View
                    style={[
                        styles.darkTransitionBackground,
                        { opacity: circleScale }
                    ]}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    coolTriangle: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderLeftWidth: width,
        borderBottomWidth: height,
        borderLeftColor: 'transparent',
        borderBottomColor: '#4A90E2',
    },
    warmTriangle: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        width: 0,
        height: 0,
        borderStyle: 'solid',
        borderRightWidth: width,
        borderTopWidth: height,
        borderRightColor: 'transparent',
        borderTopColor: '#FF6B35',
    },
    gradientOverlay: {
        position: 'absolute',
        width: width,
        height: height,
    },
    transitionCircle: {
        position: 'absolute',
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    darkTransitionBackground: {
        position: 'absolute',
        width: width,
        height: height,
        backgroundColor: '#000000',
    },
});