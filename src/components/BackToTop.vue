<script setup>
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
