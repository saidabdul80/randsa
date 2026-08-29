<template>
  <ion-app>
    <ion-router-outlet />
    <!-- Mounted once at the root so any page can await confirmAction(). -->
    <ConfirmDialog />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue'

import ConfirmDialog from './components/layout/ConfirmDialog.vue'
</script>
