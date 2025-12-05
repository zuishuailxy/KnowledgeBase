const Role = {
  ADMIN: "ADMIN",
  USER: "USER",
} as const;

type RoleType = keyof typeof Role;

const withAuthorization = (role: RoleType) => (Component: React.FC) => {
  const isAuthorized = (role: RoleType) => role === "ADMIN"; //假设只有管理员有权限

  return (props: any) => {
    // 判断是否具有权限
    if (isAuthorized(role)) {
      //把props透传给组件
      return <Component {...props} />;
    } else {
      // 没有权限则返回一个提示
      return <div>抱歉，您没有权限访问该页面</div>;
    }
  };
};

export const AdminPage = withAuthorization(Role.ADMIN)(() => {
  return <div>管理员页面</div>; //有权限输出
});

export const UserPage = withAuthorization(Role.USER)(() => {
  return <div>用户页面</div>; //没有权限不输出
});
