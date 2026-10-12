/**
 * Authentic Vedic Ashtakoota Kundli Milan & Lal Kitab Engine
 * Implements 36 Guna Ashtakoota calculation according to classical Vedic Astrology:
 * 1. Varna (1 point)
 * 2. Vashya (2 points)
 * 3. Tara (3 points)
 * 4. Yoni (4 points)
 * 5. Graha Maitri (5 points)
 * 6. Gana (6 points)
 * 7. Bhakoot (7 points)
 * 8. Nadi (8 points)
 * Total: 36 Gunas
 */

export interface AstrologicalSign {
  rashi: string;
  rashiIndex: number;
  rashiLord: string;
  nakshatra: string;
  nakshatraIndex: number;
  nakshatraLord: string;
  gana: string;
  yoniName: string;
  nadiName: string;
}

export const RASHIS = [
  { name: "Mesha (Aries)", lord: "Mars", varna: 3, vashya: "Chatushpada" },
  { name: "Vrishabha (Taurus)", lord: "Venus", varna: 2, vashya: "Chatushpada" },
  { name: "Mithuna (Gemini)", lord: "Mercury", varna: 1, vashya: "Manava" },
  { name: "Karka (Cancer)", lord: "Moon", varna: 4, vashya: "Jalachara" },
  { name: "Simha (Leo)", lord: "Sun", varna: 3, vashya: "Vanachara" },
  { name: "Kanya (Virgo)", lord: "Mercury", varna: 2, vashya: "Manava" },
  { name: "Tula (Libra)", lord: "Venus", varna: 1, vashya: "Manava" },
  { name: "Vrishchika (Scorpio)", lord: "Mars", varna: 4, vashya: "Keeta" },
  { name: "Dhanu (Sagittarius)", lord: "Jupiter", varna: 3, vashya: "Manava" },
  { name: "Makara (Capricorn)", lord: "Saturn", varna: 2, vashya: "Jalachara" },
  { name: "Kumbha (Aquarius)", lord: "Saturn", varna: 1, vashya: "Manava" },
  { name: "Meena (Pisces)", lord: "Jupiter", varna: 4, vashya: "Jalachara" },
];

export const YONI_NAMES = [
  "Horse (Ashwa)",
  "Elephant (Gaja)",
  "Sheep (Mesh)",
  "Serpent (Sarpa)",
  "Dog (Shwan)",
  "Cat (Marjara)",
  "Rat (Mushaka)",
  "Cow (Gau)",
  "Buffalo (Mahisha)",
  "Tiger (Vyaghra)",
  "Hare (Shashaka)",
  "Monkey (Vanara)",
  "Mongoose (Nakula)",
  "Lion (Simha)",
];

