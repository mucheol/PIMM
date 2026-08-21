<script setup>
// 사이트 푸터: 저작권 연도는 하드코딩하지 않고 현재 연도를 계산해 표시한다.
const year = new Date().getFullYear();
</script>

<template>
  <footer class="cl_footer">
    <div class="contentWrap">
      <div class="cl_footerTop">
        <span class="cl_logo">CROSSFIT PIMM</span>
        <address>
          서울시 은평구 진흥로 21 다인빌딩 지하1층<br>
          010-0000-0000
        </address>
      </div>
      <p class="cl_copyright">&copy; {{ year }} CrossFit PIMM. All rights reserved.</p>
    </div>
  </footer>
</template>
