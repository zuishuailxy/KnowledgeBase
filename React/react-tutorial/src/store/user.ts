import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
interface UserState {
    name: string,
    age: number,
    hobby: {
        sing: string,
        dance: string,
        rap: string,
        basketball: string,
    }

}


interface UserActions {
    setHobbyRap: (rap: string) => void
    setHobbyBasketball: (basketball: string) => void
}

type UserStore = UserState & UserActions

const useUserStore = create<UserStore>()(immer((set) => ({
    name: '坤坤',
    age: 18,
    hobby: {
        sing: '坤式唱腔',
        dance: '坤式舞步',
        rap: '坤式rap',
        basketball: '坤式篮球'
    },
    setHobbyRap: (rap: string) =>set((state) => {
        state.hobby.rap = rap
    }),
    setHobbyBasketball: (basketball: string) => set((state) => {
        state.hobby.basketball = basketball
    })
})))

export default useUserStore;
