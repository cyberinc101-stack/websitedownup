/**
 * Downloads the public top-sites ranking used by the Website Worth tool and
 * writes two snapshots into data/worth/:
 *   rank-current.json   latest daily list
 *   rank-previous.json  the list from about 90 days earlier (traffic trend)
 *
 * Run from the project root:   npm run worth:ranks
 * Then commit the two JSON files and push. Re-run monthly (or whenever)
 * to keep ranks and trends fresh.
 *
 * Needs Node 18+ (built-in fetch). No API key. Contains no secrets.
 * UI RULE: the provider's name stays in this script only, never in the UI.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";

const TOP_N = 100000;
const TREND_DAYS = 90;
const BASE = "https://tranco-list.eu";
const OUT_DIR = join(process.cwd(), "data", "worth");

function isoDate(daysAgo) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  return d.toISOString().slice(0, 10);
}

async function listIdFor(date) {
  const res = await fetch(BASE + "/daily_list_id?date=" + date + "&subdomains=false");
  if (!res.ok) return null;
  const id = (await res.text()).trim();
  return /^[A-Z0-9]{3,10}$/i.test(id) ? id : null;
}

/** Tries the given day, then up to 4 earlier days (lists appear a day late). */
async function findList(daysAgo) {
  for (let extra = 0; extra < 5; extra++) {
    const date = isoDate(daysAgo + extra);
    const id = await listIdFor(date);
    if (id) return { id, date };
  }
  throw new Error("No ranking list found near " + isoDate(daysAgo));
}

async function download(id) {
  const res = await fetch(BASE + "/download/" + id + "/" + TOP_N);
  if (!res.ok) throw new Error("Download failed for list " + id + " (HTTP " + res.status + ")");
  const text = await res.text();
  const domains = [];
  for (const line of text.split(/\r?\n/)) {
    const comma = line.indexOf(",");
    if (comma < 0) continue;
    const domain = line.slice(comma + 1).trim().toLowerCase();
    if (domain) domains.push(domain);
    if (domains.length >= TOP_N) break;
  }
  if (domains.length < 1000) throw new Error("List " + id + " looks incomplete (" + domains.length + " rows)");
  return domains;
}

async function build(daysAgo, fileName) {
  const { id, date } = await findList(daysAgo);
  console.log("Downloading list " + id + " (" + date + ")...");
  const domains = await download(id);
  const path = join(OUT_DIR, fileName);
  writeFileSync(path, JSON.stringify({ date, domains: domains.join("\n") }));
  console.log("  wrote " + domains.length.toLocaleString("en-US") + " domains to data/worth/" + fileName);
}

try {
  await build(1, "rank-current.json");
  await build(1 + TREND_DAYS, "rank-previous.json");
  console.log("Done. Commit data/worth/rank-current.json and rank-previous.json, then push.");
} catch (err) {
  console.error("Rank data update failed: " + (err instanceof Error ? err.message : String(err)));
  process.exit(1);
}
