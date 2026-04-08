import requests
from typing import Dict, Any
import asyncio
import httpx
import time


# 同步请求
def fetch_data(post_id: int) -> Dict[str, Any]:
    url = f"https://jsonplaceholder.typicode.com/posts/{post_id}"

    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()  # 检查请求是否成功
        data = response.json()
        print(f"成功获取数据: {data}")
        return data

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP 错误发生: {http_err}")
    except Exception as err:
        print(f"其他错误发生: {err}")

    return {}


def create_post():
    url = "https://jsonplaceholder.typicode.com/posts"
    payload = {"title": "foo", "body": "bar", "userId": 1}
    try:
        response = requests.post(url, json=payload, timeout=5)
        response.raise_for_status()
        data = response.json()
        print(f"成功创建帖子: {data}")
        return data
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP 错误发生: {http_err}")
    except Exception as err:
        print(f"其他错误发生: {err}")
    return {}


def search_with_params(user_id: int = 1):
    url = "https://jsonplaceholder.typicode.com/comments"
    query_params = {"postId": user_id}
    # 模拟浏览器或传递 Token
    custom_headers = {
        "User-Agent": "MyPythonApp/1.0",
        "Authorization": "Bearer YOUR_TOKEN_HERE",
    }

    try:
        response = requests.get(
            url, params=query_params, headers=custom_headers, timeout=5
        )
        response.raise_for_status()
        data = response.json()
        print(f"实际请求地址: {response.url}")
        print(f"成功获取评论: {data}")
        return data
    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP 错误发生: {http_err}")
    except Exception as err:
        print(f"其他错误发生: {err}")
    return {}


# post = fetch_data(1)
# print(f"Post ID: {post.get('id')}, Title: {post.get('title')}")

# new_post = create_post()
# print(f"新帖子 ID: {new_post.get('id')}, Title: {new_post.get('title')}")

# comments = search_with_params(user_id=2)
# print(f"获取到 {len(comments)} 条评论")

# 限制最多同时有 10 个请求在路上
semaphore = asyncio.Semaphore(10)


async def async_fetch_data(client: httpx.AsyncClient, post_id: int) -> Dict[str, Any]:
    url = f"https://jsonplaceholder.typicode.com/posts/{post_id}"

    # 使用 await 挂起当前任务，等待网络响应
    async with semaphore:
        response = await client.get(url)
        response.raise_for_status()
        data = response.json()
        print(f"成功获取数据: {data}")
        return data


async def main_async():
    start_time = time.time()
    async with httpx.AsyncClient(timeout=5) as client:
        # 1. 准备 50 个请求任务（此时还未执行）
        tasks = [async_fetch_data(client, post_id) for post_id in range(1, 51)]

        # 2. 一次性并发执行所有任务！
        print(f"🚀 开始并发请求 {len(tasks)} 个 API...")
        results = await asyncio.gather(*tasks)
    end_time = time.time()
    print(f"🎉 成功获取 {len(results)} 条数据！")
    print(f"⏱️ 总耗时: {end_time - start_time:.2f} 秒")
    # 如果是同步 requests，至少需要几秒到十几秒，而这里可能只需要 0.x 秒！


if __name__ == "__main__":
    # 同步请求示例
    # post = fetch_data(1)
    # print(f"Post ID: {post.get('id')}, Title: {post.get('title')}")

    # new_post = create_post()
    # print(f"新帖子 ID: {new_post.get('id')}, Title: {new_post.get('title')}")

    # comments = search_with_params(user_id=2)
    # print(f"获取到 {len(comments)} 条评论")

    # 异步请求示例
    asyncio.run(main_async())
