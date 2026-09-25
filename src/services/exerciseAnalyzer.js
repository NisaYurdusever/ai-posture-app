import { calculateAngle3D, KEYPOINT_NAMES } from './poseDetection';

/**
 * Egzersize özel form analizi
 * @param {string} exerciseId - Egzersiz ID'si
 * @param {Array} keypoints - Tespit edilen keypoint'ler
 * @returns {Object} { feedback, speech, type, isCorrect }
 *
 * NOT (kısaltılmış sesli geri bildirim): `feedback` alanı ekranda gösterilen
 * tam açıklama metni - DEĞİŞMEDİ. `speech` alanı ise sadece sesli okuma
 * (speechSynthesis) için eklenen KISA versiyon - kullanıcılardan "İngilizce
 * sesli uyarı çok uzun ve kulak tırmalayıcı" geri bildirimi geldiği için
 * eklendi. WorkoutScreen artık speakFeedback çağrısında `speech` alanını
 * kullanıyor (yoksa `feedback`'e düşüyor). Ekrandaki metinlere dokunulmadı.
 */
export function analyzeExerciseForm(exerciseId, keypoints, fitnessLevel = 'beginner') {
  const minConfidence = 0.3;
  const validKeypoints = keypoints.filter(kp => kp.score > minConfidence);

  if (validKeypoints.length < 10) {
    return {
      feedback: 'Your whole body should be visible',
      speech: 'Stay in frame',
      type: 'warning',
      isCorrect: false
    };
  }

  switch (exerciseId) {
    case 'plank':
      return analyzePlankAdvanced(keypoints);
    case 'squat':
      return analyzeSquat(keypoints, fitnessLevel);
    case 'bicep-curl':
      return analyzeBicepCurl(keypoints, fitnessLevel);
    case 'push-up':
      return analyzePushUp(keypoints, fitnessLevel);
    case 'lunge':
      return analyzeLunge(keypoints, fitnessLevel);
    case 'shoulder-press':
      return analyzeShoulderPress(keypoints, fitnessLevel);
    case 'sit-up':
      return analyzeSitUp(keypoints, fitnessLevel);
    case 'glute-bridge':
      return analyzeGluteBridge(keypoints, fitnessLevel);
    case 'jumping-jack':
      return analyzeJumpingJack(keypoints, fitnessLevel);
    default:
      return {
        feedback: 'Check your form',
        speech: 'Check your form',
        type: 'neutral',
        isCorrect: true
      };
  }
}

/**
 * Kullanıcı kameraya sağ veya sol tarafını dönmüş olabilir (ya da tam karşıdan
 * durabilir). Hangi tarafın keypoint'leri daha güvenilirse (görünürse) o
 * tarafı kullanıyoruz, böylece "sadece sol taraf" varsayımı kaldırılmış oluyor.
 */
function pickSide(keypoints, jointNames) {
  const leftScore = jointNames.reduce(
    (sum, name) => sum + keypoints[KEYPOINT_NAMES[`LEFT_${name}`]].score, 0
  );
  const rightScore = jointNames.reduce(
    (sum, name) => sum + keypoints[KEYPOINT_NAMES[`RIGHT_${name}`]].score, 0
  );

  const prefix = rightScore > leftScore ? 'RIGHT' : 'LEFT';
  const joints = {};
  jointNames.forEach(name => {
    joints[name.toLowerCase()] = keypoints[KEYPOINT_NAMES[`${prefix}_${name}`]];
  });
  return joints;
}

/**
 * Fitness seviyesine göre ekstra tolerans (derece) döndürür.
 * ÖNEMLİ TASARIM KARARI: 'advanced' seviyesi = orijinal katı/profesyonel
 * eşiklerin BİREBİR AYNISI (0 ekstra tolerans) - yani bu sistemi eklemek
 * gelişmiş kullanıcılar için hiçbir şeyi değiştirmiyor. Sadece beginner/
 * intermediate için "ne kadar derine inmen/kolun ne kadar bükülmesi
 * gerekiyor" gibi EFOR/ESNEKLİK gerektiren eşiklere ekstra pay veriyor.
 * Sakatlanmayı önleyen kontroller (diz parmak ucunu geçmesin, dirsek
 * sabit dursun, plank'ta kalça/baş pozisyonu) bu toleranstan hiç
 * etkilenmiyor - herkes için aynı ve katı kalıyor.
 */
