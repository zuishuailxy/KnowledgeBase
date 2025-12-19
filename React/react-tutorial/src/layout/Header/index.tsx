import { Breadcrumb } from "antd";

const Header = () => {
  const items = [
    {
      title: "Home",
    },
    {
      title: "List",
    },
    {
      title: "App",
    },
  ];

  return <Breadcrumb items={items}></Breadcrumb>;
};

export default Header;
