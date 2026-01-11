import { IconSymbol } from '@/components/ui/icon-symbol';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

const STORAGE_KEY = '@streak_data';

export default function ExploreScreen() {
  const [stats, setStats] = useState({
    totalDays: 0,
    currentStreak: 0,
    longestStreak: 0,
    completionRate: 0,
  });

  const loadStats = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) {
        const data = JSON.parse(json);
        let doneDates: string[] = [];
        
        if (data.doneDates) {
          doneDates = data.doneDates;
        } else if (data.lastDate) {
          doneDates = [data.lastDate];
        }

        if (doneDates.length > 0) {
          const sortedDates = [...doneDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          // Current streak calculation
          let currentStreak = 0;
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          for (let i = 0; i < sortedDates.length; i++) {
            const checkDate = new Date(sortedDates[i]);
            checkDate.setHours(0, 0, 0, 0);
            const expectedDate = new Date(today);
            expectedDate.setDate(today.getDate() - i);
            
            if (checkDate.getTime() === expectedDate.getTime()) {
              currentStreak++;
            } else {
              break;
            }
          }

          // Longest streak calculation
          let longestStreak = 1;
          let tempStreak = 1;
          for (let i = 1; i < sortedDates.length; i++) {
            const prevDate = new Date(sortedDates[i - 1]);
            const currDate = new Date(sortedDates[i]);
            prevDate.setHours(0, 0, 0, 0);
            currDate.setHours(0, 0, 0, 0);
            
            const diffTime = prevDate.getTime() - currDate.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);
            
            if (diffDays === 1) {
              tempStreak++;
              longestStreak = Math.max(longestStreak, tempStreak);
            } else {
              tempStreak = 1;
            }
          }

          // Completion rate (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const recentDates = doneDates.filter(date => {
            const d = new Date(date);
            return d >= thirtyDaysAgo;
          });
          const completionRate = Math.round((recentDates.length / 30) * 100);

          setStats({
            totalDays: doneDates.length,
            currentStreak,
            longestStreak,
            completionRate,
          });
        } else {
          setStats({
            totalDays: 0,
            currentStreak: 0,
            longestStreak: 0,
            completionRate: 0,
          });
        }
      }
    } catch (e) {
      console.log(e);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Statistics</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <IconSymbol name="flame.fill" size={32} color="#ff6b35" />
            <Text style={styles.statValue}>{stats.currentStreak}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="trophy.fill" size={32} color="#ffd700" />
            <Text style={styles.statValue}>{stats.longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="checkmark.circle.fill" size={32} color="#22c55e" />
            <Text style={styles.statValue}>{stats.totalDays}</Text>
            <Text style={styles.statLabel}>Total Days</Text>
          </View>

          <View style={styles.statCard}>
            <IconSymbol name="chart.bar.fill" size={32} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.completionRate}%</Text>
            <Text style={styles.statLabel}>Last 30 Days</Text>
          </View>
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>About StreakOne</Text>
          <Text style={styles.infoText}>
            Track your daily habits and build consistency. Mark each day as done to maintain your streak.
          </Text>
          <Text style={styles.infoText}>
            Keep your streak alive by completing your task every day. Missing a day will reset your current streak.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
  },
  scrollContainer: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 16,
  },
  statCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '47%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginTop: 12,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
  infoSection: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#9ca3af',
    lineHeight: 20,
    marginBottom: 12,
  },
});
