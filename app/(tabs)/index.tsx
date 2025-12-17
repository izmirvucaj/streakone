import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const STORAGE_KEY = '@streak_data';

export default function HomeScreen() {
  const [streak, setStreak] = useState(0);
  const [lastDate, setLastDate] = useState('');
  const scaleAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const loadData = async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const data = JSON.parse(json);
          setStreak(data.streak);
          setLastDate(data.lastDate);
        }
      } catch (e) {
        console.log(e);
      }
    };
    loadData();
  }, []);

  const handleDone = async () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const today = new Date().toDateString();
    if (today === lastDate) {
      Alert.alert('Already done', 'You have already marked today as done!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const newStreak = lastDate === yesterday.toDateString() ? streak + 1 : 1;

    setStreak(newStreak);
    setLastDate(today);

    try {
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ streak: newStreak, lastDate: today })
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.log(e);
    }
  };

  // MiniCalendar component home tab içinde
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
    <View style={styles.container}>
      <Text style={styles.title}>StreakOne</Text>
      <Text style={styles.streak}>🔥 {streak} day streak</Text>

      {renderMiniCalendar()}

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable style={styles.button} onPress={handleDone}>
          <Text style={styles.buttonText}>DONE TODAY</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f0f0f', paddingHorizontal: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 12 },
  streak: { fontSize: 18, color: '#9ca3af', marginBottom: 32 },
  button: { backgroundColor: '#22c55e', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 },
  buttonText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  calendarContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '90%', marginBottom: 32 },
  dayBox: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#fff', fontWeight: '700' },
});
