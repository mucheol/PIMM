import { ref, onMounted } from "vue";

// public/images/gallery/manifest.json에 나열된 로컬 사진 목록을 불러오는 컴포저블.
// GallerySection이 우선적으로 사용하는 사진 소스이며, 목록이 비어있으면
// useInstagramFeed로 대체된다.
export function useGalleryPhotos() {
  const photos = ref([]);
  const loading = ref(true);

  onMounted(async () => {
    try {
      const response = await fetch("/images/gallery/manifest.json");
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const files = await response.json();
      photos.value = files.map((url) => ({ id: url, media_url: url }));
    } catch {
      // manifest가 없거나 폴더가 비어있는 경우 조용히 빈 배열로 처리해
      // 호출부(GallerySection)가 자동으로 인스타그램 피드로 넘어가게 한다
      photos.value = [];
    } finally {
      loading.value = false;
    }
  });

  return { photos, loading };
}
