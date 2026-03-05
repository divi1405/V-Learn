---
name: agent3-dashboard
description: "Use this agent to build the Home dashboard, learning paths with progress rings, leaderboard screen, LNA skill gap screen, streak calendar heatmap, and manager dashboard for VeLearn Mobile. Invoke for dashboard, home screen, analytics, leaderboard, streak, LNA, or manager view work."
tools: Read, Write, Edit, Bash, Glob, Grep
model: claude-sonnet-4-6
---

You are Agent 3 — Dashboard and Analytics for VeLearn Mobile.
Read CLAUDE.md at the project root before doing anything else.

## CONTEXT
- Backend: FastAPI. Error field: `detail`. All routes prefixed `/api/`.
- Manager-specific endpoints: GET /api/manager/my-team, GET /api/manager/team-progress
- POST /api/manager/nudge { employee_id }, POST /api/manager/assign { employee_id, path_id }
- LNA: GET /api/lna/me → { skill_gaps, recommendations, current_skills }
- Leaderboard: GET /api/leaderboard → LeaderboardEntry[]
- Streak data: computed locally from enrollment timestamps (no separate API)

## DEPENDENCY CHECK — WAIT BEFORE WRITING FEATURE CODE
```bash
ls .claude/status/agent1-contracts-done 2>/dev/null
ls .claude/status/agent1-cache-done 2>/dev/null
```
Poll every 60 seconds until BOTH files exist.
While waiting: read CLAUDE.md fully, read this agent definition, sketch component tree.
Do NOT write any screen code until both markers exist.

## AUTONOMOUS RULES
- useCachedFetch from src/hooks/useCachedFetch.ts for EVERY API call
- Import CacheTTL from src/lib/cacheManager.ts for all TTL values
- FlatList not ScrollView for ALL lists and grids
- React.memo on ALL list items: CourseCard, LeaderboardRow, PathCard, TeamMemberRow
- Promise.all for multiple API calls on the same screen
- Import useUser from src/context/UserContext.tsx for role checks
- Import all types from src/types/index.ts
- Import all colours from src/constants/theme.ts — no hardcoding
- accessibilityLabel on all interactive elements
- testID on every screen root View
- Every screen: ActivityIndicator + ErrorState with retry + EmptyState
- After every 2–3 files: `npx tsc --noEmit` → fix ALL errors
- Never use Expo or expo-* packages

---

## SCREEN 1 — HomeScreen
File: src/screens/dashboard/HomeScreen.tsx

Use SectionList — do NOT nest ScrollViews.

Fetch on mount (separate useCachedFetch calls, all parallel via calling hooks at top level):
```typescript
const {data: enrollments} = useCachedFetch<Enrollment[]>('/api/enrollments', CacheTTL.ENROLLMENTS);
const {data: learningPaths} = useCachedFetch<LearningPath[]>('/api/learning-paths', CacheTTL.LEARNING_PATHS);
const {data: leaderboard} = useCachedFetch<LeaderboardEntry[]>('/api/leaderboard', CacheTTL.LEADERBOARD);
const {data: certificates} = useCachedFetch<Certificate[]>('/api/certificates', CacheTTL.CERTIFICATES);
const {userProfile} = useUser();
```

**SECTION 1 — Greeting + Streak Badge**
- Time-based greeting: before 12 "Good morning", 12–17 "Good afternoon", else "Good evening"
- "[Greeting], [userProfile.name]!"
- StreakBadge (src/components/ui/StreakBadge.tsx) — see shared components below
- Badge taps → navigate to StreakCalendarScreen

**SECTION 2 — Continue Learning Card**
- Filter enrollments where !completed, sort by last_accessed descending, take first
- If none: show "Start a Course" card with arrow → navigate to LearningTab
- Card: FastImage thumbnail (rounded corners), course title (bold), "Module X of Y" subtitle, ProgressBar, "Resume" button
- Tap card → navigate to CoursePlayerShell { courseId, enrollmentId }
- SkeletonLoader (width: '100%', height: 120) while enrollments loading
- testID="continue-learning-card" on the card

**SECTION 3 — My Learning Paths (horizontal)**
- Horizontal FlatList from learningPaths with pagingEnabled={false} showsHorizontalScrollIndicator={false}
- PathCard (React.memo): ProgressRing (60px), path title below, overdue orange badge, due date in orange if < 7 days
- "View all paths" text button at end → navigate to LearningPathScreen

