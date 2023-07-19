/**
 * @returns {number}
 */
export const epochWeekAgo = () => Date.now() - (7 * 24 * 3600 * 1000);

/**
 * @returns {number}
 */
export const epochMonthAgo = () => Date.now() - (30 * 24 * 3600 * 1000);
