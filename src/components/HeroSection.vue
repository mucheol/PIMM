<script setup>
import { onMounted, onUnmounted, ref } from "vue";

const heroRef = ref(null);
const videoRef = ref(null);
const impactCanvas = ref(null);
const waves = [];
let context;
let animationFrame;
let lastImpact = 0;

function resizeCanvas() {
  const canvas = impactCanvas.value;
  const hero = heroRef.value;
  if (!canvas || !hero) return;
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = hero.clientWidth * ratio;
  canvas.height = hero.clientHeight * ratio;
  canvas.style.width = `${hero.clientWidth}px`;
  canvas.style.height = `${hero.clientHeight}px`;
  context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function addImpact(event) {
  const now = performance.now();
  if (now - lastImpact < 75) return;
  const rect = heroRef.value.getBoundingClientRect();
  waves.push({
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
    born: now,
    rays: Array.from({ length: 10 }, (_, index) => ({ angle: (Math.PI * 2 * index) / 10 + Math.random() * 0.18, length: 0.7 + Math.random() * 0.5 })),
  });
  if (waves.length > 8) waves.shift();
  lastImpact = now;
}

function draw(now) {
  const canvas = impactCanvas.value;
  const video = videoRef.value;
  if (!context || !canvas || !video) return;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  const scale = video.videoWidth && video.videoHeight ? Math.max(canvas.clientWidth / video.videoWidth, canvas.clientHeight / video.videoHeight) : 0;
  const videoWidth = video.videoWidth * scale;
  const videoHeight = video.videoHeight * scale;
  const videoX = (canvas.clientWidth - videoWidth) / 2;
  const videoY = (canvas.clientHeight - videoHeight) / 2;

  for (let index = waves.length - 1; index >= 0; index -= 1) {
    const wave = waves[index];
    const progress = (now - wave.born) / 900;
    if (progress >= 1) {
      waves.splice(index, 1);
      continue;
    }
    const radius = 28 + Math.sin(progress * Math.PI) * 145;
    const alpha = Math.sin(progress * Math.PI) * 0.92;

    wave.rays.forEach((ray, rayIndex) => {
      const nextRay = wave.rays[(rayIndex + 1) % wave.rays.length];
      const inner = radius * 0.08;
      const outer = radius * ray.length;
      const push = Math.sin(progress * Math.PI) * 26;
      const offsetX = Math.cos(ray.angle) * push;
      const offsetY = Math.sin(ray.angle) * push;
      context.save();
      context.beginPath();
      context.moveTo(wave.x + offsetX + Math.cos(ray.angle) * inner, wave.y + offsetY + Math.sin(ray.angle) * inner);
      context.lineTo(wave.x + offsetX + Math.cos(ray.angle) * outer, wave.y + offsetY + Math.sin(ray.angle) * outer);
      context.lineTo(wave.x + offsetX + Math.cos(nextRay.angle) * outer * nextRay.length, wave.y + offsetY + Math.sin(nextRay.angle) * outer * nextRay.length);
      context.closePath();
      context.clip();
      context.globalAlpha = alpha;
      if (scale) context.drawImage(video, videoX + offsetX, videoY + offsetY, videoWidth, videoHeight);
      context.restore();
    });
    context.globalAlpha = 1;
  }
  animationFrame = requestAnimationFrame(draw);
}

onMounted(() => {
  if (!window.matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches) return;
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  animationFrame = requestAnimationFrame(draw);
});

onUnmounted(() => {
  window.removeEventListener("resize", resizeCanvas);
  cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <section ref="heroRef" class="idxHero" @pointermove="addImpact">
    <video ref="videoRef" class="idxHeroVideo" src="/images/video.mp4" autoplay muted loop playsinline aria-hidden="true"></video>
    <canvas ref="impactCanvas" class="idxHeroImpact" aria-hidden="true"></canvas>
    <span class="idxHeroScrim" aria-hidden="true"></span>
    <span class="idxHeroWord idxHeroWordTop" aria-hidden="true">PIMM</span>
    <span class="idxHeroWord idxHeroWordBottom" aria-hidden="true">CROSSFIT</span>
    <div class="idxHeroInner">
      <span class="idxHeroEyebrow">CROSSFIT PIMM</span>
      <h1 aria-label="PLAYGROUND IN MY MIND">
        <span class="idxHeroTitleLine isTop"><b>P</b>LAYGROUND</span>
        <span class="idxHeroTitleLine isBottom"><b>I</b>N <b>M</b>Y <b>M</b>IND</span>
      </h1>
      <span class="idxHeroMotto" aria-hidden="true">PUSH <i></i> SWEAT <i></i> REPEAT</span>
      <p>크로스핏 PIMM에서 당신만의 운동 공간을 만나보세요.</p>
      <div class="idxHeroBtns">
      </div>
    </div>
    <span class="idxHeroScroll" aria-hidden="true"></span>
  </section>
</template>
