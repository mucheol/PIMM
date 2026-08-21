<!-- 오늘의 WOD 미리보기 + 크로스핏 핌 수업 시간표 섹션.
     v-reveal: 스크롤 진입 시 등장 애니메이션, v-tilt: 마우스 위치에 따른 카드 3D 기울임(directives 참고).
     WOD 상세 내용은 실제 데이터 연동 전이라 TODO 플레이스홀더로 표시 중. -->
<template>
  <section class="idxWod">
    <div class="contentWrap">
      <div class="idxSecTit">
        <span class="idxSecEyebrow" v-reveal>TODAY'S WOD</span>
        <h2 v-reveal>오늘의 운동</h2>
        <p v-reveal>매일 갱신되는 오늘의 WOD와 회원들의 운동기록을 확인하세요.</p>
      </div>
      <div class="idxWodGrid">
        <div class="idxWodCard" v-reveal v-tilt>
          <span class="idxWodDate" v-reveal>TODO: 오늘 날짜 자동 표기 필요</span>
          <h3 v-reveal>WOD 미리보기</h3>
          <ul v-reveal>
            <li>워밍업 — TODO: 실제 운동 데이터 미수령</li>
            <li>스트렝스 — TODO: 실제 운동 데이터 미수령</li>
            <li>메트콘(WOD) — TODO: 실제 운동 데이터 미수령</li>
          </ul>
          <a href="/wod" class="idxHeroBtn isGhost" v-reveal>오늘의 WOD 전체보기</a>
        </div>
        <div class="idxWodLogCard idxScheduleCard" v-reveal v-tilt>
          <h3 v-reveal>크로스핏 핌 시간표</h3>
          <div class="scheduleGroup" v-reveal>
            <h4>평일 (월–금)</h4>
            <ul class="scheduleList">
              <li><span class="scheduleTime">10:30–11:30</span><span class="scheduleBadge isClass">크로스핏 수업</span></li>
              <li><span class="scheduleTime">11:30–18:30</span><span class="scheduleBadge isOpen">오픈짐 · 코치 애슬릿 트레이닝</span></li>
              <li style="margin-top:30px;"><span class="scheduleTime">18:30–19:30</span><span class="scheduleBadge isClass">크로스핏 수업</span></li>
              <li><span class="scheduleTime">19:30–20:00</span><span class="scheduleBadge isOpen">쉬는시간 &amp; 개인운동</span></li>
              <li><span class="scheduleTime">20:00–21:00</span><span class="scheduleBadge isClass">크로스핏 수업</span></li>
              <li><span class="scheduleTime">21:00–21:30</span><span class="scheduleBadge isOpen">쉬는시간 &amp; 개인운동</span></li>
              <li><span class="scheduleTime">21:30–22:30</span><span class="scheduleBadge isClass">크로스핏 수업</span></li>
              <li><span class="scheduleTime">22:30–23:00</span><span class="scheduleBadge isOpen">개인 운동시간</span></li>
            </ul>
          </div>
          <div class="scheduleGroup" v-reveal>
            <h4>토요일</h4>
            <ul class="scheduleList">
              <li><span class="scheduleTime">10:00–12:00</span><span class="scheduleBadge isOpen">오픈짐</span></li>
              <li><span class="scheduleTime">13:00–22:00</span><span class="scheduleBadge isOpen">개인 운동시간</span></li>
            </ul>
          </div>
          <p class="scheduleHours" v-reveal>월–금·토 10:00 – 23:00 운영 &nbsp;|&nbsp; 일요일 휴무</p>
          <p class="scheduleCoach" v-reveal>담당 코치 : 이재준</p>
        </div>
      </div>
    </div>
  </section>
</template>
