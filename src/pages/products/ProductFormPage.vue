<template>
  <div>
    <Card>
      <template #title>{{ isEdit ? 'Editar' : 'Nuevo' }} Producto</template>
      <template #content>
        <Message v-if="globalError" severity="error" closable @close="globalError = ''">{{ globalError }}</Message>

        <!-- Skeleton loading en edición mientras se cargan datos -->
        <div v-if="loading" class="flex flex-column gap-3 p-fluid">
          <div v-for="n in 6" :key="n">
            <Skeleton width="6rem" height="0.75rem" class="mb-2" />
            <Skeleton width="100%" height="2.5rem" />
          </div>
        </div>

        <form v-else @submit.prevent="save">
          <!-- Basic info → grid responsive con labels arriba, campos abajo full-width dentro de cada celda -->
          <div class="grid formgrid p-fluid mb-6">
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Nombre *</label>
              <InputText v-model="f.name" required class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Código</label>
              <InputText v-model="f.code" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>SKU</label>
              <InputText v-model="f.sku" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Tipo</label>
              <Select v-model="f.type" :options="[
                {label:'Producto',value:'product'},
                {label:'Servicio',value:'service'},
                {label:'Materia Prima',value:'raw_material'},
                {label:'Producto Terminado',value:'finished_good'},
                {label:'Fabricado (con BOM)',value:'manufactured'},
              ]" optionLabel="label" optionValue="value" placeholder="Seleccionar tipo" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Unidad</label>
              <Select v-model="f.unit" :options="['unit','m','kg','lt','pza','par','m2','m3']" placeholder="Sel." class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Categoría</label>
              <Select v-model="f.category_id" :options="cats" optionLabel="name" optionValue="id" filter showClear placeholder="Sel." class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Marca</label>
              <Select v-model="f.brand_id" :options="brands" optionLabel="name" optionValue="id" filter showClear placeholder="Seleccionar" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>IVA</label>
              <Select v-model="f.iva_id" :options="ivas" optionLabel="label" optionValue="id" filter placeholder="Seleccionar IVA" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Precio Costo</label>
              <InputNumber v-model="f.cost_price" :minFractionDigits="2" :maxFractionDigits="2" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Stock Mínimo</label>
              <InputNumber v-model="f.min_stock" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Stock Máximo</label>
              <InputNumber v-model="f.max_stock" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Código Barras</label>
              <InputText v-model="f.barcode" class="w-full" />
            </div>
            <div class="field col-12 md:col-6 lg:col-4">
              <label>Activo</label>
              <ToggleSwitch v-model="f.is_active" />
            </div>
            <div class="field col-12">
              <label>Descripción</label>
              <Textarea v-model="f.description" rows="2" class="w-full" />
            </div>
          </div>

          <!-- Price Lists -->
          <Divider />

          <h3 class="text-lg font-semibold mb-3">Lista de Precios</h3>

          <div v-if="priceLists.length === 0" class="text-sm text-color-secondary font-italic py-2">
            No hay listas de precios disponibles. Cree una en <router-link to="/price-lists" class="text-primary underline">Listas de Precios</router-link>.
          </div>

          <div v-for="(pl, idx) in priceLists" :key="pl.id">
            <Panel :header="pl.name" :toggleable="false" class="mb-3">
              <template #icons>
                <Chip v-if="pl.is_default" label="default" class="text-xs" size="small" />
              </template>
              <div class="grid formgrid p-fluid">
                <div class="field col-12 md:col-6">
                  <label>Precio sin IVA</label>
                  <InputNumber
                    :model-value="getPriceValue(pl.id, 'without_tax')"
                    @update:model-value="(val) => updatePriceWithoutTax(pl.id, val ?? 0)"
                    :minFractionDigits="4"
                    :maxFractionDigits="6"
                    class="w-full"
                  />
                </div>
                <div class="field col-12 md:col-6">
                  <label>Precio con IVA <span class="text-sm text-color-secondary">(IVA {{ selectedIvaRate }}%)</span></label>
                  <InputNumber
                    :model-value="getPriceValue(pl.id, 'with_tax')"
                    @update:model-value="(val) => updatePriceWithTax(pl.id, val ?? 0)"
                    :minFractionDigits="decimalPlaces"
                    :maxFractionDigits="decimalPlaces"
                    class="w-full"
                  />
                </div>
              </div>
            </Panel>
          </div>

          <!-- BOM component list: only for manufactured products -->
          <template v-if="f.type === 'manufactured'">
            <Divider />
            <h3 class="text-lg font-semibold mb-3">Componentes (BOM) <Tag value="Fabricado" severity="warn" class="text-xs ml-2" /></h3>
            <p class="text-sm text-color-secondary mb-3">Estos componentes se precargarán como materiales al crear una orden de trabajo de producción.</p>

            <template v-if="bomComponents.length === 0">
              <div class="text-sm text-color-secondary font-italic py-2 mb-3 p-3 surface-ground border-round">
                Sin componentes definidos. Agregue los materiales necesarios para fabricar este producto.
              </div>
            </template>

            <!-- Desktop BOM table -->
            <DataTable v-if="bomComponents.length > 0" :value="bomComponents" class="hidden md:!table mb-3" stripedRows size="small">
              <Column field="component.name" header="Componente" style="min-width:160px" />
              <Column field="quantity" header="Cantidad" style="width:100px" class="text-right">
                <template #body="{ data }">
                  <InputNumber v-model="data.quantity" :min="0.001" :minFractionDigits="3" :maxFractionDigits="6" size="small" class="w-20" @blur="updateBomComponent(data)" />
                </template>
              </Column>
              <Column field="unit" header="Unidad" style="width:100px">
                <template #body="{ data }">
                  <InputText v-model="data.unit" size="small" class="w-full" @blur="updateBomComponent(data)" />
                </template>
              </Column>
              <Column header="" style="width:60px" class="text-center">
                <template #body="{ data }">
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removeBomComponent(data)" />
                </template>
              </Column>
            </DataTable>

            <!-- Mobile BOM list -->
            <div v-if="bomComponents.length > 0" class="block md:hidden mb-3">
              <div v-for="(c, i) in bomComponents" :key="c.id" class="pb-2 mb-2" style="border-bottom:1px solid var(--p-content-border-color)">
                <div class="flex justify-content-between align-items-start gap-2">
                  <div>
                    <span class="font-semibold text-sm">{{ c.component?.name || '#'+c.component_id }}</span>
                    <span class="text-color-secondary text-xs ml-1">{{ c.unit }}</span>
                  </div>
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" @click="removeBomComponent(c)" />
                </div>
                <div class="flex align-items-center gap-2 mt-1">
                  <InputNumber v-model="c.quantity" :min="0.001" :minFractionDigits="3" :maxFractionDigits="6" size="small" class="w-16" @blur="updateBomComponent(c)" />
                  <InputText v-model="c.unit" size="small" class="w-12" placeholder="ud." @blur="updateBomComponent(c)" />
                </div>
              </div>
            </div>

            <Button label="Agregar componente" icon="pi pi-plus" severity="secondary" size="small" @click="showBomDialog = true" />
          </template>

          <div class="flex flex-column md:flex-row justify-content-end gap-2 mt-3">
            <Button label="Cancelar" severity="secondary" @click="$router.push('/products')" />
            <Button type="submit" label="Guardar" :loading="saving" />
          </div>
        </form>
      </template>
    </Card>

    <!-- BOM add component dialog -->
    <Dialog v-model:visible="showBomDialog" header="Agregar componente" modal :style="{ width: 'min(420px, 95vw)' }">
      <div class="flex flex-column gap-3">
        <div class="field">
          <label class="text-sm font-semibold text-color-secondary">Componente</label>
          <AutoComplete
            v-model="bomForm.productQuery"
            :suggestions="bomProductSuggestions"
            @complete="searchBomProduct"
            @item-select="onBomProductSelect"
            optionLabel="name"
            placeholder="Buscar producto..."
            class="w-full"
            forceSelection
          >
            <template #option="{ option }">
              <div class="flex align-items-center gap-2">
                <span>{{ option.name }}</span>
                <Tag v-if="option.sku" :value="option.sku" severity="info" class="text-xs" />
              </div>
            </template>
          </AutoComplete>
        </div>
        <div class="grid">
          <div class="field col-6">
            <label class="text-sm font-semibold text-color-secondary">Cantidad</label>
            <InputNumber v-model="bomForm.quantity" :min="0.001" :minFractionDigits="3" :maxFractionDigits="6" class="w-full" />
          </div>
          <div class="field col-6">
            <label class="text-sm font-semibold text-color-secondary">Unidad</label>
            <InputText v-model="bomForm.unit" placeholder="ud." class="w-full" />
          </div>
        </div>
        <Message v-if="bomForm.error" severity="error" :closable="false" class="text-sm">{{ bomForm.error }}</Message>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button label="Cancelar" text severity="secondary" @click="showBomDialog = false" />
          <Button label="Agregar" icon="pi pi-plus" :loading="bomForm.saving" :disabled="!bomForm.selectedProduct" @click="addBomComponent" />
        </div>
      </template>
    </Dialog>

    <Toast />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useRounding } from '@/composables/useRounding'
