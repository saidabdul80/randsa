<template>
  <AppShell content-class="min-h-full w-full bg-[#f4f7fb] dark:bg-[#09121e]">
    <div class="admin-shell">
      <button
        v-if="mobileSidebarOpen"
        type="button"
        class="admin-sidebar-backdrop"
        aria-label="Close admin navigation"
        @click="mobileSidebarOpen = false"
      />

      <aside class="admin-sidebar" :class="{ open: mobileSidebarOpen }">
        <RouterLink to="/admin" class="admin-brand" aria-label="RANDSA admin control center">
          <span>R</span>
          <strong>RANDSA</strong>
          <small>ADMIN</small>
        </RouterLink>

        <nav aria-label="Admin navigation" class="admin-nav">
          <button
            v-for="item in adminNavigation"
            :key="item.id"
            type="button"
            :class="{ active: activeSection === item.target }"
            @click="navigateAdminItem(item)"
          >
            <IonIcon :icon="item.icon" aria-hidden="true" />
            <span>{{ item.label }}</span>
            <small v-if="item.badge">{{ item.badge }}</small>
          </button>
        </nav>

        <section class="admin-sidebar-shortcuts" aria-labelledby="admin-shortcuts-title">
          <p id="admin-shortcuts-title">Shortcuts</p>
          <button type="button" @click="commandPaletteOpen = true">
            <IonIcon :icon="searchOutline" aria-hidden="true" /> Command palette <kbd>Ctrl K</kbd>
          </button>
          <RouterLink to="/add-property">
            <IonIcon :icon="addCircleOutline" aria-hidden="true" /> Create property
          </RouterLink>
          <button type="button" @click="navigateToSection('verifications')">
            <IonIcon :icon="shieldCheckmarkOutline" aria-hidden="true" /> Review verification
          </button>
          <button type="button" @click="exportDataset('payments')">
            <IonIcon :icon="downloadOutline" aria-hidden="true" /> Export payments
          </button>
        </section>

        <section class="admin-sidebar-status" aria-label="System status summary">
          <span :class="dashboardLoadError ? 'warning' : 'healthy'" />
          <div>
            <strong>System status</strong>
            <small>{{
              dashboardLoadError ? 'Review connection status' : 'Core data available'
            }}</small>
          </div>
          <button
            type="button"
            aria-label="Open system status"
            @click="navigateToSection('system-health')"
          >
            <IonIcon :icon="arrowForwardOutline" aria-hidden="true" />
          </button>
        </section>

        <RouterLink to="/profile" class="admin-account-link">
          <span class="admin-avatar">{{ adminInitials }}</span>
          <span
            ><strong>{{ adminName }}</strong
            ><small>{{ adminRoleLabel }}</small></span
          >
          <IonIcon :icon="chevronForwardOutline" aria-hidden="true" />
        </RouterLink>

        <button type="button" class="admin-logout" :disabled="isSigningOut" @click="handleSignOut">
          <IonIcon :icon="logOutOutline" aria-hidden="true" />
          {{ isSigningOut ? 'Signing out...' : 'Log out' }}
        </button>
      </aside>

      <main class="admin-main">
        <header class="admin-topbar">
          <button
            type="button"
            class="admin-icon-button admin-mobile-menu"
            aria-label="Open admin navigation"
            @click="mobileSidebarOpen = true"
          >
            <IonIcon :icon="menuOutline" aria-hidden="true" />
          </button>

          <div class="admin-greeting">
            <h1>{{ greeting }}, {{ adminFirstName }}</h1>
            <p>Here is what is happening across RANDSA.</p>
          </div>

          <button type="button" class="admin-global-search" @click="commandPaletteOpen = true">
            <IonIcon :icon="searchOutline" aria-hidden="true" />
            <span>Search properties, users, bookings...</span>
            <kbd>{{ isMacPlatform ? 'Cmd' : 'Ctrl' }} K</kbd>
          </button>

          <div class="admin-top-actions">
            <button
              type="button"
              class="admin-icon-button"
              title="Customize dashboard"
              aria-label="Customize dashboard"
              :aria-expanded="customizerOpen"
              @click="customizerOpen = !customizerOpen"
            >
              <IonIcon :icon="optionsOutline" aria-hidden="true" />
            </button>
            <button
              type="button"
              class="admin-icon-button"
              title="Open notification center"
              aria-label="Open notification center"
              :aria-expanded="notificationDrawerOpen"
              @click="notificationDrawerOpen = !notificationDrawerOpen"
            >
              <IonIcon :icon="notificationsOutline" aria-hidden="true" />
              <span v-if="unreadNotificationCount" class="admin-badge">{{
                compactCount(unreadNotificationCount)
              }}</span>
            </button>
            <RouterLink
              to="/add-property"
              class="admin-add-button"
              title="Create property"
              aria-label="Create property"
            >
              <IonIcon :icon="addOutline" aria-hidden="true" />
            </RouterLink>
            <RouterLink to="/profile" class="admin-profile-button" aria-label="Open Account Center">
              <span>{{ adminInitials }}</span>
              <IonIcon :icon="chevronDownOutline" aria-hidden="true" />
            </RouterLink>
          </div>

          <div class="admin-date">
            <IonIcon :icon="calendarOutline" aria-hidden="true" />
            <span
              ><strong>{{ currentDateLabel }}</strong
              ><small>{{ currentTimeLabel }}</small></span
            >
          </div>

          <section
            v-if="customizerOpen"
            class="admin-popover admin-customizer"
            aria-label="Dashboard widgets"
          >
            <div class="popover-heading">
              <span
                ><strong>Dashboard widgets</strong
                ><small>Visibility, order, and collapsed state</small></span
              >
              <button
                type="button"
                aria-label="Close dashboard customizer"
                @click="customizerOpen = false"
              >
                <IonIcon :icon="closeOutline" aria-hidden="true" />
              </button>
            </div>
            <div class="customizer-list">
              <div v-for="(widget, index) in orderedWidgets" :key="widget.id">
                <label>
                  <input
                    type="checkbox"
                    :checked="!hiddenWidgetIds.includes(widget.id)"
                    @change="toggleWidget(widget.id)"
                  />
                  <span>{{ widget.label }}</span>
                </label>
                <button
                  type="button"
                  :disabled="index === 0"
                  :aria-label="`Move ${widget.label} up`"
                  @click="moveWidget(widget.id, -1)"
                >
                  <IonIcon :icon="arrowUpOutline" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  :disabled="index === orderedWidgets.length - 1"
                  :aria-label="`Move ${widget.label} down`"
                  @click="moveWidget(widget.id, 1)"
                >
                  <IonIcon :icon="arrowDownOutline" aria-hidden="true" />
                </button>
              </div>
            </div>
            <button type="button" class="popover-reset" @click="resetWidgetPreferences">
              Reset layout
            </button>
          </section>

          <section
            v-if="notificationDrawerOpen"
            class="admin-popover admin-notification-drawer"
            aria-label="Notification center"
          >
            <div class="popover-heading">
              <span
                ><strong>Notification center</strong
                ><small>{{ unreadNotificationCount }} unread</small></span
              >
              <button
                type="button"
                aria-label="Close notification center"
                @click="notificationDrawerOpen = false"
              >
                <IonIcon :icon="closeOutline" aria-hidden="true" />
              </button>
            </div>
            <div class="drawer-actions">
              <select v-model="notificationFilter" aria-label="Filter notifications">
                <option value="all">All categories</option>
                <option value="booking">Bookings</option>
                <option value="payment">Payments</option>
                <option value="reminder">Reminders</option>
                <option value="admin">Admin messages</option>
              </select>
              <button
                type="button"
                :disabled="!unreadNotificationCount || isMarkingNotifications"
                @click="markAllNotificationsRead"
              >
                {{ isMarkingNotifications ? 'Updating...' : 'Mark all read' }}
              </button>
            </div>
            <div class="notification-list is-drawer">
              <button
                v-for="notification in filteredNotifications.slice(0, 7)"
                :key="notification.id"
                type="button"
                :class="{ unread: !notification.readAt }"
                @click="openNotification(notification)"
              >
                <span class="notification-icon" :class="notificationTone(notification.type)">
                  <IonIcon :icon="notificationIcon(notification.type)" aria-hidden="true" />
                </span>
                <span
                  ><strong>{{ notification.title }}</strong
                  ><small>{{ notification.body }}</small></span
                >
                <time>{{ relativeTime(notification.createdAt) }}</time>
              </button>
              <p v-if="!filteredNotifications.length" class="admin-empty compact">
                No notifications in this category.
              </p>
            </div>
            <RouterLink to="/notifications" class="drawer-footer-link"
              >Open notifications page <IonIcon :icon="arrowForwardOutline"
            /></RouterLink>
          </section>
        </header>

        <div
          v-if="actionMessage || dashboardLoadError"
          class="admin-alert"
          :class="actionTone === 'error' || dashboardLoadError ? 'error' : 'success'"
          role="status"
          aria-live="polite"
        >
          <IonIcon
            :icon="
              actionTone === 'error' || dashboardLoadError
                ? alertCircleOutline
                : checkmarkCircleOutline
            "
            aria-hidden="true"
          />
          <span>{{ actionMessage || dashboardLoadError }}</span>
          <button type="button" aria-label="Dismiss message" @click="dismissMessages">
            <IonIcon :icon="closeOutline" />
          </button>
        </div>

        <section id="overview" class="admin-overview" aria-labelledby="admin-overview-title">
          <div class="admin-overview-heading">
            <div>
              <p>RANDSA operations</p>
              <h2 id="admin-overview-title">Control Center</h2>
            </div>
            <div class="admin-range-control">
              <label>
                <span>Date range</span>
                <select v-model="selectedRange" aria-label="Analytics date range">
                  <option v-for="range in rangeOptions" :key="range.value" :value="range.value">
                    {{ range.label }}
                  </option>
                </select>
              </label>
              <template v-if="selectedRange === 'custom'">
                <label class="date-input"
                  ><span>From</span><input v-model="customRange.start" type="date"
                /></label>
                <label class="date-input"
                  ><span>To</span><input v-model="customRange.end" type="date"
                /></label>
              </template>
              <button type="button" :disabled="isRefreshing" @click="handleRefresh()">
                <IonIcon
                  :icon="refreshOutline"
                  :class="{ spinning: isRefreshing }"
                  aria-hidden="true"
                />
                {{ isRefreshing ? 'Refreshing' : 'Refresh' }}
              </button>
            </div>
          </div>

          <div
            v-if="isInitialLoading"
            class="admin-metric-grid"
            aria-label="Loading dashboard metrics"
          >
            <div v-for="index in 6" :key="index" class="admin-metric-card skeleton" />
          </div>
          <div v-else class="admin-metric-grid">
            <article v-for="metric in metrics" :key="metric.label" class="admin-metric-card">
              <span class="metric-icon" :class="metric.tone"
                ><IonIcon :icon="metric.icon" aria-hidden="true"
              /></span>
              <div class="metric-copy">
                <p>{{ metric.label }}</p>
                <strong>{{ metric.value }}</strong>
              </div>
              <div class="metric-trend" :class="metric.trendTone">
                <IonIcon
                  v-if="metric.trend !== null"
                  :icon="metric.trend >= 0 ? trendingUpOutline : trendingDownOutline"
                  aria-hidden="true"
                />
                <span>{{ metric.trendLabel }}</span>
              </div>
              <AdminTrendChart
                :values="metric.series"
                :color="metric.color"
                :label="`${metric.label} trend`"
              />
            </article>
          </div>
        </section>

        <section
          v-if="!isInitialLoading"
          class="admin-widget-grid"
          aria-label="Admin dashboard widgets"
        >
          <article
            v-show="!isWidgetHidden('properties')"
            id="properties"
            class="admin-widget widget-properties"
            :class="{ collapsed: isWidgetCollapsed('properties') }"
            :style="widgetOrderStyle('properties')"
          >
            <header class="widget-heading">
              <div>
                <h2>Marketplace moderation</h2>
                <p>Review universal listings and legacy property records.</p>
              </div>
              <div class="widget-tools">
                <button
                  type="button"
                  :class="{ active: propertyFiltersOpen }"
                  @click="propertyFiltersOpen = !propertyFiltersOpen"
                >
                  <IonIcon :icon="filterOutline" aria-hidden="true" /> Filters
                </button>
                <button type="button" :disabled="isRefreshing" @click="handleRefresh()">
                  <IonIcon :icon="refreshOutline" aria-hidden="true" /> Refresh
                </button>
                <button
                  type="button"
                  :aria-label="widgetCollapseLabel('properties')"
                  @click="toggleCollapsed('properties')"
                >
                  <IonIcon
                    :icon="isWidgetCollapsed('properties') ? chevronDownOutline : chevronUpOutline"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </header>

            <template v-if="!isWidgetCollapsed('properties')">
              <div class="property-toolbar">
                <div class="property-tabs" role="tablist" aria-label="Property status">
                  <button
                    v-for="tab in propertyTabs"
                    :key="tab.value"
                    type="button"
                    role="tab"
                    :aria-selected="propertyStatusFilter === tab.value"
                    :class="{ active: propertyStatusFilter === tab.value }"
                    @click="propertyStatusFilter = tab.value"
                  >
                    {{ tab.label }} <span>{{ tab.count }}</span>
                  </button>
                </div>
                <label class="property-search">
                  <IonIcon :icon="searchOutline" aria-hidden="true" />
                  <span class="sr-only">Search property moderation records</span>
                  <input
                    v-model.trim="propertyQuery"
                    type="search"
                    placeholder="Search listings..."
                  />
                </label>
              </div>

              <div v-if="propertyFiltersOpen" class="smart-filter-panel">
                <label
                  >Category<select v-model="propertyCategoryFilter">
                    <option value="all">All categories</option>
                    <option
                      v-for="category in propertyCategories"
                      :key="category"
                      :value="category"
                    >
                      {{ titleCase(category) }}
                    </option>
                  </select></label
                >
                <label
                  >Owner<select v-model="propertyOwnerFilter">
                    <option value="all">All owners</option>
                    <option v-for="owner in propertyOwners" :key="owner.uid" :value="owner.uid">
                      {{ owner.fullName || owner.email }}
                    </option>
                  </select></label
                >
                <label
                  >Location<input
                    v-model.trim="propertyLocationFilter"
                    type="search"
                    placeholder="State, city, or area"
                /></label>
                <label
                  >Availability<select v-model="propertyAvailabilityFilter">
                    <option value="all">Any availability</option>
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select></label
                >
                <label
                  >Minimum price<input
                    v-model.number="propertyMinPrice"
                    type="number"
                    min="0"
                    placeholder="0"
                /></label>
                <label
                  >Maximum price<input
                    v-model.number="propertyMaxPrice"
                    type="number"
                    min="0"
                    placeholder="Any"
                /></label>
                <div class="saved-filter-row">
                  <select
                    v-model="selectedSavedFilterId"
                    aria-label="Saved property filters"
                    @change="applySavedFilter"
                  >
                    <option value="">Saved filters</option>
                    <option
                      v-for="filter in savedPropertyFilters"
                      :key="filter.id"
                      :value="filter.id"
                    >
                      {{ filter.name }}
                    </option>
                  </select>
                  <button type="button" @click="saveCurrentPropertyFilter">
                    <IonIcon :icon="bookmarkOutline" /> Save
                  </button>
                  <button type="button" @click="clearPropertyFilters">Clear</button>
                </div>
              </div>

              <section class="universal-listing-queue" aria-labelledby="universal-listing-heading">
                <div class="universal-listing-heading">
                  <div>
                    <span>Universal marketplace</span>
                    <h3 id="universal-listing-heading">Category submissions</h3>
                  </div>
                  <p>
                    {{ pendingMarketplaceListingCount }} pending / {{ allListings.length }} total
                  </p>
                </div>
                <div class="universal-listing-list">
                  <article
                    v-for="listing in visibleMarketplaceListings"
                    :key="listing.id"
                    class="moderation-row marketplace-moderation-row"
                  >
                    <div class="property-thumbnail">
                      <img
                        v-if="listing.media.coverImage"
                        :src="listing.media.coverImage"
                        :alt="listing.title"
                        loading="lazy"
                      />
                      <IonIcon v-else :icon="storefrontOutline" aria-hidden="true" />
                    </div>
                    <div class="property-row-copy">
                      <div>
                        <strong>{{ listing.title }}</strong>
                        <span class="status-pill" :class="listing.moderationStatus">
                          {{ titleCase(listing.moderationStatus) }}
                        </span>
                      </div>
                      <p>
                        <IonIcon :icon="locationOutline" />
                        {{ marketplaceListingLocation(listing) }}
                      </p>
                      <ul>
                        <li>
                          Category: <b>{{ listing.categoryName }}</b>
                        </li>
                        <li>
                          Type: <b>{{ listing.subcategoryName }}</b>
                        </li>
                        <li>
                          Owner: <b>{{ ownerName(listing.ownerId) }}</b>
                        </li>
                        <li>
                          Price: <b>{{ formatMarketplaceListingPrice(listing) }}</b>
                        </li>
                        <li>
                          Updated: <b>{{ formatShortDate(listing.updatedAt) }}</b>
                        </li>
                      </ul>
                    </div>
                    <div class="moderation-actions">
                      <button
                        v-if="listing.moderationStatus !== 'approved'"
                        type="button"
                        class="approve"
                        :disabled="isProcessing"
                        :aria-busy="isProcessing && activeMarketplaceListingId === listing.id"
                        title="Approve listing"
                        :aria-label="`Approve ${listing.title}`"
                        @click="handleMarketplaceListingReview(listing.id, 'approved')"
                      >
                        <IonIcon :icon="checkmarkOutline" />
                      </button>
                      <button
                        v-if="listing.moderationStatus !== 'rejected'"
                        type="button"
                        class="reject"
                        :disabled="isProcessing"
                        :aria-busy="isProcessing && activeMarketplaceListingId === listing.id"
                        title="Reject listing"
                        :aria-label="`Reject ${listing.title}`"
                        @click="confirmMarketplaceListingRejection(listing.id, listing.title)"
                      >
                        <IonIcon :icon="closeOutline" />
                      </button>
                      <RouterLink :to="`/listings/${listing.id}`">
                        View details <IonIcon :icon="arrowForwardOutline" />
                      </RouterLink>
                    </div>
                  </article>
                  <p v-if="!allListings.length" class="admin-empty compact">
                    No universal marketplace submissions have been received yet.
                  </p>
                </div>
                <button
                  v-if="allListings.length > defaultPropertyLimit"
                  type="button"
                  class="universal-listing-toggle"
                  @click="showAllMarketplaceListings = !showAllMarketplaceListings"
                >
                  {{
                    showAllMarketplaceListings
                      ? 'Show fewer submissions'
                      : `View all ${allListings.length} submissions`
                  }}
                  <IonIcon
                    :icon="showAllMarketplaceListings ? chevronUpOutline : arrowForwardOutline"
                  />
                </button>
              </section>

              <div v-if="selectedPropertyIds.length" class="bulk-action-bar">
                <strong>{{ selectedPropertyIds.length }} selected</strong>
                <button type="button" @click="confirmBulkReview('approved')">
                  <IonIcon :icon="checkmarkOutline" /> Approve
                </button>
                <button type="button" class="danger" @click="confirmBulkReview('rejected')">
                  <IonIcon :icon="closeOutline" /> Reject
                </button>
                <button type="button" @click="exportSelectedProperties">
                  <IonIcon :icon="downloadOutline" /> Export CSV
                </button>
                <button type="button" class="plain" @click="selectedPropertyIds = []">Clear</button>
              </div>

              <div class="moderation-list">
                <div class="moderation-select-all">
                  <label
                    ><input
                      type="checkbox"
                      :checked="allVisiblePropertiesSelected"
                      @change="toggleAllVisibleProperties"
                    />
                    Select visible</label
                  >
                  <span
                    >{{ filteredProperties.length }}
                    {{ filteredProperties.length === 1 ? 'listing' : 'listings' }}</span
                  >
                </div>
                <article
                  v-for="property in visibleModeratedProperties"
                  :key="property.id"
                  class="moderation-row"
                >
                  <input
                    type="checkbox"
                    :checked="selectedPropertyIds.includes(property.id)"
                    :aria-label="`Select ${property.title}`"
                    @change="togglePropertySelection(property.id)"
                  />
                  <div class="property-thumbnail">
                    <img
                      v-if="property.images[0]"
                      :src="property.images[0]"
                      :alt="property.title"
                      loading="lazy"
                    />
                    <IonIcon v-else :icon="businessOutline" aria-hidden="true" />
                  </div>
                  <div class="property-row-copy">
                    <div>
                      <strong>{{ property.title }}</strong
                      ><span class="status-pill" :class="property.status">{{
                        titleCase(property.status)
                      }}</span>
                    </div>
                    <p><IonIcon :icon="locationOutline" /> {{ propertyLocation(property) }}</p>
                    <ul>
                      <li>
                        Owner: <b>{{ ownerName(property.ownerId) }}</b>
                      </li>
                      <li>
                        Role: <b>{{ titleCase(property.ownerRole) }}</b>
                      </li>
                      <li>
                        Availability:
                        <b>{{ property.isAvailable ? 'Available' : 'Unavailable' }}</b>
                      </li>
                      <li>
                        Rent: <b>{{ formatCurrency(property.rentPrice) }}</b>
                      </li>
                      <li>
                        Created: <b>{{ formatShortDate(property.createdAt) }}</b>
                      </li>
                    </ul>
                  </div>
                  <div class="moderation-actions">
                    <button
                      v-if="property.status !== 'approved'"
                      type="button"
                      class="approve"
                      :disabled="isProcessing"
                      :aria-busy="isProcessing && activePropertyId === property.id"
                      title="Approve listing"
                      :aria-label="`Approve ${property.title}`"
                      @click="handlePropertyReview(property.id, 'approved')"
                    >
                      <IonIcon :icon="checkmarkOutline" />
                    </button>
                    <button
                      v-if="property.status !== 'rejected'"
                      type="button"
                      class="reject"
                      :disabled="isProcessing"
                      :aria-busy="isProcessing && activePropertyId === property.id"
                      title="Reject listing"
                      :aria-label="`Reject ${property.title}`"
                      @click="confirmSinglePropertyRejection(property.id, property.title)"
                    >
                      <IonIcon :icon="closeOutline" />
                    </button>
                    <RouterLink :to="`/properties/${property.id}`"
                      >View details <IonIcon :icon="arrowForwardOutline"
                    /></RouterLink>
                  </div>
                </article>
                <p v-if="!filteredProperties.length" class="admin-empty">
                  No properties match the current moderation filters.
                </p>
              </div>
              <button
                v-if="filteredProperties.length > defaultPropertyLimit"
                type="button"
                class="widget-footer-command"
                @click="showAllProperties = !showAllProperties"
              >
                {{
                  showAllProperties
                    ? 'Show fewer properties'
                    : `View all ${filteredProperties.length} properties`
                }}
                <IonIcon :icon="showAllProperties ? chevronUpOutline : arrowForwardOutline" />
              </button>
            </template>
          </article>

          <article
            v-show="!isWidgetHidden('notifications')"
            id="notifications"
            class="admin-widget widget-notifications"
            :class="{ collapsed: isWidgetCollapsed('notifications') }"
            :style="widgetOrderStyle('notifications')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Notifications</h2>
                <p>{{ unreadNotificationCount }} unread across loaded records.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('notifications')"
                @click="toggleCollapsed('notifications')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('notifications') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <template v-if="!isWidgetCollapsed('notifications')">
              <div class="notification-widget-actions">
                <select v-model="notificationFilter" aria-label="Notification category">
                  <option value="all">All</option>
                  <option value="booking">Bookings</option>
                  <option value="payment">Payments</option>
                  <option value="reminder">Reminders</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  type="button"
                  :disabled="!unreadNotificationCount || isMarkingNotifications"
                  @click="markAllNotificationsRead"
                >
                  Mark all read
                </button>
              </div>
              <div class="notification-list">
                <button
                  v-for="notification in filteredNotifications.slice(0, 5)"
                  :key="notification.id"
                  type="button"
                  :class="{ unread: !notification.readAt }"
                  @click="openNotification(notification)"
                >
                  <span class="notification-icon" :class="notificationTone(notification.type)"
                    ><IonIcon :icon="notificationIcon(notification.type)"
                  /></span>
                  <span
                    ><strong>{{ notification.title }}</strong
                    ><small>{{ notification.body }}</small></span
                  >
                  <time>{{ relativeTime(notification.createdAt) }}</time>
                </button>
                <p v-if="!filteredNotifications.length" class="admin-empty compact">
                  No notification records yet.
                </p>
              </div>
              <RouterLink to="/notifications" class="widget-footer-command"
                >Open notification center <IonIcon :icon="arrowForwardOutline"
              /></RouterLink>
            </template>
          </article>

          <article
            v-show="!isWidgetHidden('analytics')"
            id="analytics"
            class="admin-widget widget-analytics"
            :class="{ collapsed: isWidgetCollapsed('analytics') }"
            :style="widgetOrderStyle('analytics')"
          >
            <header class="widget-heading">
              <div>
                <h2>Analytics overview</h2>
                <p>{{ selectedRangeLabel }} calculated from available RANDSA records.</p>
              </div>
              <div class="analytics-tabs" role="tablist" aria-label="Analytics metric">
                <button
                  v-for="mode in analyticsModes"
                  :key="mode.value"
                  type="button"
                  role="tab"
                  :aria-selected="analyticsMode === mode.value"
                  :class="{ active: analyticsMode === mode.value }"
                  @click="analyticsMode = mode.value"
                >
                  {{ mode.label }}
                </button>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('analytics')"
                @click="toggleCollapsed('analytics')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('analytics') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <template v-if="!isWidgetCollapsed('analytics')">
              <div class="analytics-main">
                <div class="analytics-chart-heading">
                  <span
                    ><small>{{ activeAnalyticsMetric.label }}</small
                    ><strong>{{ activeAnalyticsMetric.value }}</strong></span
                  ><em :class="activeAnalyticsMetric.trend >= 0 ? 'positive' : 'negative'">{{
                    formatTrend(activeAnalyticsMetric.trend)
                  }}</em>
                </div>
                <div class="analytics-chart">
                  <AdminTrendChart
                    :values="activeAnalyticsMetric.series"
                    :color="activeAnalyticsMetric.color"
                    :label="`${activeAnalyticsMetric.label} over ${selectedRangeLabel}`"
                    :height="180"
                  />
                </div>
                <div class="analytics-axis">
                  <span v-for="label in analyticsAxisLabels" :key="label">{{ label }}</span>
                </div>
              </div>
              <div class="analytics-summary-grid">
                <div v-for="summary in analyticsSummary" :key="summary.label">
                  <span
                    ><small>{{ summary.label }}</small
                    ><strong>{{ summary.value }}</strong></span
                  ><em :class="summary.trend >= 0 ? 'positive' : 'negative'">{{
                    formatTrend(summary.trend)
                  }}</em
                  ><AdminTrendChart
                    :values="summary.series"
                    :color="summary.color"
                    :label="`${summary.label} trend`"
                  />
                </div>
              </div>
              <div class="category-distribution">
                <h3>Property categories</h3>
                <div v-for="category in categoryDistribution" :key="category.label">
                  <span>{{ category.label }}</span
                  ><i><b :style="{ width: `${category.percentage}%` }" /></i
                  ><strong>{{ category.value }}</strong>
                </div>
                <p v-if="!categoryDistribution.length" class="admin-empty compact">
                  Category analytics will appear when properties are available.
                </p>
              </div>
            </template>
          </article>

          <article
            v-show="!isWidgetHidden('quick-actions')"
            class="admin-widget widget-quick-actions"
            :class="{ collapsed: isWidgetCollapsed('quick-actions') }"
            :style="widgetOrderStyle('quick-actions')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Quick actions</h2>
                <p>Supported administrative workflows.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('quick-actions')"
                @click="toggleCollapsed('quick-actions')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('quick-actions') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <div v-if="!isWidgetCollapsed('quick-actions')" class="quick-action-grid">
              <RouterLink to="/add-property"
                ><span class="blue"><IonIcon :icon="addCircleOutline" /></span
                ><strong>Create property</strong><small>Open listing assistant</small></RouterLink
              >
              <button type="button" @click="openPendingProperties">
                <span class="green"><IonIcon :icon="checkmarkCircleOutline" /></span
                ><strong>Approve listings</strong><small>{{ pendingPropertyCount }} pending</small>
              </button>
              <button type="button" @click="navigateToSection('verifications')">
                <span class="purple"><IonIcon :icon="shieldCheckmarkOutline" /></span
                ><strong>Review verification</strong
                ><small>{{ pendingVerificationCount }} pending</small>
              </button>
              <button type="button" @click="exportDataset('properties')">
                <span class="amber"><IonIcon :icon="downloadOutline" /></span
                ><strong>Export report</strong><small>Property CSV</small>
              </button>
              <button type="button" @click="exportDataset('bookings')">
                <span class="blue"><IonIcon :icon="calendarOutline" /></span
                ><strong>Booking report</strong><small>Download CSV</small>
              </button>
              <button type="button" @click="exportDataset('users')">
                <span class="purple"><IonIcon :icon="peopleOutline" /></span
                ><strong>User report</strong><small>Download CSV</small>
              </button>
            </div>
          </article>

          <article
            v-show="!isWidgetHidden('activity')"
            id="activity"
            class="admin-widget widget-activity"
            :class="{ collapsed: isWidgetCollapsed('activity') }"
            :style="widgetOrderStyle('activity')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Live activity</h2>
                <p>Newest loaded events first.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('activity')"
                @click="toggleCollapsed('activity')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('activity') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <ol v-if="!isWidgetCollapsed('activity')" class="activity-timeline">
              <li v-for="activity in recentActivity" :key="activity.id">
                <span :class="activity.tone"><IonIcon :icon="activity.icon" /></span>
                <button type="button" @click="openActivity(activity)">
                  <strong>{{ activity.title }}</strong
                  ><small>{{ activity.copy }}</small>
                </button>
                <time>{{ relativeTime(activity.timestamp) }}</time>
              </li>
              <li v-if="!recentActivity.length" class="admin-empty compact">
                No activity records are available.
              </li>
            </ol>
          </article>

          <article
            v-show="!isWidgetHidden('verifications')"
            id="verifications"
            class="admin-widget widget-verifications"
            :class="{ collapsed: isWidgetCollapsed('verifications') }"
            :style="widgetOrderStyle('verifications')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Verification queue</h2>
                <p>{{ pendingVerificationCount }} awaiting review.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('verifications')"
                @click="toggleCollapsed('verifications')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('verifications') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <div v-if="!isWidgetCollapsed('verifications')" class="verification-queue">
              <article
                v-for="request in requests.slice(0, showAllVerifications ? requests.length : 5)"
                :key="request.id"
                :class="{ expanded: activeVerificationId === request.id }"
              >
                <img
                  :src="request.profilePhoto.previewUrl"
                  :alt="`${request.fullName} verification photo`"
                  loading="lazy"
                />
                <div>
                  <strong>{{ request.fullName }}</strong
                  ><small>{{ formatDateTime(request.submittedAt) }}</small>
                </div>
                <span class="status-pill" :class="request.status">{{
                  titleCase(request.status)
                }}</span>
                <button
                  type="button"
                  :aria-label="`Review ${request.fullName}`"
                  @click="toggleVerificationReview(request.id)"
                >
                  <IonIcon :icon="chevronDownOutline" />
                </button>
                <div v-if="activeVerificationId === request.id" class="verification-review-form">
                  <p>{{ request.officeAddress }}</p>
                  <div class="verification-docs">
                    <a
                      :href="request.idDocument.remoteUrl || request.idDocument.previewUrl"
                      target="_blank"
                      rel="noreferrer"
                      >Open ID</a
                    >
                    <a
                      v-if="request.cacDocument"
                      :href="request.cacDocument.remoteUrl || request.cacDocument.previewUrl"
                      target="_blank"
                      rel="noreferrer"
                      >Open CAC</a
                    >
                    <a
                      :href="
                        request.authorizationDocument.remoteUrl ||
                        request.authorizationDocument.previewUrl
                      "
                      target="_blank"
                      rel="noreferrer"
                      >Authorization</a
                    >
                  </div>
                  <label
                    >Admin note<textarea
                      v-model="reviewNotes[request.id]"
                      rows="2"
                      placeholder="Required for rejection"
                    ></textarea>
                  </label>
                  <div>
                    <button
                      type="button"
                      class="approve"
                      :disabled="isProcessing"
                      :aria-busy="isProcessing && activeVerificationId === request.id"
                      @click="handleVerificationReview(request.id, 'approved')"
                    >
                      <IonIcon :icon="checkmarkOutline" /> Approve</button
                    ><button
                      type="button"
                      class="reject"
                      :disabled="isProcessing"
                      :aria-busy="isProcessing && activeVerificationId === request.id"
                      @click="handleVerificationReview(request.id, 'rejected')"
                    >
                      <IonIcon :icon="closeOutline" /> Reject
                    </button>
                  </div>
                </div>
              </article>
              <p v-if="!requests.length" class="admin-empty compact">
                No verification requests yet.
              </p>
              <button
                v-if="requests.length > 5"
                type="button"
                class="widget-footer-command"
                @click="showAllVerifications = !showAllVerifications"
              >
                {{ showAllVerifications ? 'Show fewer' : 'View full queue' }}
                <IonIcon :icon="arrowForwardOutline" />
              </button>
            </div>
          </article>

          <article
            v-show="!isWidgetHidden('users')"
            id="users"
            class="admin-widget widget-users"
            :class="{ collapsed: isWidgetCollapsed('users') }"
            :style="widgetOrderStyle('users')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>User overview</h2>
                <p>{{ userProfiles.length }} registered accounts.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('users')"
                @click="toggleCollapsed('users')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('users') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <template v-if="!isWidgetCollapsed('users')">
              <div class="user-overview-primary">
                <span class="large-avatar">{{ adminInitials }}</span>
                <div>
                  <strong>{{ adminName }}</strong
                  ><small>{{ state.profile?.email }}</small
                  ><em>Administrator</em>
                </div>
              </div>
              <div class="user-role-metrics">
                <div v-for="role in userRoleCounts" :key="role.label">
                  <span :class="role.tone"><IonIcon :icon="role.icon" /></span
                  ><small>{{ role.label }}</small
                  ><strong>{{ role.value }}</strong>
                </div>
              </div>
              <label class="user-search"
                ><IonIcon :icon="searchOutline" /><input
                  v-model.trim="userQuery"
                  type="search"
                  placeholder="Find a user..."
              /></label>
              <div class="user-list">
                <button
                  v-for="user in filteredUsers.slice(0, 5)"
                  :key="user.uid"
                  type="button"
                  @click="focusUser(user)"
                >
                  <span>{{ initialsFor(user.fullName || user.email) }}</span
                  ><span
                    ><strong>{{ user.fullName || user.email }}</strong
                    ><small>{{ user.email }}</small></span
                  ><em>{{ titleCase(user.role) }}</em>
                </button>
                <p v-if="!filteredUsers.length" class="admin-empty compact">
                  No users match this search.
                </p>
              </div>
            </template>
          </article>

          <article
            v-show="!isWidgetHidden('top-content')"
            class="admin-widget widget-top-content"
            :class="{ collapsed: isWidgetCollapsed('top-content') }"
            :style="widgetOrderStyle('top-content')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Top performing properties</h2>
                <p>Ranked from actual bookings and successful payments.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('top-content')"
                @click="toggleCollapsed('top-content')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('top-content') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <div v-if="!isWidgetCollapsed('top-content')" class="top-property-list">
              <RouterLink
                v-for="property in topPerformingProperties"
                :key="property.id"
                :to="`/properties/${property.id}`"
                ><div class="top-property-image">
                  <img
                    v-if="property.images[0]"
                    :src="property.images[0]"
                    :alt="property.title"
                    loading="lazy"
                  /><IonIcon v-else :icon="businessOutline" />
                </div>
                <span
                  ><strong>{{ property.title }}</strong
                  ><small>{{ property.bookings }} bookings</small></span
                ><em>{{ formatCurrency(property.revenue) }}</em></RouterLink
              >
              <p v-if="!topPerformingProperties.length" class="admin-empty compact">
                Performance rankings need booking or payment records.
              </p>
            </div>
          </article>

          <article
            v-show="!isWidgetHidden('insights')"
            class="admin-widget widget-insights"
            :class="{ collapsed: isWidgetCollapsed('insights') }"
            :style="widgetOrderStyle('insights')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>Business insights</h2>
                <p>Computed from the selected date range.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('insights')"
                @click="toggleCollapsed('insights')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('insights') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <div v-if="!isWidgetCollapsed('insights')" class="insight-list">
              <div v-for="insight in businessInsights" :key="insight.title">
                <span :class="insight.tone"><IonIcon :icon="insight.icon" /></span
                ><span
                  ><strong>{{ insight.title }}</strong
                  ><small>{{ insight.copy }}</small></span
                >
              </div>
            </div>
          </article>

          <article
            v-show="!isWidgetHidden('system-health')"
            id="system-health"
            class="admin-widget widget-system"
            :class="{ collapsed: isWidgetCollapsed('system-health') }"
            :style="widgetOrderStyle('system-health')"
          >
            <header class="widget-heading compact-heading">
              <div>
                <h2>System health</h2>
                <p>Last checked {{ lastCheckedLabel }}.</p>
              </div>
              <button
                type="button"
                :aria-label="widgetCollapseLabel('system-health')"
                @click="toggleCollapsed('system-health')"
              >
                <IonIcon
                  :icon="isWidgetCollapsed('system-health') ? chevronDownOutline : chevronUpOutline"
                />
              </button>
            </header>
            <template v-if="!isWidgetCollapsed('system-health')">
              <div class="system-list">
                <div v-for="service in systemServices" :key="service.label">
                  <span :class="service.tone"><IonIcon :icon="service.icon" /></span
                  ><strong>{{ service.label }}</strong
                  ><small>{{ service.detail }}</small
                  ><em :class="service.tone">{{ titleCase(service.tone) }}</em>
                </div>
              </div>
              <div class="current-session">
                <span><IonIcon :icon="desktopOutline" /></span>
                <div>
                  <strong>Current administrator session</strong
                  ><small>{{ currentBrowser }} on {{ currentOperatingSystem }}</small>
                </div>
                <em>Active now</em>
              </div>
            </template>
          </article>
        </section>
      </main>

      <button
        type="button"
        class="floating-quick-button"
        :aria-expanded="floatingActionsOpen"
        aria-label="Open quick actions"
        @click="floatingActionsOpen = !floatingActionsOpen"
      >
        <IonIcon :icon="floatingActionsOpen ? closeOutline : addOutline" />
      </button>
      <div v-if="floatingActionsOpen" class="floating-action-menu">
        <RouterLink to="/add-property"
          ><IonIcon :icon="addCircleOutline" /> Create property</RouterLink
        >
        <button type="button" @click="openPendingProperties">
          <IonIcon :icon="checkmarkCircleOutline" /> Review listings
        </button>
        <button type="button" @click="navigateToSection('verifications')">
          <IonIcon :icon="shieldCheckmarkOutline" /> Verify agents
        </button>
        <button type="button" @click="exportDataset('properties')">
          <IonIcon :icon="downloadOutline" /> Export properties
        </button>
      </div>

      <AdminCommandPalette
        v-model:open="commandPaletteOpen"
        :commands="adminCommands"
        :storage-key="commandStorageKey"
        @execute="executeAdminCommand"
      />

      <Teleport to="body">
        <div
          v-if="confirmationOpen"
          class="confirmation-backdrop"
          @mousedown.self="closeConfirmation"
        >
          <section
            class="confirmation-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmation-title"
            aria-describedby="confirmation-copy"
          >
            <span :class="confirmationTone"
              ><IonIcon
                :icon="confirmationTone === 'danger' ? alertCircleOutline : checkmarkCircleOutline"
            /></span>
            <h2 id="confirmation-title">{{ confirmationTitle }}</h2>
            <p id="confirmation-copy">{{ confirmationCopy }}</p>
            <div>
              <button type="button" class="secondary" @click="closeConfirmation">Cancel</button
              ><button
                type="button"
                :class="confirmationTone"
                :disabled="isProcessing"
                @click="runConfirmedAction"
              >
                {{ isProcessing ? 'Working...' : confirmationActionLabel }}
              </button>
            </div>
          </section>
        </div>
      </Teleport>
    </div>
  </AppShell>
