// components/TurnTimerRing.tsx
import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

type Props = {
  visible: boolean;
  mmss: string;       // "0:15"
  progress: number;   // 0 -> 1
  style?: ViewStyle;  // pour positionner en absolu
  size?: number;      // optionnel
  stroke?: number;    // épaisseur
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function TurnTimerRing({
  visible,
  mmss,
  progress,
  style,
  size = 48,
  stroke = 5,
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const dash = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(dash, {
      toValue: progress,
      duration: 100,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const dashOffset = dash.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circumference],
  });

  const color = useMemo(() => {
    if (progress < 0.2) return "#FF5E5E";      // rouge
    if (progress < 0.5) return "#F2C94C";      // jaune/orange
    return "#1FA774";                           // vert
  }, [progress]);

  if (!visible) return null;

  return (
    <View style={[styles.wrapper, style]} pointerEvents="none">
      <View style={[styles.card, { width: size + 10, height: size + 10 }]}>
        <Svg width={size} height={size} style={{ transform: [{ rotate: "-90deg" }] }}>
          {/* Track */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#282828"
            strokeWidth={stroke}
            fill="none"
          />
          {/* Progress */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <View style={styles.center}>
          <Text style={styles.time}>{mmss}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
  },
  card: {
    backgroundColor: "#101010",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    padding: 5,
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  time: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
});
