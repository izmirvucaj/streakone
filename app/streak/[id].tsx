import { IconSymbol } from '@/components/ui/icon-symbol';
import { deleteStreak, getStreakById, StreakItem, updateStreak } from '@/utils/storage';
import { calculateProgress, calculateStreak, checkMilestoneReached, getCurrentMilestone, getMilestoneMessage, getMotivationMessage, getNextMilestone, MILESTONES, STREAK_COLORS } from '@/utils/streakHelpers';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function StreakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [streak, setStreak] = useState<StreakItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const scaleAnim = useState(new Animated.Value(1))[0];

  const loadStreak = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const loadedStreak = await getStreakById(id);
    if (loadedStreak) {
      // Recalculate streak to ensure it's up to date
      const updatedStreak = {
        ...loadedStreak,
        streak: calculateStreak(loadedStreak.doneDates),
      };
      setStreak(updatedStreak);
    } else {
      Alert.alert('Error', 'Streak not found', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    loadStreak();
  }, [loadStreak]);

  useFocusEffect(
    useCallback(() => {
      loadStreak();
    }, [loadStreak])
  );

  const handleDone = async () => {
    if (!streak) return;

    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.1, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    const today = new Date().toDateString();
    if (streak.doneDates.includes(today)) {
      Alert.alert('Already done', 'You have already marked today as done!');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const previousStreak = streak.streak;
    const newDoneDates = [...streak.doneDates, today];
    const newStreakCount = calculateStreak(newDoneDates);

    const updatedStreak: StreakItem = {
      ...streak,
      doneDates: newDoneDates,
      streak: newStreakCount,
    };

    const success = await updateStreak(id, updatedStreak);
    if (success) {
      setStreak(updatedStreak);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Check for milestone achievement
      const milestoneReached = checkMilestoneReached(newStreakCount, previousStreak);
      if (milestoneReached) {
        setTimeout(() => {
          Alert.alert(
            'Milestone Achieved! 🎉',
            getMilestoneMessage(milestoneReached),
            [{ text: 'Awesome!', style: 'default' }]
          );
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 300);
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Streak',
      `Are you sure you want to delete "${streak?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              const success = await deleteStreak(id);
              if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.back();
              }
            }
          },
        },
      ]
    );
  };

  const handleColorChange = async (color: string) => {
    if (!streak || !id) return;
    const success = await updateStreak(id, { color });
    if (success) {
      setStreak({ ...streak, color });
      setShowColorPicker(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTargetSave = async () => {
    if (!streak || !id) return;
    const target = parseInt(targetInput);
    if (isNaN(target) || target <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number greater than 0');
      return;
    }
    const success = await updateStreak(id, { targetDays: target });
    if (success) {
      setStreak({ ...streak, targetDays: target });
      setShowTargetModal(false);
      setTargetInput('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTargetRemove = async () => {
    if (!streak || !id) return;
    const success = await updateStreak(id, { targetDays: undefined });
    if (success) {
      setStreak({ ...streak, targetDays: undefined });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const renderMiniCalendar = () => {
    if (!streak) return null;

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
          const dateString = date.toDateString();
          const done = streak.doneDates.includes(dateString);
          const isToday = dateString === today.toDateString();
          const isPast = date < new Date(today.toDateString());
          return (
            <View
              key={index}
              style={[
                styles.dayBox,
                {
                  backgroundColor: done
                    ? streak.color || STREAK_COLORS[0]
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!streak) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Streak not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#fff" />
          </Pressable>
          <Pressable style={styles.deleteButton} onPress={handleDelete}>
            <IconSymbol name="trash" size={20} color="#ef4444" />
          </Pressable>
        </View>

        {/* Streak Info */}
        <View style={[styles.streakHeader, { borderLeftColor: streak.color || STREAK_COLORS[0] }]}>
          <Text style={styles.streakName}>{streak.name}</Text>
          <Text style={styles.streakCount}>🔥 {streak.streak} day streak</Text>
          <Text style={styles.totalDays}>{streak.doneDates.length} total days</Text>
          
          {/* Milestones - Collapsible */}
          <View style={styles.milestonesSection}>
            <Pressable 
              style={styles.milestonesHeader}
              onPress={() => setShowAchievements(!showAchievements)}
            >
              <View style={styles.milestonesHeaderLeft}>
                <IconSymbol 
                  name="chevron.right" 
                  size={18} 
                  color="#9ca3af"
                  style={{ transform: [{ rotate: showAchievements ? '90deg' : '0deg' }] }}
                />
                <Text style={styles.milestonesTitle}>Achievements</Text>
              </View>
              {getCurrentMilestone(streak.streak) && (
                <View style={[styles.currentMilestoneBadge, { borderColor: getCurrentMilestone(streak.streak)!.color }]}>
                  <Text style={styles.currentMilestoneEmoji}>{getCurrentMilestone(streak.streak)?.emoji}</Text>
                </View>
              )}
            </Pressable>
            {showAchievements && (
              <View style={styles.milestonesContent}>
                <View style={styles.milestonesContainer}>
                  {MILESTONES.map((milestone) => {
                    const achieved = streak.streak >= milestone.days;
                    return (
                      <View
                        key={milestone.days}
                        style={[
                          styles.milestoneBadge,
                          achieved && styles.milestoneBadgeAchieved,
                          { borderColor: achieved ? milestone.color : '#2a2a2a' },
                        ]}
                      >
                        <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                        <Text style={[styles.milestoneText, achieved && { color: milestone.color }]}>
                          {milestone.name}
                        </Text>
                        <Text style={styles.milestoneDays}>{milestone.days}</Text>
                      </View>
                    );
                  })}
                </View>
                {getNextMilestone(streak.streak) && (
                  <Text style={styles.nextMilestoneText}>
                    Next: {getNextMilestone(streak.streak)?.emoji} {getNextMilestone(streak.streak)?.name} in {getNextMilestone(streak.streak)!.days - streak.streak} days
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* Target Progress */}
          {streak.targetDays && (
            <View style={styles.targetSection}>
              <View style={styles.targetHeader}>
                <Text style={styles.targetLabel}>Target: {streak.targetDays} days</Text>
                <Pressable onPress={() => setShowTargetModal(true)}>
                  <IconSymbol name="pencil" size={16} color="#9ca3af" />
                </Pressable>
              </View>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { 
                      width: `${calculateProgress(streak.streak, streak.targetDays)}%`,
                      backgroundColor: streak.color || STREAK_COLORS[0],
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {calculateProgress(streak.streak, streak.targetDays)}% completed
                {streak.streak < streak.targetDays && ` • ${streak.targetDays - streak.streak} days left`}
              </Text>
              <Text style={styles.motivationText}>
                {getMotivationMessage(
                  calculateProgress(streak.streak, streak.targetDays),
                  streak.targetDays - streak.streak
                )}
              </Text>
            </View>
          )}
          
          {/* Settings */}
          <View style={styles.settingsRow}>
            <Pressable 
              style={styles.settingButton}
              onPress={() => setShowColorPicker(true)}
            >
              <IconSymbol name="paintbrush.fill" size={18} color="#9ca3af" />
              <Text style={styles.settingButtonText}>Color</Text>
            </Pressable>
            <Pressable 
              style={styles.settingButton}
              onPress={() => {
                if (streak.targetDays) {
                  setTargetInput(streak.targetDays.toString());
                }
                setShowTargetModal(true);
              }}
            >
              <IconSymbol name="target" size={18} color="#9ca3af" />
              <Text style={styles.settingButtonText}>
                {streak.targetDays ? 'Edit Target' : 'Set Target'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Calendar */}
        <View style={styles.calendarSection}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          {renderMiniCalendar()}
        </View>

        {/* Done Button */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            style={[styles.button, { backgroundColor: streak.color || STREAK_COLORS[0] }]}
            onPress={handleDone}
          >
            <Text style={styles.buttonText}>DONE TODAY</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowColorPicker(false)}
        >
          <Pressable 
            style={styles.colorPickerModal}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Choose Color</Text>
            <View style={styles.colorGrid}>
              {STREAK_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    streak.color === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => handleColorChange(color)}
                >
                  {streak.color === color && (
                    <IconSymbol name="checkmark" size={20} color="#fff" />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Target Modal */}
      <Modal
        visible={showTargetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowTargetModal(false);
          setTargetInput('');
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => {
              setShowTargetModal(false);
              setTargetInput('');
            }}
          >
            <Pressable 
              style={styles.targetModal}
              onPress={(e) => e.stopPropagation()}
            >
            <Text style={styles.modalTitle}>
              {streak.targetDays ? 'Edit Target' : 'Set Target'}
            </Text>
            <TextInput
              style={styles.targetInput}
              placeholder="Target days (e.g., 30)"
              placeholderTextColor="#666"
              value={targetInput}
              onChangeText={setTargetInput}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleTargetSave}
            />
            <View style={styles.targetModalButtons}>
              {streak.targetDays && (
                <Pressable
                  style={[styles.targetModalButton, styles.removeButton]}
                  onPress={() => {
                    handleTargetRemove();
                    setShowTargetModal(false);
                    setTargetInput('');
                  }}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              )}
              <Pressable
                style={[styles.targetModalButton, styles.cancelButton]}
                onPress={() => {
                  setShowTargetModal(false);
                  setTargetInput('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.targetModalButton, styles.saveButton]}
                onPress={handleTargetSave}
              >
                <Text style={styles.saveButtonText}>Save</Text>
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
  scrollContent: { padding: 16, paddingBottom: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#fff', fontSize: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakHeader: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  streakName: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 6 },
  streakCount: { fontSize: 20, fontWeight: '700', color: '#22c55e', marginBottom: 4 },
  totalDays: { fontSize: 13, color: '#9ca3af', marginBottom: 12 },
  milestonesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
    marginBottom: 12,
  },
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  milestonesHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  milestonesTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  currentMilestoneBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  currentMilestoneEmoji: { fontSize: 14 },
  milestonesContent: {
    marginTop: 6,
  },
  milestonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  milestoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#0f0f0f',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  milestoneBadgeAchieved: {
    backgroundColor: '#1a1a1a',
  },
  milestoneEmoji: { fontSize: 16 },
  milestoneText: { fontSize: 11, fontWeight: '600', color: '#9ca3af' },
  milestoneDays: { fontSize: 10, color: '#666', marginLeft: 2 },
  nextMilestoneText: { fontSize: 12, color: '#9ca3af', fontStyle: 'italic' },
  targetSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  targetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  targetLabel: { fontSize: 13, fontWeight: '600', color: '#fff' },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: { fontSize: 11, color: '#9ca3af', marginBottom: 6 },
  motivationText: { fontSize: 13, color: '#fff', fontWeight: '500' },
  settingsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  settingButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  settingButtonText: { fontSize: 13, color: '#9ca3af', fontWeight: '500' },
  calendarSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 12 },
  calendarContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  dayBox: { flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dayText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  button: { paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorPickerModal: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  targetModal: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    position: 'absolute',
    bottom: 0,
    maxHeight: '50%',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 20, textAlign: 'center' },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#fff',
  },
  targetInput: {
    backgroundColor: '#0f0f0f',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    marginBottom: 20,
  },
  targetModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  targetModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: { backgroundColor: '#2a2a2a' },
  cancelButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  saveButton: { backgroundColor: '#22c55e' },
  saveButtonText: { color: '#0f0f0f', fontSize: 16, fontWeight: '700' },
  removeButton: { backgroundColor: '#ef4444' },
  removeButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
