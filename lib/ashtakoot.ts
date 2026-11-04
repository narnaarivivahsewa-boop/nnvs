/**
 * Ashtakoot (36 Gunas) Kundli Milan & Manglik Dosha Calculator
 * Pure TypeScript implementation without external astronomy dependencies.
 * Zero 'any' declarations for complete strict type safety.
 */

export interface BirthDetails {
  name: string;
  dob: string | Date;
  time: string; // HH:mm (24-hour or 12-hour format)
  place: string;
}

export type VarnaCategory = "Brahmin" | "Kshatriya" | "Vaishya" | "Shudra";
export type VashyaCategory = "Chatushpada" | "Manav" | "Jalchar" | "Vanachara" | "Keeta";
export type GanaCategory = "Deva" | "Manushya" | "Rakshasa";
export type NadiCategory = "Aadi" | "Madhya" | "Antya";

export interface CelestialProfile {
  name: string;
  dob: Date;
  time: string;
  place: string;
  moonLongitude: number;
  marsLongitude: number;
  rasiIndex: number;
  rasiName: string;
  rasiLord: string;
  nakshatraIndex: number;
  nakshatraName: string;
  nakshatraLord: string;
  charan: number;
  varna: VarnaCategory;
  vashya: VashyaCategory;
  yoniAnimal: string;
  gana: GanaCategory;
  nadi: NadiCategory;
  isManglik: boolean;
  manglikHouses: number[];
}

export interface AshtakootScore {
  name: string;
  nameHindi: string;
  obtained: number;
  total: number;
  description: string;
  boyAttribute: string;
  girlAttribute: string;
  isFavorable: boolean;
}

export interface ManglikAnalysis {
  boyManglik: boolean;
  girlManglik: boolean;
  status: "NO_MANGLIK" | "BOTH_MANGLIK" | "BOY_MANGLIK" | "GIRL_MANGLIK";
  details: string;
  isCanceled: boolean;
}

export interface KundliMilanResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  verdict: string;
  verdictHindi: string;
  verdictDescription: string;
  isRecommended: boolean;
  boyInfo: {
    name: string;
    rasi: string;
    nakshatra: string;
    nakshatraLord: string;
    charan: number;
    manglik: boolean;
  };
  girlInfo: {
    name: string;
    rasi: string;
    nakshatra: string;
    nakshatraLord: string;
    charan: number;
    manglik: boolean;
  };
  scores: AshtakootScore[];
  manglikAnalysis: ManglikAnalysis;
}

const RASI_NAMES: readonly string[] = [
  "Mesha (Aries)",
  "Vrishabha (Taurus)",
  "Mithuna (Gemini)",
  "Karka (Cancer)",
  "Simha (Leo)",
  "Kanya (Virgo)",
  "Tula (Libra)",
  "Vrishchika (Scorpio)",
  "Dhanu (Sagittarius)",
  "Makara (Capricorn)",
  "Kumbha (Aquarius)",
  "Meena (Pisces)",
] as const;

const RASI_LORDS: readonly string[] = [
  "Mars",    // Mesha
  "Venus",   // Vrishabha
  "Mercury", // Mithuna
  "Moon",    // Karka
  "Sun",     // Simha
  "Mercury", // Kanya
  "Venus",   // Tula
  "Mars",    // Vrishchika
  "Jupiter", // Dhanu
  "Saturn",  // Makara
  "Saturn",  // Kumbha
  "Jupiter", // Meena
] as const;

const NAKSHATRA_NAMES: readonly string[] = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashirsha",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati",
] as const;

const NAKSHATRA_LORDS: readonly string[] = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury",
] as const;

