import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, extname } from "node:path";
import { resolveContractAddress, resolveSocial, isAddressShaped } from "../js/gate-logic.mjs";

const root = join(import.meta.dirname, "..");
const registry = JSON.parse(readFileSync(join(root, "registry.json"), "utf8"));

let failures = 0;
function check(name, pass, detail) {
  if (pass) {
    console.log(`ok   ${name}`);
  } else {
    failures++;
    console.log(`FAIL ${name}${detail ? " — " + detail : ""}`);
  }
}

// 1. Registry pattern: every external fact must carry a status.
for (const [key, record] of Object.entries({
  contractAddress: registry.contractAddress,
  chain: registry.chain,
  x: registry.socials.x,
  github: registry.socials.github,
})) {
  check(`registry.${key} has a status field`, typeof record.status === "string", JSON.stringify(record));
}

// 2. Gate rule: a throwaway address-shaped string must NOT resolve, proving
// the gate can fail (never a blanket accept-any-0x-string).
const throwaway = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
check(
  "gate rejects a throwaway address-shaped string",
  isAddressShaped(throwaway) && resolveContractAddress(throwaway, registry).ok === false,
);

// 3. Contract address resolution must track whatever the registry states:
// inert while absent, resolved once stated with a matching value.
{
  const record = registry.contractAddress;
  const result = resolveContractAddress(record.value, registry);
  const expectedOk = record.status === "stated";
  check(
    `contract address resolves ${expectedOk ? "live" : "inert"} while registry status is "${record.status}"`,
    result.ok === expectedOk,
    JSON.stringify({ record, result }),
  );
}

// 4. Socials must be inert while unconfirmed.
for (const key of ["x", "github"]) {
  check(`social '${key}' resolves inert while unconfirmed`, resolveSocial(key, registry).ok === false);
}

// 5. index.html must render the CA slot and both social icons inert-by-default,
// anchored on data- attributes (never on text content).
const html = readFileSync(join(root, "index.html"), "utf8");
check("index.html CA slot anchored on data-ca-slot", html.includes("data-ca-slot"));
check("index.html CA slot defaults to data-state=\"inert\"", /data-ca-slot\s+data-state="inert"/.test(html));
check("index.html X icon anchored on data-social=\"x\" and inert by default", /data-social="x"[^>]*data-state="inert"/.test(html));
check("index.html GitHub icon anchored on data-social=\"github\" and inert by default", /data-social="github"[^>]*data-state="inert"/.test(html));

// 6. Palette rule: hex/rgb color literals may only live in css/tokens.css.
const colorLiteral = /#[0-9a-fA-F]{3,8}\b|rgb\(|rgba\(/;
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name.startsWith(".")) continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
const codeFiles = walk(root).filter((p) =>
  [".css", ".js", ".mjs", ".html"].includes(extname(p)) && p !== join(root, "css", "tokens.css")
);
const offenders = codeFiles.filter((p) => colorLiteral.test(readFileSync(p, "utf8")));
check("no color literals outside css/tokens.css", offenders.length === 0, offenders.join(", "));

// 7. Repo hygiene: no CLAUDE.md / .claude directory.
check("no CLAUDE.md present", !existsSync(join(root, "CLAUDE.md")));
check("no .claude/ present", !existsSync(join(root, ".claude")));

console.log(`\n${failures === 0 ? "PASS" : "FAIL"} — ${failures} failing gate(s)`);
process.exit(failures === 0 ? 0 : 1);
