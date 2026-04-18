<template>
  <div class="home-page">
    <section class="hero card">
      <div class="hero-text">
        <h1>歡迎回來 🐾</h1>
        <p class="hero-sub">今天也要把毛孩子打理得漂漂亮亮喔！</p>
        <div class="hero-actions">
          <router-link to="/calendar" class="btn">查看今日預約</router-link>
          <router-link to="/owners" class="btn secondary">新增飼主</router-link>
        </div>
      </div>
      <div class="hero-decor" aria-hidden="true">
        <span class="emoji">🐶</span>
        <span class="emoji">🐱</span>
        <span class="emoji">🦴</span>
        <span class="emoji">🎀</span>
      </div>
    </section>

    <section class="menu-grid">
      <router-link to="/owners" class="menu-card card accent-pink">
        <span class="menu-icon">👥</span>
        <h3>飼主管理</h3>
        <p>新增、搜尋、編輯飼主與寵物資料</p>
      </router-link>
      <router-link to="/calendar" class="menu-card card accent-peach">
        <span class="menu-icon">📅</span>
        <h3>預約日曆</h3>
        <p>月 / 週 / 日檢視，新增與管理預約</p>
      </router-link>
      <router-link to="/customer-form" class="menu-card card accent-cream">
        <span class="menu-icon">📝</span>
        <h3>客戶填寫</h3>
        <p>現場交給客戶填寫自身與寵物資料</p>
      </router-link>
      <router-link to="/backup" class="menu-card card accent-lavender">
        <span class="menu-icon">💾</span>
        <h3>備份管理</h3>
        <p>建立備份與還原資料</p>
      </router-link>
    </section>
  </div>
</template>

<script setup>
</script>

<style scoped>
.home-page { display: flex; flex-direction: column; gap: var(--sp-6); }

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--sp-8);
  background: linear-gradient(120deg, #FFF5F8, #FFE4EC 70%, #FFD7C2);
  border: 1px solid var(--color-border);
  overflow: hidden;
  position: relative;
}
.hero-text h1 { font-size: var(--fs-4xl); }
.hero-sub { color: var(--color-text-muted); font-size: var(--fs-lg); margin-bottom: var(--sp-5); }
.hero-actions { display: flex; gap: var(--sp-3); flex-wrap: wrap; }

.hero-decor {
  display: flex;
  gap: var(--sp-4);
  font-size: 40px;
  opacity: 0.85;
}
.hero-decor .emoji { animation: float 3s ease-in-out infinite; }
.hero-decor .emoji:nth-child(2) { animation-delay: .4s; }
.hero-decor .emoji:nth-child(3) { animation-delay: .8s; }
.hero-decor .emoji:nth-child(4) { animation-delay: 1.2s; }

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-6px); }
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--sp-5);
}

.menu-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: var(--sp-6);
  text-decoration: none;
  color: var(--color-text);
  transition: transform var(--transition), box-shadow var(--transition);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}
.menu-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}
.menu-card h3 { margin: 0; color: var(--color-brown-700); }
.menu-card p  { margin: 0; color: var(--color-text-muted); font-size: var(--fs-sm); }

.menu-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px; height: 52px;
  font-size: 28px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
}

.accent-pink    { background: linear-gradient(160deg, #FFF5F8, #FFD9E5 100%); }
.accent-peach   { background: linear-gradient(160deg, #FFF9F3, #FFD9C4 100%); }
.accent-cream   { background: linear-gradient(160deg, #FFFBEF, #FCE6C8 100%); }
.accent-lavender{ background: linear-gradient(160deg, #FAF4FB, #E7D4F0 100%); }

@media (max-width: 700px) {
  .hero { flex-direction: column; text-align: center; }
  .hero-actions { justify-content: center; }
  .hero-decor { font-size: 32px; }
}
</style>
