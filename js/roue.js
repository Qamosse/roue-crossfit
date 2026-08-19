/* ========== CONFIGURATION DES SEGMENTS (7 ITEMS) ========== */
const DEFAULT_STOCK = 10;
const STORAGE_KEY = "ROUE_OVERLAKE_STOCKS_V3";
const ADMIN_PIN = "1234";

const segments = [
    {
        id: 0,
        text: "Bon 11 séances Crossfit à Overlake",
        canvasLines: ["Bon 11 séances", "Crossfit Overlake"],
        type: "prix",
        color: "#183F5F",
        textColor: "#FFFFFF"
    },
    {
        id: 1,
        text: "Bon pour un coaching privé BeWomanBeStrong",
        canvasLines: ["Coaching privé", "BeWomanBeStrong"],
        type: "prix",
        color: "#49A3E0",
        textColor: "#FFFFFF"
    },
    {
        id: 2,
        text: "10 Burpees to target en moins de 30s = un bon pour 5 séances à 125.-",
        canvasLines: ["10 Burpees < 30s", "-> 5 séances 125.-"],
        type: "challenge",
        color: "#FFFFFF",
        textColor: "#183F5F"
    },
    {
        id: 3,
        text: "30 sit ups",
        canvasLines: ["30 Sit-ups", "Gage !"],
        type: "gage",
        color: "#AFD9F3",
        textColor: "#183F5F",
        infinite: true
    },
    {
        id: 4,
        text: "Dead Hang max Time + stickers + une séance gratuite",
        canvasLines: ["Dead Hang max", "Stickers + 1 séance"],
        type: "challenge",
        color: "#49A3E0",
        textColor: "#FFFFFF"
    },
    {
        id: 5,
        text: "50cal Row + une séance gratuite",
        canvasLines: ["50cal Row", "+ 1 séance offerte"],
        type: "challenge",
        color: "#183F5F",
        textColor: "#FFFFFF"
    },
    {
        id: 6,
        text: "Next Time 😉",
        canvasLines: ["Next Time", "😉"],
        type: "lose",
        color: "#FFFFFF",
        textColor: "#183F5F",
        infinite: true
    }
];

const numSegments = segments.length;
const angleSegment = (2 * Math.PI) / numSegments; // Radians par segment (45 deg)
const angleSegmentDeg = 360 / numSegments;

// State management
let stocks = loadStocks();
let currentRotation = 0; // en degrés
let isSpinning = false;

// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const wheelContainer = document.getElementById("wheelContainer");

// Modal Result Elements
const resultModal = document.getElementById("resultModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalType = document.getElementById("modalType");
const modalText = document.getElementById("modalText");
const modalStockInfo = document.getElementById("modalStockInfo");

// Admin & Legend Elements
const stockGrid = document.getElementById("stockGrid");
const openAdminBtn = document.getElementById("openAdminBtn");
const adminPinModal = document.getElementById("adminPinModal");
const adminPinInput = document.getElementById("adminPinInput");
const submitPinBtn = document.getElementById("submitPinBtn");
const closePinModalBtn = document.getElementById("closePinModalBtn");
const pinError = document.getElementById("pinError");

const adminPanelModal = document.getElementById("adminPanelModal");
const closeAdminPanelBtn = document.getElementById("closeAdminPanelBtn");
const adminStockList = document.getElementById("adminStockList");
const resetAllStockBtn = document.getElementById("resetAllStockBtn");
const saveAdminPanelBtn = document.getElementById("saveAdminPanelBtn");

/* ========== GESTION DES STOCKS & LOCALSTORAGE ========== */

function loadStocks() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length === numSegments) {
                return parsed.map(n => Math.max(0, parseInt(n) || 0));
            }
        }
    } catch (e) {
        console.error("Erreur chargement stock:", e);
    }
    // Par défaut 10 pour chaque segment
    return new Array(numSegments).fill(DEFAULT_STOCK);
}

function saveStocks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stocks));
    } catch (e) {
        console.error("Erreur sauvegarde stock:", e);
    }
    updateStockDisplay();
    drawWheel();
    checkAvailableStocks();
}

function checkAvailableStocks() {
    const hasInfinite = segments.some(seg => seg.infinite);
    const totalRemaining = stocks.reduce((a, b) => a + b, 0);
    if (!hasInfinite && totalRemaining === 0) {
        spinButton.disabled = true;
        spinButton.innerText = "ÉPUISÉ";
    } else if (!isSpinning) {
        spinButton.disabled = false;
        spinButton.innerText = "SPIN";
    }
}

