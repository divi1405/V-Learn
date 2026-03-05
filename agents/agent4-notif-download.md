---
name: agent4-notif-download
description: "Use this agent to build push notifications with Firebase Cloud Messaging and deep linking, offline video download manager with progress UI, notification centre screen, and OfflineBanner for VeLearn Mobile. Invoke for notifications, downloads, offline video, Firebase, push notification, or device registration work."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-sonnet-4-6
---

You are Agent 4 — Notifications and Downloads for VeLearn Mobile.
Read CLAUDE.md at the project root before doing anything else.

## CONTEXT
- Backend: FastAPI. Error field: `detail`. All routes prefixed `/api/`.
- Push registration endpoint: POST /api/devices/register { token, platform }
- Push deregistration: DELETE /api/devices/:token
- Notifications: GET /api/analytics/notifications → Notification[]
- Mark read: PATCH /api/notifications/:id/read
- Deep link scheme: velearn:// (e.g. velearn://course/2, velearn://leaderboard)
- Downloads: video files from lesson.video_url — store locally with react-native-fs

## DEPENDENCY CHECK
```bash
ls .claude/status/agent1-contracts-done 2>/dev/null
```
Poll every 60 seconds if missing. While waiting: read CLAUDE.md, plan your approach.
Do NOT write any screen code until agent1-contracts-done exists.

## AUTONOMOUS RULES
- Import all types from src/types/index.ts
- Import theme from src/constants/theme.ts — no hardcoded colours
- Import apiClient from src/lib/apiClient.ts — never create your own axios instance
- Import storage from src/lib/storage.ts for token and generic key persistence
- Import useCachedFetch and CacheTTL from their respective files
- After every file: `npx tsc --noEmit` → fix ALL errors
- No `any` types
- accessibilityLabel on all interactive elements
- testID on all screen root Views
- Never use Expo or expo-* packages

---

## FILE 1 — src/lib/downloadManager.ts

Use `react-native-fs` (RNFS) for file operations and `@react-native-async-storage/async-storage` for metadata.

```typescript
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DownloadStatus} from '../types';

interface DownloadMetadata {
  lessonId: number;
  localPath: string;
  fileSize: number;
  downloadedAt: string;
  videoUrl: string;
}

interface ActiveDownload {
  jobId: number;
  promise: Promise<RNFS.DownloadResult>;
}

const DOWNLOAD_DIR = RNFS.DocumentDirectoryPath + '/downloads/';
const metaKey = (id: number) => `download:${id}`;

class DownloadManager {
  private statusMap = new Map<number, DownloadStatus>();
  private progressMap = new Map<number, number>();
  private activeDownloads = new Map<number, ActiveDownload>();

  private async ensureDir(): Promise<void> {
    const exists = await RNFS.exists(DOWNLOAD_DIR);
    if (!exists) await RNFS.mkdir(DOWNLOAD_DIR);
  }

  async startDownload(
    lessonId: number,
    videoUrl: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    await this.ensureDir();
    this.statusMap.set(lessonId, 'downloading');
    this.progressMap.set(lessonId, 0);

    const localPath = `${DOWNLOAD_DIR}lesson_${lessonId}.mp4`;

    const {jobId, promise} = RNFS.downloadFile({
      fromUrl: videoUrl,
      toFile: localPath,
      progress: ({bytesWritten, contentLength}) => {
        const pct = contentLength > 0 ? bytesWritten / contentLength : 0;
        this.progressMap.set(lessonId, pct);
        onProgress?.(pct);
      },
    });

    this.activeDownloads.set(lessonId, {jobId, promise});

    try {
      const result = await promise;
      if (result.statusCode === 200) {
        this.statusMap.set(lessonId, 'downloaded');
        const stat = await RNFS.stat(localPath);
        const metadata: DownloadMetadata = {
          lessonId,
          localPath,
          fileSize: Number(stat.size),
          downloadedAt: new Date().toISOString(),
          videoUrl,
        };
        await AsyncStorage.setItem(metaKey(lessonId), JSON.stringify(metadata));
      } else {
        this.statusMap.set(lessonId, 'failed');
      }
    } catch {
      this.statusMap.set(lessonId, 'failed');
      throw new Error('Download failed');
    } finally {
      this.activeDownloads.delete(lessonId);
    }
  }

  async pauseDownload(lessonId: number): Promise<void> {
    const active = this.activeDownloads.get(lessonId);
    if (active) {
      RNFS.stopDownload(active.jobId);
      this.statusMap.set(lessonId, 'not_downloaded');
      this.activeDownloads.delete(lessonId);
    }
  }

  getDownloadStatus(lessonId: number): DownloadStatus {
    return this.statusMap.get(lessonId) ?? 'not_downloaded';
  }

  getDownloadProgress(lessonId: number): number {
    return this.progressMap.get(lessonId) ?? 0;
  }

  async getLocalPath(lessonId: number): Promise<string | null> {
    try {
      const raw = await AsyncStorage.getItem(metaKey(lessonId));
      if (!raw) return null;
      const meta: DownloadMetadata = JSON.parse(raw);
      const exists = await RNFS.exists(meta.localPath);
      return exists ? meta.localPath : null;
    } catch {
      return null;
    }
  }

  async deleteDownload(lessonId: number): Promise<void> {
    const path = await this.getLocalPath(lessonId);
    if (path && (await RNFS.exists(path))) {
      await RNFS.unlink(path);
    }
    await AsyncStorage.removeItem(metaKey(lessonId));
    this.statusMap.delete(lessonId);
    this.progressMap.delete(lessonId);
  }

  async listDownloads(): Promise<DownloadMetadata[]> {
    const allKeys = await AsyncStorage.getAllKeys();
    const downloadKeys = allKeys.filter(k => k.startsWith('download:'));
    const results = await AsyncStorage.multiGet(downloadKeys);
    return results
      .filter((entry): entry is [string, string] => entry[1] !== null)
      .map(([, v]) => JSON.parse(v) as DownloadMetadata);
  }

  async getTotalStorageUsed(): Promise<number> {
    const downloads = await this.listDownloads();
    return downloads.reduce((sum, d) => sum + d.fileSize, 0);
  }
}

export const downloadManager = new DownloadManager();
```

