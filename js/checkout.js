/* =========================================================
   checkout.js
   Mengatur halaman checkout, pembayaran, QRIS, dan WhatsApp
   ========================================================= */

/* Nomor WhatsApp Matawai Collection */
const MATAWAI_WHATSAPP_NUMBER = "6285725508071";

/* Gambar QRIS */
const QRIS_IMAGE_SRC = "img/qris.jpg";

/* Durasi QRIS dalam detik, 5 menit = 300 detik */
const QRIS_DURATION = 300;

/* Data rekening bank */
const bankAccounts = {
  "BRI": {
    account: "1234 5678 9012 345",
    owner: "Matawai Collection"
  },
  "BNI": {
    account: "9876 5432 1098 765",
    owner: "Matawai Collection"
  },
  "BANK NTT": {
    account: "1122 3344 5566 778",
    owner: "Matawai Collection"
  },
  "BCA": {
    account: "4567 8901 2345",
    owner: "Matawai Collection"
  },
  "MANDIRI": {
    account: "7788 9900 1122 3344",
    owner: "Matawai Collection"
  }
};

let qrisInterval = null;
let qrisTimeLeft = QRIS_DURATION;

/* =========================================================
   Helper umum
   ========================================================= */

function formatRupiah(number) {
  const numberValue = Number(String(number).replace(/[^0-9]/g, "")) || 0;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0
  }).format(numberValue);
}

function getCart() {
  return JSON.parse(localStorage.getItem("matawaiCart")) || [];
}

function getItemName(item) {
  return item.name || item.nama || item.title || item.productName || "Produk";
}

function getItemPrice(item) {
  return Number(String(item.price || item.harga || 0).replace(/[^0-9]/g, "")) || 0;
}

function getItemQty(item) {
  return Number(item.qty || item.quantity || 1) || 1;
}

function normalizePaymentMethod(value) {
  const rawValue = String(value || "").trim();
  const method = rawValue.toLowerCase();

  if (method.includes("qris")) {
    return "QRIS";
  }

  if (method.includes("transfer") || method.includes("bank")) {
    return "Transfer bank";
  }

  if (method.includes("whatsapp") || method.includes("wa") || method.includes("konfirmasi")) {
    return "Konfirmasi via WhatsApp";
  }

  if (method.includes("tempat") || method.includes("cod") || method.includes("bayar di tempat")) {
    return "Bayar di tempat";
  }

  return rawValue || "Bayar di tempat";
}

function getSelectedPaymentMethod() {
  const selected = document.querySelector("input[name='paymentMethod']:checked");
  return normalizePaymentMethod(selected?.value || "Bayar di tempat");
}

function isMobileDevice() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* =========================================================
   Keranjang dan ringkasan checkout
   ========================================================= */

function updateCartCount() {
  const cart = getCart();
  const totalQty = cart.reduce((total, item) => total + getItemQty(item), 0);

  document.querySelectorAll(".cart-count").forEach((badge) => {
    badge.textContent = totalQty;
  });
}

function renderCheckoutSummary() {
  const checkoutItems = document.getElementById("checkoutItems");
  const checkoutTotal = document.getElementById("checkoutTotal");

  if (!checkoutItems || !checkoutTotal) {
    return;
  }

  const cart = getCart();

  if (cart.length === 0) {
    checkoutItems.innerHTML = `
      <div class="empty-box p-4">
        <i class="bi bi-bag-x"></i>
        <h5>Belum ada produk</h5>
        <p>Silakan pilih produk terlebih dahulu.</p>
        <a href="produk.html" class="btn btn-main">Lihat Produk</a>
      </div>
    `;

    checkoutTotal.textContent = formatRupiah(0);
    return;
  }

  checkoutItems.innerHTML = cart.map((item) => {
    const name = getItemName(item);
    const qty = getItemQty(item);
    const price = getItemPrice(item);
    const subtotal = price * qty;

    return `
      <div class="summary-row">
        <span>${name} x ${qty}</span>
        <strong>${formatRupiah(subtotal)}</strong>
      </div>
    `;
  }).join("");

  const total = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQty(item);
  }, 0);

  checkoutTotal.textContent = formatRupiah(total);
}

