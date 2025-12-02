import ReactDom from "react-dom/client";
import type { Root } from "react-dom/client";
import "./index.css";

const Message = () => {
  return <div>提示组件</div>;
};
interface IQueueItem {
  messageContainer: HTMLDivElement;
  root: Root;
}

const queue: IQueueItem[] = [];

window.onShow = () => {
  const messageContainer = document.createElement("div");
  messageContainer.className = "message";
  messageContainer.style.top = `${queue.length * 60 + 20}px`;
  document.body.appendChild(messageContainer);
  // 把容器注册成根组件
  const root = ReactDom.createRoot(messageContainer);
  root.render(<Message />);
  queue.push({ messageContainer, root });

  // 3秒后自动关闭
  setTimeout(() => {
    const item = queue.find(
      (item) => item.messageContainer === messageContainer
    )!;
    item.root.unmount();
    document.body.removeChild(item.messageContainer);
    const index = queue.indexOf(item);
    if (index > -1) {
      queue.splice(index, 1);
    }
  }, 3000);
};
//声明扩充
declare global {
  interface Window {
    onShow: () => void;
  }
}
export default Message;
