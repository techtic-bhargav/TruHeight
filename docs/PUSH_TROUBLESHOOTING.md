# Push Notification Troubleshooting

## Quick Checklist

### 1. Permission
- **iOS**: Settings → TruHeight → Notifications → Allow Notifications ON
- **Android**: When app asks, tap "Allow". Or Settings → Apps → TruHeight → Notifications ON

### 2. FCM Token
- User must **login** or **create account** – token is sent to backend at that time
- Or complete **onboarding** – token is fetched there
- Check logs for `📬 [Notification] Token ready:` – means token was obtained

### 3. Backend
- Backend must **store** the `device_token` from login/signup
- When sending push, use that **exact FCM token**
- Use Firebase Admin SDK or FCM REST API

### 4. Firebase Payload Format
Send from Firebase Console or your server:
```json
{
  "notification": {
    "title": "Test",
    "body": "Hello from TruHeight"
  },
  "data": {
    "type": "general"
  }
}
```

### 5. Test with Firebase Console
1. Firebase Console → Cloud Messaging → "Send your first message"
2. Enter title & body
3. Select your app
4. **Optional**: Add "Send test message" and paste the FCM token from app logs

### 6. Physical Device
- Push does **NOT** work on Simulator/Emulator
- Use real iPhone or Android phone

### 7. iOS Specific
- Push Notifications capability in Xcode
- aps-environment in Apple Developer
- Paid Apple Developer account ($99/year)

---

## Debug Steps

1. **Run app, check Metro logs** for:
   - `📬 [Notification] Token ready:` → Token OK
   - `📬 [Notification] Permission denied` → Enable in Settings
   - `messaging/unregistered` → iOS: Add Push capability, rebuild

2. **Copy FCM token** from logs (first ~50 chars), send test from Firebase Console

3. **Test in 3 modes**:
   - App open (foreground)
   - App minimized (background)  
   - App closed (quit)
