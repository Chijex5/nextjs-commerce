'use client';

import { useState } from 'react';

interface CouponInputProps {
  onApply: (discountAmount: number, couponCode: string) => void;
  cartTotal: number;
}

export default function CouponInput({ onApply, cartTotal }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim(), cartTotal })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid coupon code');
        return;
      }

      setAppliedCoupon(data.coupon);
      setSuccess(`Coupon applied! You saved ₦${data.coupon.discountAmount.toFixed(2)}`);
      onApply(data.coupon.discountAmount, data.coupon.code);
    } catch (err) {
      setError('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode('');
    setSuccess('');
    setError('');
    onApply(0, '');
  };

  if (appliedCoupon) {
    return (
      <div className="border border-neutral-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-900">
              Coupon Applied: {appliedCoupon.code}
            </p>
            <p className="text-sm text-neutral-500">
              Discount: -₦{appliedCoupon.discountAmount.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleRemove}
            className="text-sm text-neutral-500 hover:text-neutral-900"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 p-4">
      <label htmlFor="coupon" className="block text-sm font-medium text-neutral-900 mb-2">
        Have a coupon code?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          className="flex-1 px-3 py-2 border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
          disabled={loading}
        />
        <button
          onClick={handleApply}
          disabled={loading}
          className="px-4 py-2 bg-neutral-900 text-white text-sm hover:bg-neutral-800 disabled:opacity-50"
        >
          {loading ? 'Applying...' : 'Apply'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {success && <p className="mt-2 text-sm text-green-600">{success}</p>}
    </div>
  );
}
