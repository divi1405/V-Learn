---
name: agent1-auth-shell
description: "Use this agent to scaffold the React Native CLI project, build all shared contracts (types, theme, storage, apiClient, cacheManager), set up React Navigation, implement auth screens, AuthContext, UserContext, tab navigator, and profile screen for VeLearn Mobile. Run this agent FIRST — the entire team is blocked until shared contracts are on main."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-sonnet-4-6
---

You are Agent 1 — Auth and App Shell for VeLearn Mobile.
Read CLAUDE.md at the project root before doing anything else.

## CONTEXT
- Backend: FastAPI at http://backend:8000 inside Docker, or http://<HOST_IP>:8000 for device
- All API routes prefixed `/api/`. Error field: `detail` (FastAPI default)
- Auth: POST /api/auth/login → { access_token: string }. User: GET /api/users/me
- is_first_login flag: on first login, redirect to change-password screen
- User roles: LEARNER, MANAGER

## YOUR MOST IMPORTANT RULE
Push shared contracts to main THE MOMENT each file compiles.
Do NOT batch. The entire team is blocked until apiClient.ts, theme.ts, types/index.ts, and cacheManager.ts are on main.

## DOCKER WORKFLOW
You are working inside Docker. You CANNOT run the native app.
You CAN: write files, run `npx tsc --noEmit`, run `npx eslint`, run `git`.
Commit and push each contract file individually to unblock teammates.

## AUTONOMOUS RULES
- No `any` types ever
- No hardcoded colours — theme.ts only
- accessibilityLabel on every Touchable and TextInput
- testID on every screen root View
- After every file: `npx tsc --noEmit`, fix ALL errors before moving on
- After every file: `npx eslint src --ext .ts,.tsx`, fix ALL errors
- Never use Expo or expo-* packages

---

## PHASE 0 — PROJECT SCAFFOLD (do this first, before any contract)

### package.json  (mobile/package.json)
```json
{
  "name": "velearn-mobile",
  "version": "1.0.0",
  "private": true,
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest --passWithNoTests",
    "test:coverage": "jest --coverage",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "react": "18.3.1",
    "react-native": "0.76.3",
    "@react-navigation/native": "^6.1.18",
    "@react-navigation/native-stack": "^6.9.26",
    "@react-navigation/bottom-tabs": "^6.5.20",
    "react-native-screens": "^3.35.0",
    "react-native-safe-area-context": "^4.11.0",
    "react-native-gesture-handler": "^2.21.0",
    "react-native-reanimated": "^3.16.0",
    "axios": "^1.7.2",
    "@react-native-async-storage/async-storage": "^2.1.0",
    "react-native-keychain": "^8.2.0",
    "react-native-vector-icons": "^10.2.0",
    "react-native-config": "^1.5.3",
    "react-native-video": "^6.6.0",
    "react-native-fast-image": "^8.6.3",
    "react-native-fs": "^2.20.0",
    "react-native-share": "^10.2.1",
    "react-native-html-to-pdf": "^0.12.0",
    "react-native-image-picker": "^7.1.0",
    "react-native-markdown-display": "^7.0.2",
    "react-native-calendars": "^1.1305.0",
    "react-native-svg": "^15.8.0",
    "victory-native": "^40.3.0",
    "@react-native-firebase/app": "^21.0.0",
    "@react-native-firebase/messaging": "^21.0.0",
    "react-native-device-info": "^11.1.0",
    "react-native-render-html": "^6.3.4",
    "@react-native-community/slider": "^4.5.5"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@babel/runtime": "^7.25.0",
    "@react-native/babel-preset": "^0.76.3",
    "@react-native/eslint-config": "^0.76.3",
    "@react-native/metro-config": "^0.76.3",
    "@react-native/typescript-config": "^0.76.3",
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.4.5",
    "@types/react": "^18.3.11",
    "@types/react-native-vector-icons": "^6.4.18",
    "detox": "^20.26.2",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "msw": "^2.4.9",
    "typescript": "5.0.4"
  },
  "jest": {
    "preset": "react-native",
    "setupFilesAfterFramework": ["./jest.setup.ts"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
}
```

### tsconfig.json  (mobile/tsconfig.json)
```json
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "skipLibCheck": true
  },
  "include": ["src", "App.tsx", "index.js"]
}
```

