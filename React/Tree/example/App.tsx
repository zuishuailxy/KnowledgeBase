import React from "react";
import { Tree, type TreeNode } from "../packages";

export default function App() {
  const data: TreeNode[] = [
    {
      id: "1",
      name: "parent-1",
      selected: false,
      children: [
        {
          id: "1-1",
          name: "child-1-1",
          selected: false,
          children: [{ id: "1-1-1", name: "child-1-1-1", selected: false }],
        },
      ],
    },
    {
      id: "2",
      name: "parent-2",
      selected: true,
      children: [
        {
          id: "2-1",
          name: "child-2-1",
          selected: true,
          children: [{ id: "2-1-1", name: "child-2-1-1", selected: true }],
        },
      ],
    },
  ];

  return <div>
        <Tree data={data} onChecked={(data: TreeNode) => {
            console.log(data)
        }}></Tree>
    </div>;
}