/* =========================================================
   Transfer bank
   ========================================================= */

function showBankInfo() {
  const bankSelect = document.getElementById("bankSelect");
  const bankInfo = document.getElementById("bankInfo");

  if (!bankSelect || !bankInfo) {
    return;
  }

  const bankName = bankSelect.value;
  const bank = bankAccounts[bankName];

  if (!bankName) {
    bankInfo.innerHTML = `
      <div class="p-3 rounded-4" style="background:#fff8ea; border:1px solid #e8d2a8;">
        Silakan pilih kategori bank tujuan transfer.
      </div>
    `;
    return;
  }

  if (!bank) {
    bankInfo.innerHTML = `
      <div class="p-3 rounded-4 text-danger" style="background:#fff8ea; border:1px solid #e8d2a8;">
        Data rekening bank tidak ditemukan.
      </div>
    `;
    return;
  }

  bankInfo.innerHTML = `
    <div class="p-3 rounded-4" style="background:#fff8ea; border:1px solid #e8d2a8;">
      <p class="mb-1"><strong>Bank:</strong> ${bankName}</p>
      <p class="mb-1"><strong>No. Rekening:</strong> ${bank.account}</p>
      <p class="mb-0"><strong>Atas Nama:</strong> ${bank.owner}</p>
    </div>
  `;
}

function renderBankSelectOptions() {
  const options = Object.keys(bankAccounts).map((bankName) => {
    return `<option value="${bankName}">${bankName}</option>`;
  }).join("");

  return `
    <option value="">Pilih kategori bank</option>
    ${options}
  `;
}

/* =========================================================
   QRIS timer
   ========================================================= */

function formatQrisTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function stopQrisTimer() {
  if (qrisInterval) {
    clearInterval(qrisInterval);
    qrisInterval = null;
  }
}

function startQrisTimer() {
  const qrisTimer = document.getElementById("qrisTimer");
  const qrisImage = document.getElementById("qrisImage");
  const qrisNote = document.getElementById("qrisNote");

  if (!qrisTimer || !qrisImage || !qrisNote) {
    return;
  }

  stopQrisTimer();

  qrisTimeLeft = QRIS_DURATION;
  qrisTimer.textContent = formatQrisTime(qrisTimeLeft);
  qrisImage.classList.remove("qris-expired");
  qrisNote.textContent = "Silakan scan QRIS sebelum waktu habis.";

  qrisInterval = setInterval(() => {
    qrisTimeLeft -= 1;
    qrisTimer.textContent = formatQrisTime(qrisTimeLeft);

    if (qrisTimeLeft <= 0) {
      stopQrisTimer();
      qrisTimer.textContent = "00:00";
      qrisImage.classList.add("qris-expired");
      qrisNote.textContent = "QRIS sudah kedaluwarsa. Tekan tombol Refresh QRIS untuk menampilkan ulang.";
    }
  }, 1000);
}

function setupRefreshQrisButton() {
  const refreshQrisBtn = document.getElementById("refreshQrisBtn");

  if (!refreshQrisBtn) {
    return;
  }

  const newRefreshButton = refreshQrisBtn.cloneNode(true);
  refreshQrisBtn.parentNode.replaceChild(newRefreshButton, refreshQrisBtn);

  newRefreshButton.addEventListener("click", () => {
    const qrisImage = document.getElementById("qrisImage");

    if (qrisImage) {
      qrisImage.src = `${QRIS_IMAGE_SRC}?time=${Date.now()}`;
    }

    startQrisTimer();
  });
}

function renderQrisBox() {
  return `
    <div id="qrisBox" class="mt-3 text-center">
      <div class="p-3 rounded-4" style="background:#fff8ea; border:1px solid #e8d2a8;">
        <img
          id="qrisImage"
          src="${QRIS_IMAGE_SRC}?time=${Date.now()}"
          alt="QRIS Matawai Collection"
          class="img-fluid rounded-4"
          style="max-width:260px;"
        >

        <h5 class="mt-3 mb-1">
          Sisa waktu pembayaran: <span id="qrisTimer">05:00</span>
        </h5>

        <p id="qrisNote" class="mb-3">
          Silakan scan QRIS sebelum waktu habis.
        </p>

        <button type="button" id="refreshQrisBtn" class="btn btn-main">
          Refresh QRIS
        </button>
      </div>
    </div>
  `;
}

