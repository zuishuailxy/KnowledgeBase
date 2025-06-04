<template>
  <div>
    <h1>Cards</h1>
    <p>Brand: {{ card.brand }}</p>
    <p>Price: {{ card.price }}</p>
    <Card v-bind="card" @add-price="addPrice" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Card from './Card.vue';
const card = ref({
  brand: 'Vue',
  price: 1000
});

const addPrice = () => {
  card.value.price += 100;
}
</script>



<style scoped>

</style>