export const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", gana: "Deva", yoni: 0, nadi: 0 },
  { name: "Bharani", lord: "Venus", gana: "Manushya", yoni: 1, nadi: 1 },
  { name: "Krittika", lord: "Sun", gana: "Rakshasa", yoni: 2, nadi: 2 },
  { name: "Rohini", lord: "Moon", gana: "Manushya", yoni: 3, nadi: 2 },
  { name: "Mrigashira", lord: "Mars", gana: "Deva", yoni: 3, nadi: 1 },
  { name: "Ardra", lord: "Rahu", gana: "Manushya", yoni: 4, nadi: 0 },
  { name: "Punarvasu", lord: "Jupiter", gana: "Deva", yoni: 5, nadi: 0 },
  { name: "Pushya", lord: "Saturn", gana: "Deva", yoni: 2, nadi: 1 },
  { name: "Ashlesha", lord: "Mercury", gana: "Rakshasa", yoni: 5, nadi: 2 },
  { name: "Magha", lord: "Ketu", gana: "Rakshasa", yoni: 6, nadi: 2 },
  { name: "Purva Phalguni", lord: "Venus", gana: "Manushya", yoni: 6, nadi: 1 },
  { name: "Uttara Phalguni", lord: "Sun", gana: "Manushya", yoni: 7, nadi: 0 },
  { name: "Hasta", lord: "Moon", gana: "Deva", yoni: 8, nadi: 0 },
  { name: "Chitra", lord: "Mars", gana: "Rakshasa", yoni: 9, nadi: 1 },
  { name: "Swati", lord: "Rahu", gana: "Deva", yoni: 8, nadi: 2 },
  { name: "Vishakha", lord: "Jupiter", gana: "Rakshasa", yoni: 9, nadi: 2 },
  { name: "Anuradha", lord: "Saturn", gana: "Deva", yoni: 10, nadi: 1 },
  { name: "Jyeshtha", lord: "Mercury", gana: "Rakshasa", yoni: 10, nadi: 0 },
  { name: "Mula", lord: "Ketu", gana: "Rakshasa", yoni: 4, nadi: 0 },
  { name: "Purva Ashadha", lord: "Venus", gana: "Manushya", yoni: 11, nadi: 1 },
  { name: "Uttara Ashadha", lord: "Sun", gana: "Manushya", yoni: 12, nadi: 2 },
  { name: "Shravana", lord: "Moon", gana: "Deva", yoni: 11, nadi: 2 },
  { name: "Dhanishta", lord: "Mars", gana: "Rakshasa", yoni: 13, nadi: 1 },
  { name: "Shatabhisha", lord: "Rahu", gana: "Rakshasa", yoni: 0, nadi: 0 },
  { name: "Purva Bhadrapada", lord: "Jupiter", gana: "Manushya", yoni: 13, nadi: 0 },
  { name: "Uttara Bhadrapada", lord: "Saturn", gana: "Manushya", yoni: 7, nadi: 1 },
  { name: "Revati", lord: "Mercury", gana: "Deva", yoni: 1, nadi: 2 },
];

export const NADI_NAMES = ["Adi (Vata)", "Madhya (Pitta)", "Antya (Kapha)"];

// Planetary Friendship Matrix (0: Enemy, 1: Neutral, 2: Friend)
const PLANET_RELATIONSHIPS: Record<string, Record<string, number>> = {
  Sun: { Sun: 2, Moon: 2, Mars: 2, Jupiter: 2, Mercury: 1, Venus: 0, Saturn: 0 },
  Moon: { Sun: 2, Moon: 2, Mercury: 2, Mars: 1, Jupiter: 1, Venus: 1, Saturn: 1 },
  Mars: { Sun: 2, Moon: 2, Jupiter: 2, Mars: 2, Venus: 1, Saturn: 1, Mercury: 0 },
  Mercury: { Sun: 2, Venus: 2, Mercury: 2, Mars: 1, Jupiter: 1, Saturn: 1, Moon: 0 },
  Jupiter: { Sun: 2, Moon: 2, Mars: 2, Jupiter: 2, Saturn: 1, Mercury: 0, Venus: 0 },
  Venus: { Mercury: 2, Saturn: 2, Venus: 2, Mars: 1, Jupiter: 1, Sun: 0, Moon: 0 },
  Saturn: { Mercury: 2, Venus: 2, Saturn: 2, Jupiter: 1, Sun: 0, Moon: 0, Mars: 0 },
};

// Sworn Enemy Yonis (Hostility)
const SWORN_ENEMY_YONIS: Array<[number, number]> = [
  [0, 8],  // Horse vs Buffalo
  [1, 13], // Elephant vs Lion
  [2, 11], // Sheep vs Monkey
  [3, 12], // Serpent vs Mongoose
  [4, 10], // Dog vs Hare
  [5, 6],  // Cat vs Rat
  [7, 9],  // Cow vs Tiger
];

/**
 * Calculate Sidereal Moon Longitude using astronomical formulas (Lahiri Ayanamsha)
 */
