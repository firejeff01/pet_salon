<template>
  <div class="owner-list card">
    <h2><span class="icon" aria-hidden="true">👥</span> 飼主列表</h2>
    <div class="search-box">
      <span class="search-icon" aria-hidden="true">🔍</span>
      <input
        data-test="search-input"
        v-model="keyword"
        @input="handleSearch"
        placeholder="搜尋飼主姓名 / 電話..."
        type="search"
      />
    </div>
    <div v-if="owners.length === 0" class="empty-message">
      <span class="empty-icon">🐾</span>
      <p>查無資料</p>
    </div>
    <div v-else class="list">
      <div
        v-for="owner in owners"
        :key="owner.id"
        data-test="owner-row"
        class="owner-row"
        @click="$emit('select', owner)"
      >
        <span class="avatar" aria-hidden="true">{{ (owner.name || '?').slice(0, 1) }}</span>
        <div class="info">
          <span class="owner-name">{{ owner.name }}</span>
          <span class="owner-phone">📞 {{ owner.phone }}</span>
        </div>
        <span class="owner-pets" v-if="(owner.pets || []).length">
          🐾 {{ (owner.pets || []).map(p => p.name).join('、') }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as ownerApi from '@/api/owner.api.js'

defineEmits(['select'])

const owners = ref([])
const keyword = ref('')

async function fetchOwners() {
  try {
    owners.value = await ownerApi.getAll()
  } catch (e) {
    console.error(e)
  }
}

async function handleSearch() {
  try {
    if (keyword.value) {
      owners.value = await ownerApi.search(keyword.value)
    } else {
      owners.value = await ownerApi.getAll()
    }
  } catch (e) {
    console.error(e)
  }
}

onMounted(fetchOwners)

defineExpose({ reload: fetchOwners })
</script>

<style scoped>
.owner-list h2 { display: flex; align-items: center; gap: 8px; }

.search-box {
  position: relative;
  margin-bottom: var(--sp-4);
}
.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  opacity: 0.6;
}
.search-box input { padding-left: 38px; }

.empty-message {
  text-align: center;
  padding: var(--sp-8);
  color: var(--color-text-muted);
}
.empty-icon { font-size: 48px; display: block; margin-bottom: var(--sp-3); }

.list { display: flex; flex-direction: column; gap: 8px; }

.owner-row {
  display: flex;
  align-items: center;
  gap: var(--sp-3);
  padding: 10px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background-color: #fff;
  cursor: pointer;
  transition: all var(--transition);
}
.owner-row:hover {
  border-color: var(--color-primary);
  background-color: var(--color-pink-50);
  transform: translateX(2px);
}

.avatar {
  flex: 0 0 auto;
  width: 36px; height: 36px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, #FFB6CC, #FF8FB0);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.owner-name { font-weight: 600; color: var(--color-brown-700); }
.owner-phone { font-size: var(--fs-sm); color: var(--color-text-muted); }
.owner-pets { font-size: var(--fs-sm); color: var(--color-primary); font-weight: 500; }
</style>
