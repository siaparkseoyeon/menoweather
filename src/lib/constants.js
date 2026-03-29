/**
 * constants.js
 * App-wide constants: symptoms, question types, care card matrix, encyclopedia.
 */

// ---------------------------------------------------------------------------
// Symptom definitions (9 tracked + 12 encyclopedia)
// ---------------------------------------------------------------------------

export const SYMPTOM_NAMES = {
  1:  'Hot Flashes & Heat Waves',
  2:  'Sleep Disturbances',
  3:  'Mood Swings',
  4:  'Brain Fog',
  5:  'Fatigue',
  6:  'Aches & Pains',
  7:  'Headaches & Dizziness',
  8:  'Bladder Issues',
  9:  'Other (Skin/Weight)',
  10: 'Skin & Hair Changes',
  11: 'Fatigue & Low Energy',
  12: 'Heart Palpitations',
};

export const SYMPTOMS_9 = [
  { id: 1,  emoji: '😳', name: 'Hot Flashes & Heat Waves',    tier: 1, mapKey: 'baselineHotFlash'  },
  { id: 2,  emoji: '😴', name: 'Sleep Disturbances',          tier: 1, mapKey: 'baselineSleep'     },
  { id: 3,  emoji: '😤', name: 'Mood Swings',                 tier: 1, mapKey: 'baselineMood'      },
  { id: 4,  emoji: '😵', name: 'Brain Fog',                   tier: 2, mapKey: 'baselineBrainFog'  },
  { id: 5,  emoji: '😩', name: 'Fatigue',                     tier: 2, mapKey: 'baseFatigue'       },
  { id: 6,  emoji: '🥴', name: 'Aches & Pains',               tier: 2, mapKey: 'baselineJointPain' },
  { id: 7,  emoji: '🤕', name: 'Headaches & Dizziness',       tier: 3, mapKey: 'baselineHeadache'  },
  { id: 8,  emoji: null, name: 'Bladder Issues',              tier: 3, mapKey: null                },
  { id: 9,  emoji: null, name: 'Other (Skin/Weight)',         tier: 3, mapKey: null                },
];

// ---------------------------------------------------------------------------
// 12 Question Types for daily popups
// ---------------------------------------------------------------------------

export const Q_TYPES = {
  Q01: { label: 'Mood Check',       question: 'How are you feeling right now?',                       hint: 'Be honest — your family will see this.',          type: '1-5' },
  Q02: { label: 'Sleep Aftereffect',question: 'Are you feeling extra sleepy today?',                  hint: 'Tell us how last night went.',                    type: 'yn'  },
  Q03: { label: 'Hot Flash Check',  question: 'Are you experiencing a hot flash right now?',          hint: 'Let us know your current state.',                 type: 'yn'  },
  Q04: { label: 'Mood Shift Check', question: 'Have you noticed any sudden mood shifts today?',       hint: 'It\'s okay to say yes.',                          type: 'yn'  },
  Q05: { label: 'Focus Check',      question: 'Are you having trouble concentrating right now?',      hint: 'Let us know how you\'re managing.',               type: 'yn'  },
  Q06: { label: 'Energy Check',     question: 'Are you feeling particularly tired right now?',        hint: 'Your energy level matters.',                      type: 'yn'  },
  Q07: { label: 'Pain Check',       question: 'Are your joints or muscles aching right now?',        hint: 'Let us know if anything hurts.',                  type: 'yn'  },
  Q08: { label: 'Headache Check',   question: 'Do you have a headache or feel dizzy right now?',     hint: 'Even mild discomfort counts.',                    type: 'yn'  },
  Q09: { label: 'Afternoon Mood',   question: 'How is your mood this afternoon?',                    hint: 'Compare to this morning if you can.',             type: '1-5' },
  Q10: { label: 'Activity Check',   question: 'Has your body felt too heavy to move around today?',  hint: 'Let us know if movement is hard.',                type: 'yn'  },
  Q11: { label: 'Alone Check',      question: 'Do you need some alone time right now?',              hint: 'It\'s completely okay to say yes.',                type: 'yn'  },
  Q12: { label: 'Evening Wrap-Up',  question: 'Overall, how was your day today?',                    hint: 'Take a moment to reflect.',                       type: '1-5' },
};

