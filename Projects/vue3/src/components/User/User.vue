<template>
  <div>
    <h1>User</h1>
    <p>Name: {{ modelValue.name }}</p>
    <p>Age: {{ modelValue.age }}</p>
    <p>Email: {{ modelValue.email }}</p>
    <input type="number" v-model="userAge" max="99"></input>
    <button @click="increaseAge">Increase Age</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
// 父组件传入modalValue，子组件通过v-model双向绑定
const props = defineProps<{
  modelValue: {
    name: string;
    age: number;
    email: string;
  };
}>();
const emits = defineEmits<{
  (e: 'update:modelValue', value: { name: string; age: number; email: string }): void;
}>();
const increaseAge = () => {
  const newValue = { ...props.modelValue, age: props.modelValue.age + 1 };
  emits('update:modelValue', newValue);
};

// 可以通过computed 来简化
const userAge = computed({
  get() {
    return props.modelValue.age;
  },
  set(value) {
    emits('update:modelValue', { ...props.modelValue, age: value });
  }
});

</script>

<style scoped>

</style>