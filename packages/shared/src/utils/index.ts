import { z } from 'zod';
// import { ERROR_CONSTANTS } from '../constants';

// Validation Utilities
export const validateSchema = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
};

// Error Utilities
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const createApiError = (
  code: string,
  message: string,
  details?: Record<string, any>
) => ({
  error: {
    code,
    message,
    details,
    timestamp: new Date().toISOString(),
    requestId: Math.random().toString(36).substring(7),
  },
});

// Audio Utilities
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatTempo = (bpm: number): string => {
  return `${bpm} BPM`;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const linearToDb = (linear: number): number => {
  return 20 * Math.log10(linear);
};

export const dbToLinear = (db: number): number => {
  return Math.pow(10, db / 20);
};

// Pattern Utilities
export const parsePatternContent = (content: string): { lines: string[]; errors: string[] } => {
  const lines = content.split('\n').filter(line => line.trim());
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//')) {
      // Basic validation - can be expanded
      if (trimmed.includes('seq') && !trimmed.includes(':')) {
        errors.push(`Line ${index + 1}: Invalid sequence syntax`);
      }
    }
  });

  return { lines, errors };
};

export const generatePatternId = (): string => {
  return `pattern_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

export const sanitizePatternName = (name: string): string => {
  return name.replace(/[^a-zA-Z0-9\s-_]/g, '').trim();
};

// Storage Utilities
export const getFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

export const setToStorage = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn('Failed to remove from localStorage:', error);
  }
};

// URL Utilities
export const createShareableUrl = (patternId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/patterns/${patternId}`;
};

export const parseShareableUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    const patternIndex = pathParts.indexOf('patterns');
    if (patternIndex !== -1 && pathParts[patternIndex + 1]) {
      return pathParts[patternIndex + 1];
    }
    return null;
  } catch {
    return null;
  }
};

// Performance Utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Device Detection
export const isMobile = (): boolean => {
  return window.innerWidth < 768;
};

export const isTablet = (): boolean => {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
  return window.innerWidth >= 1024;
};

// Browser Detection
export const isChrome = (): boolean => {
  return /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor);
};

export const isFirefox = (): boolean => {
  return /Firefox/.test(navigator.userAgent);
};

export const isSafari = (): boolean => {
  return /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
};

export const isEdge = (): boolean => {
  return /Edg/.test(navigator.userAgent);
};

// Web Audio API Support
export const supportsWebAudio = (): boolean => {
  return !!(window.AudioContext || (window as any).webkitAudioContext);
};

export const supportsWebMIDI = (): boolean => {
  return !!(navigator as any).requestMIDIAccess;
};

// Environment Detection
export const isDevelopment = (): boolean => {
  return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};

// Random Utilities
export const randomId = (): string => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

export const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Color Utilities
export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
};
