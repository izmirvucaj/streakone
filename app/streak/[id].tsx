import { IconSymbol } from '@/components/ui/icon-symbol';
import { cancelStreakNotification, requestNotificationPermissions, scheduleStreakNotification } from '@/utils/notifications';
import { deleteStreak, getStreakById, StreakItem, updateStreak } from '@/utils/storage';
import { calculateProgress, calculateStreak, checkMilestoneReached, getCurrentMilestone, getMilestoneMessage, getMotivationMessage, getNextMilestone, MILESTONES, STREAK_COLORS } from '@/utils/streakHelpers';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

export default function StreakDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [streak, setStreak] = useState<StreakItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [selectedTime, setSelectedTime] = useState(new Date());
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

  const handleNotificationToggle = async (enabled: boolean) => {
    if (!streak || !id) return;

    if (enabled) {
      // Request permissions first
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive daily reminders.',
          [{ text: 'OK' }]
        );
        return;
      }

      // If no time set, use default 9:00 AM
      const time = streak.notificationTime || '09:00';
      const success = await updateStreak(id, { 
        notificationEnabled: true,
        notificationTime: time,
      });
      
      if (success) {
        const updatedStreak = { ...streak, notificationEnabled: true, notificationTime: time };
        setStreak(updatedStreak);
        await scheduleStreakNotification(updatedStreak);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      const success = await updateStreak(id, { notificationEnabled: false });
      if (success) {
        setStreak({ ...streak, notificationEnabled: false });
        await cancelStreakNotification(id);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  const handleTimePickerOpen = () => {
    if (streak?.notificationTime) {
      const [hours, minutes] = streak.notificationTime.split(':').map(Number);
      const date = new Date();
      date.setHours(hours);
      date.setMinutes(minutes);
      setSelectedTime(date);
    }
    setShowTimePicker(true);
  };

  const handleTimePickerChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (date) {
      setSelectedTime(date);
      if (Platform.OS === 'android') {
        handleNotificationTimeSave(date);
      }
    }
  };

  const handleNotificationTimeSave = async (date?: Date) => {
    if (!streak || !id) return;
    
    const timeToSave = date || selectedTime;
    const hours = timeToSave.getHours().toString().padStart(2, '0');
    const minutes = timeToSave.getMinutes().toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}`;

    const success = await updateStreak(id, { notificationTime: timeString });
    if (success) {
      const updatedStreak = { ...streak, notificationTime: timeString };
      setStreak(updatedStreak);
      
      // Reschedule notification if enabled
      if (updatedStreak.notificationEnabled) {
        await scheduleStreakNotification(updatedStreak);
      }
      
      setShowTimePicker(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleNameSave = async () => {
    if (!streak || !id) return;
    const newName = nameInput.trim();
    if (!newName) {
      Alert.alert('Invalid Input', 'Please enter a valid name');
      return;
    }
    const success = await updateStreak(id, { name: newName });
    if (success) {
      setStreak({ ...streak, name: newName });
      setShowEditNameModal(false);
      setNameInput('');
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
          <View style={styles.streakNameRow}>
            <Text style={styles.streakName}>{streak.name}</Text>
            <Pressable 
              style={styles.editNameButton}
              onPress={() => {
                setNameInput(streak.name);
                setShowEditNameModal(true);
              }}
            >
              <IconSymbol name="pencil" size={16} color="#9ca3af" />
            </Pressable>
          </View>
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

          {/* Notification Settings */}
          <View style={styles.notificationSection}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationHeaderLeft}>
                <IconSymbol name="bell.fill" size={18} color="#9ca3af" />
                <Text style={styles.notificationTitle}>Daily Reminder</Text>
              </View>
              <Switch
                value={streak.notificationEnabled || false}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#2a2a2a', true: streak.color || STREAK_COLORS[0] }}
                thumbColor={streak.notificationEnabled ? '#fff' : '#9ca3af'}
              />
            </View>
            {streak.notificationEnabled && (
              <Pressable
                style={styles.notificationTimeButton}
                onPress={handleTimePickerOpen}
              >
                <IconSymbol name="clock" size={16} color="#9ca3af" />
                <Text style={styles.notificationTimeText}>
                  {streak.notificationTime || '09:00'}
                </Text>
                <IconSymbol name="chevron.right" size={14} color="#666" />
              </Pressable>
            )}
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

      {/* Time Picker */}
      {showTimePicker && (
        <>
          {Platform.OS === 'ios' && (
            <Modal
              visible={showTimePicker}
              transparent={true}
              animationType="slide"
              onRequestClose={() => setShowTimePicker(false)}
            >
              <Pressable 
                style={styles.modalOverlay}
                onPress={() => setShowTimePicker(false)}
              >
                <Pressable 
                  style={styles.timePickerModal}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.timePickerHeader}>
                    <Text style={styles.modalTitle}>Set Reminder Time</Text>
                    <Pressable
                      onPress={() => setShowTimePicker(false)}
                      style={styles.closeButton}
                    >
                      <IconSymbol name="xmark" size={20} color="#fff" />
                    </Pressable>
                  </View>
                  <DateTimePicker
                    value={selectedTime}
                    mode="time"
                    is24Hour={false}
                    display="spinner"
                    onChange={handleTimePickerChange}
                    style={styles.timePicker}
                    textColor="#fff"
                  />
                  <View style={styles.targetModalButtons}>
                    <Pressable
                      style={[styles.targetModalButton, styles.cancelButton]}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[styles.targetModalButton, styles.saveButton]}
                      onPress={() => handleNotificationTimeSave()}
                    >
                      <Text style={styles.saveButtonText}>Save</Text>
                    </Pressable>
                  </View>
                </Pressable>
              </Pressable>
            </Modal>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={selectedTime}
              mode="time"
              is24Hour={false}
              display="default"
              onChange={handleTimePickerChange}
            />
          )}
        </>
      )}

      {/* Edit Name Modal */}
      <Modal
        visible={showEditNameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowEditNameModal(false);
          setNameInput('');
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
              setShowEditNameModal(false);
              setNameInput('');
            }}
          >
            <Pressable 
              style={styles.targetModal}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>Edit Streak Name</Text>
              <TextInput
                style={styles.targetInput}
                placeholder="Enter streak name"
                placeholderTextColor="#666"
                value={nameInput}
                onChangeText={setNameInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleNameSave}
                maxLength={50}
              />
              <View style={styles.targetModalButtons}>
                <Pressable
                  style={[styles.targetModalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEditNameModal(false);
                    setNameInput('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.targetModalButton, styles.saveButton]}
                  onPress={handleNameSave}
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
  streakNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  streakName: { fontSize: 24, fontWeight: '700', color: '#fff', flex: 1 },
  editNameButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  notificationSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a2a',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  notificationTitle: { fontSize: 13, fontWeight: '600', color: '#fff' },
  notificationTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f0f0f',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  notificationTimeText: {
    flex: 1,
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: '500',
  },
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
  timePickerModal: {
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
    maxHeight: '60%',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePicker: {
    width: '100%',
    height: 200,
    marginVertical: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 8, textAlign: 'center' },
  modalSubtitle: { fontSize: 14, color: '#9ca3af', marginBottom: 20, textAlign: 'center' },
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
