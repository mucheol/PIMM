<!-- 커뮤니티 메뉴 4종(자유게시판/Q&A/수업사진/공지) 바로가기 카드 그리드.
     v-reveal은 스크롤 시 순차적으로 나타나는 등장 애니메이션 디렉티브(directives/reveal.js 참고) -->
<template>
  <section class="idxCommunity">
    <div class="contentWrap">
      <div class="idxSecTit" v-reveal>
        <span class="idxSecEyebrow">COMMUNITY</span>
        <h2>핌 커뮤니티</h2>
      </div>
      <div class="idxCommunityGrid">
        <div class="idxCommunityCell" v-reveal>
          <a href="/board" class="idxCommunityBox">
            <span class="idxCommunityIcon" aria-hidden="true">✎</span>
            <h3>자유게시판</h3>
            <p>회원들의 이야기 공간</p>
          </a>
        </div>
        <div class="idxCommunityCell" v-reveal>
          <a href="/qna" class="idxCommunityBox">
            <span class="idxCommunityIcon" aria-hidden="true">?</span>
            <h3>Q&amp;A 게시판</h3>
            <p>궁금한 점을 물어보세요</p>
          </a>
        </div>
        <div class="idxCommunityCell" v-reveal>
          <a href="/gallery" class="idxCommunityBox">
            <span class="idxCommunityIcon" aria-hidden="true">▣</span>
            <h3>수업사진</h3>
            <p>함께한 순간들</p>
          </a>
        </div>
        <div class="idxCommunityCell" v-reveal>
          <a href="/notice" class="idxCommunityBox">
            <span class="idxCommunityIcon" aria-hidden="true">!</span>
            <h3>공지사항</h3>
            <p>박스 소식 안내</p>
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
