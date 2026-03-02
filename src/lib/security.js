// Security utilities for Marky

/**
 * Safe JSON parsing with error handling
 */
export function safeJSONParse(str, defaultValue = null) {
  try {
    if (!str || typeof str !== 'string') return defaultValue;
    return JSON.parse(str);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return defaultValue;
  }
}

/**
 * Safe JSON stringifying
 */
export function safeJSONStringify(obj, defaultValue = '{}') {
  try {
    if (obj === null || obj === undefined) return defaultValue;
    return JSON.stringify(obj);
  } catch (error) {
    console.warn('Failed to stringify JSON:', error.message);
    return defaultValue;
  }
}

/**
 * Basic encryption for localStorage (obfuscation)
 * Note: This is not true encryption, just basic obfuscation
 */
export function obfuscateData(data) {
  try {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    return btoa(str);
  } catch (error) {
    console.warn('Failed to obfuscate data:', error.message);
    return data;
  }
}

/**
 * Basic deobfuscation for localStorage
 */
export function deobfuscateData(data) {
  try {
    if (typeof data !== 'string') return data;
    const str = atob(data);
    return JSON.parse(str);
  } catch (error) {
    console.warn('Failed to deobfuscate data:', error.message);
    return data;
  }
}

/**
 * Validate filename for security
 */
export function validateFilename(filename) {
  if (!filename || typeof filename !== 'string') {
    return false;
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /\.\./,  // Directory traversal
    /[<>:"|?*]/,  // Invalid filename characters
    /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i,  // Windows reserved names
    /^\./,  // Hidden files starting with dot
  ];
  
  return !dangerousPatterns.some(pattern => pattern.test(filename));
}

/**
 * Sanitize user input for display
 */
export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  return input
    .replace(/[\x00-\x1F\x7F]/g, '')  // Control characters
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')  // Script tags
    .trim();
}

/**
 * Safe localStorage operations
 */
export const safeStorage = {
  get(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      return deobfuscateData(item);
    } catch (error) {
      console.warn('Failed to read from localStorage:', error.message);
      return defaultValue;
    }
  },
  
  set(key, value) {
    try {
      const obfuscated = obfuscateData(value);
      localStorage.setItem(key, obfuscated);
      return true;
    } catch (error) {
      console.warn('Failed to write to localStorage:', error.message);
      return false;
    }
  },
  
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn('Failed to remove from localStorage:', error.message);
      return false;
    }
  },
  
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('Failed to clear localStorage:', error.message);
      return false;
    }
  }
};
