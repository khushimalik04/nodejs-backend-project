import random
import string
from datetime import datetime, timedelta, timezone
import uuid


IST = timezone(timedelta(hours=5, minutes=30))

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def create_otp_record(user_id, otp_type="email_verification"):
    code = generate_otp()
    otp_id = str(uuid.uuid4())
    now_ist = datetime.now(IST)
    expires_at = now_ist + timedelta(minutes=10)
    created_at = now_ist

    return {
        "id": otp_id,
        "user_id": user_id,
        "code": code,
        "type": otp_type,
        "expires_at": expires_at,
        "created_at": created_at
    }