const NAKSHATRA_YONI_ANIMALS: readonly string[] = [
  "Horse",     // 0 Ashwini
  "Elephant",  // 1 Bharani
  "Sheep",     // 2 Krittika
  "Serpent",   // 3 Rohini
  "Serpent",   // 4 Mrigashirsha
  "Dog",       // 5 Ardra
  "Cat",       // 6 Punarvasu
  "Sheep",     // 7 Pushya
  "Cat",       // 8 Ashlesha
  "Rat",       // 9 Magha
  "Rat",       // 10 Purva Phalguni
  "Cow",       // 11 Uttara Phalguni
  "Buffalo",   // 12 Hasta
  "Tiger",     // 13 Chitra
  "Buffalo",   // 14 Swati
  "Tiger",     // 15 Vishakha
  "Deer",      // 16 Anuradha
  "Deer",      // 17 Jyeshtha
  "Dog",       // 18 Mula
  "Monkey",    // 19 Purva Ashadha
  "Mongoose",  // 20 Uttara Ashadha
  "Monkey",    // 21 Shravana
  "Lion",      // 22 Dhanishta
  "Horse",     // 23 Shatabhisha
  "Lion",      // 24 Purva Bhadrapada
  "Cow",       // 25 Uttara Bhadrapada
  "Elephant",  // 26 Revati
] as const;

const NAKSHATRA_GANAS: readonly GanaCategory[] = [
  "Deva",     // 0 Ashwini
  "Manushya", // 1 Bharani
  "Rakshasa", // 2 Krittika
  "Manushya", // 3 Rohini
  "Deva",     // 4 Mrigashirsha
  "Manushya", // 5 Ardra
  "Deva",     // 6 Punarvasu
  "Deva",     // 7 Pushya
  "Rakshasa", // 8 Ashlesha
  "Rakshasa", // 9 Magha
  "Manushya", // 10 Purva Phalguni
  "Manushya", // 11 Uttara Phalguni
  "Deva",     // 12 Hasta
  "Rakshasa", // 13 Chitra
  "Deva",     // 14 Swati
  "Rakshasa", // 15 Vishakha
  "Deva",     // 16 Anuradha
  "Rakshasa", // 17 Jyeshtha
  "Rakshasa", // 18 Mula
  "Manushya", // 19 Purva Ashadha
  "Manushya", // 20 Uttara Ashadha
  "Deva",     // 21 Shravana
  "Rakshasa", // 22 Dhanishta
  "Rakshasa", // 23 Shatabhisha
  "Manushya", // 24 Purva Bhadrapada
  "Manushya", // 25 Uttara Bhadrapada
  "Deva",     // 26 Revati
] as const;

const NAKSHATRA_NADIS: readonly NadiCategory[] = [
  "Aadi",   // 0 Ashwini
  "Madhya", // 1 Bharani
  "Antya",  // 2 Krittika
  "Antya",  // 3 Rohini
  "Madhya", // 4 Mrigashirsha
  "Aadi",   // 5 Ardra
  "Aadi",   // 6 Punarvasu
  "Madhya", // 7 Pushya
  "Antya",  // 8 Ashlesha
  "Antya",  // 9 Magha
  "Madhya", // 10 Purva Phalguni
  "Aadi",   // 11 Uttara Phalguni
  "Aadi",   // 12 Hasta
  "Madhya", // 13 Chitra
  "Antya",  // 14 Swati
  "Antya",  // 15 Vishakha
  "Madhya", // 16 Anuradha
  "Aadi",   // 17 Jyeshtha
  "Aadi",   // 18 Mula
  "Madhya", // 19 Purva Ashadha
  "Antya",  // 20 Uttara Ashadha
  "Antya",  // 21 Shravana
  "Madhya", // 22 Dhanishta
  "Aadi",   // 23 Shatabhisha
  "Aadi",   // 24 Purva Bhadrapada
  "Madhya", // 25 Uttara Bhadrapada
  "Antya",  // 26 Revati
] as const;

/**
 * Parses time string like "14:30" or "02:30 PM" into decimal hours [0, 24).
 */
