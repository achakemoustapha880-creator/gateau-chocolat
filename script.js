// ============================================
// Utilitaires couleur — interpolation RGB
// ============================================
function hexVersRgb(hex) {
    const nettoye = hex.replace("#", "");
    return {
        r: parseInt(nettoye.substring(0, 2), 16),
        g: parseInt(nettoye.substring(2, 4), 16),
        b: parseInt(nettoye.substring(4, 6), 16),
    };
}

function interpolerCouleur(hexDepart, hexArrivee, t) {
    const depart = hexVersRgb(hexDepart);
    const arrivee = hexVersRgb(hexArrivee);
    const r = Math.round(depart.r + (arrivee.r - depart.r) * t);
    const g = Math.round(depart.g + (arrivee.g - depart.g) * t);
    const b = Math.round(depart.b + (arrivee.b - depart.b) * t);
    return `rgb(${r}, ${g}, ${b})`;
}

// ============================================
// Slider d'intensité du chocolat — élément signature
// ============================================
const COULEUR_LAIT = "#A97452";
const COULEUR_NOIR_EXTREME = "#180D07";

const curseurCacao = document.getElementById("cacao-range");
const pourcentageEl = document.getElementById("cacao-pourcentage");
const qualificatifEl = document.getElementById("cacao-qualificatif");

function qualificatifPourValeur(valeur) {
    if (valeur < 55) return "Chocolat au lait";
    if (valeur < 70) return "Mi-amer";
    if (valeur < 85) return "Noir intense";
    return "Grand cru extra-noir";
}

function appliquerIntensiteCacao(valeur) {
    const t = (valeur - 40) / (100 - 40); // 0 → 1
    const couleur = interpolerCouleur(COULEUR_LAIT, COULEUR_NOIR_EXTREME, t);
    document.documentElement.style.setProperty("--hero-couleur", couleur);

    if (pourcentageEl) pourcentageEl.textContent = valeur.toString();
    if (qualificatifEl) qualificatifEl.textContent = qualificatifPourValeur(valeur);
}

if (curseurCacao) {
    appliquerIntensiteCacao(parseInt(curseurCacao.value, 10));
    curseurCacao.addEventListener("input", (evenement) => {
        appliquerIntensiteCacao(parseInt(evenement.target.value, 10));
    });
}

// ============================================
// Ajustement des portions
// ============================================
const PORTIONS_BASE = 4;
const PORTIONS_MIN = 1;
const PORTIONS_MAX = 12;

let portionsActuelles = PORTIONS_BASE;

const portionsValeurEl = document.getElementById("portions-valeur");
const boutonMoins = document.getElementById("portions-moins");
const boutonPlus = document.getElementById("portions-plus");
const listeIngredients = document.getElementById("liste-ingredients");

function formaterQuantite(base, unite, portions) {
    const valeur = (base / PORTIONS_BASE) * portions;
    if (unite === "") {
        return Math.max(1, Math.round(valeur)).toString();
    }
    return `${Math.round(valeur)} ${unite}`;
}

function mettreAJourQuantites() {
    if (!listeIngredients) return;
    listeIngredients.querySelectorAll("p[data-base]").forEach((ligne) => {
        const base = parseFloat(ligne.dataset.base);
        const unite = ligne.dataset.unite || "";
        const quantiteEl = ligne.querySelector(".quantite");
        if (quantiteEl) quantiteEl.textContent = formaterQuantite(base, unite, portionsActuelles);
    });
    if (portionsValeurEl) portionsValeurEl.textContent = portionsActuelles.toString();
}

function ajusterPortions(delta) {
    const nouvelle = portionsActuelles + delta;
    if (nouvelle < PORTIONS_MIN || nouvelle > PORTIONS_MAX) return;
    portionsActuelles = nouvelle;
    mettreAJourQuantites();
}

if (boutonMoins) boutonMoins.addEventListener("click", () => ajusterPortions(-1));
if (boutonPlus) boutonPlus.addEventListener("click", () => ajusterPortions(1));

// ============================================
// Checklist d'ingrédients
// ============================================
const compteurCoches = document.getElementById("ingredients-coches");
const compteurTotal = document.getElementById("ingredients-total");

function initChecklistIngredients() {
    if (!listeIngredients) return;
    const lignes = Array.from(listeIngredients.querySelectorAll("p[data-base]"));
    if (compteurTotal) compteurTotal.textContent = lignes.length.toString();

    lignes.forEach((ligne) => {
        ligne.setAttribute("role", "checkbox");
        ligne.setAttribute("aria-checked", "false");
        ligne.setAttribute("tabindex", "0");

        const basculer = () => {
            const coche = ligne.classList.toggle("coche");
            ligne.setAttribute("aria-checked", coche ? "true" : "false");
            const nbCoches = lignes.filter((l) => l.classList.contains("coche")).length;
            if (compteurCoches) compteurCoches.textContent = nbCoches.toString();
        };

        ligne.addEventListener("click", basculer);
        ligne.addEventListener("keydown", (evenement) => {
            if (evenement.key === "Enter" || evenement.key === " ") {
                evenement.preventDefault();
                basculer();
            }
        });
    });
}

