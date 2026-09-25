#  AI Posture Feedback System

> Real-time AI-powered workout coach that analyzes your form, prevents injuries, and builds personalized programs based on your biology.

 **[Live Demo](https://ai-posture-app-eng.vercel.app/)** &nbsp;|&nbsp; Built with React + TensorFlow.js

---

##  Features

- **Real-time Pose Detection** — MoveNet model tracks 17 body keypoints at 30+ FPS via webcam
- **Voice Feedback** — Instant English audio cues ("Hold your back straight!") via Web Speech API
-  **Hormonal Cycle Planning** — Workout intensity adapts to women's 28-day menstrual cycle phases
-  **Advanced Plank Analysis** — Mathematical hip deviation algorithm (line equation, normalized by body length)
-  **AI Chatbot** — Ai fitness assistant with personalized advice
-  **Progress Tracking** — Charts, streaks, and leaderboard via Chart.js
-  **100% Private** — All processing happens on-device; no video ever leaves your browser

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18.3.1, Vite 5.4.2 |
| AI / Pose | TensorFlow.js 4.21.0, MoveNet SinglePose Lightning |
| Chatbot | Google Gemini Pro API |
| Styling | Tailwind CSS 3.4.0, Lucide React |
| Charts | Chart.js |
| Storage | LocalStorage (offline-first, multi-user) |
| Speech | Web Speech API |
| Deploy | Vercel |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/NisaYurdusever/ai-posture-app.git
cd https://github.com/NisaYurdusever/ai-posture-app.git

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** Allow camera access when prompted. For best results, ensure good lighting and position your full body in frame.

---

##  How It Works

```
Webcam Input
     ↓
TensorFlow.js MoveNet  →  17 Keypoints Detected
     ↓
Form Analysis Engine
  ├── Hip Deviation  (line equation: ax + by + c = 0)
  ├── Head Position  (normalized nose-shoulder distance)
  └── Body Angle     (180° ± 30° tolerance)
     ↓
Voice + Visual Feedback  →  Rep Counter  →  Dashboard
```

---

##  Supported Exercises

| Exercise | Type | Key Analysis |
|---|---|---|
| Plank | Timed | Hip deviation, head position, body angle |
| Squat | Reps | Knee angle ≤ 90°, back straightness |
| Bicep Curl | Reps | State machine (50° up / 140° down) |

---

## Cycle-Based Training (Women)

| Phase | Days | Intensity | Focus |
|---|---|---|---|
| Menstrual | 1–7 | Low | Recovery, light cardio |
| Follicular | 8–14 | High | Strength, heavy lifting |
| Ovulation | 15–21 | Medium | Endurance |
| Luteal | 22–28 | Low | Flexibility, stretching |

---

## Project Structure

```
src/
├── components/
│   ├── AuthScreen.jsx
│   ├── Dashboard.jsx
│   ├── WorkoutScreen.jsx
│   ├── ProfileSetup.jsx
│   ├── AIChatbot.jsx
│   ├── Leaderboard.jsx
│   └── Settings.jsx
├── services/
│   ├── poseDetection.js
│   ├── exerciseAnalyzer.js
│   ├── programGenerator.js
│   ├── storageService.js
│   ├── calorieCalculator.js
│   └── cycleCalculator.js
└── data/
    ├── exercises.json
    └── cyclePhases.json
```

 License

MIT License — feel free to use, modify, and build on this project.
