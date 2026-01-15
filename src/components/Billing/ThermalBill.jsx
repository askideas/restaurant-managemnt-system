import React from 'react';

const ThermalBill = React.forwardRef(({ billData }, ref) => {
  if (!billData) return null;

  const {
    billNo = 'N/A',
    orderNo = 'N/A',
    kotNo = 'N/A',
    date = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    type = 'Dine In',
    table = 'N/A',
    user = 'Admin',
    items = [],
    totalAmount = 0,
    totalQty = 0
  } = billData;

  return (
    <div ref={ref} className="thermal-bill-container p-4 bg-white text-black font-mono text-[12px] uppercase leading-relaxed w-full mx-auto print:block hidden">
      <div className="text-center mb-6">
        <h1 className="font-bold text-xl mb-1">Sai Ram MallaReddy Family Dhaba and Restaurant</h1>
        <p className="text-sm">RTC Colony, Bujja Bujja Nellore Rural, AP 524004, India</p>
        <p className="text-sm">Contact No: 9177154024</p>
        <p className="text-sm">GST: 37BOMPR8412B1ZA</p>
      </div>

      <div className="flex justify-between mb-2 text-sm">
        <span>{date} {time}</span>
        <span>{type}</span>
      </div>

      <div className="text-center font-bold mb-4 border-y border-double border-black py-2">
        <p className="text-base uppercase tracking-wider">Bill No : {billNo}</p>
        <p className="text-lg uppercase tracking-widest">Order No: {orderNo}</p>
        <p className="text-sm">KOT No : {kotNo}</p>
      </div>

      <div className="flex justify-between border-b border-dashed border-black pb-2 mb-4 text-sm font-bold">
        <span>Table: {table}</span>
        <span>User: {user}</span>
      </div>

      <table className="w-full mb-4 text-sm">
        <thead>
          <tr className="border-b-2 border-black">
            <th className="text-left py-2">Item</th>
            <th className="text-right py-2">Qty</th>
            <th className="text-right py-2">Rate</th>
            <th className="text-right py-2">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100">
              <td className="py-2 pr-2">{index + 1}. {item.name}</td>
              <td className="text-right py-2">{item.quantity}</td>
              <td className="text-right py-2">{item.price}</td>
              <td className="text-right py-2 font-bold">{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t-2 border-black pt-2 mb-4">
        <div className="flex justify-between text-base">
          <span>Total Items: {totalQty}</span>
          <span className="font-bold">Total: Rs {totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-black text-xl mt-2 pt-2 border-t border-dashed border-black">
          <span>GRAND TOTAL:</span>
          <span>Rs {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-6 pt-4 border-t border-double border-black text-[10px]">
        <p className="font-bold mb-1 italic">Thank you for visiting!</p>
        <p>Powered by TMBI v7.3.77</p>
      </div>
    </div>
  );
});

ThermalBill.displayName = 'ThermalBill';

export default ThermalBill;