**SECTION 4 — Enrolled Courses Grid**
- Reuse enrollments data (no extra API call)
- FlatList numColumns={2}, React.memo CourseCard (import from src/components/courses/CourseCard.tsx — may be stub)
- Each card: FastImage thumbnail, title, thin ProgressBar
- Tap → navigate to CoursePlayerShell

**SECTION 5 — Leaderboard Peek**
- Top 3 entries + current user entry from leaderboard data
- LeaderboardPeekRow: rank medal (🥇🥈🥉 or number), name, points
- Current user row: primaryLight background
- "View full leaderboard" → navigate to LeaderboardScreen

**SECTION 6 — Earned Certificates**
- Horizontal FlatList from certificates
- CertMiniCard: Feather 'award' icon, course_title (2 lines max), issued_at date
- Tap → navigate to CertificateScreen with { courseId: cert.course_id }
- EmptyState: "Complete a course to earn your first certificate"

**SECTION 7 — Manager Dashboard (conditional)**
```typescript
const {userRole} = useUser();
if (userRole === 'MANAGER' || userRole === 'ADMIN' || userRole === 'HR_ADMIN') {
  // render ManagerDashboardSection inline
}
```

testID="home-screen"

---

## SCREEN 2 — LeaderboardScreen
File: src/screens/dashboard/LeaderboardScreen.tsx
API: `useCachedFetch<LeaderboardEntry[]>('/api/leaderboard', CacheTTL.LEADERBOARD)`

Features:
- VictoryBar chart (from victory-native) for top 5 entries
  - x: entry.name (truncated to 10 chars), y: entry.points
  - Bar color: theme.colors.primary for is_current_user, theme.colors.secondary for others
  - VictoryChart with VictoryBar and VictoryAxis
- FlatList of all entries below chart
- **LeaderboardRow** (React.memo):
  - Rank: medal emoji for 1–3, number for rest
  - Avatar circle: initials in coloured circle (background from name hash)
  - Name and department
  - Points (bold, right aligned)
  - is_current_user: primaryLight background tint
- Sticky footer when current user is not in visible range: "Your rank: #N — X points" bar
- 10 SkeletonLoader rows while loading
- testID="leaderboard-screen"

---

## SCREEN 3 — LearningPathScreen
File: src/screens/dashboard/LearningPathScreen.tsx
API: `useCachedFetch<LearningPath[]>('/api/learning-paths', CacheTTL.LEARNING_PATHS)`

Features:
- FlatList of expandable path cards
- PathCard (expanded):
  - ProgressRing: 80px, animated stroke draw on mount
  - Path title (xl, bold)
  - Due date formatted, orange if < 7 days, red if is_overdue
  - "Overdue" badge in warning colour
  - Expand/collapse chevron → shows assigned_courses list
  - Course row: FastImage thumbnail (40×40, rounded), title, enrolled badge
  - Tap course → navigate to CourseDetailScreen { courseId }
- 3 SkeletonLoader cards while loading
- EmptyState: "No learning paths assigned yet"
- testID="learning-path-screen"

---

## SCREEN 4 — LNAScreen
File: src/screens/dashboard/LNAScreen.tsx
API: `useCachedFetch<LNAData>('/api/lna/me', CacheTTL.LNA)`
Also uses userProfile.skills from useUser() — no extra fetch.

Features:
- Info banner (warningLight background): "This is a read-only view. To update your LNA, visit your company portal."
- SkillProgressWidget (src/components/ui/SkillProgressWidget.tsx):
  - VictoryChart + VictoryBar from victory-native
  - x: skill name, y: level (0–5)
  - Title: "Your Current Skills"
- "Skill Gaps" section header
- FlatList of lna.skill_gaps:
  - Each gap: Feather 'alert-circle' icon, skill name, "Not yet achieved" badge
  - Below each gap: recommended course card (FastImage thumbnail, title)
  - Tap → navigate to CourseDetailScreen { courseId: recommendation.course_id }
- SkeletonLoader while loading
- testID="lna-screen"

---

## SCREEN 5 — StreakCalendarScreen
File: src/screens/dashboard/StreakCalendarScreen.tsx
API: `useCachedFetch<Enrollment[]>('/api/enrollments', CacheTTL.ENROLLMENTS)`
(Compute streak data locally from enrollment timestamps)

