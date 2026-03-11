export type ReminderJobData = {
  eventId: string;
  userId: string;
  calendarId: string;
  title: string;
  fireAt: string; // ISO 8601
};

export type MaintenanceJobData = {
  task: "CLEAN_AUDIT" | "CLEAN_EXPIRED_INVITES" | "CLEAN_STALE_TOKENS";
};
