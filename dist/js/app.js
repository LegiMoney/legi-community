import { resolveContractAddress, resolveSocial } from "./gate-logic.mjs";

async function loadRegistry() {
  const res = await fetch("./registry.json", { cache: "no-store" });
  return res.json();
}

function renderContractAddress(registry) {
  const slot = document.querySelector('[data-ca-slot]');
  const valueEl = slot.querySelector('[data-ca-value]');
  const copyBtn = slot.querySelector('[data-ca-copy]');
  const result = resolveContractAddress(registry.contractAddress?.value, registry);

  if (!result.ok) {
    slot.dataset.state = "inert";
    slot.dataset.reason = result.reason;
    valueEl.textContent = "Contract address not yet published";
    copyBtn.disabled = true;
    const statusEl = document.querySelector('[data-ca-status]');
    if (statusEl) {
      statusEl.textContent = "Absent — no address has been stated yet. This slot activates the moment one is.";
    }
    return;
  }

  slot.dataset.state = "live";
  valueEl.textContent = result.value;
  copyBtn.disabled = false;
  const statusEl = document.querySelector('[data-ca-status]');
  if (statusEl) statusEl.textContent = `Stated — ${result.value}`;
  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(result.value);
    copyBtn.dataset.copied = "true";
    copyBtn.textContent = "Copied";
    setTimeout(() => {
      delete copyBtn.dataset.copied;
      copyBtn.textContent = "Copy";
    }, 1500);
  });
}

function renderSocial(key, registry) {
  const result = resolveSocial(key, registry);
  const record = registry.socials[key];

  const tagEl = document.querySelector(`[data-social-tag="${key}"]`);
  if (tagEl) {
    tagEl.textContent = record.status;
    tagEl.classList.toggle("tag--unconfirmed", record.status !== "verified");
    tagEl.classList.toggle("tag--live", record.status === "verified");
  }

  const el = document.querySelector(`[data-social="${key}"]`);
  if (!el) return;
  if (!result.ok) {
    el.dataset.state = "inert";
    el.dataset.reason = result.reason;
    el.removeAttribute("href");
    el.setAttribute("aria-disabled", "true");
    el.setAttribute("tabindex", "-1");
    return;
  }
  el.dataset.state = "live";
  el.href = result.url;
  el.removeAttribute("aria-disabled");
  el.removeAttribute("tabindex");
}

function renderChain(registry) {
  document.querySelectorAll('[data-chain-name]').forEach((el) => {
    el.textContent = registry.chain.name;
  });
  document.querySelectorAll('[data-chain-id]').forEach((el) => {
    el.textContent = `${registry.chain.chainIdHex} (${registry.chain.chainIdDec})`;
  });
  document.querySelectorAll('[data-chain-rpc]').forEach((el) => {
    el.textContent = registry.chain.rpc;
  });
}

function countStatedFacts(registry) {
  const records = [
    registry.contractAddress,
    registry.chain,
    registry.socials.x,
    registry.socials.github,
  ];
  return records.filter((r) => r.status === "stated" || r.status === "verified").length;
}

function renderCounts(registry) {
  const count = countStatedFacts(registry);
  document.querySelectorAll('[data-stated-count]').forEach((el) => {
    el.textContent = String(count);
  });
}

async function init() {
  const registry = await loadRegistry();
  renderContractAddress(registry);
  renderSocial("x", registry);
  renderSocial("github", registry);
  renderChain(registry);
  renderCounts(registry);
}

init();
