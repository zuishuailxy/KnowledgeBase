import { Layout as AntdLayout } from "antd";
import Menu from "./Menu";
import Header from "./Header";
import Content from "./Content";

const Layout = () => {
  return ( <AntdLayout>
    <AntdLayout.Sider>
      <Menu />
    </AntdLayout.Sider>
    <AntdLayout>
        <Header />
      <AntdLayout.Content style={{padding: '16px'}}>
        <Content />
      </AntdLayout.Content>
    </AntdLayout>
  </AntdLayout>  );
}
export default Layout;