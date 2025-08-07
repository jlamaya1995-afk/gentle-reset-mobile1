import React from 'react';
import { View, Text } from 'react-native';

export default function ProgressCalendar({ completedSessions }) {
  const weeks = Array.from({ length: 8 }, (_, i) => i + 1);
  const days = [1, 2, 3];

  return (
    <View style={{ marginTop: 32 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>Calendar</Text>
      {weeks.map(week => (
        <View key={week} style={{ flexDirection: 'row', marginBottom: 4 }}>
          <Text style={{ width: 60 }}>Week {week}</Text>
          {days.map(day => (
            <View key={day} style={{ flexDirection: 'row', gap: 2 }}>
              {['Morning', 'Evening'].map(session => {
                const key = `w${week}_d${day}_${session}`;
                const complete = !!completedSessions[key];
                return (
                  <View
                    key={session}
                    style={{
                      width: 14,
                      height: 14,
                      marginHorizontal: 2,
                      borderRadius: 7,
                      backgroundColor: complete ? '#2C786C' : '#E6F7F4',
                      borderWidth: 1,
                      borderColor: '#B2D8D8',
                    }}
                  />
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}