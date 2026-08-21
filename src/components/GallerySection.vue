<script setup>
// PIMM GALLERY — 터널 형태로 배치된 사진 카드들을 스크롤에 따라 통과하는
// 3D "비행" 섹션. 고정된 섹션을 스크롤하면 카메라가 터널 속으로 전진하고,
// 마우스를 움직이면 가벼운 패럴랙스 흔들림이 더해진다. 카드는 흐릿하게
// 나타났다가 카메라가 다가오면 선명해지고, 너무 가까워져 왜곡되기 전에
// 다시 옅어지며 사라진다. 프레임마다의 처리는 tick() 참고.
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useInstagramFeed } from "../composables/useInstagramFeed";
import { useGalleryPhotos } from "../composables/useGalleryPhotos";

// 사진 소스: public/images/gallery/ 폴더에 넣은 사진을 우선 사용하고
// (useGalleryPhotos + vite-plugins/galleryManifest.js 참고), 폴더가
// 비어있으면 인스타그램 피드로 대체한다.
const { photos: instagramPhotos } = useInstagramFeed();
const { photos: localPhotos } = useGalleryPhotos();
const galleryItems = computed(() => (localPhotos.value.length ? localPhotos.value : instagramPhotos.value));

// 사진 개수보다 카드 슬롯이 많아도 모든 슬롯이 사진을 하나씩 받도록
// 있는 사진들을 순환시켜 배정한다.
function mediaFor(i) {
  const items = galleryItems.value;
  return items.length ? items[i % items.length] : null;
}

// 터널 구조: 카드는 Z_FAR(스크롤 시작 지점)부터 Z_NEAR(끝 지점)까지
// 배치되고, 카메라(scene)는 전체 스크롤 구간 동안 CAMERA_TRAVEL만큼
// 전진해서 끝까지 가면 모든 카드를 지나치게 된다.
const BASE_COUNT = 20;
const Z_FAR = -5800;
const Z_NEAR = 300;
const CAMERA_TRAVEL = Math.abs(Z_FAR) + 260;
const GOLDEN_ANGLE = 137.508 * (Math.PI / 180); // 균등한 각도 배치(황금각)
const BORDER_PALETTE = ["rgba(240,176,56,0.5)", "rgba(88,192,240,0.5)", "rgba(56,176,120,0.55)", "rgba(240,232,72,0.5)", "rgba(232,88,56,0.5)"];
const HOVER_BORDER_PALETTE = ["rgba(255,214,140,0.45)", "rgba(170,222,255,0.45)", "rgba(160,230,195,0.45)", "rgba(255,246,175,0.45)", "rgba(255,175,155,0.45)"];
const DRIFT_LETTERS = ["A", "B", "C", "D"];

// 공간 배치(각도/반지름)는 `i`를 그대로 쓰지 않고 섞은 인덱스를 사용한다
// — 그렇지 않으면 깊이 페이드가 `i`에 묶여있어서 동시에 보이는 카드들
// (연속된 `i`)이 황금각 나선에서도 서로 가까운 위치에 몰려 한쪽으로만
// 좁게 쏠려 보인다. 17은 BASE_COUNT와 서로소라 모든 슬롯을 한 번씩
// 거치게 된다.
const SHUFFLE_STEP = 17;
const RADIUS_MIN = 380;
const RADIUS_MAX = 1950;

// 각 기본 카드마다 같은 깊이에서(그래서 같이 나타났다 사라짐) 터널
// 반대편(각도+180°)에 미러 짝을 하나 더 만든다. 화면엔 한쪽만 보이지만
// 마우스 패럴랙스로 시점이 돌아가면 반대편 미러가 시야에 들어온다 —
// 양쪽이 동시에 보이거나 렌더링되지 않으면서도 갤러리가 두 배로
// 풍성하게 느껴진다.
const cardPositions = [];
for (let i = 0; i < BASE_COUNT; i++) {
  const t = i / (BASE_COUNT - 1);
  const z = Math.round(Z_FAR + t * (Z_NEAR - Z_FAR));
  const shuffled = (i * SHUFFLE_STEP) % BASE_COUNT;
  const angle = shuffled * GOLDEN_ANGLE;
  const radius = RADIUS_MIN + ((shuffled * 131) % (RADIUS_MAX - RADIUS_MIN));
  const size = 240 + ((i * 53) % 130);
  const ratio = 0.6 + ((i * 31) % 45) / 100;
  const common = {
    w: Math.round(size),
    h: Math.round(size * ratio),
    z,
    border: BORDER_PALETTE[i % BORDER_PALETTE.length],
    hoverBorder: HOVER_BORDER_PALETTE[i % HOVER_BORDER_PALETTE.length],
    drift: DRIFT_LETTERS[i % DRIFT_LETTERS.length],
    duration: `${8 + (i % 7)}s`,
  };
  for (const a of [angle, angle + Math.PI]) {
    cardPositions.push({
      ...common,
      x: Math.round(Math.cos(a) * radius),
      y: Math.round(Math.sin(a) * radius * 0.72),
      rotY: Math.round(Math.sin(a) * 20),
    });
  }
}

