/**
 * Timer Utilities
 * 
 * Provides utility functions for timer calculations, validation, and formatting
 * used across the assessment system.
 */

export interface TimeRemaining {
  totalMs: number;
  totalSeconds: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  formattedTime: string; // MM:SS format
}

export interface TimerValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  normalizedDuration: number;
}

export interface TimeSyncInfo {
  serverTime: Date;
  clientTime: Date;
  drift: number; // milliseconds
  isInSync: boolean;
  adjustedTime: Date;
}

/**
 * Calculate remaining time between now and expiration
 */
export function calculateRemainingTime(
  startTime: Date,
  durationSeconds: number,
  currentTime: Date = new Date()
): TimeRemaining {
  const expirationTime = new Date(startTime.getTime() + (durationSeconds * 1000));
  const remainingMs = Math.max(0, expirationTime.getTime() - currentTime.getTime());
  
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    totalMs: remainingMs,
    totalSeconds,
    minutes,
    seconds,
    isExpired: remainingMs <= 0,
    formattedTime
  };
}

/**
 * Calculate expiration time from start and duration
 */
export function calculateExpirationTime(
  startTime: Date,
  durationSeconds: number
): Date {
  return new Date(startTime.getTime() + (durationSeconds * 1000));
}

/**
 * Calculate elapsed time since start
 */
export function calculateElapsedTime(
  startTime: Date,
  currentTime: Date = new Date()
): {
  totalMs: number;
  totalSeconds: number;
  formattedTime: string;
} {
  const elapsedMs = Math.max(0, currentTime.getTime() - startTime.getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return {
    totalMs: elapsedMs,
    totalSeconds,
    formattedTime
  };
}

/**
 * Validate timer duration settings
 */
export function validateTimerDuration(
  durationSeconds: number,
  minDuration: number = 5,
  maxDuration: number = 300
): TimerValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if duration is a valid number
  if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
    errors.push('Duration must be a positive number');
  }
  
  // Check minimum duration
  if (durationSeconds < minDuration) {
    errors.push(`Duration must be at least ${minDuration} seconds`);
  }
  
  // Check maximum duration
  if (durationSeconds > maxDuration) {
    errors.push(`Duration cannot exceed ${maxDuration} seconds`);
  }
  
  // Generate warnings for unusual durations
  if (durationSeconds < 15) {
    warnings.push('Very short duration may not provide adequate time to answer');
  }
  
  if (durationSeconds > 180) {
    warnings.push('Very long duration may reduce engagement');
  }
  
  // Normalize duration (round to nearest second)
  const normalizedDuration = Math.round(durationSeconds);
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    normalizedDuration
  };
}

/**
 * Check if a submission is within time limit
 */
export function isSubmissionOnTime(
  questionStartTime: Date,
  questionDuration: number,
  submissionTime: Date,
  graceMs: number = 1000 // 1 second grace period
): {
  isOnTime: boolean;
  lateness: number; // milliseconds late (negative if early)
  graceUsed: boolean;
} {
  const expirationTime = calculateExpirationTime(questionStartTime, questionDuration);
  const lateness = submissionTime.getTime() - expirationTime.getTime();
  
  const isOnTime = lateness <= graceMs;
  const graceUsed = lateness > 0 && lateness <= graceMs;
  
  return {
    isOnTime,
    lateness,
    graceUsed
  };
}

/**
 * Calculate time sync information between client and server
 */
export function calculateTimeSync(
  clientTime: Date,
  serverTime: Date = new Date(),
  maxAllowedDriftMs: number = 5000
): TimeSyncInfo {
  const drift = clientTime.getTime() - serverTime.getTime();
  const isInSync = Math.abs(drift) <= maxAllowedDriftMs;
  
  // Adjust client time to server time
  const adjustedTime = new Date(clientTime.getTime() - drift);
  
  return {
    serverTime,
    clientTime,
    drift,
    isInSync,
    adjustedTime
  };
}

/**
 * Create timer performance metrics
 */