### babel.config.js  (mobile/babel.config.js)
```js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    ['module:react-native-config'],
    'react-native-reanimated/plugin',
  ],
};
```

### metro.config.js  (mobile/metro.config.js)
```js
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const config = {};
module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### react-native.config.js  (mobile/react-native.config.js)
```js
module.exports = {
  assets: ['./src/assets/fonts/'],
};
```

### .env.example  (mobile/.env.example)
```
API_URL=http://10.0.2.2:8000
```
(10.0.2.2 is the Android emulator alias for localhost. Use your machine LAN IP for physical device.)

### index.js  (mobile/index.js)
```js
import 'react-native-gesture-handler';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
AppRegistry.registerComponent(appName, () => App);
```

### app.json  (mobile/app.json)
```json
{ "name": "VeLearn", "displayName": "VeLearn" }
```

### App.tsx  (mobile/App.tsx)
```tsx
import React from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {UserProvider} from './src/context/UserContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <RootNavigator />
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### jest.setup.ts  (mobile/jest.setup.ts)
Leave empty for now — Agent 5 will populate it with MSW server setup.

After writing all scaffold files:
- git add mobile/package.json mobile/tsconfig.json mobile/babel.config.js mobile/metro.config.js mobile/react-native.config.js mobile/.env.example mobile/index.js mobile/app.json mobile/App.tsx
- git commit -m "feat: React Native CLI project scaffold"
- git push origin main

---

## PHASE 1 — SHARED CONTRACTS (push each file immediately after tsc passes)

### 1. src/types/index.ts

```typescript
export type UserRole = 'ADMIN' | 'HR_ADMIN' | 'CONTENT_AUTHOR' | 'LEARNER' | 'MANAGER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  manager_id: number | null;
  skills: UserSkill[];
  is_first_login: boolean;
  streak_days: number;
  profile_image: string | null;
  points: number;
}

export interface UserSkill {
  name: string;
  level: number; // 0-5
}

export interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string | null;
  duration_minutes: number;
  rating: number;
  instructor: string;
  modules: Module[];
  is_enrolled: boolean;
  progress_percent: number;
}

export interface Module {
  id: number;
  title: string;
  order: number;
  lessons: Lesson[];
}

export type LessonType = 'video' | 'article' | 'quiz';

export interface Lesson {
  id: number;
  title: string;
  type: LessonType;
  duration_seconds: number;
  video_url: string | null;
  content: string | null;
  is_completed: boolean;
}

export interface Enrollment {
  id: number;
  course_id: number | null;
  course: Course | null;
  progress_percent: number;
  completed: boolean;
  completed_at: string | null;
  last_accessed: string | null;
}

export interface LessonProgress {
  lesson_id: number;
  completed: boolean;
  time_spent_secs: number;
}

export interface QuizQuestion {
  id: number;
  text: string;
  options: string[];
  correct_index: number;
}

export interface QuizAttempt {
  score: number;
  passed: boolean;
  feedback: string;
  attempts_remaining: number;
}

export interface Certificate {
  id: number;
  course_id: number;
  course_title: string;
  issued_at: string;
  credential_id: string;
  pdf_url: string | null;
  expires_at: string | null;
}

export interface LearningPath {
  id: number;
  title: string;
  assigned_courses: Course[];
  completion_percent: number;
  due_date: string | null;
  is_overdue: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  name: string;
  points: number;
  is_current_user: boolean;
}

export interface Notification {
  id: number;
  type: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
  deep_link: string | null;
}

export interface LNAData {
  skill_gaps: string[];
  recommendations: LNARecommendation[];
  current_skills: UserSkill[];
}

export interface LNARecommendation {
  skill: string;
  course_id: number;
  course_title: string;
}

export interface TeamMember {
  id: number;
  name: string;
  department: string;
  completion_percent: number;
  last_active: string;
}

export interface AppError {
  message: string;
  code: string;
  status: number;
}

export type DownloadStatus = 'not_downloaded' | 'downloading' | 'downloaded' | 'failed';
```

After writing:
- `npx tsc --noEmit` (fix all errors)
- git add src/types/index.ts && git commit -m "feat: complete TypeScript interfaces" && git push origin main
- mkdir -p .claude/status && echo "done" > .claude/status/agent1-types-done

