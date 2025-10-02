import React, { useState } from "react";
import { addProduct } from "../api";
import "./product.css";

export default function AddProduct({ refresh }) {
    const [product, setProduct] = useState({
        code: "",
        name: "",
        cost_price: "",
        sell_price: "",
        gst_percent: "",
        stock: ""
    });

    const handleAdd = async () => {
        if (!product.code || !product.name) return;
        await addProduct(product);
        setProduct({
            code: "",
            name: "",
            cost_price: "",
            sell_price: "",
            gst_percent: "",
            stock: ""
        });
        refresh();
    };

    return (
        <div className="add-product-container">
            <h2>Add Product</h2>
            <input
                placeholder="Code"
                value={product.code}
                onChange={e => setProduct({ ...product, code: e.target.value })}
            />
            <input
                placeholder="Name"
                value={product.name}
                onChange={e => setProduct({ ...product, name: e.target.value })}
            />
            <input
                type="number"
                placeholder="Cost Price"
                value={product.cost_price}
                onChange={e => setProduct({ ...product, cost_price: parseFloat(e.target.value) })}
            />
            <input
                type="number"
                placeholder="Sell Price"
                value={product.sell_price}
                onChange={e => setProduct({ ...product, sell_price: parseFloat(e.target.value) })}
            />
            <input
                type="number"
                placeholder="GST %"
                value={product.gst_percent}
                onChange={e => setProduct({ ...product, gst_percent: parseFloat(e.target.value) })}
            />
            <input
                type="number"
                placeholder="Stock"
                value={product.stock}
                onChange={e => setProduct({ ...product, stock: parseInt(e.target.value) })}
            />
            <button onClick={handleAdd}>Add Product</button>
        </div>
    );
}
