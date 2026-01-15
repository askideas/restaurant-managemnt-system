import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { TrendingUp, TrendingDown, ShoppingCart, FileText, XCircle, Package, IndianRupee } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalInvestment: 0,
    profitLoss: 0,
    profitPercentage: 0,
    totalOrders: 0,
    totalBills: 0,
    cancelledOrders: 0,
    topSellingItems: [],
    todayRevenue: 0,
    todayOrders: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch bills
      const billsSnap = await getDocs(collection(db, 'bills'));
      const bills = billsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch orders
      const ordersSnap = await getDocs(collection(db, 'orders'));
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Fetch investments
      const investmentsSnap = await getDocs(collection(db, 'investments'));
      const investments = investmentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate total revenue from bills
      const totalRevenue = bills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
      
      // Calculate total investment
      const totalInvestment = investments.reduce((sum, inv) => sum + (parseFloat(inv.amount) || 0), 0);
      
      // Calculate profit/loss
      const profitLoss = totalRevenue - totalInvestment;
      const profitPercentage = totalInvestment > 0 ? ((profitLoss / totalInvestment) * 100) : 0;

      // Count cancelled orders
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;

      // Calculate today's stats
      const today = new Date().toISOString().split('T')[0];
      const todayBills = bills.filter(bill => bill.createdAt && bill.createdAt.startsWith(today));
      const todayRevenue = todayBills.reduce((sum, bill) => sum + (parseFloat(bill.total) || 0), 0);
      const todayOrders = orders.filter(order => order.createdAt && order.createdAt.startsWith(today)).length;

      // Calculate top selling items
      const itemSales = {};
      orders.forEach(order => {
        if (order.itemName) {
          if (!itemSales[order.itemName]) {
            itemSales[order.itemName] = {
              name: order.itemName,
              quantity: 0,
              revenue: 0
            };
          }
          itemSales[order.itemName].quantity += 1;
          itemSales[order.itemName].revenue += parseFloat(order.price) || 0;
        }
      });

      const topSellingItems = Object.values(itemSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10);

      setStats({
        totalRevenue,
        totalInvestment,
        profitLoss,
        profitPercentage,
        totalOrders: orders.length,
        totalBills: bills.length,
        cancelledOrders,
        topSellingItems,
        todayRevenue,
        todayOrders,
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#ec2b25] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to NOVA Restaurant Management System</p>
      </div>

      {/* Main Financial Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Revenue */}
        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100">
              <IndianRupee className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-sm text-gray-500 mt-2">From {stats.totalBills} bills</p>
        </div>

        {/* Total Investment */}
        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100">
              <Package className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">Total Investment</h3>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.totalInvestment)}</p>
          <p className="text-sm text-gray-500 mt-2">Total expenses</p>
        </div>

        {/* Profit/Loss */}
        <div className="bg-white border-2 border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 ${stats.profitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {stats.profitLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600" />
              )}
            </div>
          </div>
          <h3 className="text-gray-600 text-sm font-medium mb-1">
            {stats.profitLoss >= 0 ? 'Profit' : 'Loss'}
          </h3>
          <p className={`text-3xl font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(stats.profitLoss))}
          </p>
          <p className={`text-sm font-medium mt-2 ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.profitPercentage >= 0 ? '+' : ''}{stats.profitPercentage.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Today's Revenue */}
        <div className="bg-white border-2 border-[#ec2b25] p-6">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="w-5 h-5 text-[#ec2b25]" />
            <h3 className="text-gray-600 text-sm font-medium">Today's Revenue</h3>
          </div>
          <p className="text-2xl font-bold text-[#ec2b25]">{formatCurrency(stats.todayRevenue)}</p>
        </div>

        {/* Total Orders */}
        <div className="bg-white border-2 border-blue-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Today: {stats.todayOrders}</p>
        </div>

        {/* Total Bills */}
        <div className="bg-white border-2 border-purple-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-purple-600" />
            <h3 className="text-gray-600 text-sm font-medium">Total Bills</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.totalBills}</p>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-white border-2 border-red-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-gray-600 text-sm font-medium">Cancelled Orders</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.cancelledOrders}</p>
        </div>
      </div>

      {/* Charts and Top Selling Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial Overview Bar Chart */}
        <div className="bg-white border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Financial Overview</h2>
          <div className="h-[300px] flex items-end justify-around gap-4 pb-2">
            {/* Revenue Bar */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '280px' }}>
                <div className="text-center mb-2">
                  <div className="text-xs font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</div>
                </div>
                <div 
                  className="w-full bg-green-500 flex items-end justify-center pb-2 transition-all duration-500"
                  style={{ 
                    height: '100%',
                    minHeight: '40px'
                  }}
                >
                  <span className="text-xs text-white font-medium">Revenue</span>
                </div>
              </div>
            </div>

            {/* Investment Bar */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '280px' }}>
                <div className="text-center mb-2">
                  <div className="text-xs font-bold text-orange-600">{formatCurrency(stats.totalInvestment)}</div>
                </div>
                <div 
                  className="w-full bg-orange-500 flex items-end justify-center pb-2 transition-all duration-500"
                  style={{ 
                    height: stats.totalRevenue > 0 
                      ? `${(stats.totalInvestment / stats.totalRevenue) * 100}%` 
                      : '20%',
                    minHeight: '40px'
                  }}
                >
                  <span className="text-xs text-white font-medium">Investment</span>
                </div>
              </div>
            </div>

            {/* Profit/Loss Bar */}
            <div className="flex-1 flex flex-col items-center">
              <div className="w-full flex flex-col items-center justify-end" style={{ height: '280px' }}>
                <div className="text-center mb-2">
                  <div className={`text-xs font-bold ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(Math.abs(stats.profitLoss))}
                  </div>
                  <div className={`text-xs font-medium ${stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.profitPercentage >= 0 ? '+' : ''}{stats.profitPercentage.toFixed(1)}%
                  </div>
                </div>
                <div 
                  className={`w-full flex items-end justify-center pb-2 transition-all duration-500 ${
                    stats.profitLoss >= 0 ? 'bg-green-600' : 'bg-red-600'
                  }`}
                  style={{ 
                    height: stats.totalRevenue > 0 
                      ? `${(Math.abs(stats.profitLoss) / stats.totalRevenue) * 100}%` 
                      : '20%',
                    minHeight: '40px'
                  }}
                >
                  <span className="text-xs text-white font-medium">
                    {stats.profitLoss >= 0 ? 'Profit' : 'Loss'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {/* X-axis labels */}
          <div className="border-t-2 border-gray-300 mt-2"></div>
        </div>

        {/* Top Selling Items */}
        <div className="bg-white border-2 border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Top 10 Selling Items</h2>
          {stats.topSellingItems.length > 0 ? (
            <div className="space-y-3">
              {stats.topSellingItems.map((item, index) => (
                <div key={index} className="border-b border-gray-200 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center bg-[#ec2b25] text-white text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">{item.quantity} orders</p>
                      <p className="text-xs text-gray-600">{formatCurrency(item.revenue)}</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-2">
                    <div 
                      className="bg-[#ec2b25] h-2"
                      style={{ 
                        width: stats.topSellingItems[0]?.quantity 
                          ? `${(item.quantity / stats.topSellingItems[0].quantity) * 100}%` 
                          : '0%' 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No sales data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white border-2 border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Order Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">{stats.totalOrders - stats.cancelledOrders}</div>
            <p className="text-gray-600 mt-2">Completed Orders</p>
            <div className="mt-2 text-sm text-gray-500">
              {stats.totalOrders > 0 
                ? `${(((stats.totalOrders - stats.cancelledOrders) / stats.totalOrders) * 100).toFixed(1)}%` 
                : '0%'} Success Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-red-600">{stats.cancelledOrders}</div>
            <p className="text-gray-600 mt-2">Cancelled Orders</p>
            <div className="mt-2 text-sm text-gray-500">
              {stats.totalOrders > 0 
                ? `${((stats.cancelledOrders / stats.totalOrders) * 100).toFixed(1)}%` 
                : '0%'} Cancellation Rate
            </div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {stats.totalBills > 0 ? (stats.totalRevenue / stats.totalBills).toFixed(0) : 0}
            </div>
            <p className="text-gray-600 mt-2">Average Bill Value</p>
            <div className="mt-2 text-sm text-gray-500">
              {formatCurrency(stats.totalBills > 0 ? stats.totalRevenue / stats.totalBills : 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
