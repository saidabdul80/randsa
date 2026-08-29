<template>
  <Teleport to="body">
    <Transition name="command-fade">
      <div v-if="open" class="command-backdrop" role="presentation" @mousedown.self="closePalette">
        <section
          class="command-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-command-title"
          @keydown="handleKeydown"
        >
          <header class="command-search">
            <IonIcon :icon="searchOutline" aria-hidden="true" />
            <label class="sr-only" for="admin-command-query">Search admin commands</label>
            <input
              id="admin-command-query"
              ref="searchInput"
              v-model="query"
              type="search"
              autocomplete="off"
              placeholder="Search properties, users, bookings, payments..."
              aria-controls="admin-command-results"
              :aria-activedescendant="
                activeCommand ? `admin-command-${activeCommand.id}` : undefined
              "
            />
            <kbd>ESC</kbd>
          </header>

          <div id="admin-command-results" class="command-results" role="listbox">
            <div v-if="sections.length" class="command-sections">
              <section v-for="section in sections" :key="section.label" class="command-section">
                <p>{{ section.label }}</p>
                <div
                  v-for="command in section.commands"
                  :id="`admin-command-${command.id}`"
                  :key="`${section.label}-${command.id}`"
                  type="button"
                  class="command-result"
                  :class="{ active: activeCommand?.id === command.id }"
                  role="option"
                  tabindex="-1"
                  :aria-selected="activeCommand?.id === command.id"
                  @mouseenter="setActive(command)"
                  @click="execute(command)"
                >
                  <span class="command-result__icon">
                    <IonIcon :icon="command.icon" aria-hidden="true" />
                  </span>
                  <span class="command-result__copy">
                    <strong>{{ command.label }}</strong>
                    <small>{{ command.description }}</small>
                  </span>
                  <button
                    type="button"
                    class="command-pin"
                    :class="{ pinned: pinnedIds.includes(command.id) }"
                    :aria-label="
                      pinnedIds.includes(command.id)
                        ? `Unpin ${command.label}`
                        : `Pin ${command.label}`
                    "
                    :title="pinnedIds.includes(command.id) ? 'Unpin command' : 'Pin command'"
                    @click.stop="togglePinned(command.id)"
                  >
                    <IonIcon
                      :icon="pinnedIds.includes(command.id) ? bookmark : bookmarkOutline"
                      aria-hidden="true"
                    />
                  </button>
                  <IonIcon
                    :icon="arrowForwardOutline"
                    class="command-result__arrow"
                    aria-hidden="true"
                  />
                </div>
              </section>
            </div>

            <div v-else class="command-empty">
              <IonIcon :icon="searchOutline" aria-hidden="true" />
              <strong>No matching command</strong>
              <span>Try a property name, user, booking, payment, or admin section.</span>
            </div>
          </div>

          <footer class="command-footer">
            <h2 id="admin-command-title">Admin command palette</h2>
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Open</span>
            <span><IonIcon :icon="bookmarkOutline" aria-hidden="true" /> Pin</span>
          </footer>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import { arrowForwardOutline, bookmark, bookmarkOutline, searchOutline } from 'ionicons/icons'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { AdminCommandItem } from '../../types/admin'

const props = defineProps<{
  open: boolean
  commands: AdminCommandItem[]
  storageKey: string
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  execute: [command: AdminCommandItem]
}>()

const query = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const pinnedIds = ref<string[]>([])
const recentIds = ref<string[]>([])

const normalizedQuery = computed(() => normalize(query.value))
const filteredCommands = computed(() => {
  if (!normalizedQuery.value) return props.commands

  return props.commands
    .map((command) => ({ command, score: fuzzyScore(command, normalizedQuery.value) }))
    .filter((entry) => entry.score > 0)
    .sort(
      (left, right) =>
        right.score - left.score || left.command.label.localeCompare(right.command.label)
    )
    .map((entry) => entry.command)
})

const sections = computed(() => {
  if (normalizedQuery.value) return groupByCategory(filteredCommands.value)

  const commandMap = new Map(props.commands.map((command) => [command.id, command]))
  const pinned = pinnedIds.value.map((id) => commandMap.get(id)).filter(isCommand)
  const recent = recentIds.value
    .filter((id) => !pinnedIds.value.includes(id))
    .map((id) => commandMap.get(id))
    .filter(isCommand)
  const surfacedIds = new Set([...pinned, ...recent].map((command) => command.id))
  const remaining = props.commands.filter((command) => !surfacedIds.has(command.id))

  return [
    ...(pinned.length ? [{ label: 'Pinned', commands: pinned }] : []),
    ...(recent.length ? [{ label: 'Recent', commands: recent }] : []),
    ...groupByCategory(remaining),
  ]
})