</template>

<script setup lang="ts">
import { IonIcon } from '@ionic/vue'
import {
  addCircleOutline,
  addOutline,
  alertCircleOutline,
  analyticsOutline,
  arrowDownOutline,
  arrowForwardOutline,
  arrowUpOutline,
  bookmarkOutline,
  briefcaseOutline,
  businessOutline,
  calendarOutline,
  cardOutline,
  checkmarkCircleOutline,
  checkmarkOutline,
  chevronDownOutline,
  chevronForwardOutline,
  chevronUpOutline,
  closeOutline,
  cloudDoneOutline,
  cogOutline,
  desktopOutline,
  documentTextOutline,
  downloadOutline,
  filterOutline,
  homeOutline,
  informationCircleOutline,
  locationOutline,
  logOutOutline,
  menuOutline,
  notificationsOutline,
  optionsOutline,
  peopleOutline,
  personCircleOutline,
  refreshOutline,
  searchOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  statsChartOutline,
  storefrontOutline,
  timeOutline,
  trendingDownOutline,
  trendingUpOutline,
  walletOutline,
} from 'ionicons/icons'
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import AdminCommandPalette from '../components/admin/AdminCommandPalette.vue'
import AdminTrendChart from '../components/admin/AdminTrendChart.vue'
import AppShell from '../components/layout/AppShell.vue'
import { useAgentVerification } from '../composables/useAgentVerification'
import { signOutCurrentUser, useAuth } from '../composables/useAuth'
import { useListings } from '../composables/useListings'
import { useProperties } from '../composables/useProperties'
import { authMode, db, functions, storage } from '../lib/firebase'
import { listAllUserProfiles } from '../services/auth'
import { listBookingsForUser } from '../services/bookings'
import { markNotificationAsRead, watchAllNotificationsForAdmin } from '../services/notifications'
import { listPaymentsForUser } from '../services/payments'
import type { AdminCommandItem } from '../types/admin'
import type { BookingRecord } from '../types/booking'
import type { NotificationRecord, NotificationType } from '../types/notification'
import type { PaymentRecord } from '../types/payment'
import type { PropertyCategory, PropertyRecord, PropertyStatus } from '../types/property'
import type { ListingRecord } from '../types/listing'
import type { UserProfile } from '../types/user'

