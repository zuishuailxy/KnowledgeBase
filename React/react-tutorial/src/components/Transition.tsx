import { useTransition, useState, use } from "react";
import { Input, List } from "antd";

interface Item {
  id: number;
  name: string;
  address: string;
}

export default function Transition() {
  const [val, setVal] = useState("");
  const [list, setList] = useState<Item[]>([]);
  const [isPending, startTransition] = useTransition();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setVal(newVal);

    const url = `/api/list?name=${newVal}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        // 提升性能，使用 startTransition 包裹
        startTransition(() => {
          setList(data.list);
        });
      });
  };

  return (
    <div>
      <Input value={val} onChange={handleChange} />
      {isPending && <div>Loading...</div>}
      <List
        bordered
        dataSource={list}
        renderItem={(item) => (
          <List.Item>
            <List.Item.Meta title={item.name} description={item.address} />
          </List.Item>
        )}
        style={{ marginTop: 16 }}
      />
    </div>
  );
}
