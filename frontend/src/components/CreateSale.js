import React, { useState, useEffect } from "react";
import { getProducts, createSale } from "../api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./sales.css";

export default function CreateSale({ refreshProducts }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [qty, setQty] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [bill, setBill] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [productRate, setProductRate] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProducts();
        setProducts(data || []);
      } catch (err) {
        console.error("Failed to fetch products", err);
        setProducts([]);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedCode) {
      const product = products.find((p) => p.code === selectedCode);
      if (product) setProductRate(product.sell_price || "");
    } else {
      setProductRate("");
    }
  }, [selectedCode, products]);

  const addToCart = () => {
    const product = products.find((p) => p.code === selectedCode);
    if (!product) return alert("Please select a product");
    if (qty <= 0) return alert("Quantity must be greater than 0");
    if (qty > product.stock)
      return alert(`Only ${product.stock} items available in stock`);

    const price = parseFloat(productRate) || product.sell_price || 0;
    if (price <= 0) return alert("Please enter a valid product rate");

    const line_total =
      price *
      qty *
      (1 - discount / 100) *
      (1 + (product.gst_percent || 0) / 100);

    const existingIndex = cart.findIndex((c) => c.code === product.code);
    let newCart = [...cart];

    if (existingIndex >= 0) {
      const existingItem = newCart[existingIndex];
      existingItem.qty += qty;
      existingItem.discount_percent = discount;
      existingItem.price = price;
      existingItem.line_total =
        existingItem.price *
        existingItem.qty *
        (1 - existingItem.discount_percent / 100) *
        (1 + (existingItem.gst_percent || 0) / 100);
      newCart[existingIndex] = existingItem;
    } else {
      newCart.push({
        ...product,
        qty,
        discount_percent: discount,
        price: price,
        line_total,
      });
    }

    setCart(newCart);
    setSelectedCode("");
    setQty(1);
    setDiscount(0);
    setProductRate("");
  };

  const subtotal = cart.reduce((a, c) => a + (c.price || 0) * (c.qty || 0), 0);
  const discount_total = cart.reduce(
    (a, c) =>
      a +
      ((c.price || 0) * (c.qty || 0) * (c.discount_percent || 0)) / 100,
    0
  );
  const total_gst = cart.reduce(
    (a, c) =>
      a +
      ((c.price || 0) *
        (c.qty || 0) *
        (1 - (c.discount_percent || 0) / 100) *
        ((c.gst_percent || 0) / 100)),
    0
  );
  const grand_total = subtotal - discount_total + total_gst;
  const billNumber = Math.floor(1000 + Math.random() * 9000);

  const downloadPDF = () => {
    const input = document.getElementById("bill-area");
    if (!input) return;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Bill_${billNumber}.pdf`);
    });
  };

  const generateBill = async () => {
    if (cart.length === 0) return alert("Please add items to cart");
    if (!customerName.trim()) return alert("Please enter customer name");

    try {
      const saleItems = cart.map((c) => ({
        product_code: c.code,
        qty: c.qty,
        discount_percent: c.discount_percent,
        price: c.price,
      }));

      const res = await createSale(saleItems);
      setBill(res);
      setCart([]);
      refreshProducts();
      downloadPDF();
    } catch (err) {
      console.error("Failed to create sale", err);
      alert("Failed to generate bill. Please try again.");
    }
  };

  const clearAll = () => {
    setCart([]);
    setCustomerName("");
    setPhoneNumber("");
    setSelectedCode("");
    setQty(1);
    setDiscount(0);
    setProductRate("");
    setBill(null);
  };

  return (
    <div className="billing-container">
      <div className="billing-header">
        <h1>Billing Software</h1>
      </div>

      <div className="billing-main">
        <div className="input-section">
          <div className="section">
            <h2>Customer Details</h2>
            <div className="form-group">
              <label>Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-control"
                placeholder="Enter customer name"
              />
            </div>
            <div className="form-group">
              <label>Phone No.</label>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-control"
                placeholder="Enter phone number"
              />
            </div>
          </div>

          <div className="section">
            <h2>Product Details</h2>
            <div className="form-group">
              <label>Product Name</label>
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="form-control"
              >
                <option value="">Select Product</option>
                {products.map((p) => (
                  <option key={p.code} value={p.code} disabled={p.stock <= 0}>
                    {p.name}{" "}
                    {p.stock > 0 ? `(Stock: ${p.stock})` : "(Out of stock)"}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Product Rate</label>
                <input
                  type="number"
                  value={productRate}
                  onChange={(e) => setProductRate(e.target.value)}
                  className="form-control"
                  placeholder="Enter rate"
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={qty}
                  onChange={(e) => setQty(parseInt(e.target.value))}
                  className="form-control"
                  placeholder="Quantity"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Discount %</label>
              <input
                type="number"
                min="0"
                max="100"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value))}
                className="form-control"
                placeholder="Discount %"
                step="0.1"
              />
            </div>
          </div>

          <div className="btn-group">
            <button onClick={addToCart} className="btn btn-primary">
              Add Item
            </button>
            <button onClick={generateBill} className="btn btn-success">
              Generate Bill
            </button>
          </div>
          <div className="btn-group">
            <button onClick={clearAll} className="btn btn-warning">
              Clear
            </button>
          </div>
        </div>

        {/* Right Column - Bill Area */}
        <div className="bill-area" id="bill-area">
          <div className="bill-header">
            <h2>Welcome Shivam Retail</h2>
          </div>

          <div className="bill-content">
            <div className="bill-info">
              <p>
                <strong>Bill Number:</strong> {billNumber}
              </p>
              <p>
                <strong>Customer Name:</strong> {customerName || "N/A"}
              </p>
              <p>
                <strong>Phone Number:</strong> {phoneNumber || "N/A"}
              </p>
            </div>

            <div className="bill-items">
              <div className="bill-items-header">
                <div>Product</div>
                <div className="bill-item-qty">QTY</div>
                <div className="bill-item-price">Price</div>
              </div>

              <div className="bill-items-container">
                {cart.length === 0 ? (
                  <div className="empty-state">No items added</div>
                ) : (
                  cart.map((item, index) => (
                    <div key={index} className="bill-item">
                      <div>{` ${item.name}`}</div> {/* FIX */}
                      <div className="bill-item-qty">{item.qty}</div>
                      <div className="bill-item-price">
                        ₹{(item.line_total || 0).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {cart.length > 0 && (
              <div className="bill-totals">
                <div className="total-row">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Discount:</span>
                  <span>₹{discount_total.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>GST:</span>
                  <span>₹{total_gst.toFixed(2)}</span>
                </div>
                <div className="total-row">
                  <span>Grand Total:</span>
                  <span>₹{grand_total.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
