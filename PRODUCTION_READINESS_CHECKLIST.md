# Production Readiness Checklist

Use this checklist before every release build (Android/iOS/TestFlight/EAS).

## 1. Security & Secrets
- [ ] `npm run secrets:scan` passes.
- [ ] `.env` is not staged and contains no AI provider secrets used by a release build.
- [ ] No source file imports or requires `utils/localSecrets.ts`; ignored files can still be bundled by Metro.
- [ ] No real API keys appear in changed files (`rg -n "AIza|sk-" <changed-files>`).
- [ ] `GEMINI_API_KEY` is configured in Firebase Secret Manager.
- [ ] `firebase deploy --only functions:aiProxy` succeeds before distributing the build.

## 2. Build Health
- [ ] Android debug build installs and launches on emulator/device.
- [ ] iOS debug build installs and launches in Xcode simulator/device.
- [ ] No startup crash in Hermes.
- [ ] The signed Release archive succeeds and validates for the App Store.

## 3. Critical User Flows (Manual Smoke Test)
- [ ] Login/register works.
- [ ] Dashboard loads without red screen.
- [ ] AI Chat sends/receives a response.
- [ ] Meal text analysis returns macros and confidence.
- [ ] Meal photo analysis returns items/macros (or graceful error message).
- [ ] Workout generation/adaptation flows complete.
- [ ] Meal logging saves to Firestore and reloads correctly.
- [ ] Profile photo uploads, survives relaunch, and appears on a second device/session.
- [ ] Macro Calculator saves and opens the generated plan.
- [ ] Generate Next 2 Weeks appends weeks without replacing completed history.
- [ ] Logout returns to authentication; relaunch restores only authenticated sessions.

## 4. AI Safety & Resilience
- [ ] Malformed AI JSON is handled gracefully (no app crash).
- [ ] If AI request fails, user sees a useful message and can retry.
- [ ] Nutrition confidence + warnings display properly in UI.

## 5. Performance & UX
- [ ] AI response latency feels acceptable on Wi-Fi and cellular.
- [ ] Loading states appear for long operations.
- [ ] No frozen UI during AI calls or photo processing.

## 6. Release Hygiene
- [ ] `git status` reviewed for accidental files (`build.log`, backups, etc.).
- [ ] Release notes updated with user-visible changes.
- [ ] Branch pushed and tagged (if using version tags).
- [ ] App Store Connect privacy answers include account, user content/photos, health/fitness, and usage data.
- [ ] Privacy Policy URL points to the current `docs/privacy-policy.html` deployment.

## 7. Optional (Recommended)
- [ ] Run targeted nutrition parsing tests.
- [ ] Add/update regression tests for any changed AI prompt/JSON shape.
- [ ] Rotate/restrict API keys periodically in provider consoles.