type DateRangeKey =
  | 'today'
  | 'yesterday'
  | 'last-7'
  | 'last-30'
  | 'last-90'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'custom'
type AnalyticsMode = 'revenue' | 'bookings' | 'users' | 'listings'
type PropertyStatusFilter = 'all' | PropertyStatus
type ConfirmationTone = 'primary' | 'danger'
type ExportDataset = 'properties' | 'users' | 'bookings' | 'payments'
type WidgetId =
  | 'properties'
  | 'notifications'
  | 'analytics'
  | 'quick-actions'
  | 'activity'
  | 'verifications'
  | 'users'
  | 'top-content'
  | 'insights'
  | 'system-health'

interface ActivityItem {
  id: string
  title: string
  copy: string
  timestamp: string
  category: string
  icon: string
  tone: string
  to?: string
  target?: string
}

interface SavedPropertyFilter {
  id: string
  name: string
  status: PropertyStatusFilter
  category: PropertyCategory | 'all'
  owner: string
  location: string
  availability: string
  minPrice: number | null
  maxPrice: number | null
}

const router = useRouter()
const { state } = useAuth()
const { properties, refresh: refreshProperties, reviewListing } = useProperties()
const {
  allListings,
  refreshAll: refreshAllMarketplaceListings,
  review: reviewMarketplaceListing,
} = useListings()
const { requests, refreshAll: refreshAllVerifications, reviewRequest } = useAgentVerification()

const userProfiles = ref<UserProfile[]>([])
const payments = ref<PaymentRecord[]>([])
const bookings = ref<BookingRecord[]>([])
const adminNotifications = ref<NotificationRecord[]>([])
const reviewNotes = reactive<Record<string, string>>({})
const actionMessage = ref('')
const actionTone = ref<'success' | 'error'>('success')
const dashboardLoadError = ref('')
const notificationLoadError = ref('')
const isProcessing = ref(false)
const isRefreshing = ref(false)
const hasLoadedOnce = ref(false)
const isSigningOut = ref(false)
const isMarkingNotifications = ref(false)
const activePropertyId = ref('')
const activeMarketplaceListingId = ref('')
const activeVerificationId = ref('')
const activeSection = ref('overview')
const mobileSidebarOpen = ref(false)
const commandPaletteOpen = ref(false)
const notificationDrawerOpen = ref(false)
const customizerOpen = ref(false)
const floatingActionsOpen = ref(false)
const propertyFiltersOpen = ref(false)
const showAllProperties = ref(false)
const showAllMarketplaceListings = ref(false)
const showAllVerifications = ref(false)
const propertyQuery = ref('')
const propertyStatusFilter = ref<PropertyStatusFilter>('all')
const propertyCategoryFilter = ref<PropertyCategory | 'all'>('all')
const propertyOwnerFilter = ref('all')
const propertyLocationFilter = ref('')
const propertyAvailabilityFilter = ref('all')
const propertyMinPrice = ref<number | null>(null)
const propertyMaxPrice = ref<number | null>(null)
const selectedPropertyIds = ref<string[]>([])
const selectedSavedFilterId = ref('')
const savedPropertyFilters = ref<SavedPropertyFilter[]>([])
const userQuery = ref('')
const notificationFilter = ref('all')
const analyticsMode = ref<AnalyticsMode>('revenue')
const selectedRange = ref<DateRangeKey>('last-30')
const currentDate = new Date()
const customRange = reactive({
  start: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10),
  end: currentDate.toISOString().slice(0, 10),
})
const lastCheckedAt = ref(new Date())
const confirmationOpen = ref(false)
const confirmationTitle = ref('')
const confirmationCopy = ref('')
const confirmationActionLabel = ref('Confirm')
const confirmationTone = ref<ConfirmationTone>('primary')
const pendingConfirmedAction = ref<null | (() => Promise<void>)>(null)

const widgetDefinitions: { id: WidgetId; label: string }[] = [
  { id: 'properties', label: 'Property moderation' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'analytics', label: 'Analytics overview' },
  { id: 'quick-actions', label: 'Quick actions' },
  { id: 'activity', label: 'Live activity' },
  { id: 'verifications', label: 'Verification queue' },
  { id: 'users', label: 'User overview' },
  { id: 'top-content', label: 'Top properties' },
  { id: 'insights', label: 'Business insights' },
  { id: 'system-health', label: 'System health' },
]
const defaultWidgetOrder = widgetDefinitions.map((widget) => widget.id)
const widgetOrder = ref<WidgetId[]>([...defaultWidgetOrder])
const hiddenWidgetIds = ref<WidgetId[]>([])
const collapsedWidgetIds = ref<WidgetId[]>([])

const defaultPropertyLimit = 6
let refreshIntervalId = 0
let stopNotificationWatcher: (() => void) | null = null

