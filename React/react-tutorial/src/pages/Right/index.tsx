import "../index.css";
import useUserStore from "../../store/user";
import { useShallow } from "zustand/react/shallow";
import { useUserProfile } from "../../hooks/useUserProfile";
import { useEffect, useState } from "react";

export default function Right() {
  console.log("B组件渲染");
  // const { rap, name } = useUserStore(useShallow((state) => ({
  //     rap: state.hobby.rap,
  //     name: state.name
  // })))
  // const name = useUserStore((state) => state.name)
  // const rap = useUserStore((state) => state.hobby.rap)
  const { name, rap } = useUserProfile();
  const [status, setStatus] = useState("单身");
  useEffect(() => {
    useUserStore.subscribe(state=> state.age, (age, pre) => {
      console.log(age, pre);
      
      if (age >= 30) {
        setStatus("结婚");
      } else {
        setStatus("单身");
      }
    },
    {
      fireImmediately: true
    }
  
  )}, []);

  return (
    <div className="right">
      <h1>B组件</h1>
      <div>
        <div>
          姓名：<span>{name}</span>
        </div>
        <div>
          rap：<span>{rap}</span>
        </div>
        <div>
          状态：<span>{status}</span>
        </div>
      </div>
    </div>
  );
}
