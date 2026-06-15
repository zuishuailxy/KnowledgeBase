from passlib.context import CryptContext

# 创建密码上下文：定义支持的算法列表，首选 argon2
pwd_context = CryptContext(
    schemes=["argon2", "bcrypt", "pbkdf2_sha256"],
    default="argon2",  # 新注册的密码默认使用 argon2
    deprecated="auto",  # 自动将非默认算法标记为过时
)


def hash_password(password: str) -> str:
    """哈希密码"""
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(password, hashed_password)
