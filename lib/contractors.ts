export type Contractor = {
  name: string;
  /** What kind of work they do, e.g. "Well & Water", "Carpentry". */
  category: string;
  /** Short blurb about the company / why we trust them. */
  description?: string;
  phone?: string;
  /** Secondary number, e.g. a toll-free line. */
  altPhone?: string;
  email?: string;
  website?: string;
  address?: string;
  /** Free-form notes — who recommended them, account numbers, etc. */
  notes?: string;
};

/**
 * Trusted contractors the family has vetted. Add new trades here (carpentry,
 * landscaping, handyman, etc.) as we find people we'd hire again.
 */
export const CONTRACTORS: Contractor[] = [
  {
    name: "H2O Care",
    category: "Well & Water",
    description:
      "Well water testing, filtration, softening, and well pump service. Serving eastern Massachusetts since 1989.",
    phone: "(978) 777-8330",
    altPhone: "(800) 539-1100",
    website: "https://h2ocare.com",
    address: "18 Lonergan Rd, Middleton, MA 01949",
  },
];