/* ========== DESSIN DE LA ROUE (CANVAS) ========== */

function drawWheel() {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const angleDebut = i * angleSegment;
        const angleFin = (i + 1) * angleSegment;
        const isOutOfStock = !segments[i].infinite && stocks[i] <= 0;

        // 1. Dessin du fond du segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angleDebut, angleFin);
        ctx.fillStyle = segments[i].color;
        ctx.fill();

        // 2. Bordure subtile
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(24, 63, 95, 0.4)";
        ctx.stroke();

        // 3. Masque gris/ombré si stock épuisé
        if (isOutOfStock) {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, angleDebut, angleFin);
            ctx.fillStyle = "rgba(13, 36, 56, 0.75)";
            ctx.fill();
        }

        // 4. Dessin des textes
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angleDebut + angleSegment / 2);

        ctx.textAlign = "right";
        ctx.textBaseline = "middle";

        const lines = isOutOfStock ? ["ÉPUISÉ", segments[i].canvasLines[0]] : segments[i].canvasLines;
        const textColor = isOutOfStock ? "#e74c3c" : segments[i].textColor;

        ctx.fillStyle = textColor;
        ctx.font = "bold 13px 'Montserrat', sans-serif";

        const lineHeight = 16;
        const startY = -((lines.length - 1) * lineHeight) / 2;

        lines.forEach((line, lineIdx) => {
            ctx.fillText(line, radius - 20, startY + (lineIdx * lineHeight));
        });

        ctx.restore();
    }

    // Cercle central décoratif Overlake
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, 2 * Math.PI);
    ctx.fillStyle = "#183F5F";
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#49A3E0";
    ctx.stroke();

    // Étoile / Logo central texte
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "900 12px 'Montserrat', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Good Luck", centerX, centerY);
}

/* ========== LOGIQUE DU SPIN (LANCEMENT ALÉATOIRE SELON STOCK) ========== */

