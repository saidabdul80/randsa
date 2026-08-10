<template>
  <AppShell :show-header="false" content-class="min-h-full w-full pb-28 sm:pb-8">
    <div class="add-listing-page">
      <div class="add-listing-navigation">
        <NotificationSidebarNav
          :can-manage-properties="canManageProperties"
          aria-label="Post Listing navigation"
          :show-mobile="true"
        />
      </div>

      <main class="add-listing-main">
        <header class="add-listing-toolbar">
          <RouterLink to="/home" class="add-listing-brand" aria-label="RANDSA home">
            <span>R</span>
            <strong>RANDSA</strong>
          </RouterLink>

          <div class="add-listing-toolbar__actions">
            <span v-if="draftSavedLabel" class="draft-saved-label">
              <IonIcon :icon="checkmarkCircleOutline" aria-hidden="true" />
              {{ draftSavedLabel }}
            </span>
            <button
              v-if="isPropertyFlow"
              type="button"
              class="save-draft-button"
              :disabled="isSavingDraft || isSubmitting"
              @click="handleSaveDraft(draftValue, currentStep)"
            >
              <IonIcon :icon="documentTextOutline" aria-hidden="true" />
              {{ isSavingDraft ? 'Saving...' : 'Save draft' }}
            </button>
            <span v-if="profileInitials" class="profile-initials" :title="state.profile?.fullName">
              {{ profileInitials }}
            </span>
          </div>
        </header>

        <section class="add-listing-hero">
          <div>
            <p>Smart adaptive listing assistant</p>
            <h1>{{ pageTitle }}</h1>
            <span>
              Create a polished listing in focused steps with fields matched to your selected
              category.
            </span>
          </div>
          <div class="add-listing-hero__image" aria-hidden="true">
            <img :src="addPropertyHero" alt="" />
          </div>
        </section>

        <div v-if="statusMessage" class="add-listing-status" :class="statusTone" role="status">
          <IonIcon
            :icon="statusTone === 'error' ? alertCircleOutline : checkmarkCircleOutline"
            aria-hidden="true"
          />
          <span>{{ statusMessage }}</span>
          <button
            type="button"
            title="Dismiss message"
            aria-label="Dismiss message"
            @click="statusMessage = ''"
          >
            <IonIcon :icon="closeOutline" aria-hidden="true" />
          </button>
        </div>

        <div class="add-listing-workspace" :class="{ 'is-classifying': !isPropertyFlow }">
          <ListingFormWizard v-model="classification" @complete="handleClassificationComplete">
            <template #details="{ category, subcategory }">
              <PropertyWizard
                v-if="category.id === 'property'"
                :initial-value="initialValue"
                :initial-step="initialStep"
                :is-submitting="isSubmitting"
                :classification-locked="true"
                @update:value="draftValue = $event"
                @step-change="currentStep = $event"
                @save-draft="handleSaveDraft"
                @submit="handleCreate"
                @cancel="handleCancel"
              />

              <MarketplaceListingWizard
                v-else
                :key="`${category.id}:${subcategory.id}:${marketplaceWizardVersion}`"
                :category="category"
                :subcategory="subcategory"
                :profile="state.profile"
                :initial-value="marketplaceInitialValue"
                :initial-step="marketplaceInitialStep"
                :is-submitting="isSubmitting"
                :upload-progress="uploadProgress"
                :submit-label="editingListingId ? 'Save changes' : 'Publish listing'"
                :submit-error="statusTone === 'error' ? statusMessage : ''"
                @update:value="marketplaceDraftValue = $event"
                @step-change="marketplaceCurrentStep = $event"
                @save-draft="handleMarketplaceSaveDraft"
                @submit="handleMarketplaceSubmit"
                @cancel="handleCancel"
              />
            </template>
          </ListingFormWizard>

          <aside v-if="isPropertyFlow" class="add-listing-aside">
            <PropertyListingPreview :value="draftValue" />

            <section class="permission-panel">
              <div class="permission-panel__title">
                <span><IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" /></span>
                <div>
                  <p>Unified account</p>
                  <h2>Every signed-in account can post</h2>
                </div>
              </div>
              <p>Publish listings and manage the activity you create from the same account.</p>
              <ul>
                <li>
                  <IonIcon :icon="personOutline" aria-hidden="true" />
                  <span><strong>Post listings</strong>Create and manage your own listings</span>
                </li>
                <li>
                  <IonIcon :icon="peopleOutline" aria-hidden="true" />
                  <span><strong>Book and save</strong>Manage bookings and saved properties</span>
                </li>
                <li>
                  <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" />
                  <span
                    ><strong>Optional verification</strong>Submit professional details for
                    review</span
                  >
                </li>
              </ul>
            </section>
          </aside>
        </div>
      </main>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  closeOutline,
  documentTextOutline,
  peopleOutline,
  personOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons'
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import addPropertyHero from '../assets/randsa-hero-home.png'
import AppShell from '../components/layout/AppShell.vue'
import ListingFormWizard from '../components/listing-form/ListingFormWizard.vue'
import MarketplaceListingWizard from '../components/listing-form/MarketplaceListingWizard.vue'
import NotificationSidebarNav from '../components/notifications/NotificationSidebarNav.vue'
import PropertyListingPreview from '../components/property/PropertyListingPreview.vue'
import PropertyWizard from '../components/property/PropertyWizard.vue'
import { useAuth } from '../composables/useAuth'
import { useProperties } from '../composables/useProperties'
import { useListings } from '../composables/useListings'
import {
  getMarketplaceCategory,
  getMarketplaceSubcategory,
  getPropertyClassificationDefaults,
  getPropertySubcategoryId,
} from '../config/marketplaceCategories'
import {
  deleteMarketplaceListingDraft,
  loadMarketplaceListingDraft,
  saveMarketplaceListingDraft,
} from '../services/listingDrafts'
import {
  deletePropertyWizardDraft,
  loadPropertyWizardDraft,
  savePropertyWizardDraft,
} from '../services/propertyDrafts'
import { createEmptyPropertyInput, type PropertyFormInput } from '../types/property'
import {
  createEmptyListingInput,
  type ListingClassification,
  type ListingFormInput,
  type ListingRecord,
  type ResolvedListingClassification,
} from '../types/listing'