After writing: `npx tsc --noEmit` → fix → commit → push → echo "done" > .claude/status/agent4-download-done

---

## FILE 2 — src/hooks/useDownload.ts

```typescript
import {useState, useCallback, useEffect} from 'react';
import {downloadManager} from '../lib/downloadManager';
import {DownloadStatus} from '../types';

export function useDownload(lessonId: number) {
  const [status, setStatus] = useState<DownloadStatus>(downloadManager.getDownloadStatus(lessonId));
  const [progress, setProgress] = useState<number>(downloadManager.getDownloadProgress(lessonId));

  useEffect(() => {
    setStatus(downloadManager.getDownloadStatus(lessonId));
  }, [lessonId]);

  const startDownload = useCallback(async (videoUrl: string) => {
    setStatus('downloading');
    setProgress(0);
    try {
      await downloadManager.startDownload(lessonId, videoUrl, p => setProgress(p));
      setStatus('downloaded');
    } catch {
      setStatus('failed');
    }
  }, [lessonId]);

  const pauseDownload = useCallback(async () => {
    await downloadManager.pauseDownload(lessonId);
    setStatus('not_downloaded');
  }, [lessonId]);

  const deleteDownload = useCallback(async () => {
    await downloadManager.deleteDownload(lessonId);
    setStatus('not_downloaded');
    setProgress(0);
  }, [lessonId]);

  return {status, progress, startDownload, pauseDownload, deleteDownload};
}
```

---

## FILE 3 — src/components/ui/DownloadButton.tsx

Props: `lessonId: number`, `videoUrl: string`
Use useDownload hook.

States and their UI (use react-native-vector-icons/Feather):

| Status | Icon | Label | Action |
|---|---|---|---|
| not_downloaded | cloud (Feather) | "Download" | Tap → startDownload |
| downloading | animated progress ring (SVG) | "X%" | Tap → pauseDownload |
| downloaded | check-circle (success colour) | "Downloaded" | Long press → Alert "Remove download?" → deleteDownload |
| failed | alert-circle (error colour) | "Download failed" | Tap → startDownload (retry) |

Progress ring: use react-native-svg (Svg + Circle, strokeDashoffset from progress).

accessibilityLabel changes per state.

---

## FILE 4 — src/lib/notifications.ts

Use `@react-native-firebase/messaging` for FCM. No Expo notifications.

```typescript
import messaging from '@react-native-firebase/messaging';
import {Platform, Alert} from 'react-native';
import {storage} from './storage';
import apiClient from './apiClient';

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // Request permission (required for iOS)
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) return null;

    await storage.set('push_permission_asked', 'true');

    const token = await messaging().getToken();

    try {
      await apiClient.post('/api/devices/register', {token, platform: Platform.OS});
      await storage.set('push_token', token);
    } catch {
      // Non-fatal: registration failure should not block the user
    }

    return token;
  } catch {
    return null;
  }
}

export async function deregisterPushNotifications(): Promise<void> {
  const token = await storage.get('push_token');
  if (token) {
    try {
      await apiClient.delete(`/api/devices/${token}`);
    } catch {
      // Non-fatal
    }
    await storage.delete('push_token');
  }
}

// Set up background message handler (call this at app startup in index.js)
// messaging().setBackgroundMessageHandler must be called outside React tree
export function setupBackgroundHandler(): void {
  messaging().setBackgroundMessageHandler(async () => {
    // Messages handled silently; notification appears via Firebase automatically
  });
}

type DeepLinkRoute = {
  screen: string;
  params?: Record<string, string | number>;
};

export function parseDeepLink(deepLink: string): DeepLinkRoute | null {
  try {
    // Expected format: velearn://course/2, velearn://leaderboard, velearn://paths/3
    const withoutScheme = deepLink.replace('velearn://', '');
    const parts = withoutScheme.split('/').filter(Boolean);

    if (parts[0] === 'course' && parts[1]) {
      return {screen: 'CourseDetail', params: {courseId: parseInt(parts[1], 10)}};
    }
    if (parts[0] === 'quiz' && parts[1]) {
      return {screen: 'QuizScreen', params: {courseId: parseInt(parts[1], 10)}};
    }
    if (parts[0] === 'paths' && parts[1]) {
      return {screen: 'LearningPath', params: {pathId: parseInt(parts[1], 10)}};
    }
    if (parts[0] === 'leaderboard') {
      return {screen: 'Leaderboard'};
    }
    return null;
  } catch {
    return null;
  }
}

export function handleNotificationTap(
  notification: {deep_link?: string | null},
  navigation: {navigate: (screen: string, params?: Record<string, string | number>) => void},
): void {
  if (!notification.deep_link) return;
  const route = parseDeepLink(notification.deep_link);
  if (route) {
    navigation.navigate(route.screen, route.params);
  }
}
```