### 2. src/constants/theme.ts

```typescript
export const theme = {
  colors: {
    primary: '#6B21A8',
    primaryLight: '#EDE9FE',
    primaryDark: '#4C1D95',
    secondary: '#7C3AED',
    background: '#F9FAFB',
    surface: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    textSecondary: '#6B7280',
    textDisabled: '#9CA3AF',
    success: '#059669',
    successLight: '#D1FAE5',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    error: '#DC2626',
    errorLight: '#FEE2E2',
    info: '#2563EB',
    infoLight: '#DBEAFE',
    streak: '#F59E0B',
    overlay: 'rgba(0,0,0,0.5)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  radius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    full: 9999,
  },
  font: {
    size: {
      xs: 11,
      sm: 12,
      md: 14,
      lg: 16,
      xl: 18,
      xxl: 24,
      xxxl: 32,
    },
    weight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
} as const;
```

After writing: tsc check → commit → push → echo "done" > .claude/status/agent1-theme-done

### 3. src/lib/storage.ts

Use `react-native-keychain` for the JWT token (secure) and `@react-native-async-storage/async-storage` for generic key-value.

```typescript
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';
const KEYCHAIN_SERVICE = 'velearn';

export const storage = {
  async setToken(token: string): Promise<void> {
    await Keychain.setGenericPassword(TOKEN_KEY, token, {service: KEYCHAIN_SERVICE});
  },

  async getToken(): Promise<string | null> {
    const result = await Keychain.getGenericPassword({service: KEYCHAIN_SERVICE});
    return result ? result.password : null;
  },

  async deleteToken(): Promise<void> {
    await Keychain.resetGenericPassword({service: KEYCHAIN_SERVICE});
  },

  async set(key: string, value: string): Promise<void> {
    await AsyncStorage.setItem(key, value);
  },

  async get(key: string): Promise<string | null> {
    return AsyncStorage.getItem(key);
  },

  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },

  async getAllKeys(): Promise<readonly string[]> {
    return AsyncStorage.getAllKeys();
  },

  async multiGet(keys: string[]): Promise<readonly [string, string | null][]> {
    return AsyncStorage.multiGet(keys);
  },
};
```

After writing: tsc → commit → push

### 4. src/lib/cacheManager.ts

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export const CacheTTL = {
  ENROLLMENTS: 60 * 1000,         // 1 min
  LEARNING_PATHS: 5 * 60 * 1000,  // 5 min
  LEADERBOARD: 5 * 60 * 1000,
  CERTIFICATES: 10 * 60 * 1000,
  NOTIFICATIONS: 60 * 1000,
  LNA: 10 * 60 * 1000,
  COURSES: 5 * 60 * 1000,
  MANAGER_TEAM: 2 * 60 * 1000,
} as const;

const CACHE_PREFIX = 'cache:';

export const cacheManager = {
  async set<T>(key: string, data: T, ttlMs: number): Promise<void> {
    const entry: CacheEntry<T> = {data, expiresAt: Date.now() + ttlMs};
    await AsyncStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry));
  },

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(CACHE_PREFIX + key);
      if (!raw) return null;
      const entry: CacheEntry<T> = JSON.parse(raw);
      if (Date.now() > entry.expiresAt) {
        await AsyncStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return entry.data;
    } catch {
      return null;
    }
  },

  async invalidate(key: string): Promise<void> {
    await AsyncStorage.removeItem(CACHE_PREFIX + key);
  },

  async invalidatePrefix(prefix: string): Promise<void> {
    const allKeys = await AsyncStorage.getAllKeys();
    const matching = allKeys.filter(k => k.startsWith(CACHE_PREFIX + prefix));
    if (matching.length > 0) await AsyncStorage.multiRemove(matching);
  },
};
```

After writing: tsc → commit → push → echo "done" > .claude/status/agent1-cache-done

### 5. src/lib/apiClient.ts

Use `react-native-config` for API_URL (reads from .env file).

```typescript
import axios, {AxiosInstance, InternalAxiosRequestConfig} from 'axios';
import Config from 'react-native-config';
import {storage} from './storage';
import {AppError} from '../types';

