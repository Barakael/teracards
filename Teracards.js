const seal = document.getElementById("seal");
const envelope = document.getElementById("envelope");
const envelopeScreen = document.getElementById("envelope-screen");
const invitation = document.getElementById("invitation");
const sparklesContainer = document.getElementById("sparkles");

let isOpening = false;

seal.addEventListener("click", openInvitation);

function openInvitation() {
    if (isOpening) return;
    isOpening = true;

    envelope.classList.add("opening");
    burstSparkles();

    setTimeout(() => {
        envelopeScreen.classList.add("leaving");

        setTimeout(() => {
            envelopeScreen.style.display = "none";
            invitation.style.display = "block";
            invitation.setAttribute("aria-hidden", "false");

            requestAnimationFrame(() => {
                invitation.classList.add("visible");
                revealElements();
            });

            window.scrollTo(0, 0);
        }, 500);
    }, 800);
}

function revealElements() {
    const items = invitation.querySelectorAll(".reveal");
    items.forEach((el, i) => {
        setTimeout(() => el.classList.add("shown"), 80 + i * 100);
    });
}

function burstSparkles() {
    const colors = ["#f0d78c", "#d4a853", "#fff", "#9e92f7"];
    const count = 24;

    for (let i = 0; i < count; i++) {
        const sparkle = document.createElement("span");
        sparkle.className = "sparkle";
        sparkle.style.left = 35 + Math.random() * 30 + "%";
        sparkle.style.top = 38 + Math.random() * 12 + "%";
        sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
        sparkle.style.animationDelay = Math.random() * 0.3 + "s";
        sparkle.style.width = sparkle.style.height = 4 + Math.random() * 4 + "px";
        sparklesContainer.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 1500);
    }
}
