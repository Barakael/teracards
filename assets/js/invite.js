const story = document.getElementById("story");
const guestGreeting = document.getElementById("guest-greeting");
const musicToggle = document.getElementById("music-toggle");
const cover = document.querySelector(".scene-cover");
const bowStage = document.getElementById("bow-stage");
const scenes = document.querySelectorAll(".scene");
const familiesScene = document.querySelector(".scene-families");

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let music = null;
let musicStarted = false;
let isOpening = false;
let isUnlocked = false;

setGuestGreeting();
recolorBows();
watchScenes();
watchCoverReturn();

bowStage.addEventListener("click", openInvitation);

musicToggle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!music) {
        beginMusic();
        return;
    }
    toggleMusic();
});

function setGuestGreeting() {
    const params = new URLSearchParams(window.location.search);
    const raw = (params.get("to") || "").trim();
    const name = raw ? decodeURIComponent(raw) : "Bw. Mgeni";
    guestGreeting.textContent = `Karibu, ${name}`;
}

function openInvitation() {
    if (isOpening) return;
    isOpening = true;

    cover.classList.add("is-opening");
    beginMusic();

    const delay = reducedMotion ? 40 : 1050;
    window.setTimeout(() => {
        document.body.classList.add("is-unlocked");
        isUnlocked = true;
        familiesScene.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        familiesScene.classList.add("is-inview");
        bowStage.disabled = true;
    }, delay);
}

function watchCoverReturn() {
    story.addEventListener("scroll", () => {
        if (!isUnlocked) return;

        if (story.scrollTop <= 24) {
            cover.classList.remove("is-opening");
            bowStage.disabled = false;
            isOpening = false;
            return;
        }

        if (story.scrollTop > cover.offsetHeight * 0.35) {
            cover.classList.add("is-opening");
            bowStage.disabled = true;
        }
    }, { passive: true });
}

function watchScenes() {
    if (reducedMotion || !("IntersectionObserver" in window)) {
        scenes.forEach((scene) => scene.classList.add("is-inview"));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("is-inview");
        });
    }, { root: story, threshold: 0.55 });

    scenes.forEach((scene) => observer.observe(scene));
}

function beginMusic() {
    musicToggle.hidden = false;
    try {
        startMusic();
    } catch (err) {
        /* Story still plays if audio is blocked. */
    }
}

function toggleMusic() {
    if (!music) return;
    const paused = music.toggle();
    musicToggle.classList.toggle("is-paused", paused);
    musicToggle.setAttribute("aria-pressed", paused ? "false" : "true");
    musicToggle.setAttribute("aria-label", paused ? "Cheza Canon in D" : "Simamisha Canon in D");
}

function recolorBows() {
    const bows = document.querySelectorAll(".satin-bow");
    const source = bows[0];
    if (!source) return;

    const paint = () => {
        const canvas = document.createElement("canvas");
        canvas.width = source.naturalWidth;
        canvas.height = source.naturalHeight;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = frame.data;

        for (let i = 0; i < px.length; i += 4) {
            const r = px[i];
            const g = px[i + 1];
            const b = px[i + 2];
            const max = Math.max(r, g, b);
            const min = Math.min(r, g, b);
            const sat = max === 0 ? 0 : (max - min) / max;
            const lum = (r * 0.3) + (g * 0.59) + (b * 0.11);
            const light = lum / 255;

            if (sat < 0.28 || b < r + 12) {
                px[i + 3] = 0;
                continue;
            }

            const shine = Math.pow(light, 0.5);
            px[i] = Math.round(64 + 191 * shine);
            px[i + 1] = Math.round(2 + 240 * Math.pow(light, 1.7));
            px[i + 2] = Math.round(14 + 220 * Math.pow(light, 1.55));
            px[i + 3] = 255;
        }

        const width = canvas.width;
        const cleaned = new Uint8ClampedArray(px);
        for (let y = 1; y < canvas.height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const index = (y * width + x) * 4;
                if (px[index + 3] === 0) continue;
                let neighbors = 0;
                for (let oy = -1; oy <= 1; oy++) {
                    for (let ox = -1; ox <= 1; ox++) {
                        if (ox === 0 && oy === 0) continue;
                        if (px[((y + oy) * width + (x + ox)) * 4 + 3] > 0) neighbors += 1;
                    }
                }
                if (neighbors < 4) cleaned[index + 3] = 0;
            }
        }
        frame.data.set(cleaned);
        fillEnclosedGaps(frame.data, width, canvas.height);

        ctx.putImageData(frame, 0, 0);
        const url = canvas.toDataURL("image/png");
        bows.forEach((img) => {
            img.src = url;
        });
    };

    if (source.complete && source.naturalWidth) paint();
    else source.addEventListener("load", paint, { once: true });
}

function fillEnclosedGaps(px, width, height) {
    const seen = new Uint8Array(width * height);
    const stack = [];

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const start = y * width + x;
            if (seen[start] || px[start * 4 + 3] > 0) continue;

            stack.length = 0;
            stack.push(start);
            seen[start] = 1;
            const cells = [];
            let touchesEdge = false;

            while (stack.length) {
                const current = stack.pop();
                cells.push(current);
                const cx = current % width;
                const cy = Math.floor(current / width);
                if (cx === 0 || cy === 0 || cx === width - 1 || cy === height - 1) touchesEdge = true;

                const neighbors = [current - 1, current + 1, current - width, current + width];
                neighbors.forEach((next, dir) => {
                    if (next < 0 || next >= width * height || seen[next]) return;
                    if (dir < 2 && Math.floor(next / width) !== cy) return;
                    if (px[next * 4 + 3] > 0) return;
                    seen[next] = 1;
                    stack.push(next);
                });
            }

            if (touchesEdge || cells.length > 500) continue;

            cells.forEach((cell) => {
                const index = cell * 4;
                px[index] = 140;
                px[index + 1] = 16;
                px[index + 2] = 32;
                px[index + 3] = 255;
            });
        }
    }
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
        window.setTimeout(schedule, 180);
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
