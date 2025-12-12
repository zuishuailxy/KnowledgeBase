export interface TreeNode {
    id: string | number //id用于绑定key
    name: string //name用于显示
    children?: TreeNode[] //children用于存储子节点
    selected: boolean //selected用于存储节点是否选中
}

export interface TreeProps {
    data: TreeNode[] //数据源
    onChecked: (node: TreeNode) => void //选中回调
}
