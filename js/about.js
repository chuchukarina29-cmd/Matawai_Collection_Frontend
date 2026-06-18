/* =========================================================
   about.js
   Menampilkan daftar toko pada halaman tentang
   ========================================================= */

const matawaiWhatsapp = "6285725508071";

/* Ikon toko berdasarkan kategori */
const iconMap = {
  "Tenun dan kain lokal": "bi-flower1",
  "Kopi lokal": "bi-cup-hot",
  "Makanan lokal": "bi-basket2",
  "Kerajinan dan aksesori": "bi-gem"
};

function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem("matawaiCart")) || [];
  const totalQty = cart.reduce((total, item) => total + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = totalQty;
  });
}

function createWhatsappMessage(shop) {
  const message = `Halo Matawai Collection, saya ingin bertanya tentang ${shop.name}. Apakah produknya masih tersedia?`;
  return encodeURIComponent(message);
}

function createWhatsappLink(message) {
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (isMobile) {
    return `https://wa.me/${matawaiWhatsapp}?text=${message}`;
  }

  return `https://web.whatsapp.com/send?phone=${matawaiWhatsapp}&text=${message}`;
}

function renderShops() {
  const shopList = document.getElementById("shopList");

  if (!shopList) {
    return;
  }

  shopList.innerHTML = shops.map((shop) => {
    const shopIcon = iconMap[shop.category] || "bi-shop-window";
    const whatsappMessage = createWhatsappMessage(shop);
    const whatsappLink = createWhatsappLink(whatsappMessage);

    return `
      <div class="col-md-6 col-lg-3">
        <div class="shop-card">
          <i class="bi ${shopIcon}"></i>
          <h5>${shop.name}</h5>
          <p class="fw-bold text-danger">${shop.category}</p>
          <p>${shop.description}</p>
          <p class="small mb-3">
            <i class="bi bi-clock me-1"></i>${shop.open}
          </p>

          <div class="d-grid gap-2">
            <a href="produk.html" class="btn btn-outline-main btn-sm">
              Lihat Produk
            </a>

            <a href="${whatsappLink}" target="_blank" rel="noopener noreferrer" class="btn btn-main btn-sm">
              WhatsApp
            </a>

            <a href="${shop.maps}" target="_blank" rel="noopener noreferrer" class="btn btn-outline-main btn-sm">
              Arah Toko
            </a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderShops();
});