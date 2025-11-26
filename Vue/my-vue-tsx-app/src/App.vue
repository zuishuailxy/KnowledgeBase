<script setup lang="ts">
import { ref } from 'vue';
import HelloWorld from './components/HelloWorld.tsx'
import MyButton from './components/MyButton.tsx';
import MyInput from './components/MyInput.tsx';
import UserList from './components/UserList.tsx';

const handleClick =  () => {
  console.log(123)
}
const username = ref('')
</script>

<template>
  <HelloWorld msg="Leo" />
  <MyButton @click="handleClick" type="primary"/>
  <MyInput v-model="username"/>
  <UserList />
</template>

<style scoped></style>