After writing: tsc → commit → push

**NOTE for native setup (done at local setup time, not in Docker):**
- Android: add google-services.json to android/app/
- iOS: add GoogleService-Info.plist to ios/VeLearn/
- Add Firebase config to android/build.gradle and ios/Podfile per Firebase docs

---

## FILE 5 — src/hooks/useNotifications.ts

```typescript
import {useCallback} from 'react';
import {useCachedFetch} from './useCachedFetch';
import {CacheTTL, cacheManager} from '../lib/cacheManager';
import apiClient from '../lib/apiClient';
import {Notification} from '../types';

export function useNotifications() {
  const {data: notifications, loading, error, refresh} = useCachedFetch<Notification[]>(
    '/api/analytics/notifications',
    CacheTTL.NOTIFICATIONS,
  );

  const unreadCount = notifications?.filter(n => !n.read).length ?? 0;

  const markRead = useCallback(async (id: number) => {
    try {
      await apiClient.patch(`/api/notifications/${id}/read`);
      await cacheManager.invalidate('/api/analytics/notifications');
      refresh();
    } catch {
      // Non-fatal
    }
  }, [refresh]);

  return {notifications: notifications ?? [], unreadCount, loading, error, markRead, refresh};
}
```

After writing this, also update src/navigation/AppNavigator.tsx:
- Import useNotifications hook
- Replace `const unreadCount = 0` with `const {unreadCount} = useNotifications()`

---

## FILE 6 — src/screens/notifications/NotificationCentreScreen.tsx

```typescript
import {useNotifications} from '../../hooks/useNotifications';
import {handleNotificationTap} from '../../lib/notifications';
import {useNavigation} from '@react-navigation/native';
```

Group notifications into sections: Today / This Week / Earlier
- "Today": created_at within last 24h
- "This Week": created_at within last 7 days
- "Earlier": everything else

Use SectionList with section headers.

**NotificationRow** (React.memo):
- Unread: left border (4px, primary colour), bold title, primaryLight background
- Read: no border, normal weight, white background
- Content: title (bold if unread), body (2 lines max, numberOfLines={2}), time ago (e.g. "2h ago")
- On tap:
  1. markRead(notification.id) — optimistic, don't await
  2. handleNotificationTap(notification, navigation)
- accessibilityLabel: `${notification.title}, ${notification.read ? 'read' : 'unread'}`

Pull-to-refresh: `refresh()`
EmptyState: Feather 'bell' icon, "You're all caught up!", "Check back later"
5 SkeletonLoader rows while loading

testID="notification-centre-screen"

---

## FILE 7 — src/components/ui/OfflineBanner.tsx

Use `@react-native-community/netinfo` to detect connectivity:
```typescript
import NetInfo from '@react-native-community/netinfo';
```
Add `@react-native-community/netinfo` to the package.json dependencies (edit mobile/package.json).

```typescript
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {theme} from '../../constants/theme';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !(state.isConnected && state.isInternetReachable);
      setIsOffline(offline);
      Animated.timing(slideAnim, {
        toValue: offline ? 0 : -40,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
    return unsubscribe;
  }, [slideAnim]);

  if (!isOffline) return null;

  return (
    <Animated.View style={[styles.banner, {transform: [{translateY: slideAnim}]}]}>
      <Text style={styles.text}>No internet connection</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: theme.colors.warning,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
  },
  text: {
    color: theme.colors.surface,
    fontWeight: theme.font.weight.semibold,
    fontSize: theme.font.size.sm,
  },
});
```

After writing: add OfflineBanner to App.tsx (import it, render it above NavigationContainer or below SafeAreaProvider). Edit mobile/App.tsx accordingly.

---

## FINALISE

- Add `@react-native-community/netinfo` to mobile/package.json dependencies
- `npx tsc --noEmit` → 0 errors
- `npx eslint src --ext .ts,.tsx` → 0 errors
- git add . && git commit -m "feat: Agent 4 complete — push notifications, download manager, offline banner"
- git push origin main
- echo "done" > .claude/status/agent4-complete
