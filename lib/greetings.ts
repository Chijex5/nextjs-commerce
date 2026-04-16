export type GreetingPeriod = "morning" | "afternoon" | "night";

type GreetingType = "name" | "time" | "none";

type GreetingTemplate = {
  type: GreetingType;
  text: string;
};

const GREETINGS_BY_PERIOD: Record<GreetingPeriod, GreetingTemplate[]> = {
  morning: [
    { type: "name", text: "Good morning, {name}." },
    { type: "name", text: "Morning, {name}. Time to shine." },
    { type: "name", text: "Rise and win, {name}." },
    { type: "name", text: "Fresh start, {name}." },
    { type: "time", text: "The early hours are on your side." },
    { type: "time", text: "Sunrise mode activated." },
    { type: "time", text: "Morning momentum looks good on you." },
    { type: "time", text: "New day, clean slate, full energy." },
    { type: "none", text: "Stay hydrated." },
    { type: "none", text: "Small steps still count." },
    { type: "none", text: "You are doing better than you think." },
    { type: "none", text: "Let's make this day count." },
  ],
  afternoon: [
    { type: "name", text: "Good afternoon, {name}." },
    { type: "name", text: "Hope your day is flowing well, {name}." },
    { type: "name", text: "Welcome back, {name}." },
    { type: "name", text: "Keep the rhythm going, {name}." },
    { type: "time", text: "Midday check-in: you are on track." },
    { type: "time", text: "Afternoon focus is a superpower." },
    { type: "time", text: "Still plenty of day left to win." },
    { type: "time", text: "That afternoon grind is paying off." },
    { type: "none", text: "Quick stretch, then back at it." },
    { type: "none", text: "Progress over perfection." },
    { type: "none", text: "You have got this." },
    { type: "none", text: "One task at a time." },
  ],
  night: [
    { type: "name", text: "Good evening, {name}." },
    { type: "name", text: "Evening, {name}. Nice to see you." },
    { type: "name", text: "Great to have you here tonight, {name}." },
    { type: "name", text: "Welcome back for the night shift, {name}." },
    { type: "time", text: "The night owl strikes again." },
    { type: "time", text: "Night focus can be magic." },
    { type: "time", text: "Quiet hours, sharp results." },
    { type: "time", text: "Ending the day strong." },
    { type: "none", text: "Remember to rest when you are done." },
    { type: "none", text: "You made it through a lot today." },
    { type: "none", text: "A little progress tonight matters." },
    { type: "none", text: "Keep going, but be kind to yourself." },
  ],
};

const getFirstName = (name?: string | null) => {
  if (!name) return "";
  const cleaned = name.trim();
  if (!cleaned) return "";
  return cleaned.split(/\s+/)[0] ?? "";
};

export const getGreetingPeriod = (dateTime: Date): GreetingPeriod => {
  const hour = dateTime.getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "night";
};

export type GreetingInput = {
  dateTime: Date;
  name?: string | null;
  rng?: () => number;
};

const pad2 = (value: number) => value.toString().padStart(2, "0");

const dateSeed = (dateTime: Date) =>
  `${dateTime.getFullYear()}-${pad2(dateTime.getMonth() + 1)}-${pad2(
    dateTime.getDate(),
  )}`;

const hashString = (value: string) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getSeededIndex = (
  dateTime: Date,
  period: GreetingPeriod,
  size: number,
) => {
  if (size <= 1) return 0;
  const seed = `${dateSeed(dateTime)}:${period}`;
  return hashString(seed) % size;
};

export const getGreeting = ({ dateTime, name, rng }: GreetingInput) => {
  const period = getGreetingPeriod(dateTime);
  const firstName = getFirstName(name);
  const templates = GREETINGS_BY_PERIOD[period].filter(
    (template) => template.type !== "name" || Boolean(firstName),
  );

  const randomIndex = rng
    ? Math.min(Math.floor(rng() * templates.length), templates.length - 1)
    : getSeededIndex(dateTime, period, templates.length);
  const selected = templates[randomIndex] ?? templates[0];

  if (!selected) {
    return firstName ? `Hello, ${firstName}.` : "Hello.";
  }

  return selected.text.replace("{name}", firstName);
};

export const totalGreetingCount = Object.values(GREETINGS_BY_PERIOD).reduce(
  (sum, greetings) => sum + greetings.length,
  0,
);
