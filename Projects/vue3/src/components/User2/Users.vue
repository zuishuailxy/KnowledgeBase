<template>
  <div>
    <h1>Parent Data: {{ user.age }}</h1>
    <User v-model="user" />
  </div>
</template>

<script setup lang="ts">
import User from './User2.vue';
import { ref } from 'vue';
// 父组件绑定 v-model 到子组件的 modelValue
const user = ref({
  name: 'John Doe',
  age: 30,
  email: 'john.doe@example.com'
});

</script>

<style scoped>

</style>