import { useRoute, useRouter } from 'vue-router'
import api from '@/api/client'
import { getPriceLists, type PriceList, type ProductPrice } from '@/api/priceLists'
import { fetchSettings } from '@/api/settings'
import { fetchRequiredFields } from '@/composables/useRequiredFields'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'
import ToggleSwitch from 'primevue/toggleswitch'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Divider from 'primevue/divider'
import Panel from 'primevue/panel'
import Chip from 'primevue/chip'
import Skeleton from 'primevue/skeleton'
import AutoComplete from 'primevue/autocomplete'
import Dialog from 'primevue/dialog'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import PhotoUploader from '@/components/PhotoUploader.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)

const requiredProductFields = ref<string[]>([])

onMounted(async () => {
  const fields = await fetchRequiredFields()
  requiredProductFields.value = fields.requiredProductFields.value
})

const fieldLabels: Record<string, string> = {
  code: 'Código',
  sku: 'SKU',
  unit: 'Unidad de medida',
  category: 'Categoría',
  supplier: 'Proveedor',
  cost_price: 'Precio de costo',
  sale_price: 'Precio de venta',
  iva: 'IVA',
  stock_min: 'Stock mínimo',
}

const f = reactive({
  name: '',
  code: '',
  sku: '',
  type: 'product',
  unit: 'unit',
  category_id: null as number | null,
  brand_id: null as number | null,

  iva_id: null as number | null,
  cost_price: 0,
  selling_price: 0,
  min_stock: 0,
  max_stock: null as number | null,
  description: '',
  barcode: '',
  is_active: true,
  is_public: false,
})

