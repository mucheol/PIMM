<script setup>
// 사이트 상단 헤더: 모바일 메뉴(GNB) 토글과, 스크롤 시 헤더 배경을
// 바꾸기 위한 스크롤 감지 상태를 관리한다.
import { ref, onMounted, onUnmounted } from "vue";

const isOpen = ref(false);
function toggleGnb() {
  isOpen.value = !isOpen.value;
}

const isScrolled = ref(false);
function updateScrolled() {
  isScrolled.value = window.scrollY > 10;
}
onMounted(() => window.addEventListener("scroll", updateScrolled, { passive: true }));
onUnmounted(() => window.removeEventListener("scroll", updateScrolled));
</script>

<template>
  <header class="cl_header" :class="{ isScrolled }">
    <a href="/" class="cl_logo"><img src="/images/logo.png" alt="크로스핏 핌"><span class="cl_logoLabel">CROSSFIT</span></a>
    <nav class="cl_gnb" :class="{ isOpen }" role="navigation" aria-label="주메뉴">
      <ul>
        <li>
          <a href="#">핌 소개</a>
          <ul class="cl_depth2">
            <li><a href="/location">오시는길</a></li>
            <li><a href="/facility">내부시설</a></li>
          </ul>
        </li>
        <li>
          <a href="#">프로그램</a>
          <ul class="cl_depth2">
            <li><a href="/wod">오늘의 WOD</a></li>
            <li><a href="/wodlog">오늘 운동기록</a></li>
            <li><a href="/schedule">수업시간표 및 회원권</a></li>
          </ul>
        </li>
        <li>
          <a href="#">커뮤니티</a>
          <ul class="cl_depth2">
            <li><a href="/board">자유게시판</a></li>
            <li><a href="/qna">Q&amp;A 게시판</a></li>
            <li><a href="/gallery">수업사진</a></li>
            <li><a href="/notice">공지사항</a></li>
          </ul>
        </li>
        <span class="cl_headerDivider" aria-hidden="true"></span>
        <a href="/apply" class="cl_headerCta">무료체험 & 드랍인 신청</a>
      </ul>
    </nav>
    <!-- 모바일 GNB 토글 버튼: aria-expanded로 스크린리더에 열림/닫힘 상태 전달 -->
    <button
      type="button"
      class="cl_gnbToggle"
      aria-label="메뉴 열기"
      :aria-expanded="isOpen"
      @click="toggleGnb"
    >MENU</button>
  </header>
</template>
