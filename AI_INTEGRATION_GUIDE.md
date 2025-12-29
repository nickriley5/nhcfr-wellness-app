# AI Integration - Implementation Guide

## 🚀 Overview

This AI integration adds powerful machine learning capabilities to your firefighter wellness app:

1. **AI Chat Coach** - Real-time conversational fitness/nutrition coaching
2. **Smart Workout Recommendations** - Personalized workout generation based on goals, equipment, and progress
3. **Periodized Program Generation** ✨ NEW - Complete multi-week training programs with progressive overload
4. **Dynamic Coaching Adjustments** ✨ NEW - AI analyzes feedback and adjusts workouts intelligently
5. **AI Meal Planner** - Intelligent meal suggestions matching nutrition targets
6. **Form Analysis** - Exercise form feedback (ready for video integration)
7. **Adaptive Programming** - Auto-adjusting training based on user progress

## 📁 Files Created

### Core AI Services
- `utils/ai/aiService.ts` - Main AI service with multi-provider support (OpenAI, Claude, Gemini)
  - ✨ NEW: `generatePeriodizedProgram()` - Full program generation
  - ✨ NEW: `getWorkoutAdjustments()` - Dynamic coaching
- `utils/coachingService.ts` ✨ NEW - Coaching utilities and feedback analysis

### Screens & Components
- `screens/AIChatScreen.tsx` - Full AI chat interface
- `components/AIWorkoutAssistant.tsx` - Smart workout recommendation modal
- `components/AIMealPlanner.tsx` - AI-powered meal suggestions
- `components/Modals/PeriodizedProgramModal.tsx` ✨ NEW - Program generator UI
- `components/Modals/CoachingAdviceModal.tsx` ✨ NEW - Dynamic coaching display
- `components/Modals/WorkoutFeedbackModal.tsx` - Post-workout feedback capture

## 🔑 Setup Required

### 1. Get API Keys

You need at least ONE of these API keys:

**Option A: OpenAI (Recommended)**
- Go to: https://platform.openai.com/api-keys
- Create an account and generate an API key
- Cost: ~$0.002 per request (very affordable)

**Option B: Anthropic Claude**
- Go to: https://console.anthropic.com/
- More powerful for complex reasoning
- Cost: ~$0.015 per request

**Option C: Google Gemini**
- Go to: https://makersuite.google.com/app/apikey
- Free tier available
- Good for high-volume usage

### 2. Add API Keys to Your Project

**Method 1: Environment Variables (Recommended)**

Create a `.env` file in your project root:

\`\`\`bash
OPENAI_API_KEY=sk-...your-key-here...
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
GEMINI_API_KEY=...your-key-here...
\`\`\`

Install react-native-config:
\`\`\`bash
npm install react-native-config
cd ios && pod install && cd ..
\`\`\`

**Method 2: Direct in Code (Quick Testing)**

Edit `utils/ai/aiService.ts` and replace the API keys:

\`\`\`typescript
const AI_CONFIG = {
  openai: {
    apiKey: 'sk-YOUR-OPENAI-KEY-HERE',
    // ...
  },
  // ...
};
\`\`\`

⚠️ **Important**: Never commit real API keys to git! Add `.env` to `.gitignore`

### 3. Update Navigation

Add the AI Chat screen to your navigation in `App.tsx`:

\`\`\`typescript
import AIChatScreen from './screens/AIChatScreen';

// Inside your Stack.Navigator:
<Stack.Screen 
  name="AIChat" 
  component={AIChatScreen}
  options={{ headerShown: false }}
/>
\`\`\`

### 4. Add AI Features to Existing Screens

**Dashboard Integration:**
Add a button to access AI Coach:

\`\`\`typescript
<Pressable 
  style={styles.aiButton}
  onPress={() => navigation.navigate('AIChat')}
>
  <Ionicons name="chatbubbles-outline" size={24} color="#FF3C38" />
  <Text style={styles.aiButtonText}>Chat with AI Coach</Text>
</Pressable>
\`\`\`

**Workout Screen Integration:**
Add AI workout assistant:

\`\`\`typescript
import AIWorkoutAssistant from '../components/AIWorkoutAssistant';

// In your component:
const [showAI, setShowAI] = useState(false);

<AIWorkoutAssistant
  visible={showAI}
  onClose={() => setShowAI(false)}
  onApplyRecommendation={(rec) => {
    // Handle applying the AI-generated workout
    console.log('AI Recommendation:', rec);
  }}
/>
\`\`\`

**Meal Plan Screen Integration:**
Add AI meal planner:

\`\`\`typescript
import AIMealPlanner from '../components/AIMealPlanner';

const [showMealAI, setShowMealAI] = useState(false);
const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast');

<AIMealPlanner
  visible={showMealAI}
  onClose={() => setShowMealAI(false)}
  mealType={mealType}
  date={selectedDate}
/>
\`\`\`

## 🧪 Testing

### Test the AI Service Directly

\`\`\`typescript
import { sendAIMessage, chatWithCoach } from './utils/ai/aiService';

// Test basic chat
const testChat = async () => {
  const response = await sendAIMessage([
    { role: 'user', content: 'What is a good workout for chest day?' }
  ]);
  console.log('AI Response:', response.content);
};

// Test coach chat
const testCoach = async () => {
  const response = await chatWithCoach(
    'Suggest a workout for today',
    [],
    { name: 'John', goals: ['Build Muscle'], experience: 'Intermediate' }
  );
  console.log('Coach Response:', response);
};
\`\`\`

### Test in Simulator

1. Start your app: `npm run ios` or `npm run android`
2. Navigate to the AI Chat screen
3. Try sending a message
4. Check console for any errors

## 🎨 Customization

### Change AI Model

Edit `utils/ai/aiService.ts`:

\`\`\`typescript
const AI_CONFIG = {
  openai: {
    model: 'gpt-4-turbo-preview', // or 'gpt-3.5-turbo' for cheaper option
  },
  anthropic: {
    model: 'claude-3-5-sonnet-20241022', // or 'claude-3-haiku-20240307' for faster/cheaper
  },
};
\`\`\`

### Customize AI Personality

In `aiService.ts`, modify system prompts:

\`\`\`typescript
const systemPrompt = \`You are a tough but supportive firefighter coach. 
Be direct, use firefighter terminology, and focus on functional fitness.
Your responses should be motivating and concise.\`;
\`\`\`

### Add Custom AI Functions

Create new specialized functions in `aiService.ts`:

\`\`\`typescript
export async function analyzeProgress(progressData: any): Promise<string> {
  const prompt = \`Analyze this training progress and provide feedback: \${JSON.stringify(progressData)}\`;
  const response = await sendAIMessage([
    { role: 'system', content: 'You are a fitness progress analyst.' },
    { role: 'user', content: prompt }
  ]);
  return response.content;
}
\`\`\`

## 📊 Features to Add Next

### 1. Exercise Form Analysis (Video)
- Integrate with react-native-vision-camera
- Capture workout videos
- Send frames to AI for form analysis
- Show real-time feedback

### 2. Voice Integration
- Add speech-to-text for hands-free coaching
- Text-to-speech for AI responses during workouts
- Use expo-speech or react-native-tts

### 3. Progress Tracking AI
- Weekly progress reports generated by AI
- Automatic program adjustments based on data
- Predictive analytics for goal achievement

### 4. Smart Rest Day Recommendations
- Monitor recovery metrics
- AI suggests when to take rest days
- Personalized recovery protocols

### 5. Nutrition Photo Analysis
- Take photos of meals
- AI estimates calories/macros from image
- Integrate with vision APIs (Google Cloud Vision, etc.)

## 🐛 Troubleshooting

### "API key not configured" Error
- Make sure you've added at least one API key
- Check the provider name matches ('openai', 'anthropic', or 'gemini')
- Verify the key format is correct

### "Network request failed"
- Check your internet connection
- Verify API key is valid (not expired/rate-limited)
- Check API provider status page

### TypeScript Errors
- Run: `npm install`
- Restart TypeScript server in VS Code
- Check all imports are correct

### Slow Responses
- Switch to a faster model (gpt-3.5-turbo, claude-haiku)
- Reduce max_tokens in options
- Implement response streaming (advanced)

## 💰 Cost Estimation

**Based on Average Usage:**

| Feature | Requests/Day | Est. Cost/Month |
|---------|--------------|-----------------|
| AI Chat | 20 messages | $2-5 |
| Workout Recommendations | 3 per week | $1-2 |
| Meal Suggestions | 5 per week | $1-2 |
| **Total** | | **$4-9/month** |

Using GPT-3.5-turbo can reduce costs by 90%!

## 🔒 Security Best Practices

1. **Never commit API keys** - Use environment variables
2. **Rate limit requests** - Prevent abuse
3. **Validate user input** - Sanitize before sending to AI
4. **Store chat history securely** - Use Firestore security rules
5. **Monitor usage** - Set up billing alerts in API dashboards

## 📚 Additional Resources

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Anthropic Claude Docs](https://docs.anthropic.com/)
- [Google Gemini Docs](https://ai.google.dev/docs)
- [React Native AI Best Practices](https://reactnative.dev/docs/network)

## 🤝 Support

If you need help:
1. Check the console logs for detailed error messages
2. Verify all imports and file paths
3. Test API keys directly using curl or Postman
4. Review Firebase configuration

## ✅ Next Steps

1. ✅ Get your API key (OpenAI recommended)
2. ✅ Add it to the project (`.env` file or directly)
3. ✅ Update `App.tsx` navigation
4. ✅ Add AI buttons to Dashboard/Workout/Meal screens
5. ✅ Test the chat feature
6. ✅ Customize prompts for your use case
7. ✅ Deploy and monitor usage

Happy coding! 🚀
