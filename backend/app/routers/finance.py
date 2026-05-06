from fastapi import APIRouter, Depends, HTTPException, status, Header
from supabase import Client
from typing import List, Optional
from uuid import UUID
import re
from datetime import datetime

from app.dependencies import get_supabase, get_current_user
from app.schemas.finance import TransactionCreate, TransactionSchema, TransactionUpdate, ParseRequest, CategorySchema, FinanceStats

router = APIRouter(prefix="/finance", tags=["finance"])

async def process_text_and_save(text: str, user_id: str, supabase: Client):
    """
    Lógica mejorada para Unicaja: Limpia HTML y busca patrones específicos.
    """
    # 1. Limpieza básica de HTML si existe
    clean_text = re.sub(r'<[^>]+>', ' ', text) # Quitar tags
    clean_text = re.sub(r'\s+', ' ', clean_text).strip() # Colapsar espacios
    
    amount = 0.0
    merchant = "Unicaja"
    is_income = False
    currency = "EUR"

    try:
        # 2. Buscar importe: Priorizar el número que va después de "importe de" o "cantidad de"
        # Así evitamos capturar el "Saldo" que suele ir al principio.
        amount_match = re.search(r"(?:importe|cantidad) de\s*(\d+(?:[.,]\d{2})?)\s*(?:EUR|€)", clean_text, re.IGNORECASE)
        
        # Si no lo encuentra con "importe de", buscamos cualquier EUR/€ (fallback)
        if not amount_match:
            amount_match = re.search(r"(\d+(?:[.,]\d{2})?)\s*(?:EUR|€)", clean_text)

        if amount_match:
            amount_str = amount_match.group(1).replace(",", ".")
            amount = float(amount_str)

        # 3. Determinar si es Ingreso o Gasto
        if any(word in clean_text.lower() for word in ["recibido", "ingreso", "nómina", "nomina", "abono", "abonado", "bizum de", "pensión", "pension", "ingresado", "ingresada"]):
            is_income = True
        elif any(word in clean_text.lower() for word in ["cargarse", "pago", "gasto", "transferencia enviada"]):
            is_income = False

        # 4. Buscar Comercio / Concepto
        # Unicaja: "en concepto de [CONCEPTO]. En breve podrás..."
        # Usamos ([^.]+) para leer todo HASTA el primer punto.
        concept_match = re.search(r"en concepto de\s+([^.]+)", clean_text, re.IGNORECASE)
        if concept_match:
            merchant = concept_match.group(1).strip()
            # Limpiar el prefijo bizum si es muy largo
            merchant = merchant.replace("bizum:sin concepto", "Bizum")
            merchant = merchant.replace("bizum:", "Bizum: ")
            
            # Si después de limpiar se queda vacío, ponemos Unicaja
            if not merchant:
                merchant = "Unicaja"
    except Exception as e:
        print(f"Error parsing Unicaja text: {e}")

    # ... rest of the logic for categories remains same ...

    # Categoría (Solo para gastos)
    category_id = None
    if not is_income:
        try:
            categories_res = supabase.table("finance_categories")\
                .select("*")\
                .or_(f"user_id.is.null,user_id.eq.{user_id}")\
                .execute()
            categories = categories_res.data or []
            
            # Buscamos la categoría adecuada usando los keywords de la DB
            for cat in categories:
                cat_keywords = cat.get("keywords", [])
                for kw in cat_keywords:
                    # Usar \b para límites de palabra
                    pattern = rf"\b{re.escape(kw.lower())}\b"
                    if re.search(pattern, clean_text.lower()):
                        category_id = cat["id"]
                        break
                if category_id:
                    break
        except Exception as e:
            print(f"Error fetching categories: {e}")

    # Idempotencia: no guardar si ya existe una transacción igual hoy (mismo importe + comercio)
    today_str = datetime.now().strftime("%Y-%m-%d")
    existing = supabase.table("finance_transactions")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("amount", amount)\
        .eq("merchant", merchant)\
        .gte("date", f"{today_str}T00:00:00")\
        .execute()

    if existing.data:
        print(f"Finance: Transacción duplicada omitida ({merchant} {amount}€)")
        return None

    # Guardar
    new_tx = {
        "user_id": user_id,
        "amount": amount,
        "currency": currency,
        "category_id": category_id,
        "merchant": merchant,
        "is_income": is_income,
        "raw_text": text,
        "date": datetime.now().isoformat()
    }
    return supabase.table("finance_transactions").insert(new_tx).execute()

