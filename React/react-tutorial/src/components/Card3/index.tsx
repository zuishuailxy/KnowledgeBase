import "./index.css";
import { use } from "react";

interface DataType {
  name: string;
  age: number;
  address: string;
  avatar: string;
}

const getData = async () => {
  const res = await fetch("/data.json");
  const json = await res.json();
  return json.data as DataType;
};

const dataPromise = getData();

const Card3 = () => {
  const data = use(dataPromise);
  return (
    <>
      <div className="card">
        <header className="card-header">
          <div className="card-name">{data.name}</div>
          <div className="card-age">{data.age}</div>
        </header>
        <section className="card-content">
          <div className="card-address">{data.address}</div>
          <div className="card-avatar">
            <img width={50} height={50} src={data.avatar} alt="" />
          </div>
        </section>
      </div>
    </>
  );
};

export default Card3;
