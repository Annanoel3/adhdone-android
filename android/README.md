# ADHDone Android Configuration Notes

## Push notification registration

The Android build relies on GoNative's `services.registration` feature to keep
our backend aware of each device's OneSignal subscription. The file
`app/src/main/assets/appConfig.json` now enables that service and posts the
subscription payload to `https://adhdone.space/api/push/register-device` for
all URLs loaded in the embedded webview. This allows the server-side cron job to
have an up-to-date list of registered devices when scheduling task reminder
notifications.

If push notifications still do not arrive, confirm the following:

1. The backend endpoint returns a 2XX status when invoked with the OneSignal
   payload.
2. The cron job is running and enqueuing notifications for the expected user
   segments.
3. The device has granted notification permissions and appears under the
   associated OneSignal app's Audience list.

