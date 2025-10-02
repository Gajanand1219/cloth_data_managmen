# main.py
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException
from sqlmodel import SQLModel, Field, Relationship, create_engine, Session, select
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()


# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://shop-navy-beta.vercel.app"  # ✅ added deployed frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ------------------------
# Models
# ------------------------
class Product(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str
    cost_price: float
    sell_price: float
    gst_percent: float = 5.0
    stock: int = 0

from datetime import datetime, timedelta, timezone

IST = timezone(timedelta(hours=5, minutes=30))

class Sale(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    subtotal: float
    discount_total: float
    total_gst: float
    grand_total: float
    created_at: datetime = Field(default_factory=lambda: datetime.now(IST))  # ✅ store IST time
    items: List["SaleItem"] = Relationship(back_populates="sale")


class SaleItem(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    sale_id: int = Field(foreign_key="sale.id")
    product_id: int
    product_code: str
    product_name: str
    unit_price: float
    qty: int
    discount_percent: float
    gst_percent: float
    line_total: float
    cost_price: float

    sale: Optional[Sale] = Relationship(back_populates="items")

# ------------------------
# Request Models
# ------------------------
class ProductIn(SQLModel):
    code: str
    name: str
    cost_price: float
    sell_price: float
    gst_percent: float = 5.0
    stock: int

class SaleItemIn(SQLModel):
    product_code: str
    qty: int
    unit_price: Optional[float] = None  # if admin/user wants to override default sell_price
    discount_percent: float = 0.0

# ------------------------
# DB Setup
# ------------------------
DATABASE_URL = "sqlite:///./db.sqlite"
engine = create_engine(DATABASE_URL, echo=False)
SQLModel.metadata.create_all(engine)

# ------------------------
# Product Endpoints
# ------------------------
@app.post("/products", response_model=Product)
def create_product(product_in: ProductIn):
    with Session(engine) as session:
        existing = session.exec(select(Product).where(Product.code == product_in.code)).first()
        if existing:
            raise HTTPException(status_code=400, detail="Product code already exists")
        product = Product(**product_in.dict())
        session.add(product)
        session.commit()
        session.refresh(product)
        return product

@app.get("/products", response_model=List[dict])
def list_products():
    with Session(engine) as session:
        products = session.exec(select(Product)).all()
        result = []
        for p in products:
            profit_unit = p.sell_price - p.cost_price
            profit_total = profit_unit * p.stock
            result.append({
                "id": p.id,
                "code": p.code,
                "name": p.name,
                "cost_price": p.cost_price,
                "sell_price": p.sell_price,
                "profit_loss_per_unit": profit_unit,
                "profit_loss_total": profit_total,
                "stock": p.stock
            })
        return result


# ------------------------
# Sales Endpoint
# ------------------------
@app.post("/sales")
def create_sale(items: List[SaleItemIn]):
    subtotal = 0.0
    discount_total = 0.0
    total_gst = 0.0
    sale_items_to_create = []

    with Session(engine) as session:
        for item in items:
            product = session.exec(select(Product).where(Product.code==item.product_code)).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_code} not found")
            if product.stock < item.qty:
                raise HTTPException(status_code=400, detail=f"Not enough stock for {item.product_code}")

            # use override price if given, else default sell_price
            unit_price = item.unit_price if item.unit_price is not None else product.sell_price

            line_price = unit_price * item.qty
            line_discount = line_price * (item.discount_percent / 100)
            taxable = line_price - line_discount
            gst_amount = taxable * (product.gst_percent / 100)
            line_total = taxable + gst_amount

            subtotal += line_price
            discount_total += line_discount
            total_gst += gst_amount

            sale_item = SaleItem(
                product_id=product.id,
                product_code=product.code,
                product_name=product.name,
                unit_price=unit_price,
                qty=item.qty,
                discount_percent=item.discount_percent,
                gst_percent=product.gst_percent,
                line_total=line_total,
                cost_price=product.cost_price
            )
            sale_items_to_create.append((sale_item, product, item.qty))

        grand_total = subtotal - discount_total + total_gst

        # save sale
        sale = Sale(subtotal=subtotal, discount_total=discount_total, total_gst=total_gst, grand_total=grand_total)
        session.add(sale)
        session.commit()
        session.refresh(sale)

        # save sale items and update stock
        for sale_item, product, qty in sale_items_to_create:
            sale_item.sale_id = sale.id
            product.stock -= qty
            session.add(sale_item)
            session.add(product)
        session.commit()

        return {
            "sale_id": sale.id,
            "subtotal": subtotal,
            "discount_total": discount_total,
            "total_gst": total_gst,
            "grand_total": grand_total,
            "items": [
                {
                    "product_code": s.product_code,
                    "product_name": s.product_name,
                    "qty": s.qty,
                    "unit_price": s.unit_price,
                    "discount_percent": s.discount_percent,
                    "gst_percent": s.gst_percent,
                    "line_total": s.line_total,
                    "cost_price": s.cost_price,
                    "profit_loss_per_unit": s.unit_price - s.cost_price,
                    "profit_loss_total": (s.unit_price - s.cost_price)*s.qty
                } for s, _, _ in sale_items_to_create
            ]
        }









from fastapi import Path

@app.put("/products/{product_id}", response_model=Product)
def update_product(product_id: int, product_in: ProductIn):
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        for key, value in product_in.dict().items():
            setattr(product, key, value)
        session.add(product)
        session.commit()
        session.refresh(product)
        return product

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    with Session(engine) as session:
        product = session.get(Product, product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        session.delete(product)
        session.commit()
        return {"message": "Product deleted successfully"}


from sqlalchemy.orm import selectinload

@app.get("/sales/history")
def get_sales_history(start_date: str, end_date: str):
    from datetime import datetime, timedelta

    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1) - timedelta(seconds=1)

    with Session(engine) as session:
        sales = session.exec(
            select(Sale)
            .where(Sale.created_at >= start, Sale.created_at <= end)
            .options(selectinload(Sale.items))  # ✅ load sale.items
        ).all()

        sales_data = []
        total_cost, total_revenue, total_gst, total_profit = 0, 0, 0, 0

        for sale in sales:
            for item in sale.items:
                profit = (item.unit_price - item.cost_price) * item.qty
                gst_amount = (item.unit_price * item.qty - (item.unit_price * item.qty * item.discount_percent / 100)) * (item.gst_percent / 100)

                sales_data.append({
                    "date": sale.created_at.strftime("%Y-%m-%d %H:%M"),
                    "sale_id": sale.id,
                    "product": item.product_name,
                    "qty": item.qty,
                    "cost_price": item.cost_price,
                    "sell_price": item.unit_price,
                    "discount_percent": item.discount_percent,
                    "gst_percent": item.gst_percent,
                    "line_total": item.line_total,
                    "profit": profit
                })

                total_cost += item.cost_price * item.qty
                total_revenue += item.unit_price * item.qty
                total_gst += gst_amount
                total_profit += profit

        return {
            "sales": sales_data,
            "summary": {
                "total_cost": total_cost,
                "total_revenue": total_revenue,
                "total_gst": total_gst,
                "total_profit": total_profit
            }
        }









@app.get("/sales/history/all")
def get_all_sales_history():
    with Session(engine) as session:
        sales = session.exec(select(Sale)).all()

        sales_data = []
        total_cost = total_revenue = total_gst = total_profit = 0

        for sale in sales:
            for item in sale.items:
                profit = (item.unit_price - item.cost_price) * item.qty
                sales_data.append({
                    "date": sale.created_at.strftime("%Y-%m-%d %H:%M"),
                    "sale_id": sale.id,
                    "product": item.product_name,
                    "qty": item.qty,
                    "cost_price": item.cost_price,
                    "sell_price": item.unit_price,
                    "discount_percent": item.discount_percent,
                    "gst_percent": item.gst_percent,
                    "line_total": item.line_total,
                    "profit": profit
                })

                total_cost += item.cost_price * item.qty
                total_revenue += item.unit_price * item.qty
                total_gst += (item.line_total - (item.unit_price * item.qty - (item.unit_price * item.qty * item.discount_percent / 100)))
                total_profit += profit

        return {
            "sales": sales_data,
            "summary": {
                "total_cost": total_cost,
                "total_revenue": total_revenue,
                "total_gst": total_gst,
                "total_profit": total_profit
            }
        }
