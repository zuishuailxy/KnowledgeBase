//暴露给 host 项目去使用

const wrapper = document.createElement("div");
const list = [
  {
    name: "Magic young",
    age: 18,
  },
  {
    name: "Magic young2",
    age: 19,
  },
  {
    name: "Magic young3",
    age: 20,
  },
];

list.forEach((item) => {
  const p = document.createElement("p");
  p.innerHTML = `${item.name} - ${item.age} - 岁`;
  wrapper.appendChild(p);
});

export const addList = () => {
  document.body.appendChild(wrapper);
};
