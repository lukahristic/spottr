/*
 * One-off prep step: download DiceBear avatars into public/avatars/<seed>.png
 * so the Remotion render is fully offline (per the Remotion skill: assets live
 * in public/ and are referenced with staticFile()).
 *
 * Run from the video/ folder:  node scripts/fetch-avatars.mjs
 *
 * Re-run only when the roster in src/data/members.ts changes. Keep SEEDS in
 * sync with that file's `seed` values.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "public", "avatars");

// Must match `seed` in src/data/members.ts (MEMBERS + ARRIVING_MEMBER).
const SEEDS = [
  "maya-r",
  "alex-j",
  "sam-k",
  "jordan-t",
  "chris-m",
  "noah-b",
  "lena-k",
  "priya-d",
];

// DiceBear v9 'avataaars-neutral' — friendly neutral faces. Surface-tinted
// background so each PNG sits flush inside the card's avatar circle.
const STYLE = "avataaars-neutral";
const BG = "f2eee7"; // COLORS.surface
const SIZE = 160;

function url(seed) {
  const q = new URLSearchParams({
    seed,
    size: String(SIZE),
    backgroundColor: BG,
    radius: "50",
  });
  return `https://api.dicebear.com/9.x/${STYLE}/png?${q.toString()}`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const seed of SEEDS) {
    const res = await fetch(url(seed));
    if (!res.ok) {
      throw new Error(`Failed ${seed}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const file = join(OUT_DIR, `${seed}.png`);
    await writeFile(file, buf);
    console.log(`✓ ${seed}.png (${buf.length} bytes)`);
  }
  console.log(`\nDone — ${SEEDS.length} avatars in public/avatars/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
