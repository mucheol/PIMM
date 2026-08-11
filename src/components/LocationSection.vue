<script setup>
import { ref, onMounted } from "vue";

const ADDRESS = "서울시 은평구 진흥로 21";
const mapReady = ref(false);
const mapFailed = ref(false);

function loadKakaoSdk(appkey) {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve(window.kakao);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appkey}&autoload=false&libraries=services`;
    script.onload = () => window.kakao.maps.load(() => resolve(window.kakao));
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

onMounted(async () => {
  const appkey = import.meta.env.VITE_KAKAO_MAP_KEY;
  if (!appkey) {
    console.error("[카카오맵] VITE_KAKAO_MAP_KEY가 설정되지 않았습니다. .env(로컬) 또는 배포 플랫폼의 환경변수를 확인하세요.");
    mapFailed.value = true;
    return;
  }

  try {
    const kakao = await loadKakaoSdk(appkey);
    const geocoder = new kakao.maps.services.Geocoder();

    geocoder.addressSearch(ADDRESS, (result, status) => {
      if (status !== kakao.maps.services.Status.OK) {
        console.error(`[카카오맵] 주소 검색 실패 (status: ${status}). 주소 문자열 또는 카카오 콘솔의 도메인/서비스 활성화 상태를 확인하세요.`);
        mapFailed.value = true;
        return;
      }

      const center = new kakao.maps.LatLng(result[0].y, result[0].x);
      const map = new kakao.maps.Map(document.getElementById("kakaoMap"), {
        center,
        level: 3,
      });
      new kakao.maps.Marker({ position: center, map });
      mapReady.value = true;
    });
  } catch (err) {
    console.error("[카카오맵] SDK 로드 실패. 카카오 개발자 콘솔에 현재 도메인이 정확히(프로토콜/포트 포함) 등록됐는지 확인하세요.", err);
    mapFailed.value = true;
  }
});
</script>

<template>
  <section class="idxLocation">
    <div class="contentWrap idxLocationGrid">
      <div id="kakaoMap" class="idxLocationMap" role="img" aria-label="크로스핏 핌 위치 지도">
        <div
          v-if="mapFailed"
          class="idxLocationMapFallback"
          style="background-image:url('/images/location.jpg');"
        ></div>
      </div>
      <!-- 카카오맵 연동. 도메인 미등록/키 누락 시 안내 이미지로 대체 -->
      <dl class="idxLocationInfo">
        <dt>주소</dt>
        <dd>서울시 은평구 진흥로 21 다인빌딩 지하1층 (응암역 3번 출구에서 195m)</dd>
        <dt>영업시간</dt>
        <dd>월–금·토 10:00 – 23:00 &nbsp;|&nbsp; 일요일 휴무</dd>
        <dt>문의</dt>
        <dd>010-0000-0000</dd>
        <a href="/location" class="idxHeroBtn isGhost" style="color:var(--ink); border-color:var(--accent-gold);">오시는길 자세히 보기</a>
      </dl>
    </div>
  </section>
</template>
