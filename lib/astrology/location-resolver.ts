/**
 * Birth Location Coordinate Resolver for Vedic Astrology & Kundli Calculations
 * Handles curated cities, small towns, villages, district/state fallbacks,
 * and graceful India/Regional coordinate defaults without ever throwing or rejecting custom inputs.
 * Zero 'any' declarations for strict TypeScript compliance.
 */

export type LocationResolutionMethod =
  | "EXACT_CITY"
  | "DISTRICT_OR_TOWN"
  | "STATE_FALLBACK"
  | "GEOCODED"
  | "INDIA_DEFAULT";

export interface ResolvedLocation {
  inputPlace: string;
  displayPlace: string;
  latitude: number;
  longitude: number;
  timezoneOffsetHours: number;
  matchedRegion: string;
  resolutionMethod: LocationResolutionMethod;
}

interface GeoPoint {
  lat: number;
  lon: number;
  tz?: number;
  region: string;
}

const CITY_GEO_MAP: Readonly<Record<string, GeoPoint>> = {
  // Delhi-NCR
  "delhi": { lat: 28.6139, lon: 77.209, region: "Delhi" },
  "new delhi": { lat: 28.6139, lon: 77.209, region: "Delhi" },
  "ncr": { lat: 28.6139, lon: 77.209, region: "Delhi NCR" },
  "noida": { lat: 28.5355, lon: 77.391, region: "Uttar Pradesh" },
  "greater noida": { lat: 28.4744, lon: 77.504, region: "Uttar Pradesh" },
  "ghaziabad": { lat: 28.6692, lon: 77.4538, region: "Uttar Pradesh" },
  "faridabad": { lat: 28.4089, lon: 77.3178, region: "Haryana" },
  "gurugram": { lat: 28.4595, lon: 77.0266, region: "Haryana" },
  "gurgaon": { lat: 28.4595, lon: 77.0266, region: "Haryana" },
  "manesar": { lat: 28.3547, lon: 76.9396, region: "Haryana" },
  "sohna": { lat: 28.2484, lon: 77.0659, region: "Haryana" },
  "bahadurgarh": { lat: 28.6924, lon: 76.9355, region: "Haryana" },

  // Haryana (Districts & Towns)
  "ambala": { lat: 30.3782, lon: 76.7767, region: "Haryana" },
  "ambala cantt": { lat: 30.3398, lon: 76.8424, region: "Haryana" },
  "assandh": { lat: 29.5159, lon: 76.605, region: "Haryana" },
  "barwala": { lat: 29.3738, lon: 75.9082, region: "Haryana" },
  "bhattu kalan": { lat: 29.3652, lon: 75.3248, region: "Haryana" },
  "bhiwani": { lat: 28.7975, lon: 76.1322, region: "Haryana" },
  "charkhi dadri": { lat: 28.5921, lon: 76.2653, region: "Haryana" },
  "cheeka": { lat: 30.0252, lon: 76.3372, region: "Haryana" },
  "dabwali": { lat: 29.9469, lon: 74.7069, region: "Haryana" },
  "mandi dabwali": { lat: 29.9469, lon: 74.7069, region: "Haryana" },
  "ellenabad": { lat: 29.454, lon: 74.6615, region: "Haryana" },
  "fatehabad": { lat: 29.5153, lon: 75.4557, region: "Haryana" },
  "gohana": { lat: 29.1384, lon: 76.7016, region: "Haryana" },
  "hansi": { lat: 29.1011, lon: 75.9635, region: "Haryana" },
  "hisar": { lat: 29.1492, lon: 75.7217, region: "Haryana" },
  "hodal": { lat: 27.8902, lon: 77.3721, region: "Haryana" },
  "jagadhri": { lat: 30.1681, lon: 77.2969, region: "Haryana" },
  "jhajjar": { lat: 28.6063, lon: 76.6565, region: "Haryana" },
  "jind": { lat: 29.3159, lon: 76.314, region: "Haryana" },
  "julana": { lat: 29.1243, lon: 76.4046, region: "Haryana" },
  "kaithal": { lat: 29.8043, lon: 76.3996, region: "Haryana" },
  "kalanwali": { lat: 29.832, lon: 74.9612, region: "Haryana" },
  "kalka": { lat: 30.8371, lon: 76.9394, region: "Haryana" },
  "karnal": { lat: 29.6857, lon: 76.9905, region: "Haryana" },
  "kurukshetra": { lat: 29.9695, lon: 76.8783, region: "Haryana" },
  "ladwa": { lat: 29.9927, lon: 77.0439, region: "Haryana" },
  "loharu": { lat: 28.4316, lon: 75.8142, region: "Haryana" },
  "mahendragarh": { lat: 28.2683, lon: 76.1518, region: "Haryana" },
  "narnaul": { lat: 28.0448, lon: 76.1083, region: "Haryana" },
  "narnaund": { lat: 29.2185, lon: 76.1438, region: "Haryana" },
  "narwana": { lat: 29.596, lon: 76.118, region: "Haryana" },
  "nuh": { lat: 28.1011, lon: 77.0012, region: "Haryana" },
  "palwal": { lat: 28.1487, lon: 77.332, region: "Haryana" },
  "panchkula": { lat: 30.6942, lon: 76.8606, region: "Haryana" },
  "panipat": { lat: 29.3909, lon: 76.9635, region: "Haryana" },
  "pehowa": { lat: 29.9803, lon: 76.5784, region: "Haryana" },
  "pinjore": { lat: 30.7995, lon: 76.9163, region: "Haryana" },
  "pundri": { lat: 29.758, lon: 76.555, region: "Haryana" },
  "rania": { lat: 29.5245, lon: 74.8351, region: "Haryana" },
  "ratia": { lat: 29.6869, lon: 75.5782, region: "Haryana" },
  "rewari": { lat: 28.199, lon: 76.6191, region: "Haryana" },
  "rohtak": { lat: 28.8955, lon: 76.6066, region: "Haryana" },
  "safidon": { lat: 29.4063, lon: 76.6669, region: "Haryana" },
  "samalkha": { lat: 29.2371, lon: 77.0112, region: "Haryana" },
  "shahbad": { lat: 30.1669, lon: 76.8712, region: "Haryana" },
  "sirsa": { lat: 29.5321, lon: 75.0318, region: "Haryana" },
  "siwani": { lat: 28.9129, lon: 75.6164, region: "Haryana" },
  "sonipat": { lat: 28.9931, lon: 77.0151, region: "Haryana" },
  "taraori": { lat: 29.8, lon: 76.9333, region: "Haryana" },
  "thanesar": { lat: 29.9693, lon: 76.8266, region: "Haryana" },
  "tohana": { lat: 29.7115, lon: 75.9024, region: "Haryana" },
  "uchana": { lat: 29.4748, lon: 76.1539, region: "Haryana" },
  "uklana": { lat: 29.5059, lon: 75.8858, region: "Haryana" },
  "yamunanagar": { lat: 30.129, lon: 77.2674, region: "Haryana" },

  // Punjab & Chandigarh
  "chandigarh": { lat: 30.7333, lon: 76.7794, region: "Chandigarh" },
  "abohar": { lat: 30.1469, lon: 74.1993, region: "Punjab" },
  "amritsar": { lat: 31.634, lon: 74.8723, region: "Punjab" },
  "barnala": { lat: 30.3782, lon: 75.5461, region: "Punjab" },
  "bathinda": { lat: 30.211, lon: 74.9455, region: "Punjab" },
  "faridkot": { lat: 30.6769, lon: 74.7583, region: "Punjab" },
  "fatehgarh sahib": { lat: 30.6435, lon: 76.397, region: "Punjab" },
  "fazilka": { lat: 30.4036, lon: 74.028, region: "Punjab" },
  "firozpur": { lat: 30.9331, lon: 74.6225, region: "Punjab" },
  "gurdaspur": { lat: 32.0419, lon: 75.4053, region: "Punjab" },
  "hoshiarpur": { lat: 31.5143, lon: 75.9115, region: "Punjab" },
  "jagraon": { lat: 30.788, lon: 75.4754, region: "Punjab" },
  "jalandhar": { lat: 31.326, lon: 75.5762, region: "Punjab" },
  "kapurthala": { lat: 31.3801, lon: 75.38, region: "Punjab" },
  "khanna": { lat: 30.7071, lon: 76.217, region: "Punjab" },
  "kotkapura": { lat: 30.5818, lon: 74.8286, region: "Punjab" },
  "ludhiana": { lat: 30.901, lon: 75.8573, region: "Punjab" },
  "malerkotla": { lat: 30.525, lon: 75.8797, region: "Punjab" },
  "mandi gobindgarh": { lat: 30.6695, lon: 76.289, region: "Punjab" },
  "mansa": { lat: 29.9985, lon: 75.4017, region: "Punjab" },
  "moga": { lat: 30.823, lon: 75.1734, region: "Punjab" },
  "mohali": { lat: 30.7046, lon: 76.7179, region: "Punjab" },
  "muktsar": { lat: 30.4762, lon: 74.5122, region: "Punjab" },
  "nawanshahr": { lat: 31.1256, lon: 76.1186, region: "Punjab" },
  "pathankot": { lat: 32.2643, lon: 75.6421, region: "Punjab" },
  "patiala": { lat: 30.3398, lon: 76.3869, region: "Punjab" },
  "phagwara": { lat: 31.224, lon: 75.7708, region: "Punjab" },
  "rajpura": { lat: 30.484, lon: 76.594, region: "Punjab" },
  "ropar": { lat: 30.9664, lon: 76.5331, region: "Punjab" },
  "roopnagar": { lat: 30.9664, lon: 76.5331, region: "Punjab" },
  "samana": { lat: 30.1558, lon: 76.1924, region: "Punjab" },
  "sangrur": { lat: 30.2458, lon: 75.8421, region: "Punjab" },
  "sunam": { lat: 30.128, lon: 75.8001, region: "Punjab" },
  "tarn taran": { lat: 31.4519, lon: 74.927, region: "Punjab" },
  "zirakpur": { lat: 30.6425, lon: 76.8173, region: "Punjab" },

  // Rajasthan
  "ajmer": { lat: 26.4499, lon: 74.6399, region: "Rajasthan" },
  "alwar": { lat: 27.553, lon: 76.6346, region: "Rajasthan" },
  "balotra": { lat: 25.8312, lon: 72.2403, region: "Rajasthan" },
  "banswara": { lat: 23.5461, lon: 74.435, region: "Rajasthan" },
  "baran": { lat: 25.1011, lon: 76.5132, region: "Rajasthan" },
  "barmer": { lat: 25.7521, lon: 71.3967, region: "Rajasthan" },
  "beawar": { lat: 26.1011, lon: 74.319, region: "Rajasthan" },
  "bharatpur": { lat: 27.2152, lon: 77.503, region: "Rajasthan" },
  "bhilwara": { lat: 25.3407, lon: 74.6313, region: "Rajasthan" },
  "bhiwadi": { lat: 28.2099, lon: 76.8453, region: "Rajasthan" },
  "bikaner": { lat: 28.0229, lon: 73.3119, region: "Rajasthan" },
  "bundi": { lat: 25.4305, lon: 75.6499, region: "Rajasthan" },
  "chittorgarh": { lat: 24.8887, lon: 74.6269, region: "Rajasthan" },
  "churu": { lat: 28.292, lon: 74.9647, region: "Rajasthan" },
  "dausa": { lat: 26.8919, lon: 76.3367, region: "Rajasthan" },
  "dholpur": { lat: 26.7025, lon: 77.8934, region: "Rajasthan" },
  "didwana": { lat: 27.402, lon: 74.5736, region: "Rajasthan" },
  "hanumangarh": { lat: 29.5815, lon: 74.3294, region: "Rajasthan" },
  "jaipur": { lat: 26.9124, lon: 75.7873, region: "Rajasthan" },
  "jaisalmer": { lat: 26.9157, lon: 70.9083, region: "Rajasthan" },
  "jalore": { lat: 25.3456, lon: 72.6156, region: "Rajasthan" },
  "jhalawar": { lat: 24.5973, lon: 76.161, region: "Rajasthan" },
  "jhunjhunu": { lat: 28.1289, lon: 75.3995, region: "Rajasthan" },
  "jodhpur": { lat: 26.2389, lon: 73.0243, region: "Rajasthan" },
  "kishangarh": { lat: 26.5882, lon: 74.855, region: "Rajasthan" },
  "kota": { lat: 25.2138, lon: 75.8648, region: "Rajasthan" },
  "kotputli": { lat: 27.702, lon: 76.199, region: "Rajasthan" },
  "nagaur": { lat: 27.202, lon: 73.7336, region: "Rajasthan" },
  "neem ka thana": { lat: 27.7376, lon: 75.7828, region: "Rajasthan" },
  "pali": { lat: 25.7711, lon: 73.3234, region: "Rajasthan" },
  "phalodi": { lat: 27.131, lon: 72.3684, region: "Rajasthan" },
  "pilani": { lat: 28.3802, lon: 75.6092, region: "Rajasthan" },
  "rajsamand": { lat: 25.0715, lon: 73.8831, region: "Rajasthan" },
  "rawatsar": { lat: 29.2613, lon: 74.3977, region: "Rajasthan" },
  "sikar": { lat: 27.6094, lon: 75.1398, region: "Rajasthan" },
  "sri ganganagar": { lat: 29.9038, lon: 73.8772, region: "Rajasthan" },
  "ganganagar": { lat: 29.9038, lon: 73.8772, region: "Rajasthan" },
  "suratgarh": { lat: 29.3228, lon: 73.8992, region: "Rajasthan" },
  "tonk": { lat: 26.1664, lon: 75.7885, region: "Rajasthan" },
  "udaipur": { lat: 24.5854, lon: 73.7125, region: "Rajasthan" },

  // Uttar Pradesh & Uttarakhand
  "agra": { lat: 27.1767, lon: 78.0081, region: "Uttar Pradesh" },
  "aligarh": { lat: 27.8974, lon: 78.088, region: "Uttar Pradesh" },
  "ayodhya": { lat: 26.7922, lon: 82.1998, region: "Uttar Pradesh" },
  "badaun": { lat: 28.036, lon: 79.126, region: "Uttar Pradesh" },
  "baghpat": { lat: 28.9442, lon: 77.2185, region: "Uttar Pradesh" },
  "bareilly": { lat: 28.367, lon: 79.4304, region: "Uttar Pradesh" },
  "bulandshahr": { lat: 28.407, lon: 77.8498, region: "Uttar Pradesh" },
  "chandausi": { lat: 28.4525, lon: 78.7825, region: "Uttar Pradesh" },
  "deoband": { lat: 29.6929, lon: 77.6798, region: "Uttar Pradesh" },
  "etawah": { lat: 26.7856, lon: 79.0215, region: "Uttar Pradesh" },
  "faizabad": { lat: 26.7732, lon: 82.1442, region: "Uttar Pradesh" },
  "fatehpur": { lat: 25.9277, lon: 80.8122, region: "Uttar Pradesh" },
  "firozabad": { lat: 27.1591, lon: 78.3957, region: "Uttar Pradesh" },
  "gorakhpur": { lat: 26.7606, lon: 83.3732, region: "Uttar Pradesh" },
  "hapur": { lat: 28.7306, lon: 77.7759, region: "Uttar Pradesh" },
  "hathras": { lat: 27.595, lon: 78.05, region: "Uttar Pradesh" },
  "jhansi": { lat: 25.4484, lon: 78.5685, region: "Uttar Pradesh" },
  "kanpur": { lat: 26.4499, lon: 80.3319, region: "Uttar Pradesh" },
  "kasganj": { lat: 27.8058, lon: 78.6458, region: "Uttar Pradesh" },
  "khurja": { lat: 28.2528, lon: 77.8548, region: "Uttar Pradesh" },
  "loni": { lat: 28.7515, lon: 77.2889, region: "Uttar Pradesh" },
  "lucknow": { lat: 26.8467, lon: 80.9462, region: "Uttar Pradesh" },
  "mainpuri": { lat: 27.2351, lon: 79.025, region: "Uttar Pradesh" },
  "mathura": { lat: 27.4924, lon: 77.6737, region: "Uttar Pradesh" },
  "meerut": { lat: 28.9845, lon: 77.7064, region: "Uttar Pradesh" },
  "modinagar": { lat: 28.8315, lon: 77.5811, region: "Uttar Pradesh" },
  "moradabad": { lat: 28.8386, lon: 78.7733, region: "Uttar Pradesh" },
  "muzaffarnagar": { lat: 29.4727, lon: 77.7085, region: "Uttar Pradesh" },
  "pilibhit": { lat: 28.6311, lon: 79.8044, region: "Uttar Pradesh" },
  "prayagraj": { lat: 25.4358, lon: 81.8463, region: "Uttar Pradesh" },
  "allahabad": { lat: 25.4358, lon: 81.8463, region: "Uttar Pradesh" },
  "rampur": { lat: 28.808, lon: 79.025, region: "Uttar Pradesh" },
  "saharanpur": { lat: 29.968, lon: 77.5552, region: "Uttar Pradesh" },
  "sambhal": { lat: 28.5844, lon: 78.5718, region: "Uttar Pradesh" },
  "shahjahanpur": { lat: 27.8815, lon: 79.9109, region: "Uttar Pradesh" },
  "shamli": { lat: 29.4494, lon: 77.3127, region: "Uttar Pradesh" },
  "shikohabad": { lat: 27.108, lon: 78.583, region: "Uttar Pradesh" },
  "sitapur": { lat: 27.5619, lon: 80.6824, region: "Uttar Pradesh" },
  "varanasi": { lat: 25.3176, lon: 82.9739, region: "Uttar Pradesh" },
  "vrindavan": { lat: 27.565, lon: 77.6593, region: "Uttar Pradesh" },
  "dehradun": { lat: 30.3165, lon: 78.0322, region: "Uttarakhand" },
  "haldwani": { lat: 29.2183, lon: 79.513, region: "Uttarakhand" },
  "haridwar": { lat: 29.9457, lon: 78.1642, region: "Uttarakhand" },
  "nainital": { lat: 29.3919, lon: 79.4542, region: "Uttarakhand" },
  "rishikesh": { lat: 30.0869, lon: 78.2676, region: "Uttarakhand" },
  "roorkee": { lat: 29.8543, lon: 77.888, region: "Uttarakhand" },

  // Major Metros & Rest of India
  "mumbai": { lat: 19.076, lon: 72.8777, region: "Maharashtra" },
  "navi mumbai": { lat: 19.033, lon: 73.0297, region: "Maharashtra" },
  "thane": { lat: 19.2183, lon: 72.9781, region: "Maharashtra" },
  "kalyan": { lat: 19.2403, lon: 73.1305, region: "Maharashtra" },
  "pune": { lat: 18.5204, lon: 73.8567, region: "Maharashtra" },
  "pimpri-chinchwad": { lat: 18.6298, lon: 73.7997, region: "Maharashtra" },
  "nagpur": { lat: 21.1458, lon: 79.0882, region: "Maharashtra" },
  "nashik": { lat: 19.9975, lon: 73.7898, region: "Maharashtra" },
  "aurangabad": { lat: 19.8762, lon: 75.3433, region: "Maharashtra" },
  "ahmednagar": { lat: 19.0948, lon: 74.748, region: "Maharashtra" },
  "amravati": { lat: 20.932, lon: 77.7523, region: "Maharashtra" },
  "akola": { lat: 20.7002, lon: 77.0082, region: "Maharashtra" },
  "kolhapur": { lat: 16.705, lon: 74.2433, region: "Maharashtra" },
  "solapur": { lat: 17.6599, lon: 75.9064, region: "Maharashtra" },
  "bengaluru": { lat: 12.9716, lon: 77.5946, region: "Karnataka" },
  "bangalore": { lat: 12.9716, lon: 77.5946, region: "Karnataka" },
  "mysuru": { lat: 12.2958, lon: 76.6394, region: "Karnataka" },
  "mangaluru": { lat: 12.9141, lon: 74.856, region: "Karnataka" },
  "hubballi": { lat: 15.3647, lon: 75.124, region: "Karnataka" },
  "belagavi": { lat: 15.8497, lon: 74.4977, region: "Karnataka" },
  "kalaburagi": { lat: 17.3297, lon: 76.8343, region: "Karnataka" },
  "hyderabad": { lat: 17.385, lon: 78.4867, region: "Telangana" },
  "warangal": { lat: 17.9689, lon: 79.5941, region: "Telangana" },
  "chennai": { lat: 13.0827, lon: 80.2707, region: "Tamil Nadu" },
  "coimbatore": { lat: 11.0168, lon: 76.9558, region: "Tamil Nadu" },
  "madurai": { lat: 9.9252, lon: 78.1198, region: "Tamil Nadu" },
  "salem": { lat: 11.6643, lon: 78.146, region: "Tamil Nadu" },
  "tiruchirappalli": { lat: 10.7905, lon: 78.7047, region: "Tamil Nadu" },
  "vellore": { lat: 12.9165, lon: 79.1325, region: "Tamil Nadu" },
  "kolkata": { lat: 22.5726, lon: 88.3639, region: "West Bengal" },
  "asansol": { lat: 23.6889, lon: 86.9661, region: "West Bengal" },
  "durgapur": { lat: 23.5204, lon: 87.3119, region: "West Bengal" },
  "siliguri": { lat: 26.7271, lon: 88.3953, region: "West Bengal" },
  "ahmedabad": { lat: 23.0225, lon: 72.5714, region: "Gujarat" },
  "gandhinagar": { lat: 23.2156, lon: 72.6369, region: "Gujarat" },
  "surat": { lat: 21.1702, lon: 72.8311, region: "Gujarat" },
  "vadodara": { lat: 22.3072, lon: 73.1812, region: "Gujarat" },
  "rajkot": { lat: 22.3039, lon: 70.8022, region: "Gujarat" },
  "bhavnagar": { lat: 21.7645, lon: 72.1519, region: "Gujarat" },
  "jamnagar": { lat: 22.4707, lon: 70.0577, region: "Gujarat" },
  "anand": { lat: 22.5645, lon: 72.9289, region: "Gujarat" },
  "bhopal": { lat: 23.2599, lon: 77.4126, region: "Madhya Pradesh" },
  "indore": { lat: 22.7196, lon: 75.8577, region: "Madhya Pradesh" },
  "gwalior": { lat: 26.2183, lon: 78.1828, region: "Madhya Pradesh" },
  "jabalpur": { lat: 23.1815, lon: 79.9864, region: "Madhya Pradesh" },
  "ujjain": { lat: 23.1765, lon: 75.7885, region: "Madhya Pradesh" },
  "patna": { lat: 25.5941, lon: 85.1376, region: "Bihar" },
  "gaya": { lat: 24.7914, lon: 85.0002, region: "Bihar" },
  "muzaffarpur": { lat: 26.1209, lon: 85.3647, region: "Bihar" },
  "bhagalpur": { lat: 25.2425, lon: 86.9842, region: "Bihar" },
  "darbhanga": { lat: 26.1542, lon: 85.8918, region: "Bihar" },
  "ranchi": { lat: 23.3441, lon: 85.3096, region: "Jharkhand" },
  "jamshedpur": { lat: 22.8046, lon: 86.2029, region: "Jharkhand" },
  "dhanbad": { lat: 23.7957, lon: 86.4304, region: "Jharkhand" },
  "bokaro steel city": { lat: 23.6693, lon: 86.1511, region: "Jharkhand" },
  "raipur": { lat: 21.2514, lon: 81.6296, region: "Chhattisgarh" },
  "bhilai": { lat: 21.1938, lon: 81.3509, region: "Chhattisgarh" },
  "bilaspur": { lat: 22.0797, lon: 82.1409, region: "Chhattisgarh" },
  "bhubaneswar": { lat: 20.2961, lon: 85.8245, region: "Odisha" },
  "cuttack": { lat: 20.4625, lon: 85.883, region: "Odisha" },
  "puri": { lat: 19.8135, lon: 85.8312, region: "Odisha" },
  "rourkela": { lat: 22.2604, lon: 84.8536, region: "Odisha" },
  "kochi": { lat: 9.9312, lon: 76.2673, region: "Kerala" },
  "thiruvananthapuram": { lat: 8.5241, lon: 76.9366, region: "Kerala" },
  "kozhikode": { lat: 11.2588, lon: 75.7804, region: "Kerala" },
  "vijayawada": { lat: 16.5062, lon: 80.648, region: "Andhra Pradesh" },
  "visakhapatnam": { lat: 17.6868, lon: 83.2185, region: "Andhra Pradesh" },
  "rajahmundry": { lat: 17.0005, lon: 81.804, region: "Andhra Pradesh" },
  "tirupati": { lat: 13.6288, lon: 79.4192, region: "Andhra Pradesh" },
  "shimla": { lat: 31.1048, lon: 77.1734, region: "Himachal Pradesh" },
  "solan": { lat: 30.9084, lon: 77.0999, region: "Himachal Pradesh" },
  "mandi": { lat: 31.7088, lon: 76.932, region: "Himachal Pradesh" },
  "dharamshala": { lat: 32.219, lon: 76.3234, region: "Himachal Pradesh" },
  "manali": { lat: 32.2432, lon: 77.1892, region: "Himachal Pradesh" },
  "jammu": { lat: 32.7266, lon: 74.857, region: "Jammu & Kashmir" },
  "srinagar": { lat: 34.0837, lon: 74.7973, region: "Jammu & Kashmir" },
  "leh": { lat: 34.1526, lon: 77.5771, region: "Ladakh" },
  "guwahati": { lat: 26.1445, lon: 91.7362, region: "Assam" },
  "agartala": { lat: 23.8315, lon: 91.2868, region: "Tripura" },
  "shillong": { lat: 25.5788, lon: 91.8933, region: "Meghalaya" },
  "imphal": { lat: 24.817, lon: 93.9368, region: "Manipur" },
  "aizawl": { lat: 23.7271, lon: 92.7176, region: "Mizoram" },
  "kohima": { lat: 25.6751, lon: 94.1086, region: "Nagaland" },
  "itanagar": { lat: 27.0844, lon: 93.6053, region: "Arunachal Pradesh" },
  "gangtok": { lat: 27.3389, lon: 88.6065, region: "Sikkim" },
  "puducherry": { lat: 11.9416, lon: 79.8083, region: "Puducherry" },
  "port blair": { lat: 11.6234, lon: 92.7265, region: "Andaman & Nicobar Islands" },

  // Major Global Cities (for NRI profiles)
  "london": { lat: 51.5072, lon: -0.1276, tz: 0, region: "United Kingdom" },
  "dubai": { lat: 25.2048, lon: 55.2708, tz: 4, region: "UAE" },
  "abu dhabi": { lat: 24.4539, lon: 54.3773, tz: 4, region: "UAE" },
  "singapore": { lat: 1.3521, lon: 103.8198, tz: 8, region: "Singapore" },
  "toronto": { lat: 43.6532, lon: -79.3832, tz: -5, region: "Canada" },
  "vancouver": { lat: 49.2827, lon: -123.1207, tz: -8, region: "Canada" },
  "new york": { lat: 40.7128, lon: -74.006, tz: -5, region: "USA" },
  "san francisco": { lat: 37.7749, lon: -122.4194, tz: -8, region: "USA" },
  "chicago": { lat: 41.8781, lon: -87.6298, tz: -6, region: "USA" },
  "sydney": { lat: -33.8688, lon: 151.2093, tz: 10, region: "Australia" },
  "melbourne": { lat: -37.8136, lon: 144.9631, tz: 10, region: "Australia" },
};

