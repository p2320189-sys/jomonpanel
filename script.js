// ─── 画像リスト ────────────────────────────────────
const IMAGES = [
  "doguuichiran.pdf",       // 0: 選択画面
  "syakoukidoguu.pdf",      // 1: ①重要文化財版
  "syakoukidoguu_red.pdf",  // 2: ②赤彩版
  "ushirotedoguu.pdf",      // 3: ③後手土偶
];

// ─── ゾーン定義 ────────────────────────────────────
const ZONES = [
  // doguuichiran（選択画面）
  { page: 0, cx: 0.38, cy: 0.55, r: 70, to: 1 }, // ①
  { page: 0, cx: 0.63, cy: 0.83, r: 70, to: 2 }, // ②
  { page: 0, cx: 0.80, cy: 0.37, r: 70, to: 3 }, // ③

  // 詳細ページ（右上の × で選択画面に戻る）
  { page: 1, cx: 0.82, cy: 0.12, r: 50, to: 0 }, // ①の×
  { page: 2, cx: 0.82, cy: 0.12, r: 50, to: 0 }, // ②の×
  { page: 3, cx: 0.82, cy: 0.12, r: 50, to: 0 }, // ③の×

  // syakoukidoguu の？→ 恵比須田遺跡（地図ポップアップ）
  { page: 1, cx: 0.62, cy: 0.32, r: 40, to: "map",
    lat: 38.574, lng: 140.954, label: "恵比須田遺跡" },
];

// ─── 状態 ──────────────────────────────────────────
let currentPage = 0;

// ─── 要素取得 ──────────────────────────────────────
const imgA      = document.getElementById("imgA");
const imgB      = document.getElementById("imgB");
const pointer   = document.getElementById("pointer");
const debugInfo = document.getElementById("debug-info");
const stage     = document.getElementById("stage");
const mapPopup  = document.getElementById("map-popup");
const mapFrame  = document.getElementById("map-frame");
const mapClose  = document.getElementById("map-close");
const mapOverlay = document.getElementById("map-overlay");

// ─── ゾーンDOM生成 ─────────────────────────────────
ZONES.forEach((z, i) => {
  const el = document.createElement("div");
  el.className = "zone";
  el.dataset.index = i;
  el.style.display = "none";
  stage.appendChild(el);
  z.el = el;
});

function updateZones() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  ZONES.forEach(z => {
    if (z.page === currentPage) {
      const px = z.cx * W;
      const py = z.cy * H;
      z.el.style.display = "block";
      z.el.style.left    = (px - z.r) + "px";
      z.el.style.top     = (py - z.r) + "px";
      z.el.style.width   = (z.r * 2) + "px";
      z.el.style.height  = (z.r * 2) + "px";
    } else {
      z.el.style.display = "none";
    }
  });
}

// ─── ページ遷移 ────────────────────────────────────
function goTo(pageIndex) {
  if (pageIndex === currentPage) return;

  const toSrc = IMAGES[pageIndex];

  imgB.src = toSrc;
  imgB.style.transition = "none";
  imgB.style.opacity = "0";

  imgB.onload = () => {
    requestAnimationFrame(() => {
      imgB.style.transition = "opacity 0.4s ease";
      imgB.style.opacity = "1";
    });

    setTimeout(() => {
      imgA.src = toSrc;
      imgA.style.transition = "none";
      imgA.style.opacity = "1";
      imgB.style.opacity = "0";
    }, 450);
  };

  currentPage = pageIndex;
  debugInfo.textContent = "page: " + currentPage;
  updateZones();
}

// ─── 地図ポップアップ ──────────────────────────────
function openMap(lat, lng) {
  // 日本全体・航空写真
  const japanUrl = "https://maps.google.com/maps?q=35.6,136.0&z=5&t=k&output=embed";
  // 遺跡の場所・航空写真
  const spotUrl  = `https://maps.google.com/maps?q=${lat},${lng}&z=14&t=k&output=embed`;

  mapFrame.innerHTML = `<iframe src="${japanUrl}"></iframe>`;
  mapPopup.style.display = "block";

  // 2秒後に遺跡の場所にズームイン
  setTimeout(() => {
    mapFrame.innerHTML = `<iframe src="${spotUrl}"></iframe>`;
  }, 2000);
}

function closeMap() {
  mapPopup.style.display = "none";
  mapFrame.innerHTML = "";
}

mapClose.addEventListener("click", closeMap);
mapOverlay.addEventListener("click", closeMap);

// ─── タッチ・クリック判定 ─────────────────────────
function handleInput(clientX, clientY) {
  const W = window.innerWidth;
  const H = window.innerHeight;

  pointer.style.display = "block";
  pointer.style.left = clientX + "px";
  pointer.style.top  = clientY + "px";

  for (const z of ZONES) {
    if (z.page !== currentPage) continue;
    const px   = z.cx * W;
    const py   = z.cy * H;
    const dist = Math.sqrt((clientX - px) ** 2 + (clientY - py) ** 2);
    if (dist < z.r) {
      if (z.to === "map") {
        openMap(z.lat, z.lng);
        return;
      }
      goTo(z.to);
      return;
    }
  }
}

stage.addEventListener("touchstart", e => {
  e.preventDefault();
  const t = e.changedTouches[0];
  handleInput(t.clientX, t.clientY);
}, { passive: false });

stage.addEventListener("click", e => {
  handleInput(e.clientX, e.clientY);
});

stage.addEventListener("touchend", () => {
  setTimeout(() => { pointer.style.display = "none"; }, 300);
});

// ─── 初期化 ────────────────────────────────────────
window.addEventListener("resize", updateZones);
imgA.src = IMAGES[0];
updateZones();