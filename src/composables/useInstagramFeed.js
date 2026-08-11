import { ref, onMounted } from "vue";

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