const STATE_GEO_MAP: Readonly<Record<string, GeoPoint>> = {
  "haryana": { lat: 29.0588, lon: 76.0856, region: "Haryana" },
  "punjab": { lat: 31.1471, lon: 75.3412, region: "Punjab" },
  "rajasthan": { lat: 27.0238, lon: 74.2179, region: "Rajasthan" },
  "uttar pradesh": { lat: 26.8467, lon: 80.9462, region: "Uttar Pradesh" },
  "uttarakhand": { lat: 30.0668, lon: 79.0193, region: "Uttarakhand" },
  "himachal pradesh": { lat: 31.1048, lon: 77.1734, region: "Himachal Pradesh" },
  "delhi": { lat: 28.6139, lon: 77.209, region: "Delhi" },
  "chandigarh": { lat: 30.7333, lon: 76.7794, region: "Chandigarh" },
  "maharashtra": { lat: 19.7515, lon: 75.7139, region: "Maharashtra" },
  "gujarat": { lat: 22.2587, lon: 71.1924, region: "Gujarat" },
  "madhya pradesh": { lat: 22.9734, lon: 78.6569, region: "Madhya Pradesh" },
  "bihar": { lat: 25.0961, lon: 85.3131, region: "Bihar" },
  "jharkhand": { lat: 23.6102, lon: 85.2799, region: "Jharkhand" },
  "chhattisgarh": { lat: 21.2787, lon: 81.8661, region: "Chhattisgarh" },
  "west bengal": { lat: 22.9868, lon: 87.855, region: "West Bengal" },
  "odisha": { lat: 20.9517, lon: 85.0985, region: "Odisha" },
  "karnataka": { lat: 15.3173, lon: 75.7139, region: "Karnataka" },
  "telangana": { lat: 18.1124, lon: 79.0193, region: "Telangana" },
  "andhra pradesh": { lat: 15.9129, lon: 79.74, region: "Andhra Pradesh" },
  "tamil nadu": { lat: 11.1271, lon: 78.6569, region: "Tamil Nadu" },
  "kerala": { lat: 10.8505, lon: 76.2711, region: "Kerala" },
  "assam": { lat: 26.2006, lon: 92.9376, region: "Assam" },
  "jammu": { lat: 33.2778, lon: 75.3412, region: "Jammu & Kashmir" },
  "kashmir": { lat: 34.0837, lon: 74.7973, region: "Jammu & Kashmir" },
  "ladakh": { lat: 34.1526, lon: 77.5771, region: "Ladakh" },
  "goa": { lat: 15.2993, lon: 74.124, region: "Goa" },
  "tripura": { lat: 23.9408, lon: 91.9882, region: "Tripura" },
  "meghalaya": { lat: 25.467, lon: 91.3662, region: "Meghalaya" },
  "manipur": { lat: 24.6637, lon: 93.9063, region: "Manipur" },
  "mizoram": { lat: 23.1645, lon: 92.9376, region: "Mizoram" },
  "nagaland": { lat: 26.1584, lon: 94.5624, region: "Nagaland" },
  "arunachal pradesh": { lat: 28.218, lon: 94.7278, region: "Arunachal Pradesh" },
  "sikkim": { lat: 27.533, lon: 88.5122, region: "Sikkim" },
  "puducherry": { lat: 11.9416, lon: 79.8083, region: "Puducherry" },
  "india": { lat: 28.6139, lon: 77.209, region: "India (Standard Reference)" },
};