const route = useRoute()
const router = useRouter()
const { state, canManageProperties } = useAuth()
const { saveNewProperty } = useProperties()
const {
  findById: findListingById,
  saveNew: saveNewListing,
  saveUpdated: saveUpdatedListing,
} = useListings()

const initialValue = ref<PropertyFormInput>(createEmptyPropertyInput())
const draftValue = ref<PropertyFormInput>(createEmptyPropertyInput())
const initialStep = ref(1)
const currentStep = ref(1)
const isSubmitting = ref(false)
const isSavingDraft = ref(false)
const statusMessage = ref('')
const statusTone = ref<'error' | 'success'>('success')
const draftSavedAt = ref<Date | null>(null)
const classification = ref<ListingClassification>(classificationFromRoute())
const marketplaceInitialValue = ref<ListingFormInput | null>(null)
const marketplaceDraftValue = ref<ListingFormInput | null>(null)
const marketplaceInitialStep = ref(1)
const marketplaceCurrentStep = ref(1)
const marketplaceWizardVersion = ref(0)
const uploadProgress = ref(0)
let restoredMarketplaceKey = ''

const editingListingId = computed(() =>
  typeof route.params.listingId === 'string' ? route.params.listingId : ''
)
let restoredUserId = ''

const selectedMarketplaceCategory = computed(() =>
  getMarketplaceCategory(classification.value.categoryId)
)
const selectedMarketplaceSubcategory = computed(() =>
  getMarketplaceSubcategory(classification.value.categoryId, classification.value.subcategoryId)
)
const isPropertyFlow = computed(
  () =>
    classification.value.categoryId === 'property' && Boolean(classification.value.subcategoryId)
)

