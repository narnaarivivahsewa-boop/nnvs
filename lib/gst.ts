export const BUSINESS_INFO = {
  brandName: "RishteClub",
  tagline: "Apno Ke Liye Sahi Rishta",
  domain: "https://rishteclub.com",
  canonicalDomain: "https://rishteclub.com",
  
  // Operational & Legacy Brand Association
  managedBy: "NNVS Matrimony",
  managedByFull: "NNVS Matrimony – Nar Naari Vivah Sewa",
  associatedBrand: "NNVS Matrimony – Nar Naari Vivah Sewa",
  legacyBrandShort: "NNVS Matrimony",
  
  // Legal & GST Registered Entity Details (Official GST Certificate)
  tradeName: "Trendy Traders",
  legalEntityName: "Trendy Traders",
  proprietor: "Rahul Dhamija",
  gstin: "06APYPD6931J1ZE",
  stateCode: "06",
  stateName: "Haryana",
  country: "India",
  sacCode: "998399",
  sacDescription: "Online Matrimonial Matchmaking & Database Services",
  
  // Support Contacts
  email: "narnaarivivahsewa@gmail.com",
  helplineNumbers: ["+91 9871592002", "+91 7015812359"],
  callingHours: "5:30 PM – 7:30 PM IST",
  
  // Pricing Structure
  fees: {
    female: 399,
    male: 799,
    gstRate: 0.18,
  },
} as const;

export const LEGAL_DISCLAIMER_TEXT = 
  "RishteClub (https://rishteclub.com) is a matrimonial matchmaking platform owned and operated by Trendy Traders (Proprietor: Rahul Dhamija, GSTIN: 06APYPD6931J1ZE) and managed by NNVS Matrimony – Nar Naari Vivah Sewa.";

/**
 * Converts a numeric amount to Indian Rupee Words for GST Tax Invoices
 */
export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertChunk(num: number): string {
    let str = "";
    if (num >= 100) {
      str += ones[Math.floor(num / 100)] + " Hundred ";
      num %= 100;
    }
    if (num >= 20) {
      str += tens[Math.floor(num / 10)] + " ";
      num %= 10;
    }
    if (num > 0) {
      str += ones[num] + " ";
    }
    return str.trim();
  }

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let words = "";

  const crore = Math.floor(rupees / 10000000);
  let rem = rupees % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem %= 100000;
  const thousand = Math.floor(rem / 1000);
  rem %= 1000;
  const hundredChunk = rem;

  if (crore > 0) words += convertChunk(crore) + " Crore ";
  if (lakh > 0) words += convertChunk(lakh) + " Lakh ";
  if (thousand > 0) words += convertChunk(thousand) + " Thousand ";
  if (hundredChunk > 0) words += convertChunk(hundredChunk) + " ";

  words = words.trim();
  if (!words) words = "Zero";
  words += " Rupees";

  if (paise > 0) {
    words += " and " + convertChunk(paise) + " Paise";
  }

  return words + " Only";
}

/**
 * Calculates GST breakdown for an invoice
 */
export function calculateGstBreakdown(taxableAmount: number, isInterstate: boolean = false) {
  const roundedTaxable = Math.round(taxableAmount * 100) / 100;
  const totalTax = Math.round(roundedTaxable * BUSINESS_INFO.fees.gstRate * 100) / 100;
  const totalAmount = Math.round((roundedTaxable + totalTax) * 100) / 100;

  if (isInterstate) {
    return {
      taxableAmount: roundedTaxable,
      cgstRate: 0,
      cgstAmount: 0,
      sgstRate: 0,
      sgstAmount: 0,
      igstRate: 0.18,
      igstAmount: totalTax,
      totalTax,
      totalAmount,
    };
  } else {
    const halfTax = Math.round((totalTax / 2) * 100) / 100;
    return {
      taxableAmount: roundedTaxable,
      cgstRate: 0.09,
      cgstAmount: halfTax,
      sgstRate: 0.09,
      sgstAmount: totalTax - halfTax,
      igstRate: 0,
      igstAmount: 0,
      totalTax,
      totalAmount,
    };
  }
}
