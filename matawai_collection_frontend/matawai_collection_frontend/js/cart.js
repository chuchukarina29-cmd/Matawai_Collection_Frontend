/* =========================================================
   cart.js
   Mengatur halaman keranjang
   ========================================================= */

function formatRupiah(number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(number);
}

function getCart() {
  return JSON.parse(localStorage.getItem("matawaiCart")) || [];
}

function saveCart(cart) {
  localStorage.setItem("matawaiCart", JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((total, item) => total + item.qty, 0);

  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = totalQty;
  });
}

function increaseQty(productId) {
  const cart = getCart();
  const item = cart.find((product) => product.id === productId);

  if (item) {
    item.qty += 1;
  }

  saveCart(cart);
}

function decreaseQty(productId) {
  let cart = getCart();
  const item = cart.find((product) => product.id === productId);

  if (item) {
    item.qty -= 1;
  }

  cart = cart.filter((product) => product.qty > 0);
  saveCart(cart);
}

function removeItem(productId) {
  const cart = getCart().filter((product) => product.id !== productId);
  saveCart(cart);
}

function clearCart() {
  localStorage.removeItem("matawaiCart");
  renderCart();
  updateCartCount();
}

function renderCart() {
  const cartItems = document.getElementById("cartItems");
  const emptyCart = document.getElementById("emptyCart");
  const totalItems = document.getElementById("totalItems");
  const totalPrice = document.getElementById("totalPrice");
  const grandTotal = document.getElementById("grandTotal");
  const checkoutBtn = document.getElementById("checkoutBtn");

  const cart = getCart();

  if (!cartItems) {
    return;
  }

  if (cart.length === 0) {
    cartItems.innerHTML = "";
    emptyCart.classList.remove("d-none");
    checkoutBtn.classList.add("disabled");
  } else {
    emptyCart.classList.add("d-none");
    checkoutBtn.classList.remove("disabled");

    cartItems.innerHTML = cart.map((item) => {
      const subtotal = item.price * item.qty;

      return `
        <div class="cart-item">
          <img src="${item.image}" alt="${item.name}">

          <div>
            <h5>${item.name}</h5>
            <p><i class="bi bi-shop me-1"></i>${item.store}</p>
            <strong>${formatRupiah(item.price)}</strong>

            <div class="mt-2">
              <div class="qty-control">
                <button onclick="decreaseQty(${item.id})">-</button>
                <span>${item.qty}</span>
                <button onclick="increaseQty(${item.id})">+</button>
              </div>
            </div>
          </div>

          <div class="cart-actions">
            <strong>${formatRupiah(subtotal)}</strong>
            <br>
            <button class="btn btn-sm btn-outline-danger mt-2" onclick="removeItem(${item.id})">
              Hapus
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  const qty = cart.reduce((total, item) => total + item.qty, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  totalItems.textContent = qty;
  totalPrice.textContent = formatRupiah(total);
  grandTotal.textContent = formatRupiah(total);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCart();

  const clearCartBtn = document.getElementById("clearCartBtn");

  if (clearCartBtn) {
    clearCartBtn.addEventListener("click", () => {
      const yakin = confirm("Yakin ingin mengosongkan keranjang?");

      if (yakin) {
        clearCart();
      }
    });
  }
});
