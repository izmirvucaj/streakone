import { IconSymbol } from '@/components/ui/icon-symbol';
import { addStreak, loadStreakData, StreakItem } from '@/utils/storage';
import { generateStreakId, getCurrentMilestone, STREAK_COLORS } from '@/utils/streakHelpers';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function HomeScreen() {
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStreakName, setNewStreakName] = useState('');
  const router = useRouter();

  const loadStreaks = useCallback(async () => {
    const loadedStreaks = await loadStreakData();
    setStreaks(loadedStreaks);
  }, []);

  useEffect(() => {
    loadStreaks();
  }, [loadStreaks]);

  useFocusEffect(
    useCallback(() => {
      loadStreaks();
    }, [loadStreaks])
  );

  const handleAddStreak = async () => {
    if (!newStreakName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const color = STREAK_COLORS[streaks.length % STREAK_COLORS.length];
    const newStreak: StreakItem = {
      id: generateStreakId(),
      name: newStreakName.trim(),
      doneDates: [],
      streak: 0,
      createdAt: new Date().toISOString(),
      color,
    };

    const success = await addStreak(newStreak);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setNewStreakName('');
      setShowAddModal(false);
      loadStreaks();
    }
  };

  const handleStreakPress = (streakId: string) => {
    router.push(`/streak/${streakId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>StreakOne</Text>
          <Text style={styles.subtitle}>Track your habits</Text>
        </View>

        {streaks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="flame" size={64} color="#666" />
            <Text style={styles.emptyText}>No streaks yet</Text>
            <Text style={styles.emptySubtext}>Create your first streak to get started!</Text>
          </View>
        ) : (
          <View style={styles.streaksList}>
            {streaks.map((streak) => {
              const progress = streak.targetDays 
                ? Math.round((streak.streak / streak.targetDays) * 100) 
                : null;
              const currentMilestone = getCurrentMilestone(streak.streak);
              
              return (
                <Pressable
                  key={streak.id}
                  style={[styles.streakCard, { borderLeftColor: streak.color || STREAK_COLORS[0] }]}
                  onPress={() => handleStreakPress(streak.id)}
                >
                  <View style={styles.streakCardContent}>
                    <View style={styles.streakNameRow}>
                      <Text style={styles.streakName}>{streak.name}</Text>
                      {currentMilestone && (
                        <View style={[styles.milestoneBadgeSmall, { borderColor: currentMilestone.color }]}>
                          <Text style={styles.milestoneEmojiSmall}>{currentMilestone.emoji}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.streakInfo}>
                      <Text style={styles.streakCount}>🔥 {streak.streak}</Text>
                      <Text style={styles.streakDays}>{streak.doneDates.length} days</Text>
                    </View>
                    {streak.targetDays && (
                      <View style={styles.targetInfo}>
                        <View style={styles.targetProgressBar}>
                          <View 
                            style={[
                              styles.targetProgressFill,
                              {
                                width: `${Math.min(progress || 0, 100)}%`,
                                backgroundColor: streak.color || STREAK_COLORS[0],
                              }
                            ]}
                          />
                        </View>
                        <Text style={styles.targetText}>
                          {progress}% • {streak.targetDays - streak.streak} days left
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconSymbol name="chevron.right" size={20} color="#666" />
                </Pressable>
              );
            })}
          </View>
        )}

        <Pressable
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
          <Text style={styles.addButtonText}>New Streak</Text>
        </Pressable>
      </ScrollView>

      {/* Add Streak Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowAddModal(false);
              setNewStreakName('');
            }}
          >
            <Pressable
              style={styles.modalContent}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Create New Streak</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Sigara Bırakma, Ders Çalışma..."
                placeholderTextColor="#666"
                value={newStreakName}
                onChangeText={setNewStreakName}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleAddStreak}
              />
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddModal(false);
                    setNewStreakName('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleAddStreak}
                >
                  <Text style={styles.createButtonText}>Create</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  header: { marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '700', color: '#fff', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#9ca3af' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 20, fontWeight: '600', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#9ca3af', textAlign: 'center' },
  streaksList: { gap: 12, marginBottom: 20 },
  streakCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  streakCardContent: { flex: 1 },
  streakNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  streakName: { fontSize: 18, fontWeight: '600', color: '#fff', flex: 1 },
  milestoneBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  milestoneEmojiSmall: { fontSize: 14 },
  streakInfo: { flexDirection: 'row', gap: 16, marginBottom: 8 },
  streakCount: { fontSize: 16, fontWeight: '700', color: '#22c55e' },
  streakDays: { fontSize: 14, color: '#9ca3af' },
  targetInfo: { marginTop: 8 },
  targetProgressBar: {
    height: 4,
    backgroundColor: '#2a2a2a',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  targetProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  targetText: { fontSize: 11, color: '#9ca3af' },
  addButton: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  addButtonText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // Tab bar için ekstra padding
    borderWidth: 1,
    borderColor: '#2a2a2a',
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 20 },
  input: {
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  cancelButton: { backgroundColor: '#2a2a2a' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createButton: { backgroundColor: '#22c55e' },
  createButtonText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
});