function getLevelLeniency(fitnessLevel) {
  switch (fitnessLevel) {
    case 'advanced': return 0;
    case 'intermediate': return 8;
    case 'beginner':
    default: return 16;
  }
}
function analyzePlankAdvanced(keypoints) {
  const { shoulder, hip, ankle } = pickSide(keypoints, ['SHOULDER', 'HIP', 'ANKLE']);
  const nose = keypoints[KEYPOINT_NAMES.NOSE];

  if (shoulder.score < 0.3 || hip.score < 0.3 || ankle.score < 0.3 || nose.score < 0.3) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const bodyLength = Math.sqrt(
    Math.pow(shoulder.x - ankle.x, 2) + Math.pow(shoulder.y - ankle.y, 2)
  );

  // Omuz-ayak çizgisinin denklemi: ax + by + c = 0
  const a = ankle.y - shoulder.y;
  const b = shoulder.x - ankle.x;
  const c = ankle.x * shoulder.y - shoulder.x * ankle.y;

  const hipDeviation = Math.abs(a * hip.x + b * hip.y + c) /
                       Math.sqrt(a * a + b * b) / bodyLength;

  const HIP_THRESHOLD = 0.025;

  const headHeightDiff = (nose.y - shoulder.y) / bodyLength;
  const HEAD_UP_THRESHOLD = 0.035;
  const HEAD_DOWN_THRESHOLD = 0.14;

  const bodyAngle = calculateAngle3D(shoulder, hip, ankle);
  const ANGLE_THRESHOLD = 30;

  if (hipDeviation > HIP_THRESHOLD && hip.y < shoulder.y - 20) {
    return {
      feedback: 'Your hips are too high! Engage your core and lower your hips',
      speech: 'Lower your hips',
      type: 'error',
      isCorrect: false
    };
  }

  if (hipDeviation > HIP_THRESHOLD && hip.y > shoulder.y + 20) {
    return {
      feedback: 'Your back is too low! Tighten your core and lift your hips',
      speech: 'Lift your hips',
      type: 'error',
      isCorrect: false
    };
  }

  if (headHeightDiff < -HEAD_UP_THRESHOLD) {
    return {
      feedback: 'Your neck is too tense! Lower your head, keep your neck neutral',
      speech: 'Relax your neck',
      type: 'error',
      isCorrect: false
    };
  }

  if (headHeightDiff > HEAD_DOWN_THRESHOLD) {
    return {
      feedback: 'Your head is too low! Lift it a bit, keep your spine straight',
      speech: 'Lift your head',
      type: 'warning',
      isCorrect: false
    };
  }

  if (Math.abs(180 - bodyAngle) > ANGLE_THRESHOLD) {
    return {
      feedback: 'Get into the plank position! Keep your body straight from head to heels',
      speech: 'Straighten your body',
      type: 'warning',
      isCorrect: false
    };
  }

  if (hipDeviation > HIP_THRESHOLD * 0.7) {
    return {
      feedback: 'Your hips are slightly deviated! Keep your body straight',
      speech: 'Straighten your hips',
      type: 'warning',
      isCorrect: false
    };
  }

  return {
    feedback: 'Great plank form! Keep it up!',
    speech: 'Great form!',
    type: 'good',
    isCorrect: true
  };
}

/**
 * Squat analizi
 */
