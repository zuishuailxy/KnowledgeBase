import { useEffect } from "react";

const trackService = {
  sendEvent: <T,>(trackType: string, data: T = null as T) => {
    const eventData = {
      timestamp: Date.now(), // 时间戳
      trackType, // 事件类型
      data, // 事件数据
      userAgent: navigator.userAgent, // 用户代理
      url: window.location.href, // 当前URL
    };

    // 发送数据
    navigator.sendBeacon("/track", JSON.stringify(eventData));
  },
};

const withTrack = (Component: React.ComponentType<any>, trackType: string) => {
  return (props: any) => {
    useEffect(() => {
      //发送数据 组件挂载
      trackService.sendEvent(`${trackType}-MOUNT`);

      return () => {
        //发送数据 组件卸载
        trackService.sendEvent(`${trackType}-UNMOUNT`);
      };
    }, []);

    // 处理事件
    const trackEvent = (eventType: string, data: any) => {
      trackService.sendEvent(`${trackType}-${eventType}`, data);
    };

    return <Component {...props} trackEvent={trackEvent} />;
  };
};

const Button = ({ trackEvent }) => {
  // 点击事件
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    trackEvent(e.type, {
      name: e.type,
      type: e.type,
      clientX: e.clientX,
      clientY: e.clientY,
    });
  };
  return <button onClick={handleClick}>点击我</button>;
};
// 使用·HOC包装Button组件
const TrackButton = withTrack(Button, "Button");

// 使用组件
export { TrackButton };