// Symptom ID → popup question type mapping
export const SYMPTOM_TO_QTYPE = {
  1: 'Q03', // Hot flashes
  2: 'Q02', // Sleep
  3: 'Q04', // Mood swings
  4: 'Q05', // Brain fog
  5: 'Q06', // Fatigue
  6: 'Q07', // Aches & pains
  7: 'Q08', // Headaches
  8: 'Q06', // Bladder (do NOT mention directly — use fatigue proxy)
};

// ---------------------------------------------------------------------------
// 48-cell Care Card Matrix (static fallback)
// Used when Claude API is unavailable; replaced by generateCareCard() when online.
// Row = symptom emoji, Column = weather state W1–W6
// ---------------------------------------------------------------------------

export const CARE_MATRIX = {
  '😴': {
    W1: "She's a bit short on sleep but feeling okay. Give her a little extra space today.",
    W2: "She's tired from tossing and turning. She'll be taking it slow — no rush on anything.",
    W3: "Her body feels heavy from lack of sleep. Let her have some quiet time to rest.",
    W4: "Poor sleep is bringing her down today. A calm, quiet environment will help a lot.",
    W5: "Very tired and may be extra sensitive. Please let her rest deeply without interruption.",
    W6: "Please give her some alone time.",
  },
  '😳': {
    W1: "Hot flashes are coming and going, but she's managing well. Keep the house cool for her.",
    W2: "The sudden flashes are a bit much. She'll be cooling off — a glass of cold water would help.",
    W3: "She's feeling drained from the heat. Lowering the AC a notch would mean a lot.",
    W4: "The heat is making her feel overwhelmed. She needs a calm, cool space to recover.",
    W5: "High discomfort from heat. A cool environment is her top priority right now.",
    W6: "Please give her some alone time.",
  },
  '😤': {
    W1: "Her heart is clear and bright today. She's ready to share some good energy — enjoy it!",
    W2: "She's feeling a little restless but okay. Keep interactions gentle and light.",
    W3: "She feels heavy for no clear reason. Just having you nearby without pressure is enough.",
    W4: "She needs quiet and some time to herself. Don't take it personally — it's the hormones.",
    W5: "She's on edge and overwhelmed. Being left alone right now is the best help you can offer.",
    W6: "Please give her some alone time.",
  },
  '😵': {
    W1: "She's doing great but a little forgetful. Please double-check any shared plans with her.",
    W2: "Her thoughts are moving slowly. Thanks for being patient — she appreciates it.",
    W3: "Focusing is hard today. Save complex conversations or decisions for later.",
    W4: "She's frustrated by her forgetfulness. A small word of encouragement goes a long way.",
    W5: "She can't focus and feels stressed about it. Help her keep track of things without judgment.",
    W6: "Please give her some alone time.",
  },
  '😩': {
    W1: "She's a little tired but her mood is good. Light activity is still on the table.",
    W2: "Her energy is low today. Pitching in with one chore would be a huge help.",
    W3: "Her battery is nearly at zero. Dinner delivery tonight would be a lifesaver.",
    W4: "Completely drained — body and mind. She just needs to fully unplug.",
    W5: "Too exhausted to even talk. She needs a total break from everything, including conversation.",
    W6: "Please give her some alone time.",
  },
  '🥴': {
    W1: "A little achy but doing okay. She'd appreciate if you handle any heavy lifting today.",
    W2: "Feeling stiff and it's hard to move. A light shoulder rub would be amazing.",
    W3: "Her body feels heavy from the pain. She'll be avoiding strenuous activity.",
    W4: "The pain is getting her down. She'll be resting with a warm compress.",
    W5: "She's in a lot of pain and feeling sensitive. She just needs a comfortable place to lie down.",
    W6: "Please give her some alone time.",
  },
  '🤕': {
    W1: "A bit of a headache, but she's okay. Your bright energy is actually the best medicine.",
    W2: "Her head feels a bit heavy. Please keep noise levels down if you can.",
    W3: "Dizzy and nauseous. Keep the lights low and the house quiet.",
    W4: "Her head really hurts. She'll be resting with water nearby — check in gently.",
    W5: "Light and sound are very painful right now. She needs total silence to sleep.",
    W6: "Please give her some alone time.",
  },
  '👻': {
    W1: "She hasn't responded recently. She may be busy or resting — give her space.",
    W2: "She hasn't responded recently. She may be busy or resting — give her space.",
    W3: "She hasn't responded recently. She may be busy or resting — give her space.",
    W4: "She hasn't responded recently. She may be busy or resting — give her space.",
    W5: "She hasn't responded recently. She may be busy or resting — give her space.",
    W6: "She hasn't responded recently. She may be busy or resting — give her space.",
  },
};