function analyzeSquat(keypoints, fitnessLevel) {
  const { hip, knee, ankle, shoulder } = pickSide(keypoints, ['HIP', 'KNEE', 'ANKLE', 'SHOULDER']);

  if (hip.score < 0.3 || knee.score < 0.3 || ankle.score < 0.3) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const kneeAngle = calculateAngle3D(hip, knee, ankle);
  const backAngle = calculateAngle3D(shoulder, hip, knee);
  const leniency = getLevelLeniency(fitnessLevel);

  // Baldır uzunluğuna (diz-ayak bileği) göre normalize edilmiş eşik.
  // Eskiden sabit 50px'ti; bu, kameraya yakın/uzak durunca anlamsız oluyordu.
  // Sakatlanma riski taşıyan bir kontrol olduğu için seviyeye göre gevşemiyor.
  const shinLength = Math.sqrt(
    Math.pow(knee.x - ankle.x, 2) + Math.pow(knee.y - ankle.y, 2)
  );
  const kneeOverToe = (knee.x - ankle.x) > shinLength * 0.35;

  if (kneeOverToe) {
    return { feedback: 'Knees are going over the toes', speech: 'Knees past your toes', type: 'error', isCorrect: false };
  }

  // "İyi squat" derinlik aralığı, profesyonel hedef olan 90 derece etrafında
  // sabit kalıyor ama yeni başlayanlar için üst sınır (o kadar derine
  // inememe payı) genişliyor - hareketi "squat" olmaktan çıkarmadan.
  const goodMin = 80 - leniency * 0.5;
  const goodMax = 100 + leniency;

  if (kneeAngle >= goodMin && kneeAngle <= goodMax) {
    if (backAngle > 150) {
      return { feedback: 'Great squat! Knees and back are perfect', speech: 'Great squat!', type: 'good', isCorrect: true };
    } else {
      return { feedback: 'Keep your back straight', speech: 'Straighten your back', type: 'warning', isCorrect: false };
    }
  } else if (kneeAngle > goodMax && kneeAngle < 140) {
    return { feedback: 'Go deeper (90 degrees)', speech: 'Go deeper', type: 'warning', isCorrect: false };
  } else if (kneeAngle >= 140) {
    return { feedback: 'Get into the squat position', speech: 'Get ready to squat', type: 'neutral', isCorrect: false };
  } else {
    return { feedback: 'You are too deep! Be careful with your knees', speech: 'Careful, too deep', type: 'warning', isCorrect: false };
  }
}

/**
 * Bicep Curl analizi
 */
function analyzeBicepCurl(keypoints, fitnessLevel) {
  const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);

  if (shoulder.score < 0.25 || elbow.score < 0.25 || wrist.score < 0.25) {
    return { feedback: 'Your whole arm should be visible', speech: 'Show your arm', type: 'warning', isCorrect: false };
  }

  const elbowAngle = calculateAngle3D(shoulder, elbow, wrist);
  const leniency = getLevelLeniency(fitnessLevel);

  // Dirsek sabitliği, üst kol (omuz-dirsek) uzunluğuna göre normalize edildi.
  // Sakatlanma/hile (momentum kullanma) kontrolü olduğu için sabit kalıyor.
  const upperArmLength = Math.sqrt(
    Math.pow(elbow.x - shoulder.x, 2) + Math.pow(elbow.y - shoulder.y, 2)
  );
  const elbowStable = Math.abs(elbow.x - shoulder.x) < upperArmLength * 0.6;

  if (!elbowStable) {
    return { feedback: 'Your elbow is moving back! Keep it stable', speech: 'Keep your elbow still', type: 'error', isCorrect: false };
  }

  // Tam kıvrım hedefi <45 derece - yeni başlayanlar için pay tanınıyor
  const fullCurlThreshold = 45 + leniency;

  if (elbowAngle < fullCurlThreshold) {
    return { feedback: 'Great curl! Keep it up', speech: 'Great curl!', type: 'good', isCorrect: true };
  } else if (elbowAngle > 150) {
    return { feedback: 'Good! Now lift it up', speech: 'Now curl up', type: 'good', isCorrect: true };
  } else if (elbowAngle >= fullCurlThreshold && elbowAngle <= 90) {
    return { feedback: 'Keep going, squeeze the muscles', speech: 'Keep curling', type: 'neutral', isCorrect: true };
  } else {
    return { feedback: 'Slowly lower it down', speech: 'Lower slowly', type: 'neutral', isCorrect: true };
  }
}

/**
 * Push-up analizi
 */
