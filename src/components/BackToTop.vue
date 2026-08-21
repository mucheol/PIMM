<script setup>
// 맨 위로 이동 버튼: 400px 이상 스크롤했을 때만 노출되고, 클릭 시
// 부드럽게 페이지 최상단으로 이동한다.
import { ref, onMounted, onUnmounted } from "vue";

const isVisible = ref(false);

function updateVisibility() {
  isVisible.value = window.scrollY > 400;
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

onMounted(() => window.addEventListener("scroll", updateVisibility, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", updateVisibility));
</script>

<template>
  <button
    type="button"
    class="backToTop"
    :class="{ isVisible }"
    aria-label="맨 위로 이동"
    @click="scrollToTop"
  >&uarr;</button>
</template>
