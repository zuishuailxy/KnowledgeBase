<!-- ParentComponent.vue -->
<script setup lang="ts">
import { ref, defineAsyncComponent, shallowRef } from 'vue'
// import Counter from './Counter.vue'

const count = ref(5)
const asyncCounter = shallowRef(null)


const loadFn = () => {
  asyncCounter.value = defineAsyncComponent({
    loader: () => import('./Counter.vue'),
    loadingComponent: {
      template: '<div>Loading Counter...</div>'
    },
    delay: 2000,
    timeout: 100,
    suspensible: true,
  })
}

const handleClick = () => {
  if (!asyncCounter.value) {
    loadFn()
  }
}
</script>

<template>
  <div class="parent-container">
    <h1>Vue 3 defineModel 双向绑定示例</h1>

    <div class="counter-wrapper" v-if="asyncCounter">
      <asyncCounter v-model="count" />
    </div>
    <!-- <Suspense>
      <template #default class="counter-wrapper">
        <asyncCounter v-model="count" />
      </template>
      <template #fallback>
        <div>Loading...</div>
      </template>
    </Suspense> -->
    <button @click="handleClick">加载计数器</button>
    <div class="info-panel">
      <p>当前值: <strong>{{ count }}</strong></p>
      <p>值的平方: <strong>{{ count * count }}</strong></p>
    </div>
    
    <div class="actions">
      <button @click="count = 10">设置为 10</button>
      <button @click="count = count + 5">增加 5</button>
    </div>
  </div>
</template>

<style>
.parent-container {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
}

.counter-wrapper {
  display: flex;
  justify-content: center;
  margin: 2rem 0;
}

.info-panel {
  text-align: center;
  margin: 1.5rem 0;
  padding: 1rem;
  background-color: #eaf6ff;
  border-radius: 8px;
}

.info-panel p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.actions button {
  padding: 0.75rem 1.5rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.actions button:hover {
  background-color: #2980b9;
}
</style>