interface IvaOption {
  id: number
  name: string
  percentage: number
  is_active: boolean
  label: string
}

const cats = ref<Array<{ id: number; name: string }>>([])
const brands = ref<Array<{ id: number; name: string }>>([])
const ivas = ref<IvaOption[]>([])
const priceLists = ref<PriceList[]>([])
const productPrices = ref<ProductPrice[]>([])
const saving = ref(false)

const productData = ref<any>(null)

// ── BOM management (manufactured products) ──
const showBomDialog = ref(false)
const bomComponents = ref<any[]>([])
const bomForm = reactive({
  productQuery: '',
  selectedProduct: null as any | null,
  quantity: 1,
  unit: 'ud',
  saving: false,
  error: '',
})
const bomProductSuggestions = ref<any[]>([])

async function loadBomComponents() {
  if (!isEdit.value || f.type !== 'manufactured' || !productData.value?.id) return
  try {
    const res = await api.get(`/products/${productData.value.id}/components`)
    bomComponents.value = (res.data?.data || res.data || [])
  } catch { /* ignore */ }
}

watch(() => f.type, (t) => {
  if (t === 'manufactured' && isEdit.value && productData.value?.id) {
    loadBomComponents()
  } else if (t !== 'manufactured') {
    bomComponents.value = []
  }
})

watch(productData, (p) => {
  if (p && p.type === 'manufactured') loadBomComponents()
})

async function searchBomProduct(e: any) {
  const query = e.query?.trim() || ''
  if (query.length < 1) { bomProductSuggestions.value = []; return }
  try {
    const res = await api.get('/products', { params: { search: query, per_page: 10, all_types: 1 } })
    const items = (res.data?.data || res.data || [])
      .filter((p: any) => p.id !== productData.value?.id)
    bomProductSuggestions.value = items
  } catch { bomProductSuggestions.value = [] }
}

function onBomProductSelect(e: any) {
  bomForm.selectedProduct = e.value
}