const flattenedCommands = computed(() => sections.value.flatMap((section) => section.commands))
const activeCommand = computed(() => flattenedCommands.value[activeIndex.value] ?? null)

watch(
  () => props.open,
  async (isOpen) => {
    if (!isOpen) return
    query.value = ''
    activeIndex.value = 0
    await nextTick()
    searchInput.value?.focus()
  }
)

watch([normalizedQuery, () => props.commands], () => {
  activeIndex.value = 0
})

onMounted(() => {
  readPreferences()
  window.addEventListener('keydown', handleGlobalShortcut)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalShortcut)
})

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function fuzzyScore(command: AdminCommandItem, needle: string) {
  const haystack = normalize(
    [command.label, command.description, command.category, ...command.keywords].join(' ')
  )
  if (haystack.includes(needle)) return 1000 - haystack.indexOf(needle)

  let score = 0
  let cursor = 0
  for (const character of needle) {
    const nextIndex = haystack.indexOf(character, cursor)
    if (nextIndex === -1) return 0
    score += Math.max(1, 25 - (nextIndex - cursor))
    cursor = nextIndex + 1
  }
  return score
}

function groupByCategory(commands: AdminCommandItem[]) {
  const grouped = new Map<string, AdminCommandItem[]>()
  for (const command of commands) {
    const entries = grouped.get(command.category) ?? []
    entries.push(command)
    grouped.set(command.category, entries)
  }
  return [...grouped.entries()].map(([label, sectionCommands]) => ({
    label,
    commands: sectionCommands,
  }))
}

function isCommand(command: AdminCommandItem | undefined): command is AdminCommandItem {
  return Boolean(command)
}

function handleGlobalShortcut(event: KeyboardEvent) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault()
    emit('update:open', !props.open)
  }
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, flattenedCommands.value.length - 1)
    scrollActiveIntoView()
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
    scrollActiveIntoView()
    return
  }
  if (event.key === 'Enter' && activeCommand.value) {
    event.preventDefault()
    execute(activeCommand.value)
  }
}

function setActive(command: AdminCommandItem) {
  const index = flattenedCommands.value.findIndex((candidate) => candidate.id === command.id)
  if (index >= 0) activeIndex.value = index
}

function scrollActiveIntoView() {
  nextTick(() => {
    if (!activeCommand.value) return
    document
      .getElementById(`admin-command-${activeCommand.value.id}`)
      ?.scrollIntoView({ block: 'nearest' })
  })
}

function execute(command: AdminCommandItem) {
  recentIds.value = [command.id, ...recentIds.value.filter((id) => id !== command.id)].slice(0, 6)
  persistPreferences()
  emit('execute', command)
  closePalette()
}

function togglePinned(commandId: string) {
  pinnedIds.value = pinnedIds.value.includes(commandId)
    ? pinnedIds.value.filter((id) => id !== commandId)
    : [commandId, ...pinnedIds.value]
  persistPreferences()
}

function closePalette() {
  emit('update:open', false)
}

function readPreferences() {
  try {
    const raw = window.localStorage.getItem(props.storageKey)
    if (!raw) return
    const value = JSON.parse(raw) as { pinned?: string[]; recent?: string[] }
    pinnedIds.value = Array.isArray(value.pinned) ? value.pinned : []
    recentIds.value = Array.isArray(value.recent) ? value.recent : []
  } catch {
    pinnedIds.value = []
    recentIds.value = []
  }
}

function persistPreferences() {
  window.localStorage.setItem(
    props.storageKey,
    JSON.stringify({ pinned: pinnedIds.value, recent: recentIds.value })
  )
}
</script>

