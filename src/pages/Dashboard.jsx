import React from 'react';
import { useRestaurant } from '../context/RestaurantContext';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import { TrendingUp, TrendingDown, DollarSign, ShoppingBag, CreditCard, Clock } from 'lucide-react';

const Dashboard = () => {
  const { orders, getTodayStats, getTopSellingItems } = useRestaurant();
  const stats = getTodayStats();
  const topItems = getTopSellingItems(5);
  
  const recentOrders = orders
    .filter(order => order.status !== 'completed')
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 5);

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color }) => (
    <Card variant="elevated">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-600 font-bold tracking-wider uppercase">{title}</p>
          <h3 className="text-4xl font-black text-black mt-2">{value}</h3>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUp size={16} strokeWidth={3} /> : <TrendingDown size={16} strokeWidth={3} />}
              <span className="text-sm font-bold">{trendValue}</span>
            </div>
          )}
        </div>
        <div className={`w-16 h-16 flex items-center justify-center ${color}`}>
          <Icon size={32} className="text-white" strokeWidth={2.5} />
        </div>
      </div>
    </Card>
  );

  const formatCurrency = (amount) => {
    return `₹${amount.toFixed(2)}`;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b-4 border-black pb-4">
        <h1 className="text-4xl font-black text-black tracking-tight uppercase">Dashboard</h1>
        <p className="text-gray-600 mt-1 tracking-wide uppercase text-sm font-bold">Today's Overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Today's Sales"
          value={formatCurrency(stats.totalSales)}
          icon={DollarSign}
          trend="up"
          trendValue="+12.5%"
          color="bg-green-600"
        />
        <StatCard
          title="Total Orders"
          value={stats.totalOrders}
          icon={ShoppingBag}
          trend="up"
          trendValue="+8.2%"
          color="bg-blue-600"
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(stats.avgOrderValue)}
          icon={CreditCard}
          trend="down"
          trendValue="-3.1%"
          color="bg-yellow-500"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders + stats.preparingOrders}
          icon={Clock}
          color="bg-red-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card variant="elevated">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-black">
            <h2 className="text-2xl font-black text-black tracking-tight uppercase">Recent Orders</h2>
            <Badge variant="default">{recentOrders.length} Active</Badge>
          </div>
          <div className="space-y-3">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active orders</p>
            ) : (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 border-2 border-gray-200 hover:border-black transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-black tracking-wide uppercase text-sm">Order #{order.id}</span>
                      <Badge variant={order.status}>{order.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Table {order.tableId} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(order.total)}</p>
                    <p className="text-xs text-gray-500">{formatTime(order.timestamp)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Top Selling Items */}
        <Card variant="elevated">
          <h2 className="text-2xl font-black text-black tracking-tight uppercase mb-4 pb-3 border-b-2 border-black">Top Selling Items</h2>
          <div className="space-y-3">
            {topItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sales data available</p>
            ) : (
              topItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 border-2 border-gray-200"
                >
                  <div className="w-10 h-10 bg-red-600 flex items-center justify-center text-white font-black text-lg">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-black tracking-wide uppercase text-sm">{item.name}</p>
                    <p className="text-sm text-gray-600">
                      {item.totalQuantity} sold • {formatCurrency(item.totalRevenue)}
                    </p>
                  </div>
                  <div className="text-2xl">{item.image}</div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
