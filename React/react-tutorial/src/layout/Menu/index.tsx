import { Menu as AntdMenu } from "antd";
import { AppstoreOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd'
import { useNavigate } from "react-router";

const Menu = () => {
  const navigate = useNavigate();
  const handleClick: MenuProps['onClick'] = e => {
    navigate(e.key);
  }
  const menuItems = [
        {
            key: '/home',
            label: 'Home',
            icon: <AppstoreOutlined />,
        },
        {
            key: '/about',
            label: 'About',
            icon: <AppstoreOutlined />,
        },
    ];

  return (<AntdMenu style={{height: '100vh'}} onClick={handleClick} items={menuItems}></AntdMenu>);
}
 
export default Menu;
