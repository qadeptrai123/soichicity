# app/services/email_service.py
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.core.config import settings

# Cấu hình kết nối
conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,           # Bắt buộc cho Gmail
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_reset_password_email(email_to: str, token: str):
    """
    Gửi email chứa link reset password
    """
    # Tạo link (Giả sử Frontend chạy ở localhost:3000)
    reset_link = f"http://localhost:3000/reset-password?token={token}"
    
    html = f"""
    <h3>Yêu cầu đặt lại mật khẩu</h3>
    <p>Xin chào,</p>
    <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản Soichi Threads.</p>
    <p>Vui lòng bấm vào link dưới đây để tiếp tục (Link hết hạn sau 15 phút):</p>
    <a href="{reset_link}" style="padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Đặt lại mật khẩu</a>
    <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    """

    message = MessageSchema(
        subject="[Soichi Threads] Hướng dẫn đặt lại mật khẩu",
        recipients=[email_to],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    return True