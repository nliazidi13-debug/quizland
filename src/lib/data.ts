import type { AvatarId, Badge, Domain, Level } from "@/lib/types";
import { ALL_DOMAINS_SLUG, questionsByDomain } from "@/lib/questions";

export const avatarPresets: Record<AvatarId, { from: string; to: string }> = {
  "violet-orange": { from: "#7B2FE3", to: "#FF7A1A" },
  "teal-yellow": { from: "#17D1C9", to: "#FFD23F" },
  "red-blue": { from: "#F6302F", to: "#2652D9" },
  "orange-red": { from: "#FF7A1A", to: "#FF4D6D" },
  "blue-teal": { from: "#2652D9", to: "#17D1C9" },
  "yellow-orange": { from: "#FFD23F", to: "#FF7A1A" },
};

export const avatarIds = Object.keys(avatarPresets) as AvatarId[];

const domainMeta: Omit<Domain, "questions">[] = [
  { slug: "histoire", icon: "🏛", name: "Histoire", difficulty: "Moyen" },
  { slug: "geographie", icon: "🌍", name: "Géographie", difficulty: "Facile" },
  { slug: "sciences", icon: "🔬", name: "Sciences", difficulty: "Difficile" },
  { slug: "informatique", icon: "💻", name: "Informatique", difficulty: "Difficile" },
  { slug: "litterature", icon: "📚", name: "Littérature", difficulty: "Moyen" },
  { slug: "arts", icon: "🎨", name: "Arts", difficulty: "Facile" },
  { slug: "cinema", icon: "🎬", name: "Cinéma & Séries", difficulty: "Facile" },
  { slug: "musique", icon: "🎵", name: "Musique", difficulty: "Moyen" },
  { slug: "sports", icon: "⚽", name: "Sports", difficulty: "Moyen" },
  { slug: "nature", icon: "🌿", name: "Nature & Animaux", difficulty: "Facile" },
  { slug: "sante", icon: "🏥", name: "Santé", difficulty: "Moyen" },
  { slug: "economie", icon: "💰", name: "Économie", difficulty: "Difficile" },
  { slug: "religions", icon: "🕊", name: "Religions", difficulty: "Moyen" },
  { slug: "mythologie", icon: "⚡", name: "Mythologie", difficulty: "Moyen" },
  { slug: "culture-generale", icon: "🌎", name: "Culture Générale", difficulty: "Facile" },
  { slug: "univers", icon: "🌌", name: "Univers", difficulty: "Moyen" },
];

// Question counts are derived from the real question bank so this number
// can never drift out of sync with what's actually playable.
export const domains: Domain[] = domainMeta.map((d) => ({
  ...d,
  questions: questionsByDomain[d.slug]?.length ?? 0,
}));

export const domainsPopular = domains.slice(0, 4);

export const totalQuestions = domains.reduce((sum, d) => sum + d.questions, 0);

// Virtual entry mixing every domain's pool together — not a real question
// bank, so it's kept out of `domains` (which drives totals and the admin
// Domaines tab) and added only where a "play everything" option belongs.
export const allDomainsOption: Domain = {
  slug: ALL_DOMAINS_SLUG,
  icon: "🎲",
  name: "Tout domaine",
  questions: totalQuestions,
  difficulty: "Moyen",
};

export const domainsWithAll = [allDomainsOption, ...domains];

export const levels: Level[] = [
  { id: 1, name: "Débutant", stars: "⭐" },
  { id: 2, name: "Facile", stars: "⭐⭐" },
  { id: 3, name: "Moyen", stars: "⭐⭐⭐" },
  { id: 4, name: "Difficile", stars: "⭐⭐⭐⭐" },
  { id: 5, name: "Expert", stars: "⭐⭐⭐⭐⭐" },
];

export const badges: Badge[] = [
  { icon: "🔥", label: "Série x7" },
  { icon: "🧠", label: "Cerveau" },
  { icon: "⚡", label: "Rapide" },
  { icon: "🎯", label: "Précision" },
];

export function getDomain(slug: string): Domain | undefined {
  if (slug === ALL_DOMAINS_SLUG) return allDomainsOption;
  return domains.find((d) => d.slug === slug);
}