// 깊이는 각 카드의 고정된 슬롯이 아니라 실시간 카메라 위치(scene의
// translateZ) 기준으로 계산한다 — 그렇지 않으면 카메라가 이미 따라잡은
// 카드도 계속 멀고 흐리게 보이고, 선명 구간을 지난 카드는 원근 평면에
// 가까워지며 크고 뭉쳐 보이게 된다. 종형 곡선: 멀 때는 어둡고 흐리게,
// 가까운 구간에서는 선명하게, 너무 가까워지기 전에 다시 옅어지며 사라진다.
const FADE_FAR = -1800;
const SHARP_NEAR = -300;
const CLOSE_FADE_START = 0;
const CLOSE_FADE_END = 260;
const MIN_OPACITY = 0.08;
const MAX_BLUR = 4;

function depthStyle(d) {
  let opacity;
  let blur;
  if (d < FADE_FAR) {
    opacity = MIN_OPACITY;
    blur = MAX_BLUR;
  } else if (d < SHARP_NEAR) {
    const t = (d - FADE_FAR) / (SHARP_NEAR - FADE_FAR);
    opacity = MIN_OPACITY + t * (1 - MIN_OPACITY);
    blur = MAX_BLUR * (1 - t);
  } else if (d < CLOSE_FADE_START) {
    opacity = 1;
    blur = 0;
  } else if (d < CLOSE_FADE_END) {
    const t = (d - CLOSE_FADE_START) / (CLOSE_FADE_END - CLOSE_FADE_START);
    opacity = 1 - t;
    blur = t * 3;
  } else {
    opacity = 0;
    blur = 5;
  }
  const brightness = 0.55 + Math.min(1, Math.max(0, opacity)) * 0.45;
  return { opacity, blur, brightness };
}

const cardRefs = []; // cardPositions와 같은 인덱스로 매핑되는 카드 figure DOM 참조
const cardCache = []; // tick()에서 변경 여부 체크용, 카드별 마지막으로 적용한 opacity/blur/brightness
function setCardRef(el, i) {
  if (el) cardRefs[i] = el;
}

// 터널 분위기를 위해 떠다니는 작은 먼지 입자들.
const motes = [
  { x: -340, y: 240, z: -900, size: 4, color: "rgba(240,232,72,0.75)", duration: "14s", delay: "0s" },
  { x: 220, y: 300, z: -1500, size: 3, color: "rgba(255,255,255,0.6)", duration: "18s", delay: "-4s" },
  { x: 620, y: -140, z: -700, size: 5, color: "rgba(56,176,120,0.7)", duration: "16s", delay: "-8s" },
  { x: -700, y: -40, z: -1200, size: 3, color: "rgba(240,176,56,0.7)", duration: "20s", delay: "-12s" },
  { x: 60, y: 380, z: -300, size: 4, color: "rgba(255,255,255,0.5)", duration: "15s", delay: "-6s" },
  { x: -500, y: 420, z: -200, size: 3, color: "rgba(88,192,240,0.7)", duration: "17s", delay: "-10s" },
];

// 카드별 고정 위치값을 CSS 커스텀 프로퍼티로 노출한다. 실제 `transform`은
// CSS(.idxGalleryCard) 쪽에서 조합하는데, 이렇게 해야 호버 시 당겨지는
// 효과(아래 --pull, --hoverScale)가 이 위치값과 자연스럽게 섞인다.
function cardStyle(c) {
  return {
    width: `${c.w}px`,
    height: `${c.h}px`,
    "--cx": `${c.x}px`,
    "--cy": `${c.y}px`,
    "--cz": `${c.z}px`,
    "--crot": `${c.rotY}deg`,
  };
}
// 호버 시 원근감으로 이미 얼마나 커져 있든 상관없이 대략 일정한 폭
// (HOVER_TARGET_WIDTH)까지 확대되도록 한다 — 그래야 카메라에 가까운
// 카드가 터무니없이 커지는 대신, 가깝든 멀든 비슷한 느낌으로 확대된다.
const HOVER_TARGET_WIDTH = 300;
function onCardEnter(event) {
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  if (!rect.width) return;
  const safeWidth = Math.min(Math.max(rect.width, 30), 900);
  const scale = Math.min(Math.max(HOVER_TARGET_WIDTH / safeWidth, 1.05), 2.6);
  el.style.setProperty("--hoverScale", scale.toFixed(3));
}
// 평상시 테두리 색과, 더 연한 호버용 색조, 그리고 계속 떠다니는 drift
// 애니메이션(layout.css의 driftA–D 키프레임 참고)을 설정한다.
function cardInnerStyle(c) {
  return {
    borderColor: c.border,
    "--cardHoverTint": c.hoverBorder,
    animation: `drift${c.drift} ${c.duration} ease-in-out infinite alternate`,
  };
}
function moteStyle(m) {
  return {
    width: `${m.size}px`,
    height: `${m.size}px`,
    background: m.color,
    transform: `translate(-50%, -50%) translate3d(${m.x}px, ${m.y}px, ${m.z}px)`,
    animation: `moteFloat ${m.duration} linear ${m.delay} infinite`,
  };
}

