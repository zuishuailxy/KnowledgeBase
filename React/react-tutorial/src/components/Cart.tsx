import { useReducer } from "react";
import { useImmerReducer } from "use-immer";

const initData = [
  { name: "小满(只)", price: 100, count: 1, id: 1, isEdit: false },
  { name: "中满(只)", price: 200, count: 1, id: 2, isEdit: false },
  { name: "大满(只)", price: 300, count: 1, id: 3, isEdit: false },
];

type Data = typeof initData;
// 处理函数
const reducer = (
  state: Data,
  action: {
    type: "increment" | "decrement" | "edit" | "delete" | "update_name";
    id: number;
    newName?: string;
  }
) => {
  const item = state.find((item) => item.id === action.id);
  switch (action.type) {
    case "increment":
      // return state.map((item) =>
      //   item.id === action.id ? { ...item, count: item.count + 1 } : item
      // );

      if (item) {
        item.count += 1;
      }
      break;
    case "decrement":
      return state.map((item) =>
        item.id === action.id
          ? { ...item, count: Math.max(1, item.count - 1) }
          : item
      );
    case "delete":
      return state.filter((item) => item.id !== action.id);
    case "edit":
      return state.map((item) =>
        item.id === action.id ? { ...item, isEdit: !item.isEdit } : item
      );
    case "update_name":
      return state.map((item) =>
        item.id === action.id ? { ...item, name: action.newName! } : item
      );
    default:
      return state;
  }
};

function CartItem({
  item,
  dispatch,
}: {
  item: (typeof initData)[number];
  dispatch: React.Dispatch<any>;
}) {
  return (
    <tr key={item.id}>
      <td align="center">
        {item.isEdit ? (
          <input
            onBlur={() => dispatch({ type: "edit", id: item.id })}
            onChange={(e) =>
              dispatch({
                type: "update_name",
                id: item.id,
                newName: e.target.value,
              })
            }
            type="text"
            value={item.name}
          />
        ) : (
          item.name
        )}
      </td>
      <td align="center">{item.price}</td>
      <td align="center">
        <button onClick={() => dispatch({ type: "increment", id: item.id })}>
          +
        </button>
        {item.count}
        <button onClick={() => dispatch({ type: "decrement", id: item.id })}>
          -
        </button>
      </td>
      <td align="center">{item.price * item.count}</td>
      <td align="center">
        <button onClick={() => dispatch({ type: "edit", id: item.id })}>
          edit
        </button>
        <button onClick={() => dispatch({ type: "delete", id: item.id })}>
          delete
        </button>
      </td>
    </tr>
  );
}

function Cart() {
  const [data, dispatch] = useImmerReducer(reducer, initData);
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
            <CartItem key={item.id} item={item} dispatch={dispatch} />
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

export default Cart;