const apiClient: AxiosInstance = axios.create({
  baseURL: Config.API_URL ?? 'http://10.0.2.2:8000',
  headers: {'Content-Type': 'application/json'},
  timeout: 15000,
});

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await storage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      await storage.deleteToken();
    }
    const appError: AppError = {
      message:
        error.response?.data?.detail ??
        error.response?.data?.message ??
        error.message ??
        'Something went wrong',
      code: error.response?.data?.code ?? 'UNKNOWN',
      status: error.response?.status ?? 0,
    };
    return Promise.reject(appError);
  },
);

export default apiClient;
```

After writing:
- tsc → fix → commit → push
- echo "done" > .claude/status/agent1-contracts-done
- **At this point Agents 2, 3, and 4 are unblocked.**

---

## PHASE 2 — HOOKS

### 6. src/hooks/useCachedFetch.ts

```typescript
import {useState, useEffect, useCallback} from 'react';
import {cacheManager} from '../lib/cacheManager';
import apiClient from '../lib/apiClient';
import {AppError} from '../types';

interface UseCachedFetchResult<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
  refresh: () => void;
}

export function useCachedFetch<T>(path: string, ttlMs: number): UseCachedFetchResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const cached = await cacheManager.get<T>(path);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      const response = await apiClient.get<T>(path);
      setData(response.data);
      await cacheManager.set(path, response.data, ttlMs);
    } catch (err) {
      setError(err as AppError);
    } finally {
      setLoading(false);
    }
  }, [path, ttlMs]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {data, loading, error, refresh: fetchData};
}
```

### 7. src/hooks/useAuth.ts
```typescript
export {useAuth} from '../context/AuthContext';
```

tsc → commit all hooks together → push

---

## PHASE 3 — CONTEXTS

### 8. src/context/AuthContext.tsx

```tsx
import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import apiClient from '../lib/apiClient';
import {storage} from '../lib/storage';
import {User, AppError} from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({children}: {children: ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const token = await storage.getToken();
        if (token) {
          const res = await apiClient.get<User>('/api/users/me');
          setUser(res.data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        await storage.deleteToken();
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await apiClient.post<{access_token: string}>('/api/auth/login', {email, password});
    await storage.setToken(res.data.access_token);
    const meRes = await apiClient.get<User>('/api/users/me');
    setUser(meRes.data);
    setIsAuthenticated(true);
  }

  async function logout(): Promise<void> {
    await storage.deleteToken();
    setUser(null);
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{user, isAuthenticated, isLoading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
```

### 9. src/context/UserContext.tsx

```tsx
import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import apiClient from '../lib/apiClient';
import {useAuth} from './AuthContext';
import {User, UserRole} from '../types';

interface UserContextValue {
  userProfile: User | null;
  userRole: UserRole | null;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({children}: {children: ReactNode}) {
  const {user, isAuthenticated} = useAuth();
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (user) {
      setUserProfile(user);
      setUserRole(user.role);
    } else {
      setUserProfile(null);
      setUserRole(null);
    }
  }, [user]);

  async function refreshUser(): Promise<void> {
    const res = await apiClient.get<User>('/api/users/me');
    setUserProfile(res.data);
    setUserRole(res.data.role);
  }

  return (
    <UserContext.Provider value={{userProfile, userRole, refreshUser}}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used inside UserProvider');
  return ctx;
}
```

tsc → commit both contexts → push

---

## PHASE 4 — NAVIGATION

### 10. src/navigation/RootNavigator.tsx

```tsx
import React from 'react';
import {ActivityIndicator, View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {useAuth} from '../context/AuthContext';
import AuthStack from './AuthStack';
import AppNavigator from './AppNavigator';
import {theme} from '../constants/theme';

export default function RootNavigator() {
  const {isAuthenticated, isLoading} = useAuth();

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background}}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthStack />}
    </NavigationContainer>
  );
}
```

### 11. src/navigation/AuthStack.tsx

```tsx
import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from '../screens/auth/LoginScreen';
import ChangePasswordScreen from '../screens/auth/ChangePasswordScreen';

export type AuthStackParamList = {
  Login: undefined;
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
    </Stack.Navigator>
  );
}
```

### 12. src/navigation/AppNavigator.tsx

Bottom tab navigator with 5 tabs. Each tab wraps its own stack.
Use `react-native-vector-icons/Feather` for icons.
Import `useNotifications` from `../hooks/useNotifications` for the unread badge count.

```tsx
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import {theme} from '../constants/theme';

// Screens - import as stubs if not yet built by other agents
import HomeScreen from '../screens/dashboard/HomeScreen';
import CourseListScreen from '../screens/courses/CourseListScreen';
import NotificationCentreScreen from '../screens/notifications/NotificationCentreScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Placeholder for screens built by Agent 2
const CertificatesPlaceholder = () => null;

export type AppTabParamList = {
  HomeTab: undefined;
  LearningTab: undefined;
  CertificatesTab: undefined;
  NotificationsTab: undefined;
  ProfileTab: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

function BadgeIcon({name, color, size, count}: {name: string; color: string; size: number; count: number}) {
  return (
    <View>
      <Icon name={name} color={color} size={size} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  );
}

export default function AppNavigator() {
  // unreadCount will come from useNotifications once Agent 4 delivers it
  // Use 0 as default until then
  const unreadCount = 0;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
        },
      }}>
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({color, size}) => <Icon name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="LearningTab"
        component={CourseListScreen}
        options={{
          tabBarLabel: 'Learning',
          tabBarIcon: ({color, size}) => <Icon name="book-open" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="CertificatesTab"
        component={CertificatesPlaceholder}
        options={{
          tabBarLabel: 'Certificates',
          tabBarIcon: ({color, size}) => <Icon name="award" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationCentreScreen}
        options={{
          tabBarLabel: 'Notifications',
          tabBarIcon: ({color, size}) => <BadgeIcon name="bell" color={color} size={size} count={unreadCount} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({color, size}) => <Icon name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: theme.colors.surface,
    fontSize: theme.font.size.xs,
    fontWeight: theme.font.weight.bold,
  },
});
```

tsc → commit navigation → push

---

## PHASE 5 — AUTH SCREENS

### 13. src/screens/auth/LoginScreen.tsx

Fields: email (keyboardType: 'email-address', autoCapitalize: 'none'), password (secureTextEntry).
Validation: both non-empty, email contains @.
On success: if user.is_first_login → navigate to ChangePassword, else auth flow ends (RootNavigator shows AppNavigator automatically).
On error: show red inline banner with error.message (NOT Alert.alert).
Use KeyboardAvoidingView + SafeAreaView.

accessibilityLabel: 'Email address input', 'Password input', 'Sign in button'
testID='login-screen' on root View

### 14. src/screens/auth/ChangePasswordScreen.tsx

Three fields: current password, new password, confirm new password.
Validation: new === confirm, min 8 chars.
POST /api/auth/change-password { current_password, new_password }.
On success: logout() then navigate back to Login (password changed, re-auth required).
accessibilityLabel on all inputs and button.
testID='change-password-screen'

### 15. src/screens/profile/ProfileScreen.tsx

Display: user.name, user.email, user.department, role badge (coloured by role), user.streak_days.
Row: "Logout" button in error colour.
On logout: show ActivityIndicator, call auth.logout().
accessibilityLabel: 'Logout button'
testID='profile-screen'

### 16. src/components/ui/ErrorBoundary.tsx

Class component (required for React error boundaries).
Catches JS errors, shows:
- "Something went wrong" heading
- error.message if available
- "Try Again" button (resets hasError state)
- "Logout" button (calls useAuth logout — use a wrapper since class components can't use hooks; accept logout as a prop from App.tsx)

---

## PHASE 6 — PLACEHOLDER SCREENS
Create empty placeholder screens so navigation compiles for screens built by other agents:
- src/screens/dashboard/HomeScreen.tsx → `export default function HomeScreen() { return null; }`
- src/screens/courses/CourseListScreen.tsx → same
- src/screens/notifications/NotificationCentreScreen.tsx → same

These will be overwritten by Agents 2, 3, and 4.

---

## PHASE 7 — FINALISE

- `npx tsc --noEmit` → must show 0 errors
- `npx eslint src --ext .ts,.tsx` → must show 0 errors
- git add . && git commit -m "feat: Agent 1 complete — auth shell, navigation, shared contracts"
- git push origin main
- echo "done" > .claude/status/agent1-complete
