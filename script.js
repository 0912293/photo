// =========================
// Algemene helpers
// =========================

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choose(arr) {
  return arr[randInt(0, arr.length - 1)];
}

// Reeksen
const shutterValues = ['1"', '1/2', '1/4', '1/8', '1/15', '1/30', '1/60', '1/125', '1/250', '1/500', '1/1000', '1/2000', '1/4000'];
const apertureValues = ['1.4', '2', '2.8', '4', '5.6', '8', '11', '16', '22', '32'];
const isoValues = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12500];

// Normalisatie helpers
function normalizeApertureInput(str) {
  let s = str.toLowerCase().trim();
  s = s.replace('f/', '').replace('f', '').trim();
  return parseFloat(s);
}

function normalizeISOInput(str) {
  return parseInt(str.trim(), 10);
}

function normalizeShutterInput(str) {
  let s = str.toLowerCase().trim();
  s = s.replace('sec', '').replace('s', '').trim();
  if (s === '1' || s === '1.0') return '1"';
  return s;
}

// Helper: parse percentage-style input like 25, 25%, 0.25 or 1/4
function parseIntensityToPercent(raw) {
  let s = raw.trim().toLowerCase().replace(',', '.');
  if (!s) return NaN;

  // Remove optional percent sign
  if (s.endsWith('%')) {
    s = s.slice(0, -1).trim();
  }

  // Fraction form, e.g. "1/4"
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 2) {
      const num = parseFloat(parts[0]);
      const den = parseFloat(parts[1]);
      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return (num / den) * 100;
      }
    }
    return NaN;
  }

  const val = parseFloat(s);
  if (isNaN(val)) return NaN;

  // 0–1 → treat as fraction (0.25 -> 25%)
  if (val > 0 && val <= 1) return val * 100;

  // Otherwise treat as already a percentage (25 -> 25%)
  return val;
}

// Utility: hide explanation at start of each question
function hideExplanation() {
  const exp = document.querySelector('.explanation');
  if (exp && !exp.classList.contains('hidden')) {
    exp.classList.add('hidden');
  }
}

// Utility: show explanation on wrong answer
function showExplanation() {
  const exp = document.querySelector('.explanation');
  if (exp) {
    exp.classList.remove('hidden');
  }
}

// =========================
// BELICHTING QUIZ
// =========================