function parseTimeToHours(timeStr: string): number {
  const clean = timeStr.trim().toUpperCase();
  const isPM = clean.includes("PM");
  const isAM = clean.includes("AM");
  const stripped = clean.replace(/[^\d:]/g, "");
  const parts = stripped.split(":");
  let hours = Number.parseInt(parts[0] || "12", 10);
  const minutes = Number.parseInt(parts[1] || "0", 10);

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return Math.min(23.99, Math.max(0, hours + minutes / 60));
}

/**
 * Computes Julian Day in UT from calendar date and local Indian Standard Time (UTC+5:30).
 */
function getJulianDay(date: Date, localHours: number): number {
  let y = date.getUTCFullYear();
  let m = date.getUTCMonth() + 1;
  const d = date.getUTCDate();

  // Convert IST (UTC+5:30) to UT
  let utHours = localHours - 5.5;
  let dayAdjust = 0;
  if (utHours < 0) {
    utHours += 24;
    dayAdjust = -1;
  } else if (utHours >= 24) {
    utHours -= 24;
    dayAdjust = 1;
  }

  const adjustedDay = d + dayAdjust;

  if (m <= 2) {
    y -= 1;
    m += 12;
  }

  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    adjustedDay +
    b -
    1524.5 +
    utHours / 24.0
  );
}

/**
 * Calculates Sidereal Moon Longitude using Jean Meeus lunar model and Lahiri Ayanamsha.
 */
function calculateSiderealMoonLongitude(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  const degToRad = Math.PI / 180;

  // Lahiri Ayanamsha at epoch J2000
  const ayanamsha = 23.857 + 1.3969 * t;

  // Mean orbital elements (in degrees)
  const l0 = (218.3164477 + 481267.88123421 * t) % 360; // Moon mean longitude
  const d = (297.8501921 + 445267.1114034 * t) % 360;    // Mean elongation
  const m = (357.5291092 + 35999.0502909 * t) % 360;     // Sun mean anomaly
  const mm = (134.9633964 + 477198.8675055 * t) % 360;   // Moon mean anomaly

  // Dominant periodic perturbations (degrees)
  let lambda =
    l0 +
    6.2888 * Math.sin(mm * degToRad) +
    1.274 * Math.sin((2 * d - mm) * degToRad) +
    0.6583 * Math.sin(2 * d * degToRad) +
    0.2136 * Math.sin(2 * mm * degToRad) -
    0.1856 * Math.sin(m * degToRad) -
    0.1143 * Math.sin(2 * (d - m) * degToRad);

  lambda = ((lambda % 360) + 360) % 360;

  // Sidereal longitude = Tropical - Lahiri Ayanamsha
  const sidereal = ((lambda - ayanamsha) % 360 + 360) % 360;
  return sidereal;
}

/**
 * Calculates Sidereal Mars Longitude for Manglik dosha identification.
 */
function calculateSiderealMarsLongitude(jd: number): number {
  const t = (jd - 2451545.0) / 36525;
  const degToRad = Math.PI / 180;

  const ayanamsha = 23.857 + 1.3969 * t;

  const lMars = (355.433 + 19140.299 * t) % 360;
  const mMars = (19.373 + 19139.855 * t) % 360;

  // Mars Equation of Center
  const eqCenter = 10.691 * Math.sin(mMars * degToRad) + 0.623 * Math.sin(2 * mMars * degToRad);
  const tropicalMars = ((lMars + eqCenter) % 360 + 360) % 360;

  return ((tropicalMars - ayanamsha) % 360 + 360) % 360;
}

/**
 * Derives full celestial profile for a person.
 */
