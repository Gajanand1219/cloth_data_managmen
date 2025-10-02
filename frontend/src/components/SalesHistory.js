import React, { useState } from "react";
import { fetchSalesHistory, fetchAllSalesHistory } from "../api"; // ✅ make sure both APIs exist
import "./history.css";

export default function SalesHistory() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [history, setHistory] = useState(null);
  const [showAll, setShowAll] = useState(false);

  const loadHistory = async () => {
    try {
      let data;
      if (showAll) {
        data = await fetchAllSalesHistory(); // fetch all history
      } else {
        if (!startDate || !endDate) return alert("Select start and end date");
        data = await fetchSalesHistory(startDate, endDate); // fetch date-range history
      }
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  return (
    <div className="history-container">
      <h2 className="history-title">Sales History / Statement</h2>

      {/* Options */}
      <div className="history-options">
        <label>
          <input
            type="radio"
            checked={!showAll}
            onChange={() => setShowAll(false)}
          />
          Date Range
        </label>
        <label>
          <input
            type="radio"
            checked={showAll}
            onChange={() => setShowAll(true)}
          />
          Show All
        </label>
      </div>

      {/* Date Picker */}
      {!showAll && (
        <div className="history-controls">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      )}

      <button onClick={loadHistory}>Load Statement</button>

      {/* Table */}
      {history && history.sales.length > 0 ? (
        <>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Sale ID</th>
                <th>Product</th>
                <th>Qty</th>
                <th>Cost Price</th>
                <th>Sell Price</th>
                <th>Discount %</th>
                <th>GST %</th>
                <th>Line Total</th>
                <th>Profit</th>
              </tr>
            </thead>
            <tbody>
              {history.sales.map((s, i) => (
                <tr key={i}>
                  <td>{s.date}</td>
                  <td>{s.sale_id}</td>
                  <td>{s.product}</td>
                  <td>{s.qty}</td>
                  <td>₹{s.cost_price}</td>
                  <td>₹{s.sell_price}</td>
                  <td>{s.discount_percent}%</td>
                  <td>{s.gst_percent}%</td>
                  <td>₹{s.line_total.toFixed(2)}</td>
                  <td>₹{s.profit.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div className="summary-box">
            <p><strong>Total Cost:</strong> ₹{history.summary.total_cost.toFixed(2)}</p>
            <p><strong>Total Revenue:</strong> ₹{history.summary.total_revenue.toFixed(2)}</p>
            <p><strong>Total GST:</strong> ₹{history.summary.total_gst.toFixed(2)}</p>
            <p><strong>Total Profit:</strong> ₹{history.summary.total_profit.toFixed(2)}</p>
          </div>
        </>
      ) : (
        history && <p>No sales found.</p>
      )}
    </div>
  );
}
