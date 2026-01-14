'use client';

import { useState, useEffect } from 'react';

export default function ExitIntentPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [discountCode, setDiscountCode] = useState('WELCOME10');

  useEffect(() => {
    // Check if user has already seen the popup
    const hasSeenPopup = document.cookie.includes('exit_intent_shown=true');
    if (hasSeenPopup) return;

    let timeoutId: NodeJS.Timeout;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isVisible) {
        // User is moving mouse toward top of browser (exit intent)
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setIsVisible(true);
          // Set cookie to show popup only once per 7 days
          document.cookie = 'exit_intent_shown=true; max-age=' + (7 * 24 * 60 * 60) + '; path=/';
        }, 500);
      }
    };

    // Add delay before enabling exit intent detection (3 seconds)
    const enableTimeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 3000);

    return () => {
      clearTimeout(enableTimeout);
      clearTimeout(timeoutId);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [isVisible]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      setSubmitted(true);
    } catch (error) {
      console.error('Newsletter signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-md bg-white p-8">
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 text-neutral-500 hover:text-neutral-900"
          aria-label="Close"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {!submitted ? (
          <>
            <h2 className="text-2xl font-medium text-neutral-900">
              Wait! Don't Leave Empty-Handed
            </h2>
            <p className="mt-4 text-sm text-neutral-700">
              Get 10% OFF your first order when you join our newsletter.
            </p>

            <form onSubmit={handleSubmit} className="mt-6">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
              >
                {loading ? 'Subscribing...' : 'Get My 10% OFF'}
              </button>
            </form>

            <p className="mt-4 text-xs text-neutral-500">
              No spam, unsubscribe anytime. Privacy policy applies.
            </p>
          </>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-medium text-neutral-900">Thank You!</h2>
            <p className="mt-4 text-sm text-neutral-700">
              Your discount code is:
            </p>
            <div className="mt-4 border-2 border-neutral-900 bg-neutral-50 p-4">
              <p className="text-2xl font-bold text-neutral-900">{discountCode}</p>
            </div>
            <p className="mt-4 text-sm text-neutral-700">
              Use this code at checkout to get 10% off your order.
            </p>
            <button
              onClick={handleClose}
              className="mt-6 w-full bg-neutral-900 py-3 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Start Shopping
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
