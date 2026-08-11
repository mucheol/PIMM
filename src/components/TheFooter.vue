<script setup>
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
