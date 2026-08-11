<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";

const sectionRef = ref(null);
const progress = ref(0);
const stageStyle = computed(() => ({
  "--sweepOrange": `${(1 - progress.value) * -120}%`,
  "--sweepYellow": `${(1 - progress.value) * -145}%`,
  "--titleOpacity": Math.max(1 - Math.abs(progress.value - 0.55) * 5, 0),
  "--titleOffset": `${(progress.value - 0.55) * -80}px`,
}));

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

<template>
  <section ref="sectionRef" class="wodTransition" aria-hidden="true">
    <div class="wodTransitionStage" :style="stageStyle">
      <span class="wodTransitionSweep isOrange"></span>
      <span class="wodTransitionSweep isYellow"></span>
      <span class="wodTransitionTitle">TODAY'S WOD</span>
    </div>
  </section>
</template>
