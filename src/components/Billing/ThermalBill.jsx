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
    <div ref={ref} className="thermal-bill-container p-4 bg-white text-black font-mono text-[10px] uppercase leading-tight w-[80mm] mx-auto print:block hidden">
      <div className="text-center mb-4">
        <h1 className="font-bold text-sm mb-1">Sai Ram MallaReddy Family Dhaba and Restaurant</h1>
        <p>RTC Colony, Bujja Bujja Nellore Rural, AP 524004, India</p>
        <p>Contact No: 9177154024</p>
        <p>GST: 37BOMPR8412B1ZA</p>
      </div>

      <div className="flex justify-between mb-1">
        <span>{date} {time}</span>
        <span>{type}</span>
      </div>

      <div className="text-center font-bold text-xs mb-1">
        <p>Bill No : {billNo}</p>
        <p className="text-sm">Order No: {orderNo}</p>
        <p>KOT No : {kotNo}</p>
      </div>

      <div className="flex justify-between border-y border-dashed border-black py-1 mb-2">
        <span>Table: {table}</span>
        <span>User: {user}</span>
      </div>

      <table className="w-full mb-2">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left font-normal py-1">Item</th>
            <th className="text-right font-normal py-1">Qty</th>
            <th className="text-right font-normal py-1">Rate</th>
            <th className="text-right font-normal py-1">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="py-1">{index + 1}.{item.name}</td>
              <td className="text-right py-1">{item.quantity}</td>
              <td className="text-right py-1">{item.price}</td>
              <td className="text-right py-1">{item.price * item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black pt-1 mb-2">
        <div className="flex justify-between">
          <span>Total Qty: {totalQty}</span>
          <span>Total Amount: Rs {totalAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-xs mt-1">
          <span>Grand Total:</span>
          <span>Rs {totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center mt-4 pt-2 border-t border-dashed border-black text-[8px]">
        <p>Powered by TMBI v7.3.77</p>
      </div>
    </div>
  );
});

ThermalBill.displayName = 'ThermalBill';

export default ThermalBill;
