# OQupy Web — Phase-wise Build Flow

> Frontend: Next.js 15 (App Router) · TypeScript strict · Tailwind CSS  
> API base: `https://oqupysrv-production.up.railway.app/api/v1`  
> Auth: JWT access token (memory) + refresh token (httpOnly cookie)

---

## Testing Setup (global)

### Tools
| Tool | Purpose |
|------|---------|
| **Vitest** | Unit + integration tests (fast, Vite-native) |
| **React Testing Library** | Component rendering and interaction |
| **MSW (Mock Service Worker)** | API mocking in unit/integration tests |
| **Playwright** | End-to-end browser tests |
| **@vitest/coverage-v8** | Coverage reports |

### Install
```bash
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event msw playwright @playwright/test
```

### Config files
```
vitest.config.ts          — unit/integration runner
playwright.config.ts      — e2e runner
src/test/setup.ts         — RTL + MSW global setup
src/test/msw/handlers.ts  — shared MSW request handlers
src/test/msw/server.ts    — MSW node server
```

### Report generation
```bash
# Unit + integration with HTML + JSON coverage report
npx vitest run --coverage --reporter=html --reporter=json --outputFile=reports/unit/results.json

# E2E with HTML report
npx playwright test --reporter=html,json --output=reports/e2e
```

Reports land in:
```
reports/
  unit/
    results.json          — machine-readable test results
    index.html            — browseable coverage report
  e2e/
    index.html            — Playwright HTML report
    results.json          — machine-readable e2e results
```

---

## Phase 0 — Project Scaffold ✅

- [x] Next.js 15, TypeScript strict, Tailwind CSS, ESLint
- [x] App Router + `src/` directory structure
- [x] `docs/` folder (context, decisions, progress, flow)

### Test strategy
- [ ] Install testing tools listed above
- [ ] Add `vitest.config.ts`, `playwright.config.ts`, `src/test/setup.ts`
- [ ] Add `"test"`, `"test:e2e"`, `"test:report"` scripts to `package.json`
- [ ] Smoke test: assert `npm run dev` starts without error

---

## Phase 1 — Auth Flows

**Goal:** Allow users to register, log in, and stay authenticated across sessions.

### Tasks
- [ ] `src/lib/api/client.ts` — base fetch wrapper (sets `Authorization` header, handles 401 → refresh → retry)
- [ ] `src/lib/api/auth.ts` — `login()`, `register()`, `refreshToken()`, `logout()` calls
- [ ] `src/context/AuthContext.tsx` — access token in memory, expose `user`, `login`, `logout`
- [ ] `src/app/(auth)/login/page.tsx` — login form
- [ ] `src/app/(auth)/register/page.tsx` — register form (role selection: student / studio owner)
- [ ] `src/middleware.ts` — protect routes; redirect unauthenticated users to `/login`
- [ ] Role-based redirect after login: student → `/studios`, owner → `/dashboard`, admin → `/admin`

### API endpoints used
```
POST /auth/login
POST /auth/register
POST /auth/refresh
POST /auth/logout
```

### Test strategy

#### Unit tests (`src/lib/api/__tests__/`)
| Test | What to assert |
|------|---------------|
| `client.test.ts` | Attaches `Authorization` header when token present |
| `client.test.ts` | On 401: calls refresh, retries original request |
| `client.test.ts` | On 401 + refresh failure: clears token, throws |
| `auth.test.ts` | `login()` returns user + token on 200 |
| `auth.test.ts` | `login()` throws with message on 401 |
| `auth.test.ts` | `register()` sends correct role field |

#### Component tests (`src/app/(auth)/__tests__/`)
| Test | What to assert |
|------|---------------|
| `LoginPage.test.tsx` | Renders email + password fields and submit button |
| `LoginPage.test.tsx` | Shows validation error when fields empty on submit |
| `LoginPage.test.tsx` | Calls `login()` with correct values on submit |
| `LoginPage.test.tsx` | Shows API error message on failed login |
| `RegisterPage.test.tsx` | Role selector renders all three roles |
| `RegisterPage.test.tsx` | Submits with selected role |

#### Context tests (`src/context/__tests__/`)
| Test | What to assert |
|------|---------------|
| `AuthContext.test.tsx` | `user` is null before login |
| `AuthContext.test.tsx` | `user` populated after successful `login()` |
| `AuthContext.test.tsx` | `logout()` clears user and token |

