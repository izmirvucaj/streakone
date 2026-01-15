/**
 * Calculate streak count from doneDates array
 */
export function calculateStreak(doneDates: string[]): number {
  if (doneDates.length === 0) return 0;
  
  const sortedDates = [...doneDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  let streakCount = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = new Date(sortedDates[i]);
    checkDate.setHours(0, 0, 0, 0);
    const expectedDate = new Date(today);
    expectedDate.setDate(today.getDate() - i);
    
    if (checkDate.getTime() === expectedDate.getTime()) {
      streakCount++;
    } else {
      break;
    }
  }
  
  return streakCount;
}

/**
 * Generate a unique ID for streaks
 */
export function generateStreakId(): string {
  return `streak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Default colors for streaks
 */
export const STREAK_COLORS = [
  '#22c55e', // Green
  '#3b82f6', // Blue
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#10b981', // Emerald
  '#6366f1', // Indigo
  '#f43f5e', // Rose
  '#14b8a6', // Teal
  '#a855f7', // Violet
  '#eab308', // Yellow
];

/**
 * Calculate progress percentage towards target
 */
export function calculateProgress(current: number, target: number): number {
  if (!target || target === 0) return 0;
  return Math.min(Math.round((current / target) * 100), 100);
}

/**
 * Get motivation message based on progress
 */
export function getMotivationMessage(progress: number, daysLeft: number): string {
  if (progress >= 100) {
    return '🎉 You reached your goal! Great job!';
  } else if (progress >= 90) {
    return `🔥 Almost there! Only ${daysLeft} days left!`;
  } else if (progress >= 75) {
    return `💪 You're doing great! ${daysLeft} days left.`;
  } else if (progress >= 50) {
    return `✨ Halfway there! Keep going!`;
  } else if (progress >= 25) {
    return `🌱 Good start! Keep it up!`;
  } else {
    return `🚀 You've started! Every day matters!`;
  }
}

/**
 * Milestone definitions
 */
export interface Milestone {
  days: number;
  name: string;
  emoji: string;
  color: string;
}

export const MILESTONES: Milestone[] = [
  { days: 7, name: 'Bronze', emoji: '🌟', color: '#cd7f32' },
  { days: 30, name: 'Silver', emoji: '🥈', color: '#c0c0c0' },
  { days: 100, name: 'Gold', emoji: '🥇', color: '#ffd700' },
  { days: 365, name: 'Diamond', emoji: '💎', color: '#b9f2ff' },
];

/**
 * Get the highest milestone achieved
 */
export function getCurrentMilestone(streak: number): Milestone | null {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (streak >= MILESTONES[i].days) {
      return MILESTONES[i];
    }
  }
  return null;
}

/**
 * Get the next milestone to achieve
 */
export function getNextMilestone(streak: number): Milestone | null {
  for (const milestone of MILESTONES) {
    if (streak < milestone.days) {
      return milestone;
    }
  }
  return null; // All milestones achieved
}

/**
 * Get all achieved milestones
 */
export function getAchievedMilestones(streak: number): Milestone[] {
  return MILESTONES.filter(m => streak >= m.days);
}

/**
 * Check if a milestone was just reached (for celebration)
 */
export function checkMilestoneReached(currentStreak: number, previousStreak: number): Milestone | null {
  for (const milestone of MILESTONES) {
    if (currentStreak >= milestone.days && previousStreak < milestone.days) {
      return milestone;
    }
  }
  return null;
}

/**
 * Get milestone celebration message
 */
export function getMilestoneMessage(milestone: Milestone): string {
  return `🎉 ${milestone.emoji} Congratulations! You've reached ${milestone.days} days - ${milestone.name} milestone!`;
}
