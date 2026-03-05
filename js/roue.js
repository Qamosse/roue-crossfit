/* ========== CONFIGURATION DES SEGMENTS ========== */
// 10 Segments : 6 gages (60%), 4 prix (40%)
const segments = [
    { text: "Câlin à son juge", type: "gage", color: "#E10600" },          // 1 (Rouge)
    { text: "Massage post-WOD", type: "prix", color: "#EBFF00" },          // 2 (Jaune Fluo)
    { text: "Encouragements +++", type: "gage", color: "#111111" },        // 3 (Noir)
    { text: "Canette Nocco / VW", type: "prix", color: "#444444" },        // 4 (Gris)
    { text: "Accessoire rigolo", type: "gage", color: "#E10600" },         // 5
    { text: "Barre Barebells", type: "prix", color: "#EBFF00" },           // 6
    { text: "Choisir la Playlist", type: "gage", color: "#111111" },       // 7
    { text: "1 Joker (No-Rep)", type: "prix", color: "#444444" },          // 8
    { text: "Grimace sur photo", type: "gage", color: "#E10600" },         // 9
    { text: "Câlin à son juge", type: "gage", color: "#111111" }           // 10
];

const numSegments = segments.length;
const angleReel = 2 * Math.PI / numSegments; // Angle par segment en Radian

// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinButton = document.getElementById("spinButton");
const wheelContainer = document.getElementById("wheelContainer");

const resultModal = document.getElementById("resultModal");
const closeModalButton = document.getElementById("closeModalButton");
const modalType = document.getElementById("modalType");
const modalText = document.getElementById("modalText");

// Variables d'état
let currentRotation = 0; // en degrés
let isSpinning = false;

/* ========== DESSIN DE LA ROUE ========== */

function drawWheel() {
    // Centre du canvas
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2; // Remplir tout le canvas

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const angleDebut = i * angleReel;
        const angleFin = (i + 1) * angleReel;

        // Dessiner le segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angleDebut, angleFin);
        ctx.fillStyle = segments[i].color;
        ctx.fill();

        // Bordure légère entre les segments
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#222";
        ctx.stroke();

        // Ajouter le texte
        ctx.save();
        ctx.translate(centerX, centerY);
        // On se place au milieu du segment
        ctx.rotate(angleDebut + angleReel / 2);

        ctx.textAlign = "right"; // Le texte vient du bord vers le centre
        ctx.textBaseline = "middle";
        ctx.font = "bold 14px 'Montserrat', sans-serif";

        // Couleur de texte : Noir si fond jaune, Blanc sinon
        ctx.fillStyle = (segments[i].color === "#EBFF00") ? "#000" : "#FFF";

        // On écrit le texte (Marge de 15px depuis le bord du cercle)
        ctx.fillText(segments[i].text, radius - 15, 0);

        ctx.restore();
    }
}

/* ========== LOGIQUE DE LANCEMENT ========== */

function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;

    // Calcul de l'angle aléatoire
    // Force de la roue : entre 5 et 10 tours complets
    const spins = Math.floor(Math.random() * 5) + 5;
    // Calcul de l'angle aléatoire (0 à 360 degrés) pour un vrai tirage au sort
    const randomAngleOffset = Math.floor(Math.random() * 360);

    // On ajoute ça à notre rotation cumulée
    // Attention: la roue tourne visuellement dans le sens horaire grâce au CSS 'transform' positif
    const finalAngle = currentRotation + (spins * 360) + randomAngleOffset;

    // Le CSS s'occupera de l'animation en elle-même
    currentRotation = finalAngle;

    // ATTENTION: Le canvas dessine de base son angle 0 à "3 heures" (droite).
    // Mais on l'a mis tel quel et notre design met le pointeur à "12 heures" (haut).
    // Sur l'écran, le haut c'est un retrait de 90 degrés (-90deg ou 270deg vis-à-vis du point 0 à droite).

    // Ajout d'une rotation de -90 degrés (visuellement) sur le canvas pour aligner le premier segment en haut ?
    // En fait, on a laissé le div normal. Le segment d'index 0 commence à l'horizontale droite (3h) et va jusqu'à ~4h.
    // Quand on tourne le #wheelContainer de X degrés: 
    // Le calcul de l'angle qui tombe SOUS le pointeur à 12h:

    // Pour que ce soit harmonieux, on l'oriente à l'ancienne (-90deg via offset HTML/CSS ou dans le JS).
    // Le plus simple : on ajuste les degrés. On a un offset de -90.
    wheelContainer.style.transform = `rotate(${currentRotation - 90}deg)`;

    // Le CSS Transition dure 5s (défini dans style.css), on attend 5.1s pour le résultat
    setTimeout(() => {
        showResult();
        isSpinning = false;
        spinButton.disabled = false;
    }, 5100);
}

/* ========== AFFICHAGE DU RESULTAT ========== */

function showResult() {
    // Mathématiquement, quel segment est sous le pointeur ?
    // Le pointeur est à -90 deg de l'inclinaison de départ (0 deg).
    // Comme la roue tourne en +, l'élément au sommet recule dans l'index.

    // On prend le reste de notre rotation sur 360 pour trouver sur quel tour on est
    const realModRotation = currentRotation % 360;

    // Chaque segment = 360/10 = 36 deg.
    // L'angle sous le pointeur en haut à la fin = 360 - rotation (car la roue a avancé)
    let pointerAngle = (360 - realModRotation) % 360;

    const segmentIndex = Math.floor(pointerAngle / (360 / numSegments));
    const winner = segments[segmentIndex];

    // Mettre à jour la pop-up
    if (winner.type === "gage") {
        modalType.innerText = "🚨 GAGE !";
        modalType.className = "gage-title";
        modalText.innerText = winner.text;
    } else {
        modalType.innerText = "🏆 PRIX !";
        modalType.className = "";
        modalText.innerText = winner.text;

        // Effet de confettis que s'il y a un prix (récompense maximale)
        triggerConfetti();
    }

    // Afficher la Modale
    resultModal.classList.remove("hidden");
}

function triggerConfetti() {
    // Si la librairie canvas-confetti est dispo (CDN)
    if (typeof confetti === "function") {
        var duration = 3 * 1000;
        var animationEnd = Date.now() + duration;
        var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

        function randomInRange(min, max) {
            return Math.random() * (max - min) + min;
        }

        var interval = setInterval(function () {
            var timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            var particleCount = 50 * (timeLeft / duration);
            // Confettis sortant des deux côtés de l'écran bas
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
            confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
        }, 250);
    }
}

/* ========== EVENTS ========== */

spinButton.addEventListener("click", spinWheel);

closeModalButton.addEventListener("click", () => {
    resultModal.classList.add("hidden");
});

// À l'initialisation, appeler le dessin
drawWheel();
