<template>
  <div class="products-page">
    <!-- Filtros responsive -->
    <div class="grid formgrid p-fluid mb-3">
      <div class="field col-12 md:col-6 lg:col-4">
        <IconField>
          <InputIcon><i class="pi pi-search" /></InputIcon>
          <InputText v-model="searchQuery" placeholder="Buscar productos..." @keyup.enter="search" class="w-full" />
        </IconField>
      </div>
      <div class="field col-12 md:col-3 lg:col-2 flex align-items-end">
        <div class="flex gap-2 w-full">
          <Button v-if="searchQuery.length" icon="pi pi-times" severity="secondary" outlined @click="clearSearch" class="flex-1" />
          <Button label="Nuevo" icon="pi pi-plus" @click="$router.push('/products/new')" class="flex-1" />
        </div>
      </div>
    </div>

    <!-- ========== TABLA: desktop/tablet ========== -->
    <div class="table-wrapper">
      <DataTable
        :value="items"
        :loading="loading"
        :lazy="true"
        :totalRecords="totalRecords"
        :first="first"
        :rows="perPage"
        paginator
        @page="onPage"
        stripedRows
        :scrollable="true"
        scrollHeight="calc(100vh - 260px)"
        size="small"
      >
        <Column field="name" header="Nombre" sortable />
        <Column field="sku" header="SKU" />
        <Column header="Tipo">
          <template #body="{data}">
            <Tag :value="data.type === 'service' ? 'Servicio' : 'Producto'" :severity="data.type === 'service' ? 'info' : 'contrast'" />
          </template>
        </Column>
        <Column field="category.name" header="Categoría" />
        <Column field="brand_relation.name" header="Marca" class="col-brand" />
        <Column header="Precio">
          <template #body="{data}">
            <div class="price-cell" @click="showPrices($event, data)">
              <span class="font-medium">${{ defaultPrice(data) }}</span>
              <i v-if="hasMultiplePrices(data)" class="pi pi-chevron-down text-xs text-gray-400" />
            </div>
          </template>
        </Column>
        <Column header="Stock" class="col-stock">
          <template #body="{data}">
            <Tag :value="data.current_stock ?? 0" :severity="(data.current_stock??0) <= data.min_stock ? 'danger' : 'info'" />
          </template>
        </Column>
        <Column header="" body-style="text-align:right">
          <template #body="{data}">
            <div class="action-btns">
              <Button icon="pi pi-pencil" text rounded @click="$router.push(`/products/${data.id}/edit`)" />
              <Button icon="pi pi-trash" text rounded severity="danger" @click="del(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- ========== CARDS: mobile (vertical + horizontal) ========== -->
    <div class="mobile-cards">
      <div v-for="item in validItems" :key="item.id" class="product-card" @click="item && $router.push(`/products/${item.id}/edit`)">
        <div class="card-row">
          <span class="card-lbl">Producto</span>
          <span class="card-val font-semibold">{{ item.name }}</span>
        </div>
        <div class="card-row" v-if="item.sku">
          <span class="card-lbl">SKU</span>
          <span class="card-val">{{ item.sku }}</span>
        </div>
        <div class="card-row" v-if="item.category?.name">
          <span class="card-lbl">Categoría</span>
          <span class="card-val">{{ item.category.name }}</span>
        </div>
        <div class="card-row">
          <span class="card-lbl">Tipo</span>
          <Tag :value="item.type === 'service' ? 'Servicio' : 'Producto'" :severity="item.type === 'service' ? 'info' : 'contrast'" size="small" />
        </div>
        <div class="card-row">
          <span class="card-lbl">Precio</span>
          <span class="card-val font-medium">${{ defaultPrice(item) }}</span>
        </div>
        <div class="card-row">
          <span class="card-lbl">Stock</span>
          <Tag :value="item.current_stock ?? 0" :severity="(item.current_stock??0) <= item.min_stock ? 'danger' : 'info'" size="small" />
        </div>
        <div class="card-actions">
          <Button icon="pi pi-pencil" text rounded @click.stop="$router.push(`/products/${item.id}/edit`)" />
          <Button icon="pi pi-trash" text rounded severity="danger" @click.stop="del(item)" />
        </div>
      </div>
      <div v-if="!items?.length && !loading" class="empty-state">
        <i class="pi pi-box" style="font-size: 2rem; color: #94a3b8;" />
        <p>No hay productos</p>
      </div>
    </div>

    <!-- Paginación mobile -->
    <div class="mobile-paginator" v-if="totalRecords > perPage && items.length">
      <Button icon="pi pi-chevron-left" text :disabled="first === 0" @click="prevPage" />
      <span class="px-3 text-sm">{{ currentPage }} / {{ totalPages }}</span>
      <Button icon="pi pi-chevron-right" text :disabled="first + perPage >= totalRecords" @click="nextPage" />
    </div>

    <!-- Dialog precios -->
    <Dialog v-model:visible="overlayVisible" :header="`Precios — ${selectedProduct?.name || ''}`" modal :style="{ width: '360px', maxWidth: '90vw' }" :dismissableMask="true">
      <div v-if="!selectedPrices.length" class="text-sm text-gray-400 italic">Sin precios configurados</div>
      <div v-for="pp in selectedPrices" :key="pp.price_list_id" class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
        <span class="text-sm text-gray-600">{{ pp.name }}</span>
        <div class="text-right">
          <div class="text-sm font-medium">${{ pp.withoutTax }}</div>
          <div class="text-xs text-gray-400">Con IVA: ${{ pp.withTax }}</div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import api from '@/api'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

