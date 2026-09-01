import type { RigSpec } from "./rigbuilder";

export const MANGA_STYLES = [
  "shonen hero",
  "cyber manga",
  "magical girl",
  "dark fantasy",
  "chibi mascot",
] as const;

export type MangaStyle = (typeof MANGA_STYLES)[number];

export type MangaDesign = {
  title: string;
  rigPatch: Partial<RigSpec>;
  skinPrompt: string;
  designNotes: string[];
};

function choosePreset(prompt: string): RigSpec["preset"] {
  const text = prompt.toLowerCase();
  if (/(wolf|fox|cat|dog|beast|lion|horse|creature)/.test(text)) return "quadruped";
  if (/(bird|eagle|angel|wing)/.test(text)) return "avian";
  if (/(spider|insect|robot swarm|six leg|mecha bug)/.test(text)) return "hexapod";
  return "biped";
}

export function designMangaCharacter(prompt: string, style: MangaStyle): MangaDesign {
  const text = prompt.trim() || "original manga hero";
  const lower = text.toLowerCase();
  const chibi = style === "chibi mascot" || lower.includes("chibi");
  const tall = lower.includes("tall") || lower.includes("giant");
  const preset = choosePreset(text);
  const name = text
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(/\s+/)
    .slice(0, 4)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const rigPatch: Partial<RigSpec> = {
    preset,
    name: name ? `${name} Rig` : "Manga Hero Rig",
    height: chibi ? 1.25 : tall ? 2.1 : 1.75,
    headSize: chibi ? 0.34 : 0.22,
    shoulderWidth: chibi ? 0.34 : 0.42,
    thickness: chibi ? 0.12 : 0.09,
    tail: /(tail|fox|cat|wolf|dragon|beast)/.test(lower),
  };

  const skinPrompt = `${style}, ${text}, cel-shaded manga character skin, clean graphic panels, expressive accent colors`;
  const notes = [
    `${preset} skeleton selected from prompt cues`,
    chibi ? "Oversized head and compact proportions" : "Anime-inspired athletic proportions",
    "Animation-ready named bones for retargeting",
  ];

  return {
    title: name || "Manga Hero",
    rigPatch,
    skinPrompt,
    designNotes: notes,
  };
}
