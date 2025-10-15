"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OrdersListPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/orders', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'paid') return order.paymentStatus === 'paid';
    if (filter === 'pending') return order.paymentStatus === 'pending';
    return true;
  });

  if (loading && orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Orders</h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">Manage and fulfill orders</p>
            <div className="flex gap-3">
            <button
  onClick={fetchOrders}
  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
>
  Refresh
</button>

<Link
  href="https://mrkt.sanity.studio/"
  target="_blank"
  rel="noopener noreferrer"
  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300"
>
  Open Studio
</Link>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-4 ${filter === 'all' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              All Orders ({orders.length})
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-6 py-4 ${filter === 'paid' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Paid ({orders.filter(o => o.paymentStatus === 'paid').length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-6 py-4 ${filter === 'pending' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'}`}
            >
              Pending ({orders.filter(o => o.paymentStatus === 'pending').length})
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders found</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Order ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Total</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm">{order.orderId || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <div>{order.name}</div>
                      <div className="text-gray-500 text-xs">{order.email}</div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.paymentStatus?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-right">
                      Rp {(order.totalPrice || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/orders/${order._id}/fulfill`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 inline-block text-sm"
                      >
                        Download PDF
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}