const pageTitle = computed(() => {
  if (editingListingId.value && selectedMarketplaceSubcategory.value) {
    return `Edit ${selectedMarketplaceSubcategory.value.label.toLowerCase()}`
  }
  if (!selectedMarketplaceCategory.value) return 'Post a listing'
  if (!selectedMarketplaceSubcategory.value) {
    return `Choose a ${selectedMarketplaceCategory.value.label.toLowerCase()} type`
  }

  if (!isPropertyFlow.value) {
    return `Post ${selectedMarketplaceSubcategory.value.label.toLowerCase()}`
  }

  const category = draftValue.value.category
  const labels = {
    residential: 'Post a residential property',
    commercial: 'Post a commercial space',
    land: 'Post land',
    vehicle: 'Post a vehicle',
    event: 'Post an event space',
    horse: 'Post a horse rental',
    other: 'Post another rental',
  }
  return labels[category]
})

function classificationFromRoute(): ListingClassification {
  const categoryId = typeof route.query.category === 'string' ? route.query.category : null
  const category = getMarketplaceCategory(categoryId as ListingClassification['categoryId'])
  const subcategoryId = typeof route.query.subcategory === 'string' ? route.query.subcategory : null
  const subcategory = getMarketplaceSubcategory(category?.id, subcategoryId)

  return {
    categoryId: category?.id ?? null,
    subcategoryId: subcategory?.id ?? null,
  }
}

function applyPropertyClassification(subcategoryId: string | null) {
  const defaults = getPropertyClassificationDefaults(subcategoryId)
  if (!defaults) return

  const current = draftValue.value
  const nextValue: PropertyFormInput = {
    ...current,
    ...defaults,
    bedrooms: defaults.category === 'residential' ? current.bedrooms : null,
    bathrooms: defaults.category === 'residential' ? current.bathrooms : null,
    toilets: defaults.category === 'residential' ? current.toilets : null,
    shopSize: defaults.category === 'commercial' ? current.shopSize : '',
  }

  initialValue.value = nextValue
  draftValue.value = nextValue
}

async function handleClassificationComplete(selection: ResolvedListingClassification) {
  statusMessage.value = ''
  if (selection.category.id === 'property') {
    applyPropertyClassification(selection.subcategory.id)
    return
  }

  await prepareMarketplaceWizard(selection)
}

function listingRecordToInput(record: ListingRecord): ListingFormInput {
  return {
    title: record.title,
    description: record.description,
    categoryId: record.categoryId,
    categoryName: record.categoryName,
    subcategoryId: record.subcategoryId,
    subcategoryName: record.subcategoryName,
    location: { ...record.location },
    pricing: { ...record.pricing },
    images: record.media.images.map((url, index) => ({
      id: `remote-${index}-${url}`,
      source: 'remote',
      previewUrl: url,
      remoteUrl: url,
      file: null,
      fileName: `listing-image-${index + 1}`,
      mimeType: 'image/*',
      size: 0,
    })),
    videoUrl: record.media.videoUrl,
    contact: { ...record.contact },
    delivery: { ...record.delivery },
    attributes: { ...record.attributes },
    privateCvFile: null,
  }
}

async function prepareMarketplaceWizard(selection: ResolvedListingClassification) {
  if (!state.profile || selection.category.id === 'property') return
  const restoreKey = `${state.profile.uid}:${selection.category.id}:${selection.subcategory.id}:${editingListingId.value}`
  if (restoredMarketplaceKey === restoreKey) return
  restoredMarketplaceKey = restoreKey

  try {
    let restoredValue: ListingFormInput
    let restoredStep = 1

    if (editingListingId.value) {
      const record = await findListingById(editingListingId.value)
      if (!record || (record.ownerId !== state.profile.uid && state.profile.role !== 'admin')) {
        throw new Error('The listing you are trying to edit was not found or is not yours.')
      }
      restoredValue = listingRecordToInput(record)
    } else {
      const draft = await loadMarketplaceListingDraft(
        state.profile.uid,
        selection.category.id,
        selection.subcategory.id
      )
      restoredValue =
        draft?.value ??
        createEmptyListingInput(selection.category, selection.subcategory, state.profile)
      restoredStep = draft?.step ?? 1
      if (draft) {
        draftSavedAt.value = new Date(draft.updatedAt)
        statusTone.value = 'success'
        statusMessage.value = 'Your saved marketplace draft has been restored on this device.'
      }
    }

    marketplaceInitialValue.value = restoredValue
    marketplaceDraftValue.value = restoredValue
    marketplaceInitialStep.value = restoredStep
    marketplaceCurrentStep.value = restoredStep
    marketplaceWizardVersion.value += 1
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not prepare this listing.'
  }
}

