import React from "react";
import { useState } from "react";

interface User {
  name: string;
  age: number;
  phone: string;
}

export default function MemoC() {
  const [user, setUser] = useState({
    name: "Alice",
    age: 25,
    phone: "123-456-7890",
  });
  const [val, setVal] = useState("")

  return (
    <div>
      <label htmlFor="">input:</label>
      <input type="text" value={val} onChange={e => setVal(e.target.value)}/>
      <UserCard user={user} />
    </div>
  );
}

const UserCard = React.memo((props: { user: User }) => {
  console.log("render child");
  
  const { user } = props;
  const style = {
    border: "1px solid black",
    padding: "10px",
    margin: "10px",
  };
  return (
    <div style={style}>
      <p>{user.name}</p>
      <p>{user.age}</p>
      <p>{user.phone}</p>
    </div>
  );
});
