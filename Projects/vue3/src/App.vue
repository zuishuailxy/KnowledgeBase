<script setup lang="ts">
import Cards from './components/Card/Cards.vue';
// import Users from './components/User/Users.vue';
// import Users from './components/User2/Users.vue';
import UseCounter from './components/Counter/UseCounter.vue';

</script>

<template>
  <!-- <Cards /> -->
  <UseCounter />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
