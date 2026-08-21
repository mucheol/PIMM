<script setup>
// 페이지 전체 스크롤 진행률(0~100%)을 계산해 상단 얇은 진행바 폭으로 표시한다.
import { ref, onMounted, onUnmounted } from "vue";

const progress = ref(0);

function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  // 문서 전체 높이에서 뷰포트 높이를 뺀 "실제 스크롤 가능한 거리"를 분모로 써야
  // 짧은 페이지(스크롤 불가)에서 나누기 0이 되는 것을 막을 수 있다.
  progress.value = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
}

onMounted(() => window.addEventListener("scroll", updateProgress, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", updateProgress));
</script>

<template>
  <div class="scrollProgress" :style="{ width: progress + '%' }" aria-hidden="true"></div>
</template>
