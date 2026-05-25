/**
 * Performance monitoring with slow device detection
 */

interface LoadMetrics {
  component: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

const loadMetrics = new Map<string, LoadMetrics>();

type WebVitalMetric = {
  name: string;
  value: number;
};

export function measureLoadTime(component: string): void {
  loadMetrics.set(component, {
    component,
    startTime: performance.now(),
  });
}

export function endLoadMeasurement(component: string): number | null {
  const metric = loadMetrics.get(component);
  if (!metric) return null;

  const endTime = performance.now();
  const duration = endTime - metric.startTime;
  metric.endTime = endTime;
  metric.duration = duration;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[Performance] ${component} loaded in ${duration.toFixed(2)}ms`);
  }

  return duration;
}

/**
 * Detect slow device based on load timing.
 * If a measured component took > threshold ms, flag device as slow
 * so callers can reduce rendering complexity.
 *
 * @param component - Previously measured component name
 * @param thresholdMs - Threshold above which device is considered slow (default 3000ms)
 */
export function isSlowDevice(component: string, thresholdMs = 3000): boolean {
  const metric = loadMetrics.get(component);
  if (!metric?.duration) return false;
  return metric.duration > thresholdMs;
}

export function reportWebVitals(metric: WebVitalMetric): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Web Vitals] ${metric.name}:`, metric.value);
  }
}
