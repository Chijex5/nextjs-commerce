'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useUserSession } from 'hooks/useUserSession';

interface CouponInputProps {
  onApply: (discountAmount: number, couponCode: string) => void;
  cartTotal: number;
}

const COUPON_STORAGE_KEY = 'appliedCoupon';

export default function CouponInput({ onApply, cartTotal }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const { data: session } = useUserSession();

  // Load coupon from localStorage on mount and revalidate
  useEffect(() => {
    const loadStoredCoupon = async () => {
      try {
        const stored = localStorage.getItem(COUPON_STORAGE_KEY);
        if (stored) {
          const couponData = JSON.parse(stored);
          
          // Revalidate the coupon
          const response = await fetch('/api/coupons/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              code: couponData.code, 
              cartTotal,
              userId: session?.user?.id 
            })
          });

          if (response.ok) {
            const data = await response.json();
            setAppliedCoupon(data.coupon);
            onApply(data.coupon.discountAmount, data.coupon.code);
          } else {
            // Coupon no longer valid, remove it
            localStorage.removeItem(COUPON_STORAGE_KEY);
          }
        }
      } catch (err) {
        localStorage.removeItem(COUPON_STORAGE_KEY);
      }
    };

    loadStoredCoupon();
  }, [cartTotal]);

  const handleApply = async () => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      toast.error('Please enter a coupon code');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code: trimmedCode, 
          cartTotal,
          userId: session?.user?.id,
          sessionId: getSessionId()
        })
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Invalid coupon code');
        return;
      }

      setAppliedCoupon(data.coupon);
      setCode('');
      toast.success(`Coupon applied! You saved ₦${data.coupon.discountAmount.toFixed(2)}`);
      onApply(data.coupon.discountAmount, data.coupon.code);
      
      // Store in localStorage for persistence
      try {
        localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(data.coupon));
      } catch (err) {
        console.error('Failed to save coupon to storage:', err);
      }
    } catch (err) {
      toast.error('Failed to apply coupon. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setAppliedCoupon(null);
    setCode('');
    onApply(0, '');
    toast.success('Coupon removed');
    
    // Remove from localStorage
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to remove coupon from storage:', err);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply();
    }
  };

  // Get or create a session ID for guest users
  const getSessionId = () => {
    let sessionId = localStorage.getItem('guestSessionId');
    if (!sessionId) {
      sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('guestSessionId', sessionId);
    }
    return sessionId;
  };

  if (appliedCoupon) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Coupon Applied: <span className="font-bold">{appliedCoupon.code}</span>
              </p>
            </div>
            <p className="mt-1 text-sm text-green-700 dark:text-green-300">
              Discount: -₦{appliedCoupon.discountAmount.toFixed(2)}
            </p>
            {appliedCoupon.description && (
              <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                {appliedCoupon.description}
              </p>
            )}
          </div>
          <button
            onClick={handleRemove}
            className="ml-2 text-sm font-medium text-green-700 hover:text-green-900 dark:text-green-300 dark:hover:text-green-100"
            aria-label="Remove coupon"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
      <label htmlFor="coupon" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
        Have a discount code?
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          id="coupon"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="Enter code (e.g., SAVE20)"
          className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm uppercase focus:border-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder-neutral-500"
          disabled={loading}
          maxLength={50}
        />
        <button
          onClick={handleApply}
          disabled={loading || !code.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Applying...
            </span>
          ) : (
            'Apply'
          )}
        </button>
      </div>
      <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
        Enter your coupon code to receive a discount on your order
      </p>
    </div>
  );
}
