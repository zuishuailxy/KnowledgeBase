from typing import Any, Dict, List, Optional

from config.cache_config import get_json_cache, set_cache

NEWS_CATEGORIES_KEY = "news:categories"
NEW_LIST_PREFIX_KEY = "news:list"


async def get_cached_categories():
    return await get_json_cache(NEWS_CATEGORIES_KEY)


# 写缓存
async def set_cached_categories(data: List[Dict[str, Any]], expire=3600):
    return await set_cache(NEWS_CATEGORIES_KEY, data, expire=expire)


async def set_cached_news_list(
    category_id: Optional[int],
    page: int,
    page_size: int,
    news_list: List[Dict[str, Any]],
    expire=1800,
):
    category_part = category_id or "all"
    key = f"{NEW_LIST_PREFIX_KEY}:{category_part}:{page}:{page_size}"
    return await set_cache(key, news_list, expire)


async def get_cached_news_list(
    category_id: Optional[int], page: int, page_size: int
) -> Optional[List[Dict[str, Any]]]:
    category_part = category_id or "all"
    key = f"{NEW_LIST_PREFIX_KEY}:{category_part}:{page}:{page_size}"
    return await get_json_cache(key)
