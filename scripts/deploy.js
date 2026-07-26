// deploy.js — push dist/ to neocities and/or nekoweb.
//
//   bun scripts/deploy.js neocities [--dry-run]
//   bun scripts/deploy.js nekoweb   [--dry-run]
//   bun scripts/deploy.js all       [--dry-run]
//
// Keys come from env (never committed):
//   NEOCITIES_API_KEY  — neocities.org > settings > site > API
//   NEKOWEB_API_KEY    — nekoweb.org/api
//
// Each target gets its own build (canonical URL + root base), then dist/
// is uploaded file-by-file. --dry-run builds and lists what WOULD upload.
//
// API shapes (verified 2026-07-02):
//   neocities: POST https://neocities.org/api/upload
//     Authorization: Bearer <key>; multipart form, field name = remote path.
//   nekoweb:   POST https://nekoweb.org/api/files/upload
//     Authorization: <key>; multipart form { pathname: <dir>, files: ... }.
//     100MB/file limit (far above anything we ship).

import { readdirSync, statSync } from "node:fs";
import { join, relative, dirname } from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = join(import.meta.dir, "..");
const DIST = join(ROOT, "dist");

const TARGETS = {
  neocities: {
    site: "https://solarisael.neocities.org",
    key_env: "NEOCITIES_API_KEY",
    // field name = remote path (no leading slash), batched
    upload: async (key, batch) => {
      const form = new FormData();
      for (const f of batch) {
        form.append(
          f.remote,
          new Blob([await Bun.file(f.abs).arrayBuffer()]),
          f.name,
        );
      }
      const res = await fetch("https://neocities.org/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.result !== "success") {
        throw new Error(
          `neocities upload failed (${res.status}): ${JSON.stringify(body)}`,
        );
      }
    },
  },
  nekoweb: {
    site: "https://solarisael.nekoweb.org",
    key_env: "NEKOWEB_API_KEY",
    // one dir per request: { pathname: "/dir", files }
    upload: async (key, batch) => {
      const by_dir = new Map();
      for (const f of batch) {
        const dir = "/" + dirname(f.remote).replace(/^\.$/, "");
        if (!by_dir.has(dir)) by_dir.set(dir, []);
        by_dir.get(dir).push(f);
      }
      for (const [dir, files] of by_dir) {
        const form = new FormData();
        form.append("pathname", dir === "/" ? "/" : dir);
        for (const f of files) {
          form.append(
            "files",
            new Blob([await Bun.file(f.abs).arrayBuffer()]),
            f.name,
          );
        }
        const res = await fetch("https://nekoweb.org/api/files/upload", {
          method: "POST",
          headers: { Authorization: key },
          body: form,
        });
        if (!res.ok) {
          throw new Error(
            `nekoweb upload failed for ${dir} (${res.status}): ${await res.text()}`,
          );
        }
      }
    },
  },
};

const walk = (dir) => {
  const out = [];
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) out.push(...walk(abs));
    else out.push(abs);
  }
  return out;
};

const build_for = (target) => {
  console.log(`[build] ${target.site} base=/`);
  const res = spawnSync("bun", ["run", "build"], {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, SOLARISAEL_SITE: target.site, SOLARISAEL_BASE: "/" },
  });
  if (res.status !== 0) throw new Error("build failed");
};

const deploy = async (name, dry_run) => {
  const target = TARGETS[name];
  const key = process.env[target.key_env];
  if (!key && !dry_run) {
    throw new Error(
      `${target.key_env} not set — get a key and export it, or use --dry-run`,
    );
  }

  build_for(target);

  const files = walk(DIST).map((abs) => ({
    abs,
    remote: relative(DIST, abs).replaceAll("\\", "/"),
    name: abs.split(/[\\/]/).pop(),
  }));
  const total_kb = Math.round(
    files.reduce((s, f) => s + statSync(f.abs).size, 0) / 1024,
  );
  console.log(`[${name}] ${files.length} files, ${total_kb} KB`);

  if (dry_run) {
    for (const f of files) console.log(`  would upload ${f.remote}`);
    return;
  }

  // modest batches keep multipart bodies small and errors legible
  const BATCH = 20;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    let attempt = 0;
    for (;;) {
      try {
        await target.upload(key, batch);
        break;
      } catch (err) {
        if (++attempt >= 3) throw err;
        console.warn(`  retry ${attempt}/2 after: ${err.message}`);
        await new Promise((r) => setTimeout(r, 1500 * attempt));
      }
    }
    console.log(
      `  uploaded ${Math.min(i + BATCH, files.length)}/${files.length}`,
    );
  }
  console.log(`[${name}] deployed -> ${target.site}`);
};

const args = process.argv.slice(2);
const dry_run = args.includes("--dry-run");
const which = args.find((a) => !a.startsWith("--"));
if (!which || (which !== "all" && !TARGETS[which])) {
  console.error(
    "usage: bun scripts/deploy.js <neocities|nekoweb|all> [--dry-run]",
  );
  process.exit(1);
}
for (const name of which === "all" ? Object.keys(TARGETS) : [which]) {
  await deploy(name, dry_run);
}
