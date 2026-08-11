<script setup>
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
    <a href="/" class="cl_logo"><img src="/images/logo.png" alt="크로스핏 핌"></a>
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
      </ul>
    </nav>
    <a href="/apply" class="cl_headerCta">무료체험 신청</a>
    <button
      type="button"
      class="cl_gnbToggle"
      aria-label="메뉴 열기"
      :aria-expanded="isOpen"
      @click="toggleGnb"
    >MENU</button>
  </header>
</template>
