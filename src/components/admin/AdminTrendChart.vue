<template>
  <svg
    class="admin-trend-chart"
    :viewBox="`0 0 ${width} ${height}`"
    preserveAspectRatio="none"
    role="img"
    :aria-label="label"
  >
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" :stop-color="color" stop-opacity="0.24" />
        <stop offset="1" :stop-color="color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <path v-if="points.length > 1" :d="areaPath" :fill="`url(#${gradientId})`" />
    <path
      v-if="points.length > 1"
      :d="linePath"
      fill="none"
      :stroke="color"
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      vector-effect="non-scaling-stroke"
    />
    <circle
      v-for="(point, index) in points"
      :key="index"
      :cx="point.x"
      :cy="point.y"
      r="2.5"
      :fill="color"
      vector-effect="non-scaling-stroke"
    />
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    color?: string
    label: string
    width?: number
    height?: number
  }>(),
  {
    color: '#1769ef',
    width: 320,
    height: 96,
  }
)

const gradientId = `admin-chart-${Math.random().toString(36).slice(2)}`
const points = computed(() => {
  if (!props.values.length) return []
  const maximum = Math.max(...props.values, 1)
  const minimum = Math.min(...props.values, 0)
  const range = Math.max(maximum - minimum, 1)
  const horizontalPadding = 4
  const verticalPadding = 6
  const drawableWidth = props.width - horizontalPadding * 2
  const drawableHeight = props.height - verticalPadding * 2

  return props.values.map((value, index) => ({
    x:
      props.values.length === 1
        ? props.width / 2
        : horizontalPadding + (index / (props.values.length - 1)) * drawableWidth,
    y: verticalPadding + ((maximum - value) / range) * drawableHeight,
  }))
})
const linePath = computed(() =>
  points.value.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
)
const areaPath = computed(() => {
  if (!points.value.length) return ''
  const first = points.value[0]
  const last = points.value[points.value.length - 1]
  return `${linePath.value} L ${last.x} ${props.height} L ${first.x} ${props.height} Z`
})
</script>

<style scoped>
.admin-trend-chart {
  display: block;
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