watch(
  classification,
  (value) => {
    if (value.categoryId === 'property' && value.subcategoryId) {
      applyPropertyClassification(value.subcategoryId)
    }

    const query = { ...route.query }
    if (value.categoryId) query.category = value.categoryId
    else delete query.category
    if (value.subcategoryId) query.subcategory = value.subcategoryId
    else delete query.subcategory
    void router.replace({ query })
  },
  { deep: true, immediate: true }
)

const profileInitials = computed(() => {
  const name = state.profile?.fullName.trim() ?? ''
  if (!name) return ''
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase() ?? '')
    .join('')
})

const draftSavedLabel = computed(() => {
  if (!draftSavedAt.value) return ''
  return `Draft saved ${draftSavedAt.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
})

watch(
  () => state.profile,
  async (profile) => {
    if (!profile || restoredUserId === profile.uid) return
    restoredUserId = profile.uid

    if (editingListingId.value) {
      try {
        const listing = await findListingById(editingListingId.value)
        if (!listing || (listing.ownerId !== profile.uid && profile.role !== 'admin')) {
          throw new Error('The listing you are trying to edit was not found or is not yours.')
        }
        classification.value = {
          categoryId: listing.categoryId,
          subcategoryId: listing.subcategoryId,
        }
        const category = getMarketplaceCategory(listing.categoryId)
        const subcategory = getMarketplaceSubcategory(listing.categoryId, listing.subcategoryId)
        if (category && subcategory) await prepareMarketplaceWizard({ category, subcategory })
        return
      } catch (error) {
        statusTone.value = 'error'
        statusMessage.value =
          error instanceof Error ? error.message : 'Could not open this listing for editing.'
        return
      }
    }

    const emptyValue = {
      ...createEmptyPropertyInput(),
      ownerPhone: profile.phone ?? '',
    }

    try {
      const draft = await loadPropertyWizardDraft(profile.uid)
      const draftSubcategoryId = draft ? getPropertySubcategoryId(draft.value.propertyType) : null
      const shouldRestoreDraft = Boolean(
        draft &&
        (!classification.value.categoryId ||
          (classification.value.categoryId === 'property' &&
            (!classification.value.subcategoryId ||
              classification.value.subcategoryId === draftSubcategoryId)))
      )
      const restoredValue = shouldRestoreDraft && draft ? draft.value : emptyValue
      initialValue.value = restoredValue
      draftValue.value = restoredValue
      initialStep.value = shouldRestoreDraft && draft ? draft.step : 1
      currentStep.value = shouldRestoreDraft && draft ? draft.step : 1

      if (shouldRestoreDraft && draft) {
        classification.value = {
          categoryId: 'property',
          subcategoryId: draftSubcategoryId,
        }
        draftSavedAt.value = new Date(draft.updatedAt)
        statusTone.value = 'success'
        statusMessage.value = 'Your saved property draft has been restored on this device.'
      } else if (classification.value.categoryId === 'property') {
        applyPropertyClassification(classification.value.subcategoryId)
      }
    } catch (error) {
      initialValue.value = emptyValue
      draftValue.value = emptyValue
      statusTone.value = 'error'
      statusMessage.value =
        error instanceof Error ? error.message : 'The saved draft could not be restored.'
    }

    if (selectedMarketplaceCategory.value && selectedMarketplaceSubcategory.value) {
      await prepareMarketplaceWizard({
        category: selectedMarketplaceCategory.value,
        subcategory: selectedMarketplaceSubcategory.value,
      })
    }
  },
  { immediate: true }
)

async function handleSaveDraft(value: PropertyFormInput, step: number) {
  statusMessage.value = ''

  if (!state.profile) {
    statusTone.value = 'error'
    statusMessage.value = 'You need to be signed in before you can save a property draft.'
    return
  }

  isSavingDraft.value = true
  try {
    await savePropertyWizardDraft(state.profile.uid, value, step)
    draftSavedAt.value = new Date()
    statusTone.value = 'success'
    statusMessage.value = 'Draft saved on this device. You can continue from this step later.'
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value =
      error instanceof Error ? error.message : 'Could not save this property draft.'
  } finally {
    isSavingDraft.value = false
  }
}

async function handleCreate(value: PropertyFormInput) {
  statusMessage.value = ''

  if (!state.profile) {
    statusTone.value = 'error'
    statusMessage.value = 'You need to be signed in before you can post a listing.'
    return
  }

  isSubmitting.value = true

  try {
    const property = await saveNewProperty(value, state.profile)
    try {
      await deletePropertyWizardDraft(state.profile.uid)
    } catch {
      // A local draft cleanup failure must not undo a successful Firebase property creation.
    }
    statusTone.value = 'success'
    statusMessage.value = 'Listing posted successfully. Redirecting to the details page...'
    await router.replace(`/properties/${property.id}`)
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not post this listing.'
  } finally {
    isSubmitting.value = false
  }
}

async function handleMarketplaceSaveDraft(value: ListingFormInput, step: number) {
  if (!state.profile) {
    statusTone.value = 'error'
    statusMessage.value = 'You need to be signed in before saving a draft.'
    return
  }
  isSavingDraft.value = true
  try {
    await saveMarketplaceListingDraft(state.profile.uid, value, step)
    draftSavedAt.value = new Date()
    statusTone.value = 'success'
    statusMessage.value = 'Draft saved on this device.'
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not save this draft.'
  } finally {
    isSavingDraft.value = false
  }
}

async function handleMarketplaceSubmit(value: ListingFormInput) {
  if (!state.profile || isSubmitting.value) return
  isSubmitting.value = true
  uploadProgress.value = 0
  statusMessage.value = ''
  try {
    const record = editingListingId.value
      ? await saveUpdatedListing(editingListingId.value, value, state.profile, (progress) => {
          uploadProgress.value = progress
        })
      : await saveNewListing(value, state.profile, (progress) => {
          uploadProgress.value = progress
        })
    try {
      await deleteMarketplaceListingDraft(state.profile.uid, value.categoryId, value.subcategoryId)
    } catch {
      // Draft cleanup never reverses a successful listing write.
    }
    statusTone.value = 'success'
    statusMessage.value = editingListingId.value
      ? 'Listing updated successfully.'
      : 'Listing submitted for review.'
    await router.replace({ path: '/my-listings', query: { selected: record.id } })
  } catch (error) {
    statusTone.value = 'error'
    statusMessage.value = error instanceof Error ? error.message : 'Could not save this listing.'
  } finally {
    isSubmitting.value = false
    uploadProgress.value = 0
  }
}

function handleCancel() {
  void router.push('/properties')
}
</script>

<style scoped>
.add-listing-page {
  min-height: 100%;
  background: #f5f7fa;
  color: #102033;
}
.add-listing-navigation {
  padding: 10px 12px 0;
}
.add-listing-main {
  min-width: 0;
  padding: 0 12px 28px;
}
.add-listing-toolbar {
  display: flex;
  min-height: 68px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
.add-listing-brand {
  display: none;
  align-items: center;
  gap: 9px;
  color: #102033;
  text-decoration: none;
}
.add-listing-brand > span {
  color: #1769ef;
  font-size: 31px;
  font-weight: 950;
  line-height: 1;
}
.add-listing-brand strong {
  font-size: 16px;
}
.add-listing-toolbar__actions {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-left: auto;
}
.draft-saved-label {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #438064;
  font-size: 8px;
  font-weight: 750;
}
.save-draft-button {
  display: inline-flex;
  min-height: 38px;
  align-items: center;
  gap: 7px;
  border: 1px solid #dce4ed;
  border-radius: 10px;
  background: #fff;
  padding: 0 13px;
  color: #243950;
  font-size: 11px;
  font-weight: 800;
  box-shadow: 0 10px 25px -23px rgba(16, 32, 51, 0.5);
}
.save-draft-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.profile-initials {
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 3px solid #fff;
  border-radius: 50%;
  background: #102033;
  color: #fff;
  font-size: 9px;
  font-weight: 850;
  box-shadow: 0 0 0 1px #dce4ed;
}
.add-listing-hero {
  position: relative;
  display: grid;
  min-height: 150px;
  overflow: hidden;
  border: 1px solid #dfe7f0;
  border-radius: 18px;
  background: #edf4ff;
}
.add-listing-hero > div:first-child {
  position: relative;
  z-index: 2;
  align-self: center;
  padding: 22px;
}
.add-listing-hero p {
  margin: 0;
  color: #1769ef;
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}
.add-listing-hero h1 {
  max-width: 520px;
  margin: 9px 0 0;
  color: #102033;
  font-size: clamp(24px, 4vw, 35px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 1.08;
}
.add-listing-hero > div:first-child > span {
  display: block;
  max-width: 520px;
  margin-top: 9px;
  color: #596f88;
  font-size: 12px;
  line-height: 1.65;
}
.add-listing-hero__image {
  position: absolute;
  inset: 0;
}
.add-listing-hero__image::after {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    #edf4ff 0%,
    rgba(237, 244, 255, 0.97) 44%,
    rgba(237, 244, 255, 0.08) 77%
  );
  content: '';
}
.add-listing-hero__image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 72% 57%;
}
.add-listing-status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  border: 1px solid;
  border-radius: 11px;
  padding: 10px 12px;
  font-size: 9px;
  line-height: 1.5;
}
.add-listing-status > ion-icon {
  flex: 0 0 auto;
  font-size: 17px;
}
.add-listing-status > span {
  flex: 1;
}
.add-listing-status > button {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: currentColor;
}
.add-listing-status.success {
  border-color: #bfe9d4;
  background: #f0fbf5;
  color: #087b4c;
}
.add-listing-status.error {
  border-color: #fecdd3;
  background: #fff1f2;
  color: #be123c;
}
.add-listing-workspace {
  display: grid;
  min-width: 0;
  gap: 16px;
  margin-top: 16px;
}
.add-listing-workspace.is-classifying {
  grid-template-columns: minmax(0, 1fr);
}
.category-details-ready {
  display: grid;
  min-height: 280px;
  place-items: center;
  align-content: center;
  gap: 7px;
  border: 1px dashed #cdd9e7;
  border-radius: 8px;
  background: #fff;
  padding: 24px;
  text-align: center;
}
.category-details-ready > span {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  background: #edf4ff;
  color: #1769ef;
  font-size: 22px;
}
.category-details-ready p,
.category-details-ready h2,
.category-details-ready small {
  margin: 0;
}
.category-details-ready p {
  color: #1769ef;
  font-size: 10px;
  font-weight: 850;
  text-transform: uppercase;
}
.category-details-ready h2 {
  color: #102033;
  font-size: 20px;
}
.category-details-ready small {
  color: #667a91;
  font-size: 11px;
}
.add-listing-aside {
  display: none;
}
.permission-panel {
  border: 1px solid #e1e8f0;
  border-radius: 17px;
  background: #fff;
  padding: 17px;
  box-shadow: 0 20px 50px -42px rgba(16, 32, 51, 0.45);
}
.permission-panel__title {
  display: flex;
  align-items: center;
  gap: 10px;
}
.permission-panel__title > span {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 10px;
  background: #f1eafe;
  color: #7c3aed;
}
.permission-panel__title p {
  margin: 0;
  color: #7c3aed;
  font-size: 7px;
  font-weight: 850;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.permission-panel__title h2 {
  margin: 3px 0 0;
  color: #102033;
  font-size: 12px;
}
.permission-panel > p {
  margin: 12px 0 0;
  color: #687a8f;
  font-size: 8px;
  line-height: 1.6;
}
.permission-panel ul {
  display: grid;
  gap: 9px;
  margin: 14px 0 0;
  padding: 0;
  list-style: none;
}
.permission-panel li {
  display: flex;
  align-items: center;
  gap: 9px;
  color: #566b82;
  font-size: 7px;
}
.permission-panel li > ion-icon {
  width: 17px;
  flex: 0 0 auto;
  color: #1769ef;
  font-size: 17px;
}
.permission-panel li span,
.permission-panel li strong {
  display: block;
}
.permission-panel li strong {
  margin-bottom: 2px;
  color: #253a51;
  font-size: 8px;
}

@media (max-width: 639px) {
  .add-listing-navigation {
    display: none;
  }
  .add-listing-main {
    padding-top: 8px;
  }
  .add-listing-toolbar {
    min-height: 52px;
  }
  .add-listing-brand {
    display: flex;
  }
  .draft-saved-label,
  .profile-initials {
    display: none;
  }
  .save-draft-button {
    min-height: 34px;
    padding-inline: 10px;
  }
  .add-listing-hero {
    min-height: 132px;
  }
  .add-listing-hero > div:first-child {
    padding: 17px;
  }
  .add-listing-hero h1 {
    max-width: 280px;
    font-size: 24px;
  }
  .add-listing-hero > div:first-child > span {
    max-width: 300px;
    font-size: 8px;
  }
  .add-listing-hero__image::after {
    background: linear-gradient(
      90deg,
      #edf4ff 0%,
      rgba(237, 244, 255, 0.94) 68%,
      rgba(237, 244, 255, 0.25)
    );
  }
}

@media (min-width: 640px) {
  .add-listing-main {
    padding-inline: 18px;
  }
  .add-listing-hero {
    min-height: 170px;
  }
  .add-listing-hero > div:first-child {
    padding: 28px;
  }
  :deep(nav[aria-label='Primary navigation']) {
    display: none !important;
  }
}

@media (min-width: 1024px) {
  .add-listing-page {
    display: grid;
    grid-template-columns: 205px minmax(0, 1fr);
    gap: 18px;
    padding: 14px 18px 26px;
  }
  .add-listing-navigation {
    padding: 0;
  }
  .add-listing-main {
    padding: 0;
  }
  .add-listing-toolbar {
    min-height: 58px;
  }
  .add-listing-brand {
    display: flex;
  }
  .add-listing-hero {
    min-height: 175px;
  }
}

@media (min-width: 1280px) {
  .add-listing-workspace {
    grid-template-columns: minmax(0, 1fr) 285px;
    align-items: start;
  }
  .add-listing-aside {
    position: sticky;
    top: 16px;
    display: grid;
    gap: 14px;
  }
}

:global(.dark) .add-listing-page {
  background: #0b1420;
  color: #f8fafc;
}
:global(.dark) .add-listing-brand,
:global(.dark) .classification-summary strong,
:global(.dark) .category-details-ready h2,
:global(.dark) .permission-panel__title h2,
:global(.dark) .permission-panel li strong {
  color: #f8fafc;
}
:global(.dark) .save-draft-button,
:global(.dark) .permission-panel,
:global(.dark) .classification-summary,
:global(.dark) .category-details-ready {
  border-color: #29374a;
  background: #111c2a;
  color: #e8eef6;
}
:global(.dark) .add-listing-hero {
  border-color: #29374a;
  background: #13243a;
}
:global(.dark) .add-listing-hero h1 {
  color: #f8fafc;
}
:global(.dark) .add-listing-hero > div:first-child > span {
  color: #cad5e1;
}
:global(.dark) .add-listing-hero__image::after {
  background: linear-gradient(
    90deg,
    #13243a 0%,
    rgba(19, 36, 58, 0.96) 44%,
    rgba(19, 36, 58, 0.12) 78%
  );
}
</style>
