/**
 * Rule-Based AI Fitness Coach Simulation
 * egzersiz önerileri ve diyet önerileri motivasyon konuşmaları
 */

export async function sendMessageToGemini(userMessage, userProfile = null, phaseInfo = null) {

  await new Promise(resolve => setTimeout(resolve, 800));

  const message = userMessage.toLowerCase().trim();

  const hasAny = (arr) => arr.some(word => message.includes(word));

  // 🦵 CRAMPS / MUSCLE PAIN
  if (hasAny(['cramp', 'cramps', 'cramping', 'muscle cramp', 'leg cramp', 'calf cramp'])) {
    return `🦵 **Muscle Cramps Relief Guide**

⚡ **Immediate Actions:**
- Stop the activity immediately
- Gently stretch the affected muscle
- Massage the area slowly
- Apply heat (or cold if inflamed)

💧 **Hydration:**
- Drink water slowly
- Add electrolytes (salt, potassium, magnesium)

🧘 **Quick Stretch Examples:**
- Calf cramp → pull toes toward you
- Thigh cramp → gentle quad stretch
- Foot cramp → roll foot on a bottle or ball

💊 **Possible Causes:**
- Dehydration
- Low magnesium / potassium
- Muscle fatigue
- Poor warm-up

🏃 **Prevention:**
- Warm up before workouts
- Stay hydrated daily
- Eat magnesium-rich foods (banana, nuts, spinach)

⚠️ If cramps are frequent or severe, consult a healthcare professional.`;
  }

  // 🏋️ PLANK
  if (message.includes('plank')) {
    return `🏋️ **Plank Tips:**

✅ Correct Form:
- Elbows aligned with shoulders
- Flat back (no arching or rounding)
- Hips down, body straight line
- Neck neutral
- Core engaged

⏱️ Target: ${
      userProfile?.gender === 'Female' && phaseInfo
        ? `${phaseInfo.intensity === 'High' ? '45-60' : phaseInfo.intensity === 'Medium' ? '30-45' : '15-30'} seconds during ${phaseInfo.phase}`
        : '30-60 seconds'
    }

❌ Mistakes:
- Hips too high
- Sagging lower back
- Holding breath`;
  }

  // 🦵 SQUAT
  if (message.includes('squat')) {
    return `🦵 **Squat Tips:**

✅ Technique:
- Feet shoulder-width apart
- Knees not going past toes
- Back straight, chest open
- Weight on heels
- 90-degree depth

💪 Benefits:
- Strong legs & glutes
- Core stability
- Balance improvement

⚠️ Safety:
- Stop if knee pain occurs
- Start bodyweight first`;
  }

  // 💪 BICEP / ARM
  if (message.includes('bicep') || message.includes('arm')) {
    return `💪 **Bicep Curl Tips:**

✅ Form:
- Elbows fixed at sides
- Only forearms move
- Slow controlled motion

🎯 Muscles:
- Biceps
- Forearms

📊 Sets:
- Beginner: 3x10-12
- Advanced: 4x8-10`;
  }

  // 🌸 CYCLE / PERIOD
  if (message.includes('cycle') || message.includes('menstrual') || message.includes('period')) {
    if (!userProfile || userProfile.gender !== 'Female') {
      return 'Menstrual cycle info is only available for female users.';
    }

    return `🌸 **Menstrual Cycle Training**

📅 ${phaseInfo?.phase} (Day ${userProfile.cycleDay}/28)

💡 Adjust training, don’t stop it.

⚡ High energy phases → heavy workouts  
🌙 Low energy phases → light workouts + yoga

💊 If cramps:
- Heat
- Light movement
- Magnesium

Listen to your body 💗`;
  }

  // 🍽️ NUTRITION
  if (message.includes('nutrition') || message.includes('food') || message.includes('diet') || message.includes('eat')) {
    return `🍽️ **Nutrition Guide**

🏋️ Pre-workout:
- Banana + peanut butter
- Oats
- Yogurt

💪 Post-workout:
- Chicken + rice
- Eggs + toast
- Protein shake

💧 Water:
- 2–3L daily

${
  userProfile?.gender === 'Female' && phaseInfo
    ? `🌸 Cycle-based nutrition:
- Follicular → more carbs
- Luteal → more protein & fats`
    : ''
}

⚠️ General guidance only`;
  }

  // 🎯 FORM
  if (message.includes('form') || message.includes('technique') || message.includes('correct')) {
    return `🎯 **Exercise Form Guide**

1. Warm up first
2. Slow controlled movement
3. Full range of motion
4. Breathe properly
5. Core always active

📹 Tip: record yourself to check form

❌ Avoid:
- Momentum
- Holding breath
- Fast sloppy reps`;
  }

  // 💪 MOTIVATION
  if (message.includes('motivation') || message.includes('fail') || message.includes('hard') || message.includes('struggle')) {
    return `💪 **Keep Going!**

Small steps still count.

${
  userProfile?.gender === 'Female' && phaseInfo
    ? `🌸 Your ${phaseInfo.phase} energy is ${phaseInfo.energy}`
    : ''
}

🔥 Progress is not linear.

Even 5 minutes > nothing.

You’ve got this 💪`;
  }

  // 👋 GREETING
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return `👋 Hi! I'm your AI Fitness Coach

I can help you with:
- Exercises
- Nutrition
- Form correction
- Motivation
${userProfile?.gender === 'Female' ? '- Cycle training' : ''}

Ask me anything 💪`;
  }

  // ❓ DEFAULT FALLBACK (IMPROVED)
  return `🤔 I didn’t fully understand "${userMessage}"

💡 Try asking:
- "What should I do when I have cramps?"
- "How do I do a plank?"
- "What should I eat after workout?"
- "How do I fix my squat form?"

If you want, I can still help — just be more specific 💪`;
}

// 💡 SUGGESTED QUESTIONS
export function getSuggestedQuestions(userProfile, phaseInfo) {
  const suggestions = [];

  if (userProfile.gender === 'Female' && phaseInfo) {
    suggestions.push(`What should I do during ${phaseInfo.phase}?`);
    suggestions.push('Can I workout with cramps?');
  } else {
    suggestions.push('How do I build muscle?');
    suggestions.push('Best time to workout?');
  }

  if (userProfile.targetMuscles.includes('Leg')) {
    suggestions.push('How do I squat correctly?');
  }

  if (userProfile.targetMuscles.includes('Arm')) {
    suggestions.push('How do I do bicep curls?');
  }

  suggestions.push('What should I eat after workout?');
  suggestions.push('How do I improve my form?');

  return suggestions;
}

// 🔧 MOCK CONFIG
export function isGeminiConfigured() {
  return true;
}