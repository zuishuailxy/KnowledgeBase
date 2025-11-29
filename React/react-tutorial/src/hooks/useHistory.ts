import { use, useSyncExternalStore } from "react";
// history api 实现
export const useHistory = () => {
  // TODO
  const subscribe = (callback: () => void) => {
    // 订阅浏览器 API
    window.addEventListener("popstate", callback);
    window.addEventListener("hashchange", callback);

    // 监听 history 变化
    return () => {
      window.removeEventListener("popstate", callback);
      window.removeEventListener("hashchange", callback);
    };
  };

  const getSnapshot = () => {
    return window.location.href;
  };

  // 当前页面的路径
  const url = useSyncExternalStore(subscribe, getSnapshot);

  // popstate 只能监听浏览器前进，后退按钮，不能监听 pushState,replaceState
  const push = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate")); // 手动触发事件，通知订阅者
  };

  const replace = (path: string) => {
    window.history.replaceState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate")); // 手动触发事件，通知订阅者
  };

  return [url, push, replace] as const; // as const 返回元组类型，每个元素的类型就固定下来了
};
