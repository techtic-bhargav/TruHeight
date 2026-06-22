# iOS Push Notifications Setup Guide

This guide fixes the `no valid "aps-environment" entitlement` and `messaging/unregistered` errors for Firebase Cloud Messaging on iOS.

## Prerequisites

- **Apple Developer account** (paid $99/year) – Push Notifications require a paid account
- **Physical iPhone** – Push does NOT work on iOS Simulator
- **Development build** – Must use `expo run:ios` or `eas build`, NOT Expo Go

---

## Option A: Fix Local Build (expo run:ios)

### Step 1: Enable Push in Xcode

1. Open the project in Xcode:
   ```bash
   open ios/TruHeight.xcworkspace
   ```

2. Select the **TruHeight** target (left sidebar, under TARGETS)

3. Go to **Signing & Capabilities** tab

4. If "Push Notifications" is NOT listed:
   - Click **+ Capability**
   - Search for "Push Notifications"
   - Add it

5. Ensure **Team** is selected (your Apple Developer team)
   - If you see "Add an account", add your Apple ID

6. Ensure **Automatically manage signing** is checked

7. Xcode will sync with Apple Developer and update your App ID. If you get an error about capabilities:
   - Go to [developer.apple.com](https://developer.apple.com) → **Certificates, Identifiers & Profiles** → **Identifiers**
   - Select your App ID (`com.app.truheight`)
   - Enable **Push Notifications**
   - Save

### Step 2: Clean Build

```bash
cd ios && rm -rf build && cd ..
npx expo run:ios --device
```

Select your physical iPhone when prompted.

---

## Option B: Use EAS Build (Recommended)

EAS Build manages credentials automatically and correctly configures Push Notifications.

### Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

### Step 2: Login

```bash
eas login
```

### Step 3: Build for iOS

```bash
eas build --profile development -p ios
```

When prompted about Push Notifications credentials, choose to let EAS manage them. EAS will:
- Create the necessary App ID with Push Notifications
- Generate provisioning profiles
- Build with correct entitlements

### Step 4: Install on Device

After the build completes, scan the QR code or download the .ipa and install on your iPhone.

---

## Verify Setup

1. Run the app on a **physical device**
2. Grant notification permission when prompted
3. Check logs – you should see `✅ Firebase Messaging: FCM Token retrieved successfully!`
4. If you still see `aps-environment` error, the provisioning profile doesn't have Push – try Option B (EAS Build)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `no valid aps-environment` | Push Notifications not enabled on App ID or provisioning profile. Use Option A or B above. |
| `messaging/unregistered` | Happens when `registerDeviceForRemoteMessages` fails (usually due to aps-environment). Fix aps-environment first. |
| `deviceToken null` on simulator | Expected – use a physical device. |
| Capability can't be added in Xcode | Free Apple account limits – upgrade to paid Apple Developer Program. |
