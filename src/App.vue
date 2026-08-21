<script setup>
// 앱 루트: 헤더/푸터 등 전역 UI와 인트로 로더·커서 연출을 배치하고,
// main 안에 섹션들을 스크롤 순서대로 나열한다. 실제 각 섹션의 동작은
// 해당 컴포넌트 파일 참고.
import TheHeader from "./components/TheHeader.vue";
import IntroLoader from "./components/IntroLoader.vue";
import DogCursor from "./components/DogCursor.vue";
import ScrollProgress from "./components/ScrollProgress.vue";
import BackToTop from "./components/BackToTop.vue";
import HeroSection from "./components/HeroSection.vue";
import WodSection from "./components/WodSection.vue";
import GallerySection from "./components/GallerySection.vue";
import LocationSection from "./components/LocationSection.vue";
import CtaSection from "./components/CtaSection.vue";
import TheFooter from "./components/TheFooter.vue";
</script>

<template>
  <!-- 키보드/스크린리더 사용자가 헤더 내비게이션을 건너뛰고 바로 본문으로 이동할 수 있는 링크 -->
  <a href="#content" class="skipNav">본문 바로가기</a>
  <IntroLoader />
  <ScrollProgress />
  <TheHeader />
  <DogCursor />
  <div class="pageOutWrap idxHome">
    <main id="content">
      <HeroSection />
      <WodSection />
      <GallerySection />
      <LocationSection v-reveal />
      <CtaSection />
    </main>
  </div>
  <TheFooter />
  <BackToTop />
</template>