async function addBomComponent() {
  if (!bomForm.selectedProduct || !productData.value?.id) return
  bomForm.saving = true
  bomForm.error = ''
  try {
    const res = await api.post(`/products/${productData.value.id}/components`, {
      component_id: bomForm.selectedProduct.id,
      quantity: bomForm.quantity,
      unit: bomForm.unit,
    })
    bomComponents.value.push(res.data?.data || res.data)
    showBomDialog.value = false
    resetBomForm()
    toast.add({ severity: 'success', summary: 'Componente agregado', life: 3000 })
  } catch (e: any) {
    bomForm.error = e?.response?.data?.message || 'Error al agregar componente.'
  } finally {
    bomForm.saving = false
  }
}

async function updateBomComponent(component: any) {
  if (!component.id || !productData.value?.id || !isEdit.value) return
  try {
    await api.put(`/products/${productData.value.id}/components/${component.id}`, {
      quantity: component.quantity,
      unit: component.unit,
    })
  } catch { /* ignore */ }
}

async function removeBomComponent(component: any) {
  if (!component.id || !productData.value?.id) return
  if (!confirm(`¿Eliminar ${component.component?.name || 'este componente'} de la lista?`)) return
  try {
    await api.delete(`/products/${productData.value.id}/components/${component.id}`)
    bomComponents.value = bomComponents.value.filter((c: any) => c.id !== component.id)
    toast.add({ severity: 'success', summary: 'Componente eliminado', life: 3000 })
  } catch { /* ignore */ }
}

function resetBomForm() {
  bomForm.productQuery = ''
  bomForm.selectedProduct = null
  bomForm.quantity = 1
  bomForm.unit = 'ud'
  bomForm.error = ''
}

const loading = ref(!!route.params.id)  // true en edición — Skeleton inmediato
const globalError = ref('')
const decimalPlaces = ref(2)
const roundingMode = ref('half_up')

// Selected IVA rate — computed from the current f.iva_id
const selectedIvaRate = computed(() => {
  const found = ivas.value.find(i => i.id === f.iva_id)
  return found ? found.percentage : 0
})

// Rounding helpers
const { round, computePriceWithTax, computePriceWithoutTax, formatMoney } = useRounding(decimalPlaces, roundingMode)

// Price lookup and update
function getPriceValue(priceListId: number, field: 'without_tax' | 'with_tax'): number {
  const pp = productPrices.value.find(p => p.price_list_id === priceListId)
  if (!pp) return 0
  return field === 'without_tax' ? pp.price_without_tax : pp.price_with_tax
}

function upsertPrice(priceListId: number, withoutTax: number, withTax: number) {
  const existing = productPrices.value.find(p => p.price_list_id === priceListId)
  if (existing) {
    existing.price_without_tax = withoutTax
    existing.price_with_tax = withTax
  } else {
    productPrices.value.push({
      product_id: 0,
      price_list_id: priceListId,
      price_without_tax: withoutTax,
      price_with_tax: withTax,
    })
  }
}

function updatePriceWithoutTax(priceListId: number, val: number) {
  const withTax = computePriceWithTax(val, selectedIvaRate.value)
  const recalculatedWithoutTax = selectedIvaRate.value > 0
    ? withTax / (1 + selectedIvaRate.value / 100)
    : val
  upsertPrice(priceListId, recalculatedWithoutTax, withTax)
}

function updatePriceWithTax(priceListId: number, val: number) {
  const withoutTax = computePriceWithoutTax(val, selectedIvaRate.value)
  upsertPrice(priceListId, withoutTax, val)
}

// Recalc all prices when IVA changes
function recalcAllPrices() {
  for (const pp of productPrices.value) {
    if (pp.price_without_tax > 0) {
      pp.price_with_tax = computePriceWithTax(pp.price_without_tax, selectedIvaRate.value)
    } else if (pp.price_with_tax > 0) {
      pp.price_without_tax = computePriceWithoutTax(pp.price_with_tax)
    }
  }
}

watch(() => f.iva_id, (_newVal, _oldVal) => {
  if (ivas.value.length === 0) return
  recalcAllPrices()
})