function activateQrisBox() {
  const qrisImage = document.getElementById("qrisImage");
  const qrisNote = document.getElementById("qrisNote");

  if (qrisImage && qrisNote) {
    qrisImage.addEventListener("error", () => {
      qrisNote.textContent = "Gambar QRIS tidak ditemukan. Pastikan file qris.jpg ada di folder img.";
    });
  }

  setupRefreshQrisButton();
  startQrisTimer();
}

/* =========================================================
   Info pembayaran
   ========================================================= */

function updatePaymentInfo() {
  const paymentInfo = document.getElementById("paymentInfo");
  const selected = document.querySelector("input[name='paymentMethod']:checked");

  if (!paymentInfo || !selected) {
    return;
  }

  stopQrisTimer();

  const method = normalizePaymentMethod(selected.value);

  if (method === "Bayar di tempat") {
    paymentInfo.innerHTML = `
      <strong>Pilihan aktif: Bayar di tempat.</strong><br>
      Pesanan dibuat di website. Konsumen membayar saat mengambil produk di toko.
    `;
    return;
  }

  if (method === "Transfer bank") {
    paymentInfo.innerHTML = `
      <strong>Pilih bank tujuan transfer:</strong>

      <div class="mt-3">
        <select id="bankSelect" class="form-select">
          ${renderBankSelectOptions()}
        </select>
      </div>

      <div id="bankInfo" class="mt-3"></div>
    `;

    showBankInfo();

    const bankSelect = document.getElementById("bankSelect");

    if (bankSelect) {
      bankSelect.addEventListener("change", showBankInfo);
    }

    return;
  }

  if (method === "QRIS") {
    paymentInfo.innerHTML = `
      <strong>Pilihan aktif: QRIS.</strong><br>
      Silakan scan QRIS berikut untuk melakukan pembayaran.
      ${renderQrisBox()}
    `;

    activateQrisBox();
    return;
  }

  if (method === "Konfirmasi via WhatsApp") {
    paymentInfo.innerHTML = `
      <strong>Pilihan aktif: Konfirmasi via WhatsApp.</strong><br>
      Pesanan akan dikirim dalam bentuk pesan otomatis ke WhatsApp Matawai Collection.
    `;
    return;
  }

  paymentInfo.innerHTML = `
    <strong>Pilihan pembayaran belum dikenali.</strong><br>
    Silakan pilih metode pembayaran yang tersedia.
  `;
}

/* =========================================================
   Data pesanan lokal
   ========================================================= */

function makeLocalOrder() {
  const name = document.getElementById("buyerName")?.value.trim() || "-";
  const phone = document.getElementById("buyerPhone")?.value.trim() || "-";
  const address = document.getElementById("buyerAddress")?.value.trim() || "-";
  const payment = getSelectedPaymentMethod();

  const cart = getCart();

  const total = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQty(item);
  }, 0);

  let extraPaymentInfo = "";

  if (payment === "Transfer bank") {
    const bankSelect = document.getElementById("bankSelect");
    const bankName = bankSelect ? bankSelect.value : "";
    const bank = bankAccounts[bankName];

    if (bank) {
      extraPaymentInfo = `
Bank tujuan: ${bankName}
No. rekening: ${bank.account}
Atas nama: ${bank.owner}
      `;
    } else {
      extraPaymentInfo = "Bank tujuan transfer belum dipilih.";
    }
  }

  if (payment === "QRIS") {
    extraPaymentInfo = "Pembayaran dilakukan melalui QRIS Matawai Collection.";
  }

  const order = {
    nama: name,
    phone: phone,
    alamat: address,
    pembayaran: payment,
    infoPembayaran: extraPaymentInfo,
    produk: cart,
    total: total,
    waktu: new Date().toLocaleString("id-ID")
  };

  localStorage.setItem("matawaiLastOrder", JSON.stringify(order));
}