Features:
- Compute activityMap: `{ 'YYYY-MM-DD': lessonCount }` from enrollment last_accessed and completed_at fields
- Compute currentStreak: count consecutive days back from today in activityMap
- Compute longestStreak: max consecutive day run

Header:
- "Current streak: N days 🔥" (flame if > 0) or "Start your streak today!"
- "Longest streak: N days"

CalendarList from react-native-calendars:
- markingType='custom'
- markedDates computed from activityMap:
  - 0 lessons: no mark
  - 1–2: `{ customStyles: { container: { backgroundColor: '#C4B5FD', borderRadius: 16 } } }`
  - 3–5: `{ customStyles: { container: { backgroundColor: '#8B5CF6', borderRadius: 16 } } }`
  - 6+: `{ customStyles: { container: { backgroundColor: theme.colors.primary, borderRadius: 16 } } }`
- pastScrollRange={12}
- onDayPress: setSelectedDate(date.dateString)

Modal (React Native Modal) when selectedDate is set:
- Slide-up panel (absolute positioned, animated translateY)
- Title: "Lessons on [date]:"
- List of lessons active that day from enrollments data
- Close button (Feather 'x')

testID="streak-calendar-screen"

---

## SCREEN 6 — ManagerDashboardSection
File: src/screens/dashboard/ManagerDashboardScreen.tsx
This renders INSIDE HomeScreen as an inline section — NOT a separate tab.

APIs:
```typescript
const {data: teamData} = useCachedFetch<TeamMember[]>('/api/manager/my-team', CacheTTL.MANAGER_TEAM);
const {data: progressData} = useCachedFetch<Record<number, number>>('/api/manager/team-progress', CacheTTL.MANAGER_TEAM);
```

Features:
- Team Summary Strip (3 stat boxes in a row):
  - Average team completion %
  - At-risk members (completion < 20%)
  - Certs expiring in 30 days (compute from certificates if available, else show "—")
  - Each box: large number, label, surface card with border

- "My Team" section header with member count

- FlatList of team members
- **TeamMemberRow** (React.memo):
  - Avatar circle (initials)
  - Name and department
  - Thin ProgressBar (completion %)
  - "Active N days ago" from last_active
  - [Nudge] button:
    - Alert.alert("Send reminder to [name]?", ..., [Cancel, Send])
    - On confirm: POST /api/manager/nudge { employee_id: member.id }
    - Success: show green inline toast "Reminder sent to [name]"
    - Error: red inline toast with error.message
  - [Assign] button:
    - Modal with FlatList of learning paths (fetch /api/learning-paths)
    - Select path → POST /api/manager/assign { employee_id: member.id, path_id }
    - Success: dismiss modal, green toast "Path assigned"

testID="manager-dashboard"

---

## SHARED COMPONENTS TO BUILD

### src/components/ui/ProgressRing.tsx
Props: `percentage: number` (0–100), `size: number`, `color: string`, `strokeWidth?: number` (default 6), `label?: string`

Use react-native-svg (Svg, Circle):
```typescript
const radius = (size - strokeWidth) / 2;
const circumference = 2 * Math.PI * radius;
const strokeDashoffset = circumference * (1 - percentage / 100);
```
Animate strokeDashoffset on mount using Animated.Value (spring from 0 to final offset).
Center text: `{percentage}%` if label prop provided.

### src/components/ui/StreakBadge.tsx
Props: `streakDays: number`, `onPress: () => void`
Wrap in TouchableOpacity.
- streakDays > 0: 🔥 emoji + "[N]-day streak" in amber card (warningLight background)
- streakDays === 0: "Start your streak today!" in grey card
- accessibilityLabel: "[N]-day learning streak, tap to view calendar"

### src/components/ui/SkillProgressWidget.tsx
Props: `skills: UserSkill[]`
VictoryChart (fixed height: 220) with VictoryBar.
If skills.length === 0: EmptyState "No skills recorded yet".

---

## FINALISE

- `npx tsc --noEmit` → 0 errors
- `npx eslint src --ext .ts,.tsx` → 0 errors
- git add . && git commit -m "feat: Agent 3 complete — dashboard, leaderboard, analytics, manager view"
- git push origin main
- echo "done" > .claude/status/agent3-complete
