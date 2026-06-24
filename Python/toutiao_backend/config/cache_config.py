import json
from typing import Dict, List, Union

import redis.asyncio as aioredis

REDIS_HOST = "localhost"
REDIS_PORT = 6379
REDIS_DB = 0
# create a Redis object
# redis_pool = aioredis.ConnectionPool.from_url(
#     "redis://localhost:6379/0", decode_responses=True
# )

CacheableType = Union[str, int, float, bool, Dict, List]

redis_client = aioredis.Redis(
    host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True
)


async def get_cache(key: str):
    try:
        return await redis_client.get(key)
    except Exception as e:
        print(f"Error occurred while fetching cache for key {key}: {e}")
        return None


async def get_json_cache(key: str):
    try:
        value = await redis_client.get(key)
        if value is not None:
            return json.loads(value)
        return None
    except Exception as e:
        print(f"Error occurred while fetching JSON cache for key {key}: {e}")
        return None


async def set_cache(key: str, value: CacheableType, expire: int = 3600):
    try:
        if isinstance(value, (dict, list)):
            value = json.dumps(value, ensure_ascii=False)

        await redis_client.set(key, value, ex=expire)
        return True
    except (TypeError, ValueError) as e:  # 捕获序列化错误
        print(f"序列化失败 (key={key}): {e}")
        return False
    except Exception as e:  # 其他连接错误
        print(f"Redis 写入失败 (key={key}): {e}")
        return False
