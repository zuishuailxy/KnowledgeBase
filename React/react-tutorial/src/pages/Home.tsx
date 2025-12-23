import { NavLink } from "react-router";
import { Card, Form, Input, Button } from "antd";
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useActionData,
} from "react-router";

const Home = () => {
  const data = useLoaderData() as {
    data: { name: string; age: number }[];
    success: boolean;
  };
  const submit = useSubmit();
  const onFinish = (values: any) => {
    console.log("Form values:", values);
    submit(values, { method: "post", encType: "application/json" });
  };

  const navigation = useNavigation();
  const actionData = useActionData() as { success: boolean } | undefined;
  console.log("actionData", actionData);

  return (
    <Card>
      <h1>Welcome to the Home Page</h1>
      <Form onFinish={onFinish}>
        <Form.Item label="Username" name="username">
          <Input placeholder="Enter your username" />
        </Form.Item>
        <Form.Item label="Age" name="age">
          <Input placeholder="Enter your age" />
        </Form.Item>
        <Form.Item>
          <Button
            loading={navigation.state === "submitting"}
            type="primary"
            htmlType="submit"
          >
            Submit
          </Button>
        </Form.Item>
      </Form>
      <ul>
        {data.data.map((item) => (
          <li key={item.name}>
            {item.name}: {item.age}
          </li>
        ))}
      </ul>
    </Card>
  );
};

export default Home;
