// Shared alert sound library — used by the Pomodoro timer, the 5-minute Sprint
// and the Launchpad so all three offer the exact same set of sounds.
export const COMPLETION_SOUNDS = {
  joyful_melody: { name: "Joyful Melody", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/Joyful%20Melody.wav" },
  piano_melody: { name: "Piano Melody", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/Piano%20Melody.mp3" },
  short_notification: { name: "Short Notification", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/Short%20Notification.wav" },
  short_piano: { name: "Short Piano Notification", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/Short%20Piano%20Notification.mp3" },
  applause: { name: "Applause", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/Applause.wav" },
  jr_station: { name: "JR Station Notification", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/JR%20Station%20Notification.mp3" },
  jr_station_3: { name: "JR Station Notification 3", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/JR%20Station%20Notification%203.mp3" },
  jr_osaka_loop: { name: "JR Osaka Loop", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/JR%20Osaka%20Loop%204.mp3" },
  jr_morning_tranquility: { name: "JR Morning Tranquility", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/JR%20Morning%20Tranquility.mp3" },
  jr_flower_shop: { name: "JR Flower Shop", url: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/Notifications/JR%20Flower%20Shop.mp3" },
};

export const LAUNCH_SOUND_KEY = 'launch_alert_sound';

export function getLaunchAlertSound() {
  const key = localStorage.getItem(LAUNCH_SOUND_KEY);
  return COMPLETION_SOUNDS[key] ? key : 'joyful_melody';
}