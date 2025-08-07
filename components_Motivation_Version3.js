import React from 'react';
import { View, Text } from 'react-native';

const messages = [
  "Every step counts!",
  "Consistency is key.",
  "You’re building a strong foundation.",
  "Gentle movement, big impact.",
  "Celebrate your progress!",
  "Small steps, big changes.",
  "You’ve got this!",
  "Progress, not perfection."
];

export default function Motivation({ sessionCount }) {
  const index = sessionCount % messages.length;
  return (
    <View style={{ marginVertical: 16 }}>
      <Text style={{ fontSize: 18, fontStyle: 'italic', color: "#2C786C" }}>
        {messages[index]}
      </Text>
    </View>
  );
}