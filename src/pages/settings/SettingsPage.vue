<template>
  <div class="grid">
    <!-- Page title (full width, always on top) -->
    <div class="col-12">
      <h1 class="text-xl md:text-2xl font-bold text-color">Configuración Global</h1>
    </div>

    <!-- Messages (full width) -->
    <div class="col-12">
      <Message v-if="globalError" severity="error" closable @close="globalError = null">{{ globalError }}</Message>
      <Message v-if="successMsg" severity="success" closable @close="successMsg = ''">{{ successMsg }}</Message>
    </div>

    <!-- Sidebar: desktop - col-3 on lg+, hidden on mobile -->
    <div class="hidden lg:block col-12 lg:col-3">
      <div class="flex flex-column gap-1">
        <button
          v-for="s in sections"
          :key="s.key"
          class="flex align-items-center gap-2 w-full px-3 py-2 border-round text-sm text-left transition-colors"
          :class="activeSection === s.key ? 'bg-primary text-primary-contrast font-semibold' : 'text-color-secondary hover:surface-hover'"
          @click="goSection(s.key)"
        >
          <i :class="s.icon" />
          {{ s.label }}
          <i v-if="s.badge && s.badge > 0" class="pi pi-circle-fill text-primary ml-auto" style="font-size: 0.45rem" />
        </button>
      </div>
    </div>

    <!-- Mobile drawer trigger: full width, above content -->
    <div class="block lg:hidden col-12 mb-3">
      <Button
        icon="pi pi-bars"
        :label="activeSectionLabel"
        severity="secondary"
        size="small"
        class="w-full"
        @click="sidebarVisible = true"
      />
      <Sidebar v-model:visible="sidebarVisible" header="Secciones" position="left" :pt="{ root: { class: 'w-64' } }">
        <div class="flex flex-column gap-1">
          <button
            v-for="s in sections"
            :key="s.key"
            class="flex align-items-center gap-3 w-full px-3 py-2.5 border-round text-sm text-left transition-colors"
            :class="activeSection === s.key ? 'bg-primary text-primary-contrast font-semibold' : 'text-color-secondary hover:surface-hover'"
            @click="goSection(s.key); sidebarVisible = false"
          >
            <i :class="s.icon" />
            {{ s.label }}
          </button>
        </div>
      </Sidebar>
    </div>

    <!-- Content: col-9 on lg+, full width on mobile -->
    <div class="col-12 lg:col-9 flex flex-column gap-3">
      <!-- ===== COMPANY ===== -->
      <Card v-if="activeSection === 'company'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-building text-primary" /><span>Datos de la empresa</span></div>
        </template>
        <template #content>
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Nombre de la empresa</label>
              <InputText v-model="form.company_name"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Nombre Comercial</label>
              <InputText v-model="form.company_commercial_name"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">RIF / RUC</label>
              <InputText v-model="form.company_document"  class="w-full" />
            </div>
            <div class="field col-12">
              <label class="text-sm font-semibold text-color-secondary">Dirección</label>
              <InputText v-model="form.company_address"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Teléfono</label>
              <InputText v-model="form.company_phone"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Correo electrónico</label>
              <InputText v-model="form.company_email"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Símbolo de moneda</label>
              <InputText v-model="form.company_currency" placeholder="Bs., $, €"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Código de moneda (ISO)</label>
              <InputText v-model="form.company_currency_code" placeholder="VES, USD, EUR"  class="w-full" />
            </div>
          </div>
          <div class="flex justify-content-end mt-3">
            <Button label="Guardar datos de empresa" icon="pi pi-save" @click="openConfirm('company')" />
          </div>
        </template>
      </Card>

      <!-- ===== TAX ===== -->
      <div v-if="activeSection === 'tax'" class="flex flex-column gap-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-percentage text-primary"></i>
          <span class="font-semibold text-base md:text-lg">% IVA e Impuestos</span>
        </div>
        <p class="text-xs md:text-sm text-color-secondary">Configura los porcentajes de IVA segun el catalogo del SRI.</p>

        <!-- Desktop -->
        <DataTable :value="ivas" class="hidden md:!table" stripedRows :loading="loadingIvas">
          <Column field="name" header="Nombre" style="min-width:180px">
            <template #body="{ data }">
              <InputText v-if="editIvaId === data.id" v-model="editForm.name" class="w-full text-sm" />
              <span v-else>{{ data.name }}</span>
            </template>
          </Column>
          <Column field="code" header="Código SRI" style="width:100px" />
          <Column field="percentage" header="%" style="width:80px" class="text-right">
            <template #body="{ data }">
              <InputNumber v-if="editIvaId === data.id" v-model="editForm.percentage" :min="0" :max="100" :minFractionDigits="2" inputClass="text-sm text-right w-20"  class="w-full" />
              <span v-else>{{ data.percentage }}%</span>
            </template>
          </Column>
          <Column field="is_default" header="Predet." style="width:90px" class="text-center">
            <template #body="{ data }">
              <Tag v-if="data.is_default" value="Sí" severity="success" />
              <span v-else class="text-color-secondary">—</span>
            </template>
          </Column>
          <Column header="" style="width:180px">
            <template #body="{ data }">
              <template v-if="editIvaId === data.id">
                <Button icon="pi pi-check" rounded text severity="success" size="small" v-tooltip.top="'Guardar cambios'" @click="saveIva(data)" />
                <Button icon="pi pi-times" rounded text severity="secondary" size="small" v-tooltip.top="'Cancelar'" @click="cancelEditIva" />
              </template>
              <template v-else>
                <Button icon="pi pi-pencil" rounded text severity="info" size="small" v-tooltip.top="'Editar nombre/porcentaje'" @click="startEditIva(data)" />
                <Button icon="pi pi-star" rounded text severity="warn" size="small" v-tooltip.top="'Establecer como predeterminado'" :disabled="data.is_default" :loading="savingDefaultId === data.id" @click="setDefaultIva(data)" />
              </template>
            </template>
          </Column>
        </DataTable>

        <!-- Mobile -->
        <div class="block md:hidden">
          <div v-for="iva in ivas" :key="iva.id" class="pb-2 mb-2" style="border-bottom: 1px solid var(--p-content-border-color)">
            <div class="flex justify-content-between align-items-start gap-2">
              <div>
                <span class="font-semibold text-sm">{{ iva.name }}</span>
                <span class="text-color-secondary text-xs ml-1">({{ iva.code }})</span>
              </div>
              <Tag v-if="iva.is_default" value="Predet." severity="success" size="small" />
            </div>
            <div class="flex justify-content-between align-items-center mt-1">
              <span class="font-bold text-base">{{ iva.percentage }}%</span>
              <div class="flex gap-1">
                <Button icon="pi pi-pencil" rounded text severity="info" size="small" v-tooltip.top="'Editar'" @click="startEditIva(iva)" />
                <Button icon="pi pi-star" rounded text severity="warn" size="small" v-tooltip.top="'Predeterminado'" :disabled="iva.is_default" :loading="savingDefaultId === iva.id" @click="setDefaultIva(iva)" />
              </div>
            </div>
            <template v-if="editIvaId === iva.id">
              <div class="flex gap-2 mt-2">
                <InputText v-model="editForm.name" class="w-full text-sm" placeholder="Nombre" />
                <InputNumber v-model="editForm.percentage" :min="0" :max="100" :minFractionDigits="2" inputClass="text-sm text-right w-16"  class="w-full" />
              </div>
              <div class="flex gap-2 mt-1">
                <Button label="Guardar" icon="pi pi-check" size="small" severity="success" @click="saveIva(iva)" />
                <Button label="Cancelar" icon="pi pi-times" size="small" severity="secondary" text @click="cancelEditIva" />
              </div>
            </template>
          </div>
        </div>

        <div v-if="ivas.length === 0 && !loadingIvas" class="text-color-secondary text-sm p-4 text-center">
          No se encontraron tipos de IVA en la base de datos.
        </div>
      </div>

      <!-- ===== INVOICE ===== -->
      <Card v-if="activeSection === 'invoice'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-receipt text-primary" /><span>Facturación</span></div>
        </template>
        <template #content>
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Base de facturación predeterminada</label>
              <Select class="w-full" v-model="form.invoice_default_billing_basis" :options="[
                { label: 'Estimada', value: 'estimated' },
                { label: 'Real', value: 'actual' },
              ]" optionValue="value" optionLabel="label" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Modo de facturación predeterminado</label>
              <Select class="w-full" v-model="form.invoice_default_billing_mode" :options="[
                { label: 'Líneas manuales', value: 'line_items' },
                { label: 'Basado en listado', value: 'product_list' },
              ]" optionValue="value" optionLabel="label" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Días de crédito por defecto</label>
              <InputNumber v-model="form.invoice_payment_days" :min="0" :useGrouping="false"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Mostrar detalle de impuestos</label>
              <div class="flex align-items-center gap-2 mt-2">
                <InputSwitch v-model="form.invoice_show_tax_detail" />
                <span class="text-sm text-color-secondary">{{ form.invoice_show_tax_detail ? 'Sí' : 'No' }}</span>
              </div>
            </div>
            <div class="field col-12">
              <label class="text-sm font-semibold text-color-secondary">Texto al pie de factura</label>
              <Textarea v-model="form.invoice_footer_text" :rows="2"  class="w-full" />
            </div>
          </div>
          <div class="flex justify-content-end mt-3">
            <Button label="Guardar facturación" icon="pi pi-save" @click="openConfirm('invoice')" />
          </div>
        </template>
      </Card>

      <!-- ===== PRICING ===== -->
      <Card v-if="activeSection === 'pricing'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-dollar text-primary" /><span>Precios y Redondeo</span></div>
        </template>
        <template #content>
          <p class="text-sm text-color-secondary mb-3">
            Estos parámetros controlan cómo se redondea el precio al calcular el precio con IVA.
            El precio unitario se guarda sin IVA, pero se ajusta para que el precio con IVA (calculado)
            tenga exactamente la cantidad de decimales especificada.
          </p>
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Decimales del precio final con IVA</label>
              <InputNumber v-model="form.pricing_decimal_places" :min="0" :max="10" :useGrouping="false"  class="w-full" />
              <p class="text-xs text-color-secondary mt-1">El precio con IVA se redondeará a este número de decimales (normalmente 2)</p>
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Modo de redondeo</label>
              <Select class="w-full"
                v-model="form.pricing_rounding_mode"
                :options="roundingModes"
                optionLabel="label"
                optionValue="value" />
            </div>
          </div>
          <div class="p-3 surface-ground border-1 surface-border border-round text-sm text-color-secondary mt-3">
            <p class="font-semibold mb-1">⚙️ Cómo funciona:</p>
            <ol class="ml-3 mb-0">
              <li class="mb-1 text-xs">El usuario ingresa un precio con IVA o sin IVA</li>
              <li class="mb-1 text-xs">Si ingresó <strong>sin IVA</strong>: precioConIva = precio &times; (1 + tarifaIVA); se redondea a {{form.pricing_decimal_places}} decimales; nuevoPrecio = precioConIvaRedondeado / (1 + tarifaIVA)</li>
              <li class="mb-1 text-xs">Si ingresó <strong>con IVA</strong>: se redondea a {{form.pricing_decimal_places}} decimales; nuevoPrecio = precioConIvaRedondeado / (1 + tarifaIVA)</li>
              <li class="mb-0 text-xs">El valor guardado en BD es <strong>nuevoPrecio</strong> (sin IVA, ajustado)</li>
            </ol>
          </div>
          <div class="flex justify-content-end mt-3">
            <Button label="Guardar parámetros de redondeo" icon="pi pi-save" @click="openConfirm('pricing')" />
          </div>
        </template>
      </Card>

      <!-- ===== GENERAL ===== -->
      <Card v-if="activeSection === 'general'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-cog text-color-secondary" /><span>Configuración General</span></div>
        </template>
        <template #content>
          <div class="grid formgrid p-fluid">
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Zona horaria</label>
              <InputText v-model="form.general_timezone" placeholder="America/Caracas"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Locale</label>
              <InputText v-model="form.general_locale" placeholder="es"  class="w-full" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Método de costeo</label>
              <Select class="w-full"
                v-model="form.general_cost_method"
                :options="costMethods"
                optionLabel="label"
                optionValue="value" />
            </div>
            <div class="field col-12 md:col-6">
              <label class="text-sm font-semibold text-color-secondary">Permitir stock negativo</label>
              <div class="flex align-items-center gap-2 mt-2">
                <InputSwitch v-model="form.general_stock_negative_allowed" />
                <span class="text-sm text-color-secondary">{{ form.general_stock_negative_allowed ? 'Sí' : 'No' }}</span>
              </div>
            </div>
          </div>
          <div class="flex justify-content-end mt-3">
            <Button label="Guardar general" icon="pi pi-save" @click="openConfirm('general')" />
          </div>
        </template>
      </Card>

      <!-- ===== WORK ORDERS ===== -->
      <Card v-if="activeSection === 'work_orders'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-clipboard text-primary" /><span>Órdenes de Trabajo</span></div>
        </template>
        <template #content>
          <div class="grid formgrid p-fluid">
            <div class="field col-12">
              <label class="text-sm font-semibold text-color-secondary">Modo de selección de miembros del equipo</label>
              <Select class="w-full"
                v-model="form.work_orders_member_selection_mode"
                :options="[
                  { label: 'Búsqueda por nombre (AutoComplete)', value: 'autocomplete' },
                  { label: 'Listado completo (MultiSelect)', value: 'select' }
                ]"
                optionLabel="label"
                optionValue="value" />
              <p class="text-xs text-color-secondary mt-1">Define cómo se seleccionan los miembros del equipo en las órdenes de trabajo</p>
            </div>
          </div>
          <div class="flex justify-content-end mt-3">
            <Button label="Guardar" icon="pi pi-save" @click="openConfirm('work_orders')" />
          </div>
        </template>
      </Card>

      <!-- ===== CAMPOS REQUERIDOS ===== -->
      <Card v-if="activeSection === 'validation'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-check-circle text-primary" /><span>Campos Requeridos</span></div>
        </template>
        <template #content>
          <p class="text-sm text-color-secondary mb-4">Seleccione los campos que serán obligatorios al crear o editar registros.</p>

          <div class="grid">
            <!-- Clientes -->
            <div class="col-12 lg:col-6 mb-3 lg:mb-0 lg:pr-3">
              <div class="surface-card border-1 surface-border border-round p-3">
                <h3 class="font-semibold text-sm flex align-items-center gap-2 mb-2"><i class="pi pi-users text-primary" /> Clientes</h3>
                <div v-for="field in clientFields" :key="field.key" class="flex align-items-center gap-2 py-1 hover:surface-hover border-round px-2 cursor-pointer" @click="toggleClientField(field.key)">
                  <Checkbox
                    :inputId="'client-' + field.key"
                    :modelValue="requiredClientFields.includes(field.key)"
                    :binary="true"
                    @update:modelValue="toggleClientField(field.key)"
                  />
                  <label :for="'client-' + field.key" class="text-sm cursor-pointer select-none">{{ field.label }}</label>
                </div>
              </div>
            </div>

            <!-- Productos -->
            <div class="col-12 lg:col-6">
              <div class="surface-card border-1 surface-border border-round p-3">
                <h3 class="font-semibold text-sm flex align-items-center gap-2 mb-2"><i class="pi pi-box text-primary" /> Productos</h3>
                <div v-for="field in productFields" :key="field.key" class="flex align-items-center gap-2 py-1 hover:surface-hover border-round px-2 cursor-pointer" @click="toggleProductField(field.key)">
                  <Checkbox
                    :inputId="'product-' + field.key"
                    :modelValue="requiredProductFields.includes(field.key)"
                    :binary="true"
                    @update:modelValue="toggleProductField(field.key)"
                  />
                  <label :for="'product-' + field.key" class="text-sm cursor-pointer select-none">{{ field.label }}</label>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-content-end mt-4">
            <Button label="Guardar campos requeridos" icon="pi pi-save" @click="openConfirm('validation')" />
          </div>
        </template>
      </Card>

      <!-- ===== SUCURSALES ===== -->
      <Card v-if="activeSection === 'branches'">
        <template #title>
          <div class="flex align-items-center gap-2"><i class="pi pi-building text-primary" /><span>Sucursales y Puntos de Emisión</span></div>
        </template>
        <template #content>
          <div class="flex flex-column gap-3">
            <div v-if="!establishments.length" class="text-center py-8 text-color-secondary">
              <i class="pi pi-building text-4xl block mb-2" />
              <p>No hay sucursales registradas. Cree la primera.</p>
              <Button label="Crear Sucursal" icon="pi pi-plus" size="small" class="mt-3" @click="openEstDialog()" />
            </div>

            <div v-for="(est, ei) in establishments" :key="est.id" class="surface-card border-1 surface-border border-round">
              <!-- Header: desktop horizontal, mobile vertical -->
              <div class="flex flex-column lg:flex-row lg:align-items-center lg:justify-content-between p-3 surface-ground border-bottom-1 surface-border cursor-pointer hover:surface-hover transition-colors" @click="toggleEst(ei)">
                <!-- Left: chevron + code + name + tags -->
                <div class="flex flex-column lg:flex-row lg:align-items-center gap-2 lg:gap-3">
                  <div class="flex align-items-center gap-2">
                    <i :class="expandedEst[est.id!] ? 'pi pi-chevron-down' : 'pi pi-chevron-right'" class="text-color-secondary text-sm" />
                    <span class="font-mono text-xs surface-card border-1 surface-border px-2 py-1 border-round text-color-secondary">{{ est.code }}</span>
                    <span class="font-semibold text-sm">{{ est.name }}</span>
                  </div>
                  <div class="flex align-items-center gap-2 flex-wrap">
                    <Tag v-if="est.address" :value="est.address" severity="contrast" class="text-xs max-w-12rem lg:max-w-60 truncate" />
                    <Tag :value="est.is_active ? 'Activo' : 'Inactivo'" :severity="est.is_active ? 'success' : 'danger'" class="text-xs" />
                  </div>
                </div>
                <!-- Right: action buttons -->
                <div class="flex gap-1 mt-2 lg:mt-0">
                  <Button icon="pi pi-plus" text rounded size="small" severity="secondary" class="p-1" @click.stop="openEpDialog(est)" v-tooltip.top="'Agregar punto de emisión'" />
                  <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" class="p-1" @click.stop="openEstDialog(est, ei)" />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" class="p-1" @click.stop="deleteEst(est)" />
                </div>
              </div>

              <!-- Emission points -->
              <div v-if="expandedEst[est.id!]">
                <div v-if="!est.emission_points?.length" class="p-3 text-sm text-color-secondary text-center">
                  Sin puntos de emisión
                </div>
                <div v-for="(ep) in est.emission_points" :key="ep.id" class="p-3 border-bottom-1 surface-border hover:surface-hover">
                  <!-- Desktop: side-by-side, Mobile: vertical stack -->
                  <div class="flex flex-column lg:flex-row lg:align-items-start gap-3">
                    <div class="flex-1 flex flex-column gap-2 text-sm">
                      <!-- EP header: code + name + tag -->
                      <div class="flex align-items-center gap-2 flex-wrap">
                        <span class="font-mono font-semibold">{{ ep.code }}</span>
                        <span v-if="ep.name" class="text-color-secondary">— {{ ep.name }}</span>
                        <Tag :value="ep.is_active ? 'Activo' : 'Inactivo'" :severity="ep.is_active ? 'success' : 'danger'" class="text-xs" />
                      </div>
                      <!-- Sequence fields: desktop grid 2 cols, mobile single column -->
                      <div class="grid formgrid">
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Factura</label>
                          <InputNumber v-model="ep.invoice_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Liquidación</label>
                          <InputNumber v-model="ep.liquidation_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Nota Crédito</label>
                          <InputNumber v-model="ep.credit_note_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Nota Débito</label>
                          <InputNumber v-model="ep.debit_note_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Guía</label>
                          <InputNumber v-model="ep.guide_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                        <div class="col-12 sm:col-6 md:col-4 lg:col-6">
                          <label class="text-xs font-semibold text-color-secondary block mb-1">Retención</label>
                          <InputNumber v-model="ep.retention_sequence" :min="0" :useGrouping="false" class="w-full" size="small" />
                        </div>
                      </div>
                    </div>
                    <!-- Action buttons: mobile below, desktop right -->
                    <div class="flex gap-1 pt-1 lg:flex-column">
                      <Button icon="pi pi-pencil" text rounded size="small" severity="secondary" class="p-1" @click="openEpEdit(ep)" v-tooltip.top="'Editar punto de emisión'" />
                      <Button icon="pi pi-save" text rounded size="small" severity="info" class="p-1" @click="openSeqEditConfirm(ep)" v-tooltip.top="'Guardar secuenciales'" />
                      <Button icon="pi pi-trash" text rounded size="small" severity="danger" class="p-1" @click="deleteEp(ep)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="establishments.length" class="flex justify-content-start">
              <Button label="Agregar Sucursal" icon="pi pi-plus" severity="secondary" @click="openEstDialog()" />
            </div>
          </div>
        </template>
      </Card>

      <SriSettings v-if="activeSection === 'sri'" />
    </div>

    <!-- Dialogs -->
    <Dialog v-model:visible="showEstDialog" :header="estEditIndex !== null ? 'Editar Sucursal' : 'Nueva Sucursal'" modal :style="{ width: 'min(480px, 95vw)' }">
      <div class="grid formgrid p-fluid">
        <div class="field col-12 md:col-6">
          <label class="text-sm font-semibold text-color-secondary">Código *</label>
          <InputText v-model="estForm.code" maxlength="20"  class="w-full" />
        </div>
        <div class="field col-12 md:col-6">
          <label class="text-sm font-semibold text-color-secondary">Nombre *</label>
          <InputText v-model="estForm.name" maxlength="255"  class="w-full" />
        </div>
        <div class="field col-12">
          <label class="text-sm font-semibold text-color-secondary">Dirección</label>
          <Textarea v-model="estForm.address" rows="2" maxlength="500"  class="w-full" />
        </div>
        <div class="field col-12">
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="estForm.is_active" />
            <span class="text-sm text-color-secondary">{{ estForm.is_active ? 'Activa' : 'Inactiva' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button label="Cancelar" text severity="secondary" @click="showEstDialog = false" />
          <Button :label="estEditIndex !== null ? 'Guardar' : 'Crear'" @click="saveEst()" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="showEpDialog" :header="epEditTarget !== null ? 'Editar Punto de Emisión' : 'Nuevo Punto de Emisión'" modal :style="{ width: 'min(480px, 95vw)' }">
      <div class="grid formgrid p-fluid">
        <div class="field col-12 md:col-6">
          <label class="text-sm font-semibold text-color-secondary">Código *</label>
          <InputText v-model="epForm.code" maxlength="10"  class="w-full" />
        </div>
        <div class="field col-12 md:col-6">
          <label class="text-sm font-semibold text-color-secondary">Nombre</label>
          <InputText v-model="epForm.name" maxlength="255"  class="w-full" />
        </div>
        <div class="field col-12">
          <div class="flex align-items-center gap-2">
            <InputSwitch v-model="epForm.is_active" />
            <span class="text-sm text-color-secondary">{{ epForm.is_active ? 'Activo' : 'Inactivo' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2 justify-content-end">
          <Button label="Cancelar" text severity="secondary" @click="showEpDialog = false" />
          <Button :label="epEditTarget !== null ? 'Guardar' : 'Crear'" @click="saveEp()" />
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="showSeqConfirmDialog" header="Confirmar cambios de secuenciales" modal :style="{ width: 'min(420px, 95vw)' }">
      <div class="grid formgrid p-fluid">
        <div class="field col-12">
          <p class="text-sm text-color-secondary mb-2">
            Está a punto de modificar los secuenciales del punto de emisión
            <strong>{{ seqTarget?.code }}</strong>.
          </p>
        </div>
        <div class="field col-12">
          <div class="surface-ground border-1 surface-border border-round p-2 text-sm">
            <div v-if="seqBackup?.invoice_sequence !== seqTarget?.invoice_sequence" class="font-semibold text-color-secondary mb-1">Factura: {{ seqBackup?.invoice_sequence }} → {{ seqTarget?.invoice_sequence }}</div>
            <div v-if="seqBackup?.liquidation_sequence !== seqTarget?.liquidation_sequence" class="font-semibold text-color-secondary mb-1">Liquidación: {{ seqBackup?.liquidation_sequence }} → {{ seqTarget?.liquidation_sequence }}</div>
            <div v-if="seqBackup?.credit_note_sequence !== seqTarget?.credit_note_sequence" class="font-semibold text-color-secondary mb-1">Nota de Crédito: {{ seqBackup?.credit_note_sequence }} → {{ seqTarget?.credit_note_sequence }}</div>
            <div v-if="seqBackup?.debit_note_sequence !== seqTarget?.debit_note_sequence" class="font-semibold text-color-secondary mb-1">Nota de Débito: {{ seqBackup?.debit_note_sequence }} → {{ seqTarget?.debit_note_sequence }}</div>
            <div v-if="seqBackup?.guide_sequence !== seqTarget?.guide_sequence" class="font-semibold text-color-secondary mb-1">Guía: {{ seqBackup?.guide_sequence }} → {{ seqTarget?.guide_sequence }}</div>
            <div v-if="seqBackup?.retention_sequence !== seqTarget?.retention_sequence" class="font-semibold text-color-secondary mb-0">Retención: {{ seqBackup?.retention_sequence }} → {{ seqTarget?.retention_sequence }}</div>
          </div>
        </div>
        <div class="field col-12">
          <p class="text-sm text-color-secondary mb-2">Escriba el siguiente código para confirmar:</p>
          <div class="text-center py-2"><span class="text-2xl font-bold tracking-widest text-primary select-all">{{ confirmCode }}</span></div>
        </div>
        <div class="field col-12">
          <label class="text-sm font-semibold text-color-secondary">Código de confirmación</label>
          <InputText v-model="userCode" class="text-center text-xl font-mono w-full" placeholder="000000" maxlength="6" />
        </div>
        <div class="field col-12">
          <div class="flex gap-2 justify-content-end pt-2">
            <Button label="Cancelar" severity="secondary" text @click="showSeqConfirmDialog = false; revertSequences()" />
            <Button label="Confirmar" icon="pi pi-check" :disabled="userCode.length !== 6" @click="confirmSeqSave" />
          </div>
        </div>
      </div>
    </Dialog>

    <Dialog v-model:visible="showConfirmDialog" header="Confirmar cambios" modal :style="{ width: 'min(420px, 95vw)' }">
      <div class="grid formgrid p-fluid">
        <div class="field col-12">
          <p class="text-sm text-color-secondary">Está a punto de modificar la configuración de <strong>{{ activeConfirmLabel }}</strong>.</p>
        </div>
        <div class="field col-12">
          <p class="text-sm text-color-secondary mb-2">Escriba el siguiente código para confirmar:</p>
          <div class="text-center py-3"><span class="text-2xl font-bold tracking-widest text-primary select-all">{{ confirmCode }}</span></div>
        </div>
        <div class="field col-12">
          <label class="text-sm font-semibold text-color-secondary">Código de confirmación</label>
          <InputText v-model="userCode" class="text-center text-xl font-mono w-full" placeholder="000000" maxlength="6" />
        </div>
        <div class="field col-12">
          <div class="flex gap-2 justify-content-end pt-2">
            <Button label="Cancelar" severity="secondary" text @click="showConfirmDialog = false" />
            <Button label="Confirmar" icon="pi pi-check" :disabled="userCode.length !== 6" @click="confirmSave" />
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'
import Textarea from 'primevue/textarea'
import Select from 'primevue/select'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Sidebar from 'primevue/sidebar'
import Message from 'primevue/message'
import Tag from 'primevue/tag'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Checkbox from 'primevue/checkbox'
import { fetchSettings, updateSettings } from '@/api/settings'
import api from '@/api/client'
import {
  getEstablishments, createEstablishment, updateEstablishment, deleteEstablishment,
  createEmissionPoint, updateEmissionPoint, deleteEmissionPoint as deleteEmissionPointApi,
  type Establishment, type EmissionPoint,
} from '@/api/establishments'
import SriSettings from '@/pages/settings/SriSettings.vue'

const activeSection = ref('company')
const globalError = ref<string | null>(null)
const successMsg = ref('')
const sidebarVisible = ref(false)

const activeSectionLabel = computed(() => {
  const s = sections.find(s => s.key === activeSection.value)
  return s ? s.label : activeSection.value
})

const sections = [
  { key: 'company', label: 'Empresa', icon: 'pi pi-building' },
  { key: 'tax', label: 'IVA e Impuestos', icon: 'pi pi-percentage' },
  { key: 'invoice', label: 'Facturación', icon: 'pi pi-receipt' },
  { key: 'pricing', label: 'Redondeo de Precios', icon: 'pi pi-dollar' },
  { key: 'general', label: 'General', icon: 'pi pi-cog' },
  { key: 'work_orders', label: 'Órdenes de Trabajo', icon: 'pi pi-clipboard' },
  { key: 'validation', label: 'Campos Requeridos', icon: 'pi pi-check-circle' },
  { key: 'branches', label: 'Sucursales', icon: 'pi pi-building' },
  { key: 'sri', label: 'Fact. Electrónica', icon: 'pi pi-file-export' },
]

function goSection(key: string) {
  // goSection: key
  activeSection.value = key
  if (key === 'branches') loadEstablishments()
  if (key === 'tax') loadIvas()
}

const roundingModes = [
  { label: 'Mitad hacia arriba (half_up)', value: 'half_up' },
  { label: 'Mitad hacia abajo (half_down)', value: 'half_down' },
  { label: 'Mitad par (half_even)', value: 'half_even' },
  { label: 'Redondear hacia arriba (ceil)', value: 'ceil' },
  { label: 'Redondear hacia abajo (floor)', value: 'floor' },
]

const costMethods = [
  { label: 'Promedio ponderado', value: 'weighted_average' },
  { label: 'FIFO', value: 'fifo' },
  { label: 'Costo específico', value: 'specific' },
]

// IVA management
const ivas = ref<any[]>([])
const loadingIvas = ref(false)
const editIvaId = ref<number | null>(null)
const editForm = reactive({ name: '', percentage: 0 })
const savingDefaultId = ref<number | null>(null)

async function loadIvas() {
  loadingIvas.value = true
  try {
    const res = await api.get('/ivas')
    ivas.value = res.data.data ?? res.data ?? []
  } catch (e: any) {
    // Failed to load IVAs
  } finally {
    loadingIvas.value = false
  }
}

function startEditIva(iva: any) {
  editIvaId.value = iva.id
  editForm.name = iva.name
  editForm.percentage = iva.percentage
}

function cancelEditIva() {
  editIvaId.value = null
  editForm.name = ''
  editForm.percentage = 0
}

async function saveIva(iva: any) {
  try {
    const res = await api.put(`/ivas/${iva.id}`, {
      name: editForm.name,
      percentage: editForm.percentage,
    })
    const updated = res.data.data ?? res.data
    const idx = ivas.value.findIndex((i: any) => i.id === iva.id)
    if (idx >= 0) ivas.value[idx] = { ...ivas.value[idx], ...updated }
    cancelEditIva()
  } catch (e: any) {
    // Failed to save IVA
  }
}

async function setDefaultIva(iva: any) {
  savingDefaultId.value = iva.id
  try {
    const res = await api.put(`/ivas/${iva.id}`, { is_default: true })
    // Reload to get fresh defaults
    await loadIvas()
  } catch (e: any) {
    // Failed to set default IVA
  } finally {
    savingDefaultId.value = null
  }
}

const form = reactive<Record<string, any>>({
  company_name: '',
  company_document: '',
  company_address: '',
  company_phone: '',
  company_email: '',
  company_currency: 'Bs.',
  company_currency_code: 'VES',
  company_commercial_name: '',
  company_rgo: '',
  company_contribuyente_especial: false,
  company_contabilidad: true,
  company_matriz_address: '',
  tax_iva_rate: 16,
  tax_iva_rate_reduced: 8,
  tax_withholding_iva_rate: 75,
  tax_withholding_islr_rate: 3,
  invoice_payment_days: 30,
  invoice_default_billing_basis: 'estimated',
  invoice_default_billing_mode: 'product_list',
  invoice_footer_text: '',
  invoice_show_tax_detail: true,
  pricing_decimal_places: 2,
  pricing_rounding_mode: 'half_up',
  general_timezone: 'America/Caracas',
  general_locale: 'es',
  general_stock_negative_allowed: false,
  general_cost_method: 'weighted_average',
  work_orders_member_selection_mode: 'autocomplete',
})

// Required fields config
const requiredClientFields = ref<string[]>([])
const requiredProductFields = ref<string[]>([])

const clientFields = [
  { key: 'document_type', label: 'Tipo de documento' },
  { key: 'document_number', label: 'Número de documento (RIF/CI)' },
  { key: 'email', label: 'Correo electrónico' },
  { key: 'phone', label: 'Teléfono' },
  { key: 'address', label: 'Dirección' },
]

const productFields = [
  { key: 'code', label: 'Código' },
  { key: 'sku', label: 'SKU' },
  { key: 'unit', label: 'Unidad de medida' },
  { key: 'category', label: 'Categoría' },
  { key: 'supplier', label: 'Proveedor' },
  { key: 'cost_price', label: 'Precio de costo' },
  { key: 'sale_price', label: 'Precio de venta' },
  { key: 'iva', label: 'IVA' },
  { key: 'stock_min', label: 'Stock mínimo' },
]

const confirmDialogSection = ref<string | null>(null)
const showConfirmDialog = ref(false)
const confirmCode = ref('')
const userCode = ref('')

const activeConfirmLabel = computed(() => {
  const labels: Record<string, string> = {
    company: 'Empresa', tax: 'IVA e Impuestos', invoice: 'Facturación',
    pricing: 'Precios y Redondeo', general: 'General', work_orders: 'Órdenes de Trabajo', validation: 'Campos Requeridos',
  }
  return labels[confirmDialogSection.value || ''] || ''
})

function openConfirm(section: string) {
  confirmDialogSection.value = section
  confirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  userCode.value = ''
  showConfirmDialog.value = true
}

function toggleClientField(key: string) {
  const idx = requiredClientFields.value.indexOf(key)
  if (idx >= 0) {
    requiredClientFields.value = requiredClientFields.value.filter(k => k !== key)
  } else {
    requiredClientFields.value = [...requiredClientFields.value, key]
  }
}

function toggleProductField(key: string) {
  const idx = requiredProductFields.value.indexOf(key)
  if (idx >= 0) {
    requiredProductFields.value = requiredProductFields.value.filter(k => k !== key)
  } else {
    requiredProductFields.value = [...requiredProductFields.value, key]
  }
}

async function confirmSave() {
  if (userCode.value !== confirmCode.value) {
    globalError.value = 'Código de confirmación incorrecto.'
    return
  }
  const section = confirmDialogSection.value
  if (!section) return
  const prefix = section + '_'
  const payload: Record<string, any> = {}
  if (section === 'validation') {
    payload['validation.required_client_fields'] = JSON.stringify(requiredClientFields.value)
    payload['validation.required_product_fields'] = JSON.stringify(requiredProductFields.value)
  } else {
    for (const [key, val] of Object.entries(form)) {
      if (key.startsWith(prefix)) {
        payload[section + '.' + key.slice(prefix.length)] = val
      }
    }
  }
  try {
    await updateSettings(payload)
    successMsg.value = 'Configuración guardada correctamente.'
    globalError.value = null
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al guardar.'
  } finally {
    showConfirmDialog.value = false
  }
}

// Establishments
const establishments = ref<Establishment[]>([])
const expandedEst = reactive<Record<number, boolean>>({})

function toggleEst(ei: number) {
  const est = establishments.value[ei]
  if (!est || !est.id) return
  expandedEst[est.id] = !expandedEst[est.id]
}

async function loadEstablishments() {
  try {
    const res = await getEstablishments({ per_page: 100 })
    establishments.value = res.data.data || []
  } catch {}
}

// Est dialog
const showEstDialog = ref(false)
const estEditIndex = ref<number | null>(null)
const estForm = reactive({ code: '', name: '', address: '', is_active: true })

function openEstDialog(est?: Establishment, ei?: number) {
  if (est && ei !== undefined) {
    estEditIndex.value = ei
    estForm.code = est.code
    estForm.name = est.name
    estForm.address = est.address || ''
    estForm.is_active = est.is_active
  } else {
    estEditIndex.value = null
    estForm.code = ''
    estForm.name = ''
    estForm.address = ''
    estForm.is_active = true
  }
  showEstDialog.value = true
}

async function saveEst() {
  if (!estForm.code || !estForm.name) return
  try {
    if (estEditIndex.value !== null) {
      const est = establishments.value[estEditIndex.value]
      const res = await updateEstablishment(est.id, { ...estForm })
      establishments.value[estEditIndex.value] = res.data
    } else {
      const res = await createEstablishment({ ...estForm })
      establishments.value.push(res.data)
    }
    showEstDialog.value = false
    successMsg.value = 'Sucursal guardada correctamente.'
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al guardar sucursal.'
  }
}

async function deleteEst(est: Establishment) {
  if (!confirm(`¿Eliminar la sucursal "${est.name}" y sus puntos de emisión?`)) return
  try {
    await deleteEstablishment(est.id)
    establishments.value = establishments.value.filter(e => e.id !== est.id)
    delete expandedEst[est.id]
    successMsg.value = 'Sucursal eliminada.'
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al eliminar.'
  }
}

// EP dialog
const showEpDialog = ref(false)
const epEditTarget = ref<EmissionPoint | null>(null)
const epParentEstId = ref<number | null>(null)
const epForm = reactive({ code: '', name: '', is_active: true })

function openEpDialog(est: Establishment) {
  epParentEstId.value = est.id
  epEditTarget.value = null
  epForm.code = ''
  epForm.name = ''
  epForm.is_active = true
  showEpDialog.value = true
}

function openEpEdit(ep: EmissionPoint) {
  const est = establishments.value.find(e => e.emission_points?.some(p => p.id === ep.id))
  if (!est || !est.id) return
  epParentEstId.value = est.id
  epEditTarget.value = ep
  epForm.code = ep.code
  epForm.name = ep.name || ''
  epForm.is_active = ep.is_active
  showEpDialog.value = true
}

async function saveEp() {
  if (!epForm.code || !epParentEstId.value) return
  try {
    if (epEditTarget.value) {
      await updateEmissionPoint(epParentEstId.value, epEditTarget.value.id, { ...epForm })
    } else {
      await createEmissionPoint(epParentEstId.value, { ...epForm })
    }
    showEpDialog.value = false
    const res = await getEstablishments({ per_page: 100 })
    establishments.value = res.data.data || []
    establishments.value.forEach(e => { if (e.id) expandedEst[e.id] = true })
    successMsg.value = 'Punto de emisión guardado.'
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al guardar punto de emisión.'
  }
}

async function deleteEp(ep: EmissionPoint) {
  const est = establishments.value.find(e => e.emission_points?.some(p => p.id === ep.id))
  if (!est || !est.id) return
  if (!confirm(`¿Eliminar el punto de emisión ${ep.code}?`)) return
  try {
    await deleteEmissionPointApi(est.id, ep.id)
    const res = await getEstablishments({ per_page: 100 })
    establishments.value = res.data.data || []
    establishments.value.forEach(e => { if (e.id) expandedEst[e.id] = true })
    successMsg.value = 'Punto de emisión eliminado.'
  } catch {
    globalError.value = 'Error al eliminar punto de emisión.'
  }
}

// Sequence confirm dialog
const showSeqConfirmDialog = ref(false)
const seqTarget = ref<EmissionPoint | null>(null)
const seqBackup = ref<EmissionPoint | null>(null)

function openSeqEditConfirm(ep: EmissionPoint) {
  seqTarget.value = { ...ep } as EmissionPoint
  seqBackup.value = { ...ep } as EmissionPoint
  confirmCode.value = String(Math.floor(100000 + Math.random() * 900000))
  userCode.value = ''
  showSeqConfirmDialog.value = true
}

function revertSequences() {
  if (seqBackup.value && seqTarget.value) {
    Object.assign(seqTarget.value, seqBackup.value)
  }
}

async function confirmSeqSave() {
  if (userCode.value !== confirmCode.value) {
    globalError.value = 'Código de confirmación incorrecto.'
    return
  }
  if (!seqTarget.value) return
  const est = establishments.value.find(e => e.emission_points?.some(p => p.id === seqTarget.value!.id))
  if (!est || !est.id) return
  try {
    await updateEmissionPoint(est.id, seqTarget.value.id, {
      invoice_sequence: seqTarget.value.invoice_sequence,
      liquidation_sequence: seqTarget.value.liquidation_sequence,
      credit_note_sequence: seqTarget.value.credit_note_sequence,
      debit_note_sequence: seqTarget.value.debit_note_sequence,
      guide_sequence: seqTarget.value.guide_sequence,
      retention_sequence: seqTarget.value.retention_sequence,
    })
    showSeqConfirmDialog.value = false
    const res = await getEstablishments({ per_page: 100 })
    establishments.value = res.data.data || []
    establishments.value.forEach(e => { if (e.id) expandedEst[e.id] = true })
    successMsg.value = 'Secuenciales actualizados correctamente.'
  } catch (e: any) {
    globalError.value = e?.response?.data?.message || 'Error al guardar secuenciales.'
  }
}

onMounted(async () => {
  try {
    const data = await fetchSettings()
    // fetchSettings data loaded
    // Las keys de la API ya tienen prefijo del grupo (p.ej. company_name dentro de company)
    for (const group of Object.keys(data)) {
      const items = data[group]
      for (const [key, val] of Object.entries(items)) {
        if (key in form) {
          form[key as keyof typeof form] = val
        }
      }
    }
    // Parse required fields from settings (data.validation is SettingEntry[])
    if (Array.isArray(data.validation)) {
      for (const entry of data.validation) {
        if (entry.key === 'validation.required_client_fields') {
          try { requiredClientFields.value = JSON.parse(entry.value) } catch { requiredClientFields.value = [] }
        }
        if (entry.key === 'validation.required_product_fields') {
          try { requiredProductFields.value = JSON.parse(entry.value) } catch { requiredProductFields.value = [] }
        }
      }
    }
  } catch(e) {
    // fetchSettings error
  }

  // Preload IVAs on mount
  setTimeout(() => loadIvas(), 500)
})
</script>

