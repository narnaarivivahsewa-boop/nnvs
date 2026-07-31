export type VendorCategory =
  | "photographer"
  | "videographer"
  | "makeup_artist"
  | "mehndi_artist"
  | "banquet"
  | "caterer"
  | "decorator"
  | "dj"
  | "pandit"
  | "band"
  | "travel"
  | "jewellery"
  | "bridal_wear"
  | "groom_wear"
  | "gift"
  | "other";

export type VendorStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "blocked";

export interface Vendor {
  id: string;

  ownerId: string;

  businessName: string;

  category: VendorCategory;

  contactPerson: string;

  mobile: string;

  email?: string;

  city: string;

  state: string;

  address?: string;

  description?: string;

  website?: string;

  logo?: string;

  coverImage?: string;

  verified: boolean;

  featured: boolean;

  status: VendorStatus;

  createdAt: string;

  updatedAt: string;
}