const SHORT_STATE_TOKENS: Readonly<Record<string, string>> = {
  "hr": "haryana",
  "pb": "punjab",
  "rj": "rajasthan",
  "up": "uttar pradesh",
  "uk": "uttarakhand",
  "hp": "himachal pradesh",
  "dl": "delhi",
  "mh": "maharashtra",
  "gj": "gujarat",
  "mp": "madhya pradesh",
  "br": "bihar",
  "jh": "jharkhand",
  "cg": "chhattisgarh",
  "wb": "west bengal",
  "or": "odisha",
  "od": "odisha",
  "ka": "karnataka",
  "ts": "telangana",
  "ap": "andhra pradesh",
  "tn": "tamil nadu",
  "kl": "kerala",
  "as": "assam",
  "jk": "jammu",
};

const geocodeCache = new Map<string, ResolvedLocation>();

function normalizePlaceKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9\s,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Synchronously resolves any city, small town, village, or custom birthplace string
 * into deterministic latitude/longitude/timezone coordinates with clean regional fallback.
 */
export function resolveBirthLocation(rawPlace?: string | null): ResolvedLocation {
  const inputPlace = (rawPlace ?? "").trim();
  const displayPlace = inputPlace || "Delhi, India";

  if (!inputPlace) {
    return {
      inputPlace: "",
      displayPlace,
      latitude: 28.6139,
      longitude: 77.209,
      timezoneOffsetHours: 5.5,
      matchedRegion: "India (Standard Reference)",
      resolutionMethod: "INDIA_DEFAULT",
    };
  }

  const normalized = normalizePlaceKey(inputPlace);
  const parts = normalized
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  // 1. Exact primary city part match (e.g. "Hisar, Haryana" -> "hisar", or "Hisar")
  const primaryPart = parts[0] || normalized;
  const exactCity = CITY_GEO_MAP[primaryPart] || CITY_GEO_MAP[normalized];
  if (exactCity) {
    return {
      inputPlace,
      displayPlace,
      latitude: exactCity.lat,
      longitude: exactCity.lon,
      timezoneOffsetHours: exactCity.tz ?? 5.5,
      matchedRegion: exactCity.region,
      resolutionMethod: "EXACT_CITY",
    };
  }

  // 2. Match known city/town anywhere inside comma segments or words (e.g. "Village XYZ Tehsil Tohana")
  const knownCityKeys = Object.keys(CITY_GEO_MAP).sort((a, b) => b.length - a.length);
  for (const key of knownCityKeys) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(normalized)) {
      const hit = CITY_GEO_MAP[key];
      return {
        inputPlace,
        displayPlace,
        latitude: hit.lat,
        longitude: hit.lon,
        timezoneOffsetHours: hit.tz ?? 5.5,
        matchedRegion: hit.region,
        resolutionMethod: "DISTRICT_OR_TOWN",
      };
    }
  }

  // 3. Fallback to State / UT name or standard abbreviation in any part of input
  const stateKeys = Object.keys(STATE_GEO_MAP).sort((a, b) => b.length - a.length);
  for (const sKey of stateKeys) {
    const escaped = sKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "i");
    if (regex.test(normalized)) {
      const hit = STATE_GEO_MAP[sKey];
      return {
        inputPlace,
        displayPlace,
        latitude: hit.lat,
        longitude: hit.lon,
        timezoneOffsetHours: hit.tz ?? 5.5,
        matchedRegion: hit.region,
        resolutionMethod: sKey === "india" ? "INDIA_DEFAULT" : "STATE_FALLBACK",
      };
    }
  }

  const wordTokens = normalized.replace(/,/g, " ").split(/\s+/).filter(Boolean);
  for (const token of wordTokens) {
    const mappedState = SHORT_STATE_TOKENS[token];
    if (mappedState && STATE_GEO_MAP[mappedState]) {
      const hit = STATE_GEO_MAP[mappedState];
      return {
        inputPlace,
        displayPlace,
        latitude: hit.lat,
        longitude: hit.lon,
        timezoneOffsetHours: hit.tz ?? 5.5,
        matchedRegion: hit.region,
        resolutionMethod: "STATE_FALLBACK",
      };
    }
  }

  // 4. Deterministic India Standard Reference fallback — never throws or fails validation
  return {
    inputPlace,
    displayPlace,
    latitude: 28.6139,
    longitude: 77.209,
    timezoneOffsetHours: 5.5,
    matchedRegion: "India (Standard Reference)",
    resolutionMethod: "INDIA_DEFAULT",
  };
}