export function getCelestialProfile(person: BirthDetails): CelestialProfile {
  const birthDate = person.dob instanceof Date ? person.dob : new Date(person.dob);
  const localHours = parseTimeToHours(person.time || "12:00");
  const jd = getJulianDay(birthDate, localHours);

  const moonLong = calculateSiderealMoonLongitude(jd);
  const marsLong = calculateSiderealMarsLongitude(jd);

  // Rasi (0..11) - each sign is 30 degrees
  const rasiIndex = Math.floor(moonLong / 30) % 12;

  // Nakshatra (0..26) - each nakshatra is 13°20' (13.3333 degrees)
  const nakshatraArc = 360 / 27;
  const nakshatraIndex = Math.floor(moonLong / nakshatraArc) % 27;

  // Charan/Pada (1..4)
  const charanArc = nakshatraArc / 4;
  const remainderInNakshatra = moonLong % nakshatraArc;
  const charan = Math.floor(remainderInNakshatra / charanArc) + 1;

  // Varna: 4 classes based on Moon Rasi
  // Water: Brahmin (Cancer, Scorpio, Pisces)
  // Fire: Kshatriya (Aries, Leo, Sagittarius)
  // Earth: Vaishya (Taurus, Virgo, Capricorn)
  // Air: Shudra (Gemini, Libra, Aquarius)
  let varna: VarnaCategory = "Shudra";
  if ([3, 7, 11].includes(rasiIndex)) varna = "Brahmin";
  else if ([0, 4, 8].includes(rasiIndex)) varna = "Kshatriya";
  else if ([1, 5, 9].includes(rasiIndex)) varna = "Vaishya";
  else varna = "Shudra";

  // Vashya: 5 classifications
  let vashya: VashyaCategory = "Manav";
  if ([0, 1, 9].includes(rasiIndex)) vashya = "Chatushpada";
  else if ([3, 11].includes(rasiIndex)) vashya = "Jalchar";
  else if (rasiIndex === 4) vashya = "Vanachara";
  else if (rasiIndex === 7) vashya = "Keeta";
  else vashya = "Manav";

  const yoniAnimal = NAKSHATRA_YONI_ANIMALS[nakshatraIndex] || "Deer";
  const gana = NAKSHATRA_GANAS[nakshatraIndex] || "Manushya";
  const nadi = NAKSHATRA_NADIS[nakshatraIndex] || "Madhya";

  // Manglik identification: Mars in 1, 2, 4, 7, 8, 12 from Moon Rasi
  const marsRasi = Math.floor(marsLong / 30) % 12;
  const houseFromMoon = ((marsRasi - rasiIndex + 12) % 12) + 1;
  const manglikHouses = [1, 2, 4, 7, 8, 12];
  const isManglik = manglikHouses.includes(houseFromMoon);

  return {
    name: person.name,
    dob: birthDate,
    time: person.time,
    place: person.place,
    moonLongitude: moonLong,
    marsLongitude: marsLong,
    rasiIndex,
    rasiName: RASI_NAMES[rasiIndex] || "Mesha (Aries)",
    rasiLord: RASI_LORDS[rasiIndex] || "Mars",
    nakshatraIndex,
    nakshatraName: NAKSHATRA_NAMES[nakshatraIndex] || "Ashwini",
    nakshatraLord: NAKSHATRA_LORDS[nakshatraIndex] || "Ketu",
    charan,
    varna,
    vashya,
    yoniAnimal,
    gana,
    nadi,
    isManglik,
    manglikHouses: isManglik ? [houseFromMoon] : [],
  };
}

/**
 * 1. Varna Score (Max: 1)
 */
function calculateVarnaScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  const varnaRank: Record<VarnaCategory, number> = {
    Brahmin: 4,
    Kshatriya: 3,
    Vaishya: 2,
    Shudra: 1,
  };

  const bRank = varnaRank[boy.varna];
  const gRank = varnaRank[girl.varna];
  const obtained = bRank >= gRank ? 1 : 0;

  return {
    name: "Varna",
    nameHindi: "वर्ण",
    obtained,
    total: 1,
    description: "Measures spiritual and ego compatibility.",
    boyAttribute: boy.varna,
    girlAttribute: girl.varna,
    isFavorable: obtained === 1,
  };
}