const adminName = computed(() => state.profile?.fullName || state.profile?.email || 'RANDSA Admin')
const adminFirstName = computed(() => adminName.value.trim().split(/\s+/)[0] || 'Admin')
const adminInitials = computed(() => initialsFor(adminName.value))
const adminRoleLabel = computed(() =>
  state.profile?.role === 'admin' ? 'Administrator' : titleCase(state.profile?.role || 'account')
)
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
const isMacPlatform = computed(
  () => typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
)
const currentDateLabel = computed(() =>
  new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    currentDate
  )
)
const currentTimeLabel = computed(() =>
  new Intl.DateTimeFormat('en-NG', {
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(currentDate)
)
const isInitialLoading = computed(() => isRefreshing.value && !hasLoadedOnce.value)
const commandStorageKey = computed(() => `randsa.admin.commands.${state.profile?.uid || 'default'}`)
const widgetStorageKey = computed(() => `randsa.admin.widgets.${state.profile?.uid || 'default'}`)
const filterStorageKey = computed(
  () => `randsa.admin.property-filters.${state.profile?.uid || 'default'}`
)

const pendingPropertyCount = computed(
  () => properties.value.filter((property) => property.status === 'pending').length
)
const pendingMarketplaceListingCount = computed(
  () => allListings.value.filter((listing) => listing.moderationStatus === 'pending').length
)
const totalPendingListingCount = computed(
  () => pendingPropertyCount.value + pendingMarketplaceListingCount.value
)
const pendingVerificationCount = computed(
  () => requests.value.filter((request) => request.status === 'pending').length
)
const unreadNotificationCount = computed(
  () => adminNotifications.value.filter((notification) => !notification.readAt).length
)

const adminNavigation = computed(() => [
  { id: 'overview', label: 'Control Center', target: 'overview', icon: homeOutline, badge: 0 },
  {
    id: 'properties',
    label: 'Marketplace Management',
    target: 'properties',
    icon: storefrontOutline,
    badge: totalPendingListingCount.value,
  },
  {
    id: 'verifications',
    label: 'Verification Center',
    target: 'verifications',
    icon: shieldCheckmarkOutline,
    badge: pendingVerificationCount.value,
  },
  { id: 'bookings', label: 'Booking Center', target: 'analytics', icon: calendarOutline, badge: 0 },
  { id: 'payments', label: 'Financial Center', target: 'analytics', icon: cardOutline, badge: 0 },
  { id: 'users', label: 'User Management', target: 'users', icon: peopleOutline, badge: 0 },
  {
    id: 'analytics',
    label: 'Insights & Analytics',
    target: 'analytics',
    icon: statsChartOutline,
    badge: 0,
  },
  {
    id: 'notifications',
    label: 'Notifications',
    target: 'notifications',
    icon: notificationsOutline,
    badge: unreadNotificationCount.value,
  },
  {
    id: 'system',
    label: 'System Health',
    target: 'system-health',
    icon: cloudDoneOutline,
    badge: 0,
  },
])

const rangeOptions: { value: DateRangeKey; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last-7', label: 'Last 7 days' },
  { value: 'last-30', label: 'Last 30 days' },
  { value: 'last-90', label: 'Last 90 days' },
  { value: 'this-month', label: 'This month' },
  { value: 'last-month', label: 'Last month' },
  { value: 'this-year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
]
const selectedRangeLabel = computed(
  () => rangeOptions.find((range) => range.value === selectedRange.value)?.label || 'Selected range'
)

const ownerProfileMap = computed(() => new Map(userProfiles.value.map((user) => [user.uid, user])))
const propertyTitleMap = computed(
  () => new Map(properties.value.map((property) => [property.id, property.title]))
)
const propertyCategories = computed(() =>
  [...new Set(properties.value.map((property) => property.category))].sort()
)
const propertyOwners = computed(() => {
  const ownerIds = new Set(properties.value.map((property) => property.ownerId))
  return userProfiles.value.filter((user) => ownerIds.has(user.uid))
})

const propertyTabs = computed(() => [
  { value: 'all' as const, label: 'All', count: properties.value.length },
  { value: 'pending' as const, label: 'Pending', count: pendingPropertyCount.value },
  {
    value: 'approved' as const,
    label: 'Approved',
    count: properties.value.filter((property) => property.status === 'approved').length,
  },
  {
    value: 'rejected' as const,
    label: 'Rejected',
    count: properties.value.filter((property) => property.status === 'rejected').length,
  },
])

const visibleMarketplaceListings = computed(() =>
  [...allListings.value]
    .sort((left, right) => {
      if (left.moderationStatus === 'pending' && right.moderationStatus !== 'pending') return -1
      if (left.moderationStatus !== 'pending' && right.moderationStatus === 'pending') return 1
      return right.updatedAt.localeCompare(left.updatedAt)
    })
    .slice(0, showAllMarketplaceListings.value ? undefined : defaultPropertyLimit)
)

const filteredProperties = computed(() => {
  const query = propertyQuery.value.toLowerCase()
  const location = propertyLocationFilter.value.toLowerCase()
  return [...properties.value]
    .filter(
      (property) =>
        propertyStatusFilter.value === 'all' || property.status === propertyStatusFilter.value
    )
    .filter(
      (property) =>
        propertyCategoryFilter.value === 'all' || property.category === propertyCategoryFilter.value
    )
    .filter(
      (property) =>
        propertyOwnerFilter.value === 'all' || property.ownerId === propertyOwnerFilter.value
    )
    .filter(
      (property) =>
        propertyAvailabilityFilter.value === 'all' ||
        property.isAvailable === (propertyAvailabilityFilter.value === 'available')
    )
    .filter(
      (property) => propertyMinPrice.value === null || property.rentPrice >= propertyMinPrice.value
    )
    .filter(
      (property) => propertyMaxPrice.value === null || property.rentPrice <= propertyMaxPrice.value
    )
    .filter(
      (property) =>
        !location ||
        [property.state, property.city, property.area, property.address]
          .join(' ')
          .toLowerCase()
          .includes(location)
    )
    .filter(
      (property) =>
        !query ||
        [property.title, property.propertyType, property.ownerRole, property.city, property.state]
          .join(' ')
          .toLowerCase()
          .includes(query)
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
})
const visibleModeratedProperties = computed(() =>
  showAllProperties.value
    ? filteredProperties.value
    : filteredProperties.value.slice(0, defaultPropertyLimit)
)
const allVisiblePropertiesSelected = computed(
  () =>
    visibleModeratedProperties.value.length > 0 &&
    visibleModeratedProperties.value.every((property) =>
      selectedPropertyIds.value.includes(property.id)
    )
)

const filteredNotifications = computed(() => {
  if (notificationFilter.value === 'all') return adminNotifications.value
  return adminNotifications.value.filter((notification) => {
    if (notificationFilter.value === 'booking') return notification.type === 'booking_confirmation'
    if (notificationFilter.value === 'payment') return notification.type === 'payment_confirmation'
    if (notificationFilter.value === 'reminder')
      return (
        notification.type === 'inspection_reminder' || notification.type === 'rent_due_reminder'
      )
    return notification.type === 'admin_message'
  })
})

const dateBounds = computed(() => getDateBounds(selectedRange.value))
const previousDateBounds = computed(() => {
  const duration = Math.max(
    86400000,
    dateBounds.value.end.getTime() - dateBounds.value.start.getTime() + 1
  )
  const end = new Date(dateBounds.value.start.getTime() - 1)
  return { start: new Date(end.getTime() - duration + 1), end }
})
const rangedPayments = computed(() =>
  payments.value.filter((payment) => inBounds(payment.createdAt, dateBounds.value))
)
const previousPayments = computed(() =>
  payments.value.filter((payment) => inBounds(payment.createdAt, previousDateBounds.value))
)
const rangedBookings = computed(() =>
  bookings.value.filter((booking) => inBounds(booking.createdAt, dateBounds.value))
)
const previousBookings = computed(() =>
  bookings.value.filter((booking) => inBounds(booking.createdAt, previousDateBounds.value))
)
const rangedUsers = computed(() =>
  userProfiles.value.filter((user) => inBounds(user.createdAt, dateBounds.value))
)
const previousUsers = computed(() =>
  userProfiles.value.filter((user) => inBounds(user.createdAt, previousDateBounds.value))
)
const listingSubmissions = computed(() => [...properties.value, ...allListings.value])
const rangedListingSubmissions = computed(() =>
  listingSubmissions.value.filter((listing) => inBounds(listing.createdAt, dateBounds.value))
)
const previousListingSubmissions = computed(() =>
  listingSubmissions.value.filter((listing) =>
    inBounds(listing.createdAt, previousDateBounds.value)
  )
)
const currentRevenue = computed(() =>
  rangedPayments.value
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + payment.amount, 0)
)
const previousRevenue = computed(() =>
  previousPayments.value
    .filter((payment) => payment.status === 'success')
    .reduce((sum, payment) => sum + payment.amount, 0)
)

const revenueSeries = computed(() =>
  buildSeries(
    payments.value.filter((payment) => payment.status === 'success'),
    (payment) => payment.createdAt,
    (payment) => payment.amount
  )
)
const bookingSeries = computed(() => buildSeries(bookings.value, (booking) => booking.createdAt))
const userSeries = computed(() => buildSeries(userProfiles.value, (user) => user.createdAt))
const listingSeries = computed(() =>
  buildSeries(listingSubmissions.value, (listing) => listing.createdAt)
)
const notificationSeries = computed(() =>
  buildSeries(adminNotifications.value, (notification) => notification.createdAt)
)

const metrics = computed(() => [
  {
    label: 'Pending listings',
    value: formatNumber(totalPendingListingCount.value),
    icon: homeOutline,
    tone: 'blue',
    color: 'var(--rd-brass)',
    series: listingSeries.value,
    trend: null,
    trendTone: totalPendingListingCount.value ? 'negative' : 'positive',
    trendLabel: 'Current review queue',
  },
  {
    label: 'Verification queue',
    value: formatNumber(pendingVerificationCount.value),
    icon: shieldCheckmarkOutline,
    tone: 'purple',
    color: '#8b5cf6',
    series: buildSeries(requests.value, (request) => request.submittedAt),
    trend: null,
    trendTone: 'neutral',
    trendLabel: 'Awaiting decision',
  },
  {
    label: 'Revenue tracked',
    value: formatCompactCurrency(currentRevenue.value),
    icon: walletOutline,
    tone: 'green',
    color: '#16a36a',
    series: revenueSeries.value,
    trend: percentChange(currentRevenue.value, previousRevenue.value),
    trendTone: currentRevenue.value >= previousRevenue.value ? 'positive' : 'negative',
    trendLabel: formatTrend(percentChange(currentRevenue.value, previousRevenue.value)),
  },
  {
    label: 'Bookings tracked',
    value: formatNumber(rangedBookings.value.length),
    icon: calendarOutline,
    tone: 'amber',
    color: '#f58b18',
    series: bookingSeries.value,
    trend: percentChange(rangedBookings.value.length, previousBookings.value.length),
    trendTone:
      rangedBookings.value.length >= previousBookings.value.length ? 'positive' : 'negative',
    trendLabel: formatTrend(
      percentChange(rangedBookings.value.length, previousBookings.value.length)
    ),
  },
  {
    label: 'Registered users',
    value: formatNumber(userProfiles.value.length),
    icon: peopleOutline,
    tone: 'blue',
    color: '#2f7ff3',
    series: userSeries.value,
    trend: percentChange(rangedUsers.value.length, previousUsers.value.length),
    trendTone: rangedUsers.value.length >= previousUsers.value.length ? 'positive' : 'negative',
    trendLabel: `${rangedUsers.value.length} new in range`,
  },
  {
    label: 'Unread alerts',
    value: formatNumber(unreadNotificationCount.value),
    icon: notificationsOutline,
    tone: 'red',
    color: '#eb4762',
    series: notificationSeries.value,
    trend: null,
    trendTone: unreadNotificationCount.value ? 'negative' : 'positive',
    trendLabel: unreadNotificationCount.value ? 'Needs attention' : 'Inbox clear',
  },
])

const analyticsModes: { value: AnalyticsMode; label: string }[] = [
  { value: 'revenue', label: 'Revenue' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'users', label: 'Users' },
  { value: 'listings', label: 'Listings' },
]
const analyticsMetrics = computed(() => ({
  revenue: {
    label: 'Successful payment revenue',
    value: formatCurrency(currentRevenue.value),
    trend: percentChange(currentRevenue.value, previousRevenue.value),
    series: revenueSeries.value,
    color: 'var(--rd-brass)',
  },
  bookings: {
    label: 'Bookings created',
    value: formatNumber(rangedBookings.value.length),
    trend: percentChange(rangedBookings.value.length, previousBookings.value.length),
    series: bookingSeries.value,
    color: '#f58b18',
  },
  users: {
    label: 'Users registered',
    value: formatNumber(rangedUsers.value.length),
    trend: percentChange(rangedUsers.value.length, previousUsers.value.length),
    series: userSeries.value,
    color: '#16a36a',
  },
  listings: {
    label: 'Listings submitted',
    value: formatNumber(rangedListingSubmissions.value.length),
    trend: percentChange(
      rangedListingSubmissions.value.length,
      previousListingSubmissions.value.length
    ),
    series: listingSeries.value,
    color: '#8b5cf6',
  },
}))
const activeAnalyticsMetric = computed(() => analyticsMetrics.value[analyticsMode.value])
const analyticsSummary = computed(() => [
  analyticsMetrics.value.revenue,
  analyticsMetrics.value.bookings,
  analyticsMetrics.value.listings,
  analyticsMetrics.value.users,
])
const analyticsAxisLabels = computed(() => buildAxisLabels())
const categoryDistribution = computed(() => {
  const counts = new Map<string, number>()
  for (const property of properties.value)
    counts.set(property.category, (counts.get(property.category) || 0) + 1)
  const max = Math.max(...counts.values(), 1)
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([label, value]) => ({ label: titleCase(label), value, percentage: (value / max) * 100 }))
})

const recentActivity = computed<ActivityItem[]>(() => {
  const propertyActivity = properties.value.map((property) => ({
    id: `property-${property.id}`,
    title:
      property.status === 'approved'
        ? 'Property approved'
        : property.status === 'rejected'
          ? 'Property rejected'
          : 'Property submitted',
    copy: property.title,
    timestamp: property.updatedAt || property.createdAt,
    category: 'Properties',
    icon:
      property.status === 'pending'
        ? timeOutline
        : property.status === 'approved'
          ? checkmarkCircleOutline
          : closeOutline,
    tone:
      property.status === 'approved' ? 'green' : property.status === 'rejected' ? 'red' : 'amber',
    to: `/properties/${property.id}`,
  }))
  const verificationActivity = requests.value.map((request) => ({
    id: `verification-${request.id}`,
    title:
      request.status === 'pending' ? 'Verification submitted' : `Verification ${request.status}`,
    copy: request.fullName,
    timestamp: request.reviewedAt || request.submittedAt,
    category: 'Verification',
    icon: shieldCheckmarkOutline,
    tone:
      request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'purple',
    target: 'verifications',
  }))
  const paymentActivity = payments.value.map((payment) => ({
    id: `payment-${payment.id}`,
    title: payment.status === 'success' ? 'Payment successful' : `Payment ${payment.status}`,
    copy: `${payment.propertyTitle} - ${formatCurrency(payment.amount)}`,
    timestamp: payment.verifiedAt || payment.createdAt,
    category: 'Payments',
    icon: cardOutline,
    tone: payment.status === 'success' ? 'green' : payment.status === 'failed' ? 'red' : 'amber',
    target: 'analytics',
  }))
  const bookingActivity = bookings.value.map((booking) => ({
    id: `booking-${booking.id}`,
    title: `Booking ${booking.status}`,
    copy: propertyTitleMap.value.get(booking.propertyId) || 'Property unavailable',
    timestamp: booking.updatedAt || booking.createdAt,
    category: 'Bookings',
    icon: calendarOutline,
    tone:
      booking.status === 'cancelled' ? 'red' : booking.status === 'completed' ? 'green' : 'blue',
    target: 'analytics',
  }))
  const userActivity = userProfiles.value.map((user) => ({
    id: `user-${user.uid}`,
    title: 'User registered',
    copy: user.fullName || user.email,
    timestamp: toIsoString(user.createdAt),
    category: 'Users',
    icon: peopleOutline,
    tone: 'blue',
    target: 'users',
  }))
  return [
    ...propertyActivity,
    ...verificationActivity,
    ...paymentActivity,
    ...bookingActivity,
    ...userActivity,
  ]
    .filter((activity) => validDate(activity.timestamp))
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime())
    .slice(0, 9)
})

const filteredUsers = computed(() => {
  const query = userQuery.value.toLowerCase()
  return userProfiles.value.filter(
    (user) =>
      !query ||
      [user.fullName, user.email, user.phone, user.role].join(' ').toLowerCase().includes(query)
  )
})
const userRoleCounts = computed(() => [
  {
    label: 'Standard accounts',
    value: userProfiles.value.filter((user) => user.role !== 'admin').length,
    icon: personCircleOutline,
    tone: 'blue',
  },
  {
    label: 'Verified',
    value: userProfiles.value.filter((user) => user.isVerified || user.isVerifiedAgent).length,
    icon: homeOutline,
    tone: 'green',
  },
  {
    label: 'Legacy profiles',
    value: userProfiles.value.filter((user) => ['tenant', 'landlord', 'agent'].includes(user.role))
      .length,
    icon: briefcaseOutline,
    tone: 'purple',
  },
  {
    label: 'Admins',
    value: userProfiles.value.filter((user) => user.role === 'admin').length,
    icon: shieldCheckmarkOutline,
    tone: 'red',
  },
])

const topPerformingProperties = computed(() => {
  const bookingCounts = new Map<string, number>()
  const revenues = new Map<string, number>()
  for (const booking of bookings.value)
    bookingCounts.set(booking.propertyId, (bookingCounts.get(booking.propertyId) || 0) + 1)
  for (const payment of payments.value.filter((payment) => payment.status === 'success'))
    revenues.set(payment.propertyId, (revenues.get(payment.propertyId) || 0) + payment.amount)
  return properties.value
    .map((property) => ({
      ...property,
      bookings: bookingCounts.get(property.id) || 0,
      revenue: revenues.get(property.id) || 0,
    }))
    .filter((property) => property.bookings || property.revenue)
    .sort((left, right) => right.revenue - left.revenue || right.bookings - left.bookings)
    .slice(0, 5)
})

const businessInsights = computed(() => {
  const revenueTrend = percentChange(currentRevenue.value, previousRevenue.value)
  const bookingDays = rangedBookings.value.reduce<Record<string, number>>((result, booking) => {
    const date = parseDate(booking.createdAt)
    if (date)
      result[new Intl.DateTimeFormat('en-NG', { weekday: 'long' }).format(date)] =
        (result[new Intl.DateTimeFormat('en-NG', { weekday: 'long' }).format(date)] || 0) + 1
    return result
  }, {})
  const busiestDay = Object.entries(bookingDays).sort((left, right) => right[1] - left[1])[0]
  const topCategory = categoryDistribution.value[0]
  return [
    {
      title:
        revenueTrend === 0
          ? 'Revenue is steady'
          : `Revenue ${revenueTrend > 0 ? 'increased' : 'decreased'} ${Math.abs(revenueTrend)}%`,
      copy: `Compared with the previous matching period using successful payments.`,
      icon: revenueTrend >= 0 ? trendingUpOutline : trendingDownOutline,
      tone: revenueTrend >= 0 ? 'green' : 'red',
    },
    {
      title: `${pendingPropertyCount.value} listings await review`,
      copy: pendingPropertyCount.value
        ? 'The moderation queue is ready for an administrator decision.'
        : 'There are no pending property submissions.',
      icon: homeOutline,
      tone: pendingPropertyCount.value ? 'amber' : 'green',
    },
    {
      title: busiestDay ? `${busiestDay[0]} is the busiest booking day` : 'No booking pattern yet',
      copy: busiestDay
        ? `${busiestDay[1]} bookings were created on that weekday in the selected range.`
        : 'Booking insights will update as records are created.',
      icon: calendarOutline,
      tone: 'blue',
    },
    {
      title: topCategory ? `${topCategory.label} leads inventory` : 'No category leader yet',
      copy: topCategory
        ? `${topCategory.value} current listings belong to this category.`
        : 'Property category insights need listing records.',
      icon: sparklesOutline,
      tone: 'purple',
    },
  ]
})

const orderedWidgets = computed(() =>
  widgetOrder.value
    .map((id) => widgetDefinitions.find((widget) => widget.id === id))
    .filter((widget): widget is { id: WidgetId; label: string } => Boolean(widget))
)
const lastCheckedLabel = computed(() =>
  new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(lastCheckedAt.value)
)
const systemServices = computed(() => [
  {
    label: 'Firebase Authentication',
    detail: state.user
      ? authMode === 'local'
        ? 'Local development session'
        : 'Signed-in session'
      : 'No active session',
    icon: shieldCheckmarkOutline,
    tone: state.user ? (authMode === 'local' ? 'warning' : 'healthy') : 'offline',
  },
  {
    label: 'Cloud Firestore',
    detail:
      authMode === 'local'
        ? 'Local development data'
        : dashboardLoadError.value
          ? 'Latest query failed'
          : db
            ? 'Admin queries completed'
            : 'Not configured',
    icon: cloudDoneOutline,
    tone:
      authMode === 'local' ? 'warning' : dashboardLoadError.value || !db ? 'offline' : 'healthy',
  },
  {
    label: 'Cloud Storage',
    detail: storage ? 'Configured; no active probe' : 'Not configured',
    icon: documentTextOutline,
    tone: storage ? 'warning' : 'offline',
  },
  {
    label: 'Cloud Functions',
    detail: functions ? 'Configured; no active probe' : 'Not configured',
    icon: cogOutline,
    tone: functions ? 'warning' : 'offline',
  },
  {
    label: 'Cloud Messaging',
    detail:
      typeof window !== 'undefined' && 'Notification' in window
        ? `Browser permission: ${window.Notification.permission}`
        : 'Browser messaging unavailable',
    icon: notificationsOutline,
    tone:
      typeof window !== 'undefined' &&
      'Notification' in window &&
      window.Notification.permission === 'granted'
        ? 'healthy'
        : 'warning',
  },
])
const currentBrowser = computed(() => detectBrowser())
const currentOperatingSystem = computed(() => detectOperatingSystem())

const adminCommands = computed<AdminCommandItem[]>(() => {
  const staticCommands: AdminCommandItem[] = [
    {
      id: 'section:overview',
      label: 'Control Center',
      description: 'Open the admin overview',
      category: 'Navigation',
      keywords: ['home dashboard admin'],
      icon: homeOutline,
      to: '#overview',
    },
    {
      id: 'section:properties',
      label: 'Marketplace Management',
      description: `${properties.value.length} loaded listings`,
      category: 'Navigation',
      keywords: ['listings moderation approve reject'],
      icon: storefrontOutline,
      to: '#properties',
    },
    {
      id: 'section:users',
      label: 'User Management',
      description: `${userProfiles.value.length} registered accounts`,
      category: 'Navigation',
      keywords: ['users accounts profiles administrators'],
      icon: peopleOutline,
      to: '#users',
    },
    {
      id: 'section:verifications',
      label: 'Verification Center',
      description: `${pendingVerificationCount.value} pending requests`,
      category: 'Navigation',
      keywords: ['professional identity review'],
      icon: shieldCheckmarkOutline,
      to: '#verifications',
    },
    {
      id: 'section:analytics',
      label: 'Insights & Analytics',
      description: 'Revenue, bookings, users, and listings',
      category: 'Navigation',
      keywords: ['reports charts payments growth'],
      icon: analyticsOutline,
      to: '#analytics',
    },
    {
      id: 'section:notifications',
      label: 'Notification Center',
      description: `${unreadNotificationCount.value} unread alerts`,
      category: 'Navigation',
      keywords: ['alerts messages reminders'],
      icon: notificationsOutline,
      to: '#notifications',
    },
    {
      id: 'section:system',
      label: 'System Health',
      description: 'Firebase service and session status',
      category: 'Navigation',
      keywords: ['status functions storage firestore'],
      icon: cloudDoneOutline,
      to: '#system-health',
    },
    {
      id: 'route:add-property',
      label: 'Create property',
      description: 'Open the listing assistant',
      category: 'Quick actions',
      keywords: ['add listing'],
      icon: addCircleOutline,
      to: '/add-property',
    },
    {
      id: 'action:refresh',
      label: 'Refresh dashboard',
      description: 'Reload all available admin records',
      category: 'Quick actions',
      keywords: ['sync update'],
      icon: refreshOutline,
      action: 'refresh',
    },
    {
      id: 'export:properties',
      label: 'Export properties',
      description: 'Download all loaded properties as CSV',
      category: 'Exports',
      keywords: ['report listings csv'],
      icon: downloadOutline,
      action: 'export-properties',
    },
    {
      id: 'export:users',
      label: 'Export users',
      description: 'Download registered users as CSV',
      category: 'Exports',
      keywords: ['report accounts csv'],
      icon: downloadOutline,
      action: 'export-users',
    },
    {
      id: 'export:bookings',
      label: 'Export bookings',
      description: 'Download booking records as CSV',
      category: 'Exports',
      keywords: ['report reservations csv'],
      icon: downloadOutline,
      action: 'export-bookings',
    },
    {
      id: 'export:payments',
      label: 'Export payments',
      description: 'Download payment records as CSV',
      category: 'Exports',
      keywords: ['report finance revenue csv'],
      icon: downloadOutline,
      action: 'export-payments',
    },
    {
      id: 'route:account',
      label: 'Account Center',
      description: 'Open administrator account settings',
      category: 'Settings',
      keywords: ['profile preferences security'],
      icon: cogOutline,
      to: '/profile',
    },
  ]
  const propertyCommands = properties.value.map((property) => ({
    id: `property:${property.id}`,
    label: property.title,
    description: `${titleCase(property.status)} - ${propertyLocation(property)}`,
    category: 'Properties',
    keywords: [property.propertyType, property.ownerRole, property.city, property.state],
    icon: homeOutline,
    to: `/properties/${property.id}`,
  }))
  const userCommands = userProfiles.value.slice(0, 30).map((user) => ({
    id: `user:${user.uid}`,
    label: user.fullName || user.email,
    description: `${titleCase(user.role)} - ${user.email}`,
    category: 'Users',
    keywords: [user.email, user.phone, user.role],
    icon: peopleOutline,
    to: '#users',
  }))
  const bookingCommands = bookings.value.slice(0, 30).map((booking) => ({
    id: `booking:${booking.id}`,
    label: propertyTitleMap.value.get(booking.propertyId) || 'Property booking',
    description: `${titleCase(booking.status)} - ${formatShortDate(booking.createdAt)}`,
    category: 'Bookings',
    keywords: [booking.id, booking.guestPhone, booking.paymentStatus],
    icon: calendarOutline,
    to: '#analytics',
  }))
  const paymentCommands = payments.value.slice(0, 30).map((payment) => ({
    id: `payment:${payment.id}`,
    label: payment.propertyTitle,
    description: `${formatCurrency(payment.amount)} - ${titleCase(payment.status)}`,
    category: 'Payments',
    keywords: [payment.payerName, payment.payerEmail, payment.paystackReference],
    icon: cardOutline,
    to: '#analytics',
  }))
  const verificationCommands = requests.value.slice(0, 30).map((request) => ({
    id: `verification:${request.id}`,
    label: request.fullName,
    description: `${titleCase(request.status)} verification request`,
    category: 'Verification requests',
    keywords: [request.phone, request.officeAddress, request.status],
    icon: shieldCheckmarkOutline,
    to: '#verifications',
  }))
  return [
    ...staticCommands,
    ...propertyCommands,
    ...userCommands,
    ...bookingCommands,
    ...paymentCommands,
    ...verificationCommands,
  ]
})

onMounted(async () => {
  loadWidgetPreferences()
  loadSavedPropertyFilters()
  stopNotificationWatcher = watchAllNotificationsForAdmin(
    (records) => {
      adminNotifications.value = records
      notificationLoadError.value = ''
    },
    (error) => {
      notificationLoadError.value = error.message
    }
  )
  await handleRefresh()
  refreshIntervalId = window.setInterval(() => void handleRefresh(true), 60000)
})

onBeforeUnmount(() => {
  stopNotificationWatcher?.()
  if (refreshIntervalId) window.clearInterval(refreshIntervalId)
})

async function handleRefresh(silent = false) {
  if (isRefreshing.value) return
  isRefreshing.value = true
  if (!silent) actionMessage.value = ''
  dashboardLoadError.value = ''

  try {
    await Promise.all([
      refreshProperties(),
      refreshAllMarketplaceListings(),
      refreshAllVerifications(),
    ])
    const users = await listAllUserProfiles()
    const [allPayments, allBookings] = await Promise.all([
      Promise.all(users.map((user) => listPaymentsForUser(user.uid))),
      Promise.all(users.map((user) => listBookingsForUser(user.uid))),
    ])
    userProfiles.value = users
    payments.value = deduplicateById(allPayments.flat())
    bookings.value = deduplicateById(allBookings.flat())
    for (const request of requests.value) reviewNotes[request.id] = request.adminNote
    lastCheckedAt.value = new Date()
    hasLoadedOnce.value = true
  } catch (error) {
    dashboardLoadError.value =
      error instanceof Error ? error.message : 'Could not refresh the admin dashboard.'
    if (authMode !== 'local') dashboardLoadError.value += ' Existing loaded records remain visible.'
    hasLoadedOnce.value = true
  } finally {
    isRefreshing.value = false
  }
}

async function handlePropertyReview(propertyId: string, status: 'approved' | 'rejected') {
  if (!state.profile) return showError('Sign in as an admin before reviewing property listings.')
  isProcessing.value = true
  activePropertyId.value = propertyId
  try {
    await reviewListing(propertyId, state.profile, status)
    showSuccess(
      status === 'approved' ? 'Property approved successfully.' : 'Property rejected successfully.'
    )
    selectedPropertyIds.value = selectedPropertyIds.value.filter((id) => id !== propertyId)
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not review the property listing.')
  } finally {
    isProcessing.value = false
    activePropertyId.value = ''
  }
}

async function handleMarketplaceListingReview(listingId: string, status: 'approved' | 'rejected') {
  if (!state.profile) return showError('Sign in as an admin before reviewing listings.')
  isProcessing.value = true
  activeMarketplaceListingId.value = listingId
  try {
    await reviewMarketplaceListing(listingId, state.profile, status)
    showSuccess(
      status === 'approved'
        ? 'Marketplace listing approved successfully.'
        : 'Marketplace listing rejected successfully.'
    )
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not review the marketplace listing.')
  } finally {
    isProcessing.value = false
    activeMarketplaceListingId.value = ''
  }
}

function confirmMarketplaceListingRejection(listingId: string, title: string) {
  openConfirmation({
    title: 'Reject marketplace listing?',
    copy: `${title} will move to the rejected moderation queue.`,
    label: 'Reject listing',
    tone: 'danger',
    action: () => handleMarketplaceListingReview(listingId, 'rejected'),
  })
}

function confirmSinglePropertyRejection(propertyId: string, title: string) {
  openConfirmation({
    title: 'Reject property listing?',
    copy: `${title} will move to the rejected moderation queue.`,
    label: 'Reject listing',
    tone: 'danger',
    action: () => handlePropertyReview(propertyId, 'rejected'),
  })
}

function confirmBulkReview(status: 'approved' | 'rejected') {
  const count = selectedPropertyIds.value.length
  if (!count) return
  openConfirmation({
    title: `${status === 'approved' ? 'Approve' : 'Reject'} ${count} listings?`,
    copy: `This will update every selected property using the existing admin moderation workflow.`,
    label: status === 'approved' ? 'Approve listings' : 'Reject listings',
    tone: status === 'approved' ? 'primary' : 'danger',
    action: async () => {
      if (!state.profile) throw new Error('Sign in as an admin before reviewing listings.')
      const ids = [...selectedPropertyIds.value]
      for (const propertyId of ids) await reviewListing(propertyId, state.profile, status)
      selectedPropertyIds.value = []
      showSuccess(`${ids.length} ${ids.length === 1 ? 'listing' : 'listings'} ${status}.`)
    },
  })
}

async function handleVerificationReview(verificationId: string, status: 'approved' | 'rejected') {
  if (!state.profile)
    return showError('Sign in as an admin before reviewing verification requests.')
  const note = reviewNotes[verificationId] || ''
  if (status === 'rejected' && !note.trim())
    return showError('Add an admin note before rejecting a verification request.')
  isProcessing.value = true
  activeVerificationId.value = verificationId
  try {
    await reviewRequest(state.profile, verificationId, status, note)
    showSuccess(
      status === 'approved'
        ? 'Professional verification approved.'
        : 'Verification request rejected.'
    )
    activeVerificationId.value = ''
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not review the verification request.')
  } finally {
    isProcessing.value = false
    activeVerificationId.value = ''
  }
}

async function markAllNotificationsRead() {
  const unread = adminNotifications.value.filter((notification) => !notification.readAt)
  if (!unread.length) return
  isMarkingNotifications.value = true
  try {
    await Promise.all(
      unread.map((notification) => markNotificationAsRead(notification.id, notification.userId))
    )
    adminNotifications.value = adminNotifications.value.map((notification) =>
      unread.some((item) => item.id === notification.id)
        ? { ...notification, readAt: new Date().toISOString() }
        : notification
    )
    showSuccess(`${unread.length} notifications marked as read.`)
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not update notifications.')
  } finally {
    isMarkingNotifications.value = false
  }
}

async function openNotification(notification: NotificationRecord) {
  if (!notification.readAt) {
    try {
      await markNotificationAsRead(notification.id, notification.userId)
      notification.readAt = new Date().toISOString()
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Could not mark the notification as read.')
    }
  }
  notificationDrawerOpen.value = false
  if (notification.relatedPropertyId)
    await router.push(`/properties/${notification.relatedPropertyId}`)
  else if (notification.relatedBookingId) await router.push('/my-bookings')
  else if (notification.relatedPaymentId) await router.push('/payment')
  else await router.push('/notifications')
}

function navigateToSection(target: string) {
  activeSection.value = target
  mobileSidebarOpen.value = false
  floatingActionsOpen.value = false
  document
    .getElementById(target)
    ?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' })
}

function navigateAdminItem(item: { id: string; target: string }) {
  if (item.id === 'bookings') analyticsMode.value = 'bookings'
  if (item.id === 'payments') analyticsMode.value = 'revenue'
  navigateToSection(item.target)
}

function openPendingProperties() {
  propertyStatusFilter.value = 'pending'
  navigateToSection('properties')
}

function executeAdminCommand(command: AdminCommandItem) {
  if (command.action === 'refresh') return void handleRefresh()
  if (command.action?.startsWith('export-'))
    return exportDataset(command.action.replace('export-', '') as ExportDataset)
  if (command.id.startsWith('user:')) {
    const user = userProfiles.value.find((item) => item.uid === command.id.slice(5))
    if (user) userQuery.value = user.email
  }
  if (command.id.startsWith('verification:'))
    activeVerificationId.value = command.id.slice('verification:'.length)
  if (command.id.startsWith('booking:')) analyticsMode.value = 'bookings'
  if (command.id.startsWith('payment:')) analyticsMode.value = 'revenue'
  if (command.to?.startsWith('#')) navigateToSection(command.to.slice(1))
  else if (command.to) void router.push(command.to)
}

function exportDataset(dataset: ExportDataset) {
  if (dataset === 'properties')
    return downloadCsv(
      'randsa-properties.csv',
      properties.value.map((property) => ({
        id: property.id,
        title: property.title,
        category: property.category,
        type: property.propertyType,
        status: property.status,
        owner: ownerName(property.ownerId),
        location: propertyLocation(property),
        price: property.rentPrice,
        available: property.isAvailable,
        createdAt: property.createdAt,
      }))
    )
  if (dataset === 'users')
    return downloadCsv(
      'randsa-users.csv',
      userProfiles.value.map((user) => ({
        id: user.uid,
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        verification: user.verificationStatus,
        createdAt: toIsoString(user.createdAt),
      }))
    )
  if (dataset === 'bookings')
    return downloadCsv(
      'randsa-bookings.csv',
      bookings.value.map((booking) => ({
        id: booking.id,
        property: propertyTitleMap.value.get(booking.propertyId) || booking.propertyId,
        userId: booking.userId,
        mode: booking.bookingMode,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        startAt: booking.startAt,
        total: booking.estimatedTotal,
        createdAt: booking.createdAt,
      }))
    )
  return downloadCsv(
    'randsa-payments.csv',
    payments.value.map((payment) => ({
      id: payment.id,
      property: payment.propertyTitle,
      payer: payment.payerName,
      email: payment.payerEmail,
      amount: payment.amount,
      type: payment.paymentType,
      status: payment.status,
      reference: payment.paystackReference,
      createdAt: payment.createdAt,
    }))
  )
}

function exportSelectedProperties() {
  const selected = properties.value.filter((property) =>
    selectedPropertyIds.value.includes(property.id)
  )
  downloadCsv(
    'randsa-selected-properties.csv',
    selected.map((property) => ({
      id: property.id,
      title: property.title,
      category: property.category,
      type: property.propertyType,
      status: property.status,
      owner: ownerName(property.ownerId),
      location: propertyLocation(property),
      price: property.rentPrice,
      available: property.isAvailable,
    }))
  )
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return showError('There are no records available for this export.')
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))]
  const content = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(',')),
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([content], { type: 'text/csv;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
  showSuccess(`${rows.length} records exported to ${filename}.`)
}

function saveCurrentPropertyFilter() {
  const name = window.prompt('Name this property filter')?.trim()
  if (!name) return
  const saved: SavedPropertyFilter = {
    id: crypto.randomUUID(),
    name,
    status: propertyStatusFilter.value,
    category: propertyCategoryFilter.value,
    owner: propertyOwnerFilter.value,
    location: propertyLocationFilter.value,
    availability: propertyAvailabilityFilter.value,
    minPrice: propertyMinPrice.value,
    maxPrice: propertyMaxPrice.value,
  }
  savedPropertyFilters.value = [saved, ...savedPropertyFilters.value]
  persistSavedPropertyFilters()
  selectedSavedFilterId.value = saved.id
  showSuccess(`Saved filter "${name}".`)
}

function applySavedFilter() {
  const saved = savedPropertyFilters.value.find(
    (filter) => filter.id === selectedSavedFilterId.value
  )
  if (!saved) return
  propertyStatusFilter.value = saved.status
  propertyCategoryFilter.value = saved.category
  propertyOwnerFilter.value = saved.owner
  propertyLocationFilter.value = saved.location
  propertyAvailabilityFilter.value = saved.availability
  propertyMinPrice.value = saved.minPrice
  propertyMaxPrice.value = saved.maxPrice
}

function clearPropertyFilters() {
  propertyQuery.value = ''
  propertyStatusFilter.value = 'all'
  propertyCategoryFilter.value = 'all'
  propertyOwnerFilter.value = 'all'
  propertyLocationFilter.value = ''
  propertyAvailabilityFilter.value = 'all'
  propertyMinPrice.value = null
  propertyMaxPrice.value = null
  selectedSavedFilterId.value = ''
}

function togglePropertySelection(propertyId: string) {
  selectedPropertyIds.value = selectedPropertyIds.value.includes(propertyId)
    ? selectedPropertyIds.value.filter((id) => id !== propertyId)
    : [...selectedPropertyIds.value, propertyId]
}

function toggleAllVisibleProperties() {
  const visibleIds = visibleModeratedProperties.value.map((property) => property.id)
  selectedPropertyIds.value = allVisiblePropertiesSelected.value
    ? selectedPropertyIds.value.filter((id) => !visibleIds.includes(id))
    : [...new Set([...selectedPropertyIds.value, ...visibleIds])]
}

function toggleVerificationReview(requestId: string) {
  activeVerificationId.value = activeVerificationId.value === requestId ? '' : requestId
}

function openActivity(activity: ActivityItem) {
  if (activity.to) void router.push(activity.to)
  else if (activity.target) navigateToSection(activity.target)
}

function focusUser(user: UserProfile) {
  userQuery.value = user.email
}

function toggleWidget(widgetId: WidgetId) {
  hiddenWidgetIds.value = hiddenWidgetIds.value.includes(widgetId)
    ? hiddenWidgetIds.value.filter((id) => id !== widgetId)
    : [...hiddenWidgetIds.value, widgetId]
  persistWidgetPreferences()
}

function toggleCollapsed(widgetId: WidgetId) {
  collapsedWidgetIds.value = collapsedWidgetIds.value.includes(widgetId)
    ? collapsedWidgetIds.value.filter((id) => id !== widgetId)
    : [...collapsedWidgetIds.value, widgetId]
  persistWidgetPreferences()
}

function moveWidget(widgetId: WidgetId, direction: -1 | 1) {
  const currentIndex = widgetOrder.value.indexOf(widgetId)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= widgetOrder.value.length) return
  const next = [...widgetOrder.value]
  ;[next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]]
  widgetOrder.value = next
  persistWidgetPreferences()
}

