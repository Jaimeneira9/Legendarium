import imaplib
import email
import asyncio
import re
from datetime import datetime
from app.routers.finance import process_text_and_save
from app.dependencies import get_supabase
from app.config import get_settings

def sync_gmail_fetch_only():
    """
    Solo se encarga de la parte bloqueante de RED (IMAP).
    Devuelve los cuerpos de los mensajes encontrados.
    """
    settings = get_settings()
    if not settings.gmail_user or not settings.gmail_app_password:
        return []

    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(settings.gmail_user, settings.gmail_app_password)
        mail.select("inbox")

        today = datetime.now().strftime("%d-%b-%Y")
        sender_filter = settings.bank_notification_email or "no-reply@yourbank.com"
        search_query = f'(UNSEEN FROM "{sender_filter}" SINCE {today})'
        
        status, messages = mail.search(None, search_query)
        bodies = []

        if status == "OK":
            for num in messages[0].split():
                _, msg_data = mail.fetch(num, '(RFC822)')
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    charset = part.get_content_charset() or "utf-8"
                                    try:
                                        body = part.get_payload(decode=True).decode(charset)
                                    except:
                                        body = part.get_payload(decode=True).decode('latin-1', errors='ignore')
                                    break
                        else:
                            charset = msg.get_content_charset() or "utf-8"
                            try:
                                body = msg.get_payload(decode=True).decode(charset)
                            except:
                                body = msg.get_payload(decode=True).decode('latin-1', errors='ignore')

                        if body:
                            bodies.append(body)
                            # Marcar como leído
                            mail.store(num, '+FLAGS', '\\Seen')

        mail.logout()
        return bodies
    except Exception as e:
        print(f"GMAIL FETCH ERROR: {e}")
        return []

async def scan_gmail_forever():
    """
    Loop asíncrono que delega solo la RED a un hilo y procesa el texto de forma asíncrona.
    """
    settings = get_settings()
    if not settings.gmail_user or not settings.gmail_app_password:
        return

    print("GMAIL: Escáner asíncrono mejorado iniciado.")
    
    # Obtenemos el user_id buscando por el email del propietario
    supabase = get_supabase(settings)
    if not settings.owner_email:
        print("GMAIL ERROR: OWNER_EMAIL no configurado en .env. El scanner no sabe a quién asignar los gastos.")
        return

    # El email está en Supabase Auth, no en profiles
    auth_res = supabase.auth.admin.list_users()
    user = next((u for u in auth_res if u.email == settings.owner_email), None)
    if not user:
        print(f"GMAIL ERROR: No se encontró usuario para {settings.owner_email}")
        return

    user_id = user.id

    while True:
        try:
            # 1. Buscamos emails nuevos (Operación de RED bloqueante -> hilo)
            new_emails = await asyncio.to_thread(sync_gmail_fetch_only)
            
            # 2. Procesamos cada email con la lógica mejorada de finance.py
            if new_emails:
                for body in new_emails:
                    print(f"GMAIL: Nuevo email de Unicaja detectado. Procesando...")
                    await process_text_and_save(body, user_id, supabase)
        except Exception as e:
            print(f"GMAIL LOOP ERROR: {e}")
        
        await asyncio.sleep(60)
