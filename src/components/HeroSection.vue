<script setup>
// 히어로(첫 화면) 섹션: 배경 영상 위에 클릭/터치 시 물결처럼 굴절되는 캔버스
// 이펙트를 그리고, 스크롤에 맞춰 타이틀 문구가 흩어지듯 사라지며 "PIMM" 글자가
// 쾅 하고 임팩트를 주며 등장하는 핀(pinned) 스크롤 연출을 담당한다.
// 스크롤 한 번만 입력해도 남은 핀 구간을 자동으로 끝까지 진행시켜(관성 스크롤 흡수 포함)
// WOD 섹션으로 자연스럽게 넘어가게 만든다.
import { onMounted, onUnmounted, ref, computed } from "vue";

const wrapRef = ref(null);
const heroRef = ref(null);
const videoRef = ref(null);
const impactCanvas = ref(null);
const waves = [];
let context;
let animationFrame;
let lastImpact = 0;

// 캔버스 해상도를 실제 표시 크기 × devicePixelRatio로 맞춰 고DPI 화면에서도
// 흐릿하지 않게 하고, setTransform으로 좌표계를 CSS px 기준으로 되돌린다
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

// 클릭/포인터 이동 지점에 물결(wave) 파동 하나를 추가한다. 75ms 쓰로틀로
// 과도하게 자주 생성되는 것을 막고, 최대 8개까지만 유지해 오래된 파동은 제거한다.
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

// 매 프레임 실행: 살아있는 각 파동을 동심원 굴절 밴드로 그리고, 수명이 다한
// 파동은 배열에서 제거한다.
function draw(now) {
  const canvas = impactCanvas.value;
  const video = videoRef.value;
  if (!context || !canvas || !video) return;
  context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

  // 영상을 캔버스에 cover 방식으로 맞추기 위한 배율과 오프셋 계산
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
// 전체 progress(0~1) 중 [a, b] 구간만 뽑아 다시 0~1로 정규화 — 각 요소가
// 스크롤 전체가 아니라 자기 담당 구간에서만 움직이게 하기 위한 헬퍼
function seg(p, a, b) {
  return clamp((p - a) / (b - a), 0, 1);
}
function outExpo(t) {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// 문구가 화면 밖으로 날아가며 흐려지는 공통 연출(eyebrow/top/bottom/motto/lead에 재사용)
function fly(p, a, b, dx, dy, rot) {
  const t = seg(p, a, b);
  const e = t * t;
  return {
    transform: `translate3d(${dx * e}px, ${dy * e}px, 0) rotate(${rot * e}deg) scale(${1 - 0.25 * e})`,
    opacity: String(clamp(1 - Math.pow(t, 1.4) * 1.15, 0, 1)),
    filter: t > 0.01 ? `blur(${(10 * e).toFixed(2)}px)` : "none",
  };
}

// "PIMM" 개별 글자가 튕기듯 확대되며 나타나는 슬램 임팩트 연출.
// dir(+1/-1)로 글자마다 좌우 반대 방향으로 살짝 튕기게 해 통통 튀는 느낌을 준다.
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

// 임팩트 시점에 퍼져나가는 충격파 링(원형 확대+페이드) 연출
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

// 핀(pinned) 스크롤 구현: 래퍼가 스크롤되는 동안엔 히어로를 fixed로 화면에
// 고정해두고, 래퍼 시작 전(top)/끝난 후(bottom)에는 각각 정상 문서 흐름 위치로
// 되돌려 핀 구간 앞뒤에서 자연스럽게 이어지게 한다.
const stageStyle = computed(() => ({
  position: mode.value === "fixed" ? "fixed" : "absolute",
  top: mode.value === "bottom" ? "auto" : "0px",
  bottom: mode.value === "bottom" ? "0px" : "auto",
}));

const pimmLettersStyle = computed(() => ({ transform: `skewX(-5deg) scale(${vals.value.pimmSettle.toFixed(4)})` }));

let scrollFrame;
// 스크롤/리사이즈마다 progress(0~1)와 현재 모드(top/fixed/bottom)를 갱신.
// rAF로 감싸서 스크롤 이벤트가 짧은 시간에 여러 번 발생해도 프레임당 한 번만 계산한다.
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
let autoScrollDirection = 0; // 1 = 아래로 진행 중, -1 = 위로 진행 중 (역방향 휠 입력 시 취소 판단용)
let touchStartY = 0;

// WOD 섹션 하단 문서 Y좌표. 이 지점을 지나 갤러리 등으로 더 내려간 상태에서는
// 위로 스크롤해도 맨 위로 점프시키지 않고 자연스러운 스크롤을 그대로 둔다.
function wodBottomY() {
  const wod = document.querySelector(".idxWod");
  if (!wod) return Infinity;
  const rect = wod.getBoundingClientRect();
  return rect.bottom + window.scrollY;
}

// 자동 스크롤이 향해야 할 목표 지점(WOD 섹션이 화면을 완전히 덮는 문서 Y좌표)과
// 거기까지 남은 거리를 계산한다
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

// 현재 위치에서 targetY까지 일정 속도(AUTO_SCROLL_SPEED)로 부드럽게 자동 스크롤한다
function runAutoScroll(targetY) {
  autoScrolling = true;
  const startY = window.scrollY;
  const distance = targetY - startY;
  autoScrollDirection = distance >= 0 ? 1 : -1;
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

// 아래로 스크롤하면 남은 핀 구간을 끝까지, 위로 스크롤하면(WOD 섹션 범위 안에 있을 때만)
// 맨 위(히어로 첫 화면)까지 자동으로 진행한다. 이미 자동 스크롤 중이거나 방금 끝나
// SETTLE_MS 이내(관성 이벤트 흡수 구간)면 무시.
function tryAutoAdvance(deltaY) {
  if (autoScrolling) return true;
  if (performance.now() < settleUntil) return true;
  if (deltaY > 0) {
    const metrics = pinMetrics();
    if (!metrics || metrics.remaining <= 2) return false;
    runAutoScroll(metrics.wodCoverY);
    return true;
  }
  if (deltaY < 0) {
    if (window.innerWidth <= 768) return false; // 모바일은 WOD 섹션이 길어서 한 번에 맨 위로 튀면 오히려 불편함 — 일반 스크롤 유지
    if (window.scrollY <= 2) return false; // 이미 맨 위
    if (window.scrollY > wodBottomY()) return false; // WOD 범위를 벗어남 — 일반 스크롤 유지
    runAutoScroll(0);
    return true;
  }
  return false;
}

function onWheel(event) {
  if (autoScrolling) {
    event.preventDefault();
    const opposing = (autoScrollDirection > 0 && event.deltaY < 0) || (autoScrollDirection < 0 && event.deltaY > 0);
    if (opposing) cancelAutoScroll();
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
  // 모바일은 WOD 섹션이 길어서 터치 스크롤 가로채기(자동 진행/맨 위로 점프)가
  // 오히려 스크롤을 방해함 — 터치 입력에서는 이 기능 자체를 끄고 순수 네이티브
  // 스크롤만 사용한다. 데스크톱 휠 입력(onWheel)에는 영향 없음.
  if (window.innerWidth <= 768) return;
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

<!-- 래퍼 높이(SCROLL_DEPTH_VH)만큼 스크롤 가능한 여유 공간을 확보해야 안의
     .idxHero가 fixed로 고정된 동안 실제로 스크롤이 발생해 progress가 움직인다 -->
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

      <!-- 스크롤 임팩트 시 슬램되며 등장하는 "PIMM" 대형 글자 스테이지 -->
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
