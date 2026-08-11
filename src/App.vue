<script setup>
import TheHeader from "./components/TheHeader.vue";
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
  <a href="#content" class="skipNav">본문 바로가기</a>
  <ScrollProgress />
  <TheHeader />
  <DogCursor />
  <div class="pageOutWrap idxHome">
    <main id="content">
      <HeroSection />
      <WodSection />
      <GallerySection />
      <LocationSection v-reveal />
      <CtaSection v-reveal />
    </main>
  </div>
  <TheFooter />
  <BackToTop />
</template>
