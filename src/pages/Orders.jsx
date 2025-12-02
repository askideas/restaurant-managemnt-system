import React, { useState } from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';
import Badge from '../components/UI/Badge';
import { Search, Filter } from 'lucide-react';

const Orders = () => {
  const { orders, updateOrderStatus, tables } = useRestaurant();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'All Orders', count: orders.length },
    { id: 'pending', label: 'Pending', count: orders.filter(o => o.status === 'pending').length },
    { id: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
    { id: 'ready', label: 'Ready', count: orders.filter(o => o.status === 'ready').length },
    { id: 'completed', label: 'Completed', count: orders.filter(o => o.status === 'completed').length },
  ];

  const filteredOrders = orders
    .filter(order => activeTab === 'all' || order.status === activeTab)
    .filter(order => 
      searchQuery === '' || 
      order.id.toString().includes(searchQuery) ||
      order.tableId.toString().includes(searchQuery)
    )
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTableNumber = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    return table ? table.number : tableId;
  };

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'preparing',
      'preparing': 'ready',
      'ready': 'completed',
    };
    return statusFlow[currentStatus];
  };

  const getStatusButtonLabel = (status) => {
    const labels = {
      'pending': 'Start Preparing',
      'preparing': 'Mark Ready',
      'ready': 'Complete Order',
    };
    return labels[status];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-600 mt-1">Track and manage all restaurant orders</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {tab.label}
            <Badge variant={activeTab === tab.id ? 'default' : tab.id} className={activeTab === tab.id ? 'bg-white/20 text-white' : ''}>
              {tab.count}
            </Badge>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p className="text-lg">No orders found</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} variant="elevated" className="hover:shadow-xl transition-shadow">
              {/* Order Header */}
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
                <div>
                  <h3 className="font-bold text-gray-900">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600">Table {getTableNumber(order.tableId)}</p>
                </div>
                <Badge variant={order.status}>{order.status}</Badge>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-3">
                {order.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.quantity}x {item.name}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order Footer */}
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">Total</span>
                  <span className="text-lg font-bold text-orange-600">
                    {formatCurrency(order.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-500 mb-3">
                  <span>{formatTime(order.timestamp)}</span>
                  <span className="capitalize">{order.paymentMethod}</span>
                </div>

                {/* Action Buttons */}
                {order.status !== 'completed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(order.id, getNextStatus(order.status))}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  >
                    {getStatusButtonLabel(order.status)}
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Orders;