@router.get("/categories", response_model=List[CategorySchema])
async def get_categories(
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    response = supabase.table("finance_categories")\
        .select("*")\
        .or_(f"user_id.is.null,user_id.eq.{current_user['id']}")\
        .execute()
    return response.data


@router.post("/parse")
async def parse_notification(
    request: ParseRequest,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]

    await process_text_and_save(request.text or "", user_id, supabase)
    return {"success": True, "message": "Procesado"}

@router.post("/transactions", response_model=TransactionSchema)
async def create_transaction(
    body: TransactionCreate,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    data = body.model_dump(mode='json')
    data["user_id"] = current_user["id"]
    
    res = supabase.table("finance_transactions").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Error al crear transacción")
        
    # Devolver con la categoría joineada
    full_res = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("id", res.data[0]["id"])\
        .execute()
        
    return full_res.data[0]

@router.get("/stats", response_model=FinanceStats)
async def get_finance_stats(
    year: Optional[int] = None,
    month: Optional[int] = None,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    # Obtener transacciones del mes solicitado o el actual
    now = datetime.now()
    y = year or now.year
    m = month or now.month
    
    first_day = datetime(y, m, 1).isoformat()
    if m == 12:
        last_day = datetime(y + 1, 1, 1).isoformat()
    else:
        last_day = datetime(y, m + 1, 1).isoformat()
    
    res = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("user_id", current_user["id"])\
        .gte("date", first_day)\
        .lt("date", last_day)\
        .execute()
    
    transactions = res.data or []
    
    total_spent = 0.0
    total_income = 0.0
    by_category_map = {} 
    daily_map = {} 
    
    for tx in transactions:
        amount = float(tx["amount"])
        is_income = tx["is_income"]
        
        if is_income:
            total_income += amount
        else:
            total_spent += amount
            cat_name = tx["category"]["name"] if tx.get("category") else "Otros"
            cat_color = tx["category"]["color"] if tx.get("category") else "#94a3b8"
            
            if cat_name not in by_category_map:
                by_category_map[cat_name] = {"name": cat_name, "amount": 0.0, "color": cat_color}
            by_category_map[cat_name]["amount"] += amount
            
            date_str = tx["date"][:10]
            daily_map[date_str] = daily_map.get(date_str, 0.0) + amount

    by_category = []
    for cat_name, data in by_category_map.items():
        percentage = (data["amount"] / total_spent * 100) if total_spent > 0 else 0
        by_category.append({
            "name": cat_name,
            "amount": round(data["amount"], 2),
            "color": data["color"],
            "percentage": round(percentage, 1)
        })
    
    daily_spending = [{"date": d, "amount": round(a, 2)} for d, a in sorted(daily_map.items())]

    insights = []
    balance = total_income - total_spent
    
    # Solo mostrar insights si es el mes actual
    if y == now.year and m == now.month:
        if balance > 0:
            insights.append(f"¡Buen trabajo! Este mes llevas un ahorro neto de {round(balance, 2)}€.")
        elif balance < 0:
            insights.append(f"Cuidado: Tus gastos superan a tus ingresos por {round(abs(balance), 2)}€.")
            
        ocio = by_category_map.get("Ocio", {"amount": 0})["amount"]
        if total_spent > 0 and ocio > total_spent * 0.4:
            insights.append("Punto Crítico: El Ocio representa más del 40% de tus gastos.")

    return FinanceStats(
        total_spent=round(total_spent, 2),
        total_income=round(total_income, 2),
        balance=round(balance, 2),
        by_category=sorted(by_category, key=lambda x: x["amount"], reverse=True),
        daily_spending=daily_spending,
        insights=insights
    )

@router.get("/transactions", response_model=List[TransactionSchema])
async def get_transactions(
    year: Optional[int] = None,
    month: Optional[int] = None,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    query = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("user_id", current_user["id"])

    if year and month:
        first_day = datetime(year, month, 1).isoformat()
        if month == 12:
            last_day = datetime(year + 1, 1, 1).isoformat()
        else:
            last_day = datetime(year, month + 1, 1).isoformat()
        query = query.gte("date", first_day).lt("date", last_day)

    response = query.order("date", desc=True).execute()
    return response.data

@router.patch("/transactions/{tx_id}", response_model=TransactionSchema)
async def update_transaction(
    tx_id: UUID,
    body: TransactionUpdate,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    data = body.model_dump(exclude_none=True, mode='json')
    if not data:
        raise HTTPException(status_code=400, detail="Nada que actualizar")
    
    res = supabase.table("finance_transactions")\
        .update(data)\
        .eq("id", str(tx_id))\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
        
    # Devolver con la categoría joineada
    full_res = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("id", str(tx_id))\
        .execute()
        
    return full_res.data[0]

@router.delete("/transactions/{tx_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    tx_id: UUID,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    res = supabase.table("finance_transactions")\
        .delete()\
        .eq("id", str(tx_id))\
        .eq("user_id", current_user["id"])\
        .execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Transacción no encontrada")
    return None

@router.get("/report/{year}/{month}")
async def get_monthly_report(
    year: int,
    month: int,
    supabase: Client = Depends(get_supabase),
    current_user: dict = Depends(get_current_user)
):
    # 1. Obtener datos del mes solicitado
    first_day = datetime(year, month, 1).isoformat()
    if month == 12:
        last_day = datetime(year + 1, 1, 1).isoformat()
    else:
        last_day = datetime(year, month + 1, 1).isoformat()

    res = supabase.table("finance_transactions")\
        .select("*, category:finance_categories(*)")\
        .eq("user_id", current_user["id"])\
        .gte("date", first_day)\
        .lt("date", last_day)\
        .execute()
    
    txs = res.data or []
    if not txs:
        return {"has_data": False, "message": "No hay transacciones para este periodo."}

    # 2. Cálculos
    total_spent = sum(float(t["amount"]) for t in txs if not t["is_income"])
    total_income = sum(float(t["amount"]) for t in txs if t["is_income"])
    balance = total_income - total_spent
    
    by_cat = {}
    daily = {}
    for t in txs:
        if not t["is_income"]:
            name = t["category"]["name"] if t.get("category") else "Otros"
            color = t["category"]["color"] if t.get("category") else "#94a3b8"
            if name not in by_cat:
                by_cat[name] = {"amount": 0.0, "color": color}
            by_cat[name]["amount"] += t["amount"]
            
            d = t["date"][:10]
            daily[d] = daily.get(d, 0) + t["amount"]

    # 3. Identificar puntos críticos
    top_cat = max(by_cat.items(), key=lambda x: x[1]["amount"]) if by_cat else ("Ninguna", {"amount": 0})
    max_day = max(daily.items(), key=lambda x: x[1]) if daily else ("-", 0)

    # 4. Generar Insights Estructurados
    insights = []
    if top_cat[1]["amount"] > total_spent * 0.4:
        insights.append({
            "type": "warning",
            "title": f"Exceso en {top_cat[0]}",
            "desc": f"Has dedicado el {round((top_cat[1]['amount']/total_spent)*100)}% de tu gasto aquí."
        })
    
    if balance < 0:
        insights.append({
            "type": "critical",
            "title": "Déficit Mensual",
            "desc": "Tus gastos han superado a tus ingresos. Toca revisar prioridades."
        })
    
    if balance > total_income * 0.2:
        insights.append({
            "type": "success",
            "title": "Maestro del Ahorro",
            "desc": "Has conseguido guardar más del 20% de lo ingresado. ¡Impresionante!"
        })

    return {
        "has_data": True,
        "period": datetime(year, month, 1).strftime('%B %Y'),
        "summary": {
            "income": round(total_income, 2),
            "spent": round(total_spent, 2),
            "balance": round(balance, 2)
        },
        "top_category": {
            "name": top_cat[0],
            "amount": round(top_cat[1]["amount"], 2),
            "percentage": round((top_cat[1]["amount"]/total_spent)*100, 1) if total_spent > 0 else 0
        },
        "critical_day": {
            "date": max_day[0],
            "amount": round(max_day[1], 2)
        },
        "insights": insights,
        "by_category": [
            {"name": k, "amount": round(v["amount"], 2), "color": v["color"]} 
            for k, v in sorted(by_cat.items(), key=lambda x: x[1]["amount"], reverse=True)
        ]
    }
