<script setup>
// HERO와 WOD 섹션 사이의 색상 스윕(주황/노랑 대각선 패널) 전환 연출.
// 스크롤 진행도(progress)에 따라 두 패널이 화면을 가로질러 채워지고,
// 그 중간 지점(0.55 부근)에서만 "TODAY'S WOD" 타이틀이 잠깐 나타난다.
import { computed, onMounted, onUnmounted, ref } from "vue";

const sectionRef = ref(null);
const progress = ref(0);
const stageStyle = computed(() => ({
  "--sweepOrange": `${(1 - progress.value) * -120}%`,
  "--sweepYellow": `${(1 - progress.value) * -145}%`,
  // 진행도가 0.55에서 멀어질수록 빠르게 옅어지는 삼각형 형태의 opacity(타이틀이 잠깐만 보이게)
  "--titleOpacity": Math.max(1 - Math.abs(progress.value - 0.55) * 5, 0),
  "--titleOffset": `${(progress.value - 0.55) * -80}px`,
}));

// 섹션을 얼마나 스크롤했는지 0(진입 전)~1(완전히 지나감)로 계산
function updateProgress() {
  const section = sectionRef.value;
  if (!section) return;
  const scrollable = section.offsetHeight - window.innerHeight;
  progress.value = scrollable > 0 ? Math.min(Math.max(-section.getBoundingClientRect().top / scrollable, 0), 1) : 1;
}

onMounted(() => {
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);
});

onUnmounted(() => {
  window.removeEventListener("scroll", updateProgress);
  window.removeEventListener("resize", updateProgress);
});
</script>

<!-- 시각적 전환 연출 전용 섹션이라 스크린리더에는 노출하지 않는다(aria-hidden) -->
<template>
  <section ref="sectionRef" class="wodTransition" aria-hidden="true">
    <div class="wodTransitionStage" :style="stageStyle">
      <span class="wodTransitionSweep isOrange"></span>
      <span class="wodTransitionSweep isYellow"></span>
      <span class="wodTransitionTitle">TODAY'S WOD</span>
    </div>
  </section>
</template>
