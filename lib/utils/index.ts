/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);
}

/**
 * Format a timestamp for display
 */
export function formatTimestamp(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(d);
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(d);
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Generate a random position for a star in the sky
 * Based on region clustering (placeholder for real clustering)
 */
export function generateStarPosition(region?: string): { x: number; y: number } {
  // Simple hash function for consistent positioning per region
  const hash = region
    ? region.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    : Math.random() * 1000;

  // Create clusters with some randomness
  const clusterX = (hash * 0.618033988749895) % 1; // Golden ratio for distribution
  const clusterY = (hash * 0.314159265358979) % 1; // Pi-based distribution

  // Add random offset within cluster
  const offsetX = (Math.random() - 0.5) * 0.15;
  const offsetY = (Math.random() - 0.5) * 0.15;

  return {
    x: Math.max(0.05, Math.min(0.95, clusterX + offsetX)),
    y: Math.max(0.05, Math.min(0.95, clusterY + offsetY)),
  };
}

/**
 * Get color for mood
 */
export function getMoodColor(mood: string): string {
  switch (mood) {
    case 'happy':
      return '#f4d03f';
    case 'sad':
      return '#7eb4e2';
    case 'struggling':
      return '#9b59b6';
    case 'hopeful':
      return '#48c9b0';
    default:
      return '#ffffff';
  }
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