#### E2E tests (`e2e/auth.spec.ts`)
| Scenario | Steps |
|----------|-------|
| Student login → redirect | Login with student credentials → assert redirect to `/studios` |
| Owner login → redirect | Login with owner credentials → assert redirect to `/dashboard` |
| Invalid login | Submit wrong password → assert error message visible |
| Protected route | Visit `/studios` unauthenticated → assert redirect to `/login` |
| Register new student | Fill form, select Student → assert success redirect |

### Done when
- User can register, log in, and token silently refreshes on expiry
- Protected routes redirect to login when unauthenticated
- All Phase 1 tests pass; coverage ≥ 80% on `src/lib/api/` and `src/context/`

---

## Phase 2 — Studio Discovery (Student)

**Goal:** Students can browse, search, and view studios.

### Tasks
- [ ] `src/lib/api/studios.ts` — `getStudios()`, `getStudio(id)`
- [ ] `src/app/(student)/studios/page.tsx` — studio listing with search/filter
- [ ] `src/app/(student)/studios/[id]/page.tsx` — studio detail page
- [ ] `src/components/StudioCard.tsx` — reusable card component
- [ ] `src/components/SearchBar.tsx` — text + filter (location, type, etc.)
- [ ] Loading skeletons and empty states

### API endpoints used
```
GET /studios
GET /studios/:id
```

### Test strategy

#### Unit tests
| Test | What to assert |
|------|---------------|
| `studios.test.ts` | `getStudios()` returns array of studios |
| `studios.test.ts` | `getStudio(id)` returns single studio |
| `studios.test.ts` | Network error surfaces as thrown error |

#### Component tests
| Test | What to assert |
|------|---------------|
| `StudioCard.test.tsx` | Renders name, location, type |
| `StudioCard.test.tsx` | Clicking card navigates to `/studios/:id` |
| `SearchBar.test.tsx` | Typing updates search query |
| `SearchBar.test.tsx` | Selecting filter option triggers callback |
| `StudiosPage.test.tsx` | Shows skeleton while loading |
| `StudiosPage.test.tsx` | Renders cards after data loads |
| `StudiosPage.test.tsx` | Shows empty state when no studios returned |
| `StudioDetailPage.test.tsx` | Renders studio name, description, photos |

#### E2E tests (`e2e/studios.spec.ts`)
| Scenario | Steps |
|----------|-------|
| Browse studios | Log in as student → navigate to `/studios` → assert cards visible |
| Search filter | Type studio name in search → assert filtered results |
| View studio detail | Click a card → assert detail page loads with correct name |

### Done when
- Student can browse all approved studios and view details
- All Phase 2 tests pass; coverage ≥ 80% on new files

---

## Phase 3 — Bookings & Enrollment (Student)

**Goal:** Students can view available classes/bookings and enroll.

### Tasks
- [ ] `src/lib/api/bookings.ts` — `getBookings(studioId)`, `enrollBooking(id)`, `getMyBookings()`
- [ ] `src/app/(student)/studios/[id]/bookings/page.tsx` — list of bookings for a studio
- [ ] `src/app/(student)/my-bookings/page.tsx` — student's enrolled bookings
- [ ] `src/components/BookingCard.tsx` — shows time, instructor, capacity, enroll button
- [ ] Optimistic UI for enroll action; handle full/closed states

### API endpoints used
```
GET  /studios/:id/bookings
POST /bookings/:id/enroll
GET  /bookings/mine
```

### Test strategy

#### Unit tests
| Test | What to assert |
|------|---------------|
| `bookings.test.ts` | `getBookings(studioId)` returns bookings for studio |
| `bookings.test.ts` | `enrollBooking(id)` calls `POST /bookings/:id/enroll` |
| `bookings.test.ts` | `enrollBooking()` throws on booking full (409) |
| `bookings.test.ts` | `getMyBookings()` returns student's enrollments |

#### Component tests
| Test | What to assert |
|------|---------------|
| `BookingCard.test.tsx` | Renders time, instructor, available spots |
| `BookingCard.test.tsx` | "Enroll" button disabled when capacity is 0 |
| `BookingCard.test.tsx` | Clicking "Enroll" calls `enrollBooking()` |
| `BookingCard.test.tsx` | Optimistic UI: button changes to "Enrolled" immediately |
| `BookingCard.test.tsx` | Reverts on API error, shows error message |
| `MyBookingsPage.test.tsx` | Lists enrolled bookings with date/studio name |
| `MyBookingsPage.test.tsx` | Shows empty state when no bookings |

