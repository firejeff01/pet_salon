<template>
  <div id="app" class="app-shell">
    <header class="app-header">
      <router-link to="/" class="brand">
        <span class="brand-mark" aria-hidden="true">🐾</span>
        <span class="brand-text">
          <span class="brand-name">貳寶寵物美容工坊</span>
          <span class="brand-tag">犬貓美容定型化契約系統</span>
        </span>
      </router-link>

      <nav class="main-nav">
        <router-link to="/" exact-active-class="active">首頁</router-link>
        <router-link to="/owners" active-class="active">飼主管理</router-link>
        <router-link to="/calendar" active-class="active">預約日曆</router-link>
        <router-link to="/customer-form" active-class="active">客戶填寫</router-link>
        <router-link to="/backup" active-class="active">備份管理</router-link>
      </nav>
    </header>

    <main class="app-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>

    <footer class="app-footer">
      <span>© 貳寶寵物美容工坊</span>
      <span class="paw">🐶🐱</span>
    </footer>
  </div>
</template>

<script setup>
</script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.app-header {
  display: flex;
  align-items: center;
  gap: var(--sp-8);
  padding: var(--sp-4) var(--sp-8);
  background: linear-gradient(100deg, #FFF5F8 0%, #FFE7EE 60%, #FFDFD0 100%);
  border-bottom: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 20;
  backdrop-filter: saturate(150%) blur(8px);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  color: var(--color-brown-700);
}
.brand:hover { color: var(--color-brown-700); }

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px; height: 44px;
  background: linear-gradient(135deg, #FFB6CC, #FF8FB0);
  color: #fff;
  border-radius: var(--radius-pill);
  font-size: 22px;
  box-shadow: var(--shadow-md);
}

.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-name {
  font-family: var(--font-display);
  font-weight: 700;
  font-size: var(--fs-xl);
  color: var(--color-brown-700);
}
.brand-tag {
  font-size: var(--fs-xs);
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
}

.main-nav {
  display: flex;
  gap: 6px;
  align-items: center;
}

.main-nav a {
  padding: 8px 16px;
  border-radius: var(--radius-pill);
  color: var(--color-brown-700);
  font-weight: 600;
  font-size: var(--fs-md);
  transition: background-color var(--transition), color var(--transition);
}
.main-nav a:hover {
  background-color: rgba(255, 255, 255, 0.6);
  color: var(--color-primary);
}
.main-nav a.active {
  background-color: var(--color-primary);
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.app-main {
  flex: 1;
  padding: var(--sp-6) var(--sp-8);
  max-width: 1280px;
  width: 100%;
  margin: 0 auto;
}

.app-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--sp-4) var(--sp-8);
  font-size: var(--fs-sm);
  color: var(--color-text-muted);
  border-top: 1px solid var(--color-border);
  background-color: rgba(255, 245, 248, 0.5);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}
.fade-enter-from { opacity: 0; transform: translateY(6px); }
.fade-leave-to   { opacity: 0; transform: translateY(-6px); }

@media (max-width: 900px) {
  .app-header { flex-direction: column; gap: var(--sp-3); padding: var(--sp-3); }
  .app-main   { padding: var(--sp-4); }
  .brand-tag  { display: none; }
}
</style>
