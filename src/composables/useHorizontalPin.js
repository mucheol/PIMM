import { ref, onMounted, onUnmounted, nextTick } from "vue";

export function useHorizontalPin(mobileBreakpoint = 768) {
  const sectionRef = ref(null);
  const trackRef = ref(null);
  const sectionHeight = ref("100vh");
  const progress = ref(0);

  function isMobile() {
    return window.innerWidth <= mobileBreakpoint;
  }

  function maxTranslate() {
    const track = trackRef.value;
    if (!track) return 0;
    return track.scrollWidth / 2;
  }

  function syncHeight() {
    sectionHeight.value = isMobile() ? "auto" : `${window.innerHeight + maxTranslate()}px`;
  }

  function updateTrack() {
    const section = sectionRef.value;
    const track = trackRef.value;
    if (!section || !track || isMobile()) {
      progress.value = isMobile() ? 1 : 0;
      return;
    }

    const rect = section.getBoundingClientRect();
    const scrollable = rect.height - window.innerHeight;
    progress.value = scrollable > 0 ? Math.min(Math.max(-rect.top / scrollable, 0), 1) : 0;
  }

  function onScroll() {
    updateTrack();
  }
  function onResize() {
    syncHeight();
    updateTrack();
  }

  function resync() {
    syncHeight();
    updateTrack();
  }

  onMounted(async () => {
    await nextTick();
    resync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
  });
  onUnmounted(() => {
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
  });

  return { sectionRef, trackRef, sectionHeight, progress, resync };
}