#### E2E tests (`e2e/bookings.spec.ts`)
| Scenario | Steps |
|----------|-------|
| Enroll in a class | Log in → open studio → click Enroll → assert booking appears in My Bookings |
| Full booking | Mock booking at capacity → assert Enroll button disabled |
| My Bookings view | Log in → navigate to `/my-bookings` → assert enrolled classes visible |

### Done when
- Student can enroll in a class and see it in their bookings list
- All Phase 3 tests pass; coverage ≥ 80% on new files

---

## Phase 4 — Studio Owner Dashboard

**Goal:** Studio owners can manage their studio, create bookings, and handle enrollments.

### Tasks
- [ ] `src/app/(owner)/dashboard/page.tsx` — overview: upcoming bookings, enrollment counts
- [ ] `src/app/(owner)/studio/page.tsx` — edit studio profile (name, description, photos)
- [ ] `src/app/(owner)/bookings/page.tsx` — list owner's bookings
- [ ] `src/app/(owner)/bookings/new/page.tsx` — create booking form (date, time, capacity, instructor)
- [ ] `src/app/(owner)/bookings/[id]/page.tsx` — view enrollments, confirm/cancel booking
- [ ] `src/lib/api/owner.ts` — owner-specific API calls
- [ ] Route guard: redirect non-owners away from `/dashboard`

### API endpoints used
```
GET  /owner/studio
PUT  /owner/studio
GET  /owner/bookings
POST /owner/bookings
PUT  /owner/bookings/:id
GET  /owner/bookings/:id/enrollments
```

### Test strategy

#### Unit tests
| Test | What to assert |
|------|---------------|
| `owner.test.ts` | `getOwnerStudio()` returns studio data |
| `owner.test.ts` | `updateStudio()` sends PUT with correct body |
| `owner.test.ts` | `createBooking()` sends POST with date, time, capacity |
| `owner.test.ts` | `cancelBooking()` sends correct status in PUT body |
| `owner.test.ts` | `getEnrollments(bookingId)` returns student list |

#### Component tests
| Test | What to assert |
|------|---------------|
| `DashboardPage.test.tsx` | Shows upcoming booking count |
| `NewBookingForm.test.tsx` | Renders date, time, capacity, instructor fields |
| `NewBookingForm.test.tsx` | Validation: required fields enforced |
| `NewBookingForm.test.tsx` | On submit: calls `createBooking()` with form values |
| `BookingDetailPage.test.tsx` | Lists enrolled students |
| `BookingDetailPage.test.tsx` | Confirm/Cancel buttons call correct API |
| Route guard | Non-owner accessing `/dashboard` redirects to `/studios` |

#### E2E tests (`e2e/owner.spec.ts`)
| Scenario | Steps |
|----------|-------|
| Create booking | Log in as owner → `/dashboard/bookings/new` → fill form → assert appears in bookings list |
| Edit studio profile | Log in as owner → `/dashboard/studio` → update name → assert saved |
| View enrollments | Open booking → assert student names listed |
| Cancel booking | Click Cancel → assert booking status changes |
| Non-owner guard | Log in as student → visit `/dashboard` → assert redirect |

### Done when
- Owner can create a booking and see which students have enrolled
- All Phase 4 tests pass; coverage ≥ 80% on new files

---

## Phase 5 — Admin Panel

**Goal:** Admins can approve studios and manage users.

### Tasks
- [ ] `src/app/(admin)/admin/page.tsx` — admin overview
- [ ] `src/app/(admin)/admin/studios/page.tsx` — list pending studios, approve/reject
- [ ] `src/app/(admin)/admin/users/page.tsx` — list users, suspend/activate
- [ ] `src/lib/api/admin.ts` — admin API calls
- [ ] Route guard: redirect non-admins away from `/admin`

### API endpoints used
```
GET  /admin/studios/pending
POST /admin/studios/:id/approve
POST /admin/studios/:id/reject
GET  /admin/users
PUT  /admin/users/:id
```

### Test strategy

#### Unit tests
| Test | What to assert |
|------|---------------|
| `admin.test.ts` | `getPendingStudios()` returns pending list |
| `admin.test.ts` | `approveStudio(id)` calls `POST .../approve` |
| `admin.test.ts` | `rejectStudio(id)` calls `POST .../reject` |
| `admin.test.ts` | `getUsers()` returns user list |
| `admin.test.ts` | `updateUser(id, {status})` sends correct body |