function analyzePushUp(keypoints, fitnessLevel) {
  const { shoulder, elbow, wrist, hip, ankle } = pickSide(
    keypoints, ['SHOULDER', 'ELBOW', 'WRIST', 'HIP', 'ANKLE']
  );

  if (shoulder.score < 0.25 || elbow.score < 0.25 || wrist.score < 0.25 || hip.score < 0.25 || ankle.score < 0.25) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const elbowAngle = calculateAngle3D(shoulder, elbow, wrist);
  const bodyAngle = calculateAngle3D(shoulder, hip, ankle);
  const leniency = getLevelLeniency(fitnessLevel);

  // Vücut hattının düz olması sakatlanmayı önleyen bir kontrol - herkes için sabit.
  if (Math.abs(180 - bodyAngle) > 20) {
    return {
      feedback: "Keep your body in a straight line, don't let your hips sag or pike up",
      speech: 'Keep your body straight',
      type: 'error',
      isCorrect: false
    };
  }

  // Tam derinlik hedefi <=90 derece - yeni başlayanlar için pay tanınıyor
  const depthThreshold = 90 + leniency;

  if (elbowAngle <= depthThreshold) {
    return { feedback: 'Great depth! Now push back up', speech: 'Great depth!', type: 'good', isCorrect: true };
  } else if (elbowAngle > 150) {
    return { feedback: 'Good extension! Lower back down with control', speech: 'Lower with control', type: 'good', isCorrect: true };
  } else {
    return { feedback: 'Keep going, control the movement', speech: 'Keep going', type: 'neutral', isCorrect: true };
  }
}

/**
 * Lunge analizi
 */
function analyzeLunge(keypoints, fitnessLevel) {
  const { hip, knee, ankle, shoulder } = pickSide(keypoints, ['HIP', 'KNEE', 'ANKLE', 'SHOULDER']);

  if (hip.score < 0.3 || knee.score < 0.3 || ankle.score < 0.3) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const kneeAngle = calculateAngle3D(hip, knee, ankle);
  const torsoAngle = calculateAngle3D(shoulder, hip, knee);
  const leniency = getLevelLeniency(fitnessLevel);

  // Diz-parmak ucu kontrolü sakatlanma riski taşıyor - herkes için sabit.
  const shinLength = Math.sqrt(
    Math.pow(knee.x - ankle.x, 2) + Math.pow(knee.y - ankle.y, 2)
  );
  const kneeOverToe = (knee.x - ankle.x) > shinLength * 0.4;

  if (kneeOverToe) {
    return { feedback: 'Your front knee is going past your toes', speech: 'Knee past your toes', type: 'error', isCorrect: false };
  }

  const goodMin = 80 - leniency * 0.5;
  const goodMax = 100 + leniency;

  if (kneeAngle >= goodMin && kneeAngle <= goodMax) {
    if (torsoAngle > 150) {
      return { feedback: 'Great lunge! Nice depth and upright torso', speech: 'Great lunge!', type: 'good', isCorrect: true };
    } else {
      return { feedback: 'Keep your torso upright', speech: 'Stay upright', type: 'warning', isCorrect: false };
    }
  } else if (kneeAngle > goodMax && kneeAngle < 140) {
    return { feedback: 'Lower down a bit more (aim for 90 degrees)', speech: 'Lower a bit more', type: 'warning', isCorrect: false };
  } else if (kneeAngle >= 140) {
    return { feedback: 'Get into the lunge position', speech: 'Get ready to lunge', type: 'neutral', isCorrect: false };
  } else {
    return { feedback: "You're too deep! Ease up slightly", speech: 'Ease up a bit', type: 'warning', isCorrect: false };
  }
}

/**
 * Shoulder Press analizi
 */
