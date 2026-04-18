<template>
  <div class="backup-page card">
    <div class="header">
      <div>
        <h2>💾 備份管理</h2>
        <p class="subtitle">定期備份資料，確保重要紀錄不會遺失</p>
      </div>
      <button
        type="button"
        data-test="backup-button"
        :disabled="running"
        @click="doBackup"
      >
        {{ running ? '⏳ 備份中...' : '✨ 建立備份' }}
      </button>
    </div>

    <p v-if="errorMessage" class="error-message api-error">{{ errorMessage }}</p>
    <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

    <div class="list">
      <h3>📦 備份列表</h3>
      <div v-if="!backups.length" class="empty">
        <span class="empty-icon">🐾</span>
        <p>尚無備份檔案</p>
      </div>
      <ul v-else>
        <li v-for="b in backups" :key="b.id || b.filename">
          <span class="file-icon" aria-hidden="true">📄</span>
          <span class="filename">{{ b.filename }}</span>
          <span class="meta">{{ b.createdAt }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as backupApi from '@/api/backup.api.js'

const backups = ref([])
const running = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function loadBackups() {
  try {
    backups.value = await backupApi.getAll()
  } catch (e) {
    errorMessage.value = e.message
  }
}

async function doBackup() {
  successMessage.value = ''
  errorMessage.value = ''
  running.value = true
  try {
    await backupApi.create()
    await loadBackups()
    successMessage.value = '備份成功'
  } catch (e) {
    errorMessage.value = e.message
  } finally {
    running.value = false
  }
}

onMounted(loadBackups)
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--sp-4);
  margin-bottom: var(--sp-5);
  flex-wrap: wrap;
}
.subtitle { color: var(--color-text-muted); font-size: var(--fs-sm); margin: 0; }

.list h3 { margin-bottom: var(--sp-3); }

.empty { text-align: center; padding: var(--sp-8); color: var(--color-text-muted); }
.empty-icon { font-size: 48px; display: block; margin-bottom: var(--sp-3); }

.list ul { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.list li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--sp-3);
  align-items: center;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: #fff;
  transition: all var(--transition);
}
.list li:hover {
  border-color: var(--color-primary);
  background-color: var(--color-pink-50);
}

.file-icon { font-size: 22px; }
.filename { font-weight: 600; color: var(--color-brown-700); }
.meta { color: var(--color-text-muted); font-size: var(--fs-sm); }
</style>
