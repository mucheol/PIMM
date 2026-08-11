<script setup>
import { computed, watch, nextTick } from "vue";
import { useHorizontalPin } from "../composables/useHorizontalPin";
import { useInstagramFeed } from "../composables/useInstagramFeed";

const { sectionRef, trackRef, sectionHeight, progress, resync } = useHorizontalPin();
const { photos, loading, error } = useInstagramFeed();

const placeholderCount = 6;
const galleryItems = computed(() => photos.value.length
  ? photos.value
  : Array.from({ length: placeholderCount }, (_, i) => ({ id: `placeholder-${i}`, placeholder: true }))
);

function setTrackRef(el) {
  if (el) trackRef.value = el;
}

watch(photos, async () => {
  await nextTick();
  resync();
});
</script>

<template>
  <section class="idxGallery" ref="sectionRef" :style="{ height: sectionHeight, '--galleryProgress': `${progress * 100}%` }">
    <div class="idxGallerySticky">
      <div class="idxGalleryHeadline">
        <span>GALLERY · SCROLL TO EXPLORE</span>
        <h2>PIMM GALLERY</h2>
      </div>
      <div class="idxGalleryRows">
        <div v-for="row in 2" :key="row" class="idxGalleryRow">
          <div class="idxGalleryTrack" :class="{ isReverse: row === 2 }" :ref="row === 1 ? setTrackRef : undefined">
            <template v-for="loop in 2" :key="loop">
              <template v-for="item in galleryItems" :key="`${row}-${loop}-${item.id}`">
                <a v-if="!item.placeholder" :href="item.permalink" target="_blank" rel="noopener noreferrer" class="idxGallerySlide isPhoto">
                  <img :src="item.media_url" :alt="item.caption || '크로스핏 핌 운동사진'" loading="lazy">
                </a>
                <figure v-else class="idxGallerySlide">
                  <span class="idxGalleryIcon" aria-hidden="true">▤</span>
                  <figcaption v-if="!loading && error">인스타그램 연동 준비 중입니다</figcaption>
                  <figcaption v-else-if="!loading">TODO: 실제 운동사진 미수령</figcaption>
                  <figcaption v-else>불러오는 중…</figcaption>
                </figure>
              </template>
            </template>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
