<script setup>
import { onMounted, onUnmounted, ref, reactive } from "vue";

const ball = ref(null);
const pupEls = ref([]);
// dog1 faces left natively, dog2 faces right natively (checked against the actual png/gif assets)
const dogDefs = [
  { id: 1, facing: "left", pngSrc: "/images/dogs/dog1.png", gifSrc: "/images/dogs/dog1.gif" },
  { id: 2, facing: "right", pngSrc: "/images/dogs/dog2.png", gifSrc: "/images/dogs/dog2.gif" },
];
const pups = dogDefs.map((dog, i) => ({ ...dog, x: 0, y: 0, delay: 0.06 + i * 0.06, hidden: false, wanderTarget: null, paused: false, pauseUntil: 0, settled: false, lastDX: dog.facing === "left" ? -1 : 1 }));
const displaySrcs = reactive(dogDefs.map((d) => d.pngSrc));

const CHASE_SPEED = 8;
const WANDER_SPEED = 4.5;
const CHASE_GAP = 130;
const MIN_SEPARATION = 150;
const WANDER_MARGIN = 140;
const IDLE_DELAY_MS = 500;

let raf = null;
let mouseX = 0;
let mouseY = 0;
let ballX = 0;
let ballY = 0;
let prevBallX = 0;
let direction = 1; // 1 = last moved right, -1 = last moved left
let lastMoveTime = 0;
let enabled = false;

function onMouseMove(e) {
  mouseX = e.clientX;
  mouseY = e.clientY;
  lastMoveTime = performance.now();
}

function onImgError(index) {
  pups[index].hidden = true;
}

function pickWanderTarget() {
  return {
    x: WANDER_MARGIN + Math.random() * (window.innerWidth - WANDER_MARGIN * 2),
    y: WANDER_MARGIN + Math.random() * (window.innerHeight - WANDER_MARGIN * 2),
  };
}

function loop() {
  const now = performance.now();

  ballX += (mouseX - ballX) * 0.35;
  ballY += (mouseY - ballY) * 0.35;
  if (ball.value) ball.value.style.transform = `translate(${ballX}px,${ballY}px)`;

  const velocity = ballX - prevBallX;
  if (Math.abs(velocity) > 0.3) direction = velocity > 0 ? 1 : -1;
  prevBallX = ballX;

  const chasing = now - lastMoveTime < IDLE_DELAY_MS;

  pups.forEach((pup, i) => {
    let targetX;
    let targetY;
    let speed;

    if (chasing) {
      const gap = CHASE_GAP * (i === 0 ? 1 : 1.8);
      targetX = ballX - direction * gap;
      targetY = ballY;
      speed = CHASE_SPEED;
      pup.paused = false;
      pup.settled = false;
    } else if (!pup.settled) {
      // still catching up to where the mouse stopped, before free-roaming
      const gap = CHASE_GAP * (i === 0 ? 1 : 1.8);
      targetX = ballX - direction * gap;
      targetY = ballY;
      speed = CHASE_SPEED;
    } else {
      if (!pup.wanderTarget || (pup.paused && now >= pup.pauseUntil)) {
        pup.wanderTarget = pickWanderTarget();
        pup.paused = false;
      }
      targetX = pup.wanderTarget.x;
      targetY = pup.wanderTarget.y;
      speed = WANDER_SPEED;
    }

    // keep the two dogs from overlapping
    const other = pups[i === 0 ? 1 : 0];
    const sepDX = pup.x - other.x;
    const sepDY = pup.y - other.y;
    const sepDist = Math.hypot(sepDX, sepDY) || 1;
    if (sepDist < MIN_SEPARATION) {
      const push = (MIN_SEPARATION - sepDist) / MIN_SEPARATION;
      targetX += (sepDX / sepDist) * push * 40;
      targetY += (sepDY / sepDist) * push * 40;
    }

    const dx = targetX - pup.x;
    const dy = targetY - pup.y;
    const dist = Math.hypot(dx, dy);

    if (!chasing && !pup.settled && dist < 6) {
      pup.settled = true;
    }

    if (!chasing && pup.settled && dist < 4 && !pup.paused) {
      pup.paused = true;
      pup.pauseUntil = now + 500 + Math.random() * 800;
    }

    const isPaused = !chasing && pup.settled && pup.paused && now < pup.pauseUntil;
    let running = false;

    if (!isPaused && dist > speed) {
      pup.x += (dx / dist) * speed;
      pup.y += (dy / dist) * speed;
      running = true;
    } else if (!isPaused) {
      pup.x = targetX;
      pup.y = targetY;
    }

    if (Math.abs(dx) > 0.5) pup.lastDX = dx;
    const facesLeft = pup.lastDX < 0;
    const flip = (facesLeft && pup.facing === "right") || (!facesLeft && pup.facing === "left");
    const bounce = running ? Math.sin(now / 90 + pup.delay * 20) * 4 : 0;

    const el = pupEls.value[i];
    if (el) el.style.transform = `translate(${pup.x}px,${pup.y + bounce}px) scaleX(${flip ? -1 : 1})`;

    const wantSrc = running ? pup.gifSrc : pup.pngSrc;
    if (displaySrcs[i] !== wantSrc) displaySrcs[i] = wantSrc;
  });

  raf = requestAnimationFrame(loop);
}

onMounted(() => {
  enabled = window.matchMedia("(hover:hover)").matches && !window.matchMedia("(max-width:768px)").matches;
  if (!enabled) return;

  document.body.classList.add("hasDogCursor");
  mouseX = ballX = window.innerWidth / 2;
  mouseY = ballY = window.innerHeight / 2;
  lastMoveTime = performance.now() - IDLE_DELAY_MS;
  document.addEventListener("mousemove", onMouseMove);
  raf = requestAnimationFrame(loop);
});

onUnmounted(() => {
  if (!enabled) return;
  document.body.classList.remove("hasDogCursor");
  document.removeEventListener("mousemove", onMouseMove);
  if (raf) cancelAnimationFrame(raf);
});
</script>

<template>
  <div class="dogCursorLayer" aria-hidden="true">
    <div ref="ball" class="dogCursorBall"></div>
    <div
      v-for="(pup, i) in pups"
      :key="pup.id"
      ref="pupEls"
      class="dogCursorPup"
      v-show="!pup.hidden"
    >
      <img :src="displaySrcs[i]" alt="" aria-hidden="true" @error="onImgError(i)">
    </div>
  </div>
</template>