<style scoped>
.command-backdrop {
  position: fixed;
  z-index: 1000;
  inset: 0;
  display: grid;
  place-items: start center;
  overflow-y: auto;
  background: rgba(8, 18, 32, 0.48);
  padding: min(13vh, 112px) 16px 32px;
  backdrop-filter: blur(8px);
}
.command-dialog {
  width: min(680px, 100%);
  overflow: hidden;
  border: 1px solid var(--rd-hairline);
  border-radius: 16px;
  background: var(--rd-surface);
  color: var(--rd-ink);
  box-shadow: 0 34px 90px -34px rgba(15, 34, 58, 0.65);
}
.command-search {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid #e4eaf1;
  padding: 14px 16px;
}
.command-search > ion-icon {
  color: var(--rd-brass);
  font-size: 22px;
}
.command-search input {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 15px;
  font-weight: 650;
  outline: none;
}
.command-search input::placeholder {
  color: #8b9aab;
}
kbd {
  display: inline-flex;
  min-width: 24px;
  height: 23px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rd-hairline);
  border-radius: 6px;
  background: #f6f8fb;
  padding: 0 6px;
  color: #66778c;
  font: 700 9px/1 inherit;
  box-shadow: 0 1px 0 #d9e1ea;
}
.command-results {
  max-height: min(58vh, 520px);
  overflow-y: auto;
  padding: 8px;
}
.command-sections {
  display: grid;
  gap: 7px;
}
.command-section > p {
  margin: 0;
  padding: 8px 9px 5px;
  color: #8190a3;
  font-size: 9px;
  font-weight: 850;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.command-result {
  display: grid;
  width: 100%;
  min-height: 58px;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  padding: 8px 10px;
  color: inherit;
  text-align: left;
  transition:
    background 150ms ease,
    color 150ms ease;
}
.command-result.active {
  background: var(--rd-brass-soft);
  color: #0b57cf;
}
.command-result__icon {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 9px;
  background: #f1f5fa;
  color: var(--rd-brass);
}
.command-result.active .command-result__icon {
  background: var(--rd-surface);
}
.command-result__copy {
  min-width: 0;
}
.command-result__copy strong,
.command-result__copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.command-result__copy strong {
  font-size: 12px;
}
.command-result__copy small {
  margin-top: 3px;
  color: #738399;
  font-size: 9px;
}
.command-pin {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #9aa7b6;
}
.command-pin:hover,
.command-pin.pinned {
  background: var(--rd-surface);
  color: var(--rd-brass);
}
.command-result__arrow {
  color: #a5b0bd;
  font-size: 15px;
}
.command-empty {
  display: grid;
  min-height: 220px;
  place-items: center;
  align-content: center;
  gap: 8px;
  color: #738399;
  text-align: center;
}
.command-empty > ion-icon {
  color: #a3afbd;
  font-size: 30px;
}
.command-empty strong {
  color: #263b54;
  font-size: 13px;
}
.command-empty span {
  max-width: 330px;
  font-size: 10px;
  line-height: 1.5;
}
.command-footer {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 14px;
  border-top: 1px solid #e4eaf1;
  padding: 8px 14px;
  color: #7d8da1;
  font-size: 9px;
}
.command-footer h2 {
  margin: 0 auto 0 0;
  color: #43566e;
  font-size: 10px;
}
.command-footer span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.command-fade-enter-active,
.command-fade-leave-active {
  transition: opacity 160ms ease;
}
.command-fade-enter-active .command-dialog,
.command-fade-leave-active .command-dialog {
  transition:
    transform 180ms ease,
    opacity 180ms ease;
}
.command-fade-enter-from,
.command-fade-leave-to {
  opacity: 0;
}
.command-fade-enter-from .command-dialog,
.command-fade-leave-to .command-dialog {
  opacity: 0;
  transform: translateY(-12px) scale(0.985);
}
:global(.dark) .command-dialog {
  border-color: #2b3a4d;
  background: #111d2b;
  color: #f6f8fb;
}
:global(.dark) .command-search,
:global(.dark) .command-footer {
  border-color: #2b3a4d;
}
:global(.dark) .command-result.active {
  background: #162d4d;
  color: #80b4ff;
}
:global(.dark) .command-result__icon,
:global(.dark) kbd {
  border-color: #314154;
  background: #192737;
  color: #91bfff;
}
:global(.dark) .command-empty strong,
:global(.dark) .command-footer h2 {
  color: #e6edf6;
}
@media (max-width: 639px) {
  .command-backdrop {
    align-items: end;
    padding: 12px;
  }
  .command-dialog {
    border-radius: 14px;
  }
  .command-results {
    max-height: 62vh;
  }
  .command-footer h2 {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .command-fade-enter-active,
  .command-fade-leave-active,
  .command-fade-enter-active .command-dialog,
  .command-fade-leave-active .command-dialog {
    transition: none;
  }
}
</style>
