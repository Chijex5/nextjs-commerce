'use client';

import { useState, useEffect } from 'react';

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderValue: number | null;
  maxUses: number | null;
  usedCount: number;
  maxUsesPerUser: number | null;
  isActive: boolean;
  startDate: string | null;
  expiryDate: string | null;
  createdAt: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    maxUsesPerUser: '',
    startDate: '',
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    fetchCoupons();
  }, [filter]);

  const fetchCoupons = async () => {
    try {
      const response = await fetch(`/api/admin/coupons?status=${filter}`);
      const data = await response.json();
      setCoupons(data.coupons);
    } catch (error) {
      console.error('Error fetching coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: formData.code,
          description: formData.description || null,
          discountType: formData.discountType,
          discountValue: parseFloat(formData.discountValue) || 0,
          minOrderValue: formData.minOrderValue ? parseFloat(formData.minOrderValue) : null,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          maxUsesPerUser: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : null,
          startDate: formData.startDate || null,
          expiryDate: formData.expiryDate || null,
          isActive: formData.isActive
        })
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          code: '',
          description: '',
          discountType: 'percentage',
          discountValue: '',
          minOrderValue: '',
          maxUses: '',
          maxUsesPerUser: '',
          startDate: '',
          expiryDate: '',
          isActive: true
        });
        fetchCoupons();
      }
    } catch (error) {
      console.error('Error creating coupon:', error);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await fetch(`/api/admin/coupons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      fetchCoupons();
    } catch (error) {
      console.error('Error toggling coupon:', error);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
      fetchCoupons();
    } catch (error) {
      console.error('Error deleting coupon:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading coupons...</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-medium">Coupons</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800"
        >
          {showCreateForm ? 'Cancel' : 'Create New Coupon'}
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-8 border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-6 py-4">
            <h2 className="text-lg font-medium">Create New Coupon</h2>
            <p className="mt-1 text-sm text-neutral-500">Fill in the details below to create a new discount coupon</p>
          </div>

          <form onSubmit={handleCreateCoupon} className="p-6 space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Basic Information</h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Coupon Code <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="e.g., SAVE10 or WELCOME2024"
                      required
                      className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                    />
                    <p className="mt-1 text-xs text-neutral-500">Unique code customers will enter at checkout</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="e.g., 10% off for new customers"
                      className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      rows={2}
                    />
                    <p className="mt-1 text-xs text-neutral-500">Internal note to describe this coupon's purpose</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Discount Settings Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Discount Settings</h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Discount Type <span className="text-red-600">*</span>
                      </label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      >
                        <option value="percentage">Percentage Off</option>
                        <option value="fixed">Fixed Amount Off</option>
                        <option value="free_shipping">Free Shipping</option>
                      </select>
                      <p className="mt-1 text-xs text-neutral-500">How the discount should be calculated</p>
                    </div>

                    {formData.discountType !== 'free_shipping' && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Discount Value <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.discountValue}
                            onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                            placeholder={formData.discountType === 'percentage' ? '10' : '1000'}
                            required
                            min="0"
                            step="0.01"
                            className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                          />
                          <span className="absolute right-3 top-2 text-sm text-neutral-500">
                            {formData.discountType === 'percentage' ? '%' : '₦'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-neutral-500">
                          {formData.discountType === 'percentage' 
                            ? 'Percentage to discount (e.g., 10 for 10% off)' 
                            : 'Fixed amount in Naira to discount'}
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      Minimum Order Value
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.minOrderValue}
                        onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                        placeholder="e.g., 5000"
                        min="0"
                        step="0.01"
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <span className="absolute right-3 top-2 text-sm text-neutral-500">₦</span>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">Cart must be at least this amount to use coupon (leave empty for no minimum)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Usage Limits Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Usage Limits</h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Maximum Total Uses
                      </label>
                      <input
                        type="number"
                        value={formData.maxUses}
                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                        placeholder="e.g., 100"
                        min="0"
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">Total times this coupon can be used across all customers (leave empty for unlimited)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Maximum Uses Per Customer
                      </label>
                      <input
                        type="number"
                        value={formData.maxUsesPerUser}
                        onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                        placeholder="e.g., 1"
                        min="0"
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">Limit how many times one customer can use this coupon (leave empty for unlimited)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Validity Period Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Validity Period</h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">When this coupon becomes active (leave empty to start immediately)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="w-full border border-neutral-300 rounded px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900"
                      />
                      <p className="mt-1 text-xs text-neutral-500">When this coupon expires (leave empty for no expiry)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Section */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-neutral-900 mb-3">Status</h3>
                <div className="pl-4 border-l-2 border-neutral-200">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="mt-0.5 mr-3 h-4 w-4"
                    />
                    <div>
                      <span className="text-sm font-medium text-neutral-900">Active</span>
                      <p className="text-xs text-neutral-500 mt-0.5">Uncheck to create coupon as inactive (can be activated later)</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-neutral-200 flex gap-3">
              <button
                type="submit"
                className="bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white rounded hover:bg-neutral-800 transition-colors"
              >
                Create Coupon
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-2.5 text-sm font-medium text-neutral-700 border border-neutral-300 rounded hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm ${
            filter === 'all'
              ? 'bg-neutral-900 text-white'
              : 'border border-neutral-200 text-neutral-900'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 text-sm ${
            filter === 'active'
              ? 'bg-neutral-900 text-white'
              : 'border border-neutral-200 text-neutral-900'
          }`}
        >
          Active
        </button>
        <button
          onClick={() => setFilter('inactive')}
          className={`px-4 py-2 text-sm ${
            filter === 'inactive'
              ? 'bg-neutral-900 text-white'
              : 'border border-neutral-200 text-neutral-900'
          }`}
        >
          Inactive
        </button>
      </div>

      <div className="border border-neutral-200">
        <table className="w-full">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Code</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Usage</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Expiry</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No coupons found. Create your first coupon to get started.
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-b border-neutral-200">
                  <td className="px-4 py-3 text-sm font-medium">{coupon.code}</td>
                  <td className="px-4 py-3 text-sm capitalize">{coupon.discountType.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.discountType === 'percentage'
                      ? `${coupon.discountValue}%`
                      : coupon.discountType === 'fixed'
                      ? `₦${coupon.discountValue}`
                      : 'Free Shipping'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.usedCount}
                    {coupon.maxUses ? ` / ${coupon.maxUses}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs ${
                        coupon.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-neutral-100 text-neutral-800'
                      }`}
                    >
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {coupon.expiryDate
                      ? new Date(coupon.expiryDate).toLocaleDateString()
                      : 'No expiry'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive(coupon.id, coupon.isActive)}
                        className="text-sm text-neutral-600 hover:text-neutral-900"
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