export function getMoonSiderealLongitude(dob?: string | Date | null, birthTime?: string | null): number {
  let date: Date;
  if (dob instanceof Date) {
    date = new Date(dob);
  } else if (dob) {
    date = new Date(dob);
  } else {
    date = new Date("1995-01-01T08:30:00Z");
  }

  if (isNaN(date.getTime())) {
    date = new Date("1995-01-01T08:30:00Z");
  }

  if (birthTime) {
    const timeStr = String(birthTime).trim();
    const match = timeStr.match(/(\d{1,2})[:.](\d{2})/);
    if (match) {
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const lower = timeStr.toLowerCase();
      if (lower.includes("pm") && hours < 12) hours += 12;
      if (lower.includes("am") && hours === 12) hours = 0;
      date.setUTCHours(hours, minutes, 0, 0);
    }
  }

  const jd = date.getTime() / 86400000 + 2440587.5;
  const T = (jd - 2451545.0) / 36525;

  let L0 = 218.3164477 + 481267.88128 * T - 0.0015786 * T * T + (T * T * T) / 538841;
  L0 = ((L0 % 360) + 360) % 360;

  const ayanamsha = 23.85 + (T * 50.29) / 3600;
  const sidereal = ((L0 - ayanamsha) % 360 + 360) % 360;

  return sidereal;
}

/**
 * Derive full astrological profile (Rashi, Nakshatra, Gana, Yoni, Nadi)
 */
export function getAstrologicalSign(dob?: string | Date | null, birthTime?: string | null): AstrologicalSign {
  const sidereal = getMoonSiderealLongitude(dob, birthTime);

  const rashiIndex = Math.floor(sidereal / 30) % 12;
  const nakshatraIndex = Math.floor(sidereal / (360 / 27)) % 27;

  const rashi = RASHIS[rashiIndex];
  const nakshatra = NAKSHATRAS[nakshatraIndex];

  return {
    rashi: rashi.name,
    rashiIndex,
    rashiLord: rashi.lord,
    nakshatra: nakshatra.name,
    nakshatraIndex,
    nakshatraLord: nakshatra.lord,
    gana: nakshatra.gana,
    yoniName: YONI_NAMES[nakshatra.yoni],
    nadiName: NADI_NAMES[nakshatra.nadi],
  };
}

/**
 * Authentic 36 Guna Ashtakoota Milan Engine
 */