const items = ref<any[]>([])
const validItems = computed(() => (items.value || []).filter(Boolean))
const loading = ref(false)
const totalRecords = ref(0)
const first = ref(0)
const perPage = ref(15)
const searchQuery = ref('')
const overlayVisible = ref(false)
const selectedProduct = ref<any>(null)
const selectedPrices = ref<any[]>([])

const totalPages = computed(() => Math.max(1, Math.ceil(totalRecords.value / perPage.value)))
const currentPage = computed(() => Math.floor(first.value / perPage.value) + 1)

function prevPage() {
  if (first.value <= 0) return
  first.value = Math.max(0, first.value - perPage.value)
  load(currentPage.value)
}
function nextPage() {
  if (first.value + perPage.value >= totalRecords.value) return
  first.value = first.value + perPage.value
  load(currentPage.value)
}

async function load(page = 1) {
  loading.value = true
  try {
    const params: any = { page, per_page: perPage.value }
    if (searchQuery.value) params.search = searchQuery.value
    const r = await api.get('/products', { params })
    // Respuesta: { success, data: { data: [{product}], total, ... } }
    const pageObj = r.data.data
    const raw = pageObj?.data || r.data.products || []
    items.value = Array.isArray(raw) ? raw : []
    totalRecords.value = pageObj?.total || r.data.meta?.total || items.value.length
  } catch (e: any) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function search() { first.value = 0; load(1) }
function clearSearch() { searchQuery.value = ''; first.value = 0; load(1) }

function onPage(event: any) {
  first.value = event.first
  load(event.page + 1)
}

function defaultPrice(p: any): string {
  if (!p.product_prices?.length) return '—'
  return parseFloat(p.product_prices[0].price_without_tax).toFixed(4)
}

function hasMultiplePrices(p: any): boolean {
  return (p.product_prices || []).length > 1
}

function showPrices(_event: Event, product: any) {
  selectedProduct.value = product
  const prices = product.product_prices || []
  selectedPrices.value = prices.map((pp: any) => ({
    price_list_id: pp.price_list_id,
    name: pp.price_list?.name || '—',
    withoutTax: parseFloat(pp.price_without_tax).toFixed(4),
    withTax: parseFloat(pp.price_with_tax).toFixed(2),
  }))
  overlayVisible.value = true
}

function del(c: any) {
  confirm.require({
    message: `¿Eliminar ${c.name}?`,
    header: 'Confirmar',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await api.delete(`/products/${c.id}`)
        toast.add({ severity: 'success', summary: 'Eliminado', life: 3000 })
        load(Math.floor(first.value / perPage.value) + 1)
      } catch {
        toast.add({ severity: 'error', summary: 'Error' })
      }
    }
  })
}

onMounted(() => load(1))
</script>

<style scoped>
.products-page {
  max-width: 100%;
}
.table-wrapper {
  overflow-x: auto;
}

/* Tabla: overflow horizontal */
.table-wrapper {
  overflow-x: auto;
}

/* En móvil (portrait < 768px) o landscape táctil con altura ≤ 550px: ocultar tabla */
@media (max-width: 767px) {
  .table-wrapper {
    display: none;
  }
}
@media (max-width: 767px) {
  .table-wrapper {
    display: none;
  }
}

/* Desktop/tablet (>768px): ocultar cards y paginador */
@media (min-width: 768px) {
  .mobile-cards,
  .mobile-paginator {
    display: none;
  }
}

/* Mobile paginator centrado */
.mobile-paginator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}

/* Tablet: columnas secundarias ocultas */
@media (max-width: 1023px) {
  .col-brand,
  .col-stock {
    display: none;
  }
}

.action-btns {
  display: flex;
  gap: 0.25rem;
  justify-content: flex-end;
  white-space: nowrap;
}
.price-cell {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

/* Cards mobile — visible solo en móvil o landscape táctil */
.mobile-cards {
  display: none;
  flex-direction: column;
  gap: 0.75rem;
  padding-bottom: 1.5rem;
}
@media (max-width: 767px) {
  .mobile-cards {
    display: flex;
  }
}
@media (max-width: 767px) {
  .mobile-cards {
    display: flex;
  }
}

/* Paginador mobile — visible en modo cards */
.mobile-paginator {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 1rem 0;
}
@media (min-width: 768px) and (max-width: 1023px) {
  .mobile-cards,
  .mobile-paginator {
    display: none !important;
  }
}
@media (min-width: 1024px) {
  .mobile-cards,
  .mobile-paginator {
    display: none !important;
  }
}
.product-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 0.625rem;
  padding: 0.875rem 1rem;
  cursor: pointer;
  transition: box-shadow 0.15s;
}
.product-card:active {
  box-shadow: 0 0 0 2px #6366f14d;
}
.card-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.3rem 0;
  border-bottom: 1px solid #f1f5f9;
  gap: 0.5rem;
}
.card-row:last-of-type {
  border-bottom: none;
}
.card-lbl {
  font-size: 0.8rem;
  color: #94a3b8;
  min-width: 70px;
  flex-shrink: 0;
}
.card-val {
  font-size: 0.875rem;
  color: #1e293b;
  text-align: right;
  word-break: break-word;
}
.card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.25rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e2e8f0;
  margin-top: 0.25rem;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  color: #94a3b8;
}
.empty-state p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
