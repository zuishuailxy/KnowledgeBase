import { Outlet, useNavigation } from "react-router";
import { Alert, Spin } from "antd";

const Content = () => {
  // 懒加载
  const navigation = useNavigation();

  const isLoading = navigation.state === "loading";
  return (
    <div>
      {isLoading ? (
        <Spin size="large" tip="loading...">
          <Alert description="please wait..." title="加载中" type="info" />
        </Spin>
      ) : (
        <Outlet />
      )}
    </div>
  );
};

export default Content;
