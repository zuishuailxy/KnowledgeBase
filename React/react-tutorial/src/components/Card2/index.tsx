import "./index.css";
import React from "react";

interface CardProps {
  title?: string; 
  children?: React.ReactNode;
  cb: (d: string) => void;
}

const defaultProps = {
  title: "leo",
  
}

const Card:React.FC<CardProps> = ({title = "leo", children, cb}) => {
  // --------------------
  // 兄弟之间通讯， 这边订阅
  window.addEventListener("on-Card", (e: any) => {
    console.log("Card2 接收到事件：", e.detail);
  });

  // --------------------
  
  return (
    <div className="card">
      <header>
        <div>{title}</div>
        <div>副标题</div>
      </header>
      <main>{children}</main>
      <footer>
        <button onClick={() => cb("按钮点击了")}>点击</button>
        <button onClick={() => window.onShow()}>确认</button>
        <button>取消</button>
      </footer>
    </div>
  );
};

export default Card;
