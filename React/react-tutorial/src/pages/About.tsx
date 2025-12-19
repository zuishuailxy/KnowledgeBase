import { NavLink } from "react-router";
import { useSearchParams, useLocation, useParams } from "react-router";

const About = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  console.log(searchParams.get("id")); //获取id参数

  const {search } = useLocation();
  console.log(search);

  const { id } = useParams();
  console.log(id); //获取params参数
  

  return (
    <div>
      <NavLink to="/">Home</NavLink>
    </div>
  );
};

export default About;
