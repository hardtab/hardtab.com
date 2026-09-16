document.getElementById("year").textContent = new Date().getFullYear();

const supercheapCard = document.getElementById("supercheap-card");

if (supercheapCard) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  fetch("https://api.country.is/", {
    cache: "no-store",
    credentials: "omit",
    signal: controller.signal,
  })
    .then((response) => {
      if (!response.ok) throw new Error("Country lookup failed");
      return response.json();
    })
    .then(({ country }) => {
      // Keep the card absent if the country is Thailand, unknown, or invalid.
      if (typeof country !== "string" || !/^[A-Z]{2}$/.test(country) || country === "TH") return;

      const grid = document.querySelector(".product-grid");
      grid.prepend(supercheapCard.content.firstElementChild.cloneNode(true));
      grid.classList.add("has-multiple-products");
    })
    .catch(() => {
      // Network errors, blocked requests, and timeouts all leave it hidden.
    })
    .finally(() => clearTimeout(timeout));
}