/* =========================================================
   Pesan WhatsApp
   ========================================================= */

function buildWhatsAppMessage() {
  const cart = getCart();

  const buyerName = document.getElementById("buyerName")?.value.trim() || "-";
  const buyerPhone = document.getElementById("buyerPhone")?.value.trim() || "-";
  const buyerAddress = document.getElementById("buyerAddress")?.value.trim() || "-";
  const paymentMethod = getSelectedPaymentMethod();

  const orderList = cart.map((item, index) => {
    const name = getItemName(item);
    const qty = getItemQty(item);
    const price = getItemPrice(item);
    const subtotal = price * qty;

    return `${index + 1}. ${name}
   Jumlah: ${qty}
   Harga: ${formatRupiah(price)}
   Subtotal: ${formatRupiah(subtotal)}`;
  }).join("\n\n");

  const total = cart.reduce((sum, item) => {
    return sum + getItemPrice(item) * getItemQty(item);
  }, 0);

  let paymentDetail = "";

  if (paymentMethod === "Transfer bank") {
    const bankSelect = document.getElementById("bankSelect");
    const bankName = bankSelect ? bankSelect.value : "";
    const bank = bankAccounts[bankName];

    if (bank) {
      paymentDetail =
        `\nDetail Transfer:
Bank: ${bankName}
No. Rekening: ${bank.account}
Atas Nama: ${bank.owner}`;
    } else {
      paymentDetail =
        `\nDetail Transfer:
Bank tujuan belum dipilih.`;
    }
  }

  if (paymentMethod === "QRIS") {
    paymentDetail =
      `\nDetail QRIS:
Pembeli memilih pembayaran QRIS. Mohon cek atau konfirmasi status pembayaran.`;
  }

  return `Halo Matawai Collection, saya ingin melakukan pemesanan.

Nama: ${buyerName}
No. WhatsApp: ${buyerPhone}
Alamat/Catatan: ${buyerAddress}
Metode Pembayaran: ${paymentMethod}${paymentDetail}

Daftar Pesanan:
${orderList}

Total: ${formatRupiah(total)}

Mohon dikonfirmasi ketersediaan produknya. Terima kasih.`;
}

function openWhatsAppOrder() {
  const message = encodeURIComponent(buildWhatsAppMessage());

  const whatsappUrl = isMobileDevice()
    ? `https://wa.me/${MATAWAI_WHATSAPP_NUMBER}?text=${message}`
    : `https://web.whatsapp.com/send?phone=${MATAWAI_WHATSAPP_NUMBER}&text=${message}`;

  window.open(whatsappUrl, "_blank");
}

/* =========================================================
   Validasi dan submit checkout
   ========================================================= */

function validateCheckoutBeforeSubmit() {
  const cart = getCart();

  if (cart.length === 0) {
    alert("Keranjang masih kosong. Silakan pilih produk terlebih dahulu.");
    window.location.href = "produk.html";
    return false;
  }

  const paymentMethod = getSelectedPaymentMethod();

  if (paymentMethod === "Transfer bank") {
    const bankSelect = document.getElementById("bankSelect");

    if (!bankSelect || !bankSelect.value) {
      alert("Silakan pilih kategori bank tujuan transfer terlebih dahulu.");
      return false;
    }
  }

  return true;
}

function setupCheckoutForm() {
  const checkoutForm = document.getElementById("checkoutForm");

  if (!checkoutForm) {
    return;
  }

  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!validateCheckoutBeforeSubmit()) {
      return;
    }

    makeLocalOrder();
    openWhatsAppOrder();
  });
}

function setupPaymentRadios() {
  document.querySelectorAll("input[name='paymentMethod']").forEach((radio) => {
    radio.addEventListener("change", updatePaymentInfo);
  });
}

/* =========================================================
   Jalankan halaman checkout
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  updateCartCount();
  renderCheckoutSummary();
  setupPaymentRadios();
  setupCheckoutForm();
  updatePaymentInfo();
});