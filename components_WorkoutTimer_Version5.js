import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';

export default function WorkoutTimer({ session, duration, completed, onComplete }) {
  const [seconds, setSeconds] = useState(duration * 60);
  const [active, setActive] = useState(false);

  useEffect(() => {
    setSeconds(duration * 60);
    setActive(false);
  }, [duration]);

  useEffect(() => {
    let timer = null;
    if (active && seconds > 0) {
      timer = setInterval(() => setSeconds(s => s - 1), 1000);
    }
    if (seconds === 0 && active) {
      setActive(false);
      onComplete();
    }
    return () => clearInterval(timer);
  }, [active, seconds]);

  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <View style={{ alignItems: 'center', margin: 16, backgroundColor: completed ? '#D1F7C4' : '#E6F7F4', borderRadius: 8, padding: 12 }}>
      <Text style={{ fontSize: 20, marginBottom: 8 }}>{session} Session</Text>
      <Text style={{ fontSize: 40, marginBottom: 8 }}>{minutes}:{secs.toString().padStart(2, '0')}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button title="Start" onPress={() => setActive(true)} disabled={active || seconds === 0 || completed} />
        <Button title="Pause" onPress={() => setActive(false)} disabled={!active} />
        <Button title="Reset" onPress={() => { setSeconds(duration * 60); setActive(false); }} />
        <Button title={completed ? "Completed" : "Mark Done"} onPress={onComplete} disabled={completed} />
      </View>
    </View>
  );
}