const sectionRef = ref(null);
const sceneRef = ref(null);
const headRef = ref(null);
const barRef = ref(null);
const pctRef = ref(null);

let reduced = false; // prefers-reduced-motion이면 마우스 패럴랙스 생략
let p = 0, tx = 0, ty = 0, rx = 0, ry = 0, baseWidth = 0, frame = null;
// p: 부드럽게 보간된 스크롤 진행도(0~1) · tx/ty: 정규화된 마우스 위치(-1~1)
// · rx/ry: tx/ty로부터 계산된, 부드럽게 보간된 카메라 기울기 · baseWidth:
// 헤드라인의 원래(변형 전) 폭, 스크롤 확대 배율 계산에 사용.

function measure() {
  const h = headRef.value;
  if (!h) return;
  const prev = h.style.transform;
  h.style.transform = "none";
  baseWidth = h.getBoundingClientRect().width;
  h.style.transform = prev;
}
function onPointerMove(event) {
  if (reduced) return;
  tx = (event.clientX / window.innerWidth - 0.5) * 2;
  ty = (event.clientY / window.innerHeight - 0.5) * 2;
}
function onPointerLeave() {
  tx = 0;
  ty = 0;
}
// 고정 섹션을 얼마나 스크롤했는지, 0(맨 위)부터 1(맨 아래)까지.
function progress() {
  const section = sectionRef.value;
  if (!section) return 0;
  const rect = section.getBoundingClientRect();
  const scrollable = rect.height - window.innerHeight;
  return scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
}
// 매 프레임 실행: 카메라를 전진시키고, 씬 전체에 마우스 패럴랙스
// 흔들림을 적용하고, 모든 카드의 깊이 기반 opacity/blur를 갱신하고,
// 헤드라인의 스크롤 확대·채움 및 진행바/퍼센트를 갱신한다.
function tick() {
  const scene = sceneRef.value;
  if (scene) {
    const cur = progress();
    p += (cur - p) * 0.12;
    rx += (-ty * 7 - rx) * 0.06;
    ry += (tx * 11 - ry) * 0.06;
    const z = p * CAMERA_TRAVEL;
    scene.style.transform = `translate3d(${(tx * -60).toFixed(1)}px, ${(ty * -30).toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;

    cardPositions.forEach((c, i) => {
      const el = cardRefs[i];
      if (!el) return;
      const d = c.z + z;
      // 값을 양자화해서, 거의 안 바뀌는 카드(완전히 숨겨졌거나 완전히
      // 선명한 카드)는 매 프레임 동일한 문자열이 나오게 해 아래 스타일
      // 쓰기를 건너뛴다 — 매 프레임 모든 카드의 filter를 다시 그리게
      // 만들던 끊김의 주요 원인이었다.
      const raw = depthStyle(d);
      const opacity = Math.round(raw.opacity * 40) / 40;
      const blur = Math.round(raw.blur * 4) / 4;
      const brightness = Math.round(raw.brightness * 20) / 20;
      const cache = cardCache[i] || (cardCache[i] = {});
      if (cache.opacity !== opacity) {
        el.style.opacity = opacity.toFixed(3);
        el.style.pointerEvents = opacity > 0.15 ? "auto" : "none";
        cache.opacity = opacity;
      }
      if (cache.blur !== blur || cache.brightness !== brightness) {
        el.style.filter = blur > 0.05 ? `blur(${blur}px) brightness(${brightness})` : `brightness(${brightness})`;
        cache.blur = blur;
        cache.brightness = brightness;
      }
    });

    const pct = `${(p * 100).toFixed(1)}%`;
    const head = headRef.value;
    if (head) {
      if (!baseWidth) measure();
      const maxScale = baseWidth ? (window.innerWidth * 0.92) / baseWidth : 1;
      const target = Math.max(maxScale, 1);
      const scale = 1 + p * (target - 1);
      head.style.setProperty("--galleryHeadScale", scale.toFixed(3));
      head.style.setProperty("--galleryFill", pct);
    }
    if (barRef.value) barRef.value.style.setProperty("--galleryFill", pct);
    if (pctRef.value) pctRef.value.textContent = `${String(Math.round(p * 100)).padStart(2, "0")}%`;
  }
  frame = requestAnimationFrame(tick);
}

// PIMM GALLERY 헤드라인의 마우스 추종 "광원" 효과: --mx/--my는 (CSS의)
// 방사형 마스크 위치를 정해서 커서 아래 텍스트를 색이 입혀진 상태로
// 드러내고, --mxDeg/--mySat는 그 색의 색상(hue)/명도를 커서 위치에 따라
// 바꾼다. 호버 시에만 보인다(layout.css 참고).
function onHeadMove(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const px = (event.clientX - rect.left) / rect.width;
  const py = (event.clientY - rect.top) / rect.height;
  event.currentTarget.style.setProperty("--mx", `${px * 100}%`);
  event.currentTarget.style.setProperty("--my", `${py * 100}%`);
  event.currentTarget.style.setProperty("--mxDeg", `${px * 360}deg`);
  event.currentTarget.style.setProperty("--mySat", `${1 + py * 0.7}`);
}

onMounted(async () => {
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerleave", onPointerLeave);
  await nextTick();
  measure();
  if (document.fonts?.ready) document.fonts.ready.then(measure);
  frame = requestAnimationFrame(tick);
});
onUnmounted(() => {
  window.removeEventListener("pointermove", onPointerMove);
  window.removeEventListener("pointerleave", onPointerLeave);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <!-- 520vh 고정(pinned) 섹션: .idxGallerySticky는 스크롤하는 동안 화면에
       고정되어 있고, 이 스크롤이 위쪽의 `progress()`를 구동한다. -->
  <section class="idxGallery" ref="sectionRef" style="height: 520vh;">
    <div class="idxGallerySticky">
      <span class="idxGalleryGlow" aria-hidden="true"></span>

      <!-- 헤드라인은 카드 씬보다 뒤쪽(z-index)에 위치하며, 자체 호버 광원효과를 가진다 -->
      <div class="idxGalleryHeadWrap">
        <h2 class="idxGalleryHead" ref="headRef" data-text="PIMM GALLERY" @mousemove="onHeadMove">PIMM GALLERY</h2>
      </div>

      <!-- 3D 터널: 바닥 그리드 + 은은한 빛 번짐(bloom) + 먼지 입자 + 사진 카드 -->
      <div class="idxGalleryPerspective">
        <div class="idxGalleryScene" ref="sceneRef">
          <div class="idxGalleryGrid" aria-hidden="true"></div>
          <span class="idxGalleryBloom isA" aria-hidden="true"></span>
          <span class="idxGalleryBloom isB" aria-hidden="true"></span>
          <span class="idxGalleryBloom isC" aria-hidden="true"></span>
          <span v-for="(m, i) in motes" :key="`mote-${i}`" class="idxGalleryMote" :style="moteStyle(m)" aria-hidden="true"></span>

          <!-- cardPositions 항목마다 figure 하나씩; isPhoto로 pointer-events를
               제어해서 빈 카드(플레이스홀더)나 다 사라진 카드는 호버되지 않게 한다 -->
          <figure v-for="(c, i) in cardPositions" :key="`card-${i}`" :ref="(el) => setCardRef(el, i)" class="idxGalleryCard" :class="{ isPhoto: mediaFor(i) }" :style="cardStyle(c)" @pointerenter="onCardEnter">
            <div class="idxGalleryCardInner" :style="cardInnerStyle(c)">
              <a v-if="mediaFor(i)?.permalink" :href="mediaFor(i).permalink" target="_blank" rel="noopener noreferrer" class="idxGalleryCardLink">
                <img :src="mediaFor(i).media_url" :alt="mediaFor(i).caption || '크로스핏 핌 운동사진'" loading="lazy">
              </a>
              <span v-else-if="mediaFor(i)" class="idxGalleryCardLink">
                <img :src="mediaFor(i).media_url" alt="크로스핏 핌 운동사진" loading="lazy">
              </span>
              <template v-else>
                <span class="idxGalleryCardIcon" aria-hidden="true">▤</span>
                <span class="idxGalleryCardLabel">PHOTO</span>
              </template>
            </div>
          </figure>
        </div>
      </div>

      <span class="idxGalleryVignette" aria-hidden="true"></span>

      <div class="idxGalleryEyebrow"><span>GALLERY · SCROLL TO FLY THROUGH</span></div>

      <!-- 진행바 채움과 퍼센트 텍스트 모두 tick()이 --galleryFill / pctRef로 갱신한다 -->
      <div class="idxGalleryProgress">
        <span class="idxGalleryProgressBar" ref="barRef"></span>
        <span class="idxGalleryProgressPct" ref="pctRef">00%</span>
      </div>
    </div>
  </section>
</template>