/**
 * Optional async resolver for server API routes:
 * uses fast synchronous match first, and only queries OpenStreetMap Nominatim
 * (with strict 1.5s timeout + in-memory cache) if the town/village isn't in local gazetteer.
 * Always falls back safely to resolveBirthLocation() if offline or rate-limited.
 */
export async function resolveBirthLocationAsync(
  rawPlace?: string | null
): Promise<ResolvedLocation> {
  const syncResult = resolveBirthLocation(rawPlace);
  const cleaned = (rawPlace ?? "").trim();

  if (
    !cleaned ||
    syncResult.resolutionMethod === "EXACT_CITY" ||
    syncResult.resolutionMethod === "DISTRICT_OR_TOWN" ||
    syncResult.resolutionMethod === "STATE_FALLBACK"
  ) {
    return syncResult;
  }

  const cacheKey = normalizePlaceKey(cleaned);
  const cached = geocodeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 1500);

    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(
      cleaned
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RishteClub-Vedic-Kundli/1.0 (https://rishteclub.com)",
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as Array<{
        lat?: string;
        lon?: string;
        display_name?: string;
      }>;
      if (Array.isArray(data) && data.length > 0 && data[0]?.lat && data[0]?.lon) {
        const lat = Number.parseFloat(data[0].lat);
        const lon = Number.parseFloat(data[0].lon);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const geocoded: ResolvedLocation = {
            inputPlace: cleaned,
            displayPlace: cleaned,
            latitude: Number(lat.toFixed(4)),
            longitude: Number(lon.toFixed(4)),
            timezoneOffsetHours: 5.5,
            matchedRegion: data[0].display_name || "India",
            resolutionMethod: "GEOCODED",
          };
          geocodeCache.set(cacheKey, geocoded);
          return geocoded;
        }
      }
    }
  } catch {
    // Graceful silent fallback on timeout or offline environment
  }

  geocodeCache.set(cacheKey, syncResult);
  return syncResult;
}

