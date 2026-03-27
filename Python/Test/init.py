from functools import wraps
from typing import Callable, Any, TypeVar, Self
import datetime

# --- 1. 自定义异常 ---
class InsufficientFundsError(Exception):
    """当余额不足以进行交易时抛出。"""
    pass

# --- 2. 装饰器：日志记录器 ---
# 使用类型标注定义泛型，保持函数签名不变
F = TypeVar('F', bound=Callable[..., Any])

def log_transaction(func: F) -> F:
    @wraps(func)
    def wrapper(self: Any, amount: float, *args: Any, **kwargs: Any) -> Any:
        now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{now}] 正在尝试执行操作: {func.__name__}，金额: {amount}")
        try:
            result = func(self, amount, *args, **kwargs)
            print(f"[{now}] 操作成功！当前余额: {self.balance}")
            return result
        except InsufficientFundsError as e:
            print(f"[{now}] 操作失败: {e}")
            raise  # 重新抛出异常供上层处理
    return wrapper  # type: ignore

# --- 3. 核心类 ---
class BankAccount:
    def __init__(self, owner: str, initial_balance: float = 0.0):
        self.owner: str = owner
        self._balance: float = initial_balance  # 私有属性倾向

    @property
    def balance(self) -> float:
        """只读属性：获取余额"""
        return self._balance

    @log_transaction
    def deposit(self, amount: float) -> float:
        """存款"""
        if amount <= 0:
            raise ValueError("存款金额必须大于零")
        self._balance += amount
        return self._balance

    @log_transaction
    def withdraw(self, amount: float) -> float:
        """取款"""
        if amount > self._balance:
            raise InsufficientFundsError(f"账户 {self.owner} 余额不足以支付 {amount}")
        self._balance -= amount
        return self._balance

    def __str__(self) -> str:
        return f"账户持有者: {self.owner}, 余额: {self.balance}"

# --- 4. 运行业务逻辑 ---
def main():
    # 实例化类
    account = BankAccount("张三", 1000.0)
    print(account)

    try:
        # 正常存款
        account.deposit(500.0)
        
        # 正常取款
        account.withdraw(200.0)
        
        # 触发异常：余额不足
        account.withdraw(2000.0)
        
    except InsufficientFundsError:
        print("系统提示：请提醒客户充值。")
    except Exception as e:
        print(f"发生未知错误: {e}")

if __name__ == "__main__":
    main()