# Guía de layout frontend

## Estándar para pantallas administrativas nuevas

| Capa | Tecnología |
|---|---|
| Componentes UI | PrimeVue 4 |
| Layout (formularios, grillas) | **PrimeFlex** |
| Estilos utilitarios existentes | Tailwind CSS (no mezclar en mismo bloque) |

- **PrimeFlex** es el estándar para layouts de formularios, grillas de filtros y cards.
- **Tailwind** puede permanecer en pantallas que ya funcionan, pero no debe mezclarse con PrimeFlex dentro del mismo bloque de layout.
- Para nuevas pantallas administrativas, priorizar PrimeFlex sobre Tailwind.

## Patrón recomendado de formulario responsive

```html
<Card>
  <template #content>
    <div class="grid formgrid p-fluid">
      <!-- Desktop: 3 columnas | Tablet: 2 columnas | Mobile: 1 columna -->
      <div class="field col-12 md:col-6 lg:col-4">
        <label for="field1">Campo 1</label>
        <InputText id="field1" v-model="field1" />
      </div>
      <div class="field col-12 md:col-6 lg:col-4">
        <label for="field2">Campo 2</label>
        <InputText id="field2" v-model="field2" />
      </div>
      <div class="field col-12 md:col-6 lg:col-4">
        <label for="field3">Campo 3</label>
        <InputText id="field3" v-model="field3" />
      </div>
    </div>

    <!-- Botones: alineados a la derecha, full width en mobile -->
    <div class="flex flex-column md:flex-row justify-content-end gap-2 mt-3">
      <Button label="Guardar" icon="pi pi-check" />
      <Button label="Cancelar" severity="secondary" icon="pi pi-times" />
    </div>
  </template>
</Card>
```

### Responsive breakpoints (PrimeFlex)

| Clase | Ancho mínimo | Columnas |
|---|---|---|
| `col-12` | — (base) | 1 columna (full width) |
| `md:col-6` | 768px | 2 columnas |
| `lg:col-4` | 992px | 3 columnas |
| `lg:col-3` | 992px | 4 columnas |

Siempre empezar en `col-12` para móvil, luego subir progresivamente.

## Clases clave de PrimeFlex

### Grilla
- `grid` — contenedor flexbox con wrap
- `formgrid` — variante con gap entre fields (recomendado para formularios)
- `p-fluid` — inputs ocupan todo el ancho disponible

### Columnas
- `col-12`, `col-6`, `col-4`, `col-3`
- `md:col-*`, `lg:col-*` — responsive

### Flex helpers
- `flex` — display flex
- `flex-column` — dirección columna (mobile)
- `flex-row` — dirección fila (desktop)
- `justify-content-start/end/center/between`
- `align-items-start/end/center`
- `gap-1` a `gap-4` (0.25rem a 1rem)
- `flex-1` — grow

### Espaciado
- `mt-*`, `mb-*`, `ml-*`, `mr-*` — margin
- `pt-*`, `pb-*`, `pl-*`, `pr-*` — padding

## Reglas

### ✅ Hacer
- Usar `field col-12 md:col-6 lg:col-4` para cada input en formularios
- Usar `formgrid` en contenedores grid de formularios
- Usar `p-fluid` para que inputs PrimeVue ocupen todo el ancho
- Usar `flex flex-column md:flex-row` para responsive de botones
- Usar `overflow-auto` en tablas para scroll horizontal interno en mobile
- Usar `label` + `for` con ids en inputs para accesibilidad

### ❌ No hacer
- **No mezclar** en el mismo contenedor:
  - `grid-cols-*` (Tailwind) con `col-12 md:col-*` (PrimeFlex)
  - `items-center` (Tailwind) con `align-items-center` (PrimeFlex)
  - `justify-end` (Tailwind) con `justify-content-end` (PrimeFlex)
  - `gap-*` (Tailwind) con `gap-*` (PrimeFlex) — usar solo PrimeFlex dentro de bloques PrimeFlex
- No usar anchos fijos (px) en inputs salvo casos justificados
- No usar estilos inline para layout
- No eliminar Tailwind de pantallas que ya funcionan

## Tablas responsive

Para DataTable en mobile:

```html
<div class="overflow-auto">
  <DataTable :value="items" responsiveLayout="scroll"
    scrollHeight="flex" scrollable>
    <!-- columns... -->
  </DataTable>
</div>
```

El `div.overflow-auto` contiene el scroll horizontal sin afectar el layout global.
