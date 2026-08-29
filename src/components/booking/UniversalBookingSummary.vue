<template>
  <article class="universal-summary" aria-live="polite">
    <div class="universal-summary__heading">
      <div>
        <p>{{ config.summaryLabel }}</p>
        <h2>Your selected booking</h2>
      </div>
      <span :class="isComplete ? 'is-ready' : 'is-pending'">
        {{ isComplete ? 'Ready to book' : 'Awaiting selection' }}
      </span>
    </div>

    <dl>
      <div>
        <dt>Listing</dt>
        <dd>{{ property?.title ?? 'Not available' }}</dd>
      </div>
      <div>
        <dt>Starts</dt>
        <dd>{{ formattedStart }}</dd>
      </div>
      <div v-if="showEnd">
        <dt>Ends</dt>
        <dd>{{ formattedEnd }}</dd>
      </div>
      <div>
        <dt>Duration</dt>
        <dd>{{ formattedDuration }}</dd>
      </div>
      <div>
        <dt>{{ config.paymentLabel }}</dt>
        <dd>{{ formattedTotal }}</dd>
      </div>
      <div>
        <dt>Rate</dt>
        <dd>{{ formattedRate }}</dd>
      </div>
    </dl>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'

import type { NormalizedBookingSelection, BookingModeConfig } from '../../services/bookingModes'
import { formatBookingPricingUnit, isInspectionMode } from '../../services/bookingModes'
import { formatNaira } from '../../types/payment'
import type { PropertyRecord } from '../../types/property'

const props = defineProps<{
  property: PropertyRecord | null
  config: BookingModeConfig
  selection: NormalizedBookingSelection | null
}>()

const isComplete = computed(() => Boolean(props.selection))
const showEnd = computed(() => props.config.selectionKind !== 'time_slot')
const formattedStart = computed(() => formatDateTime(props.selection?.startAt))
const formattedEnd = computed(() => formatDateTime(props.selection?.endAt))
const formattedDuration = computed(() => {
  const minutes = props.selection?.durationMinutes
  if (!minutes) return 'Not selected'
  if (minutes < 60) return `${minutes} minutes`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours} ${hours === 1 ? 'hour' : 'hours'}`
})
const formattedTotal = computed(() => {
  const total = props.selection?.estimatedTotal
  return total === null || total === undefined ? 'Not available' : formatNaira(total)
})
const formattedRate = computed(() => {
  if (!props.property || !props.selection) return 'Not available'
  const rate = isInspectionMode(props.selection.bookingMode)
    ? props.property.inspectionFee
    : props.property.rentPrice
  return `${formatNaira(rate)} ${formatBookingPricingUnit(props.selection.pricingUnit)}`
})

function formatDateTime(value: string | undefined) {
  if (!value) return 'Not selected'
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}
</script>

<style scoped>
.universal-summary {
  border: 1px solid #e3e8ef;
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 18px;
  box-shadow: 0 14px 34px -28px rgba(16, 32, 51, 0.45);
}

.universal-summary__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.universal-summary__heading p {
  margin: 0;
  color: var(--rd-brass);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}

.universal-summary__heading h2 {
  margin: 5px 0 0;
  color: var(--rd-ink);
  font-size: 17px;
}

.universal-summary__heading span {
  border-radius: 999px;
  padding: 6px 9px;
  font-size: 9px;
  font-weight: 800;
  white-space: nowrap;
}

.is-ready {
  background: #e9f8f1;
  color: #08784f;
}
.is-pending {
  background: #fff6dc;
  color: #8a5b00;
}

dl {
  display: grid;
  gap: 0;
  margin: 14px 0 0;
}

dl div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #eef1f5;
  padding: 10px 0;
}

dt {
  color: #738196;
  font-size: 11px;
}
dd {
  margin: 0;
  color: var(--rd-ink);
  font-size: 11px;
  font-weight: 800;
  text-align: right;
}
</style>