// ============================================
// Mode cuisine — overlay plein écran
// ============================================
const boutonModeCuisine = document.getElementById("btn-mode-cuisine");
const overlayCuisine = document.getElementById("overlay-cuisine");
const boutonFermerOverlay = document.getElementById("btn-fermer-cuisine");
const overlayTexte = document.getElementById("overlay-etape-texte");
const overlayNumActuel = document.getElementById("etape-actuelle-num");
const overlayNumTotal = document.getElementById("etape-total-num");
const overlayPoints = document.getElementById("overlay-points");
const boutonPrecedent = document.getElementById("btn-etape-precedente");
const boutonSuivant = document.getElementById("btn-etape-suivante");
const conteneurMinuteur = document.getElementById("minuteur-cuisson");

let etapesData = [];
let indexEtapeActuelle = 0;

function construireEtapesData() {
    const lignes = document.querySelectorAll("#liste-etapes tr.etape");
    etapesData = Array.from(lignes).map((ligne) => ({
        texte: ligne.querySelector(".preparation_etape").textContent.trim(),
        minuteur: ligne.dataset.minuteur ? parseInt(ligne.dataset.minuteur, 10) : null,
    }));

    if (overlayNumTotal) overlayNumTotal.textContent = etapesData.length.toString();

    if (overlayPoints) {
        overlayPoints.innerHTML = "";
        etapesData.forEach(() => {
            const point = document.createElement("span");
            overlayPoints.appendChild(point);
        });
    }
}

function afficherEtape(index) {
    if (!etapesData.length) return;
    indexEtapeActuelle = Math.max(0, Math.min(index, etapesData.length - 1));
    const etape = etapesData[indexEtapeActuelle];

    if (overlayTexte) overlayTexte.textContent = etape.texte;
    if (overlayNumActuel) overlayNumActuel.textContent = (indexEtapeActuelle + 1).toString();

    if (overlayPoints) {
        Array.from(overlayPoints.children).forEach((point, i) => {
            point.classList.toggle("actif", i === indexEtapeActuelle);
        });
    }

    if (boutonPrecedent) boutonPrecedent.disabled = indexEtapeActuelle === 0;
    if (boutonSuivant) boutonSuivant.disabled = indexEtapeActuelle === etapesData.length - 1;

    reinitialiserMinuteur();
    if (conteneurMinuteur) {
        conteneurMinuteur.hidden = !etape.minuteur;
        if (etape.minuteur) configurerMinuteur(etape.minuteur);
    }
}

function ouvrirModeCuisine() {
    construireEtapesData();
    if (!etapesData.length || !overlayCuisine) return;
    overlayCuisine.hidden = false;
    document.body.style.overflow = "hidden";
    afficherEtape(0);
    if (boutonFermerOverlay) boutonFermerOverlay.focus();
}

function fermerModeCuisine() {
    if (!overlayCuisine) return;
    overlayCuisine.hidden = true;
    document.body.style.overflow = "";
    arreterMinuteur();
    if (boutonModeCuisine) boutonModeCuisine.focus();
}

if (boutonModeCuisine) boutonModeCuisine.addEventListener("click", ouvrirModeCuisine);
if (boutonFermerOverlay) boutonFermerOverlay.addEventListener("click", fermerModeCuisine);
if (boutonPrecedent) boutonPrecedent.addEventListener("click", () => afficherEtape(indexEtapeActuelle - 1));
if (boutonSuivant) boutonSuivant.addEventListener("click", () => afficherEtape(indexEtapeActuelle + 1));

document.addEventListener("keydown", (evenement) => {
    if (!overlayCuisine || overlayCuisine.hidden) return;
    if (evenement.key === "Escape") fermerModeCuisine();
    if (evenement.key === "ArrowRight") afficherEtape(indexEtapeActuelle + 1);
    if (evenement.key === "ArrowLeft") afficherEtape(indexEtapeActuelle - 1);
});

// ============================================
// Minuteur circulaire
// ============================================
const CIRCONFERENCE = 2 * Math.PI * 52; // ≈ 326.7

const anneauProgression = document.getElementById("anneau-progression");
const minuteurTempsEl = document.getElementById("minuteur-temps");
const boutonMinuteurDemarrer = document.getElementById("btn-minuteur-demarrer");
const boutonMinuteurReinit = document.getElementById("btn-minuteur-reinit");

let dureeMinuteur = 0;
let tempsRestant = 0;
let intervalleMinuteur = null;

