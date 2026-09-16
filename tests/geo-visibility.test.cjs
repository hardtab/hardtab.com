const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const script = readFileSync(new URL("../script.js", `file://${__filename}`), "utf8");

async function runWithCountry(country, reject = false) {
  const cards = [];
  const classes = [];
  const grid = {
    prepend(card) { cards.unshift(card); },
    classList: { add(name) { classes.push(name); } },
  };
  const template = { content: { firstElementChild: { cloneNode() { return "SuperCheap"; } } } };
  const year = { textContent: "" };
  const requests = [];
  const context = {
    document: {
      getElementById(id) { return id === "year" ? year : template; },
      querySelector(selector) { return selector === ".product-grid" ? grid : null; },
    },
    Date,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch(url, options) {
      requests.push({ url, options });
      return reject
        ? Promise.reject(new Error("offline"))
        : Promise.resolve({ ok: true, json: () => Promise.resolve({ country }) });
    },
  };

  vm.runInNewContext(script, context);
  assert.deepEqual(cards, [], "SuperCheap must not appear before the lookup completes");
  await new Promise(setImmediate);
  return { cards, classes, requests };
}

test("Thai visitors never see SuperCheap", async () => {
  const result = await runWithCountry("TH");
  assert.deepEqual(result.cards, []);
  assert.equal(result.requests[0].url, "https://api.country.is/");
  assert.equal(result.requests[0].options.credentials, "omit");
});

test("a confirmed non-Thai country reveals SuperCheap", async () => {
  const result = await runWithCountry("US");
  assert.deepEqual(result.cards, ["SuperCheap"]);
  assert.deepEqual(result.classes, ["has-multiple-products"]);
});

test("unknown country or lookup failure keeps SuperCheap hidden", async () => {
  for (const country of [null, "", "unknown", "th"]) {
    assert.deepEqual((await runWithCountry(country)).cards, []);
  }
  assert.deepEqual((await runWithCountry(null, true)).cards, []);
});
