<script setup lang="ts">
defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <div class="px-3 py-2">
    <div class="flex items-center" :class="{ 'justify-center': collapsed }">
      <div class="flex items-center gap-2">
        <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span class="text-primary-foreground font-bold text-sm">P</span>
        </div>
        <div v-if="!collapsed" class="flex flex-col">
          <span class="font-bold text-lg">PMIS</span>
          <span class="text-xs text-muted-foreground">Project Management</span>
        </div>
      </div>
    </div>
  </div>
</template>