/**
 * 2. Vashya Score (Max: 2)
 */
function calculateVashyaScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  let obtained = 0;
  if (boy.vashya === girl.vashya) {
    obtained = 2;
  } else if (
    (boy.vashya === "Manav" && (girl.vashya === "Chatushpada" || girl.vashya === "Jalchar")) ||
    (girl.vashya === "Manav" && (boy.vashya === "Chatushpada" || boy.vashya === "Jalchar"))
  ) {
    obtained = 1;
  } else if (boy.vashya === "Vanachara" || girl.vashya === "Vanachara") {
    obtained = 0;
  } else {
    obtained = 0.5;
  }

  return {
    name: "Vashya",
    nameHindi: "वश्य",
    obtained,
    total: 2,
    description: "Evaluates mutual attraction and dominance harmony.",
    boyAttribute: boy.vashya,
    girlAttribute: girl.vashya,
    isFavorable: obtained >= 1,
  };
}

/**
 * 3. Tara Score (Max: 3)
 */
function calculateTaraScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  const diffGirlToBoy = ((boy.nakshatraIndex - girl.nakshatraIndex + 27) % 27) + 1;
  const diffBoyToGirl = ((girl.nakshatraIndex - boy.nakshatraIndex + 27) % 27) + 1;

  const t1 = diffGirlToBoy % 9 || 9;
  const t2 = diffBoyToGirl % 9 || 9;

  // Inauspicious taras: 3 (Vipat), 5 (Pratyak), 7 (Naidhana)
  const isBad1 = t1 === 3 || t1 === 5 || t1 === 7;
  const isBad2 = t2 === 3 || t2 === 5 || t2 === 7;

  let obtained = 0;
  if (!isBad1 && !isBad2) obtained = 3;
  else if (!isBad1 || !isBad2) obtained = 1.5;
  else obtained = 0;

  return {
    name: "Tara",
    nameHindi: "तारा",
    obtained,
    total: 3,
    description: "Indicates longevity, destiny, and health prosperity.",
    boyAttribute: `Tara #${t1}`,
    girlAttribute: `Tara #${t2}`,
    isFavorable: obtained >= 1.5,
  };
}

/**
 * 4. Yoni Score (Max: 4)
 */
function calculateYoniScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  const swornEnemies: readonly [string, string][] = [
    ["Horse", "Buffalo"],
    ["Elephant", "Lion"],
    ["Sheep", "Monkey"],
    ["Serpent", "Mongoose"],
    ["Dog", "Deer"],
    ["Cat", "Rat"],
    ["Cow", "Tiger"],
  ] as const;

  const isEnemy = swornEnemies.some(
    ([a, b]) =>
      (boy.yoniAnimal === a && girl.yoniAnimal === b) ||
      (boy.yoniAnimal === b && girl.yoniAnimal === a)
  );

  let obtained = 2; // Default neutral
  if (boy.yoniAnimal === girl.yoniAnimal) {
    obtained = 4;
  } else if (isEnemy) {
    obtained = 0;
  } else {
    // Friendly animal groupings
    const herbivores = ["Horse", "Elephant", "Sheep", "Cow", "Buffalo", "Deer", "Monkey"];
    const boyHerb = herbivores.includes(boy.yoniAnimal);
    const girlHerb = herbivores.includes(girl.yoniAnimal);
    if (boyHerb === girlHerb) {
      obtained = 3;
    } else {
      obtained = 1;
    }
  }

  return {
    name: "Yoni",
    nameHindi: "योनि",
    obtained,
    total: 4,
    description: "Evaluates physical, sexual, and emotional intimacy.",
    boyAttribute: boy.yoniAnimal,
    girlAttribute: girl.yoniAnimal,
    isFavorable: obtained >= 2,
  };
}

/**
 * 5. Graha Maitri Score (Max: 5)
 */
function calculateGrahaMaitriScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  type Planet = "Sun" | "Moon" | "Mars" | "Mercury" | "Jupiter" | "Venus" | "Saturn";
  type Relationship = "Friend" | "Neutral" | "Enemy";

  const relationships: Record<Planet, Record<Planet, Relationship>> = {
    Sun: {
      Sun: "Friend",
      Moon: "Friend",
      Mars: "Friend",
      Jupiter: "Friend",
      Mercury: "Neutral",
      Venus: "Enemy",
      Saturn: "Enemy",
    },
    Moon: {
      Sun: "Friend",
      Moon: "Friend",
      Mercury: "Friend",
      Mars: "Neutral",
      Jupiter: "Neutral",
      Venus: "Neutral",
      Saturn: "Neutral",
    },
    Mars: {
      Sun: "Friend",
      Moon: "Friend",
      Jupiter: "Friend",
      Venus: "Neutral",
      Saturn: "Neutral",
      Mars: "Friend",
      Mercury: "Enemy",
    },
    Mercury: {
      Sun: "Friend",
      Venus: "Friend",
      Mars: "Neutral",
      Jupiter: "Neutral",
      Saturn: "Neutral",
      Mercury: "Friend",
      Moon: "Enemy",
    },
    Jupiter: {
      Sun: "Friend",
      Moon: "Friend",
      Mars: "Friend",
      Saturn: "Neutral",
      Jupiter: "Friend",
      Mercury: "Enemy",
      Venus: "Enemy",
    },
    Venus: {
      Mercury: "Friend",
      Saturn: "Friend",
      Mars: "Neutral",
      Jupiter: "Neutral",
      Venus: "Friend",
      Sun: "Enemy",
      Moon: "Enemy",
    },
    Saturn: {
      Mercury: "Friend",
      Venus: "Friend",
      Jupiter: "Neutral",
      Saturn: "Friend",
      Sun: "Enemy",
      Moon: "Enemy",
      Mars: "Enemy",
    },
  };

  const bLord = boy.rasiLord as Planet;
  const gLord = girl.rasiLord as Planet;

  let obtained = 0;
  if (bLord === gLord) {
    obtained = 5;
  } else {
    const rel1 = relationships[bLord]?.[gLord] || "Neutral";
    const rel2 = relationships[gLord]?.[bLord] || "Neutral";

    if (rel1 === "Friend" && rel2 === "Friend") obtained = 5;
    else if ((rel1 === "Friend" && rel2 === "Neutral") || (rel2 === "Friend" && rel1 === "Neutral")) obtained = 4;
    else if (rel1 === "Neutral" && rel2 === "Neutral") obtained = 3;
    else if ((rel1 === "Friend" && rel2 === "Enemy") || (rel2 === "Friend" && rel1 === "Enemy")) obtained = 1;
    else if ((rel1 === "Neutral" && rel2 === "Enemy") || (rel2 === "Neutral" && rel1 === "Enemy")) obtained = 0.5;
    else obtained = 0;
  }

  return {
    name: "Graha Maitri",
    nameHindi: "ग्रह मैत्री",
    obtained,
    total: 5,
    description: "Reflects intellectual harmony, friendship, and communication.",
    boyAttribute: `${boy.rasiLord} (${boy.rasiName.split(" ")[0]})`,
    girlAttribute: `${girl.rasiLord} (${girl.rasiName.split(" ")[0]})`,
    isFavorable: obtained >= 3,
  };
}

/**
 * 6. Gana Score (Max: 6)
 */
function calculateGanaScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  let obtained = 0;
  if (boy.gana === girl.gana) {
    obtained = 6;
  } else if (
    (boy.gana === "Deva" && girl.gana === "Manushya") ||
    (boy.gana === "Manushya" && girl.gana === "Deva")
  ) {
    obtained = boy.gana === "Deva" ? 6 : 5;
  } else if (boy.gana === "Rakshasa" && girl.gana === "Deva") {
    obtained = 1;
  } else {
    obtained = 0; // Demon mismatch with Human/Deva
  }

  return {
    name: "Gana",
    nameHindi: "गण",
    obtained,
    total: 6,
    description: "Determines temperament, social outlook, and behavioral match.",
    boyAttribute: boy.gana,
    girlAttribute: girl.gana,
    isFavorable: obtained >= 5,
  };
}

