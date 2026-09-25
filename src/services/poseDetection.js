// MediaPipe zaten package.json'da vardı ama hiç kullanılmıyordu.
// MoveNet yerine buna geçiyoruz çünkü:
// 1) 33 nokta (MoveNet: 17) -> daha fazla detay
// 2) Her nokta için z (derinlik) tahmini de veriyor -> squat gibi öne/arkaya
//    hareket eden egzersizlerde çok daha güvenilir açı hesaplama sağlıyor
// 3) Tek kişi takibi (tracking) MoveNet Lightning'den daha stabil
//
// ÖNEMLİ: @mediapipe/pose npm paketi "Pose" sınıfını gerçek bir ES module
// export'u olarak DEĞİL, <script> etiketiyle yüklendiğinde window.Pose
// global'ine atayarak sağlıyor. `import { Pose } from '@mediapipe/pose'`
// bu yüzden Vite/Rollup ile undefined dönüyor ve detector hiç kurulamıyordu
// (iskelet/sayaç/ses feedback'in hiç çalışmamasının sebebi buydu).
// Çözüm: paketi CDN'den <script> ile yüklüyoruz ve window.Pose'u kullanıyoruz.

const MEDIAPIPE_VERSION = '0.5.1675469404';
const MEDIAPIPE_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/pose.js`;

let pose = null;
let pendingResolve = null;
let modelReady = false;
let scriptLoadingPromise = null;
let initPromise = null; // aynı anda iki kez init edilmeyi engelleyen kilit

function loadMediapipeScript() {
  if (typeof window !== 'undefined' && window.Pose) {
    return Promise.resolve();
  }
  if (scriptLoadingPromise) {
    return scriptLoadingPromise;
  }
  scriptLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${MEDIAPIPE_SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('MediaPipe Pose script could not be loaded')));
      return;
    }
    const script = document.createElement('script');
    script.src = MEDIAPIPE_SCRIPT_URL;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('MediaPipe Pose script could not be loaded'));
    document.head.appendChild(script);
  });
  return scriptLoadingPromise;
}

// MediaPipe'ın 33 noktasını, projenin geri kalanının bildiği eski
// 17 noktalı (COCO/MoveNet) düzenine eşliyoruz. Böylece KEYPOINT_NAMES,
// WorkoutScreen.jsx ve exerciseAnalyzer.js hiç değişmeden çalışmaya devam ediyor.
const MP_TO_COCO = [
  0,  // nose
  2,  // left_eye
  5,  // right_eye
  7,  // left_ear
  8,  // right_ear
  11, // left_shoulder
  12, // right_shoulder
  13, // left_elbow
  14, // right_elbow
  15, // left_wrist
  16, // right_wrist
  23, // left_hip
  24, // right_hip
  25, // left_knee
  26, // right_knee
  27, // left_ankle
  28  // right_ankle
];

/**
 * Pose detection modelini başlat
 */
export async function initPoseDetector() {
  // Zaten hazırsa veya kurulum sürüyorsa, ikinci bir WASM örneği
  // oluşturmak yerine mevcut/devam eden kurulumu döndür.
  if (modelReady && pose) {
    return pose;
  }
  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    try {
      await loadMediapipeScript();

      if (!window.Pose) {
        throw new Error('MediaPipe Pose could not be found on window after script load');
      }

      pose = new window.Pose({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${MEDIAPIPE_VERSION}/${file}`
      });

      pose.setOptions({
        modelComplexity: 1,        // 0=hızlı/az hassas, 1=dengeli, 2=en hassas/yavaş
        smoothLandmarks: true,     // kare-kare titremeyi azaltır
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      pose.onResults((results) => {
        if (pendingResolve) {
          pendingResolve(results);
          pendingResolve = null;
        }
      });

      if (typeof pose.initialize === 'function') {
        await pose.initialize();
      }

      modelReady = true;
      console.log('Pose detector started! (MediaPipe Pose)');
      return pose;
    } catch (error) {
      console.error('Pose detector error:', error);
      // Başarısız kurulumu sıfırla ki sonraki denemede tekrar deneyebilsin
      pose = null;
      modelReady = false;
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Video frame'inden pose'ları tespit et
 * Dönüş formatı eskisiyle aynı: [{ keypoints: [{x, y, z, score}, ...17 nokta] }]
 */
export async function detectPose(video) {
  if (!pose || !modelReady) {
    console.warn('Detector has not been launched yet.');
    return [];
  }

  if (!video.videoWidth || !video.videoHeight) {
    return [];
  }

  try {
    const results = await new Promise((resolve) => {
      pendingResolve = resolve;
      pose.send({ image: video }).catch((err) => {
        pendingResolve = null;
        resolve(null);
        console.error('Pose detection error:', err);
      });
    });

    if (!results || !results.poseLandmarks) {
      return [];
    }

    const width = video.videoWidth;
    const height = video.videoHeight;

    const keypoints = MP_TO_COCO.map((mpIndex) => {
      const lm = results.poseLandmarks[mpIndex];
      return {
        x: lm.x * width,
        y: lm.y * height,
        // z, x ile aynı ölçekte veriliyor (MediaPipe dokümantasyonu);
        // kalçaya göre göreceli derinlik, negatif = kameraya daha yakın
        z: (lm.z || 0) * width,
        score: lm.visibility ?? 0
      };
    });

    return [{ keypoints }];
  } catch (error) {
    console.error('Pose detection error:', error);
    return [];
  }
}

/**
 * Canvas'a iskelet çiz
 */
export function drawSkeleton(poses, canvas, video) {
  if (!poses || poses.length === 0) return;

  const ctx = canvas.getContext('2d');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  poses.forEach(pose => {
    const keypoints = pose.keypoints;

    keypoints.forEach(keypoint => {
      if (keypoint.score > 0.3) {
        const { x, y } = keypoint;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    drawSkeletonLines(ctx, keypoints);
  });
}

function drawSkeletonLines(ctx, keypoints) {
  const connections = [
    [0, 1], [0, 2],
    [1, 3], [2, 4],
    [5, 6],
    [5, 7], [7, 9],
    [6, 8], [8, 10],
    [5, 11], [6, 12],
    [11, 12],
    [11, 13], [13, 15],
    [12, 14], [14, 16]
  ];

  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;

  connections.forEach(([i, j]) => {
    const kp1 = keypoints[i];
    const kp2 = keypoints[j];

    if (kp1.score > 0.3 && kp2.score > 0.3) {
      ctx.beginPath();
      ctx.moveTo(kp1.x, kp1.y);
      ctx.lineTo(kp2.x, kp2.y);
      ctx.stroke();
    }
  });
}

/**
 * İki nokta arasındaki açıyı hesapla (2D - geriye dönük uyumluluk için)
 */
export function calculateAngle(point1, point2, point3) {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);

  if (angle > 180.0) {
    angle = 360 - angle;
  }

  return angle;
}

/**
 * Üç nokta arasındaki açıyı 3D olarak hesapla (z/derinlik dahil).
 * Squat/plank gibi öne-arkaya hareket olan egzersizlerde 2D'den çok
 * daha doğru sonuç verir çünkü kullanıcı kameraya tam yandan durmasa da
 * derinlik bilgisi açıyı düzeltir.
 */
export function calculateAngle3D(point1, point2, point3) {
  const v1 = {
    x: point1.x - point2.x,
    y: point1.y - point2.y,
    z: (point1.z || 0) - (point2.z || 0)
  };
  const v2 = {
    x: point3.x - point2.x,
    y: point3.y - point2.y,
    z: (point3.z || 0) - (point2.z || 0)
  };

  const dot = v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  const mag1 = Math.sqrt(v1.x ** 2 + v1.y ** 2 + v1.z ** 2);
  const mag2 = Math.sqrt(v2.x ** 2 + v2.y ** 2 + v2.z ** 2);

  if (mag1 === 0 || mag2 === 0) return 0;

  const cos = Math.min(1, Math.max(-1, dot / (mag1 * mag2)));
  return Math.acos(cos) * 180 / Math.PI;
}

/**
 * Keypoint isimleri (COCO/MoveNet düzeni - değişmedi)
 */
export const KEYPOINT_NAMES = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16
};

/**
 * Cleanup - detector'ı kapat
 */
export function disposePoseDetector() {
  if (pose) {
    pose.close();
    pose = null;
    modelReady = false;
    initPromise = null;
    console.log('Pose detector turned off');
  }
}
