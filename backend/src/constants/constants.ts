import { enIN } from "date-fns/locale";

/**
 * Global application constants
 */
export const APP_CONSTANTS = {
  /**
   * Date locale for Indian Standard Time (IST)
   */
  DATE_LOCALE: enIN,

  /**
   * IST timezone offset in minutes (UTC +5:30)
   */
  IST_OFFSET_MINUTES: 330,

  /**
   * Session transaction timeout in milliseconds
   */
  SESSION_TIMEOUT_MS: 10000,
} as const;