#### Component tests
| Test | What to assert |
|------|---------------|
| `PendingStudiosPage.test.tsx` | Renders studio name + Approve/Reject buttons |
| `PendingStudiosPage.test.tsx` | Approve removes studio from pending list |
| `PendingStudiosPage.test.tsx` | Reject removes studio from pending list |
| `UsersPage.test.tsx` | Renders user list with role and status |
| `UsersPage.test.tsx` | Suspend button calls `updateUser()` with suspended status |
| Route guard | Non-admin visiting `/admin` redirects to `/studios` |

#### E2E tests (`e2e/admin.spec.ts`)
| Scenario | Steps |
|----------|-------|
| Approve studio | Log in as admin → `/admin/studios` → click Approve → assert removed from list |
| Reject studio | Click Reject → assert removed from list with rejected state |
| Suspend user | `/admin/users` → click Suspend → assert status changes |
| Non-admin guard | Log in as student → visit `/admin` → assert redirect |

### Done when
- Admin can approve a studio submission and manage user accounts
- All Phase 5 tests pass; coverage ≥ 80% on new files

---

## Test Report Generation

### After each phase: run and capture reports

```bash
# 1. Unit + integration tests with coverage
npx vitest run --coverage \
  --reporter=verbose \
  --reporter=json --outputFile=reports/unit/results.json \
  --reporter=html

# 2. E2E tests
npx playwright test \
  --reporter=list \
  --reporter=json,reports/e2e/results.json \
  --reporter=html,reports/e2e

# 3. Open reports
open reports/unit/index.html        # coverage report
npx playwright show-report reports/e2e
```

### `package.json` scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:report": "vitest run --coverage --reporter=json --outputFile=reports/unit/results.json --reporter=html",
    "test:e2e": "playwright test",
    "test:e2e:report": "playwright test --reporter=html,reports/e2e --reporter=json,reports/e2e/results.json",
    "test:all": "npm run test:report && npm run test:e2e:report",
    "report:open": "open reports/unit/index.html && npx playwright show-report reports/e2e"
  }
}
```

### Report structure
```
reports/
  unit/
    index.html              ← coverage HTML (open in browser)
    results.json            ← vitest JSON results (CI parseable)
    coverage/               ← per-file coverage breakdown
  e2e/
    index.html              ← Playwright HTML report
    results.json            ← Playwright JSON results (CI parseable)
    screenshots/            ← failure screenshots (auto-captured)
    videos/                 ← failure videos (if enabled)
```

### CI integration (GitHub Actions sketch)
```yaml
- name: Run unit tests
  run: npm run test:report

- name: Run E2E tests
  run: npm run test:e2e:report

- name: Upload reports
  uses: actions/upload-artifact@v4
  with:
    name: test-reports
    path: reports/
```

### Phase gate — do not proceed to next phase until
- [ ] All unit + component tests in current phase pass
- [ ] All E2E scenarios in current phase pass
- [ ] Coverage on new files ≥ 80%
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)

---

## Shared Components & Utilities (built progressively)

| Item | Phase introduced |
|------|-----------------|
| `src/lib/api/client.ts` — fetch wrapper | 1 |
| `src/context/AuthContext.tsx` | 1 |
| `src/middleware.ts` — route protection | 1 |
| `src/components/Navbar.tsx` | 2 |
| `src/components/LoadingSkeleton.tsx` | 2 |
| `src/components/ErrorBoundary.tsx` | 2 |
| `src/components/Button.tsx`, `Input.tsx` | 1–2 |
| `src/types/index.ts` — shared TS types | 1 |
| `src/test/msw/handlers.ts` — MSW handlers | 0 |

---

## Route Map

```
/                          → redirect based on role / landing page
/login                     → Phase 1
/register                  → Phase 1
/studios                   → Phase 2 (student)
/studios/[id]              → Phase 2 (student)
/studios/[id]/bookings     → Phase 3 (student)
/my-bookings               → Phase 3 (student)
/dashboard                 → Phase 4 (owner)
/dashboard/studio          → Phase 4 (owner)
/dashboard/bookings        → Phase 4 (owner)
/dashboard/bookings/new    → Phase 4 (owner)
/dashboard/bookings/[id]   → Phase 4 (owner)
/admin                     → Phase 5 (admin)
/admin/studios             → Phase 5 (admin)
/admin/users               → Phase 5 (admin)
```

---

## Cross-cutting Concerns (address throughout)

- **Error handling** — API errors surfaced as toast/inline messages
- **Loading states** — skeletons on every data-fetching page
- **Token refresh** — transparent, no user disruption
- **Role guards** — middleware + layout-level checks
- **Responsive design** — mobile-first Tailwind layout
