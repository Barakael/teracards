const seal = document.getElementById("seal");
const bloomScreen = document.getElementById("bloom-screen");
const invitation = document.getElementById("invitation");
const sparklesContainer = document.getElementById("sparkles");
const musicToggle = document.getElementById("music-toggle");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let isOpening = false;
let music = null;

seal.addEventListener("click", openInvitation);
musicToggle.addEventListener("click", toggleMusic);

function openInvitation() {
    if (isOpening) return;
    isOpening = true;

    bloomScreen.classList.add("untying");
    burstSparkles();
    try {
        startMusic();
    } catch (err) {
        /* The card still opens if audio is blocked. */
    }

    window.setTimeout(() => bloomScreen.classList.add("blooming"), reducedMotion ? 0 : 420);

    window.setTimeout(() => {
        bloomScreen.classList.add("opened");
        invitation.style.display = "block";
        invitation.setAttribute("aria-hidden", "false");
        musicToggle.hidden = false;

        requestAnimationFrame(() => {
            invitation.classList.add("visible");
            revealElements();
        });

        window.scrollTo(0, 0);
    }, reducedMotion ? 40 : 1080);
}

function revealElements() {
    invitation.querySelectorAll(".reveal").forEach((el, i) => {
        window.setTimeout(() => el.classList.add("shown"), reducedMotion ? 0 : 80 + i * 110);
    });
}

function burstSparkles() {
    const colors = ["#f0d78c", "#d4a853", "#fff", "#9e92f7", "#ffd0e0"];
    const count = reducedMotion ? 0 : 28;

    for (let i = 0; i < count; i++) {
        const sparkle = document.createElement("span");
        sparkle.className = "sparkle";
        sparkle.style.left = 30 + Math.random() * 40 + "%";
        sparkle.style.top = 34 + Math.random() * 18 + "%";
        sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
        sparkle.style.animationDelay = Math.random() * 0.35 + "s";
        sparkle.style.width = sparkle.style.height = 4 + Math.random() * 5 + "px";
        sparklesContainer.appendChild(sparkle);
        window.setTimeout(() => sparkle.remove(), 1600);
    }
}

function toggleMusic() {
    if (!music) return;
    const paused = music.toggle();
    musicToggle.classList.toggle("is-paused", paused);
    musicToggle.setAttribute("aria-pressed", paused ? "false" : "true");
    musicToggle.setAttribute("aria-label", paused ? "Play Canon in D" : "Pause Canon in D");
}

function startMusic() {
    if (music) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const master = ctx.createGain();
    const warmth = ctx.createBiquadFilter();
    warmth.type = "lowpass";
    warmth.frequency.value = 2400;
    const out = ctx.createGain();
    out.gain.value = 0.2;
    master.connect(warmth);
    warmth.connect(out);
    out.connect(ctx.destination);
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.85, ctx.currentTime + 1.4);

    const quarter = 0.72;
    const bar = quarter * 4;
    const melody = [
        "F#5", "E5", "D5", "C#5",
        "B4", "A4", "B4", "C#5",
        "D5", "C#5", "B4", "A4",
        "G4", "F#4", "G4", "E4",
        "D5", "F#5", "A5", "F#5",
        "E5", "D5", "C#5", "B4",
        "A4", "G4", "F#4", "E4",
        "D5", "F#5", "A5", "D5"
    ];
    const harmony = [
        ["D3", "A3", "F#4"],
        ["A2", "E3", "C#4"],
        ["B2", "F#3", "D4"],
        ["F#2", "C#3", "A3"],
        ["G2", "D3", "B3"],
        ["D3", "A3", "F#4"],
        ["G2", "D3", "B3"],
        ["A2", "E3", "C#4"]
    ];
    const loop = bar * harmony.length;
    let next = 0;
    let stopped = false;
    let timer = 0;

    function freq(note) {
        const semi = { C: 0, "C#": 1, D: 2, "D#": 3, E: 4, F: 5, "F#": 6, G: 7, "G#": 8, A: 9, "A#": 10, B: 11 };
        const name = note.slice(0, -1);
        const octave = Number(note.slice(-1));
        const midi = (octave + 1) * 12 + semi[name];
        return 440 * Math.pow(2, (midi - 69) / 12);
    }

    function bell(frequency, time, duration, level) {
        const gain = ctx.createGain();
        gain.connect(master);
        gain.gain.setValueAtTime(0.0001, time);
        gain.gain.exponentialRampToValueAtTime(level, time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

        [1, 2.01].forEach((partial, index) => {
            const osc = ctx.createOscillator();
            osc.type = index === 0 ? "sine" : "triangle";
            osc.frequency.setValueAtTime(frequency * partial, time);
            const partialGain = ctx.createGain();
            partialGain.gain.value = index === 0 ? 1 : 0.16;
            osc.connect(partialGain);
            partialGain.connect(gain);
            osc.start(time);
            osc.stop(time + duration + 0.02);
        });
    }

    function schedule() {
        if (stopped) return;
        if (next === 0) next = ctx.currentTime + 0.08;
        const horizon = ctx.currentTime + 0.4;
        while (next < horizon) {
            const start = next;
            melody.forEach((note, index) => {
                bell(freq(note), start + index * quarter, quarter * 1.85, 0.11);
            });
            harmony.forEach((chord, index) => {
                chord.forEach((note, voice) => {
                    bell(freq(note), start + index * bar, bar * 0.96, voice === 0 ? 0.045 : 0.02);
                });
            });
            next += loop;
        }
        timer = window.setTimeout(schedule, 180);
    }

    schedule();
    ctx.resume();

    music = {
        toggle() {
            const pausing = ctx.state === "running";
            const at = ctx.currentTime;
            master.gain.cancelScheduledValues(at);
            master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), at);
            master.gain.exponentialRampToValueAtTime(pausing ? 0.0001 : 0.85, at + 0.2);
            if (pausing) ctx.suspend();
            else ctx.resume();
            return pausing;
        }
    };
}
