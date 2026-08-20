<script setup>
import { onMounted, onUnmounted, ref, computed } from "vue";

const wrapRef = ref(null);
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
  waves.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, born: now, seed: Math.random() * Math.PI * 2 });
  if (waves.length > 8) waves.shift();
  lastImpact = now;
}

// 물방울처럼 각도마다 반지름이 살짝 흔들리는 불규칙한 윤곽선을 그린다. reverse를 주면
// 점을 역순으로 이어 감기 방향이 반대가 되고, 바깥/안쪽 두 윤곽을 겹치면 clip()이 고리 모양 구멍을 뚫는다.
function blobPath(ctx, cx, cy, radius, seed, reverse) {
  const points = 22;
  for (let step = 0; step <= points; step += 1) {
    const i = reverse ? points - step : step;
    const angle = (i / points) * Math.PI * 2;
    const wobble = 1 + 0.26 * Math.sin(angle * 3 + seed) + 0.14 * Math.cos(angle * 5 + seed * 1.7);
    const r = Math.max(radius * wobble, 0);
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (step === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
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
    const age = (now - wave.born) / 1300;
    if (age >= 1) {
      waves.splice(index, 1);
      continue;
    }

    // 동심원 밴드마다 영상을 살짝 확대해 다시 그려 물결 굴절처럼 은은하게 배경을 흔든다.
    // 원형 클립 + blur만 쓰기 때문에 각진 조각 없이 부드럽게 이어진다.
    const rings = 3;
    for (let ring = 0; ring < rings; ring += 1) {
      const t = Math.min(Math.max(age - ring * 0.18, 0), 1);
      if (t <= 0 || t >= 1) continue;
      const radius = 16 + t * 150;
      const bandWidth = 30 * (1 - t * 0.4);
      const alpha = Math.sin(t * Math.PI) * 0.22;
      const bulge = (1 - t) * 14;
      if (alpha <= 0.01 || scale <= 0) continue;

      context.save();
      context.beginPath();
      blobPath(context, wave.x, wave.y, radius + bandWidth / 2, wave.seed, false);
      blobPath(context, wave.x, wave.y, Math.max(radius - bandWidth / 2, 0), wave.seed, true);
      context.clip();
      context.filter = "blur(6px)";
      context.globalAlpha = alpha;
      context.drawImage(video, videoX - bulge / 2, videoY - bulge / 2, videoWidth + bulge, videoHeight + bulge);
      context.restore();
    }
  }
  animationFrame = requestAnimationFrame(draw);
}

// 스크롤 핀 연출: .claude/design/PIMM Hero Scroll.dc.html 포팅
const SCROLL_DEPTH_VH = 420;
const SLAM_START = 0.46;
const SLAM_SCALE = 6;

const progress = ref(0);
const mode = ref("top"); // top | fixed | bottom

function clamp(v, a, b) {
  return Math.min(Math.max(v, a), b);
}
function seg(p, a, b) {
  return clamp((p - a) / (b - a), 0, 1);
}
function outExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

function fly(p, a, b, dx, dy, rot) {
  const t = seg(p, a, b);
  const e = t * t;
  return {
    transform: `translate3d(${dx * e}px, ${dy * e}px, 0) rotate(${rot * e}deg) scale(${1 - 0.25 * e})`,
    opacity: String(clamp(1 - Math.pow(t, 1.4) * 1.15, 0, 1)),
    filter: t > 0.01 ? `blur(${(10 * e).toFixed(2)}px)` : "none",
  };
}

function letter(p, start, dur, dir) {
  const t = seg(p, start, start + dur);
  const e = outExpo(t);
  const scale = 1 + (SLAM_SCALE - 1) * (1 - e);
  const over = t > 0.62 ? Math.sin(((t - 0.62) / 0.38) * Math.PI) * 6 * dir : 0;
  return {
    transform: `translate3d(${over.toFixed(2)}px, ${(-40 * (1 - e) * dir).toFixed(2)}px, 0) scale(${scale.toFixed(3)}) rotate(${(dir * 8 * (1 - e)).toFixed(2)}deg)`,
    opacity: String(clamp(t * 4, 0, 1)),
    filter: t < 0.35 ? `blur(${((0.35 - t) * 26).toFixed(2)}px)` : "none",
  };
}

function ring(p, mult, delay) {
  const t = seg(p, SLAM_START + 0.12 + delay, SLAM_START + 0.42 + delay);
  return {
    transform: `scale(${(0.25 + 3.4 * mult * outExpo(t)).toFixed(3)})`,
    opacity: String(t > 0 && t < 1 ? (1 - t) * 0.7 : 0),
  };
}

const vals = computed(() => {
  const p = progress.value;

  const eyebrow = fly(p, 0.0, 0.16, -520, -300, -18);
  const top = fly(p, 0.07, 0.28, -1100, -80, -12);
  const bottom = fly(p, 0.14, 0.36, 1100, 90, 12);
  const motto = fly(p, 0.2, 0.36, 0, -520, 0);
  const lead = fly(p, 0.26, 0.42, 0, 480, 0);

  const l1 = letter(p, SLAM_START, 0.16, 1);
  const l2 = letter(p, SLAM_START + 0.025, 0.16, -1);
  const l3 = letter(p, SLAM_START + 0.05, 0.16, 1);
  const l4 = letter(p, SLAM_START + 0.075, 0.16, -1);

  const impact = seg(p, SLAM_START + 0.13, SLAM_START + 0.34);
  const r1 = ring(p, 1, 0);
  const r2 = ring(p, 0.62, 0.05);
  const flashT = seg(p, SLAM_START + 0.1, SLAM_START + 0.22);

  return {
    ghostOp: String(clamp(1 - seg(p, 0.26, 0.44), 0, 1)),
    innerOp: String(clamp(1 - seg(p, 0.4, 0.46), 0, 1)),
    opHint: String(clamp(1 - seg(p, 0, 0.08), 0, 1)),
    eyebrow, top, bottom, motto, lead,
    l1, l2, l3, l4,
    pimmSettle: 1 - 0.02 * Math.sin(impact * Math.PI),
    opTag: String(seg(p, SLAM_START + 0.18, SLAM_START + 0.34)),
    ring1: r1, ring2: r2,
    flashHeight: `${(2 + 26 * Math.sin(flashT * Math.PI)).toFixed(1)}px`,
    opFlash: String(flashT > 0 && flashT < 1 ? Math.sin(flashT * Math.PI) * 0.85 : 0),
  };
});

const stageStyle = computed(() => ({
  position: mode.value === "fixed" ? "fixed" : "absolute",
  top: mode.value === "bottom" ? "auto" : "0px",
  bottom: mode.value === "bottom" ? "0px" : "auto",
}));

const pimmLettersStyle = computed(() => ({ transform: `skewX(-5deg) scale(${vals.value.pimmSettle.toFixed(4)})` }));

let scrollFrame;
function updateScroll() {
  const el = wrapRef.value;
  if (!el) {
    scrollFrame = null;
    return;
  }
  const vh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const scrollable = el.offsetHeight - vh * 2;
  progress.value = scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;
  mode.value = rect.top > 0 ? "top" : rect.bottom >= vh ? "fixed" : "bottom";
  scrollFrame = null;
}
function onScroll() {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(updateScroll);
}

// 스크롤 한 번(휠/터치)만 감지되면 남은 핀 구간을 일정 속도로 자동 진행
const AUTO_SCROLL_SPEED = 2.2; // px/ms
let autoScrolling = false;
let autoScrollFrame;
let touchStartY = 0;

function pinMetrics() {
  const el = wrapRef.value;
  if (!el) return null;
  const vh = window.innerHeight;
  const rect = el.getBoundingClientRect();
  const wrapDocTop = rect.top + window.scrollY;
  // WOD는 margin-top:-100vh라 랜더링 top이 wrap 하단보다 1vh 위 — 그 지점이 뷰포트 상단(0)에
  // 닿아야 WOD가 화면을 완전히 덮은 상태다.
  const wodCoverY = wrapDocTop + el.offsetHeight - vh;
  return { wodCoverY, remaining: wodCoverY - window.scrollY };
}

// 트랙패드/마우스 휠 관성(모멘텀) 스크롤은 한 번의 "휙" 동작에도 wheel 이벤트가
// 수백ms에 걸쳐 여러 번 발생한다. 애니메이션이 끝나자마자 흡수를 멈추면 뒤늦게
// 도착하는 관성 이벤트가 새 입력으로 처리되어 목표 지점을 지나쳐버린다.
// 그래서 종료 후에도 잠깐(SETTLE_MS) 동안은 계속 흡수만 하고 반응하지 않는다.
const SETTLE_MS = 400;
let settleUntil = 0;

function runAutoScroll(targetY) {
  autoScrolling = true;
  const startY = window.scrollY;
  const distance = targetY - startY;
  const duration = Math.max(Math.abs(distance) / AUTO_SCROLL_SPEED, 1);
  const startTime = performance.now();
  function step(now) {
    const t = Math.min((now - startTime) / duration, 1);
    window.scrollTo(0, startY + distance * t);
    if (t < 1) {
      autoScrollFrame = requestAnimationFrame(step);
    } else {
      window.scrollTo(0, targetY); // 부동소수점 오차 보정용 최종 스냅
      autoScrolling = false;
      autoScrollFrame = null;
      settleUntil = performance.now() + SETTLE_MS;
    }
  }
  autoScrollFrame = requestAnimationFrame(step);
}

function cancelAutoScroll() {
  autoScrolling = false;
  settleUntil = 0;
  if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
  autoScrollFrame = null;
}

function tryAutoAdvance(deltaY) {
  if (autoScrolling) return true;
  if (performance.now() < settleUntil) return true;
  if (deltaY <= 0) return false;
  const metrics = pinMetrics();
  if (!metrics || metrics.remaining <= 2) return false;
  runAutoScroll(metrics.wodCoverY);
  return true;
}

function onWheel(event) {
  if (autoScrolling) {
    event.preventDefault();
    if (event.deltaY < 0) cancelAutoScroll();
    return;
  }
  if (performance.now() < settleUntil) {
    event.preventDefault();
    return;
  }
  if (tryAutoAdvance(event.deltaY)) event.preventDefault();
}

function onTouchStart(event) {
  touchStartY = event.touches[0].clientY;
}
function onTouchMove(event) {
  if (autoScrolling || performance.now() < settleUntil) {
    event.preventDefault();
    return;
  }
  const deltaY = touchStartY - event.touches[0].clientY;
  if (tryAutoAdvance(deltaY)) event.preventDefault();
}

onMounted(() => {
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  updateScroll();
  if (!window.matchMedia("(hover:hover) and (prefers-reduced-motion:no-preference)").matches) return;
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  animationFrame = requestAnimationFrame(draw);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
  window.removeEventListener("wheel", onWheel);
  window.removeEventListener("touchstart", onTouchStart);
  window.removeEventListener("touchmove", onTouchMove);
  window.removeEventListener("resize", resizeCanvas);
  if (scrollFrame) cancelAnimationFrame(scrollFrame);
  cancelAutoScroll();
  cancelAnimationFrame(animationFrame);
});
</script>

<template>
  <div ref="wrapRef" class="idxHeroPinWrap" :style="{ height: `${SCROLL_DEPTH_VH}vh` }">
    <section ref="heroRef" class="idxHero" :style="stageStyle" @pointermove="addImpact">
      <video ref="videoRef" class="idxHeroVideo" src="/images/video.mp4" autoplay muted loop playsinline aria-hidden="true"></video>
      <canvas ref="impactCanvas" class="idxHeroImpact" aria-hidden="true"></canvas>
      <span class="idxHeroScrim" aria-hidden="true"></span>
      <span class="idxHeroWord idxHeroWordTop" aria-hidden="true" :style="{ opacity: vals.ghostOp }">PIMM</span>
      <span class="idxHeroWord idxHeroWordBottom" aria-hidden="true" :style="{ opacity: vals.ghostOp }">CROSSFIT</span>

      <div class="idxHeroInner" :style="{ opacity: vals.innerOp }">
        <span class="idxHeroEyebrow" :style="vals.eyebrow">CROSSFIT PIMM</span>
        <h1 aria-label="PLAYGROUND IN MY MIND">
          <span class="idxHeroTitleLine isTop" :style="vals.top"><b>P</b>LAYGROUND</span>
          <span class="idxHeroTitleLine isBottom" :style="vals.bottom"><b>I</b>N <b>M</b>Y <b>M</b>IND</span>
        </h1>
        <span class="idxHeroMotto" aria-hidden="true" :style="vals.motto">PUSH <i></i> SWEAT <i></i> REPEAT</span>
        <p :style="vals.lead">크로스핏 PIMM에서 당신만의 운동 공간을 만나보세요.</p>
      </div>

      <div class="idxHeroImpactFx" aria-hidden="true">
        <span class="idxHeroRing isOuter" :style="vals.ring1"></span>
        <span class="idxHeroRing isInner" :style="vals.ring2"></span>
        <span class="idxHeroFlash" :style="{ height: vals.flashHeight, opacity: vals.opFlash }"></span>
      </div>

      <div class="idxHeroPimmStage" aria-hidden="true">
        <div class="idxHeroPimmLetters" :style="pimmLettersStyle">
          <span class="idxHeroLetter isP" :style="vals.l1">P</span>
          <span class="idxHeroLetter isI" :style="vals.l2">I</span>
          <span class="idxHeroLetter isM1" :style="vals.l3">M</span>
          <span class="idxHeroLetter isM2" :style="vals.l4">M</span>
        </div>
        <span class="idxHeroPimmTag" :style="{ opacity: vals.opTag }">PLAYGROUND IN MY MIND</span>
      </div>

      <span class="idxHeroScroll" aria-hidden="true" :style="{ opacity: vals.opHint }"></span>
    </section>
  </div>
</template>
