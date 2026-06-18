/* =========================================================
   app.js
   Mengatur tampilan produk, filter, pencarian, modal detail,
   dan tombol tambah keranjang
   ========================================================= */

// Format angka menjadi rupiah
function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(number);
}

// Mengambil data keranjang dari localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("matawaiCart")) || [];
}

// Menyimpan data keranjang ke localStorage
function saveCart(cart) {
  localStorage.setItem("matawaiCart", JSON.stringify(cart));
  updateCartCount();
}

// Menghitung jumlah item pada badge keranjang
function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((total, item) => total + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = totalQty;
  });
}

// Menambahkan produk ke keranjang
function addToCart(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  const cart = getCart();
  const existingItem = cart.find((item) => item.id === productId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      store: product.store,
      qty: 1,
    });
  }

  saveCart(cart);
  showToast(`${product.name} berhasil ditambahkan ke keranjang.`);
}

// Menampilkan notifikasi sederhana
function showToast(message) {
  let toast = document.querySelector(".simple-toast");

  if (!toast) {
    toast = document.createElement("div");
    toast.className =
      "simple-toast position-fixed bottom-0 end-0 m-3 p-3 rounded-4 shadow text-white";
    toast.style.background = "#7A2E1D";
    toast.style.zIndex = "9999";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.remove("d-none");

  setTimeout(() => {
    toast.classList.add("d-none");
  }, 2200);
}

// Membuat card produk
function createProductCard(product) {
  const labels = product.labels
    .map((label) => `<span>${label}</span>`)
    .join("");

  return `
    <div class="col-md-6 col-lg-4">
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${product.name}">
          <span class="product-badge">${product.category}</span>
        </div>

        <div class="product-body">
          <h3 class="product-title">${product.name}</h3>
          <p class="product-store">
            <i class="bi bi-shop me-1"></i>${product.store}
          </p>
          <div class="product-price">${formatRupiah(product.price)}</div>

          <div class="product-labels">
            ${labels}
          </div>

          <div class="d-grid gap-2">
            <button class="btn btn-main" onclick="addToCart(${product.id})">
              <i class="bi bi-bag-plus me-1"></i>Tambah Keranjang
            </button>
            <button class="btn btn-outline-main" onclick="showProductDetail(${product.id})">
              <i class="bi bi-eye me-1"></i>Lihat Detail
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Menampilkan produk unggulan di beranda
function renderFeaturedProducts() {
  const featuredContainer = document.getElementById("featuredProducts");

  if (!featuredContainer) {
    return;
  }

  const featuredProducts = products
    .filter((product) => product.featured)
    .slice(0, 6);
  featuredContainer.innerHTML = featuredProducts
    .map(createProductCard)
    .join("");
}

// Menampilkan semua produk di halaman produk
function renderProducts(list) {
  const productsGrid = document.getElementById("productsGrid");
  const productCount = document.getElementById("productCount");
  const emptyProducts = document.getElementById("emptyProducts");

  if (!productsGrid) {
    return;
  }

  productsGrid.innerHTML = list.map(createProductCard).join("");

  if (productCount) {
    productCount.textContent = `${list.length} produk`;
  }

  if (emptyProducts) {
    if (list.length === 0) {
      emptyProducts.classList.remove("d-none");
    } else {
      emptyProducts.classList.add("d-none");
    }
  }
}

// Mengambil parameter dari URL
function getUrlParam(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

// Filter produk berdasarkan input pengguna
function filterProducts() {
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");

  if (!searchInput || !categoryFilter || !sortFilter) {
    return;
  }

  const keyword = searchInput.value.toLowerCase();
  const category = categoryFilter.value;
  const sortValue = sortFilter.value;

  let filtered = products.filter((product) => {
    const matchKeyword =
      product.name.toLowerCase().includes(keyword) ||
      product.store.toLowerCase().includes(keyword) ||
      product.category.toLowerCase().includes(keyword) ||
      product.description.toLowerCase().includes(keyword);

    const matchCategory = category === "Semua" || product.category === category;

    return matchKeyword && matchCategory;
  });

  if (sortValue === "murah") {
    filtered.sort((a, b) => a.price - b.price);
  }

  if (sortValue === "mahal") {
    filtered.sort((a, b) => b.price - a.price);
  }

  if (sortValue === "nama") {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  renderProducts(filtered);
}

// Filter berdasarkan mode belanja mudah
function filterByMode(mode) {
  const filtered = products.filter((product) => product.modes.includes(mode));
  renderProducts(filtered);

  document.querySelectorAll(".btn-need").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
}

// Menampilkan modal detail produk
function showProductDetail(productId) {
  const product = products.find((item) => item.id === productId);

  if (!product) {
    return;
  }

  const modalTitle = document.getElementById("modalProductTitle");
  const modalBody = document.getElementById("modalProductBody");

  modalTitle.textContent = product.name;

  modalBody.innerHTML = `
    <div class="row g-4">
      <div class="col-md-6">
        <img src="${product.image}" alt="${product.name}" class="modal-product-img">
      </div>

      <div class="col-md-6">
        <span class="badge badge-soft mb-2">${product.category}</span>
        <h3 class="fw-bold">${product.name}</h3>
        <p class="text-muted mb-2">
          <i class="bi bi-shop me-1"></i>${product.store}
        </p>
        <h4 class="text-danger fw-bold">${formatRupiah(product.price)}</h4>
        <p>${product.description}</p>

        <div class="mb-3">
          <strong>Stok:</strong> ${product.stock}
        </div>

        <div class="product-labels">
          ${product.labels.map((label) => `<span>${label}</span>`).join("")}
        </div>

        <div class="d-grid gap-2 mt-3">
          <button class="btn btn-main" onclick="addToCart(${product.id})">
            <i class="bi bi-bag-plus me-1"></i>Tambah ke Keranjang
          </button>
          <a
          class="btn btn-success rounded-pill fw-bold"
          href="https://web.whatsapp.com/send?phone=6285725508071&text=${encodeURIComponent(`Halo Matawai Collection, saya ingin bertanya tentang produk ${product.name}. Apakah produk ini masih tersedia?`)}"
          target="_blank"
          rel="noopener"
          >
          <i class="bi bi-whatsapp me-1"></i>Tanya via WhatsApp
          </a>
        </div>
      </div>
    </div>
  `;

  const productModal = new bootstrap.Modal(
    document.getElementById("productModal"),
  );
  productModal.show();
}

// Menjalankan kode setelah halaman selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderFeaturedProducts();

  const productsGrid = document.getElementById("productsGrid");
  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortFilter = document.getElementById("sortFilter");
  const resetFilter = document.getElementById("resetFilter");

  if (productsGrid) {
    renderProducts(products);

    const categoryFromUrl = getUrlParam("kategori");
    const modeFromUrl = getUrlParam("mode");

    if (categoryFromUrl && categoryFilter) {
      categoryFilter.value = categoryFromUrl;
      filterProducts();
    }

    if (modeFromUrl) {
      filterByMode(modeFromUrl);
    }
  }

  if (searchInput) {
    searchInput.addEventListener("input", filterProducts);
  }

  if (categoryFilter) {
    categoryFilter.addEventListener("change", filterProducts);
  }

  if (sortFilter) {
    sortFilter.addEventListener("change", filterProducts);
  }

  if (resetFilter) {
    resetFilter.addEventListener("click", () => {
      searchInput.value = "";
      categoryFilter.value = "Semua";
      sortFilter.value = "default";

      document.querySelectorAll(".btn-need").forEach((button) => {
        button.classList.remove("active");
      });

      renderProducts(products);
    });
  }

  document.querySelectorAll(".btn-need").forEach((button) => {
    button.addEventListener("click", () => {
      filterByMode(button.dataset.mode);
    });
  });
});
