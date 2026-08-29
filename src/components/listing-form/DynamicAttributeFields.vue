<template>
  <div class="dynamic-fields">
    <label
      v-for="field in fields"
      :key="field.key"
      :class="{
        'is-wide': field.type === 'textarea' || field.type === 'tags' || field.type === 'boolean',
      }"
    >
      <span>{{ field.label }} <b v-if="field.required">Required</b></span>

      <select
        v-if="field.type === 'select'"
        :value="stringValue(field.key)"
        @change="setValue(field.key, ($event.target as HTMLSelectElement).value)"
      >
        <option value="">Select {{ field.label.toLowerCase() }}</option>
        <option v-for="choice in field.options" :key="choice.value" :value="choice.value">
          {{ choice.label }}
        </option>
      </select>

      <textarea
        v-else-if="field.type === 'textarea'"
        :value="stringValue(field.key)"
        :placeholder="field.placeholder"
        rows="4"
        @input="setValue(field.key, ($event.target as HTMLTextAreaElement).value)"
      />

      <input
        v-else-if="field.type === 'number'"
        type="number"
        :value="numberValue(field.key)"
        :placeholder="field.placeholder"
        :min="field.min"
        :max="field.max"
        @input="setNumber(field.key, ($event.target as HTMLInputElement).value)"
      />

      <input
        v-else-if="field.type === 'date'"
        type="date"
        :value="stringValue(field.key)"
        @input="setValue(field.key, ($event.target as HTMLInputElement).value)"
      />

      <span v-else-if="field.type === 'boolean'" class="dynamic-fields__toggle">
        <input
          type="checkbox"
          :checked="booleanValue(field.key)"
          @change="setValue(field.key, ($event.target as HTMLInputElement).checked)"
        />
        <small>{{ booleanValue(field.key) ? 'Yes' : 'No' }}</small>
      </span>

      <input
        v-else
        type="text"
        :value="field.type === 'tags' ? tagsValue(field.key) : stringValue(field.key)"
        :placeholder="field.placeholder"
        @input="
          field.type === 'tags'
            ? setTags(field.key, ($event.target as HTMLInputElement).value)
            : setValue(field.key, ($event.target as HTMLInputElement).value)
        "
      />
      <small v-if="field.help" class="dynamic-fields__help">{{ field.help }}</small>
    </label>
  </div>
</template>

<script setup lang="ts">
import type { ListingFieldDefinition } from '../../config/listingFieldConfig'
import type { ListingAttributes, ListingAttributeValue } from '../../types/listing'

const props = defineProps<{
  modelValue: ListingAttributes
  fields: readonly ListingFieldDefinition[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ListingAttributes]
}>()

function setValue(key: string, value: ListingAttributeValue) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function setNumber(key: string, value: string) {
  setValue(key, value === '' ? '' : Number(value))
}

function setTags(key: string, value: string) {
  setValue(
    key,
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  )
}

function stringValue(key: string) {
  const value = props.modelValue[key]
  return typeof value === 'string' ? value : ''
}

function numberValue(key: string) {
  const value = props.modelValue[key]
  return typeof value === 'number' ? value : ''
}

function booleanValue(key: string) {
  return props.modelValue[key] === true
}

function tagsValue(key: string) {
  const value = props.modelValue[key]
  return Array.isArray(value) ? value.join(', ') : ''
}
</script>

<style scoped>
.dynamic-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.dynamic-fields label {
  display: grid;
  align-content: start;
  gap: 7px;
  min-width: 0;
}
.dynamic-fields label.is-wide {
  grid-column: 1 / -1;
}
.dynamic-fields label > span:first-child {
  color: #243950;
  font-size: 11px;
  font-weight: 800;
}
.dynamic-fields label > span b {
  margin-left: 5px;
  color: var(--rd-brass);
  font-size: 7px;
  text-transform: uppercase;
}
.dynamic-fields input:not([type='checkbox']),
.dynamic-fields select,
.dynamic-fields textarea {
  width: 100%;
  border: 1px solid var(--rd-hairline);
  border-radius: 10px;
  background: var(--rd-surface);
  padding: 11px 12px;
  color: var(--rd-ink);
  font: inherit;
  font-size: 11px;
  outline: none;
}
.dynamic-fields textarea {
  resize: vertical;
}
.dynamic-fields input:focus,
.dynamic-fields select:focus,
.dynamic-fields textarea:focus {
  border-color: var(--rd-brass);
  box-shadow: 0 0 0 3px rgba(23, 105, 239, 0.12);
}
.dynamic-fields__toggle {
  display: flex;
  min-height: 42px;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--rd-hairline);
  border-radius: 10px;
  padding: 0 12px;
}
.dynamic-fields__toggle input {
  width: 17px;
  height: 17px;
  accent-color: var(--rd-brass);
}
.dynamic-fields__toggle small {
  color: #52677e;
  font-size: 10px;
}
.dynamic-fields__help {
  color: #7a8ba0;
  font-size: 8px;
}
@media (max-width: 620px) {
  .dynamic-fields {
    grid-template-columns: 1fr;
  }
  .dynamic-fields label.is-wide {
    grid-column: auto;
  }
}
:global(.dark) .dynamic-fields label > span:first-child {
  color: #e8eef6;
}
:global(.dark) .dynamic-fields input:not([type='checkbox']),
:global(.dark) .dynamic-fields select,
:global(.dark) .dynamic-fields textarea,
:global(.dark) .dynamic-fields__toggle {
  border-color: #2a394b;
  background: #111c2a;
  color: var(--rd-surface-alt);
}
</style>