/**
 * 7. Bhakoot Score (Max: 7)
 */
function calculateBhakootScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  const dist = ((girl.rasiIndex - boy.rasiIndex + 12) % 12) + 1;

  // Inauspicious sign distances: 2/12 (Dwidwadasa), 6/8 (Shadashtaka), 9/5 (Navapanchama)
  const isDoshaDistance = dist === 2 || dist === 12 || dist === 6 || dist === 8 || dist === 5 || dist === 9;

  let obtained = 7;
  // If same lord (e.g. Mars for Aries/Scorpio or Venus for Taurus/Libra), dosha is cancelled
  const sameLord = boy.rasiLord === girl.rasiLord;

  if (isDoshaDistance && !sameLord) {
    obtained = 0;
  }

  return {
    name: "Bhakoot",
    nameHindi: "भकूट",
    obtained,
    total: 7,
    description: "Influences family prosperity, career growth, and emotional welfare.",
    boyAttribute: `House ${1}`,
    girlAttribute: `House ${dist}`,
    isFavorable: obtained === 7,
  };
}

/**
 * 8. Nadi Score (Max: 8)
 */
function calculateNadiScore(boy: CelestialProfile, girl: CelestialProfile): AshtakootScore {
  // Different Nadis: 8 points. Same Nadi: 0 points (Nadi Dosha)
  const isSame = boy.nadi === girl.nadi;
  const obtained = isSame ? 0 : 8;

  return {
    name: "Nadi",
    nameHindi: "नाड़ी",
    obtained,
    total: 8,
    description: "Assesses physiological compatibility, genetic health, and progeny.",
    boyAttribute: boy.nadi,
    girlAttribute: girl.nadi,
    isFavorable: obtained === 8,
  };
}

/**
 * Evaluates Manglik status & dosha cancellation
 */
function evaluateManglik(boy: CelestialProfile, girl: CelestialProfile): ManglikAnalysis {
  const boyM = boy.isManglik;
  const girlM = girl.isManglik;

  if (!boyM && !girlM) {
    return {
      boyManglik: false,
      girlManglik: false,
      status: "NO_MANGLIK",
      details: "Both bride and groom are Non-Manglik. No Mangal dosha present.",
      isCanceled: false,
    };
  }

  if (boyM && girlM) {
    return {
      boyManglik: true,
      girlManglik: true,
      status: "BOTH_MANGLIK",
      details: "Both bride and groom are Manglik. The dosha is mutually cancelled (Anukul Milan).",
      isCanceled: true,
    };
  }

  if (boyM && !girlM) {
    return {
      boyManglik: true,
      girlManglik: false,
      status: "BOY_MANGLIK",
      details: "Groom has Manglik dosha while bride is Non-Manglik. An astrological consultation is suggested.",
      isCanceled: false,
    };
  }

  return {
    boyManglik: false,
    girlManglik: true,
    status: "GIRL_MANGLIK",
    details: "Bride has Manglik dosha while groom is Non-Manglik. An astrological consultation is suggested.",
    isCanceled: false,
  };
}

export type InputDetails =
  | {
      boy: BirthDetails;
      girl: BirthDetails;
    }
  | {
      boyName: string;
      boyDob: string | Date;
      boyTime: string;
      boyPlace: string;
      girlName: string;
      girlDob: string | Date;
      girlTime: string;
      girlPlace: string;
    };

/**
 * Primary calculation function for 36-Guna Kundli Milan and Manglik Analysis.
 */
