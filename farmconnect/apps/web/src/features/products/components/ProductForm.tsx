import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PREDEFINED_PRODUCT_TAGS } from '@farmconnect/shared';

import type { ProductStatus, UpsertProductPayload } from '../api/products.api';
import type { ProductCategory } from '../api/products.api';

interface ProductFormProps {
  mode?: 'create' | 'edit';
  initial?: Partial<UpsertProductPayload>;
  isSubmitting?: boolean;
  submitLabel: string;
  allowedStatuses?: ProductStatus[];
  statusHint?: string;
  categories?: ProductCategory[];
  serverError?: string | null;
  onSubmit: (payload: UpsertProductPayload) => Promise<void> | void;
}

const ALL_PRODUCT_STATUSES: ProductStatus[] = ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'ARCHIVED'];

const defaultValue: UpsertProductPayload = {
  title: { en: '' },
  description: { en: '' },
  price: 0,
  currency: 'DZD',
  unit: 'KG',
  stock: 0,
  minOrderQty: 1,
  maxOrderQty: 10000,
  status: 'DRAFT',
  tags: [],
  isSeasonal: false,
};

export function ProductForm({
  mode = 'create',
  initial,
  submitLabel,
  onSubmit,
  isSubmitting,
  allowedStatuses,
  statusHint,
  categories = [],
  serverError,
}: ProductFormProps) {
  const { t } = useTranslation();
  const merged = useMemo(() => ({ ...defaultValue, ...initial }), [initial]);

  const [titleEn, setTitleEn] = useState(merged.title?.en ?? '');
  const [titleAr, setTitleAr] = useState(merged.title?.ar ?? '');
  const [descriptionEn, setDescriptionEn] = useState(merged.description?.en ?? '');
  const [descriptionAr, setDescriptionAr] = useState(merged.description?.ar ?? '');
  const [slug, setSlug] = useState(merged.slug ?? '');
  const [categoryId, setCategoryId] = useState(merged.categoryId ?? '');
  const [price, setPrice] = useState(String(merged.price ?? 0));
  const [currency, setCurrency] = useState(merged.currency ?? 'DZD');
  const [unit, setUnit] = useState(merged.unit ?? 'KG');
  const [recipePdfUrl, setRecipePdfUrl] = useState(merged.recipePdfUrl ?? '');
  const [harvestDate, setHarvestDate] = useState(merged.harvestDate ? merged.harvestDate.slice(0, 10) : '');
  const [harvestWindowStart, setHarvestWindowStart] = useState(
    merged.harvestWindowStart ? merged.harvestWindowStart.slice(0, 10) : '',
  );
  const [harvestWindowEnd, setHarvestWindowEnd] = useState(
    merged.harvestWindowEnd ? merged.harvestWindowEnd.slice(0, 10) : '',
  );
  const [isSeasonal, setIsSeasonal] = useState(Boolean(merged.isSeasonal));
  const [seasonStartMonth, setSeasonStartMonth] = useState(
    merged.seasonStartMonth ? String(merged.seasonStartMonth) : '',
  );
  const [seasonEndMonth, setSeasonEndMonth] = useState(merged.seasonEndMonth ? String(merged.seasonEndMonth) : '');
  const [stock, setStock] = useState(String(merged.stock ?? 0));
  const [minOrderQty, setMinOrderQty] = useState(String(merged.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(String(merged.maxOrderQty ?? 10000));
  const [status, setStatus] = useState<ProductStatus>(merged.status ?? 'DRAFT');
  const [selectedTags, setSelectedTags] = useState<string[]>(merged.tags ?? []);
  const [formError, setFormError] = useState<string | null>(null);
  const statusOptions = useMemo(() => {
    const base = allowedStatuses ?? ALL_PRODUCT_STATUSES;
    return base.includes(status) ? base : [status, ...base];
  }, [allowedStatuses, status]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!titleEn.trim() && !titleAr.trim()) {
      setFormError(t('products.formErrorMissingTitle'));
      return;
    }
    if (!descriptionEn.trim() && !descriptionAr.trim()) {
      setFormError(t('products.formErrorMissingDescription'));
      return;
    }
    if (!Number.isFinite(Number(price)) || Number(price) <= 0) {
      setFormError(t('products.formErrorInvalidPrice'));
      return;
    }
    if (Number(minOrderQty) > Number(maxOrderQty)) {
      setFormError(t('products.formErrorMinMaxQty'));
      return;
    }
    if ((harvestWindowStart && !harvestWindowEnd) || (!harvestWindowStart && harvestWindowEnd)) {
      setFormError('Harvest window start and end are required together');
      return;
    }

    const shouldClearNullableFields = mode === 'edit';

    const payload: UpsertProductPayload = {
      categoryId: categoryId.trim() || (shouldClearNullableFields ? null : undefined),
      title: {
        ...(titleEn.trim() ? { en: titleEn.trim() } : {}),
        ...(titleAr.trim() ? { ar: titleAr.trim() } : {}),
      },
      description: {
        ...(descriptionEn.trim() ? { en: descriptionEn.trim() } : {}),
        ...(descriptionAr.trim() ? { ar: descriptionAr.trim() } : {}),
      },
      ...(slug.trim() ? { slug: slug.trim() } : {}),
      price: Number(price),
      currency: currency.trim(),
      unit: unit as 'KG' | 'PIECE' | 'BOX',
      recipePdfUrl: recipePdfUrl.trim() || (shouldClearNullableFields ? null : undefined),
      stock: Number(stock),
      minOrderQty: Number(minOrderQty),
      maxOrderQty: Number(maxOrderQty),
      status,
      tags: selectedTags,
      harvestDate: harvestDate || (shouldClearNullableFields ? null : undefined),
      harvestWindowStart: harvestWindowStart || (shouldClearNullableFields ? null : undefined),
      harvestWindowEnd: harvestWindowEnd || (shouldClearNullableFields ? null : undefined),
      isSeasonal,
      seasonStartMonth: seasonStartMonth ? Number(seasonStartMonth) : shouldClearNullableFields ? null : undefined,
      seasonEndMonth: seasonEndMonth ? Number(seasonEndMonth) : shouldClearNullableFields ? null : undefined,
    };
    await onSubmit(payload);
  }

  return (
    <form onSubmit={submit} className="grid gap-3 md:grid-cols-2">
      {serverError ? (
        <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {serverError}
        </div>
      ) : null}
      {formError ? (
        <div className="md:col-span-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">
          {formError}
        </div>
      ) : null}
      <Field label={t('products.formTitleEn')}><input value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className={inputClass()} /></Field>
      <Field label={t('products.formTitleAr')}><input value={titleAr} onChange={(e) => setTitleAr(e.target.value)} className={inputClass()} /></Field>
      <label className="md:col-span-2 block text-sm text-gray-700 dark:text-gray-300">
        <span>{t('products.formDescriptionEn')}</span>
        <textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className={inputClass()} rows={3} />
      </label>
      <label className="md:col-span-2 block text-sm text-gray-700 dark:text-gray-300">
        <span>{t('products.formDescriptionAr')}</span>
        <textarea value={descriptionAr} onChange={(e) => setDescriptionAr(e.target.value)} className={inputClass()} rows={3} />
      </label>
      <Field label={t('products.formSlugOptional')}><input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputClass()} /></Field>
      <Field label={t('products.formCategory')}>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass()}>
          <option value="">{t('products.formCategoryOptional')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.parentId ? '  - ' : ''}
              {category.nameEn} / {category.nameAr}
            </option>
          ))}
        </select>
      </Field>
      <Field label={t('products.formPrice')}><input value={price} onChange={(e) => setPrice(e.target.value)} type="number" min="0" step="0.01" className={inputClass()} /></Field>
      <Field label={t('products.formCurrency')}><input value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputClass()} /></Field>
      <Field label={t('products.formUnit')}>
        <select value={unit} onChange={(e) => setUnit(e.target.value as 'KG' | 'PIECE' | 'BOX')} className={inputClass()}>
          <option value="KG">KG</option>
          <option value="PIECE">PIECE</option>
          <option value="BOX">BOX</option>
        </select>
      </Field>
      <Field label="Recipe PDF URL">
        <input value={recipePdfUrl} onChange={(e) => setRecipePdfUrl(e.target.value)} className={inputClass()} />
      </Field>
      <Field label="Harvest date"><input value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} type="date" className={inputClass()} /></Field>
      <Field label="Harvest window start"><input value={harvestWindowStart} onChange={(e) => setHarvestWindowStart(e.target.value)} type="date" className={inputClass()} /></Field>
      <Field label="Harvest window end"><input value={harvestWindowEnd} onChange={(e) => setHarvestWindowEnd(e.target.value)} type="date" className={inputClass()} /></Field>
      <label className="block text-sm text-gray-700 dark:text-gray-300">
        <span>Seasonal product</span>
        <div className="mt-2">
          <input checked={isSeasonal} onChange={(e) => setIsSeasonal(e.target.checked)} type="checkbox" />
        </div>
      </label>
      <Field label="Season start month (1-12)"><input value={seasonStartMonth} onChange={(e) => setSeasonStartMonth(e.target.value)} type="number" min="1" max="12" className={inputClass()} /></Field>
      <Field label="Season end month (1-12)"><input value={seasonEndMonth} onChange={(e) => setSeasonEndMonth(e.target.value)} type="number" min="1" max="12" className={inputClass()} /></Field>
      <Field label={t('products.formStock')}><input value={stock} onChange={(e) => setStock(e.target.value)} type="number" min="0" className={inputClass()} /></Field>
      <Field label={t('products.formMinOrderQty')}><input value={minOrderQty} onChange={(e) => setMinOrderQty(e.target.value)} type="number" min="1" className={inputClass()} /></Field>
      <Field label={t('products.formMaxOrderQty')}><input value={maxOrderQty} onChange={(e) => setMaxOrderQty(e.target.value)} type="number" min="1" className={inputClass()} /></Field>
      <Field label={t('products.formStatus')}>
        <select value={status} onChange={(e) => setStatus(e.target.value as ProductStatus)} className={inputClass()}>
          {statusOptions.map((option) => (
            <option key={option} value={option}>
              {t(`products.status.${option}`)}
            </option>
          ))}
        </select>
        {statusHint ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">{statusHint}</p> : null}
      </Field>
      <div className="md:col-span-2 block text-sm text-gray-700 dark:text-gray-300">
        <span>{t('products.formTags')}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PREDEFINED_PRODUCT_TAGS.map((tag) => {
            const active = selectedTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTags((prev) =>
                    prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag],
                  )
                }
                className={[
                  'rounded-full border px-3 py-1 text-xs font-medium',
                  active
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800',
                ].join(' ')}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>
      <div className="md:col-span-2">
        <button disabled={isSubmitting} type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-60">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-gray-700 dark:text-gray-300">
      <span>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