function resetWidgetPreferences() {
  widgetOrder.value = [...defaultWidgetOrder]
  hiddenWidgetIds.value = []
  collapsedWidgetIds.value = []
  persistWidgetPreferences()
}

function loadWidgetPreferences() {
  try {
    const raw = window.localStorage.getItem(widgetStorageKey.value)
    if (!raw) return
    const parsed = JSON.parse(raw) as {
      order?: WidgetId[]
      hidden?: WidgetId[]
      collapsed?: WidgetId[]
    }
    const validIds = new Set(defaultWidgetOrder)
    const savedOrder = (parsed.order || []).filter((id) => validIds.has(id))
    widgetOrder.value = [
      ...savedOrder,
      ...defaultWidgetOrder.filter((id) => !savedOrder.includes(id)),
    ]
    hiddenWidgetIds.value = (parsed.hidden || []).filter((id) => validIds.has(id))
    collapsedWidgetIds.value = (parsed.collapsed || []).filter((id) => validIds.has(id))
  } catch {
    resetWidgetPreferences()
  }
}

function persistWidgetPreferences() {
  window.localStorage.setItem(
    widgetStorageKey.value,
    JSON.stringify({
      order: widgetOrder.value,
      hidden: hiddenWidgetIds.value,
      collapsed: collapsedWidgetIds.value,
    })
  )
}

