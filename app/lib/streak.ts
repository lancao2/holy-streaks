/**
 * Calculates a user's daily consecutive streak based on their RosaryLog list
 * and their local timezone.
 */
export function calculateStreak(
  logs: { createdAt: Date }[],
  timezone: string = "America/Sao_Paulo"
): { currentStreak: number; hasLoggedToday: boolean } {
  if (logs.length === 0) {
    return { currentStreak: 0, hasLoggedToday: false };
  }

  // Convert logs to unique local date strings (YYYY-MM-DD) sorted descending
  const dateStrings = Array.from(
    new Set(
      logs.map((log) => {
        try {
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: timezone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(log.createdAt));
        } catch (e) {
          // Fallback to default Brazil timezone if the passed timezone is invalid
          return new Intl.DateTimeFormat("en-CA", {
            timeZone: "America/Sao_Paulo",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date(log.createdAt));
        }
      })
    )
  ).sort((a, b) => b.localeCompare(a));

  if (dateStrings.length === 0) {
    return { currentStreak: 0, hasLoggedToday: false };
  }

  // Helper to format dates in target timezone
  const getFormattedDate = (date: Date) => {
    try {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    } catch (e) {
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Sao_Paulo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(date);
    }
  };

  const todayStr = getFormattedDate(new Date());

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getFormattedDate(yesterday);

  const latestDate = dateStrings[0];
  const hasLoggedToday = latestDate === todayStr;

  // If the latest log is neither today nor yesterday, the streak is broken (0)
  if (latestDate !== todayStr && latestDate !== yesterdayStr) {
    return { currentStreak: 0, hasLoggedToday };
  }

  let streak = 1;
  let currentDate = new Date(latestDate + "T00:00:00");

  for (let i = 1; i < dateStrings.length; i++) {
    const prevDate = new Date(dateStrings[i] + "T00:00:00");
    const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak++;
      currentDate = prevDate;
    } else if (diffDays > 1) {
      // Gap of 2+ days detected, streak stops here
      break;
    }
  }

  return { currentStreak: streak, hasLoggedToday };
}
