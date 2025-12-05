<script setup lang="ts">
import { sub } from 'date-fns'
import type { Period, Range } from '~/types'

useHead({
  title: 'Home - Sozal',
  meta: [
    { name: 'description', content: 'Dashboard overview.' }
  ]
})

</script>

<template>
  <WaitingDefault />
</template>