function analyzeShoulderPress(keypoints, fitnessLevel) {
  const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);

  if (shoulder.score < 0.25 || elbow.score < 0.25 || wrist.score < 0.25) {
    return { feedback: 'Your whole arm should be visible', speech: 'Show your arm', type: 'warning', isCorrect: false };
  }

  const elbowAngle = calculateAngle3D(shoulder, elbow, wrist);
  const isOverhead = wrist.y < shoulder.y - 20; // Ekranda y küçüldükçe yukarı demek
  const leniency = getLevelLeniency(fitnessLevel);

  // Tam açılım hedefi >150 derece - yeni başlayanlar için pay tanınıyor
  // (omuz esnekliği kısıtlıysa tam kilitlenme zor olabilir)
  const fullExtensionThreshold = 150 - leniency;

  if (elbowAngle > fullExtensionThreshold) {
    if (isOverhead) {
      return { feedback: 'Great! Fully extended overhead', speech: 'Great extension!', type: 'good', isCorrect: true };
    } else {
      return { feedback: 'Press the weight fully overhead, arms straight above your shoulders', speech: 'Press fully overhead', type: 'warning', isCorrect: false };
    }
  } else if (elbowAngle >= 90) {
    return { feedback: 'Pressing up, keep going', speech: 'Keep pressing', type: 'neutral', isCorrect: true };
  } else {
    return { feedback: 'Start position - elbows at shoulder height', speech: 'Get ready', type: 'neutral', isCorrect: true };
  }
}

/**
 * Sit-up analizi
 */
function analyzeSitUp(keypoints, fitnessLevel) {
  const { shoulder, hip, knee } = pickSide(keypoints, ['SHOULDER', 'HIP', 'KNEE']);

  if (shoulder.score < 0.25 || hip.score < 0.25 || knee.score < 0.25) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const angle = calculateAngle3D(shoulder, hip, knee);
  const leniency = getLevelLeniency(fitnessLevel);

  // Tam kıvrım hedefi <100 derece - yeni başlayanlar (zayıf karın kasları
  // ya da sırt esnekliği) için pay tanınıyor
  const goodThreshold = 100 + leniency;

  if (angle < goodThreshold) {
    return { feedback: 'Great crunch! Now lower back down with control', speech: 'Great crunch!', type: 'good', isCorrect: true };
  } else if (angle < 150) {
    return { feedback: 'Keep curling up', speech: 'Keep curling up', type: 'neutral', isCorrect: true };
  } else {
    return { feedback: 'Curl up using your abs, not your neck', speech: 'Use your abs', type: 'neutral', isCorrect: true };
  }
}

/**
 * Glute Bridge analizi
 */
function analyzeGluteBridge(keypoints, fitnessLevel) {
  const { shoulder, hip, knee } = pickSide(keypoints, ['SHOULDER', 'HIP', 'KNEE']);

  if (shoulder.score < 0.25 || hip.score < 0.25 || knee.score < 0.25) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const angle = calculateAngle3D(shoulder, hip, knee);
  const leniency = getLevelLeniency(fitnessLevel);

  // Tam kalça açılımı hedefi >160 derece - yeni başlayanlar için pay tanınıyor
  const goodThreshold = 160 - leniency;
  const midThreshold = 130 - leniency * 0.5;

  if (angle > goodThreshold) {
    return { feedback: 'Great bridge! Squeeze your glutes at the top', speech: 'Great bridge!', type: 'good', isCorrect: true };
  } else if (angle > midThreshold) {
    return { feedback: 'Lift your hips a bit higher', speech: 'Lift a bit higher', type: 'neutral', isCorrect: true };
  } else {
    return { feedback: 'Push through your heels and lift your hips', speech: 'Push through your heels', type: 'neutral', isCorrect: true };
  }
}

/**
 * Jumping Jack analizi
 * Tek taraf yeterli olmadığı için (kollar ve bacaklar simetrik hareket eder)
 * pickSide kullanmıyoruz, her iki tarafı birden okuyoruz.
 */
