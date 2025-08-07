import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, Button } from 'react-native';
import WorkoutTimer from './components/WorkoutTimer';
import ProgressCalendar from './components/ProgressCalendar';
import Motivation from './components/Motivation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleWorkoutNotification } from './utils/notifications';

const getWorkoutDuration = week => 5 + (week - 1);

function getSessionKey(week, day, session) {
  return `w${week}_d${day}_${session}`;
}

export default function App() {
  const [week, setWeek] = useState(1);
  const [day, setDay] = useState(1);
  const [completedSessions, setCompletedSessions] = useState({});

  useEffect(() => {
    AsyncStorage.getItem('completedSessions').then(data => {
      if (data) setCompletedSessions(JSON.parse(data));
    });

    // Schedule notifications (once)
    scheduleWorkoutNotification(8, 0, "Time for your morning Gentle Reset workout!");
    scheduleWorkoutNotification(18, 0, "Time for your evening Gentle Reset workout!");
  }, []);

  const markComplete = session => {
    const key = getSessionKey(week, day, session);
    const updated = { ...completedSessions, [key]: true };
    setCompletedSessions(updated);
    AsyncStorage.setItem('completedSessions', JSON.stringify(updated));
  };

  const isCompleted = session => !!completedSessions[getSessionKey(week, day, session)];

  // Navigation logic
  const nextDay = () => {
    if (day < 3) setDay(day + 1);
    else if (week < 8) {
      setWeek(week + 1);
      setDay(1);
    }
  };
  const prevDay = () => {
    if (day > 1) setDay(day - 1);
    else if (week > 1) {
      setWeek(week - 1);
      setDay(3);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F2FBFA" }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontSize: 32, fontWeight: 'bold', marginBottom: 16, color: "#2C786C" }}>Gentle Reset</Text>
        <Text style={{ fontSize: 18, marginBottom: 8 }}>Week {week}, Day {day}</Text>
        <WorkoutTimer
          session="Morning"
          duration={getWorkoutDuration(week)}
          completed={isCompleted("Morning")}
          onComplete={() => markComplete("Morning")}
        />
        <WorkoutTimer
          session="Evening"
          duration={getWorkoutDuration(week)}
          completed={isCompleted("Evening")}
          onComplete={() => markComplete("Evening")}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
          <Button title="Previous" onPress={prevDay} disabled={week === 1 && day === 1} />
          <Button title="Next" onPress={nextDay} disabled={week === 8 && day === 3} />
        </View>
        <Motivation sessionCount={Object.keys(completedSessions).length} />
        <View style={{ marginTop: 32, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, color: "#2C786C" }}>Progress</Text>
          <Text>
            {Object.keys(completedSessions).length} / {8 * 3 * 2} sessions completed
          </Text>
        </View>
        <ProgressCalendar completedSessions={completedSessions} />
      </ScrollView>
    </SafeAreaView>
  );
}