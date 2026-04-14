from fastapi import FastAPI, APIRouter, Request, Response, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import httpx
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ───

class UserOut(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None

class CompanyOut(BaseModel):
    company_id: str
    name: str
    short_name: str
    type: str
    currency: str = "USD"

class CustomerCreate(BaseModel):
    name: str
    company_name: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    notes: Optional[str] = ""

class VendorCreate(BaseModel):
    name: str
    company_name: Optional[str] = ""
    phone: Optional[str] = ""
    email: Optional[str] = ""
    address: Optional[str] = ""
    tax_id: Optional[str] = ""
    default_expense_account: Optional[str] = ""
    notes: Optional[str] = ""

class InvoiceLineItem(BaseModel):
    product: str = ""
    description: str = ""
    quantity: float = 0
    unit: str = "pcs"
    rate: float = 0
    discount: float = 0
    tax: float = 0
    amount: float = 0

class InvoiceCreate(BaseModel):
    customer_id: str
    customer_name: str = ""
    invoice_date: str = ""
    due_date: str = ""
    sales_rep: str = ""
    warehouse: str = ""
    items: List[InvoiceLineItem] = []
    notes: str = ""
    terms: str = "Net 30"
    subtotal: float = 0
    tax_total: float = 0
    discount_total: float = 0
    total: float = 0
    status: str = "Draft"
    payment_status: str = "Unpaid"
    amount_paid: float = 0

class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    amount_paid: Optional[float] = None
    notes: Optional[str] = None

class PaymentRecord(BaseModel):
    amount: float
    payment_date: str = ""
    payment_method: str = "Bank Transfer"
    reference: str = ""
    memo: str = ""

# ─── Auth Helpers ───

async def get_current_user(request: Request) -> dict:
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ─── Auth Routes ───

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    body = await request.json()
    session_id = body.get("session_id")
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session_id")
    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one({"email": email}, {"$set": {"name": name, "picture": picture}})
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token,
        httponly=True, secure=True, samesite="none",
        path="/", max_age=7*24*60*60
    )
    return {"user_id": user_id, "email": email, "name": name, "picture": picture}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return UserOut(**user)

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"ok": True}

# ─── Companies Routes ───

COMPANIES = [
    {"company_id": "ckfrozen", "name": "CK Frozen Fish & Food Inc.", "short_name": "CK Frozen", "type": "Wholesale Import & Distribution", "currency": "USD"},
    {"company_id": "haor", "name": "Haor Heritage Inc.", "short_name": "Haor Heritage", "type": "Wholesale & Retail", "currency": "USD"},
    {"company_id": "deshi", "name": "Deshi Distributors LLC", "short_name": "Deshi Dist.", "type": "Distribution", "currency": "USD"},
    {"company_id": "ckcanada", "name": "CK Frozen Fish & Food Canada Inc.", "short_name": "CK Canada", "type": "Import & Distribution", "currency": "CAD"},
]

@api_router.get("/companies")
async def get_companies():
    return COMPANIES

@api_router.get("/companies/{company_id}")
async def get_company(company_id: str):
    for c in COMPANIES:
        if c["company_id"] == company_id:
            return c
    raise HTTPException(status_code=404, detail="Company not found")

# ─── Customers Routes ───

@api_router.get("/companies/{company_id}/customers")
async def get_customers(company_id: str, user: dict = Depends(get_current_user)):
    customers = await db.customers.find({"company_id": company_id}, {"_id": 0}).to_list(500)
    return customers

@api_router.post("/companies/{company_id}/customers")
async def create_customer(company_id: str, data: CustomerCreate, user: dict = Depends(get_current_user)):
    cust = {
        "customer_id": f"cust_{uuid.uuid4().hex[:10]}",
        "company_id": company_id,
        **data.model_dump(),
        "open_balance": 0,
        "total_invoiced": 0,
        "last_invoice_date": None,
        "status": "Active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"]
    }
    await db.customers.insert_one(cust)
    cust.pop("_id", None)
    return cust

