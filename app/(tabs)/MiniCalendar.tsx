import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const STORAGE_KEY = '@streak_data';

export default function MiniCalendarScreen() {
  const [doneDates, setDoneDates] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        // Eski veri yapısını destekle (migration)
        if (data.doneDates) {
          setDoneDates(data.doneDates);
        } else if (data.lastDate) {
          setDoneDates([data.lastDate]);
        } else {
          setDoneDates([]);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Ekran her focus olduğunda veriyi yenile
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const renderMiniCalendar = () => {
    const daysToShow = 30; // Son 30 günü göster
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const datesArray = [];
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      datesArray.push(d);
    }

    return (
      <View style={styles.calendarContainer}>
        {datesArray.map((date, index) => {
          const dateString = date.toDateString();
          const done = doneDates.includes(dateString);
          const isToday = dateString === today.toDateString();
          const isPast = date < today;
          return (
            <View
              key={index}
              style={[
                styles.dayBox,
                {
                  backgroundColor: done
                    ? '#22c55e'
                    : isPast
                    ? '#dc2626'
                    : '#444',
                },
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
        <Text style={styles.title}>Calendar</Text>
        <Text style={styles.subtitle}>Last 30 days</Text>
        {renderMiniCalendar()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scrollContainer: { flexGrow: 1, padding: 16, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 24, textAlign: 'center' },
  calendarContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'center', 
    gap: 8,
    width: '100%',
    maxWidth: 400,
  },
  dayBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
