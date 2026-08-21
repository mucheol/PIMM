import { ref, onMounted } from "vue";

// 인스타그램 피드 사진을 가져오는 컴포저블. 로컬 갤러리 폴더(useGalleryPhotos)가
// 비어있을 때 GallerySection의 대체(fallback) 사진 소스로 사용된다.
export function useInstagramFeed() {
  const photos = ref([]);
  const loading = ref(true);
  const error = ref(null);

  onMounted(async () => {
    try {
      const response = await fetch("/api/instagram-feed");
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      photos.value = await response.json();
    } catch (err) {
      error.value = err;
    } finally {
      loading.value = false;
    }
  });

  return { photos, loading, error };
}
