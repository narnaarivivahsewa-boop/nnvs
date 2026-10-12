export type LandingPageData = {
  slug: string;
  type: "location" | "community";
  title: string;
  metaTitle: string;
  metaDescription: string;
  heading: string;
  subheading: string;
  hindiHeading?: string;
  badge: string;
  targetQuery?: {
    caste?: string;
    religion?: string;
    query?: string;
  };
  overview: string;
  keyFeatures: Array<{
    title: string;
    description: string;
  }>;
  faqs: Array<{
    question: string;
    answer: string;
  }>;
};

export const LANDING_PAGES: Record<string, LandingPageData> = {
  "delhi-ncr": {
    slug: "delhi-ncr",
    type: "location",
    title: "Delhi NCR Matrimony & Marriage Bureau",
    metaTitle: "Delhi NCR Matrimony & Marriage Bureau | RishteClub",
    metaDescription:
      "Find verified marriage alliances in Delhi, Noida, Gurugram, Faridabad and Ghaziabad. Trusted matrimonial matchmaking by RishteClub and NNVS Matrimony.",
    heading: "Delhi NCR Matrimony & Marriage Bureau",
    subheading: "Connecting respected families across Delhi, Gurugram, Noida, and Faridabad with trust and dignity.",
    hindiHeading: "दिल्ली एनसीआर विवाह सेवा — अपनों के लिए सही रिश्ता",
    badge: "DELHI NCR ALLIANCES",
    targetQuery: { query: "Delhi" },
    overview:
      "RishteClub (associated with NNVS Matrimony – Nar Naari Vivah Sewa) offers dedicated matrimonial matchmaking across Delhi NCR. Whether you are looking for highly educated professionals, business families, or community-rooted alliances in Delhi, Gurugram, Noida, Faridabad, or Ghaziabad, our verified platform provides dignity, transparency, and personal care.",
    keyFeatures: [
      {
        title: "Verified Family Backgrounds",
        description: "Every profile undergoes verification to ensure genuine matrimonial intent and authentic family background.",
      },
      {
        title: "Vedic Kundli Compatibility",
        description: "Built-in 36 Guna Ashtakoota Milan and Lal Kitab guidance to support astrological alignment.",
      },
      {
        title: "Active Delhi NCR Community",
        description: "Extensive network across Agarwal, Baniya, Brahmin, Punjabi, Khatri, and other prominent North Indian communities.",
      },
    ],
    faqs: [
      {
        question: "How does RishteClub help families in Delhi NCR?",
        answer:
          "RishteClub combines traditional family matchmaking values with modern digital convenience, serving thousands of verified prospective brides and grooms across the Delhi National Capital Region.",
      },
      {
        question: "Are profile contacts public in Delhi NCR listings?",
        answer:
          "No. Candidate privacy is strictly protected. Personal phone numbers and chat links are accessible only to authenticated, registered members.",
      },
    ],
  },

  gurugram: {
    slug: "gurugram",
    type: "location",
    title: "Gurugram Matrimony & Marriage Services",
    metaTitle: "Gurugram Matrimony & Marriage Bureau | RishteClub",
    metaDescription:
      "Verified matrimonial alliances in Gurugram (Gurgaon). Connect with educated corporate professionals and business families via RishteClub & NNVS Matrimony.",
    heading: "Gurugram Matrimony & Marriage Bureau",
    subheading: "Curated alliances for working professionals, entrepreneurs, and families residing in Gurugram.",
    hindiHeading: "गुरुग्राम विवाह सेवा — विश्वसनीय जीवनसाथी की तलाश",
    badge: "GURUGRAM SPECIALTY",
    targetQuery: { query: "Gurugram" },
    overview:
      "Gurugram has emerged as North India's foremost corporate and entrepreneurial hub. RishteClub caters specifically to progressive families and educated professionals—including IT specialists, chartered accountants, legal experts, and business owners—who value both cultural heritage and modern life aspirations.",
    keyFeatures: [
      {
        title: "Educated & Professional Profiles",
        description: "Specialized directory of B.Tech, MBA, MBBS, CA, and corporate leaders based in Cyber City, Golf Course Road, and Sohna Road.",
      },
      {
        title: "Confidential Matchmaking",
        description: "Safe environment protecting candidate identity while facilitating genuine connections between families.",
      },
      {
        title: "Astrology & Horoscope Matching",
        description: "Instant Kundli Milan tools and remedial consultation for families observing Vedic matchmaking traditions.",
      },
    ],
    faqs: [
      {
        question: "Can working professionals in Gurugram register on RishteClub?",
        answer:
          "Yes. Candidates or their parents can create a comprehensive matrimonial biodata with educational credentials, career details, and lifestyle preferences.",
      },
      {
        question: "Does RishteClub provide wedding vendor assistance in Gurugram?",
        answer:
          "Yes. We also provide curated wedding planning and vendor connections across Delhi NCR and Haryana through our Wedding Services division.",
      },
    ],
  },

  haryana: {
    slug: "haryana",
    type: "location",
    title: "Haryana Matrimonial Bureau & Vivah Sewa",
    metaTitle: "Haryana Matrimonial Bureau & Vivah Sewa | RishteClub",
    metaDescription:
      "Authentic matrimonial matchmaking in Haryana. Managed by NNVS Matrimony (Hisar HQ) for families across Hisar, Rohtak, Karnal, Panipat & Ambala.",
    heading: "Haryana Matrimonial Bureau & Vivah Sewa",
    subheading: "Rooted in Haryana's cultural values, managed by NNVS Matrimony with head office in Hisar.",
    hindiHeading: "हरियाणा विवाह सेवा — शुद्ध पारिवारिक परंपरा और विश्वास",
    badge: "HARYANA TRADITION",
    targetQuery: { query: "Haryana" },
    overview:
      "Backed by NNVS Matrimony (Nar Naari Vivah Sewa, operated by Trendy Traders, Hisar, Haryana), RishteClub has served families across Haryana for years. We provide respectful matrimonial assistance for families across Hisar, Rohtak, Karnal, Panipat, Kurukshetra, Ambala, Sirsa, and Bhiwani.",
    keyFeatures: [
      {
        title: "Deep Regional Roots",
        description: "Established physical presence in Hisar with extensive community connections throughout Haryana.",
      },
      {
        title: "Transparent & Affordable",
        description: "Transparent, one-time registration fee (₹399 for Female, ₹799 for Male) with complete service dignity.",
      },
      {
        title: "Community Matchmaking",
        description: "Specialized matchmaking for Agarwal, Baniya, Brahmin, Punjabi, and prominent Haryana communities.",
      },
    ],
    faqs: [
      {
        question: "Where is NNVS Matrimony located in Haryana?",
        answer:
          "Our registered headquarters is located at 6/34, Near Guru Kirpa Bister House, Patel Nagar, Hisar, Haryana - 125001.",
      },
      {
        question: "How do I register a candidate from Haryana?",
        answer:
          "You can register online directly through our website or reach out to our WhatsApp support helpline at +91 9871592002 for guided onboarding.",
      },
    ],
  },

  hisar: {
    slug: "hisar",
    type: "location",
    title: "Hisar Marriage Bureau & Vivah Sewa",
    metaTitle: "Hisar Marriage Bureau & Vivah Sewa | RishteClub",
    metaDescription:
      "Official Marriage Bureau in Hisar, Haryana. Visit or connect with NNVS Matrimony at Patel Nagar for verified local and regional matrimonial alliances.",
    heading: "Hisar Marriage Bureau & Vivah Sewa",
    subheading: "Home of NNVS Matrimony – Serving Hisar and surrounding districts with verified family alliances.",
    hindiHeading: "हिसार विवाह सेवा — पटेल नगर से संचालित विश्वसनीय केंद्र",
    badge: "HEADQUARTERS LOCATION",
    targetQuery: { query: "Hisar" },
    overview:
      "Hisar is the home base of NNVS Matrimony (Nar Naari Vivah Sewa) and RishteClub. Located in Patel Nagar, Hisar, our team works tirelessly to unite families across Haryana, Punjab, and Delhi NCR with genuine, background-verified prospective brides and grooms.",
    keyFeatures: [
      {
        title: "Local Trust & Accessibility",
        description: "Serving Hisar families with personalized attention, integrity, and deep respect for Indian marriage customs.",
      },
      {
        title: "Government Registered Entity",
        description: "Operated by Trendy Traders (GSTIN: 06APYPD6931J1ZE, MSME Udyam: UDYAM-HR-06-0012710).",
      },
      {
        title: "Complete All-Haryana Reach",
        description: "Direct connections extending across Hansi, Fatehabad, Sirsa, Jind, Bhiwani, and Rohtak.",
      },
    ],
    faqs: [
      {
        question: "What is the official address in Hisar?",
        answer:
          "Our registered place of business is 6/34, Near Guru Kirpa Bister House, Patel Nagar, Hisar, Haryana - 125001.",
      },
      {
        question: "Can Hisar families view profiles from Delhi and other states?",
        answer:
          "Yes. RishteClub connects Hisar families with suitable alliances across Delhi NCR, Haryana, Punjab, Rajasthan, and Chandigarh.",
      },
    ],
  },

  agarwal: {
    slug: "agarwal",
    type: "community",
    title: "Agarwal Matrimony & Rishtey",
    metaTitle: "Agarwal Matrimony & Marriage Profiles | RishteClub",
    metaDescription:
      "Find verified Agarwal brides and grooms in Delhi NCR, Haryana & India. Dedicated Vaishya community matchmaking on RishteClub (NNVS Matrimony).",
    heading: "Agarwal Matrimony & Rishtey",
    subheading: "Trusted matchmaking for Agarwal, Gupta, Bansal, Mittal, Garg, and Vaishya families.",
    hindiHeading: "अग्रवाल विवाह सेवा — सुयोग्य वर-वधू की तलाश",
    badge: "COMMUNITY EXCELLENCE",
    targetQuery: { caste: "Agarwal" },
    overview:
      "The Agarwal community holds deep cultural and business traditions across Delhi NCR, Haryana, Punjab, and Rajasthan. RishteClub provides dedicated Agarwal matrimonial matchmaking, helping families find well-educated, cultured life partners within the Vaishya fraternity with honor and privacy.",
    keyFeatures: [
      {
        title: "Gotra & Community Alignment",
        description: "Structured support for gotra preferences across all 18 Agarwal clans (Garg, Bansal, Mittal, Singhal, Goyal, Jindal, etc.).",
      },
      {
        title: "Business & Corporate Families",
        description: "Extensive representation of entrepreneurs, industrialists, doctors, chartered accountants, and engineers.",
      },
      {
        title: "Vedic Kundli Compatibility",
        description: "Detailed Ashtakoota Guna Milan and planetary alignment checks tailored for Agarwal weddings.",
      },
    ],
    faqs: [
      {
        question: "How do I filter Agarwal profiles on RishteClub?",
        answer:
          "You can browse our directory and filter specifically by Agarwal community, gotra, city, education, and age.",
      },
      {
        question: "Are registration fees recurring for Agarwal members?",
        answer:
          "No. Registration on RishteClub is a one-time fee with zero hidden recurring subscription charges.",
      },
    ],
  },

  baniya: {
    slug: "baniya",
    type: "community",
    title: "Baniya Matrimony & Shaadi Profiles",
    metaTitle: "Baniya Matrimony & Shaadi Profiles | RishteClub",
    metaDescription:
      "Verified Baniya matrimony profiles in Delhi NCR, Haryana & India. Connect with Maheshwari, Khandelwal, and Vaishya families on RishteClub.",
    heading: "Baniya Matrimony & Shaadi Profiles",
    subheading: "Exclusive matchmaking for Vaishya, Baniya, Maheshwari, and Khandelwal families.",
    hindiHeading: "बनिया विवाह सेवा — प्रतिष्ठित परिवारों का संगम",
    badge: "VAISHYA COMMUNITY",
    targetQuery: { caste: "Baniya" },
    overview:
      "RishteClub provides personalized matrimonial matchmaking for the Baniya community across North India. We understand the paramount importance of family values, commercial enterprise, educational achievement, and cultural harmony in Baniya marriages.",
    keyFeatures: [
      {
        title: "Cultured Family Values",
        description: "Curated profiles honoring vegetarian lifestyle, traditional family ethics, and social respect.",
      },
      {
        title: "Multi-City Presence",
        description: "Connecting prospective brides and grooms across Delhi, Gurugram, Hisar, Rohtak, Ludhiana, and Jaipur.",
      },
      {
        title: "Verified Identity & Background",
        description: "Carefully reviewed member biodatas maintaining transparency and authentic matrimonial intent.",
      },
    ],
    faqs: [
      {
        question: "Which sub-castes are included under Baniya matrimony?",
        answer:
          "Our platform serves Agarwal, Gupta, Maheshwari, Khandelwal, Oswal, and related Vaishya community members.",
      },
      {
        question: "Can families initiate contact directly?",
        answer:
          "Yes. Once registered and verified, members can unlock direct contact details and WhatsApp communication with compatible families.",
      },
    ],
  },

  brahmin: {
    slug: "brahmin",
    type: "community",
    title: "Brahmin Matrimony & Vivah Sewa",
    metaTitle: "Brahmin Matrimony & Vivah Sewa | RishteClub",
    metaDescription:
      "Verified Brahmin brides and grooms in Delhi NCR, Haryana & India. Gaur, Saraswat, and Kanyakubja Brahmin rishtey on RishteClub & NNVS Matrimony.",
    heading: "Brahmin Matrimony & Vivah Sewa",
    subheading: "Sacred matrimonial alliances for Gaur, Saraswat, Kanyakubja, and Sanadhya Brahmin families.",
    hindiHeading: "ब्राह्मण विवाह सेवा — संस्कारी एवं सुशिक्षित जीवनसाथी",
    badge: "VEDIC TRADITION",
    targetQuery: { caste: "Brahmin" },
    overview:
      "Brahmin marriages cherish spiritual sanctity, Vedic traditions, and educational distinction. RishteClub (NNVS Matrimony) facilitates dignified matrimonial alliances for Brahmin families in Delhi NCR, Haryana, Punjab, and Uttar Pradesh, with special reverence for horoscope compatibility and gotra traditions.",
    keyFeatures: [
      {
        title: "Gotra & Pravara Reverence",
        description: "Assistance in observing traditional gotra exclusions (Self, Mother, Grandmother) according to Vedic Shastras.",
      },
      {
        title: "AI Kundli Milan Engine",
        description: "Instant Guna Milan scoring and Lal Kitab remedies to evaluate marital harmony.",
      },
      {
        title: "Highly Qualified Candidates",
        description: "Broad directory of professors, civil servants, software engineers, doctors, and legal professionals.",
      },
    ],
    faqs: [
      {
        question: "Does RishteClub calculate Guna Milan for Brahmin horoscopes?",
        answer:
          "Yes. Our built-in AI Astrology engine provides comprehensive 36 Guna Ashtakoota calculation and Manglik dosha evaluation.",
      },
      {
        question: "Can we find Gaur Brahmin profiles in Haryana?",
        answer:
          "Yes. We have a robust representation of Gaur Brahmin families across Hisar, Rohtak, Karnal, Panipat, and Delhi NCR.",
      },
    ],
  },

  punjabi: {
    slug: "punjabi",
    type: "community",
    title: "Punjabi & Khatri Matrimony",
    metaTitle: "Punjabi & Khatri Matrimony | RishteClub",
    metaDescription:
      "Find verified Punjabi, Khatri, and Arora brides and grooms in Delhi NCR, Punjab & Haryana. Trusted matchmaking on RishteClub (NNVS Matrimony).",
    heading: "Punjabi & Khatri Matrimony",
    subheading: "Vibrant matrimonial alliances for Punjabi, Khatri, Arora, and Bhatia families.",
    hindiHeading: "पंजाबी एवं खत्री विवाह सेवा — खुशहाल वैवाहिक संबंध",
    badge: "PUNJABI ALLIANCES",
    targetQuery: { caste: "Punjabi" },
    overview:
      "Punjabi and Khatri weddings are celebrated for their joyful spirit, deep family bonding, and progressive outlook. RishteClub offers specialized matchmaking for Punjabi Hindu and Sikh families across Delhi NCR, Haryana, Punjab, and NRI communities worldwide.",
    keyFeatures: [
      {
        title: "Khatri & Arora Community Reach",
        description: "Prominent representation of Malhotra, Kapoor, Khanna, Chopra, Sethi, Taneja, and Luthra families.",
      },
      {
        title: "Corporate & NRI Connections",
        description: "Connecting local and global Punjabi professionals across the UK, Canada, Australia, and India.",
      },
      {
        title: "Respectful Family Matching",
        description: "Discreet platform ensuring privacy while fostering warm, respectful interactions between families.",
      },
    ],
    faqs: [
      {
        question: "Are NRI Punjabi profiles available on RishteClub?",
        answer:
          "Yes. Many members are based in Delhi NCR and Punjab with immediate family members or partners living abroad.",
      },
      {
        question: "How can parents create a Punjabi matrimony profile?",
        answer:
          "Parents can register easily on the website with basic details and upload recent candidate photographs in minutes.",
      },
    ],
  },
};