export function calculateKundliMilan(
  arg1: InputDetails | BirthDetails,
  arg2?: BirthDetails
): KundliMilanResult {
  let boyDetails: BirthDetails;
  let girlDetails: BirthDetails;

  if (arg2) {
    boyDetails = arg1 as BirthDetails;
    girlDetails = arg2;
  } else if ("boy" in arg1 && "girl" in arg1) {
    boyDetails = arg1.boy;
    girlDetails = arg1.girl;
  } else {
    const flat = arg1 as {
      boyName: string;
      boyDob: string | Date;
      boyTime: string;
      boyPlace: string;
      girlName: string;
      girlDob: string | Date;
      girlTime: string;
      girlPlace: string;
    };
    boyDetails = {
      name: flat.boyName,
      dob: flat.boyDob,
      time: flat.boyTime,
      place: flat.boyPlace,
    };
    girlDetails = {
      name: flat.girlName,
      dob: flat.girlDob,
      time: flat.girlTime,
      place: flat.girlPlace,
    };
  }

  const boyProfile = getCelestialProfile(boyDetails);
  const girlProfile = getCelestialProfile(girlDetails);

  const scores: AshtakootScore[] = [
    calculateVarnaScore(boyProfile, girlProfile),
    calculateVashyaScore(boyProfile, girlProfile),
    calculateTaraScore(boyProfile, girlProfile),
    calculateYoniScore(boyProfile, girlProfile),
    calculateGrahaMaitriScore(boyProfile, girlProfile),
    calculateGanaScore(boyProfile, girlProfile),
    calculateBhakootScore(boyProfile, girlProfile),
    calculateNadiScore(boyProfile, girlProfile),
  ];

  const totalScore = scores.reduce((sum, item) => sum + item.obtained, 0);
  const maxScore = 36;
  const percentage = Math.round((totalScore / maxScore) * 100);

  const manglikAnalysis = evaluateManglik(boyProfile, girlProfile);

  let verdict = "Not Recommended";
  let verdictHindi = "अशुभ मिलन";
  let verdictDescription =
    "Overall compatibility score is below 18 points. Traditional Vedic astrology suggests astrological remedies before proceeding.";
  let isRecommended = false;

  if (totalScore >= 28) {
    verdict = "Excellent Match (Uttam)";
    verdictHindi = "उत्तम मिलन";
    verdictDescription =
      "Outstanding alignment across temperament, destiny, and mental harmony. Highly recommended alliance for a prosperous marital life.";
    isRecommended = true;
  } else if (totalScore >= 21) {
    verdict = "Very Good Match (Madhyam)";
    verdictHindi = "मध्यम मिलन";
    verdictDescription =
      "Favorable overall compatibility. Most core life parameters are harmonious and supportive of a fulfilling marriage.";
    isRecommended = true;
  } else if (totalScore >= 18) {
    verdict = "Average Match (Samanya)";
    verdictHindi = "सामान्य मिलन";
    verdictDescription =
      "Acceptable score meeting the minimum traditional requirement of 18 gunas. Elder guidance and mutual understanding will help overcome minor frictions.";
    isRecommended = true;
  }

  return {
    totalScore,
    maxScore,
    percentage,
    verdict,
    verdictHindi,
    verdictDescription,
    isRecommended,
    boyInfo: {
      name: boyProfile.name,
      rasi: boyProfile.rasiName,
      nakshatra: boyProfile.nakshatraName,
      nakshatraLord: boyProfile.nakshatraLord,
      charan: boyProfile.charan,
      manglik: boyProfile.isManglik,
    },
    girlInfo: {
      name: girlProfile.name,
      rasi: girlProfile.rasiName,
      nakshatra: girlProfile.nakshatraName,
      nakshatraLord: girlProfile.nakshatraLord,
      charan: girlProfile.charan,
      manglik: girlProfile.isManglik,
    },
    scores,
    manglikAnalysis,
  };
}

