<script setup>
// 페이지 진입 시 잠깐 보여주는 "PIMM" 인트로 커튼 애니메이션.
// 애니메이션이 끝날 때까지 배경 스크롤을 잠가서, 커튼이 걷히기 전에
// 사용자가 스크롤로 콘텐츠를 미리 보는 것을 막는다.
import { onMounted, onUnmounted } from "vue";

function setScrollLock(locked) {
  document.documentElement.classList.toggle("isScrollLocked", locked);
  document.body.classList.toggle("isScrollLocked", locked);
}

// introCurtain 애니메이션이 자기 자신에서 끝났을 때만 스크롤 잠금 해제
// (event.target === currentTarget으로 자식 요소의 애니메이션 이벤트 버블링을 걸러낸다)
function finish(event) {
  if (event.target === event.currentTarget && event.animationName === "introCurtain") {
    setScrollLock(false);
  }
}

onMounted(() => {
  // 모션 최소화 설정 사용자에게는 스크롤을 잠그지 않는다(애니메이션 자체가 생략되므로)
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
