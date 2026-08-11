<script setup>
import { onMounted, onUnmounted } from "vue";

function setScrollLock(locked) {
  document.documentElement.classList.toggle("isScrollLocked", locked);
  document.body.classList.toggle("isScrollLocked", locked);
}

function finish(event) {
  if (event.target === event.currentTarget && event.animationName === "introCurtain") {
    setScrollLock(false);
  }
}

onMounted(() => {
  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) setScrollLock(true);
});

onUnmounted(() => setScrollLock(false));
</script>

<template>
  <div class="introLoader" aria-hidden="true" @animationend="finish">
    <span class="introLoaderLabel">CROSSFIT PIMM</span>
    <strong>PIMM</strong>
    <span class="introLoaderCount">100%</span>
  </div>
</template>
