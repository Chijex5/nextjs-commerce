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
        <div className="mb-8 border border-neutral-200 p-6">
          <h2 className="mb-4 text-lg font-medium">Create New Coupon</h2>
          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  required
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="percentage">Percentage</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="free_shipping">Free Shipping</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-900">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                rows={2}
              />
            </div>

            {formData.discountType !== 'free_shipping' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-900">
                    Discount Value * {formData.discountType === 'percentage' ? '(%)' : '(₦)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-900">
                    Min Order Value (₦)
                  </label>
                  <input
                    type="number"
                    value={formData.minOrderValue}
                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value })}
                    min="0"
                    step="0.01"
                    className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Max Uses (Total)
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  min="0"
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Max Uses Per User
                </label>
                <input
                  type="number"
                  value={formData.maxUsesPerUser}
                  onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                  min="0"
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-900">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  className="mt-1 w-full border border-neutral-200 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-neutral-900">Active</span>
              </label>
            </div>

            <button
              type="submit"
              className="bg-neutral-900 px-6 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Create Coupon
            </button>
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
