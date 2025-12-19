import { NavLink } from "react-router";
import { useParams, useNavigate } from "react-router";


const Home = () => {
  const params = useParams();
  console.log(params);
  const navigate = useNavigate();
  // query 参数跳转
  // return <div><NavLink to="/about?id=123">About</NavLink></div>;


  // params 参数跳转
  return <div><NavLink to="/about/123">About</NavLink></div>;

  // return <div>
  //   Home Page
  //   <button onClick={() => navigate('/about/1')}>Go to About</button>
  // </div>;
};

export default Home;