export function calculateAuthenticGunaMilan(
  boyDob?: string | Date | null,
  girlDob?: string | Date | null,
  boyTime?: string | null,
  girlTime?: string | null,
  boyManglik?: string | null,
  girlManglik?: string | null
) {
  const boyAstro = getAstrologicalSign(boyDob, boyTime);
  const girlAstro = getAstrologicalSign(girlDob, girlTime);

  const boyRashi = RASHIS[boyAstro.rashiIndex];
  const girlRashi = RASHIS[girlAstro.rashiIndex];

  const boyNakshatra = NAKSHATRAS[boyAstro.nakshatraIndex];
  const girlNakshatra = NAKSHATRAS[girlAstro.nakshatraIndex];

  // 1. Varna (1 Point)
  // Higher or equal Varna of groom is auspicious
  let varna = 0;
  if (boyRashi.varna >= girlRashi.varna) {
    varna = 1;
  }

  // 2. Vashya (2 Points)
  // Mutual dominance & mental attraction
  let vashya = 0;
  if (boyRashi.vashya === girlRashi.vashya) {
    vashya = 2;
  } else if (
    (boyRashi.vashya === "Manava" && girlRashi.vashya === "Jalachara") ||
    (boyRashi.vashya === "Jalachara" && girlRashi.vashya === "Manava") ||
    (boyRashi.vashya === "Chatushpada" && girlRashi.vashya === "Manava")
  ) {
    vashya = 1;
  } else if (boyRashi.vashya === "Vanachara" || girlRashi.vashya === "Vanachara") {
    vashya = 0;
  } else {
    vashya = 0.5;
  }

  // 3. Tara (3 Points)
  // Destiny, Health & Longevity
  const countBoyFromGirl = ((boyAstro.nakshatraIndex - girlAstro.nakshatraIndex + 27) % 27) % 9 + 1;
  const countGirlFromBoy = ((girlAstro.nakshatraIndex - boyAstro.nakshatraIndex + 27) % 27) % 9 + 1;

  const inauspiciousTaras = [3, 5, 7]; // Vipat, Pratyak, Naidhana
  const boyGood = !inauspiciousTaras.includes(countBoyFromGirl);
  const girlGood = !inauspiciousTaras.includes(countGirlFromBoy);

  let tara = 0;
  if (boyGood && girlGood) {
    tara = 3;
  } else if (boyGood || girlGood) {
    tara = 1.5;
  } else {
    tara = 0;
  }

  // 4. Yoni (4 Points)
  // Biological & physical intimacy compatibility
  const boyYoni = boyNakshatra.yoni;
  const girlYoni = girlNakshatra.yoni;

  const isSwornEnemy = SWORN_ENEMY_YONIS.some(
    ([y1, y2]) => (boyYoni === y1 && girlYoni === y2) || (boyYoni === y2 && girlYoni === y1)
  );

  let yoni = 2; // neutral default
  if (boyYoni === girlYoni) {
    yoni = 4;
  } else if (isSwornEnemy) {
    yoni = 0;
  } else {
    const diff = Math.abs(boyYoni - girlYoni);
    if (diff === 1 || diff === 3 || diff === 7) {
      yoni = 3; // Friendly
    } else if (diff === 2 || diff === 4) {
      yoni = 2; // Neutral
    } else {
      yoni = 1; // Passive
    }
  }

  // 5. Graha Maitri (5 Points)
  // Planetary lord harmony & mutual friendship
  const boyLord = boyRashi.lord;
  const girlLord = girlRashi.lord;

  let grahaMaitri = 3;
  if (boyLord === girlLord) {
    grahaMaitri = 5;
  } else {
    const boyRel = PLANET_RELATIONSHIPS[boyLord]?.[girlLord] ?? 1;
    const girlRel = PLANET_RELATIONSHIPS[girlLord]?.[boyLord] ?? 1;

    if (boyRel === 2 && girlRel === 2) {
      grahaMaitri = 5; // Mutual friends
    } else if ((boyRel === 2 && girlRel === 1) || (boyRel === 1 && girlRel === 2)) {
      grahaMaitri = 4; // Friend + Neutral
    } else if (boyRel === 1 && girlRel === 1) {
      grahaMaitri = 3; // Mutual neutrals
    } else if ((boyRel === 2 && girlRel === 0) || (boyRel === 0 && girlRel === 2)) {
      grahaMaitri = 1; // Friend + Enemy
    } else {
      grahaMaitri = 0; // Mutual enemies
    }
  }

  // 6. Gana (6 Points)
  // Behavioral & Temperament compatibility (Deva, Manushya, Rakshasa)
  const boyGana = boyNakshatra.gana;
  const girlGana = girlNakshatra.gana;

  let gana = 0;
  if (boyGana === girlGana) {
    gana = 6;
  } else if (
    (boyGana === "Deva" && girlGana === "Manushya") ||
    (boyGana === "Manushya" && girlGana === "Deva")
  ) {
    gana = 5;
  } else if (boyGana === "Deva" && girlGana === "Rakshasa") {
    gana = 1;
  } else if (boyGana === "Rakshasa" && girlGana === "Deva") {
    gana = 1;
  } else {
    gana = 0; // Manushya + Rakshasa (Gana Dosha)
  }

  // 7. Bhakoot (7 Points)
  // Family prosperity, happiness & health
  const rashiDistance = ((boyAstro.rashiIndex - girlAstro.rashiIndex + 12) % 12) + 1;
  const auspiciousDistances = [1, 7, 3, 4, 10, 11];

  let bhakoot = 0;
  if (auspiciousDistances.includes(rashiDistance)) {
    bhakoot = 7;
  } else {
    // Exceptions (Parihar): Same lord or friendly lords mitigates Bhakoot dosha
    if (boyLord === girlLord || (PLANET_RELATIONSHIPS[boyLord]?.[girlLord] === 2 && PLANET_RELATIONSHIPS[girlLord]?.[boyLord] === 2)) {
      bhakoot = 7;
    } else {
      bhakoot = 0;
    }
  }

  // 8. Nadi (8 Points)
  // Genetic Health, Progeny & Physiological Rhythm
  const boyNadi = boyNakshatra.nadi;
  const girlNadi = girlNakshatra.nadi;

  let nadi = 0;
  if (boyNadi !== girlNadi) {
    nadi = 8; // Different Nadis = 8 points (Auspicious)
  } else {
    nadi = 0; // Same Nadi = 0 points (Nadi Dosha)
  }

  // Total Score (Strict mathematical sum of all 8 components, 0 to 36)
  const totalGuna = Math.round(varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi);

  // Manglik analysis
  const bManglik = (boyManglik || "").toLowerCase().includes("yes") || (boyManglik || "").toLowerCase().includes("manglik");
  const gManglik = (girlManglik || "").toLowerCase().includes("yes") || (girlManglik || "").toLowerCase().includes("manglik");

  let manglikCompatibility = "Compatible";
  let manglikVerdict = "Both horoscopes show harmonious planetary balance.";

  if (bManglik && gManglik) {
    manglikCompatibility = "Both Manglik (Dosha Cancelled - Highly Auspicious)";
    manglikVerdict = "Both individuals are Manglik; according to Vedic astrology, mutual Kuja Dosha is cancelled, ensuring strong marital harmony.";
  } else if (bManglik || gManglik) {
    manglikCompatibility = "Anshik / Partial Manglik Alignment";
    manglikVerdict = "One partner has Manglik influence. Lal Kitab remedies provide easy and effective peace.";
  } else {
    manglikCompatibility = "Non-Manglik Match (Excellent)";
    manglikVerdict = "Neither partner is Manglik. Planetary positions for marital peace and mutual affection are very favorable.";
  }

  const lalKitabData = generateLalKitabRemedies(totalGuna, boyManglik, girlManglik, bhakoot, nadi, grahaMaitri, gana);

  return {
    totalGuna,
    breakdown: {
      varna: { max: 1, scored: varna, label: `Varna: ${boyRashi.varna >= girlRashi.varna ? "Compatible" : "Difference"}` },
      vashya: { max: 2, scored: vashya, label: `Vashya (${boyRashi.vashya} & ${girlRashi.vashya})` },
      tara: { max: 3, scored: tara, label: `Tara (${boyGood && girlGood ? "Shubh" : "Madhyam"})` },
      yoni: { max: 4, scored: yoni, label: `Yoni (${boyAstro.yoniName} & ${girlAstro.yoniName})` },
      grahaMaitri: { max: 5, scored: grahaMaitri, label: `Graha Maitri (${boyLord} & ${girlLord})` },
      gana: { max: 6, scored: gana, label: `Gana (${boyGana} & ${girlGana})` },
      bhakoot: { max: 7, scored: bhakoot, label: `Bhakoot (${bhakoot === 7 ? "Shubh Sanyog" : "Bhakoot Dosha"})` },
      nadi: { max: 8, scored: nadi, label: `Nadi (${nadi === 8 ? "Shubh (Different Nadis)" : "Nadi Dosha (Same Nadi)"})` },
    },
    manglikCompatibility,
    manglikVerdict,
    lalKitabData,
    boyAstro,
    girlAstro,
  };
}

