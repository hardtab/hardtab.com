const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const vm = require("node:vm");

const homepage = readFileSync(new URL("../index.html", `file://${__filename}`), "utf8");
const script = readFileSync(new URL("../script.js", `file://${__filename}`), "utf8");

test("SuperCheap and SuperMailbox cards are present in the static homepage", () => {
  const productSection = homepage.match(/<section class="products"[\s\S]*?<\/section>/)?.[0];
  assert.ok(productSection, "the homepage has a products section");
  assert.doesNotMatch(productSection, /<template\b/, "product cards are rendered directly in the page");

  for (const [name, href] of [
    ["SuperCheap", "https://supercheap.market/"],
    ["SuperMailbox", "https://supermailbox.app/"],
  ]) {
    const card = productSection.match(new RegExp(`<article class="product-card">[\\s\\S]*?<h3>${name}<\\/h3>[\\s\\S]*?<\\/article>`))?.[0];
    assert.ok(card, `${name} has a static product card`);
    assert.ok(card.includes(`href="${href}"`), `${name} links to its product site`);
  }
});

test("the homepage script updates the year without making a country lookup", () => {
  const year = { textContent: "" };
  const requests = [];
  const context = {
    document: { getElementById(id) { return id === "year" ? year : null; } },
    Date,
    fetch(...args) { requests.push(args); },
  };

  vm.runInNewContext(script, context);

  assert.equal(year.textContent, new Date().getFullYear());
  assert.deepEqual(requests, []);
});