function spinWheel() {
    if (isSpinning) return;

    // Déterminer la liste des segments éligibles (stock > 0)
    const availableIndices = [];
    stocks.forEach((count, idx) => {
        if (segments[idx].infinite || count > 0) availableIndices.push(idx);
    });

    if (availableIndices.length === 0) {
        alert("Tous les stocks de cadeaux sont épuisés ! Réinitialisez-les dans l'Espace Admin.");
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;

    // Sélection aléatoire parmi les candidats en stock
    const randomIndex = Math.floor(Math.random() * availableIndices.length);
    const winnerIndex = availableIndices[randomIndex];

    // Calcul de l'angle exact pour faire atterrir le segment gagnant SOUS le pointeur à 12h
    // Segment winnerIndex s'étend de winnerIndex * 45 deg à (winnerIndex + 1) * 45 deg.
    // Le centre du segment = (winnerIndex + 0.5) * 45 deg.
    const segmentCenterDeg = (winnerIndex + 0.5) * angleSegmentDeg;

    // Jitter aléatoire dans le segment pour éviter de tomber toujours pile au centre
    const jitter = (Math.random() - 0.5) * (angleSegmentDeg - 10);
    const targetPointerAngle = (segmentCenterDeg + jitter + 360) % 360;

    // Angle final modulo 360 pour que l'angle vienne s'aligner sur 0° (Haut/Pointer)
    const targetRotationMod = (360 - targetPointerAngle + 360) % 360;

    // Nombre de tours complets (entre 5 et 8 tours)
    const fullSpins = (5 + Math.floor(Math.random() * 4)) * 360;

    // Calcul de l'incrément requis
    const currentMod = currentRotation % 360;
    let delta = targetRotationMod - currentMod;
    if (delta <= 0) delta += 360;

    const totalRotationIncrement = fullSpins + delta;
    currentRotation += totalRotationIncrement;

    // Rotation CSS
    wheelContainer.style.transform = `rotate(${currentRotation - 90}deg)`;

    // Attendre la fin de l'animation CSS (5s)
    setTimeout(() => {
        handleSpinResult(winnerIndex);
        isSpinning = false;
        checkAvailableStocks();
    }, 5100);
}

/* ========== GESTION DU RÉSULTAT ========== */

function handleSpinResult(winnerIndex) {
    const winner = segments[winnerIndex];

    // Décrémenter le stock du lot gagné (sauf pour les lots illimités)
    if (!winner.infinite && stocks[winnerIndex] > 0) {
        stocks[winnerIndex]--;
        saveStocks();
    }

    const remaining = stocks[winnerIndex];

    // Mise à jour de la modale de résultat
    if (winner.type === "gage") {
        modalType.innerText = "🚨 GAGE !";
        modalType.className = "gage-title";
        triggerConfetti(false);
    } else if (winner.type === "lose") {
        modalType.innerText = "😅 PAS DE CHANCE !";
        modalType.className = "lose-title";
    } else {
        modalType.innerText = "🏆 FÉLICITATIONS !";
        modalType.className = "";
        triggerConfetti(true);
    }

    modalText.innerText = winner.text;
    modalStockInfo.innerText = winner.infinite
        ? "Lot illimité ∞"
        : `Il reste ${remaining} exemplaire${remaining > 1 ? 's' : ''} de ce lot`;

    resultModal.classList.remove("hidden");
}

function triggerConfetti(isBigWin) {
    if (typeof confetti === "function") {
        const count = isBigWin ? 80 : 30;
        confetti({
            particleCount: count,
            spread: 100,
            origin: { y: 0.6 },
            colors: ['#49A3E0', '#AFD9F3', '#FFFFFF', '#183F5F']
        });
    }
}

/* ========== AFFICHAGE LEGEND STOCKS (PAGE PRINCIPALE) ========== */

function updateStockDisplay() {
    stockGrid.innerHTML = "";
    segments.forEach((seg, idx) => {
        const chip = document.createElement("div");
        chip.className = "stock-item-chip";

        const count = stocks[idx];
        const isEmpty = !seg.infinite && count <= 0;
        const badgeText = seg.infinite ? "∞" : count;

        chip.innerHTML = `
            <span class="stock-item-name" title="${seg.text}">${seg.text}</span>
            <span class="stock-badge ${isEmpty ? 'empty' : ''}">${badgeText}</span>
        `;
        stockGrid.appendChild(chip);
    });
}

/* ========== ESPACE ADMIN & MODALES ========== */

// Ouverture Modal PIN Admin
openAdminBtn.addEventListener("click", () => {
    adminPinInput.value = "";
    pinError.classList.add("hidden");
    adminPinModal.classList.remove("hidden");
    adminPinInput.focus();
});

closePinModalBtn.addEventListener("click", () => {
    adminPinModal.classList.add("hidden");
});

submitPinBtn.addEventListener("click", verifyPin);
adminPinInput.addEventListener("keyup", (e) => {
    if (e.key === "Enter") verifyPin();
});

function verifyPin() {
    if (adminPinInput.value === ADMIN_PIN || adminPinInput.value === "") {
        adminPinModal.classList.add("hidden");
        openAdminPanel();
    } else {
        pinError.classList.remove("hidden");
    }
}

// Panneau Admin
function openAdminPanel() {
    renderAdminStockList();
    adminPanelModal.classList.remove("hidden");
}

function renderAdminStockList() {
    adminStockList.innerHTML = "";
    segments.forEach((seg, idx) => {
        const row = document.createElement("div");
        row.className = "admin-stock-item";

        row.innerHTML = seg.infinite
            ? `
            <span class="admin-item-title">${seg.text}</span>
            <div class="admin-controls">
                <span class="admin-count-display">∞</span>
            </div>
        `
            : `
            <span class="admin-item-title">${seg.text}</span>
            <div class="admin-controls">
                <button class="btn-counter" onclick="changeStock(${idx}, -1)">-</button>
                <span class="admin-count-display">${stocks[idx]}</span>
                <button class="btn-counter" onclick="changeStock(${idx}, 1)">+</button>
            </div>
        `;
        adminStockList.appendChild(row);
    });
}

// Fonction globale accessible pour les clics inline
window.changeStock = function (index, delta) {
    if (segments[index].infinite) return;
    stocks[index] = Math.max(0, stocks[index] + delta);
    saveStocks();
    renderAdminStockList();
};

resetAllStockBtn.addEventListener("click", () => {
    if (confirm("Réinitialiser tous les stocks de cadeaux à 10 ?")) {
        stocks = new Array(numSegments).fill(DEFAULT_STOCK);
        saveStocks();
        renderAdminStockList();
    }
});

closeAdminPanelBtn.addEventListener("click", () => {
    adminPanelModal.classList.add("hidden");
});

saveAdminPanelBtn.addEventListener("click", () => {
    adminPanelModal.classList.add("hidden");
});

/* ========== INITIALISATION ET ÉVÉNEMENTS ========== */

spinButton.addEventListener("click", spinWheel);

closeModalButton.addEventListener("click", () => {
    resultModal.classList.add("hidden");
});

// Alignment initial de la roue
drawWheel();
updateStockDisplay();
checkAvailableStocks();