function formaterTemps(secondes) {
    const m = Math.floor(secondes / 60).toString().padStart(2, "0");
    const s = (secondes % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

function configurerMinuteur(duree) {
    dureeMinuteur = duree;
    tempsRestant = duree;
    if (anneauProgression) {
        anneauProgression.style.strokeDasharray = CIRCONFERENCE.toString();
        anneauProgression.style.strokeDashoffset = "0";
    }
    if (minuteurTempsEl) minuteurTempsEl.textContent = formaterTemps(tempsRestant);
    if (boutonMinuteurDemarrer) boutonMinuteurDemarrer.textContent = "Démarrer";
}

function actualiserAnneau() {
    if (!anneauProgression || !dureeMinuteur) return;
    const fraction = tempsRestant / dureeMinuteur;
    anneauProgression.style.strokeDashoffset = (CIRCONFERENCE * (1 - fraction)).toString();
}

function demarrerMinuteur() {
    if (intervalleMinuteur || tempsRestant <= 0) return;
    if (boutonMinuteurDemarrer) boutonMinuteurDemarrer.textContent = "Pause";

    intervalleMinuteur = window.setInterval(() => {
        tempsRestant -= 1;
        if (minuteurTempsEl) minuteurTempsEl.textContent = formaterTemps(Math.max(0, tempsRestant));
        actualiserAnneau();

        if (tempsRestant <= 0) {
            arreterMinuteur();
            if (minuteurTempsEl) minuteurTempsEl.textContent = "Prêt !";
            if (boutonMinuteurDemarrer) boutonMinuteurDemarrer.textContent = "Redémarrer";
        }
    }, 1000);
}

function mettreEnPauseMinuteur() {
    if (intervalleMinuteur) {
        window.clearInterval(intervalleMinuteur);
        intervalleMinuteur = null;
        if (boutonMinuteurDemarrer) boutonMinuteurDemarrer.textContent = "Reprendre";
    }
}

function arreterMinuteur() {
    if (intervalleMinuteur) {
        window.clearInterval(intervalleMinuteur);
        intervalleMinuteur = null;
    }
}

function reinitialiserMinuteur() {
    arreterMinuteur();
    if (dureeMinuteur) configurerMinuteur(dureeMinuteur);
}

if (boutonMinuteurDemarrer) {
    boutonMinuteurDemarrer.addEventListener("click", () => {
        if (intervalleMinuteur) {
            mettreEnPauseMinuteur();
        } else {
            demarrerMinuteur();
        }
    });
}

if (boutonMinuteurReinit) {
    boutonMinuteurReinit.addEventListener("click", reinitialiserMinuteur);
}

// ============================================
// Mode sombre — persistance best-effort
// ============================================
const CLE_THEME = "gateau-chocolat-theme";
const boutonTheme = document.getElementById("btn-theme");
const iconeTheme = boutonTheme ? boutonTheme.querySelector(".icone-theme") : null;

function lireThemeSauvegarde() {
    try {
        return window.localStorage.getItem(CLE_THEME);
    } catch (erreur) {
        return null;
    }
}

function sauvegarderTheme(theme) {
    try {
        window.localStorage.setItem(CLE_THEME, theme);
    } catch (erreur) {
        // Stockage indisponible : le thème reste actif pour la session en cours seulement.
    }
}

function appliquerTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    if (boutonTheme) boutonTheme.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    if (iconeTheme) iconeTheme.textContent = theme === "dark" ? "☀️" : "🌙";
}

function initTheme() {
    const sauvegarde = lireThemeSauvegarde();
    const preferenceSysteme = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    appliquerTheme(sauvegarde || (preferenceSysteme ? "dark" : "light"));
}

if (boutonTheme) {
    boutonTheme.addEventListener("click", () => {
        const themeActuel = document.documentElement.getAttribute("data-theme");
        const nouveauTheme = themeActuel === "dark" ? "light" : "dark";
        appliquerTheme(nouveauTheme);
        sauvegarderTheme(nouveauTheme);
    });
}

// ============================================
// Révélation au scroll
// ============================================
function initRevelationScroll() {
    const elements = document.querySelectorAll(".reveal");
    if (!elements.length) return;

    if (!("IntersectionObserver" in window)) {
        elements.forEach((el) => el.classList.add("visible"));
        return;
    }

    const observateur = new IntersectionObserver(
        (entrees) => {
            entrees.forEach((entree) => {
                if (entree.isIntersecting) {
                    entree.target.classList.add("visible");
                    observateur.unobserve(entree.target);
                }
            });
        },
        { threshold: 0.15 }
    );

    elements.forEach((el) => observateur.observe(el));
}

// ============================================
// Initialisation
// ============================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initChecklistIngredients();
    mettreAJourQuantites();
    initRevelationScroll();
});