export function createTimerMetrics(
  questionDuration: number,
  actualTimeSpent: number,
  submissionTime: Date,
  expectedExpirationTime: Date
): {
  utilizationPercentage: number;
  efficiency: 'under' | 'optimal' | 'rushed' | 'timeout';
  timeSpentSeconds: number;
  expectedDurationSeconds: number;
  submissionTiming: 'early' | 'onTime' | 'late';
} {
  const timeSpentSeconds = Math.min(actualTimeSpent, questionDuration);
  const utilizationPercentage = (timeSpentSeconds / questionDuration) * 100;
  
  // Determine efficiency category
  let efficiency: 'under' | 'optimal' | 'rushed' | 'timeout';
  if (utilizationPercentage < 30) {
    efficiency = 'rushed';
  } else if (utilizationPercentage <= 90) {
    efficiency = 'optimal';
  } else if (utilizationPercentage < 100) {
    efficiency = 'under';
  } else {
    efficiency = 'timeout';
  }
  
  // Determine submission timing
  let submissionTiming: 'early' | 'onTime' | 'late';
  const submissionLateness = submissionTime.getTime() - expectedExpirationTime.getTime();
  if (submissionLateness < -1000) { // More than 1 second early
    submissionTiming = 'early';
  } else if (submissionLateness <= 1000) { // Within 1 second of expiration
    submissionTiming = 'onTime';
  } else {
    submissionTiming = 'late';
  }
  
  return {
    utilizationPercentage: Math.round(utilizationPercentage * 100) / 100,
    efficiency,
    timeSpentSeconds,
    expectedDurationSeconds: questionDuration,
    submissionTiming
  };
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(
  seconds: number,
  includeMs: boolean = false
): string {
  if (seconds < 0) {
    return '00:00';
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);
  
  let formatted = '';
  
  if (hours > 0) {
    formatted += `${hours}:`;
  }
  
  formatted += `${minutes.toString().padStart(2, '0')}:`;
  formatted += `${remainingSeconds.toString().padStart(2, '0')}`;
  
  if (includeMs) {
    formatted += `.${milliseconds.toString().padStart(3, '0')}`;
  }
  
  return formatted;
}

/**
 * Parse duration string to seconds
 */
export function parseDurationString(
  durationString: string
): number | null {
  // Support formats: "MM:SS", "HH:MM:SS", "SS" (seconds only)
  const patterns = [
    /^(\d{1,2}):(\d{2})$/, // MM:SS
    /^(\d{1,2}):(\d{2}):(\d{2})$/, // HH:MM:SS
    /^(\d+)$/ // SS (seconds only)
  ];
  
  for (const pattern of patterns) {
    const match = durationString.trim().match(pattern);
    if (match) {
      if (match.length === 2) {
        // Seconds only
        return parseInt(match[1], 10);
      } else if (match.length === 3) {
        // MM:SS
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        return (minutes * 60) + seconds;
      } else if (match.length === 4) {
        // HH:MM:SS
        const hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const seconds = parseInt(match[3], 10);
        return (hours * 3600) + (minutes * 60) + seconds;
      }
    }
  }
  
  return null;
}

/**
 * Create timer warning thresholds
 */
export function createWarningThresholds(
  totalDurationSeconds: number
): {
  warningAt: number; // seconds remaining
  urgentAt: number; // seconds remaining
  criticalAt: number; // seconds remaining
} {
  return {
    warningAt: Math.floor(totalDurationSeconds * 0.25), // 25% remaining
    urgentAt: Math.floor(totalDurationSeconds * 0.1), // 10% remaining
    criticalAt: Math.floor(totalDurationSeconds * 0.05) // 5% remaining
  };
}

/**
 * Determine timer urgency level
 */
export function getTimerUrgency(
  remainingSeconds: number,
  totalDurationSeconds: number
): 'normal' | 'warning' | 'urgent' | 'critical' | 'expired' {
  if (remainingSeconds <= 0) {
    return 'expired';
  }
  
  const thresholds = createWarningThresholds(totalDurationSeconds);
  
  if (remainingSeconds <= thresholds.criticalAt) {
    return 'critical';
  } else if (remainingSeconds <= thresholds.urgentAt) {
    return 'urgent';
  } else if (remainingSeconds <= thresholds.warningAt) {
    return 'warning';
  } else {
    return 'normal';
  }
}

/**
 * Calculate optimal buffer time for network latency
 */
export function calculateNetworkBuffer(
  averageLatencyMs: number = 500,
  connectionQuality: 'excellent' | 'good' | 'fair' | 'poor' = 'good'
): number {
  const baseBuffer = averageLatencyMs * 2; // Double the average latency
  
  const qualityMultipliers = {
    excellent: 1.0,
    good: 1.5,
    fair: 2.0,
    poor: 3.0
  };
  
  return Math.ceil(baseBuffer * qualityMultipliers[connectionQuality]);
} 