import '../index.css'
import useUserStore from '../../store/user';
export default function Left() {
    console.log('A组件渲染')
    // 只订阅真正用到的部分
    const name = useUserStore(state => state.name);
    const age = useUserStore(state => state.age);
    const sing = useUserStore(state => state.hobby.sing);
    const dance = useUserStore(state => state.hobby.dance);
    const rap = useUserStore(state => state.hobby.rap);
    const basketball = useUserStore(state => state.hobby.basketball);
    // const setHobbyRap = useUserStore(state => state.setHobbyRap);
    // const setHobbyBasketball = useUserStore(state => state.setHobbyBasketball);

    // 直接从 store 取 action，不订阅！
    const { setHobbyRap, setHobbyBasketball, addAge } = useUserStore();


    return (
        <div className="left">
            <h1>A组件</h1>
            <div>
                <h3>{name}</h3>
                <div>年龄：<span style={{color: "red"}}>{age}</span></div>
                <div>爱好1：<span>{sing}</span></div>
                <div>爱好2：<span>{dance}</span></div>
                <div>爱好3：<span>{rap}</span></div>
                <div>爱好4：<span>{basketball}</span></div>
                <button onClick={() => setHobbyRap('只因你太美')}>改变爱好rap</button>
                <button onClick={() => setHobbyBasketball('篮球')}>改变爱好basketball</button>
                <button onClick={() => addAge()}>增加年龄</button>
            </div>
        </div>
    )
}