/**
 * Authentic Lal Kitab Dosha & Remedial Engine
 */
export function generateLalKitabRemedies(
  gunaScore: number,
  boyManglik?: string | null,
  girlManglik?: string | null,
  bhakootScore = 7,
  nadiScore = 8,
  grahaMaitriScore = 5,
  ganaScore = 6
) {
  const doshas: Array<{
    name: string;
    hindiName: string;
    severity: "High" | "Medium" | "Low" | "Resolved";
    description: string;
    remedies: string[];
  }> = [];

  const bManglik = (boyManglik || "").toLowerCase().includes("yes") || (boyManglik || "").toLowerCase().includes("manglik");
  const gManglik = (girlManglik || "").toLowerCase().includes("yes") || (girlManglik || "").toLowerCase().includes("manglik");

  // 1. Mangal Dosha
  if (bManglik && gManglik) {
    doshas.push({
      name: "Manglik Cancellation (Shubh Sanyog)",
      hindiName: "मंगल दोष निरस्तीकरण (शुभ संयोग)",
      severity: "Resolved",
      description: "Dono kundliyon me Mangal prabhav hone ke karan mutual dosha shant ho gaya hai. Vivah ke liye atyant shubh hai.",
      remedies: [
        "Vivah ke bad ghar me Tulsi ka paudha lagayein aur niyamit jal dein.",
        "Mangalwar ke din mandir me meetha prasad (batasha ya boondi) bantein.",
      ],
    });
  } else if (bManglik || gManglik) {
    doshas.push({
      name: "Mangal / Kuja Dosha",
      hindiName: "मंगल दोष (लाल किताब निवारण)",
      severity: "Medium",
      description: "Ek partner par Mangal ka vishesh prabhav hai. Lal Kitab ke saral upaye se iska shantimay samadhan sambhav hai.",
      remedies: [
        "Neem ke ped ki jad me meetha kacha doodh aur jal arpit karein.",
        "Chandi ka bina jod wala chhalla (seamless silver ring) ya square chandi ka tukda paas rakhein.",
        "Mangalwar ke din lal masoor ki daal ya gur ka mandir me daan karein.",
        "Bhaiyon aur mitron ke sath sambandh hamesha madhur rakhein.",
      ],
    });
  }

  // 2. Nadi Dosha
  if (nadiScore === 0) {
    doshas.push({
      name: "Nadi Dosha",
      hindiName: "नाड़ी दोष निवारण",
      severity: "High",
      description: "Dono kundliyon me ek hi Nadi hone par swasthya aur santan paksh hetu vishesh Lal Kitab upaye aavashyak hain.",
      remedies: [
        "Mahamrityunjaya Mantra ka jaap karwayein ya niyamit shravan karein.",
        "Gaay (Gau Mata) ko gur aur roti niyamit roop se khilayein.",
        "Chandi ke bartan me jal peena shubh fal dayi hota hai.",
        "Swarna (gold) ya kacha anaj mandir me daan karein.",
      ],
    });
  }

  // 3. Bhakoot Dosha
  if (bhakootScore === 0) {
    doshas.push({
      name: "Bhakoot Dosha",
      hindiName: "भकूट दोष निवारण",
      severity: "Medium",
      description: "Rashi sthiti ke anusar aarthik sthirta aur samasya mukti hetu Shiv kripa aavashyak hai.",
      remedies: [
        "Somwar ko Shivling par kacha doodh, jal aur belpatra arpit karein.",
        "Do moti safed kapde me baandhkar behte saaf paani me pravahit karein.",
        "Gauri Shankar Rudraksha ghar ke mandir me sthapit karein.",
      ],
    });
  }

  // 4. Gana Dosha
  if (ganaScore === 0) {
    doshas.push({
      name: "Gana Dosha",
      hindiName: "गण दोष निवारण",
      severity: "Medium",
      description: "Manushya aur Rakshasa gana ke sanyog me aapsi vichaaron me matbhed ho sakta hai. Upaye se man shant rehta hai.",
      remedies: [
        "Ghar me Gayatri Mantra ya Vishnu Sahasranama ka paath karein.",
        "Gau mata ki sewa karein aur hari ghaas khilayein.",
        "Safed chandan ka tilak lagayein.",
      ],
    });
  }

  // 5. Graha Maitri Alignment
  if (grahaMaitriScore <= 1) {
    doshas.push({
      name: "Graha Maitri Alignment",
      hindiName: "ग्रह मैत्री एवं आपसी तालमेल",
      severity: "Low",
      description: "Aapsi samajhdari aur trust ko mazboot karne ke liye Shukra aur Guru graha ko bal dein.",
      remedies: [
        "Mata Lakshmi aur Vishnu ji ki aarti karein aur Kesar ka tilak lagayein.",
        "Choti kanyaon ko meetha bhojan ya fal bantein.",
      ],
    });
  }

  const universalRemedies = [
    "Ghar ke mandir me hamesha shuddh ghee ka deepak jalayein.",
    "Bado ka aashirwad lein aur ghar ki pehli roti gaay aur aakhiri roti kutte/pakshiyon ko dein.",
    "Kamre me thoda sa kapoor jalane se vaastu aur grah shanti bani rehti hai.",
  ];

  return {
    hasDoshas: doshas.length > 0,
    doshas,
    universalRemedies,
  };
}
