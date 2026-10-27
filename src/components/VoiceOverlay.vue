<template>
  <div class="overlay">
    <div class="panel">
      <!-- Language toggle -->
      <div class="lang-row">
        <span class="label">{{ t('language') }}</span>
        <div class="toggle-group">
          <button
            :class="['toggle-btn', { active: lang === 'en' }]"
            @click="lang = 'en'"
          >
            🇬🇧 English
          </button>
          <button
            :class="['toggle-btn', { active: lang === 'ko' }]"
            @click="lang = 'ko'"
          >
            🇰🇷 한국어
          </button>
        </div>
      </div>

      <!-- Start button -->
      <button class="start-btn" @click="onStart">
        <span class="start-icon">▶</span>
        <span class="start-text">{{ t('start') }}</span>
      </button>

      <!-- Status -->
      <p v-if="status" class="status">{{ status }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const lang = ref('en')
const status = ref('')

const messages = {
  en: {
    language: 'Language',
    start: 'Start',
    running: 'Process running…',
  },
  ko: {
    language: '언어',
    start: '시작',
    running: '프로세스 실행 중…',
  },
}

const t = (key) => messages[lang.value][key]

function onStart() {
  status.value = lang.value === 'ko' ? '프로세스 실행 중…' : 'Process running…'
  // TODO: trigger the actual process / voice flow
  console.log('Start clicked – language:', lang.value)

  setTimeout(() => {
    status.value = ''
  }, 3000)
}
</script>

<style scoped>
.overlay {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  -webkit-app-region: no-drag;
}

.panel {
  background: rgba(20, 20, 30, 0.92);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  padding: 22px 24px;
  margin: 0 12px 12px 0;
  width: 320px;
  display: flex;
  flex-direction: column;
  gap: 18px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35);
}

/* Language row */
.lang-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.label {
  color: rgba(255, 255, 255, 0.65);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
}

.toggle-group {
  display: flex;
  gap: 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 3px;
}

.toggle-btn {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.5);
  padding: 6px 13px;
  border-radius: 8px;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.toggle-btn:hover {
  color: rgba(255, 255, 255, 0.8);
}

.toggle-btn.active {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-weight: 600;
}

/* Start button */
.start-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px 0;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
  -webkit-app-region: no-drag;
}

.start-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 22px rgba(99, 102, 241, 0.5);
}

.start-btn:active {
  transform: scale(0.97);
}

.start-icon {
  font-size: 18px;
}

.start-text {
  letter-spacing: 0.4px;
}

/* Status */
.status {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin: 0;
}
</style>