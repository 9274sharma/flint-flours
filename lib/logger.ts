/**
 * Simple structured logger - only logs in development or when explicitly enabled.
 * Avoids noisy console output in production.
 */

const isDev = process.env.NODE_ENV === "development";

function log(level: string, message: string, meta?: Record<string, unknown>) {
  if (!isDev && process.env.DEBUG_LOGGING !== "true") return;
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };
  const str = JSON.stringify(entry);
  if (level === "error") {
    console.error(str);
  } else if (level === "warn") {
    console.warn(str);
  } else {
    console.log(str);
  }
}

export const logger = {
  error: (message: string, meta?: Record<string, unknown>) =>
    log("error", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) =>
    log("warn", message, meta),
  info: (message: string, meta?: Record<string, unknown>) =>
    log("info", message, meta),
  debug: (message: string, meta?: Record<string, unknown>) =>
    log("debug", message, meta),
};