// CSS class per symptom emoji
export const CARE_CARD_CSS = {
  '😴': 'sleep',
  '😳': 'hotflash',
  '😤': 'mood',
  '😵': 'brainfog',
  '😩': 'fatigue',
  '🥴': 'joint',
  '🤕': 'headache',
  '👻': 'unknown',
};

// ---------------------------------------------------------------------------
// Encyclopedia: 12-symptom catalog
// ---------------------------------------------------------------------------

export const ENCYCLOPEDIA_12 = [
  {
    id: 1, emoji: '😳', name: 'Hot Flashes & Heat Waves', nameEn: 'Hot Flashes',
    desc: 'Sudden heat surges and sweating',
    articles: [
      { title: 'What Causes Hot Flashes During Menopause?',           source: 'Mayo Clinic',       tags: ['causes'],        hrt: false },
      { title: 'How Long Do Hot Flashes Last?',                        source: 'NAMS',              tags: ['duration'],      hrt: false },
      { title: 'HRT for Hot Flash Relief: What to Expect',            source: 'ACOG',              tags: ['HRT','treatment'],hrt: true  },
      { title: 'Non-Hormonal Options: SSRIs and Gabapentin',          source: 'Cleveland Clinic',  tags: ['non-hormonal'],  hrt: false },
      { title: '8 Lifestyle Changes That Actually Reduce Hot Flashes', source: 'Harvard Health',    tags: ['lifestyle'],     hrt: false },
      { title: 'Cooling Strategies: What the Research Says',           source: 'Healthline',        tags: ['lifestyle'],     hrt: false },
    ],
  },
  {
    id: 2, emoji: '😴', name: 'Sleep Disturbances', nameEn: 'Sleep Disturbances',
    desc: 'Night sweats, insomnia, fragmented sleep',
    articles: [
      { title: 'Why Menopause Disrupts Sleep',                         source: 'NIH',               tags: ['causes'],        hrt: false },
      { title: 'Sleep Hygiene for Menopausal Women',                  source: 'Harvard Health',    tags: ['sleep hygiene'], hrt: false },
      { title: 'Treating Insomnia During Menopause',                  source: 'NAMS',              tags: ['treatment'],     hrt: false },
      { title: 'The Hot Flash–Sleep Connection',                      source: 'Mayo Clinic',       tags: ['brain fog link'],hrt: false },
      { title: 'CBT-I: The Gold Standard for Sleep Problems',         source: 'Cleveland Clinic',  tags: ['treatment'],     hrt: false },
    ],
  },
  {
    id: 3, emoji: '😤', name: 'Mood Swings', nameEn: 'Mood Swings',
    desc: 'Emotional shifts, anxiety, low mood',
    articles: [
      { title: 'Hormones and Mood: The Estrogen Connection',           source: 'ACOG',              tags: ['causes'],            hrt: false },
      { title: 'Distinguishing Depression from Menopause Mood Changes',source: 'Mayo Clinic',       tags: ['severity'],          hrt: false },
      { title: 'Therapy Options for Menopausal Mood',                 source: 'Healthline',        tags: ['treatment'],         hrt: false },
      { title: 'How Families Can Help During Menopause',              source: 'WebMD',             tags: ['family communication'],hrt: false },
    ],
  },
  {
    id: 4, emoji: '😵', name: 'Brain Fog', nameEn: 'Brain Fog',
    desc: 'Reduced concentration and memory lapses',
    articles: [
      { title: "Brain Fog in Menopause: What's Really Happening?",    source: 'NIH',               tags: ['causes'],        hrt: false },
      { title: 'Memory and Concentration During Menopause',           source: 'Harvard Health',    tags: ['duration'],      hrt: false },
      { title: 'Strategies to Sharpen Focus',                         source: 'Cleveland Clinic',  tags: ['focus recovery'],hrt: false },
      { title: 'The Sleep–Brain Fog Feedback Loop',                   source: 'NAMS',              tags: ['sleep link'],    hrt: false },
    ],
  },
  {
    id: 5, emoji: '🤕', name: 'Headaches & Dizziness', nameEn: 'Headaches & Dizziness',
    desc: 'Hormonal headaches and migraines',
    articles: [
      { title: 'Menopause Migraines: Causes and Relief',              source: 'Mayo Clinic',       tags: ['causes','treatment'],  hrt: false },
      { title: 'Dizziness and Vertigo in Perimenopause',              source: 'Healthline',        tags: ['causes'],              hrt: false },
      { title: 'When to See a Doctor About Headaches',                source: 'ACOG',              tags: ['severity'],            hrt: false },
      { title: 'Blood Pressure Changes During Menopause',             source: 'NIH',               tags: ['cardiovascular'],      hrt: false },
    ],
  },
  {
    id: 6, emoji: '🥴', name: 'Aches & Pains', nameEn: 'Aches & Pains',
    desc: 'Joint stiffness and muscle soreness',
    articles: [
      { title: 'Why Joints Hurt More During Menopause',               source: 'NAMS',              tags: ['causes'],        hrt: false },
      { title: 'Best Low-Impact Exercises for Joint Pain',            source: 'Harvard Health',    tags: ['exercise guide'],hrt: false },
      { title: 'Aquatic Therapy: Evidence and Benefits',              source: 'Cleveland Clinic',  tags: ['aquatic/yoga'],  hrt: false },
      { title: 'Anti-Inflammatory Diet for Joint Health',             source: 'WebMD',             tags: ['diet guide'],    hrt: false },
    ],
  },
  {
    id: 7, emoji: '🚻', name: 'Bladder Issues', nameEn: 'Bladder Issues',
    desc: 'Urgency, frequency, and nocturia',
    articles: [
      { title: 'Urinary Urgency and Frequency in Menopause',          source: 'ACOG',              tags: ['causes'],           hrt: false },
      { title: 'Kegel Exercises: A Step-by-Step Guide',               source: 'Mayo Clinic',       tags: ['kegel guide'],      hrt: false },
      { title: 'Hydration Timing to Reduce Nocturia',                 source: 'Healthline',        tags: ['fluid timing'],     hrt: false },
      { title: 'Bladder Training Techniques',                         source: 'Cleveland Clinic',  tags: ['treatment'],        hrt: false },
    ],
  },
  {
    id: 8, emoji: '🌸', name: 'Vaginal Dryness', nameEn: 'Vaginal Dryness',
    desc: 'Vaginal dryness and intimate discomfort',
    articles: [
      { title: 'Vaginal Atrophy: Causes and Treatment',               source: 'Mayo Clinic',       tags: ['causes','treatment'],  hrt: true  },
      { title: 'Local Estrogen Therapy Options',                      source: 'NAMS',              tags: ['HRT','treatment'],     hrt: true  },
      { title: 'Non-Hormonal Lubricants and Moisturizers',            source: 'ACOG',              tags: ['non-hormonal'],        hrt: false },
    ],
  },
  {
    id: 9, emoji: '⚖️', name: 'Weight Changes', nameEn: 'Weight & Belly Fat',
    desc: 'Abdominal fat gain and metabolic shifts',
    articles: [
      { title: 'Why Weight Gain Happens During Menopause',            source: 'Harvard Health',    tags: ['causes'],        hrt: false },
      { title: 'Mediterranean Diet for Menopause Weight Management',  source: 'Healthline',        tags: ['diet guide'],    hrt: false },
      { title: 'Strength Training to Combat Menopausal Weight Gain',  source: 'Mayo Clinic',       tags: ['exercise start'],hrt: false },
    ],
  },
  {
    id: 10, emoji: '✨', name: 'Skin & Hair Changes', nameEn: 'Skin & Hair',
    desc: 'Dryness, loss of elasticity, hair thinning',
    articles: [
      { title: 'Collagen Loss and Estrogen Decline',                  source: 'ACOG',              tags: ['causes','HRT timeline'], hrt: true  },
      { title: 'Skincare Routine for Menopausal Skin',                source: 'Cleveland Clinic',  tags: ['skincare routine'],      hrt: false },
      { title: 'Hair Thinning: Why It Happens and What Helps',        source: 'Healthline',        tags: ['treatment'],             hrt: false },
    ],
  },
  {
    id: 11, emoji: '😩', name: 'Fatigue & Low Energy', nameEn: 'Fatigue',
    desc: 'Chronic tiredness and loss of vitality',
    articles: [
      { title: 'Chronic Fatigue in Perimenopause',                    source: 'NIH',               tags: ['causes'],               hrt: false },
      { title: 'Sleep, Nutrition, and Energy During Menopause',       source: 'Harvard Health',    tags: ['sleep & nutrition'],    hrt: false },
      { title: 'Compound Fatigue: When Sleep and Fatigue Overlap',    source: 'NAMS',              tags: ['compound fatigue'],     hrt: false },
    ],
  },
  {
    id: 12, emoji: '💓', name: 'Heart Palpitations', nameEn: 'Palpitations',
    desc: 'Racing heart and vascular symptoms',
    articles: [
      { title: 'Heart Palpitations During Menopause',                 source: 'Mayo Clinic',       tags: ['causes'],                    hrt: false },
      { title: 'When Palpitations Require Medical Attention',         source: 'ACOG',              tags: ['severity'],                  hrt: false },
      { title: 'Cardiovascular Risk in Menopause',                    source: 'NIH',               tags: ['cardiovascular monitoring'], hrt: false },
    ],
  },
];

