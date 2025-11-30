import { useDeferredValue, useState } from "react";
import { Input, List, Flex } from "antd";
import mockjs from "mockjs";

interface Item {
  id: number;
  name: number;
  address: string;
}

export default function DeferredValue() {
  const [val, setVal] = useState("");
  const [list, setList] = useState<Item[]>(() => {
    return mockjs.mock({
      "list|10000": [
        {
          "id|+1": 1,
          name: "@natural",
          address: "@county(true)",
        },
      ],
    }).list;
  });
  const deferredVal = useDeferredValue(val);
  const isSame = deferredVal === val;
  const findItem = () => {
    console.log(deferredVal, val);

    return list.filter((item) => item.name.toString().includes(deferredVal));
  };

  return (
    <div>
      <Input value={val} onChange={(e) => setVal(e.target.value)} />
      <List
        style={{ opacity: isSame ? 1 : 0.1, transition: "opacity 0.3s" }}
        bordered
        dataSource={findItem()}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta title={item.name} description={item.address} />
          </List.Item>
        )}
      />
    </div>
  );
}