@api_router.get("/companies/{company_id}/customers/{customer_id}")
async def get_customer(company_id: str, customer_id: str, user: dict = Depends(get_current_user)):
    c = await db.customers.find_one({"company_id": company_id, "customer_id": customer_id}, {"_id": 0})
    if not c:
        raise HTTPException(status_code=404, detail="Customer not found")
    return c

@api_router.put("/companies/{company_id}/customers/{customer_id}")
async def update_customer(company_id: str, customer_id: str, data: CustomerCreate, user: dict = Depends(get_current_user)):
    result = await db.customers.update_one(
        {"company_id": company_id, "customer_id": customer_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    updated = await db.customers.find_one({"company_id": company_id, "customer_id": customer_id}, {"_id": 0})
    return updated

# ─── Vendors Routes ───

@api_router.get("/companies/{company_id}/vendors")
async def get_vendors(company_id: str, user: dict = Depends(get_current_user)):
    vendors = await db.vendors.find({"company_id": company_id}, {"_id": 0}).to_list(500)
    return vendors

@api_router.post("/companies/{company_id}/vendors")
async def create_vendor(company_id: str, data: VendorCreate, user: dict = Depends(get_current_user)):
    vendor = {
        "vendor_id": f"vnd_{uuid.uuid4().hex[:10]}",
        "company_id": company_id,
        **data.model_dump(),
        "payable_balance": 0,
        "total_billed": 0,
        "bill_count": 0,
        "status": "Active",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"]
    }
    await db.vendors.insert_one(vendor)
    vendor.pop("_id", None)
    return vendor

@api_router.get("/companies/{company_id}/vendors/{vendor_id}")
async def get_vendor(company_id: str, vendor_id: str, user: dict = Depends(get_current_user)):
    v = await db.vendors.find_one({"company_id": company_id, "vendor_id": vendor_id}, {"_id": 0})
    if not v:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return v

@api_router.put("/companies/{company_id}/vendors/{vendor_id}")
async def update_vendor(company_id: str, vendor_id: str, data: VendorCreate, user: dict = Depends(get_current_user)):
    result = await db.vendors.update_one(
        {"company_id": company_id, "vendor_id": vendor_id},
        {"$set": data.model_dump()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Vendor not found")
    updated = await db.vendors.find_one({"company_id": company_id, "vendor_id": vendor_id}, {"_id": 0})
    return updated

# ─── Invoices Routes ───

@api_router.get("/companies/{company_id}/invoices")
async def get_invoices(company_id: str, status: Optional[str] = None, user: dict = Depends(get_current_user)):
    query = {"company_id": company_id}
    if status:
        query["status"] = status
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(500)
    return invoices

@api_router.post("/companies/{company_id}/invoices")
async def create_invoice(company_id: str, data: InvoiceCreate, user: dict = Depends(get_current_user)):
    count = await db.invoices.count_documents({"company_id": company_id})
    inv_number = f"INV-{str(count + 1001).zfill(5)}"
    items_list = [item.model_dump() for item in data.items]
    invoice = {
        "invoice_id": f"inv_{uuid.uuid4().hex[:10]}",
        "company_id": company_id,
        "invoice_number": inv_number,
        "customer_id": data.customer_id,
        "customer_name": data.customer_name,
        "invoice_date": data.invoice_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "due_date": data.due_date or (datetime.now(timezone.utc) + timedelta(days=30)).strftime("%Y-%m-%d"),
        "sales_rep": data.sales_rep,
        "warehouse": data.warehouse,
        "items": items_list,
        "notes": data.notes,
        "terms": data.terms,
        "subtotal": data.subtotal,
        "tax_total": data.tax_total,
        "discount_total": data.discount_total,
        "total": data.total,
        "status": data.status,
        "payment_status": data.payment_status,
        "amount_paid": data.amount_paid,
        "balance_due": data.total - data.amount_paid,
        "payments": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"]
    }
    await db.invoices.insert_one(invoice)
    invoice.pop("_id", None)
    # Update customer balance
    if data.customer_id:
        await db.customers.update_one(
            {"customer_id": data.customer_id},
            {"$inc": {"open_balance": data.total - data.amount_paid, "total_invoiced": data.total},
             "$set": {"last_invoice_date": invoice["invoice_date"]}}
        )
    return invoice

@api_router.get("/companies/{company_id}/invoices/{invoice_id}")
async def get_invoice(company_id: str, invoice_id: str, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"company_id": company_id, "invoice_id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return inv

@api_router.put("/companies/{company_id}/invoices/{invoice_id}")
async def update_invoice(company_id: str, invoice_id: str, data: InvoiceUpdate, user: dict = Depends(get_current_user)):
    update_fields = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.invoices.update_one(
        {"company_id": company_id, "invoice_id": invoice_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
    updated = await db.invoices.find_one({"company_id": company_id, "invoice_id": invoice_id}, {"_id": 0})
    return updated

@api_router.post("/companies/{company_id}/invoices/{invoice_id}/payments")
async def record_payment(company_id: str, invoice_id: str, payment: PaymentRecord, user: dict = Depends(get_current_user)):
    inv = await db.invoices.find_one({"company_id": company_id, "invoice_id": invoice_id}, {"_id": 0})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
    new_paid = inv.get("amount_paid", 0) + payment.amount
    new_balance = inv["total"] - new_paid
    new_status = "Paid" if new_balance <= 0 else "Sent"
    new_payment_status = "Paid" if new_balance <= 0 else "Partial"
    payment_entry = {
        "payment_id": f"pmt_{uuid.uuid4().hex[:8]}",
        **payment.model_dump(),
        "recorded_at": datetime.now(timezone.utc).isoformat(),
        "recorded_by": user["user_id"]
    }
    await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": {"amount_paid": new_paid, "balance_due": new_balance, "status": new_status, "payment_status": new_payment_status},
         "$push": {"payments": payment_entry}}
    )
    # Update customer balance
    if inv.get("customer_id"):
        await db.customers.update_one(
            {"customer_id": inv["customer_id"]},
            {"$inc": {"open_balance": -payment.amount}}
        )
    updated = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    return updated

# ─── Dashboard Routes ───

@api_router.get("/companies/{company_id}/dashboard")
async def get_dashboard(company_id: str, user: dict = Depends(get_current_user)):
    invoices = await db.invoices.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    customers = await db.customers.find({"company_id": company_id}, {"_id": 0}).to_list(500)
    vendors = await db.vendors.find({"company_id": company_id}, {"_id": 0}).to_list(500)

    total_sales = sum(i.get("total", 0) for i in invoices)
    total_collected = sum(i.get("amount_paid", 0) for i in invoices)
    outstanding_receivables = sum(i.get("balance_due", 0) for i in invoices if i.get("balance_due", 0) > 0)
    total_payables = sum(v.get("payable_balance", 0) for v in vendors)
    invoice_count = len(invoices)

    # Top customers by open balance
    top_customers = sorted(customers, key=lambda c: c.get("open_balance", 0), reverse=True)[:5]
    top_vendors = sorted(vendors, key=lambda v: v.get("payable_balance", 0), reverse=True)[:5]

    # Recent invoices
    recent_invoices = sorted(invoices, key=lambda i: i.get("created_at", ""), reverse=True)[:10]

    # Monthly sales (simple aggregation)
    monthly_sales = {}
    for inv in invoices:
        d = inv.get("invoice_date", "")
        if d:
            month_key = d[:7]
            monthly_sales[month_key] = monthly_sales.get(month_key, 0) + inv.get("total", 0)
    sales_trend = [{"month": k, "amount": v} for k, v in sorted(monthly_sales.items())]

    # Aging buckets
    today = datetime.now(timezone.utc).date()
    aging = {"current": 0, "1_30": 0, "31_60": 0, "61_90": 0, "over_90": 0}
    for inv in invoices:
        if inv.get("balance_due", 0) <= 0:
            continue
        due = inv.get("due_date", "")
        if not due:
            aging["current"] += inv.get("balance_due", 0)
            continue
        try:
            due_date = datetime.strptime(due, "%Y-%m-%d").date()
            days_overdue = (today - due_date).days
            if days_overdue <= 0:
                aging["current"] += inv.get("balance_due", 0)
            elif days_overdue <= 30:
                aging["1_30"] += inv.get("balance_due", 0)
            elif days_overdue <= 60:
                aging["31_60"] += inv.get("balance_due", 0)
            elif days_overdue <= 90:
                aging["61_90"] += inv.get("balance_due", 0)
            else:
                aging["over_90"] += inv.get("balance_due", 0)
        except Exception:
            aging["current"] += inv.get("balance_due", 0)

    return {
        "total_sales": total_sales,
        "total_collected": total_collected,
        "outstanding_receivables": outstanding_receivables,
        "total_payables": total_payables,
        "invoice_count": invoice_count,
        "customer_count": len(customers),
        "vendor_count": len(vendors),
        "bank_cash_balance": 45000,
        "inventory_value": 128500,
        "monthly_expense": 18200,
        "gross_profit": total_sales * 0.35,
        "net_profit": total_sales * 0.18,
        "top_customers": [{"name": c.get("name", ""), "balance": c.get("open_balance", 0)} for c in top_customers],
        "top_vendors": [{"name": v.get("name", ""), "balance": v.get("payable_balance", 0)} for v in top_vendors],
        "recent_invoices": recent_invoices[:10],
        "sales_trend": sales_trend[-12:],
        "aging": aging
    }

# ─── Seed Data Route ───

@api_router.post("/seed/{company_id}")
async def seed_data(company_id: str):
    existing_customers = await db.customers.count_documents({"company_id": company_id})
    if existing_customers > 0:
        return {"message": "Data already seeded", "company_id": company_id}

    sample_customers = [
        {"name": "Atlantic Seafood Markets", "company_name": "Atlantic Seafood Markets LLC", "phone": "(718) 555-0142", "email": "orders@atlanticseafood.com", "address": "145 Fish Market Way, Brooklyn, NY 11201"},
        {"name": "Golden Bay Restaurant Group", "company_name": "Golden Bay Restaurants Inc.", "phone": "(212) 555-0198", "email": "purchasing@goldenbay.com", "address": "89 Broadway, New York, NY 10006"},
        {"name": "Fresh Catch Supermarket", "company_name": "Fresh Catch Corp.", "phone": "(347) 555-0167", "email": "buyer@freshcatch.com", "address": "2200 Atlantic Ave, Queens, NY 11101"},
        {"name": "Bengal Grocery Wholesale", "company_name": "Bengal Grocery LLC", "phone": "(718) 555-0134", "email": "info@bengalgrocery.com", "address": "78-12 Roosevelt Ave, Jackson Heights, NY 11372"},
        {"name": "Oceanic Foods Distribution", "company_name": "Oceanic Foods Inc.", "phone": "(201) 555-0189", "email": "orders@oceanicfoods.com", "address": "500 Harbor Blvd, Jersey City, NJ 07302"},
        {"name": "Spice Route Markets", "company_name": "Spice Route LLC", "phone": "(646) 555-0156", "email": "buy@spiceroute.com", "address": "34 Curry Hill, Manhattan, NY 10016"},
    ]
    for i, c in enumerate(sample_customers):
        ob = [3200, 0, 8500, 1200, 0, 4800][i]
        ti = [28500, 15200, 42000, 18700, 9800, 31500][i]
        await db.customers.insert_one({
            "customer_id": f"cust_{uuid.uuid4().hex[:10]}",
            "company_id": company_id,
            **c,
            "tax_id": "",
            "notes": "",
            "open_balance": ob,
            "total_invoiced": ti,
            "last_invoice_date": "2026-01-15",
            "status": "Active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system"
        })

    sample_vendors = [
        {"name": "Pacific Ocean Fisheries", "company_name": "Pacific Ocean Fisheries Ltd.", "phone": "(310) 555-0123", "email": "sales@pacificocean.com", "address": "1200 Harbor Dr, Long Beach, CA 90802"},
        {"name": "Dhaka Cold Storage", "company_name": "Dhaka Cold Storage Pvt.", "phone": "+880-2-555-7890", "email": "export@dhakacold.com", "address": "12 Motijheel, Dhaka, Bangladesh"},
        {"name": "Northern Ice Logistics", "company_name": "Northern Ice LLC", "phone": "(617) 555-0145", "email": "dispatch@northernice.com", "address": "800 Cold Chain Blvd, Boston, MA 02210"},
        {"name": "Bay of Bengal Exports", "company_name": "Bay of Bengal Trading Co.", "phone": "+880-31-555-4567", "email": "info@bayofbengal.com", "address": "45 Port Rd, Chittagong, Bangladesh"},
        {"name": "FrostPak Packaging", "company_name": "FrostPak Inc.", "phone": "(973) 555-0178", "email": "orders@frostpak.com", "address": "300 Industrial Park, Newark, NJ 07101"},
    ]
    for i, v in enumerate(sample_vendors):
        pb = [12500, 28000, 4500, 18200, 2100][i]
        tb = [85000, 142000, 32000, 96000, 15000][i]
        bc = [12, 24, 8, 18, 5][i]
        await db.vendors.insert_one({
            "vendor_id": f"vnd_{uuid.uuid4().hex[:10]}",
            "company_id": company_id,
            **v,
            "tax_id": "",
            "default_expense_account": "",
            "notes": "",
            "payable_balance": pb,
            "total_billed": tb,
            "bill_count": bc,
            "status": "Active",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system"
        })

    # Seed some invoices
    custs = await db.customers.find({"company_id": company_id}, {"_id": 0}).to_list(10)
    sample_products = [
        ("Hilsha Fish (Frozen)", "Premium grade Hilsha, 1kg packs", 18.50, "kg"),
        ("Tiger Shrimp (16/20)", "Headless shell-on, IQF", 14.25, "lb"),
        ("Pangasius Fillet", "Boneless skinless fillet, 5kg box", 4.80, "kg"),
        ("Catla Fish (Whole)", "Whole cleaned, 2-3 lb size", 6.50, "lb"),
        ("Bombay Duck (Dried)", "Sun-dried, premium quality", 12.00, "kg"),
        ("Rui Fish (Rohu)", "Whole cleaned, 3-4 lb", 5.75, "lb"),
    ]
    statuses = ["Paid", "Sent", "Sent", "Paid", "Draft", "Overdue", "Paid", "Partial Paid"]
    for idx in range(min(8, len(custs) * 2)):
        cust = custs[idx % len(custs)]
        prods = sample_products[idx % len(sample_products)]
        qty = [50, 100, 200, 75, 30, 150, 80, 120][idx]
        total = round(prods[2] * qty, 2)
        st = statuses[idx % len(statuses)]
        paid = total if st == "Paid" else (total * 0.5 if st == "Partial Paid" else 0)
        ps = "Paid" if st == "Paid" else ("Partial" if st == "Partial Paid" else "Unpaid")
        inv_date = f"2026-0{1 + (idx % 2)}-{10 + idx}"
        due_date = f"2026-0{2 + (idx % 2)}-{10 + idx}"
        inv = {
            "invoice_id": f"inv_{uuid.uuid4().hex[:10]}",
            "company_id": company_id,
            "invoice_number": f"INV-{str(1001 + idx).zfill(5)}",
            "customer_id": cust["customer_id"],
            "customer_name": cust["name"],
            "invoice_date": inv_date,
            "due_date": due_date,
            "sales_rep": ["Ahmed Khan", "Sarah Chen", "Rafiq Islam"][idx % 3],
            "warehouse": ["Main Warehouse", "Cold Storage A", "Distribution Center"][idx % 3],
            "items": [{
                "product": prods[0], "description": prods[1],
                "quantity": qty, "unit": prods[3], "rate": prods[2],
                "discount": 0, "tax": round(total * 0.08, 2),
                "amount": total
            }],
            "notes": "", "terms": "Net 30",
            "subtotal": total, "tax_total": round(total * 0.08, 2),
            "discount_total": 0, "total": round(total * 1.08, 2),
            "status": st, "payment_status": ps,
            "amount_paid": round(paid * 1.08, 2),
            "balance_due": round((total - paid) * 1.08, 2),
            "payments": [],
            "created_at": datetime.now(timezone.utc).isoformat(),
            "created_by": "system"
        }
        await db.invoices.insert_one(inv)

    return {"message": "Seed data created", "company_id": company_id}

# ─── Root ───

@api_router.get("/")
async def root():
    return {"message": "Hishab Nikash Pro API"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
