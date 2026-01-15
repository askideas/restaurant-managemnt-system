import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Loader2, CheckCircle, Clock } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];
const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Dine In', value: 'dine-in' },
  { label: 'Take Away', value: 'take-away' },
  { label: 'Swiggy', value: 'swiggy' },
  { label: 'Zomato', value: 'zomato' },
];

const Orders = () => {
  const today = new Date().toISOString().slice(0, 10);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const markAsComplete = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await updateDoc(doc(db, 'orders', orderId), { 
        status: 'completed',
        updatedAt: new Date().toISOString()
      });
      setOrders(orders => orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
    } catch {}
    setUpdatingId(null);
  };

  // Filter orders client-side
  const filteredOrders = orders.filter(order => {
    const orderDate = order.createdAt?.slice(0, 10);
    const statusMatch = !status || order.status === status;
    const typeMatch = !type || order.type === type;
    const fromMatch = !fromDate || orderDate >= fromDate;
    const toMatch = !toDate || orderDate <= toDate;
    return statusMatch && typeMatch && fromMatch && toMatch;
  });

  const getOrderTypeColor = (type) => {
    switch(type) {
      case 'dine-in': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'take-away': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'swiggy': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'zomato': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getOrderTypeLabel = (type) => {
    switch(type) {
      case 'dine-in': return 'Dine In';
      case 'take-away': return 'Take Away';
      case 'swiggy': return 'Swiggy';
      case 'zomato': return 'Zomato';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 text-xs md:text-sm">
            <span className="text-gray-600">Total Orders:</span>
            <span className="font-bold text-[#ec2b25]">{filteredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 p-3 md:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Status</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)} 
              className="w-full px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
            >
              {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)} 
              className="w-full px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
            >
              {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input 
              type="date" 
              value={fromDate} 
              onChange={e => setFromDate(e.target.value)} 
              className="w-full px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
            />
          </div>
          <div>
            <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input 
              type="date" 
              value={toDate} 
              onChange={e => setToDate(e.target.value)} 
              className="w-full px-2 md:px-3 py-2 text-xs md:text-sm border border-gray-200 focus:outline-none focus:border-[#ec2b25]"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-6 md:w-8 h-6 md:h-8 animate-spin text-[#ec2b25]" />
            <p className="text-sm md:text-base text-gray-500">Loading orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white border border-gray-200 p-8 md:p-12">
          <div className="text-center text-sm md:text-base text-gray-500">No orders found.</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="border-2 border-gray-200 bg-white hover:shadow-lg transition-all">
              {/* Header */}
              <div className="bg-gray-50 px-3 md:px-4 py-2 md:py-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1 md:space-x-2 min-w-0 flex-1">
                    <span className={`px-2 md:px-3 py-1 text-xs font-bold border truncate ${getOrderTypeColor(order.type)}`}>
                      {getOrderTypeLabel(order.type)}
                    </span>
                  </div>
                  <span className={`px-1.5 md:px-2 py-1 text-xs font-bold uppercase flex-shrink-0 ${
                    order.status === 'completed' 
                      ? 'bg-green-600 text-white' 
                      : order.status === 'cancelled'
                      ? 'bg-gray-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {order.status}
                  </span>
                </div>
                <div className="space-y-1">
                  {order.orderId && (
                    <div className="text-xs md:text-sm font-mono font-bold text-[#ec2b25]">
                      {order.orderId}
                    </div>
                  )}
                  {order.billDocId && order.billDocId !== 'pending' && (
                    <div className="text-xs text-gray-600">
                      Bill: <span className="font-mono font-semibold">{order.billDocId.slice(-6).toUpperCase()}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-3 md:px-4 py-2 md:py-3">
                {/* Customer & Table Info */}
                <div className="mb-3 space-y-1">
                  {order.tableName && (
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Table:</span>
                      <span className="font-bold text-gray-900 truncate ml-2">{order.tableName}</span>
                    </div>
                  )}
                  {order.customerName && (
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium text-gray-900 truncate ml-2">{order.customerName}</span>
                    </div>
                  )}
                  {order.platformOrderId && (
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-gray-600">{order.platform === 'swiggy' ? 'Swiggy' : 'Zomato'} Order:</span>
                      <span className="font-mono font-bold text-gray-900 truncate ml-2">{order.platformOrderId}</span>
                    </div>
                  )}
                </div>

                {/* Item Details */}
                {order.itemName ? (
                  // Single item order (Dine In)
                  <div className="bg-gray-50 border border-gray-200 p-2 md:p-3 mb-3">
                    <div className="font-bold text-xs md:text-sm text-gray-900 mb-2 truncate">{order.itemName}</div>
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <div>
                        <span className="text-gray-600">Qty:</span>
                        <span className="ml-1 md:ml-2 font-bold text-gray-900">{order.quantity}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Price:</span>
                        <span className="ml-1 md:ml-2 font-medium text-gray-900">₹{order.itemPrice}</span>
                      </div>
                    </div>
                  </div>
                ) : order.items ? (
                  // Multiple items order (Takeaway, Swiggy, Zomato)
                  <div className="bg-gray-50 border border-gray-200 p-2 md:p-3 mb-3 space-y-2">
                    <div className="font-bold text-xs md:text-sm text-gray-900 mb-2">Items ({order.items.length})</div>
                    {order.items.map((item, index) => (
                      <div key={index} className="border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                        <div className="font-medium text-gray-900 text-xs md:text-sm mb-1 truncate">{item.itemName}</div>
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-gray-600">Qty:</span>
                            <span className="ml-1 md:ml-2 font-bold text-gray-900">{item.quantity}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Price:</span>
                            <span className="ml-1 md:ml-2 font-medium text-gray-900">₹{item.itemPrice}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-1 md:ml-2 font-bold text-gray-900">₹{(item.itemPrice * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                {/* Total Amount */}
                <div className="bg-[#ec2b25] text-white p-2 md:p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs md:text-sm">Total Amount:</span>
                    <span className="text-base md:text-xl font-bold">₹{order.total?.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Button */}
                <button
                  disabled={order.status === 'completed' || order.status === 'cancelled' || updatingId === order.id}
                  onClick={() => markAsComplete(order.id)}
                  className={`w-full px-3 md:px-4 py-2 font-semibold text-xs md:text-sm transition-colors flex items-center justify-center space-x-1 md:space-x-2 ${
                    order.status === 'completed' 
                      ? 'bg-green-100 text-green-700 cursor-not-allowed' 
                      : order.status === 'cancelled'
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-[#ec2b25] text-white hover:bg-[#d12620] cursor-pointer'
                  } ${updatingId === order.id ? 'opacity-50' : ''}`}
                >
                  {order.status === 'completed' ? (
                    <>
                      <CheckCircle className="w-3 md:w-4 h-3 md:h-4" />
                      <span>Completed</span>
                    </>
                  ) : order.status === 'cancelled' ? (
                    <>
                      <span>Cancelled</span>
                    </>
                  ) : updatingId === order.id ? (
                    <Loader2 className="w-3 md:w-4 h-3 md:h-4 animate-spin" />
                  ) : (
                    <>
                      <Clock className="w-3 md:w-4 h-3 md:h-4" />
                      <span>Mark as Complete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;