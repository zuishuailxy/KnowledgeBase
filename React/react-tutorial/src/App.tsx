import { useState, useReducer } from "react";
import "./App.css";

const initData = [
  { name: "小满(只)", price: 100, count: 1, id: 1, isEdit: false },
  { name: "中满(只)", price: 200, count: 1, id: 2, isEdit: false },
  { name: "大满(只)", price: 300, count: 1, id: 3, isEdit: false },
];

type Data = typeof initData;
// 处理函数
const reducer = (
  state: Data,
  action: { type: "increment" | "decrement" | "edit" | "delete" | "update_name"  ; id: number, newName?: string }
) => {
  const item = state.find((item) => item.id === action.id)!;
  switch (action.type) {
    case "increment":
      item.count++;
      return [...state];
    case "decrement":
      item.count--;
      return [...state];
    case "delete":
      return state.filter((item) => item.id !== action.id);
    case "edit":
      item.isEdit = !item.isEdit;
      return [...state];
    case "update_name":
      item.name = action.newName!;
      return [...state];
    default:
      return state;
  }
};

function App() {
  const [data, dispatch] = useReducer(reducer, initData);
  return (
    <>
      <h1>购物车</h1>
      <table cellPadding={0} cellSpacing={0} border={1} width="800">
        <thead>
          <tr>
            <th>商品名称</th>
            <th>单价</th>
            <th>数量</th>
            <th>总价</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id}>
              <td align="center">
                {item.isEdit ? (
                  <input onBlur={() => dispatch({ type: "edit", id: item.id })} onChange={(e)=>dispatch({
                    type:"update_name",
                    id: item.id,
                    newName: e.target.value
                  })} type="text" value={item.name} />
                ) : (
                  item.name
                )}
              </td>
              <td align="center">{item.price}</td>
              <td align="center">
                <button
                  onClick={() => dispatch({ type: "increment", id: item.id })}
                >
                  +
                </button>
                {item.count}
                <button
                  onClick={() => dispatch({ type: "decrement", id: item.id })}
                >
                  -
                </button>
              </td>

              <td align="center">{item.price * item.count}</td>
              <td align="center">
                <button onClick={() => dispatch({ type: "edit", id: item.id })}>
                  edit
                </button>
                <button
                  onClick={() => dispatch({ type: "delete", id: item.id })}
                >
                  delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}></td>
            <td align="right">
              总价:{" "}
              {data.reduce((total, item) => total + item.price * item.count, 0)}
            </td>
          </tr>
        </tfoot>
      </table>
    </>
  );
}

export default App;
