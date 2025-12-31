import { NavLink } from "react-router";
import { useSearchParams, useLocation, useParams, useNavigate } from "react-router";

const About = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  console.log(searchParams.get("id")); //获取id参数

  const {search } = useLocation();
  console.log(search);

  const { id } = useParams();
  console.log(id); //获取params参数

  const navigate = useNavigate();
  const goHome = () => {
    navigate("/home", { replace: true, state: { from: "about" } });
  };
  

  return (
    <div>
      <NavLink to="/home">Home</NavLink>
      <button onClick={goHome} style={{marginLeft:"1rem"}}>go home</button>
    </div>
  );
};

export default About;
