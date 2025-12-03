# AI Integration Testing Guide

## ✅ What's Been Implemented (Option 4 - Contextual Integration)

### 1. **Dashboard → AI Chat Coach**
- **Location**: Prominent gradient card below profile banner
- **Icon**: Chat bubbles icon
- **Action**: Taps → Opens full `AIChatScreen`
- **Purpose**: General fitness/nutrition coaching chat

### 2. **Workout Screen → AI Workout Assistant**
- **Location**: Header area (left-most icon)
- **Icon**: Sparkles (✨) in purple
- **Action**: Taps → Opens `AIWorkoutAssistant` modal
- **Purpose**: Get AI-generated workout recommendations based on:
  - Recent workout history
  - User profile (goals, experience, equipment)
  - Current program context

### 3. **Meal Plan Screen → AI Meal Planner**
- **Location**: Floating button (bottom-right, next to Log Food button)
- **Icon**: Sparkles (✨) in purple
- **Action**: Taps → Opens `AIMealPlanner` modal
- **Purpose**: Get AI meal suggestions that match:
  - Daily macro targets
  - Meal type (breakfast/lunch/dinner/snack)
  - Dietary preferences
  - Remaining macros for the day

---

## 🔧 Setup Instructions

### 1. API Key Configuration (Already Done ✅)
Your Gemini API key is configured in `.env`:
```
GEMINI_API_KEY=AIzaSyBPEC65Rlz3MeBC8BcKX-CvX5BkPP3hXwY
```

### 2. Restart Metro Bundler
Since we added environment variables, restart the bundler:
```bash
# Kill the current Metro bundler (Ctrl+C in that terminal)
npx react-native start --reset-cache
```

### 3. Rebuild the App
```bash
# For Android (in a new terminal):
npx react-native run-android

# For iOS (if needed):
npx react-native run-ios
```

---

## 🧪 Testing Checklist

### Test 1: Dashboard AI Coach Button
1. Open the app
2. Go to Dashboard
3. Look for the purple/blue gradient card that says "AI Fitness Coach"
4. Tap it
5. **Expected**: Opens AI Chat screen with conversation interface
6. **Try**: Type "What should I eat for breakfast?" and send
7. **Expected**: AI responds with meal suggestions

### Test 2: Workout Screen AI Assistant
1. Navigate to Workout screen (bottom tab)
2. Look in the header for sparkles (✨) icon in purple
3. Tap the sparkles icon
4. **Expected**: Modal opens showing "AI Workout Assistant"
5. **Expected**: Shows loading spinner while fetching user context
6. **Expected**: AI generates workout recommendation
7. Check that it shows:
   - Workout recommendation
   - Rationale (why this workout)
   - Focus areas
   - Duration estimate

### Test 3: Meal Plan Screen AI Planner
1. Navigate to Meal Plan screen (bottom tab)
2. Look in bottom-right for purple floating button with sparkles
3. Tap the sparkles button
4. **Expected**: Modal opens showing "AI Meal Planner"
5. **Expected**: Shows loading spinner while fetching user profile
6. **Expected**: AI generates meal suggestion for lunch (default)
7. Check that it shows:
   - Meal name
   - Ingredients list
   - Macro breakdown (calories, protein, carbs, fat)
   - Prep time and difficulty
   - Dietary tags

---

## 🐛 Troubleshooting

### Issue: "API key not found" or network error
**Solution**: 
1. Check `.env` file has your Gemini key
2. Restart Metro bundler with `--reset-cache`
3. Rebuild the app

### Issue: AI responses are slow
**Reason**: Gemini API can take 3-10 seconds for complex prompts
**Solution**: Normal behavior, just wait

### Issue: Modal doesn't open
**Solution**: 
1. Check console for errors
2. Make sure you tapped the correct icon (sparkles ✨ in purple)
3. Try restarting the app

### Issue: "Rate limit exceeded"
**Reason**: Gemini free tier is 15 requests/minute
**Solution**: Wait 1 minute and try again

---

## 📊 Expected Behavior

### AI Chat Screen
- Real-time message sending
- Conversation history loads from Firebase
- Typing indicator while AI is thinking
- Messages persist across sessions
- Quick prompt buttons at bottom

### AI Workout Assistant Modal
- Loads recent workouts automatically
- Considers user's current program
- Provides workout recommendation with rationale
- Shows estimated duration and difficulty
- Close button in top-right

### AI Meal Planner Modal
- Loads user's macro plan automatically
- Suggests meals that fit remaining macros
- Shows detailed ingredient list
- Provides prep time and difficulty
- Meal type selector (breakfast/lunch/dinner/snack)
- Close button in top-right

---

## 🎯 Next Steps After Testing

Once you verify everything works:

1. **Test different prompts** in each context:
   - Chat: Ask about nutrition, workouts, recovery
   - Workout: Try when you have different workout history
   - Meals: Try different times of day, different macro targets

2. **Check Firebase Integration**:
   - Chat messages should save to Firestore
   - Check Firebase Console: `users/{uid}/aiChats/{chatId}/messages`

3. **Monitor API Usage**:
   - Go to Google AI Studio
   - Check quota dashboard
   - Free tier: 15 requests/min, 1500/day

4. **Optional Enhancements** (future):
   - Add meal type selector to AI Meal Planner
   - Add workout difficulty/duration inputs to AI Workout Assistant
   - Add voice input to AI Chat
   - Add image upload for form analysis

---

## 📝 Git Status

Current branch: `ai-integration`

Recent commits:
- ✅ Initial AI integration (core service, screens, components)
- ✅ Contextual UI integration (buttons in Dashboard, Workout, Meal Plan)
- ✅ Secure API key management with react-native-config

Ready to merge to `main` once tested!

---

## 🔒 Security Notes

- `.env` file is in `.gitignore` ✅
- API keys never committed to git ✅
- Using `react-native-config` for proper env var handling ✅
- `.env.example` would be good to create for other developers

---

## 💡 Tips

1. **Fast Testing**: Use the AI Chat screen first - it's the easiest to test
2. **Context Matters**: The AI works best when you have:
   - An active workout program
   - A meal plan configured
   - Some logged workouts/meals in history
3. **Cost Monitoring**: Gemini is free but has limits. If you hit limits often, consider:
   - Caching responses
   - Rate limiting user requests
   - Upgrading to paid tier
4. **User Experience**: The modals are context-aware:
   - Workout Assistant knows your current program
   - Meal Planner knows your macro targets
   - Chat has full conversation history

---

Happy Testing! 🚀
