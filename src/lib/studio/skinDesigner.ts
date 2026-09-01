export type SkinDesign = {
  mapUrl: string;
  mapName: string;
  color: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
};

type Palette = {
  name: string;
  colors: string[];
  base: string;
  metalness: number;
  roughness: number;
  emissive: string;
  emissiveIntensity: number;
};

const PALETTES: Record<string, Palette> = {
  cyberpunk: {
    name: "Cyberpunk Circuit",
    colors: ["#090d18", "#13243a", "#00d9ff", "#ff3cac", "#8b5cf6"],
    base: "#16243b",
    metalness: 0.72,
    roughness: 0.27,
    emissive: "#00c8ff",
    emissiveIntensity: 1.35,
  },
  obsidian: {
    name: "Obsidian Forge",
    colors: ["#070708", "#171820", "#414553", "#a7b0c2", "#ff8a3d"],
    base: "#20232c",
    metalness: 0.86,
    roughness: 0.22,
    emissive: "#ff5e2c",
    emissiveIntensity: 0.42,
  },
  forest: {
    name: "Forest Relic",
    colors: ["#0b1713", "#173a2a", "#34785a", "#b5c982", "#d59b50"],
    base: "#2d634c",
    metalness: 0.22,
    roughness: 0.76,
    emissive: "#0b241b",
    emissiveIntensity: 0.12,
  },
  arctic: {
    name: "Arctic Alloy",
    colors: ["#101a26", "#2c5670", "#8bd3ed", "#e8fbff", "#7d8cff"],
    base: "#8bd3ed",
    metalness: 0.58,
    roughness: 0.3,
    emissive: "#53b9ff",
    emissiveIntensity: 0.58,
  },
  stone: {
    name: "Ancient Stone",
    colors: ["#24221f", "#554e43", "#827760", "#c9b89a", "#d46b42"],
    base: "#827760",
    metalness: 0.05,
    roughness: 0.92,
    emissive: "#160b06",
    emissiveIntensity: 0.08,
  },
};

function hashPrompt(prompt: string) {
  return [...prompt].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
}

function paletteFor(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("cyber") || text.includes("neon") || text.includes("circuit"))
    return PALETTES.cyberpunk;
  if (text.includes("obsidian") || text.includes("black") || text.includes("metal"))
    return PALETTES.obsidian;
  if (text.includes("forest") || text.includes("nature") || text.includes("green"))
    return PALETTES.forest;
  if (text.includes("ice") || text.includes("arctic") || text.includes("blue"))
    return PALETTES.arctic;
  if (text.includes("stone") || text.includes("rock") || text.includes("ancient"))
    return PALETTES.stone;
  const keys = Object.keys(PALETTES);
  return PALETTES[keys[hashPrompt(prompt) % keys.length]!]!;
}

export function createSkinDesign(prompt: string): SkinDesign {
  if (typeof document === "undefined") {
    throw new Error("Skin design generation requires a browser canvas");
  }

  const cleanPrompt = prompt.trim() || "cinematic sci-fi armor";
  const palette = paletteFor(cleanPrompt);
  const seed = hashPrompt(cleanPrompt);
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not create a texture canvas");

  const gradient = ctx.createLinearGradient(0, 0, 512, 512);
  gradient.addColorStop(0, palette.colors[0]!);
  gradient.addColorStop(0.34, palette.colors[1]!);
  gradient.addColorStop(0.68, palette.colors[2]!);
  gradient.addColorStop(1, palette.colors[0]!);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  let cursor = seed;
  const next = () => {
    cursor = (cursor * 1664525 + 1013904223) >>> 0;
    return cursor / 4294967296;
  };

  const has = (keyword: string) => cleanPrompt.toLowerCase().includes(keyword);
  const useCircuit = has("circuit") || has("cyber") || has("tech") || has("armor");
  const useHex = has("hex") || has("scale") || has("dragon") || has("reptile");
  const useNoise = has("stone") || has("rock") || has("rough") || has("organic");

  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 1500; i += 1) {
    const x = next() * 512;
    const y = next() * 512;
    const radius = 0.4 + next() * 2.8;
    ctx.fillStyle = palette.colors[Math.floor(next() * palette.colors.length)]!;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (useHex) {
    ctx.globalAlpha = 0.42;
    ctx.strokeStyle = palette.colors[3]!;
    ctx.lineWidth = 2;
    const size = 34;
    for (let row = -1; row < 17; row += 1) {
      for (let col = -1; col < 17; col += 1) {
        const x = col * size + (row % 2) * size * 0.5;
        const y = row * size * 0.86;
        ctx.beginPath();
        for (let side = 0; side <= 6; side += 1) {
          const angle = (Math.PI / 3) * side;
          const px = x + Math.cos(angle) * size * 0.48;
          const py = y + Math.sin(angle) * size * 0.48;
          if (side === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }
  }

  if (useCircuit) {
    ctx.globalAlpha = 0.78;
    ctx.strokeStyle = palette.colors[2]!;
    ctx.lineWidth = 3;
    for (let i = 0; i < 16; i += 1) {
      const y = 22 + ((i * 47 + seed) % 470);
      const x = 12 + ((i * 73 + seed) % 150);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 68, y);
      ctx.lineTo(x + 92, y + 24);
      ctx.lineTo(x + 190, y + 24);
      ctx.stroke();
      ctx.fillStyle = palette.colors[3]!;
      ctx.beginPath();
      ctx.arc(x + 190, y + 24, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (useNoise) {
    ctx.globalAlpha = 0.3;
    ctx.strokeStyle = palette.colors[3]!;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 24; i += 1) {
      ctx.beginPath();
      ctx.moveTo(0, i * 24 + (seed % 13));
      for (let x = 0; x <= 512; x += 32) {
        ctx.lineTo(x, i * 24 + Math.sin(x * 0.035 + i) * 10 + (seed % 13));
      }
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 0.72;
  const vignette = ctx.createRadialGradient(256, 256, 80, 256, 256, 360);
  vignette.addColorStop(0, "rgba(255,255,255,0.08)");
  vignette.addColorStop(1, "rgba(0,0,0,0.6)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, 512, 512);
  ctx.globalAlpha = 1;

  return {
    mapUrl: canvas.toDataURL("image/png"),
    mapName: `AI Skin · ${palette.name}`,
    color: palette.base,
    metalness: palette.metalness,
    roughness: palette.roughness,
    emissive: palette.emissive,
    emissiveIntensity: palette.emissiveIntensity,
  };
}

export const SKIN_DESIGN_PRESETS = [
  "neon cyberpunk circuit armor",
  "arctic alloy with blue emissive panels",
  "ancient mossy stone with warm metal accents",
  "obsidian combat armor with orange energy lines",
] as const;

export const DEFAULT_SKIN_PROMPT = SKIN_DESIGN_PRESETS[0];

// Keep the palette module tree-shakeable while making the intent obvious in code search.
export const isSkinDesign = (value: unknown): value is SkinDesign =>
  typeof value === "object" && value !== null && "mapUrl" in value && "color" in value;

export function previewPalette(prompt: string) {
  const palette = paletteFor(prompt.trim() || DEFAULT_SKIN_PROMPT);
  return { ...palette, accent: palette.colors[2] };
}
