import React from "react";
import { useState } from "react";
import type { TreeNode, TreeProps } from "./type";
import "./styles.css";

const Tree: React.FC<TreeProps> = ({ data, onChecked }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>(data);
  const changeSelected = (e: React.ChangeEvent<HTMLInputElement>, item: TreeNode) => {
    setTreeData(treeData.map(node => node.id === item.id ? { ...node, selected: e.target.checked } : node)); // 更新选中状态
    onChecked && onChecked({ ...item, selected: e.target.checked }); // 触发回调
  }

  return (
    <div>
      {treeData.map((item) => {
        return (
          <div key={item.id}>
            <input
              onChange={(e) => changeSelected(e, item)}
              type="checkbox"
              checked={item.selected}
            />
            <span>{item.name}</span>
            <div className="tree-node">
              {item.children && (
                <Tree data={item.children} onChecked={onChecked}></Tree>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default Tree;