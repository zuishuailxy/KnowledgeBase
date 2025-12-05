import style from './index.module.css';

const CButton = () => {
  return (
    <div>
      <button className={style.btn}>click me</button>
      <button className="w-20">hello </button>
    </div>
  );
}
 
export default CButton;