<template>
  <div>
    <h1>Card</h1>
    <p>Brand: {{ brand }}</p>
    <p>Price: {{ price }}</p>
    <button @click="$emit('add-price')">Add Price</button>
  </div>
</template>

<script setup lang="ts">
// 通过props 和 emits 定义组件的属性和事件
const props = defineProps<{
  brand: string;
  price: number;
}>();

const emits = defineEmits<{
  (e: 'add-price'): void;
}>();
</script>

<style scoped>

</style>