function analyzeJumpingJack(keypoints, fitnessLevel) {
  const leftWrist = keypoints[KEYPOINT_NAMES.LEFT_WRIST];
  const rightWrist = keypoints[KEYPOINT_NAMES.RIGHT_WRIST];
  const leftShoulder = keypoints[KEYPOINT_NAMES.LEFT_SHOULDER];
  const rightShoulder = keypoints[KEYPOINT_NAMES.RIGHT_SHOULDER];
  const leftAnkle = keypoints[KEYPOINT_NAMES.LEFT_ANKLE];
  const rightAnkle = keypoints[KEYPOINT_NAMES.RIGHT_ANKLE];
  const leftHip = keypoints[KEYPOINT_NAMES.LEFT_HIP];
  const rightHip = keypoints[KEYPOINT_NAMES.RIGHT_HIP];

  const minScore = Math.min(
    leftWrist.score, rightWrist.score, leftShoulder.score, rightShoulder.score,
    leftAnkle.score, rightAnkle.score, leftHip.score, rightHip.score
  );

  if (minScore < 0.25) {
    return { feedback: 'Your whole body should be visible', speech: 'Stay in frame', type: 'warning', isCorrect: false };
  }

  const { armsUp, legsApart } = getJumpingJackPose(
    leftWrist, rightWrist, leftShoulder, rightShoulder, leftAnkle, rightAnkle, leftHip, rightHip, fitnessLevel
  );

  if (armsUp && legsApart) {
    return { feedback: 'Great! Arms up, legs apart', speech: 'Great!', type: 'good', isCorrect: true };
  } else if (!armsUp && !legsApart) {
    return { feedback: 'Ready position', speech: 'Ready position', type: 'neutral', isCorrect: true };
  } else {
    return { feedback: 'Fully raise your arms overhead and spread your legs together with the jump', speech: 'Arms up, legs apart', type: 'warning', isCorrect: false };
  }
}

function getJumpingJackPose(leftWrist, rightWrist, leftShoulder, rightShoulder, leftAnkle, rightAnkle, leftHip, rightHip, fitnessLevel) {
  const leniency = getLevelLeniency(fitnessLevel);
  const hipWidth = Math.hypot(leftHip.x - rightHip.x, leftHip.y - rightHip.y);
  const ankleDistance = Math.hypot(leftAnkle.x - rightAnkle.x, leftAnkle.y - rightAnkle.y);

  // Kollar tam kafanın üstüne çıkmasa bile (omuz esnekliği kısıtlıysa)
  // yeni başlayanlar için biraz daha az yükseklik yeterli sayılıyor
  const armsUp = leftWrist.y < leftShoulder.y - (20 + leniency) && rightWrist.y < rightShoulder.y - (20 + leniency);
  // Bacak açıklığı çarpanı, yeni başlayanlar için biraz düşürülüyor (1.8 -> 1.8'e kadar 0.3 azalma)
  const legSpreadMultiplier = 1.8 - (leniency / 16) * 0.3;
  const legsApart = ankleDistance > hipWidth * legSpreadMultiplier;

  return { armsUp, legsApart };
}

/**
 * Test/kalibrasyon modu için: analiz mantığına dokunmadan, ilgili
 * egzersizin ham açı değerlerini döndürür. WorkoutScreen'deki debug
 * paneli bunu gösteriyor, böylece "çalışmıyor" yerine gerçek sayılarla
 * eşik değerlerini (threshold) ayarlayabiliyoruz.
 */
export function getDebugAngles(exerciseId, keypoints) {
  try {
    switch (exerciseId) {
      case 'plank': {
        const { shoulder, hip, ankle } = pickSide(keypoints, ['SHOULDER', 'HIP', 'ANKLE']);
        return { 'body angle': Math.round(calculateAngle3D(shoulder, hip, ankle)) };
      }
      case 'squat':
      case 'lunge': {
        const { hip, knee, ankle } = pickSide(keypoints, ['HIP', 'KNEE', 'ANKLE']);
        return { 'knee angle': Math.round(calculateAngle3D(hip, knee, ankle)) };
      }
      case 'bicep-curl':
      case 'push-up':
      case 'shoulder-press': {
        const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);
        return { 'elbow angle': Math.round(calculateAngle3D(shoulder, elbow, wrist)) };
      }
      case 'sit-up':
      case 'glute-bridge': {
        const { shoulder, hip, knee } = pickSide(keypoints, ['SHOULDER', 'HIP', 'KNEE']);
        return { 'hip angle': Math.round(calculateAngle3D(shoulder, hip, knee)) };
      }
      case 'jumping-jack': {
        const leftWrist = keypoints[KEYPOINT_NAMES.LEFT_WRIST];
        const rightWrist = keypoints[KEYPOINT_NAMES.RIGHT_WRIST];
        const leftShoulder = keypoints[KEYPOINT_NAMES.LEFT_SHOULDER];
        const rightShoulder = keypoints[KEYPOINT_NAMES.RIGHT_SHOULDER];
        const leftAnkle = keypoints[KEYPOINT_NAMES.LEFT_ANKLE];
        const rightAnkle = keypoints[KEYPOINT_NAMES.RIGHT_ANKLE];
        const leftHip = keypoints[KEYPOINT_NAMES.LEFT_HIP];
        const rightHip = keypoints[KEYPOINT_NAMES.RIGHT_HIP];
        const { armsUp, legsApart } = getJumpingJackPose(
          leftWrist, rightWrist, leftShoulder, rightShoulder, leftAnkle, rightAnkle, leftHip, rightHip
        );
        return { 'arms up': armsUp ? 'yes' : 'no', 'legs apart': legsApart ? 'yes' : 'no' };
      }
      default:
        return {};
    }
  } catch {
    return {};
  }
}