function loadSavedPropertyFilters() {
  try {
    const raw = window.localStorage.getItem(filterStorageKey.value)
    savedPropertyFilters.value = raw ? (JSON.parse(raw) as SavedPropertyFilter[]) : []
  } catch {
    savedPropertyFilters.value = []
  }
}

function persistSavedPropertyFilters() {
  window.localStorage.setItem(filterStorageKey.value, JSON.stringify(savedPropertyFilters.value))
}

function isWidgetHidden(widgetId: WidgetId) {
  return hiddenWidgetIds.value.includes(widgetId)
}
function isWidgetCollapsed(widgetId: WidgetId) {
  return collapsedWidgetIds.value.includes(widgetId)
}
function widgetOrderStyle(widgetId: WidgetId) {
  return { order: widgetOrder.value.indexOf(widgetId) }
}
function widgetCollapseLabel(widgetId: WidgetId) {
  return `${isWidgetCollapsed(widgetId) ? 'Expand' : 'Collapse'} ${widgetDefinitions.find((widget) => widget.id === widgetId)?.label || 'widget'}`
}

function openConfirmation(input: {
  title: string
  copy: string
  label: string
  tone: ConfirmationTone
  action: () => Promise<void>
}) {
  confirmationTitle.value = input.title
  confirmationCopy.value = input.copy
  confirmationActionLabel.value = input.label
  confirmationTone.value = input.tone
  pendingConfirmedAction.value = input.action
  confirmationOpen.value = true
}

function closeConfirmation() {
  if (isProcessing.value) return
  confirmationOpen.value = false
  pendingConfirmedAction.value = null
}

async function runConfirmedAction() {
  if (!pendingConfirmedAction.value) return
  isProcessing.value = true
  try {
    await pendingConfirmedAction.value()
    confirmationOpen.value = false
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'The requested action could not be completed.'
    )
  } finally {
    isProcessing.value = false
    pendingConfirmedAction.value = null
  }
}

async function handleSignOut() {
  isSigningOut.value = true
  try {
    await signOutCurrentUser()
    await router.replace('/login')
  } catch (error) {
    showError(error instanceof Error ? error.message : 'Could not sign out.')
  } finally {
    isSigningOut.value = false
  }
}

function dismissMessages() {
  actionMessage.value = ''
  dashboardLoadError.value = ''
}
function showSuccess(message: string) {
  actionTone.value = 'success'
  actionMessage.value = message
}
function showError(message: string) {
  actionTone.value = 'error'
  actionMessage.value = message
}
function ownerName(ownerId: string) {
  const owner = ownerProfileMap.value.get(ownerId)
  return owner?.fullName || owner?.email || 'Owner unavailable'
}
function propertyLocation(property: PropertyRecord) {
  return (
    [property.area, property.city, property.state].filter(Boolean).join(', ') || property.address
  )
}
function marketplaceListingLocation(listing: ListingRecord) {
  return (
    [listing.location.area, listing.location.city, listing.location.state]
      .filter(Boolean)
      .join(', ') || 'Location unavailable'
  )
}
function formatMarketplaceListingPrice(listing: ListingRecord) {
  if (listing.pricing.priceType === 'free') return 'Free'
  if (listing.pricing.priceType === 'contact') return 'Contact for price'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: listing.pricing.currency || 'NGN',
    maximumFractionDigits: 0,
  }).format(listing.pricing.amount)
}
function titleCase(value: string) {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}
function initialsFor(value: string) {
  return (
    value
      .split(/\s+|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || 'R'
  )
}
function compactCount(value: number) {
  return value > 99 ? '99+' : String(value)
}
function formatNumber(value: number) {
  return new Intl.NumberFormat('en-NG').format(value)
}
function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(value)
}
function formatCompactCurrency(value: number) {
  return value >= 1000000
    ? `NGN ${(value / 1000000).toFixed(value >= 10000000 ? 0 : 1)}M`
    : value >= 1000
      ? `NGN ${(value / 1000).toFixed(value >= 100000 ? 0 : 1)}K`
      : `NGN ${formatNumber(value)}`
}
function formatShortDate(value: unknown) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }).format(
        date
      )
    : 'Unavailable'
}
function formatDateTime(value: unknown) {
  const date = parseDate(value)
  return date
    ? new Intl.DateTimeFormat('en-NG', { dateStyle: 'medium', timeStyle: 'short' }).format(date)
    : 'Unavailable'
}
function relativeTime(value: unknown) {
  const date = parseDate(value)
  if (!date) return 'Unknown'
  const seconds = Math.round((date.getTime() - Date.now()) / 1000)
  const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })
  const abs = Math.abs(seconds)
  if (abs < 60) return formatter.format(seconds, 'second')
  if (abs < 3600) return formatter.format(Math.round(seconds / 60), 'minute')
  if (abs < 86400) return formatter.format(Math.round(seconds / 3600), 'hour')
  return formatter.format(Math.round(seconds / 86400), 'day')
}
function parseDate(value: unknown) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  if (value && typeof value === 'object' && 'toDate' in value)
    return (value as { toDate: () => Date }).toDate()
  const date = new Date(String(value || ''))
  return Number.isNaN(date.getTime()) ? null : date
}
function validDate(value: unknown) {
  return Boolean(parseDate(value))
}
function toIsoString(value: unknown) {
  return parseDate(value)?.toISOString() || ''
}
function inBounds(value: unknown, bounds: { start: Date; end: Date }) {
  const date = parseDate(value)
  return Boolean(date && date >= bounds.start && date <= bounds.end)
}
function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}
function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
}
function getDateBounds(range: DateRangeKey) {
  const now = new Date()
  if (range === 'today') return { start: startOfDay(now), end: endOfDay(now) }
  if (range === 'yesterday') {
    const day = new Date(now)
    day.setDate(day.getDate() - 1)
    return { start: startOfDay(day), end: endOfDay(day) }
  }
  if (range === 'last-7' || range === 'last-30' || range === 'last-90') {
    const days = Number(range.split('-')[1])
    const start = startOfDay(now)
    start.setDate(start.getDate() - (days - 1))
    return { start, end: endOfDay(now) }
  }
  if (range === 'this-month')
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) }
  if (range === 'last-month')
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    }
  if (range === 'this-year') return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) }
  const start = parseDate(`${customRange.start}T00:00:00`) || startOfDay(now)
  const end = parseDate(`${customRange.end}T23:59:59`) || endOfDay(now)
  return start <= end ? { start, end } : { start: end, end: start }
}
function buildSeries<T>(
  records: T[],
  dateValue: (record: T) => unknown,
  numberValue: (record: T) => number = () => 1
) {
  const bounds = dateBounds.value
  const bucketCount = 10
  const duration = Math.max(1, bounds.end.getTime() - bounds.start.getTime())
  const buckets = Array.from({ length: bucketCount }, () => 0)
  for (const record of records) {
    const date = parseDate(dateValue(record))
    if (!date || date < bounds.start || date > bounds.end) continue
    const index = Math.min(
      bucketCount - 1,
      Math.floor(((date.getTime() - bounds.start.getTime()) / duration) * bucketCount)
    )
    buckets[index] += numberValue(record)
  }
  return buckets
}
function buildAxisLabels() {
  const bounds = dateBounds.value
  const formatter = new Intl.DateTimeFormat('en-NG', { day: 'numeric', month: 'short' })
  return Array.from({ length: 5 }, (_, index) =>
    formatter.format(
      new Date(
        bounds.start.getTime() + ((bounds.end.getTime() - bounds.start.getTime()) * index) / 4
      )
    )
  )
}
function percentChange(current: number, previous: number) {
  if (!previous) return current ? 100 : 0
  return Math.round(((current - previous) / previous) * 100)
}
function formatTrend(value: number) {
  return `${value >= 0 ? '+' : ''}${value}%`
}
function notificationIcon(type: NotificationType) {
  if (type === 'booking_confirmation') return calendarOutline
  if (type === 'payment_confirmation') return cardOutline
  if (type === 'inspection_reminder' || type === 'rent_due_reminder') return timeOutline
  return informationCircleOutline
}
function notificationTone(type: NotificationType) {
  if (type === 'booking_confirmation') return 'amber'
  if (type === 'payment_confirmation') return 'green'
  if (type === 'inspection_reminder' || type === 'rent_due_reminder') return 'purple'
  return 'blue'
}
function csvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ''
      : typeof value === 'object'
        ? JSON.stringify(value)
        : String(value)
  return `"${text.replace(/"/g, '""')}"`
}
function deduplicateById<T extends { id: string }>(records: T[]) {
  return [...new Map(records.map((record) => [record.id, record])).values()]
}
function reducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
function detectBrowser() {
  const agent = navigator.userAgent
  if (/Edg\//.test(agent)) return 'Microsoft Edge'
  if (/Chrome\//.test(agent)) return 'Google Chrome'
  if (/Firefox\//.test(agent)) return 'Mozilla Firefox'
  if (/Safari\//.test(agent)) return 'Safari'
  return 'Browser'
}
function detectOperatingSystem() {
  const agent = navigator.userAgent
  if (/Windows/.test(agent)) return 'Windows'
  if (/Android/.test(agent)) return 'Android'
  if (/iPhone|iPad/.test(agent)) return 'iOS'
  if (/Mac OS/.test(agent)) return 'macOS'
  if (/Linux/.test(agent)) return 'Linux'
  return 'Unknown OS'
}
</script>

<style scoped>
.admin-shell {
  --admin-bg: var(--rd-canvas);
  --admin-surface: var(--rd-surface);
  --admin-border: var(--rd-hairline);
  --admin-text: var(--rd-ink);
  --admin-muted: var(--rd-muted);
  --admin-subtle: var(--rd-subtle);
  --admin-blue: var(--rd-brass);
  --admin-blue-soft: var(--rd-brass-soft);
  --admin-green: var(--rd-success);
  --admin-green-soft: var(--rd-success-bg);
  --admin-red: var(--rd-danger);
  --admin-red-soft: var(--rd-danger-bg);
  --admin-amber: var(--rd-warning);
  --admin-amber-soft: var(--rd-warning-bg);
  --admin-purple: var(--rd-info);
  --admin-purple-soft: var(--rd-info-bg);
  display: grid;
  min-height: 100vh;
  grid-template-columns: 226px minmax(0, 1fr);
  background: var(--admin-bg);
  color: var(--admin-text);
}
.admin-sidebar {
  position: sticky;
  z-index: 40;
  top: 0;
  display: flex;
  height: 100vh;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid var(--admin-border);
  background: var(--admin-surface);
  padding: 18px 12px 14px;
}
.admin-brand {
  display: flex;
  height: 50px;
  align-items: center;
  gap: 9px;
  padding: 0 9px;
  color: var(--admin-text);
  text-decoration: none;
}
.admin-brand > span {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 7px;
  background: var(--admin-blue);
  color: #fff;
  font-size: 21px;
  font-weight: 900;
  box-shadow: 0 10px 24px -14px rgba(23, 105, 239, 0.9);
}
.admin-brand strong {
  font-size: 16px;
  font-weight: 900;
}
.admin-brand small {
  border-radius: 5px;
  background: var(--admin-blue-soft);
  padding: 4px 7px;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 900;
}
.admin-nav {
  display: grid;
  gap: 3px;
  margin-top: 15px;
}
.admin-nav button {
  position: relative;
  display: grid;
  min-height: 41px;
  grid-template-columns: 23px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  padding: 0 10px;
  color: #354b65;
  font-size: 10px;
  font-weight: 700;
  text-align: left;
  transition:
    background 160ms ease,
    color 160ms ease;
}
.admin-nav button::before {
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: -12px;
  width: 2px;
  border-radius: 2px;
  background: var(--admin-blue);
  content: '';
  opacity: 0;
}
.admin-nav button ion-icon {
  font-size: 17px;
}
.admin-nav button small {
  display: grid;
  min-width: 20px;
  height: 20px;
  place-items: center;
  border-radius: 10px;
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
  font-size: 8px;
}
.admin-nav button:hover,
.admin-nav button.active {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.admin-nav button.active::before {
  opacity: 1;
}
.admin-sidebar-shortcuts {
  display: grid;
  gap: 3px;
  margin-top: 16px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 9px;
}
.admin-sidebar-shortcuts > p {
  margin: 0 0 3px;
  color: var(--admin-subtle);
  font-size: 7px;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.admin-sidebar-shortcuts button,
.admin-sidebar-shortcuts a {
  display: grid;
  min-height: 28px;
  grid-template-columns: 17px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  padding: 0 2px;
  color: #475b74;
  font-size: 8px;
  font-weight: 650;
  text-align: left;
  text-decoration: none;
}
.admin-sidebar-shortcuts ion-icon {
  color: #60758e;
  font-size: 13px;
}
kbd {
  display: inline-flex;
  height: 20px;
  align-items: center;
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  background: #f7f9fc;
  padding: 0 6px;
  color: #718298;
  font-size: 7px;
  font-weight: 800;
}
.admin-sidebar-status {
  display: grid;
  min-height: 67px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 10px;
}
.admin-sidebar-status > span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 6px var(--admin-green-soft);
}
.admin-sidebar-status > span.healthy {
  background: var(--admin-green);
}
.admin-sidebar-status > span.warning {
  background: var(--admin-amber);
  box-shadow: 0 0 0 6px var(--admin-amber-soft);
}
.admin-sidebar-status strong,
.admin-sidebar-status small {
  display: block;
}
.admin-sidebar-status strong {
  font-size: 8px;
}
.admin-sidebar-status small {
  margin-top: 4px;
  color: var(--admin-green);
  font-size: 7px;
}
.admin-sidebar-status button {
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border: 0;
  background: transparent;
  color: var(--admin-blue);
}
.admin-account-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  margin-top: auto;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  padding: 9px;
  color: var(--admin-text);
  text-decoration: none;
}
.admin-avatar,
.admin-profile-button span {
  display: grid;
  width: 33px;
  height: 33px;
  place-items: center;
  border-radius: 50%;
  background: linear-gradient(145deg, #e8f1ff, #c9dcfb);
  color: var(--admin-blue);
  font-size: 10px;
  font-weight: 900;
}
.admin-account-link strong,
.admin-account-link small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-account-link strong {
  font-size: 9px;
}
.admin-account-link small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
}
.admin-account-link > ion-icon {
  color: var(--admin-muted);
}
.admin-logout {
  display: flex;
  min-height: 39px;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  border: 0;
  background: transparent;
  padding: 0 11px;
  color: var(--admin-red);
  font-size: 9px;
  font-weight: 800;
}
.admin-main {
  min-width: 0;
  padding: 0 18px 36px;
}
.admin-topbar {
  position: sticky;
  z-index: 30;
  top: 0;
  display: grid;
  min-height: 76px;
  grid-template-columns: minmax(200px, 1fr) minmax(320px, 480px) auto auto;
  align-items: center;
  gap: 15px;
  border-bottom: 1px solid var(--admin-border);
  background: rgba(244, 247, 251, 0.94);
  backdrop-filter: blur(18px);
}
.admin-greeting h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 900;
}
.admin-greeting p {
  margin: 4px 0 0;
  color: var(--admin-muted);
  font-size: 9px;
}
.admin-global-search {
  display: grid;
  min-height: 40px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  padding: 0 10px;
  color: var(--admin-muted);
  text-align: left;
  box-shadow: 0 8px 20px -20px rgba(16, 32, 51, 0.5);
}
.admin-global-search > ion-icon {
  font-size: 16px;
}
.admin-global-search > span {
  overflow: hidden;
  font-size: 9px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.admin-top-actions {
  display: flex;
  align-items: center;
  gap: 7px;
}
.admin-icon-button,
.admin-add-button {
  position: relative;
  display: grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  color: var(--admin-text);
}
.admin-add-button {
  border-color: var(--admin-blue);
  background: var(--admin-blue);
  color: #fff;
  box-shadow: 0 12px 24px -16px rgba(23, 105, 239, 0.9);
}
.admin-badge {
  position: absolute;
  top: -5px;
  right: -5px;
  display: grid;
  min-width: 17px;
  height: 17px;
  place-items: center;
  border: 2px solid var(--admin-bg);
  border-radius: 10px;
  background: var(--admin-red);
  padding: 0 3px;
  color: #fff;
  font-size: 7px;
  font-weight: 900;
}
.admin-profile-button {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--admin-muted);
  text-decoration: none;
}
.admin-profile-button span {
  width: 34px;
  height: 34px;
}
.admin-date {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #40546c;
}
.admin-date > ion-icon {
  font-size: 17px;
}
.admin-date strong,
.admin-date small {
  display: block;
  white-space: nowrap;
}
.admin-date strong {
  font-size: 8px;
}
.admin-date small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
}
.admin-mobile-menu {
  display: none;
}
.admin-popover {
  position: absolute;
  z-index: 50;
  top: 67px;
  right: 0;
  width: min(390px, calc(100vw - 24px));
  overflow: hidden;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  box-shadow: 0 24px 60px -28px rgba(13, 31, 54, 0.5);
}
.admin-customizer {
  right: 150px;
  width: 330px;
}
.admin-notification-drawer {
  right: 92px;
}
.popover-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--admin-border);
  padding: 12px 14px;
}
.popover-heading strong,
.popover-heading small {
  display: block;
}
.popover-heading strong {
  font-size: 11px;
}
.popover-heading small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 8px;
}
.popover-heading button {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: #f1f4f8;
  color: var(--admin-muted);
}
.customizer-list {
  display: grid;
  max-height: 380px;
  overflow-y: auto;
  padding: 8px;
}
.customizer-list > div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 27px 27px;
  align-items: center;
  gap: 3px;
  border-radius: 6px;
  padding: 5px;
}
.customizer-list > div:hover {
  background: var(--rd-surface-alt);
}
.customizer-list label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 9px;
  font-weight: 700;
}
.customizer-list button {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--admin-muted);
}
.customizer-list button:hover {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.popover-reset {
  width: calc(100% - 20px);
  min-height: 34px;
  margin: 0 10px 10px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--rd-surface);
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
}
.drawer-actions,
.notification-widget-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 9px 12px;
}
.drawer-actions select,
.notification-widget-actions select {
  min-height: 29px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--admin-surface);
  padding: 0 7px;
  color: inherit;
  font-size: 8px;
}
.drawer-actions button,
.notification-widget-actions button {
  border: 0;
  background: transparent;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
}
.drawer-footer-link {
  display: flex;
  min-height: 37px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-top: 1px solid var(--admin-border);
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
  text-decoration: none;
}
.admin-alert {
  display: grid;
  min-height: 42px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 9px;
  margin-top: 12px;
  border: 1px solid;
  border-radius: 8px;
  padding: 8px 11px;
  font-size: 9px;
}
.admin-alert.success {
  border-color: #bce8d2;
  background: var(--admin-green-soft);
  color: #087a49;
}
.admin-alert.error {
  border-color: #f3c1ca;
  background: var(--admin-red-soft);
  color: #bd2941;
}
.admin-alert > ion-icon {
  font-size: 17px;
}
.admin-alert button {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 0;
  background: transparent;
  color: inherit;
}
.admin-overview {
  scroll-margin-top: 90px;
  padding-top: 18px;
}
.admin-overview-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}
.admin-overview-heading > div:first-child p {
  margin: 0;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 900;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}
