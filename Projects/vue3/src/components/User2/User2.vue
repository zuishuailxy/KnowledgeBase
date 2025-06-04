<template>
  <div>
    <h1>User</h1>
    <p>Name: {{ user.name }}</p>
    <p>Age: {{ user.age }}</p>
    <p>Email: {{ user.email }}</p>
    <button @click="ageAdd">Increase Age</button>
  </div>
</template>

<script setup lang="ts">
// 通过defineModel声明父组件传递过来的数据，返回一个ref对象
const user = defineModel<{
  name: string;
  age: number;
  email: string;
}>({ required: true })  

// 子组件可以直接修改刚刚通过defineModel声明的数据，不需要通过emits，父组件会自动更新
const ageAdd = () => {
    user.value.age += 1
}
</script>

<style scoped>

</style>