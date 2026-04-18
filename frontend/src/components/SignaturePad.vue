<template>
  <div class="signature-pad card">
    <h3>✍️ 簽名區</h3>
    <p class="hint" v-if="hasContract">請在下方空白區域簽名</p>
    <p class="hint disabled" v-else>請先產生契約後再進行簽名</p>
    <canvas
      ref="canvasRef"
      :class="['signature-canvas', { disabled: !hasContract }]"
      width="500"
      height="200"
      @mousedown="handleStart"
      @mousemove="handleMove"
      @mouseup="handleEnd"
      @mouseleave="handleEnd"
      @touchstart.prevent="handleStart"
      @touchmove.prevent="handleMove"
      @touchend.prevent="handleEnd"
    ></canvas>
    <div v-if="warning" class="warning-message">{{ warning }}</div>
    <div class="actions">
      <button type="button" class="secondary" data-test="clear-button" @click="clear">🧹 清除</button>
      <button
        type="button"
        data-test="confirm-button"
        :disabled="!hasContract"
        @click="confirm"
      >
        ✓ 確認簽名
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  hasContract: { type: Boolean, default: false },
})

const emit = defineEmits(['confirm'])

const canvasRef = ref(null)
const warning = ref('')
let ctx = null
let drawing = false
let hasStrokes = false

onMounted(() => {
  if (canvasRef.value && canvasRef.value.getContext) {
    ctx = canvasRef.value.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'
    }
  }
})

function getPoint(event) {
  const rect = canvasRef.value.getBoundingClientRect()
  const source = event.touches ? event.touches[0] : event
  return {
    x: source.clientX - rect.left,
    y: source.clientY - rect.top,
  }
}

function handleStart(event) {
  if (!props.hasContract || !ctx) return
  drawing = true
  const { x, y } = getPoint(event)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function handleMove(event) {
  if (!drawing || !ctx) return
  const { x, y } = getPoint(event)
  ctx.lineTo(x, y)
  ctx.stroke()
  hasStrokes = true
}

function handleEnd() {
  drawing = false
}

function clear() {
  if (ctx && canvasRef.value) {
    ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  }
  hasStrokes = false
  warning.value = ''
}

function confirm() {
  if (!hasStrokes) {
    warning.value = '請先簽名後再確認'
    return
  }
  const dataUrl = canvasRef.value.toDataURL('image/png')
  warning.value = ''
  emit('confirm', dataUrl)
}
</script>

<style scoped>
.signature-pad h3 { margin-bottom: 4px; }
.hint {
  font-size: var(--fs-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--sp-3);
}
.hint.disabled { color: var(--color-warning); }

.signature-canvas {
  display: block;
  width: 100%;
  max-width: 500px;
  height: 200px;
  border: 2px dashed var(--color-border-strong);
  background: repeating-linear-gradient(
    0deg,
    #fff 0,
    #fff 39px,
    var(--color-pink-50) 39px,
    var(--color-pink-50) 40px
  );
  border-radius: var(--radius-md);
  cursor: crosshair;
  transition: border-color var(--transition);
}
.signature-canvas:hover:not(.disabled) { border-color: var(--color-primary); }
.signature-canvas.disabled {
  background: repeating-linear-gradient(
    45deg, #f5f5f5 0, #f5f5f5 8px, #fff 8px, #fff 16px
  );
  cursor: not-allowed;
  opacity: 0.6;
}

.actions {
  margin-top: var(--sp-3);
  display: flex;
  gap: var(--sp-3);
}
</style>