onMounted(async () => {
  // Si es edición, ya empezó con loading=true (definido en declaración del ref)

  // Load IVAs
  try {
    const { data: ivaRes } = await api.get('/ivas')
    const raw = ivaRes?.data?.data || ivaRes?.data || []
    const allIvas: any[] = Array.isArray(raw) ? raw : []
    ivas.value = allIvas.map(i => ({
      ...i,
      label: `[${i.code}] ${i.name} (${i.percentage}%)`,
    }))
  } catch {}

  // Load settings for rounding config
  try {
    const settings = await fetchSettings()
    if (settings) {
      for (const entries of Object.values(settings)) {
        for (const entry of entries as any[]) {
          if (entry.key === 'pricing.decimal_places') decimalPlaces.value = parseInt(entry.value) || 2
          if (entry.key === 'pricing.rounding_mode') roundingMode.value = entry.value || 'half_up'
        }
      }
    }
  } catch {}

  // Load price lists
  try {
    priceLists.value = await getPriceLists()
  } catch {
    globalError.value = 'Error al cargar listas de precios'
  }

  // Load categories
  try {
    const { data: catData } = await api.get('/categories?per_page=100')
    cats.value = catData.data?.data || []
  } catch {}

  // Load brands
  try {
    const { data: brandData } = await api.get('/brands')
    brands.value = brandData.data || []
  } catch {}

  // Load product data for edit
  if (isEdit.value) {
    try {
      const { data: res } = await api.get(`/products/${route.params.id}`)
      productData.value = res.data
      Object.assign(f, productData.value)
      f.iva_id = productData.value.iva_id || null

      if (productData.value.product_prices) {
        productPrices.value = productData.value.product_prices.map((pp: any) => ({
          product_id: pp.product_id || productData.value.id,
          price_list_id: pp.price_list_id,
          price_without_tax: parseFloat(pp.price_without_tax) || 0,
          price_with_tax: parseFloat(pp.price_with_tax) || 0,
        }))
      }
    } catch {
      globalError.value = 'Error al cargar producto'
    } finally {
      loading.value = false
    }
  } else {
    // Auto-select IVA 15% (code=4) for new products, fallback to first active
    const defaultIva = ivas.value.find(i => i.code === '4') || ivas.value.find(i => i.is_active)
    if (defaultIva && !f.iva_id) f.iva_id = defaultIva.id

    // Pre-fill default price list
    const defaultList = priceLists.value.find(pl => pl.is_default)
    if (defaultList && !productPrices.value.find(p => p.price_list_id === defaultList.id)) {
      upsertPrice(defaultList.id, 0, 0)
    }
  }
})

async function save() {
  saving.value = true
  globalError.value = ''

  // Validate required fields
  const missing: string[] = []
  for (const field of requiredProductFields.value) {
    if (field === 'code') {
      if (!f.code?.trim()) missing.push(fieldLabels.code)
    } else if (field === 'sku') {
      if (!f.sku?.trim()) missing.push(fieldLabels.sku)
    } else if (field === 'unit') {
      if (!f.unit?.trim()) missing.push(fieldLabels.unit)
    } else if (field === 'category') {
      if (!f.category_id) missing.push(fieldLabels.category)
    } else if (field === 'supplier') {
      if (!f.supplier_id) missing.push(fieldLabels.supplier)
    } else if (field === 'cost_price') {
      if (!f.cost_price && f.cost_price !== 0) missing.push(fieldLabels.cost_price)
    } else if (field === 'sale_price') {
      if (!f.sale_price && f.sale_price !== 0) missing.push(fieldLabels.sale_price)
    } else if (field === 'iva') {
      if (!f.iva_id) missing.push(fieldLabels.iva)
    } else if (field === 'stock_min') {
      if (!f.stock_min && f.stock_min !== 0) missing.push(fieldLabels.stock_min)
    }
  }
  if (missing.length) {
    toast.add({ severity: 'error', summary: 'Campos requeridos', detail: 'Complete: ' + missing.join(', '), life: 5000 })
    saving.value = false
    return
  }

  const payload: any = { ...f }
  payload.prices = productPrices.value.map(pp => ({
    price_list_id: pp.price_list_id,
    price_without_tax: pp.price_without_tax,
    price_with_tax: pp.price_with_tax,
  }))

  try {
    if (isEdit.value) {
      await api.put(`/products/${route.params.id}`, payload)
    } else {
      await api.post('/products', payload)
    }
    toast.add({ severity: 'success', summary: 'Producto guardado', life: 3000 })
    setTimeout(() => router.push('/products'), 500)
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al guardar producto'
  } finally {
    saving.value = false
  }
}
</script>

