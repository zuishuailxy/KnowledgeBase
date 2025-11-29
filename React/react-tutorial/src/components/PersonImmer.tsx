import { useState } from "react";
import { useImmer } from "use-immer";

export default function PersonImmer() {
  const [person, setPerson] = useImmer([
    { name: "Alice", age: 25 },
    { name: "leo", age: 30 },
  ]);

  return (
    <div>
      {person.map((p, index) => {
        return (
          <div key={index}>
            <p>
              {p.name} - {p.age}
            </p>
          </div>
        );
      })}
      <button
        onClick={() => {
          setPerson((draft) => {
            draft[0].name = "Bob";
          });
        }}
      >
        change hobby name
      </button>
    </div>
  );
}
