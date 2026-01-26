import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { subscribeWithSelector } from "zustand/middleware";


interface UserState {
  name: string;
  age: number;
  hobby: {
    sing: string;
    dance: string;
    rap: string;
    basketball: string;
  };
}

interface UserActions {
  setHobbyRap: (rap: string) => void;
  setHobbyBasketball: (basketball: string) => void;
  addAge: () => void;
}

type UserStore = UserState & UserActions;

// 中间件
const log = (config: any) => (set: any, get: any, api: any) => config((...args) => {
  console.log('before state', get(), api);
  set(...args);
  console.log('after state', get(), api);
}, get, api);

const useUserStore = create<UserStore>()(
  immer(
    log(
      subscribeWithSelector(
        (set) => ({
          name: "坤坤",
          age: 18,
          hobby: {
            sing: "坤式唱腔",
            dance: "坤式舞步",
            rap: "坤式rap",
            basketball: "坤式篮球",
          },
          setHobbyRap: (rap: string) =>
            set((state) => {
              state.hobby.rap = rap;
            }),
          setHobbyBasketball: (basketball: string) =>
            set((state) => {
              state.hobby.basketball = basketball;
            }),
          addAge: () =>
            set((state) => {
              state.age += 1;
            }),
        }))
    )
  )
);

export default useUserStore;
