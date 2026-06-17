/**
 * A comprehensive default move-in checklist tailored for a family moving into a
 * newly purchased home with a toddler and a baby on the way. Used to seed the
 * database (npm run db:seed) and via the "Load starter checklist" button when
 * the move-in list is empty.
 */
export type DefaultMoveTask = {
  title: string;
  category: string;
  priority: "high" | "medium" | "low";
  notes?: string;
};

export const MOVE_IN_CATEGORIES = [
  "Before Move-In",
  "Utilities & Services",
  "Address & Accounts",
  "Safety & Childproofing",
  "Cleaning & Maintenance",
  "Setup & Unpacking",
  "Admin & Documents",
  "Kids & Family",
] as const;

export const DEFAULT_MOVE_TASKS: DefaultMoveTask[] = [
  // Before Move-In
  { title: "Do a final walkthrough before closing", category: "Before Move-In", priority: "high" },
  { title: "Get all keys, garage remotes, and mailbox keys from sellers", category: "Before Move-In", priority: "high" },
  { title: "Locate water shutoff, gas shutoff, and circuit breaker panel", category: "Before Move-In", priority: "high", notes: "Photograph and label so the whole family knows where they are." },
  { title: "Change all exterior door locks or re-key", category: "Before Move-In", priority: "high" },
  { title: "Reserve movers or moving truck", category: "Before Move-In", priority: "high" },
  { title: "Measure doorways and large furniture before moving day", category: "Before Move-In", priority: "medium" },
  { title: "Take photos of the empty house for records / insurance", category: "Before Move-In", priority: "low" },

  // Utilities & Services
  { title: "Set up electricity account", category: "Utilities & Services", priority: "high" },
  { title: "Set up gas / heating account", category: "Utilities & Services", priority: "high" },
  { title: "Set up water & sewer account", category: "Utilities & Services", priority: "high" },
  { title: "Set up trash & recycling pickup", category: "Utilities & Services", priority: "medium", notes: "Confirm pickup day and where bins go." },
  { title: "Schedule internet & Wi-Fi installation", category: "Utilities & Services", priority: "high", notes: "Book early — installer slots fill up." },
  { title: "Transfer or set up home security / monitoring", category: "Utilities & Services", priority: "medium" },
  { title: "Set up lawn care / snow removal if needed", category: "Utilities & Services", priority: "low" },

  // Address & Accounts
  { title: "Submit USPS change of address / mail forwarding", category: "Address & Accounts", priority: "high" },
  { title: "Update address on driver's licenses", category: "Address & Accounts", priority: "high" },
  { title: "Update address with employers / HR", category: "Address & Accounts", priority: "medium" },
  { title: "Update address with banks & credit cards", category: "Address & Accounts", priority: "medium" },
  { title: "Update address on auto & health insurance", category: "Address & Accounts", priority: "medium" },
  { title: "Update voter registration", category: "Address & Accounts", priority: "low" },
  { title: "Update address for subscriptions & deliveries (Amazon, etc.)", category: "Address & Accounts", priority: "low" },

  // Safety & Childproofing
  { title: "Test & replace batteries in all smoke detectors", category: "Safety & Childproofing", priority: "high" },
  { title: "Install / test carbon monoxide detectors", category: "Safety & Childproofing", priority: "high" },
  { title: "Anchor heavy furniture and TVs to walls", category: "Safety & Childproofing", priority: "high", notes: "Critical with a toddler — tip-over prevention." },
  { title: "Install baby gates at stairs", category: "Safety & Childproofing", priority: "high" },
  { title: "Add outlet covers and cabinet/drawer locks", category: "Safety & Childproofing", priority: "high" },
  { title: "Cordless or tied-up window blind cords", category: "Safety & Childproofing", priority: "high" },
  { title: "Set water heater to 120°F to prevent scald burns", category: "Safety & Childproofing", priority: "medium" },
  { title: "Locate / buy a fire extinguisher for the kitchen", category: "Safety & Childproofing", priority: "medium" },
  { title: "Make a family fire escape plan", category: "Safety & Childproofing", priority: "low" },

  // Cleaning & Maintenance
  { title: "Deep clean before furniture arrives", category: "Cleaning & Maintenance", priority: "high", notes: "Easiest while the house is empty." },
  { title: "Replace HVAC air filters", category: "Cleaning & Maintenance", priority: "medium" },
  { title: "Change refrigerator water filter", category: "Cleaning & Maintenance", priority: "low" },
  { title: "Check & clean dryer vent", category: "Cleaning & Maintenance", priority: "medium" },
  { title: "Note all paint colors / finishes for touch-ups", category: "Cleaning & Maintenance", priority: "low" },

  // Setup & Unpacking
  { title: "Set up the nursery first (toddler + baby on the way)", category: "Setup & Unpacking", priority: "high" },
  { title: "Set up beds and bedrooms day one", category: "Setup & Unpacking", priority: "high" },
  { title: "Unpack kitchen essentials", category: "Setup & Unpacking", priority: "medium" },
  { title: "Set up the Wi-Fi router and test coverage", category: "Setup & Unpacking", priority: "medium" },
  { title: "Stock a first-night box (toiletries, snacks, chargers, meds)", category: "Setup & Unpacking", priority: "high" },
  { title: "Hang shower curtains and stock bathrooms", category: "Setup & Unpacking", priority: "low" },

  // Admin & Documents
  { title: "Store closing documents somewhere safe", category: "Admin & Documents", priority: "high" },
  { title: "Set up homeowners insurance & save policy info", category: "Admin & Documents", priority: "high" },
  { title: "Set up property tax / mortgage autopay", category: "Admin & Documents", priority: "medium" },
  { title: "Find local DMV, pediatrician, and urgent care", category: "Admin & Documents", priority: "medium" },
  { title: "Create a home maintenance binder / folder", category: "Admin & Documents", priority: "low" },

  // Kids & Family
  { title: "Transfer / find new pediatrician near the house", category: "Kids & Family", priority: "high" },
  { title: "Update daycare / preschool of new address", category: "Kids & Family", priority: "medium" },
  { title: "Childproof and set up Parker's room familiar items", category: "Kids & Family", priority: "high", notes: "Keep favorite toys/blanket accessible to ease the transition." },
  { title: "Plan baby's room before the September due date", category: "Kids & Family", priority: "high" },
  { title: "Meet the neighbors / find nearby families", category: "Kids & Family", priority: "low" },
  { title: "Locate nearest parks and playgrounds", category: "Kids & Family", priority: "low" },
];
