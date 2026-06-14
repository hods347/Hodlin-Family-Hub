export type NavItem = {
  name: string;
  href: string;
  emoji: string;
  description: string;
  /** Tailwind gradient classes for the dashboard card accent. */
  accent: string;
};

export const NAV_ITEMS: NavItem[] = [
  {
    name: "Move-In Prep",
    href: "/move-in",
    emoji: "📦",
    description: "Everything to do for the new house — check it off as you go.",
    accent: "from-indigo-500 to-violet-500",
  },
  {
    name: "Home Projects",
    href: "/improvements",
    emoji: "🛠️",
    description: "Inspection items & upgrades with priority, cost, and calendar reminders.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    name: "Meal Planner",
    href: "/meals",
    emoji: "🍽️",
    description: "Build a weekly plan from your favorite meals.",
    accent: "from-emerald-500 to-teal-500",
  },
  {
    name: "Baby Scheduler",
    href: "/baby",
    emoji: "🍼",
    description: "Sleep & feeding schedules to hand off to babysitters.",
    accent: "from-pink-500 to-rose-500",
  },
];
