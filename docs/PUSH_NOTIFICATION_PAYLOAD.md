# Push Notification Payload - All 3 Modes

For notifications to work in **Foreground**, **Background**, and **Quit** modes, use this payload format when sending from Firebase Console or your backend.

## Required format (recommended)

```json
{
  "notification": {
    "title": "Your notification title",
    "body": "Your notification message"
  },
  "data": {
    "type": "general",
    "screen": "routine"
  }
}
```

- **`notification`** – Required for display in **Background** and **Quit** modes. The system shows it when the app is not in the foreground.
- **`data`** – Custom payload for routing (e.g. `type`, `screen`). Used when the user taps the notification.

## Data types for routing

| `data.type`  | Routes to                 |
|--------------|---------------------------|
| `message`    | `/notification`           |
| `routine`    | `/(tabs)/routine` or home |
| `subscription` | `/managesubscription`   |
| `general`    | `/notification`           |

## Data-only messages (background/quit)

For data-only messages (no `notification` block) in background/quit state:

- **Android**: Set `"priority": "high"` in FCM options.
- **iOS**: Set `contentAvailable: true` and APNs headers.

Example with firebase-admin (Node.js):

```js
await admin.messaging().send({
  token: fcmToken,
  data: { type: "general", title: "Hi", body: "Message" },
  apns: {
    payload: { aps: { contentAvailable: true } },
  },
  android: {
    priority: "high",
  },
});
```

**Note**: Including the `notification` block is more reliable for background and quit modes.
