<script setup>
import { watch, nextTick } from "vue";
import { useHorizontalPin } from "../composables/useHorizontalPin";
import { useInstagramFeed } from "../composables/useInstagramFeed";

const { sectionRef, trackRef, sectionHeight, resync } = useHorizontalPin();
const { photos, loading, error } = useInstagramFeed();

const placeholderCount = 6;

watch(photos, async () => {
  await nextTick();
  resync();
});
</script>

<template>
  <section class="idxGallery" ref="sectionRef" :style="{ height: sectionHeight }">
    <div class="idxGallerySticky">
      <div class="contentWrap">
        <div class="idxSecTit" v-reveal>
          <span class="idxSecEyebrow">GALLERY</span>
          <h2>핌 운동사진</h2>
          <p>회원들과 함께한 순간들을 만나보세요.</p>
        </div>
      </div>
      <div class="idxGalleryTrack" ref="trackRef">
        <template v-if="photos.length">
          <a
            v-for="photo in photos"
            :key="photo.id"
            :href="photo.permalink"
            target="_blank"
            rel="noopener noreferrer"
            class="idxGallerySlide isPhoto"
          >
            <img :src="photo.media_url" :alt="photo.caption || '크로스핏 핌 운동사진'" loading="lazy">
          </a>
        </template>
        <template v-else>
          <figure v-for="n in placeholderCount" :key="n" class="idxGallerySlide">
            <span class="idxGalleryIcon" aria-hidden="true">▤</span>
            <figcaption v-if="!loading && error">인스타그램 연동 준비 중입니다</figcaption>
            <figcaption v-else-if="!loading">TODO: 실제 운동사진 미수령</figcaption>
            <figcaption v-else>불러오는 중…</figcaption>
          </figure>
        </template>
      </div>
    </div>
  </section>
</template>
