<!-- Counter.vue -->
<script setup lang="ts">
const modelValue = defineModel<number>({ required: true });

const increment = () => modelValue.value++;
const decrement = () => modelValue.value--;
const reset = () => (modelValue.value = 0);
</script>

<template>
  <div class="counter-container">
    <div class="counter-display">
      <span>{{ modelValue }}</span>
    </div>

    <div class="counter-controls">
      <button @click="decrement">-</button>
      <button @click="reset">重置</button>
      <button @click="increment">+</button>
    </div>
  </div>
</template>

<style>
.counter-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid #e1e1e1;
  border-radius: 10px;
  background-color: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.counter-display {
  font-size: 3rem;
  font-weight: bold;
  color: #3498db;
  min-width: 100px;
  text-align: center;
  padding: 0.5rem;
  border: 2px solid #3498db;
  border-radius: 8px;
}

.counter-controls {
  display: flex;
  gap: 0.5rem;
}

.counter-controls button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.counter-controls button:first-child {
  background-color: #e74c3c;
  color: white;
}

.counter-controls button:first-child:hover {
  background-color: #c0392b;
}

.counter-controls button:nth-child(2) {
  background-color: #95a5a6;
  color: white;
}

.counter-controls button:nth-child(2):hover {
  background-color: #7f8c8d;
}

.counter-controls button:last-child {
  background-color: #2ecc71;
  color: white;
}

.counter-controls button:last-child:hover {
  background-color: #27ae60;
}
</style>
