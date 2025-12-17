import { SafeAreaView, ScrollView, StyleSheet, View, Text } from 'react-native';
import { useState } from 'react';

export default function MiniCalendarScreen() {
  const [streak] = useState(3);
  const [lastDate] = useState(new Date().toDateString());

  const renderMiniCalendar = () => {
    const daysToShow = 7;
    const today = new Date();
    const datesArray = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      datesArray.push(d);
    }

    return (
      <View style={styles.calendarContainer}>
        {datesArray.map((date, index) => {
          const done = date.toDateString() === lastDate;
          const isToday = date.toDateString() === today.toDateString();
          return (
            <View
              key={index}
              style={[
                styles.dayBox,
                { backgroundColor: done ? '#22c55e' : '#444' },
                isToday && { borderWidth: 2, borderColor: '#fff' },
              ]}
            >
              <Text style={styles.dayText}>{date.getDate()}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {renderMiniCalendar()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
  calendarContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '90%' },
  dayBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#fff', fontWeight: '700' },
});
