const menu = {
  tacos: [
    {
      name: "Taco de Birria",
      price: "$28",
      desc: "Birria de res, cebolla, cilantro, salsa y limon.",
      tags: ["birria"],
    },
    {
      name: "Taco de Barbacoa",
      price: "$28",
      desc: "Barbacoa suave con tortilla caliente y salsa.",
      tags: ["barbacoa"],
    },
    {
      name: "Orden Mixta",
      price: "$110",
      desc: "Birria, barbacoa y consome para compartir.",
      tags: ["mixta", "para llevar"],
    },
  ],
  bowls: [
    {
      name: "Consome Chico",
      price: "$25",
      desc: "Caldo rojo con cebolla, cilantro y limon.",
      tags: ["caliente"],
    },
    {
      name: "Consome Grande",
      price: "$45",
      desc: "Mas consome para acompanar tus tacos.",
      tags: ["grande", "carne"],
    },
    {
      name: "Litro de Consome",
      price: "$120",
      desc: "Para llevar o compartir en casa.",
      tags: ["familiar"],
    },
  ],
  drinks: [
    {
      name: "Agua de Jamaica",
      price: "$25",
      desc: "Fresca y lista para acompanar tacos.",
      tags: ["fresca"],
    },
    {
      name: "Horchata",
      price: "$25",
      desc: "Cremosa, fria y con canela.",
      tags: ["clasica"],
    },
    {
      name: "Refrescos",
      price: "$22",
      desc: "Refrescos bien frios.",
      tags: ["frio"],
    },
  ],
};

const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const grid = document.querySelector("[data-menu-grid]");
const tabs = document.querySelectorAll("[data-category]");
const orderForm = document.querySelector("[data-order-form]");
const whatsappNumber = "523122736126";

function updateHeader() {
  header.classList.toggle("scrolled", window.scrollY > 24);
}

function closeNav() {
  document.body.classList.remove("nav-open");
  nav.classList.remove("open");
  header.classList.remove("nav-active");
  navToggle.setAttribute("aria-expanded", "false");
}

function renderMenu(category) {
  grid.innerHTML = menu[category]
    .map(
      (item) => `
        <article class="menu-item">
          <div class="menu-item-top">
            <h3>${item.name}</h3>
            <span class="price">${item.price}</span>
          </div>
          <p>${item.desc}</p>
          <div class="tags">${item.tags.map((tag) => `<span>${tag}</span>`).join("")}</div>
        </article>
      `,
    )
    .join("");
}

navToggle.addEventListener("click", () => {
  const isOpen = nav.classList.toggle("open");
  document.body.classList.toggle("nav-open", isOpen);
  header.classList.toggle("nav-active", isOpen);
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

nav.addEventListener("click", (event) => {
  if (event.target.matches("a")) closeNav();
});

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    tabs.forEach((button) => {
      const active = button === tab;
      button.classList.toggle("active", active);
      button.setAttribute("aria-selected", String(active));
    });
    renderMenu(tab.dataset.category);
  });
});

orderForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const data = new FormData(orderForm);
  const name = data.get("name").trim();
  const note = data.get("note").trim();
  const items = [
    ["Tacos de birria", data.get("birria")],
    ["Tacos de barbacoa", data.get("barbacoa")],
    ["Consome", data.get("consome")],
    ["Bebidas", data.get("bebidas")],
  ]
    .map(([label, amount]) => [label, Number(amount)])
    .filter(([, amount]) => amount > 0)
    .map(([label, amount]) => `${amount} ${label}`);

  const lines = [
    "Hola, quiero hacer un pedido en LA BIRRIA No 1.",
    name ? `Nombre: ${name}` : "",
    items.length ? `Pedido: ${items.join(", ")}` : "Pedido: me ayudan a tomar mi orden.",
    note ? `Nota: ${note}` : "",
  ].filter(Boolean);

  window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noreferrer");
});

window.addEventListener("scroll", updateHeader, { passive: true });

renderMenu("tacos");
updateHeader();

if (window.lucide) {
  window.lucide.createIcons();
}
