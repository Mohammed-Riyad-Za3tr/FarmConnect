import { useState } from 'react';
import toast from 'react-hot-toast';

import { getApiErrorMessage } from '@/shared/utils/api-error';

import { useCreateProducerCoupon, useDeleteProducerCoupon, useProducerCoupons } from '../hooks/useCoupons';

export function ProducerCouponsPage() {
  const couponsQuery = useProducerCoupons();
  const createMutation = useCreateProducerCoupon();
  const deleteMutation = useDeleteProducerCoupon();

  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FIXED'>('PERCENT');
  const [amount, setAmount] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        code,
        type,
        amount: Number(amount),
        startsAt,
        endsAt,
        usageLimit: usageLimit ? Number(usageLimit) : undefined,
        isActive: true,
      });
      setCode('');
      setAmount('');
      setStartsAt('');
      setEndsAt('');
      setUsageLimit('');
      toast.success('Coupon created');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create coupon'));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Coupons</h1>

      <form onSubmit={onCreate} className="grid gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-3">
        <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Code" className={inputClass()} />
        <select value={type} onChange={(e) => setType(e.target.value as 'PERCENT' | 'FIXED')} className={inputClass()}>
          <option value="PERCENT">Percent</option>
          <option value="FIXED">Fixed</option>
        </select>
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" step="0.01" placeholder="Amount" className={inputClass()} />
        <input value={startsAt} onChange={(e) => setStartsAt(e.target.value)} type="datetime-local" className={inputClass()} />
        <input value={endsAt} onChange={(e) => setEndsAt(e.target.value)} type="datetime-local" className={inputClass()} />
        <input value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} type="number" placeholder="Usage limit (optional)" className={inputClass()} />
        <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-700 md:col-span-3">Create coupon</button>
      </form>

      <section className="space-y-2">
        {(couponsQuery.data ?? []).map((coupon) => (
          <article key={coupon.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{coupon.code}</p>
              <p className="text-xs text-gray-500">{coupon.type} {coupon.amount} | used {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''}</p>
            </div>
            <button
              type="button"
              onClick={() => deleteMutation.mutate(coupon.id)}
              className="rounded border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
            >
              Delete
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function inputClass() {
  return 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';
}