/**
 * Rep sayacı
 * Kamera titremesi (jitter) yüzünden açı eşiğin etrafında salınırsa,
 * ardışık "tamamlandı" tetiklenmelerini MIN_REP_INTERVAL_MS ile
 * engelliyoruz - aksi halde saniyede onlarca kez tetiklenip hem sayaç
 * çılgına dönüyor hem de her tetiklemede çağrılan sesli geri bildirim
 * (speechSynthesis.cancel()+speak() art arda) sekmeyi dondurabiliyor.
 */
const MIN_REP_INTERVAL_MS = 400;

export function detectRepCompletion(exerciseId, keypoints, prevState = { phase: 'down', angle: 180, lastRepAt: 0 }, fitnessLevel = 'beginner') {
  const now = Date.now();
  const lastRepAt = prevState.lastRepAt || 0;
  const leniency = getLevelLeniency(fitnessLevel);

  // Basit açı-eşik state machine'i - çoğu egzersiz için ortak desen.
  // downTest: "aşağı/başlangıç" fazına geçiş şartı, upTest: "yukarı/tamamlandı" şartı.
  function angleStateMachine(angle, downTest, upTest, downPhase, upPhase) {
    if (prevState.phase === downPhase && downTest(angle)) {
      return { repCompleted: false, newState: { phase: upPhase, angle, lastRepAt } };
    }
    if (prevState.phase === upPhase && upTest(angle)) {
      if (now - lastRepAt < MIN_REP_INTERVAL_MS) {
        return { repCompleted: false, newState: { phase: downPhase, angle, lastRepAt } };
      }
      return { repCompleted: true, newState: { phase: downPhase, angle, lastRepAt: now } };
    }
    return { repCompleted: false, newState: { phase: prevState.phase, angle, lastRepAt } };
  }

  if (exerciseId === 'bicep-curl') {
    const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);
    if (shoulder.score < 0.3 || elbow.score < 0.3 || wrist.score < 0.3) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(shoulder, elbow, wrist);
    // down = kol düz (>140), up = kıvrılmış (<50, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a < 50 + leniency, (a) => a > 140, 'down', 'up');
  }

  if (exerciseId === 'squat') {
    const { hip, knee, ankle } = pickSide(keypoints, ['HIP', 'KNEE', 'ANKLE']);
    if (hip.score < 0.3 || knee.score < 0.3 || ankle.score < 0.3) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(hip, knee, ankle);
    // up = ayakta (>150), down = çömelmiş (<100, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a > 150, (a) => a < 100 + leniency, 'up', 'down');
  }

  if (exerciseId === 'push-up') {
    const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);
    if (shoulder.score < 0.25 || elbow.score < 0.25 || wrist.score < 0.25) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(shoulder, elbow, wrist);
    // up = kollar düz (>150), down = alçalmış (<=90, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a > 150, (a) => a <= 90 + leniency, 'up', 'down');
  }

  if (exerciseId === 'lunge') {
    const { hip, knee, ankle } = pickSide(keypoints, ['HIP', 'KNEE', 'ANKLE']);
    if (hip.score < 0.3 || knee.score < 0.3 || ankle.score < 0.3) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(hip, knee, ankle);
    return angleStateMachine(angle, (a) => a > 150, (a) => a < 100 + leniency, 'up', 'down');
  }

  if (exerciseId === 'shoulder-press') {
    const { shoulder, elbow, wrist } = pickSide(keypoints, ['SHOULDER', 'ELBOW', 'WRIST']);
    if (shoulder.score < 0.25 || elbow.score < 0.25 || wrist.score < 0.25) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(shoulder, elbow, wrist);
    // down = dirsekler bükülü/omuz hizası (<90), up = tam açık overhead (>150, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a > 150 - leniency, (a) => a < 90, 'up', 'down');
  }

  if (exerciseId === 'sit-up') {
    const { shoulder, hip, knee } = pickSide(keypoints, ['SHOULDER', 'HIP', 'KNEE']);
    if (shoulder.score < 0.25 || hip.score < 0.25 || knee.score < 0.25) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(shoulder, hip, knee);
    // down = sırtüstü düz (>150), up = kıvrılmış (<100, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a < 100 + leniency, (a) => a > 150, 'down', 'up');
  }

  if (exerciseId === 'glute-bridge') {
    const { shoulder, hip, knee } = pickSide(keypoints, ['SHOULDER', 'HIP', 'KNEE']);
    if (shoulder.score < 0.25 || hip.score < 0.25 || knee.score < 0.25) {
      return { repCompleted: false, newState: prevState };
    }
    const angle = calculateAngle3D(shoulder, hip, knee);
    // down = kalça yerde (<130), up = kalça kaldırılmış/düz hat (>160, beginner'da daha gevşek)
    return angleStateMachine(angle, (a) => a > 160 - leniency, (a) => a < 130, 'up', 'down');
  }

  if (exerciseId === 'jumping-jack') {
    const leftWrist = keypoints[KEYPOINT_NAMES.LEFT_WRIST];
    const rightWrist = keypoints[KEYPOINT_NAMES.RIGHT_WRIST];
    const leftShoulder = keypoints[KEYPOINT_NAMES.LEFT_SHOULDER];
    const rightShoulder = keypoints[KEYPOINT_NAMES.RIGHT_SHOULDER];
    const leftAnkle = keypoints[KEYPOINT_NAMES.LEFT_ANKLE];
    const rightAnkle = keypoints[KEYPOINT_NAMES.RIGHT_ANKLE];
    const leftHip = keypoints[KEYPOINT_NAMES.LEFT_HIP];
    const rightHip = keypoints[KEYPOINT_NAMES.RIGHT_HIP];

    const minScore = Math.min(
      leftWrist.score, rightWrist.score, leftShoulder.score, rightShoulder.score,
      leftAnkle.score, rightAnkle.score, leftHip.score, rightHip.score
    );
    if (minScore < 0.25) {
      return { repCompleted: false, newState: prevState };
    }

    const { armsUp, legsApart } = getJumpingJackPose(
      leftWrist, rightWrist, leftShoulder, rightShoulder, leftAnkle, rightAnkle, leftHip, rightHip, fitnessLevel
    );
    const isOpen = armsUp && legsApart;

    // "closed" (ayakta, kollar yanda) -> "open" (kollar yukarda, bacaklar açık)
    // -> tekrar "closed" olunca bir tekrar tamamlanmış sayılır.
    if (prevState.phase === 'closed' && isOpen) {
      return { repCompleted: false, newState: { phase: 'open', angle: 0, lastRepAt } };
    }
    if (prevState.phase === 'open' && !isOpen) {
      if (now - lastRepAt < MIN_REP_INTERVAL_MS) {
        return { repCompleted: false, newState: { phase: 'closed', angle: 0, lastRepAt } };
      }
      return { repCompleted: true, newState: { phase: 'closed', angle: 0, lastRepAt: now } };
    }
    return { repCompleted: false, newState: { phase: prevState.phase, angle: 0, lastRepAt } };
  }

  return { repCompleted: false, newState: prevState };
}