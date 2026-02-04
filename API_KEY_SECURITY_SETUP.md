# API Key Security Setup Guide

## ✅ Current Status
- ✅ `.env` file is properly gitignored
- ✅ `react-native-config` package installed (v1.6.1)
- ✅ Android build configuration updated
- ✅ TypeScript declarations added
- ✅ API key validation in `aiService.ts`
- ✅ Environment variables loaded from `.env`

## 🔐 How It Works

### 1. Environment Variables (.env file)
All sensitive API keys are stored in the `.env` file at the project root:

```env
# AI API Keys - DO NOT COMMIT TO GITHUB
GEMINI_API_KEY=<YOUR_GEMINI_API_KEY>
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Firebase Configuration
FIREBASE_API_KEY=<YOUR_FIREBASE_API_KEY>
FIREBASE_AUTH_DOMAIN=firefighter-wellness-app.firebaseapp.com
FIREBASE_PROJECT_ID=firefighter-wellness-app
FIREBASE_STORAGE_BUCKET=firefighter-wellness-app.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=825542667540
FIREBASE_APP_ID=1:825542667540:android:a661181a090a0a0ec5e601
```

### 2. Git Protection
The `.env` file is listed in `.gitignore` (line 81), preventing accidental commits:

```gitignore
.env
.env.local
```

### 3. React Native Config Integration
The `react-native-config` library reads the `.env` file and exposes variables as native constants:

**Android** (`android/app/build.gradle`):
```gradle
// Line 9: Load environment variables
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

**TypeScript** (`@types/custom.d.ts`):
```typescript
declare module 'react-native-config' {
  export interface NativeConfig {
    GEMINI_API_KEY?: string;
    OPENAI_API_KEY?: string;
    // ... other keys
  }
  export const Config: NativeConfig;
  export default Config;
}
```

### 4. Usage in Code (`utils/ai/aiService.ts`)
```typescript
import Config from 'react-native-config';

const config = {
  GEMINI_API_KEY: Config.GEMINI_API_KEY || '',
  OPENAI_API_KEY: Config.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: Config.ANTHROPIC_API_KEY || '',
};

// Validate on startup
if (!config.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file!');
} else {
  console.log('✅ Gemini API key loaded successfully');
}
```

## 🚀 Testing the Setup

### Step 1: Verify .env File Exists
```bash
cat .env
```
You should see your API keys listed.

### Step 2: Clean and Rebuild (REQUIRED)
After any changes to `.env`, you MUST rebuild the native app:

```bash
# Stop Metro bundler (Ctrl+C if running)

# Clean Android build
cd android
./gradlew clean
cd ..

# Restart Metro with cache reset
npx react-native start --reset-cache
```

**In a new terminal:**
```bash
# Rebuild Android app
npx react-native run-android
```

### Step 3: Check Console Logs
When the app starts, you should see:
```
✅ Gemini API key loaded successfully
```

If you see:
```
❌ GEMINI_API_KEY not found in .env file!
```
Then react-native-config is not loading properly (see troubleshooting below).

## 🛠️ Troubleshooting

### Issue: "Config is null" or "GEMINI_API_KEY is undefined"

**Cause:** React Native Config requires native code linking and rebuild.

**Solution:**
```bash
# 1. Ensure react-native-config is installed
npm install react-native-config

# 2. Clean everything
rm -rf android/build android/app/build

# 3. Clean Metro cache
npx react-native start --reset-cache

# 4. Rebuild app (in new terminal)
npx react-native run-android
```

### Issue: Changes to .env not reflected in app

**Cause:** Metro bundler caches environment variables.

**Solution:**
```bash
# Stop Metro
# Delete .env cache
rm -rf node_modules/.cache

# Restart Metro with reset
npx react-native start --reset-cache

# Rebuild app
npx react-native run-android
```

### Issue: API calls return 401 Unauthorized

**Cause:** API key is incorrect or not loaded.

**Solution:**
1. Verify API key in Google Cloud Console: https://console.cloud.google.com/apis/credentials
2. Check `.env` file has correct key (no extra spaces, quotes, or newlines)
3. Rebuild app after confirming key is correct

### Issue: Build fails with "dotenv.gradle not found"

**Cause:** Android build.gradle not properly configured.

**Solution:**
Verify line 9 of `android/app/build.gradle`:
```gradle
apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
```

If missing, add it after the expo autolinking line.

## 📝 Best Practices

### ✅ DO:
- Keep `.env` in `.gitignore`
- Use different API keys for dev/staging/production
- Rotate API keys periodically
- Validate keys on app startup
- Use `Config.VARIABLE_NAME` in code (never hardcode)

### ❌ DON'T:
- Commit `.env` to git
- Share API keys in chat/email
- Hardcode API keys in source files
- Use production keys for testing
- Push keys to public repositories

## 🔄 Updating API Keys

If you need to update an API key:

1. **Update .env file:**
   ```bash
   # Edit the file
   nano .env
   
   # Update the key
   GEMINI_API_KEY=NEW_KEY_HERE
   ```

2. **Restart Metro:**
   ```bash
   # Stop Metro (Ctrl+C)
   npx react-native start --reset-cache
   ```

3. **Rebuild app:**
   ```bash
   # In new terminal
   npx react-native run-android
   ```

4. **Verify:**
   Check console logs for:
   ```
   ✅ Gemini API key loaded successfully
   ```

## 🔍 Security Checklist

Before committing code:
- [ ] `.env` file is in `.gitignore`
- [ ] No hardcoded API keys in source files
- [ ] All API keys loaded from `Config`
- [ ] Validation logic in place
- [ ] Test that keys load correctly after rebuild
- [ ] Check git diff doesn't include `.env` changes
- [ ] Verify API keys not in git history

```bash
# Check for leaked secrets
git log --all --full-history --source --all -- .env

# Should return empty or only deletion commits
```

## 📚 Related Files

- `.env` - Environment variables (NOT in git)
- `android/app/build.gradle` - Android configuration
- `@types/custom.d.ts` - TypeScript declarations
- `utils/ai/aiService.ts` - API key usage
- `.gitignore` - Git exclusions

## 🎯 Current Implementation Status

✅ **SECURE** - API keys properly externalized
✅ **VALIDATED** - Startup checks confirm key loading
✅ **TYPED** - TypeScript knows about Config interface
✅ **PROTECTED** - .env is gitignored
✅ **DOCUMENTED** - This guide provides full context

## 🚨 If API Key Was Leaked

If an API key was accidentally committed to git:

1. **Immediately revoke the key** in Google Cloud Console
2. **Generate a new key** and update `.env`
3. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   
   # Force push (CAUTION)
   git push origin --force --all
   ```
4. **Verify key is removed:** Check GitHub for the old key
5. **Update team:** Notify everyone to pull fresh repo

## 💡 Pro Tips

1. **Use .env.example for team:** Create a template without actual keys:
   ```bash
   cp .env .env.example
   # Edit .env.example to remove actual key values
   # Commit .env.example to git
   ```

2. **Validate keys before deploy:**
   ```typescript
   if (!Config.GEMINI_API_KEY) {
     throw new Error('Missing GEMINI_API_KEY - check .env file');
   }
   ```

3. **Monitor API usage:** Set up alerts in Google Cloud Console for unusual activity

4. **Use key restrictions:** In Google Cloud Console, restrict API keys to:
   - Specific APIs (Gemini only)
   - Specific referrers/IP addresses (optional)
   - Usage quotas (optional)

---

**Last Updated:** January 8, 2026  
**Status:** ✅ Fully implemented and secure
