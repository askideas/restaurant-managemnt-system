import React, { useEffect, useState } from 'react';
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

const STATUS_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Open', value: 'open' },
  { label: 'Completed', value: 'completed' },
];
const TYPE_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Dine In', value: 'dine-in' },
  { label: 'Take Away', value: 'take-away' },
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
      await updateDoc(doc(db, 'orders', orderId), { status: 'completed' });
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

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <div className="flex flex-wrap gap-4 mb-6 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border px-2 py-1 rounded text-sm">
            {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">Type</label>
          <select value={type} onChange={e => setType(e.target.value)} className="border px-2 py-1 rounded text-sm">
            {TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">From</label>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-700">To</label>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="border px-2 py-1 rounded text-sm" />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[#ec2b25]" /></div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center text-gray-500 py-12">No orders found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map(order => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
              <div className="flex flex-wrap justify-between items-center mb-2">
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-gray-900">Order #{order.id.slice(-6).toUpperCase()}</span>
                  <span className="text-xs text-gray-500">{order.createdAt?.replace('T', ' ').slice(0, 16)}</span>
                  <span className="text-xs text-gray-700">Type: <span className="font-semibold">{order.type === 'dine-in' ? 'Dine In' : 'Take Away'}</span></span>
                  <span className="text-xs text-gray-700">Status: <span className={`font-semibold ${order.status === 'completed' ? 'text-green-600' : 'text-[#ec2b25]'}`}>{order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}</span></span>
                  {order.tableName && <span className="font-semibold text-[#ec2b25]">Table: <span className="font-bold">{order.tableName}</span></span>}
                  {order.customerName && <span className="text-xs text-gray-700">Customer: <span className="font-semibold">{order.customerName}</span></span>}
                </div>
                <button
                  disabled={order.status === 'completed' || updatingId === order.id}
                  onClick={() => markAsComplete(order.id)}
                  className={`px-4 py-2 rounded font-semibold text-sm transition-colors ${order.status === 'completed' ? 'bg-green-100 text-green-600 cursor-not-allowed' : 'bg-[#ec2b25] text-white hover:bg-[#d12620]'} ${updatingId === order.id ? 'opacity-50' : ''}`}
                >
                  {order.status === 'completed' ? 'Completed' : updatingId === order.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Mark as Complete'}
                </button>
              </div>
              <div className="mt-2">
                <div className="font-semibold text-gray-800 mb-1">Items:</div>
                <ul className="list-disc pl-5 text-sm text-gray-700">
                  {order.items?.map(item => (
                    <li key={item.id}>
                      <span className="font-bold text-[#ec2b25]">{item.name}</span> x {item.quantity} <span className="text-xs text-gray-500">({item.price} each)</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {order.tableName && <span className="font-semibold text-[#ec2b25]">Table: <span className="font-bold">{order.tableName}</span></span>}
                <span className="font-semibold">Subtotal: <span className="text-gray-900">₹{order.subtotal}</span></span>
                <span className="font-semibold">Total: <span className="text-gray-900">₹{order.total}</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;