// Keyword alias map for encyclopedia search (colloquial → canonical)
export const SEARCH_ALIAS_MAP = {
  'hot flash':       'Hot Flashes',
  'flash':           'Hot Flashes',
  'flush':           'Hot Flashes',
  'sweating':        'Hot Flashes',
  'night sweat':     'Sleep Disturbances',
  'insomnia':        'Sleep Disturbances',
  'cant sleep':      'Sleep Disturbances',
  "can't sleep":     'Sleep Disturbances',
  'brain fog':       'Brain Fog',
  'foggy':           'Brain Fog',
  'forgetful':       'Brain Fog',
  'memory':          'Brain Fog',
  'focus':           'Brain Fog',
  'joint':           'Aches & Pains',
  'knee':            'Aches & Pains',
  'muscle':          'Aches & Pains',
  'ache':            'Aches & Pains',
  'stiff':           'Aches & Pains',
  'bladder':         'Bladder Issues',
  'pee':             'Bladder Issues',
  'urge':            'Bladder Issues',
  'nocturia':        'Bladder Issues',
  'dry':             'Vaginal Dryness',
  'intimate':        'Vaginal Dryness',
  'weight':          'Weight Changes',
  'belly':           'Weight Changes',
  'fat':             'Weight Changes',
  'hair':            'Skin & Hair Changes',
  'skin':            'Skin & Hair Changes',
  'tired':           'Fatigue & Low Energy',
  'exhausted':       'Fatigue & Low Energy',
  'energy':          'Fatigue & Low Energy',
  'mood':            'Mood Swings',
  'irritable':       'Mood Swings',
  'anxious':         'Mood Swings',
  'anxiety':         'Mood Swings',
  'headache':        'Headaches & Dizziness',
  'dizzy':           'Headaches & Dizziness',
  'migraine':        'Headaches & Dizziness',
  'heart':           'Heart Palpitations',
  'palpitation':     'Heart Palpitations',
  'racing heart':    'Heart Palpitations',
  'kegel':           'Bladder Issues',
  'hrt':             'Hot Flashes',
  'hormone':         'Hot Flashes',
  'osteoporosis':    'Aches & Pains',
  'collagen':        'Skin & Hair Changes',
  'sleep hygiene':   'Sleep Disturbances',
  'cardiovascular':  'Heart Palpitations',
};

// Weather state labels (used by prompts)
export const WEATHER_LABELS = {
  W1: 'Clear',
  W2: 'Partly Cloudy',
  W3: 'Overcast',
  W4: 'Rainy',
  W5: 'Stormy',
  W6: 'Foggy',
};