.admin-overview-heading h2 {
  margin: 4px 0 0;
  font-size: 23px;
  font-weight: 900;
}
.admin-range-control {
  display: flex;
  align-items: end;
  gap: 7px;
}
.admin-range-control label {
  display: grid;
  gap: 3px;
}
.admin-range-control label span {
  color: var(--admin-subtle);
  font-size: 7px;
  font-weight: 800;
}
.admin-range-control select,
.admin-range-control input {
  height: 34px;
  border: 1px solid var(--admin-border);
  border-radius: 7px;
  background: var(--admin-surface);
  padding: 0 9px;
  color: inherit;
  font-size: 8px;
  font-weight: 700;
}
.admin-range-control > button {
  display: inline-flex;
  height: 34px;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--admin-blue);
  border-radius: 7px;
  background: var(--admin-blue);
  padding: 0 11px;
  color: #fff;
  font-size: 8px;
  font-weight: 800;
}
.spinning {
  animation: admin-spin 900ms linear infinite;
}
.admin-metric-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin-top: 14px;
}
.admin-metric-card {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 105px;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 6px 8px;
  overflow: hidden;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  padding: 12px;
  box-shadow: 0 16px 32px -30px rgba(16, 32, 51, 0.5);
}
.metric-icon {
  display: grid;
  width: 34px;
  height: 34px;
  grid-row: 1;
  place-items: center;
  border-radius: 8px;
}
.metric-icon ion-icon {
  font-size: 18px;
}
.metric-icon.blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.metric-icon.purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.metric-icon.green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.metric-icon.amber {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.metric-icon.red {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.metric-copy p {
  margin: 0;
  color: var(--admin-muted);
  font-size: 8px;
}
.metric-copy strong {
  display: block;
  margin-top: 5px;
  font-size: 18px;
  font-weight: 900;
}
.metric-trend {
  display: flex;
  grid-column: 1 / -1;
  align-items: center;
  gap: 4px;
  font-size: 7px;
}
.metric-trend.positive {
  color: var(--admin-green);
}
.metric-trend.negative {
  color: var(--admin-red);
}
.metric-trend.neutral {
  color: var(--admin-muted);
}
.admin-metric-card :deep(.admin-trend-chart) {
  position: absolute;
  right: 8px;
  bottom: 6px;
  width: 58%;
  height: 27px;
  opacity: 0.85;
}
.admin-metric-card.skeleton {
  min-height: 105px;
  background: linear-gradient(90deg, #edf1f6 25%, var(--rd-surface-alt) 50%, #edf1f6 75%);
  background-size: 200% 100%;
  animation: admin-shimmer 1.3s infinite;
}
.admin-widget-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  grid-auto-flow: dense;
  align-items: start;
  gap: 10px;
  margin-top: 10px;
}
.admin-widget {
  scroll-margin-top: 88px;
  overflow: hidden;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  box-shadow: 0 18px 38px -34px rgba(16, 32, 51, 0.55);
}
.admin-widget.collapsed {
  min-height: 58px;
}
.widget-properties,
.widget-analytics,
.widget-top-content {
  grid-column: span 8;
}
.widget-notifications,
.widget-quick-actions,
.widget-activity,
.widget-verifications,
.widget-users,
.widget-insights,
.widget-system {
  grid-column: span 4;
}
.widget-heading {
  display: flex;
  min-height: 57px;
  align-items: center;
  gap: 10px;
  padding: 11px 13px;
}
.widget-heading > div:first-child {
  min-width: 0;
  flex: 1;
}
.widget-heading h2 {
  margin: 0;
  font-size: 12px;
  font-weight: 900;
}
.widget-heading p {
  margin: 3px 0 0;
  color: var(--admin-muted);
  font-size: 8px;
  line-height: 1.4;
}
.widget-tools {
  display: flex;
  align-items: center;
  gap: 5px;
}
.widget-tools button,
.widget-heading > button {
  display: inline-flex;
  min-height: 31px;
  align-items: center;
  gap: 5px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--admin-surface);
  padding: 0 8px;
  color: #41566f;
  font-size: 8px;
  font-weight: 750;
}
.widget-tools button.active {
  border-color: #a7c8fa;
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.widget-heading > button {
  display: grid;
  width: 31px;
  place-items: center;
  padding: 0;
}
.compact-heading {
  border-bottom: 1px solid var(--admin-border);
}
.property-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border-top: 1px solid var(--admin-border);
  border-bottom: 1px solid var(--admin-border);
  padding: 8px 13px;
}
.property-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.property-tabs button {
  min-height: 29px;
  border: 0;
  border-radius: 6px;
  background: #f5f7fa;
  padding: 0 9px;
  color: #53677e;
  font-size: 8px;
  font-weight: 750;
}
.property-tabs button span {
  margin-left: 3px;
  color: var(--admin-subtle);
}
.property-tabs button.active {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.property-search,
.user-search {
  display: flex;
  min-width: 175px;
  height: 31px;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  padding: 0 9px;
  color: var(--admin-subtle);
}
.property-search input,
.user-search input {
  min-width: 0;
  flex: 1;
  border: 0;
  background: transparent;
  color: inherit;
  font-size: 8px;
  outline: none;
}
.smart-filter-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  border-bottom: 1px solid var(--admin-border);
  background: #f8fafd;
  padding: 10px 13px;
}
.smart-filter-panel label {
  display: grid;
  gap: 4px;
  color: var(--admin-muted);
  font-size: 7px;
  font-weight: 750;
}
.smart-filter-panel select,
.smart-filter-panel input {
  min-width: 0;
  height: 31px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--rd-surface);
  padding: 0 8px;
  color: var(--admin-text);
  font-size: 8px;
}
.saved-filter-row {
  display: flex;
  grid-column: 1 / -1;
  gap: 6px;
}
.saved-filter-row select {
  min-width: 150px;
}
.saved-filter-row button {
  min-height: 31px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  background: var(--rd-surface);
  padding: 0 10px;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
}
.bulk-action-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  border-bottom: 1px solid #bfd6fa;
  background: var(--admin-blue-soft);
  padding: 8px 13px;
}
.bulk-action-bar strong {
  margin-right: auto;
  color: var(--admin-blue);
  font-size: 9px;
}
.bulk-action-bar button {
  display: inline-flex;
  min-height: 29px;
  align-items: center;
  gap: 4px;
  border: 1px solid #b5cff7;
  border-radius: 6px;
  background: var(--rd-surface);
  padding: 0 8px;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
}
.bulk-action-bar button.danger {
  border-color: #f0bcc6;
  color: var(--admin-red);
}
.bulk-action-bar button.plain {
  border: 0;
  background: transparent;
  color: var(--admin-muted);
}
.moderation-list {
  padding: 0 13px;
}
.universal-listing-queue {
  border-bottom: 1px solid var(--admin-border);
  background: #fbfcff;
  padding: 0 13px;
}
.universal-listing-heading {
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid var(--admin-border);
}
.universal-listing-heading span {
  color: var(--admin-blue);
  font-size: 7px;
  font-weight: 850;
  letter-spacing: 0;
  text-transform: uppercase;
}
.universal-listing-heading h3 {
  margin: 2px 0 0;
  color: var(--admin-text);
  font-size: 10px;
}
.universal-listing-heading p {
  margin: 0;
  color: var(--admin-muted);
  font-size: 8px;
}
.marketplace-moderation-row {
  grid-template-columns: 72px minmax(0, 1fr) auto;
}
.marketplace-moderation-row:last-child {
  border-bottom: 0;
}
.universal-listing-toggle {
  display: flex;
  min-height: 36px;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 5px;
  border: 0;
  border-top: 1px solid var(--admin-border);
  background: transparent;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
}
.moderation-select-all {
  display: flex;
  min-height: 34px;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--admin-border);
  color: var(--admin-muted);
  font-size: 7px;
}
.moderation-select-all label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.moderation-row {
  display: grid;
  min-width: 0;
  grid-template-columns: auto 72px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border-bottom: 1px solid var(--admin-border);
  padding: 8px 0;
}
.property-thumbnail {
  display: grid;
  width: 72px;
  height: 55px;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: #eef2f7;
  color: var(--admin-subtle);
}
.property-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.property-row-copy {
  min-width: 0;
}
.property-row-copy > div {
  display: flex;
  align-items: center;
  gap: 7px;
}
.property-row-copy > div strong {
  overflow: hidden;
  font-size: 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.status-pill {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  border-radius: 10px;
  padding: 4px 7px;
  font-size: 7px;
  font-style: normal;
  font-weight: 850;
}
.status-pill.approved {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.status-pill.pending {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.status-pill.rejected {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.property-row-copy p {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 4px 0 0;
  color: var(--admin-muted);
  font-size: 7px;
}
.property-row-copy ul {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin: 5px 0 0;
  padding: 0;
  color: var(--admin-muted);
  font-size: 7px;
  list-style: none;
}
.property-row-copy li b {
  color: #3f536a;
}
.moderation-actions {
  display: grid;
  grid-template-columns: 30px 30px;
  gap: 5px;
}
.moderation-actions button {
  display: grid;
  width: 30px;
  height: 28px;
  place-items: center;
  border: 1px solid;
  border-radius: 6px;
  background: var(--rd-surface);
}
.moderation-actions button.approve {
  border-color: #bde7d1;
  color: var(--admin-green);
}
.moderation-actions button.reject {
  border-color: #f1bdc7;
  color: var(--admin-red);
}
.moderation-actions a {
  display: flex;
  min-height: 28px;
  grid-column: 1 / -1;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  color: var(--admin-text);
  font-size: 7px;
  font-weight: 750;
  text-decoration: none;
}
.widget-footer-command {
  display: flex;
  min-height: 38px;
  width: 100%;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 0;
  border-top: 1px solid var(--admin-border);
  background: transparent;
  color: var(--admin-blue);
  font-size: 8px;
  font-weight: 800;
  text-decoration: none;
}
.notification-list {
  display: grid;
  padding: 0 12px;
}
.notification-list button {
  position: relative;
  display: grid;
  min-height: 57px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border: 0;
  border-top: 1px solid var(--admin-border);
  background: transparent;
  padding: 7px 0;
  color: var(--admin-text);
  text-align: left;
}
.notification-list button.unread::after {
  position: absolute;
  top: 12px;
  left: -7px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--admin-blue);
  content: '';
}
.notification-icon {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 50%;
}
.notification-icon.blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.notification-icon.green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.notification-icon.amber {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.notification-icon.purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.notification-list strong,
.notification-list small {
  display: block;
}
.notification-list strong {
  overflow: hidden;
  font-size: 8px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.notification-list small {
  display: -webkit-box;
  overflow: hidden;
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.notification-list time {
  align-self: start;
  margin-top: 5px;
  color: var(--admin-subtle);
  font-size: 6px;
  white-space: nowrap;
}
.notification-list.is-drawer {
  max-height: 390px;
  overflow-y: auto;
}
.analytics-tabs {
  display: flex;
  gap: 3px;
  border-radius: 7px;
  background: #f2f5f9;
  padding: 3px;
}
.analytics-tabs button {
  min-height: 25px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  padding: 0 8px;
  color: var(--admin-muted);
  font-size: 7px;
  font-weight: 750;
}
.analytics-tabs button.active {
  background: var(--rd-surface);
  color: var(--admin-blue);
  box-shadow: 0 3px 10px -8px #102033;
}
.analytics-main {
  border-top: 1px solid var(--admin-border);
  padding: 12px 14px 8px;
}
.analytics-chart-heading {
  display: flex;
  align-items: start;
  justify-content: space-between;
}
.analytics-chart-heading small,
.analytics-chart-heading strong {
  display: block;
}
.analytics-chart-heading small {
  color: var(--admin-muted);
  font-size: 8px;
}
.analytics-chart-heading strong {
  margin-top: 4px;
  font-size: 18px;
}
.analytics-chart-heading em,
.analytics-summary-grid em {
  font-size: 8px;
  font-style: normal;
  font-weight: 800;
}
.positive {
  color: var(--admin-green);
}
.negative {
  color: var(--admin-red);
}
.analytics-chart {
  height: 155px;
  margin-top: 8px;
  background-image: linear-gradient(
    to bottom,
    transparent calc(25% - 1px),
    var(--rd-hairline) 25%,
    transparent calc(25% + 1px),
    transparent calc(50% - 1px),
    var(--rd-hairline) 50%,
    transparent calc(50% + 1px),
    transparent calc(75% - 1px),
    var(--rd-hairline) 75%,
    transparent calc(75% + 1px)
  );
}
.analytics-axis {
  display: flex;
  justify-content: space-between;
  color: var(--admin-subtle);
  font-size: 6px;
}
.analytics-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid var(--admin-border);
}
.analytics-summary-grid > div {
  position: relative;
  display: grid;
  min-height: 86px;
  grid-template-columns: minmax(0, 1fr) auto;
  overflow: hidden;
  border-right: 1px solid var(--admin-border);
  padding: 10px;
}
.analytics-summary-grid > div:last-child {
  border-right: 0;
}
.analytics-summary-grid small,
.analytics-summary-grid strong {
  display: block;
}
.analytics-summary-grid small {
  color: var(--admin-muted);
  font-size: 7px;
}
.analytics-summary-grid strong {
  margin-top: 4px;
  font-size: 12px;
}
.analytics-summary-grid :deep(.admin-trend-chart) {
  position: absolute;
  right: 6px;
  bottom: 4px;
  width: 72%;
  height: 25px;
}
.category-distribution {
  border-top: 1px solid var(--admin-border);
  padding: 11px 14px 13px;
}
.category-distribution h3 {
  margin: 0 0 8px;
  font-size: 9px;
}
.category-distribution > div {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr) 24px;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  color: var(--admin-muted);
  font-size: 7px;
}
.category-distribution i {
  height: 5px;
  overflow: hidden;
  border-radius: 3px;
  background: #eef2f6;
}
.category-distribution i b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--admin-blue);
}
.category-distribution strong {
  color: var(--admin-text);
  text-align: right;
}
.quick-action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 7px;
  padding: 12px;
}
.quick-action-grid a,
.quick-action-grid button {
  display: grid;
  min-width: 0;
  min-height: 83px;
  grid-template-columns: auto minmax(0, 1fr);
  align-content: center;
  align-items: center;
  gap: 3px 7px;
  border: 1px solid var(--admin-border);
  border-radius: 7px;
  background: var(--rd-surface);
  padding: 9px;
  color: var(--admin-text);
  text-align: left;
  text-decoration: none;
  transition:
    transform 160ms ease,
    border-color 160ms ease;
}
.quick-action-grid a:hover,
.quick-action-grid button:hover {
  border-color: #a7c8fa;
  transform: translateY(-2px);
}
.quick-action-grid > * > span {
  display: grid;
  width: 29px;
  height: 29px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 7px;
}
.quick-action-grid span.blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.quick-action-grid span.green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.quick-action-grid span.purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.quick-action-grid span.amber {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.quick-action-grid strong {
  font-size: 8px;
}
.quick-action-grid small {
  color: var(--admin-muted);
  font-size: 7px;
}
.activity-timeline {
  display: grid;
  margin: 0;
  padding: 8px 12px 12px;
  list-style: none;
}
.activity-timeline li {
  position: relative;
  display: grid;
  min-height: 42px;
  grid-template-columns: 25px minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
}
.activity-timeline li:not(:last-child)::after {
  position: absolute;
  top: 31px;
  bottom: -11px;
  left: 12px;
  width: 1px;
  background: var(--admin-border);
  content: '';
}
.activity-timeline li > span {
  position: relative;
  z-index: 1;
  display: grid;
  width: 25px;
  height: 25px;
  place-items: center;
  border-radius: 50%;
}
.activity-timeline span.blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.activity-timeline span.green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.activity-timeline span.red {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.activity-timeline span.amber {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.activity-timeline span.purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.activity-timeline button {
  min-width: 0;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
}
.activity-timeline strong,
.activity-timeline small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.activity-timeline strong {
  font-size: 8px;
}
.activity-timeline small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
}
.activity-timeline time {
  color: var(--admin-subtle);
  font-size: 6px;
}
.verification-queue {
  display: grid;
  padding: 3px 12px 11px;
}
.verification-queue > article {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto 27px;
  align-items: center;
  gap: 7px;
  border-bottom: 1px solid var(--admin-border);
  padding: 8px 0;
}
.verification-queue img {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  object-fit: cover;
}
.verification-queue strong,
.verification-queue small {
  display: block;
}
.verification-queue strong {
  font-size: 8px;
}
.verification-queue small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 6px;
}
.verification-queue article > button {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border: 0;
  border-radius: 6px;
  background: #f2f5f9;
  color: var(--admin-muted);
}
.verification-review-form {
  display: grid;
  grid-column: 1 / -1;
  gap: 8px;
  border-radius: 7px;
  background: #f7f9fc;
  padding: 9px;
}
.verification-review-form p {
  margin: 0;
  color: var(--admin-muted);
  font-size: 7px;
}
.verification-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.verification-docs a {
  border: 1px solid var(--admin-border);
  border-radius: 5px;
  background: var(--rd-surface);
  padding: 5px 7px;
  color: var(--admin-blue);
  font-size: 7px;
  text-decoration: none;
}
.verification-review-form label {
  display: grid;
  gap: 4px;
  color: var(--admin-muted);
  font-size: 7px;
}
.verification-review-form textarea {
  resize: vertical;
  border: 1px solid var(--admin-border);
  border-radius: 6px;
  padding: 7px;
  font: inherit;
}
.verification-review-form > div:last-child {
  display: flex;
  gap: 5px;
}
.verification-review-form button {
  display: inline-flex;
  min-height: 28px;
  align-items: center;
  gap: 4px;
  border: 0;
  border-radius: 6px;
  padding: 0 8px;
  color: #fff;
  font-size: 7px;
  font-weight: 800;
}
.verification-review-form button.approve {
  background: var(--admin-green);
}
.verification-review-form button.reject {
  background: var(--admin-red);
}
.user-overview-primary {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
}
.large-avatar {
  display: grid;
  width: 43px;
  height: 43px;
  place-items: center;
  border-radius: 50%;
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
  font-size: 15px;
  font-weight: 900;
}
.user-overview-primary strong,
.user-overview-primary small {
  display: block;
}
.user-overview-primary strong {
  font-size: 10px;
}
.user-overview-primary small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
}
.user-overview-primary em {
  display: inline-flex;
  margin-top: 5px;
  border-radius: 8px;
  background: var(--admin-blue-soft);
  padding: 3px 6px;
  color: var(--admin-blue);
  font-size: 6px;
  font-style: normal;
  font-weight: 800;
}
.user-role-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-block: 1px solid var(--admin-border);
}
.user-role-metrics > div {
  display: grid;
  place-items: center;
  gap: 3px;
  border-right: 1px solid var(--admin-border);
  padding: 8px 3px;
}
.user-role-metrics > div:last-child {
  border: 0;
}
.user-role-metrics span {
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border-radius: 6px;
}
.user-role-metrics span.blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.user-role-metrics span.green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.user-role-metrics span.purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.user-role-metrics span.red {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.user-role-metrics small {
  color: var(--admin-muted);
  font-size: 6px;
}
.user-role-metrics strong {
  font-size: 10px;
}
.user-search {
  min-width: 0;
  margin: 9px 12px 4px;
}
.user-list {
  display: grid;
  padding: 0 12px 10px;
}
.user-list button {
  display: grid;
  min-height: 42px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
  border: 0;
  border-bottom: 1px solid var(--admin-border);
  background: transparent;
  color: inherit;
  text-align: left;
}
.user-list button > span:first-child {
  display: grid;
  width: 27px;
  height: 27px;
  place-items: center;
  border-radius: 50%;
  background: #eef3f9;
  color: var(--admin-blue);
  font-size: 7px;
  font-weight: 900;
}
.user-list strong,
.user-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.user-list strong {
  font-size: 8px;
}
.user-list small {
  margin-top: 2px;
  color: var(--admin-muted);
  font-size: 6px;
}
.user-list em {
  border-radius: 7px;
  background: #f1f4f8;
  padding: 3px 5px;
  color: var(--admin-muted);
  font-size: 6px;
  font-style: normal;
}
.top-property-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
  padding: 3px 12px 11px;
}
.top-property-list a {
  display: grid;
  min-height: 55px;
  grid-template-columns: 54px minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--admin-border);
  color: inherit;
  text-decoration: none;
}
.top-property-image {
  display: grid;
  width: 54px;
  height: 40px;
  place-items: center;
  overflow: hidden;
  border-radius: 6px;
  background: #eef2f6;
  color: var(--admin-subtle);
}
.top-property-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.top-property-list strong,
.top-property-list small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.top-property-list strong {
  font-size: 8px;
}
.top-property-list small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 6px;
}
.top-property-list em {
  color: var(--admin-green);
  font-size: 8px;
  font-style: normal;
  font-weight: 850;
}
.insight-list {
  display: grid;
  padding: 5px 12px 12px;
}
.insight-list > div {
  display: grid;
  min-height: 57px;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid var(--admin-border);
}
.insight-list > div > span:first-child {
  display: grid;
  width: 31px;
  height: 31px;
  place-items: center;
  border-radius: 7px;
}
.insight-list .blue {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.insight-list .green {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.insight-list .red {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.insight-list .amber {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.insight-list .purple {
  background: var(--admin-purple-soft);
  color: var(--admin-purple);
}
.insight-list strong,
.insight-list small {
  display: block;
}
.insight-list strong {
  font-size: 8px;
}
.insight-list small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 7px;
  line-height: 1.35;
}
.system-list {
  display: grid;
  padding: 4px 12px 10px;
}
.system-list > div {
  display: grid;
  min-height: 42px;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-rows: auto auto;
  align-items: center;
  gap: 2px 7px;
  border-bottom: 1px solid var(--admin-border);
}
.system-list > div > span {
  display: grid;
  width: 27px;
  height: 27px;
  grid-row: 1 / 3;
  place-items: center;
  border-radius: 7px;
}
.system-list span.healthy {
  background: var(--admin-green-soft);
  color: var(--admin-green);
}
.system-list span.warning {
  background: var(--admin-amber-soft);
  color: var(--admin-amber);
}
.system-list span.offline {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.system-list strong {
  font-size: 8px;
}
.system-list small {
  color: var(--admin-muted);
  font-size: 6px;
}
.system-list em {
  grid-column: 3;
  grid-row: 1 / 3;
  font-size: 6px;
  font-style: normal;
  font-weight: 850;
}
.system-list em.healthy {
  color: var(--admin-green);
}
.system-list em.warning {
  color: var(--admin-amber);
}
.system-list em.offline {
  color: var(--admin-red);
}
.current-session {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--admin-border);
  padding: 10px 12px;
}
.current-session > span {
  display: grid;
  width: 30px;
  height: 30px;
  place-items: center;
  border-radius: 7px;
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.current-session strong,
.current-session small {
  display: block;
}
.current-session strong {
  font-size: 8px;
}
.current-session small {
  margin-top: 3px;
  color: var(--admin-muted);
  font-size: 6px;
}
.current-session em {
  color: var(--admin-green);
  font-size: 6px;
  font-style: normal;
}
.admin-empty {
  margin: 10px 0;
  border: 1px dashed var(--admin-border);
  border-radius: 7px;
  padding: 16px;
  color: var(--admin-muted);
  font-size: 8px;
  text-align: center;
}
.admin-empty.compact {
  border: 0;
  padding: 13px 5px;
}
.floating-quick-button {
  position: fixed;
  z-index: 42;
  right: 24px;
  bottom: 24px;
  display: grid;
  width: 47px;
  height: 47px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: var(--admin-blue);
  color: #fff;
  font-size: 22px;
  box-shadow: 0 18px 35px -13px rgba(23, 105, 239, 0.8);
}
.floating-action-menu {
  position: fixed;
  z-index: 41;
  right: 24px;
  bottom: 80px;
  display: grid;
  width: 190px;
  gap: 3px;
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--admin-surface);
  padding: 7px;
  box-shadow: 0 20px 50px -25px rgba(16, 32, 51, 0.55);
}
.floating-action-menu a,
.floating-action-menu button {
  display: flex;
  min-height: 34px;
  align-items: center;
  gap: 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  padding: 0 8px;
  color: var(--admin-text);
  font-size: 8px;
  font-weight: 750;
  text-align: left;
  text-decoration: none;
}
.floating-action-menu a:hover,
.floating-action-menu button:hover {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.confirmation-backdrop {
  position: fixed;
  z-index: 1100;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgba(8, 18, 32, 0.48);
  padding: 16px;
  backdrop-filter: blur(7px);
}
.confirmation-dialog {
  width: min(390px, 100%);
  border: 1px solid var(--admin-border);
  border-radius: 8px;
  background: var(--rd-surface);
  padding: 20px;
  color: var(--rd-ink);
  text-align: center;
  box-shadow: 0 30px 80px -35px rgba(8, 18, 32, 0.75);
}
.confirmation-dialog > span {
  display: grid;
  width: 46px;
  height: 46px;
  place-items: center;
  margin: 0 auto;
  border-radius: 50%;
  font-size: 23px;
}
.confirmation-dialog > span.primary {
  background: var(--admin-blue-soft);
  color: var(--admin-blue);
}
.confirmation-dialog > span.danger {
  background: var(--admin-red-soft);
  color: var(--admin-red);
}
.confirmation-dialog h2 {
  margin: 13px 0 0;
  font-size: 17px;
}
.confirmation-dialog p {
  margin: 8px 0 0;
  color: var(--admin-muted);
  font-size: 10px;
  line-height: 1.55;
}
.confirmation-dialog > div {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 18px;
}
.confirmation-dialog button {
  min-height: 39px;
  border: 0;
  border-radius: 7px;
  font-size: 9px;
  font-weight: 850;
}
.confirmation-dialog button.secondary {
  border: 1px solid var(--admin-border);
  background: var(--rd-surface);
  color: var(--admin-text);
}
.confirmation-dialog button.primary {
  background: var(--admin-blue);
  color: #fff;
}
.confirmation-dialog button.danger {
  background: var(--admin-red);
  color: #fff;
}
.admin-sidebar-backdrop {
  display: none;
}
@keyframes admin-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes admin-shimmer {
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 1260px) {
  .admin-metric-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .admin-topbar {
    grid-template-columns: minmax(190px, 1fr) minmax(280px, 420px) auto;
  }
  .admin-date {
    display: none;
  }
  .widget-properties,
  .widget-analytics,
  .widget-top-content {
    grid-column: span 8;
  }
}
@media (max-width: 1023px) {
  .admin-shell {
    grid-template-columns: 1fr;
  }
  .admin-sidebar {
    position: fixed;
    left: 0;
    width: 226px;
    transform: translateX(-105%);
    transition: transform 180ms ease;
  }
  .admin-sidebar.open {
    transform: translateX(0);
  }
  .admin-sidebar-backdrop {
    position: fixed;
    z-index: 39;
    inset: 0;
    display: block;
    border: 0;
    background: rgba(9, 19, 33, 0.42);
  }
  .admin-main {
    padding-inline: 14px;
  }
  .admin-topbar {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .admin-mobile-menu {
    display: grid;
  }
  .admin-global-search {
    display: none;
  }
  .admin-greeting h1 {
    font-size: 16px;
  }
  .admin-popover {
    right: 0;
  }
  .admin-customizer {
    right: 50px;
  }
  .widget-properties,
  .widget-analytics,
  .widget-top-content {
    grid-column: span 12;
  }
  .widget-notifications,
  .widget-quick-actions,
  .widget-activity,
  .widget-verifications,
  .widget-users,
  .widget-insights,
  .widget-system {
    grid-column: span 6;
  }
}
@media (max-width: 720px) {
  .admin-main {
    padding: 0 10px 28px;
  }
  .admin-topbar {
    min-height: 66px;
    gap: 8px;
  }
  .admin-greeting p {
    display: none;
  }
  .admin-top-actions {
    gap: 4px;
  }
  .admin-top-actions .admin-icon-button:first-child,
  .admin-add-button,
  .admin-profile-button {
    display: none;
  }
  .admin-overview {
    padding-top: 12px;
  }
  .admin-overview-heading {
    align-items: stretch;
    flex-direction: column;
  }
  .admin-overview-heading h2 {
    font-size: 21px;
  }
  .admin-range-control {
    overflow-x: auto;
  }
  .admin-range-control .date-input {
    min-width: 130px;
  }
  .admin-metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7px;
  }
  .admin-metric-card {
    min-height: 98px;
    padding: 10px;
  }
  .admin-widget-grid {
    grid-template-columns: 1fr;
  }
  .widget-properties,
  .widget-notifications,
  .widget-analytics,
  .widget-quick-actions,
  .widget-activity,
  .widget-verifications,
  .widget-users,
  .widget-top-content,
  .widget-insights,
  .widget-system {
    grid-column: 1;
  }
  .widget-heading {
    align-items: flex-start;
  }
  .widget-tools {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .property-toolbar {
    align-items: stretch;
    flex-direction: column;
  }
  .property-tabs {
    overflow-x: auto;
    flex-wrap: nowrap;
  }
  .property-search {
    min-width: 0;
  }
  .smart-filter-panel {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .moderation-row {
    grid-template-columns: auto 60px minmax(0, 1fr);
  }
  .marketplace-moderation-row {
    grid-template-columns: 60px minmax(0, 1fr);
  }
  .marketplace-moderation-row .moderation-actions {
    grid-column: 1 / -1;
  }
  .property-thumbnail {
    width: 60px;
  }
  .property-row-copy ul {
    display: none;
  }
  .moderation-actions {
    grid-column: 2 / -1;
    grid-template-columns: 30px 30px minmax(0, 1fr);
  }
  .moderation-actions a {
    grid-column: auto;
  }
  .analytics-tabs {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
  .analytics-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .analytics-summary-grid > div:nth-child(2) {
    border-right: 0;
  }
  .top-property-list {
    grid-template-columns: 1fr;
  }
  .admin-popover {
    position: fixed;
    top: 72px;
    right: 10px;
    left: 10px;
    width: auto;
  }
  .admin-customizer {
    right: 10px;
  }
  .floating-quick-button {
    right: 14px;
    bottom: 14px;
  }
  .floating-action-menu {
    right: 14px;
    bottom: 68px;
  }
}
@media (max-width: 420px) {
  .admin-greeting h1 {
    max-width: 170px;
    overflow: hidden;
    font-size: 14px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .admin-metric-grid {
    grid-template-columns: 1fr 1fr;
  }
  .metric-copy strong {
    font-size: 15px;
  }
  .metric-icon {
    width: 30px;
    height: 30px;
  }
  .smart-filter-panel {
    grid-template-columns: 1fr;
  }
  .saved-filter-row {
    flex-wrap: wrap;
  }
  .bulk-action-bar {
    align-items: flex-start;
    flex-wrap: wrap;
  }
  .bulk-action-bar strong {
    width: 100%;
  }
  .quick-action-grid {
    grid-template-columns: 1fr 1fr;
  }
  .widget-heading h2 {
    font-size: 11px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .admin-sidebar,
  .quick-action-grid a,
  .quick-action-grid button {
    transition: none;
  }
  .spinning {
    animation: none;
  }
}

:global(.dark) .admin-topbar {
  background: rgba(9, 18, 30, 0.94);
}
:global(.dark) .admin-global-search,
:global(.dark) .popover-reset,
:global(.dark) .smart-filter-panel select,
:global(.dark) .smart-filter-panel input,
:global(.dark) .saved-filter-row button,
:global(.dark) .moderation-actions button,
:global(.dark) .quick-action-grid a,
:global(.dark) .quick-action-grid button,
:global(.dark) .confirmation-dialog,
:global(.dark) .confirmation-dialog button.secondary {
  background: #101c2a;
  color: var(--rd-surface-alt);
}
:global(.dark) .smart-filter-panel,
:global(.dark) .verification-review-form,
:global(.dark) .universal-listing-queue {
  background: #152334;
}
:global(.dark) .property-tabs button,
:global(.dark) .analytics-tabs,
:global(.dark) .popover-heading button,
:global(.dark) .verification-queue article > button {
  background: #192738;
}
:global(.dark) .analytics-tabs button.active {
  background: #24364b;
}
:global(.dark) .moderation-actions a {
  color: var(--rd-surface-alt);
}
:global(.dark) .analytics-chart {
  background-image: linear-gradient(
    to bottom,
    transparent calc(25% - 1px),
    #26374a 25%,
    transparent calc(25% + 1px),
    transparent calc(50% - 1px),
    #26374a 50%,
    transparent calc(50% + 1px),
    transparent calc(75% - 1px),
    #26374a 75%,
    transparent calc(75% + 1px)
  );
}
</style>
