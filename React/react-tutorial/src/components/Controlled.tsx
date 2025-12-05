import { useState, useRef } from "react";

const ControlledC = () => {
  const [value, setValue] = useState("");

  // use ref
  const inputRef = useRef<HTMLInputElement>(null);
  let refValue = "leo";
  const handleRefClick = () => {
    console.log(inputRef.current?.value);
  }

  return (
    <>
      <div>
        <label htmlFor="controlled-input">{value}</label>
        <input
          id="controlled-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />

        <input type="text" ref={inputRef} defaultValue={refValue} onChange={handleRefClick}/>
      </div>
    </>
  );
};

export default ControlledC;