function setupExposureQuiz() {
  const questionEl = document.getElementById('question');
  const hintEl = document.getElementById('hint');
  const answerEl = document.getElementById('answer');
  const feedbackEl = document.getElementById('feedback');
  const correctEl = document.getElementById('correct-count');
  const wrongEl = document.getElementById('wrong-count');
  const form = document.getElementById('quiz-form');

  let correct = 0;
  let wrong = 0;
  let currentAnswer = null;
  let currentType = null;
  let awaitingNext = false;

  function generateQuestion() {
    awaitingNext = false;
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    answerEl.value = '';
    if (hintEl) hintEl.textContent = '';
    hideExplanation();

    const type = choose(['aperture', 'shutter', 'iso']);
    currentType = type;

    if (type === 'aperture') {
      // Sluitertijd verandert, diafragma zoeken
      while (true) {
        const iISO = randInt(0, isoValues.length - 1);
        const iS = randInt(1, shutterValues.length - 2);
        const iA = randInt(1, apertureValues.length - 2);

        const deltaStopsShutter = choose([-3, -2, -1, 1, 2, 3]);
        const newSIdx = iS - deltaStopsShutter;
        if (newSIdx < 0 || newSIdx >= shutterValues.length) continue;

        const newAIdx = iA + deltaStopsShutter;
        if (newAIdx < 0 || newAIdx >= apertureValues.length) continue;

        const iso = isoValues[iISO];
        const shutterOld = shutterValues[iS];
        const shutterNew = shutterValues[newSIdx];
        const apertureOld = apertureValues[iA];
        const apertureNew = apertureValues[newAIdx];

        questionEl.textContent =
          `Start: ISO ${iso}, ${shutterOld}, f/${apertureOld}. ` +
          `Je verandert de sluitertijd naar ${shutterNew} (ISO blijft gelijk). ` +
          `Welk diafragma heb je nodig voor dezelfde belichting?`;

        currentAnswer = apertureNew;
        break;
      }
    } else if (type === 'shutter') {
      // Diafragma verandert, sluitertijd zoeken
      while (true) {
        const iISO = randInt(0, isoValues.length - 1);
        const iS = randInt(1, shutterValues.length - 2);
        const iA = randInt(1, apertureValues.length - 2);

        const deltaStopsAperture = choose([-3, -2, -1, 1, 2, 3]);
        const newAIdx = iA - deltaStopsAperture;
        if (newAIdx < 0 || newAIdx >= apertureValues.length) continue;

        const newSIdx = iS + deltaStopsAperture;
        if (newSIdx < 0 || newSIdx >= shutterValues.length) continue;

        const iso = isoValues[iISO];
        const shutterOld = shutterValues[iS];
        const shutterNew = shutterValues[newSIdx];
        const apertureOld = apertureValues[iA];
        const apertureNew = apertureValues[newAIdx];

        questionEl.textContent =
          `Start: ISO ${iso}, ${shutterOld}, f/${apertureOld}. ` +
          `Je verandert het diafragma naar f/${apertureNew} (ISO blijft gelijk). ` +
          `Welke sluitertijd heb je nodig voor dezelfde belichting?`;

        currentAnswer = shutterNew;
        break;
      }
    } else if (type === 'iso') {
      // Sluitertijd + diafragma veranderen, ISO zoeken
      while (true) {
        const iISO = randInt(1, isoValues.length - 2);
        const iS = randInt(1, shutterValues.length - 2);
        const iA = randInt(1, apertureValues.length - 2);

        const deltaStopsShutter = choose([-2, -1, 0, 1, 2]);
        const deltaStopsAperture = choose([-2, -1, 0, 1, 2]);
        if (deltaStopsShutter === 0 && deltaStopsAperture === 0) continue;

        const newSIdx = iS - deltaStopsShutter;
        const newAIdx = iA - deltaStopsAperture;
        if (newSIdx < 0 || newSIdx >= shutterValues.length) continue;
        if (newAIdx < 0 || newAIdx >= apertureValues.length) continue;

        const netStops = deltaStopsShutter + deltaStopsAperture;
        const newISOIdx = iISO - netStops;
        if (newISOIdx < 0 || newISOIdx >= isoValues.length) continue;

        const isoOld = isoValues[iISO];
        const isoNew = isoValues[newISOIdx];
        const shutterOld = shutterValues[iS];
        const shutterNew = shutterValues[newSIdx];
        const apertureOld = apertureValues[iA];
        const apertureNew = apertureValues[newAIdx];

        questionEl.textContent =
          `Start: ISO ${isoOld}, ${shutterOld}, f/${apertureOld}. ` +
          `Je verandert de sluitertijd naar ${shutterNew} en het diafragma naar f/${apertureNew}. ` +
          `Welk ISO heb je nodig voor dezelfde belichting?`;

        currentAnswer = isoNew.toString();
        break;
      }
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (awaitingNext) {
      generateQuestion();
      return;
    }

    const raw = answerEl.value;
    if (!raw.trim()) return;

    let isCorrect = false;
    let correctText = '';

    if (currentType === 'aperture') {
      const user = normalizeApertureInput(raw);
      const correctVal = parseFloat(currentAnswer);
      isCorrect = (user === correctVal);
      correctText = 'f/' + currentAnswer;
    } else if (currentType === 'iso') {
      const user = normalizeISOInput(raw);
      const correctVal = parseInt(currentAnswer, 10);
      isCorrect = (user === correctVal);
      correctText = 'ISO ' + currentAnswer;
    } else if (currentType === 'shutter') {
      const user = normalizeShutterInput(raw);
      const correctVal = normalizeShutterInput(currentAnswer);
      isCorrect = (user === correctVal);
      correctText = correctVal;
    }

    if (isCorrect) {
      correct++;
      feedbackEl.textContent = 'Goed! ✅';
      feedbackEl.className = 'feedback-correct';
    } else {
      wrong++;
      feedbackEl.textContent =
        `Niet helemaal. Juiste antwoord: ${correctText}\n` +
        `Uitleg: tel hoeveel stops je sluitertijd/ISO verandert en pas het diafragma, ` +
        `de sluitertijd of ISO met hetzelfde aantal stops in tegengestelde richting aan.`;
      feedbackEl.className = 'feedback-wrong';
      showExplanation();
    }

    correctEl.textContent = correct.toString();
    wrongEl.textContent = wrong.toString();
    awaitingNext = true;
  }

  form.addEventListener('submit', handleSubmit);
  generateQuestion();
}

// =========================
// RICHTGETAL QUIZ
// =========================

function setupFlashQuiz() {
  const questionEl = document.getElementById('question');
  const hintEl = document.getElementById('hint');
  const answerEl = document.getElementById('answer');
  const feedbackEl = document.getElementById('feedback');
  const correctEl = document.getElementById('correct-count');
  const wrongEl = document.getElementById('wrong-count');
  const form = document.getElementById('quiz-form');

  let correct = 0;
  let wrong = 0;
  let currentAnswer = null;
  let currentType = null; // 'aperture' or 'distance'
  let awaitingNext = false;

  function generateQuestion() {
    awaitingNext = false;
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    answerEl.value = '';
    if (hintEl) hintEl.textContent = '';
    hideExplanation();

    const type = choose(['aperture', 'distance']);
    currentType = type;

    const apertureOptions = [2, 2.8, 4, 5.6, 8, 11, 16];
    const aperture = choose(apertureOptions);
    const distance = randInt(1, 10); // meters

    const guideNumberRaw = aperture * distance;
    const guideNumberDisplay = Math.round(guideNumberRaw * 10) / 10; // clean text

    if (type === 'aperture') {
      questionEl.textContent =
        `Je flitser heeft een richtgetal (GN) van ${guideNumberDisplay} bij ISO 100. ` +
        `Je onderwerp staat op ${distance} meter. Welk diafragma moet je gebruiken?`;
      currentAnswer = aperture.toString();
    } else {
      questionEl.textContent =
        `Je flitser heeft een richtgetal (GN) van ${guideNumberDisplay} bij ISO 100. ` +
        `Je fotografeert op f/${aperture}. Op welke afstand (in meters) kan je onderwerp maximaal staan?`;
      currentAnswer = distance.toString();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (awaitingNext) {
      generateQuestion();
      return;
    }

    const raw = answerEl.value;
    if (!raw.trim()) return;

    let isCorrect = false;
    let correctText = '';

    if (currentType === 'aperture') {
      const user = normalizeApertureInput(raw);
      const correctVal = parseFloat(currentAnswer);
      isCorrect = (user === correctVal);
      correctText = 'f/' + currentAnswer;
    } else {
      const user = parseFloat(raw.trim().replace(',', '.'));
      const correctVal = parseFloat(currentAnswer);
      isCorrect = (user === correctVal);
      correctText = correctVal + ' m';
    }

    if (isCorrect) {
      correct++;
      feedbackEl.textContent = 'Goed! ✅';
      feedbackEl.className = 'feedback-correct';
    } else {
      wrong++;
      const label = currentType === 'aperture' ? 'diafragma' : 'afstand';
      feedbackEl.textContent =
        `Niet helemaal. Juiste ${label}: ${correctText}\n` +
        `Uitleg: gebruik GN = afstand × diafragma en los de onbekende variabele op ` +
        `(GN gedeeld door afstand óf GN gedeeld door diafragma).`;
      feedbackEl.className = 'feedback-wrong';
      showExplanation();
    }

    correctEl.textContent = correct.toString();
    wrongEl.textContent = wrong.toString();
    awaitingNext = true;
  }

  form.addEventListener('submit', handleSubmit);
  generateQuestion();
}

// =========================
// OMGEKEERDE KWADRATEN QUIZ
// =========================

function setupInverseSquareQuiz() {
  const questionEl = document.getElementById('question');
  const hintEl = document.getElementById('hint');
  const answerEl = document.getElementById('answer');
  const feedbackEl = document.getElementById('feedback');
  const correctEl = document.getElementById('correct-count');
  const wrongEl = document.getElementById('wrong-count');
  const form = document.getElementById('quiz-form');

  let correct = 0;
  let wrong = 0;
  let currentAnswer = null;
  let currentType = null; // 'percentage' or 'distance'
  let awaitingNext = false;

  function generateQuestion() {
    awaitingNext = false;
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    answerEl.value = '';
    if (hintEl) hintEl.textContent = '';
    hideExplanation();

    const type = choose(['percentage', 'distance']);
    currentType = type;

    const baseDistance = 1; // 1 m at 100%
    const baseIntensity = 100;

    if (type === 'percentage') {
      const newDistance = randInt(2, 10); // 2–10 m
      const intensity = Math.round(baseIntensity * Math.pow(baseDistance / newDistance, 2));
      questionEl.textContent =
        `Op ${baseDistance} meter is de lichtintensiteit ${baseIntensity}%. ` +
        `Hoeveel procent intensiteit heb je op ${newDistance} meter? (omgekeerde kwadratenwet)`;
      currentAnswer = intensity.toString();
    } else {
      const newDistance = randInt(2, 10); // 2–10 m
      const intensity = Math.round(baseIntensity * Math.pow(baseDistance / newDistance, 2));
      questionEl.textContent =
        `Op ${baseDistance} meter is de lichtintensiteit ${baseIntensity}%. ` +
        `Bij welke afstand is de intensiteit ongeveer ${intensity}%?`;
      currentAnswer = newDistance.toString();
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (awaitingNext) {
      generateQuestion();
      return;
    }

    const raw = answerEl.value;
    if (!raw.trim()) return;

    const correctVal = parseFloat(currentAnswer);
    let isCorrect = false;
    let correctText = '';

    if (currentType === 'percentage') {
      const userPercent = parseIntensityToPercent(raw);
      if (!isNaN(userPercent)) {
        isCorrect = Math.round(userPercent) === Math.round(correctVal);
      }
      correctText = `${correctVal}%`;
    } else {
      const user = parseFloat(raw.trim().replace(',', '.'));
      if (!isNaN(user)) {
        isCorrect = Math.abs(user - correctVal) < 0.2;
      }
      correctText = `${correctVal} m`;
    }

    if (isCorrect) {
      correct++;
      feedbackEl.textContent = 'Goed! ✅';
      feedbackEl.className = 'feedback-correct';
    } else {
      wrong++;
      feedbackEl.textContent =
        `Niet helemaal. Juiste antwoord: ${correctText}\n` +
        `Uitleg: lichtintensiteit volgt I ~ 1 / afstand². ` +
        `Als je de afstand n keer zo groot maakt, wordt de intensiteit 1 / n² van de oorspronkelijke waarde.`;
      feedbackEl.className = 'feedback-wrong';
      showExplanation();
    }

    correctEl.textContent = correct.toString();
    wrongEl.textContent = wrong.toString();
    awaitingNext = true;
  }

  form.addEventListener('submit', handleSubmit);
  generateQuestion();
}

// =========================
// HYPERFOCALE AFSTAND QUIZ
// =========================

function setupHyperfocalQuiz() {
  const questionEl = document.getElementById('question');
  const hintEl = document.getElementById('hint');
  const answerEl = document.getElementById('answer');
  const feedbackEl = document.getElementById('feedback');
  const correctEl = document.getElementById('correct-count');
  const wrongEl = document.getElementById('wrong-count');
  const form = document.getElementById('quiz-form');

  let correct = 0;
  let wrong = 0;
  let currentAnswer = null;
  let awaitingNext = false;

  function generateQuestion() {
    awaitingNext = false;
    feedbackEl.textContent = '';
    feedbackEl.className = '';
    answerEl.value = '';
    if (hintEl) hintEl.textContent = '';
    hideExplanation();

    const sensorType = choose(['Full-frame', 'APS-C']);
    const focalLengths = [20, 24, 28, 35, 50]; // mm
    const apertures = [8, 11, 16];

    const f = choose(focalLengths); // mm
    const N = choose(apertures);
    const c = sensorType === 'Full-frame' ? 0.03 : 0.02; // mm

    // H in mm, using H = f^2 / (N * c) + f
    const H_mm = (f * f) / (N * c) + f;
    const H_m = H_mm / 1000;
    const rounded = Math.round(H_m * 10) / 10; // one decimal

    questionEl.textContent =
      `Je gebruikt een ${sensorType}-camera met een ${f}mm lens op f/${N}. ` +
      `Circle of confusion c = ${c}mm. Wat is ongeveer de hyperfocale afstand H (in meters, op één decimaal)?`;

    currentAnswer = rounded;
  }

  function handleSubmit(e) {
    e.preventDefault();

    if (awaitingNext) {
      generateQuestion();
      return;
    }

    const raw = answerEl.value;
    if (!raw.trim()) return;

    const user = parseFloat(raw.trim().replace(',', '.'));
    const correctVal = currentAnswer;

    const isCorrect = !isNaN(user) && Math.abs(user - correctVal) <= 0.2;

    if (isCorrect) {
      correct++;
      feedbackEl.textContent = `Goed! ✅ (Exact: ${correctVal.toFixed(1)} m)`;
      feedbackEl.className = 'feedback-correct';
    } else {
      wrong++;
      feedbackEl.textContent =
        `Niet helemaal. Ongeveer: ${correctVal.toFixed(1)} m\n` +
        `Uitleg: gebruik H ≈ f² / (N × c) + f (in mm) en deel de uitkomst door 1000 om meters te krijgen.`;
      feedbackEl.className = 'feedback-wrong';
      showExplanation();
    }

    correctEl.textContent = correct.toString();
    wrongEl.textContent = wrong.toString();
    awaitingNext = true;
  }

  form.addEventListener('submit', handleSubmit);
  generateQuestion();
}

// =========================
// THEMA (licht/donker)
// =========================

function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('dark-theme');
  } else {
    document.body.classList.remove('dark-theme');
  }

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    if (document.body.classList.contains('dark-theme')) {
      btn.textContent = '☀️ Lichte modus';
    } else {
      btn.textContent = '🌙 Donkere modus';
    }
  }
}

function initTheme() {
  const saved = localStorage.getItem('photoTheme');
  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  const btn = document.getElementById('theme-toggle-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      const newTheme = document.body.classList.contains('dark-theme')
        ? 'light'
        : 'dark';
      applyTheme(newTheme);
      localStorage.setItem('photoTheme', newTheme);
    });
  }
}

// =========================
// INIT ALLES
// =========================

document.addEventListener('DOMContentLoaded', () => {
  initTheme();

  const bodyId = document.body.id;
  if (!bodyId) return;

  if (bodyId === 'exposure-page') {
    setupExposureQuiz();
  } else if (bodyId === 'flash-page') {
    setupFlashQuiz();
  } else if (bodyId === 'inverse-page') {
    setupInverseSquareQuiz();
  } else if (bodyId === 'hyperfocal-page') {
    setupHyperfocalQuiz();
  }
});
