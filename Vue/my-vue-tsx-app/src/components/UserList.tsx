import { defineComponent, ref, computed, h, Fragment, type PropType } from 'vue'

interface User {
  name: string
  age: number
  active: boolean
  id: number
}

// 模拟数据
export const mockUsers: User[] = [
  { id: 1, name: '张三', age: 25, active: true },
  { id: 2, name: '李四', age: 30, active: false },
  { id: 3, name: '王五', age: 28, active: true },
  { id: 4, name: '赵六', age: 32, active: true },
  { id: 5, name: '孙七', age: 26, active: false },
]

export default defineComponent({
  props: {
    users: Array as PropType<User[]>,
  },
  emits: ['select'],
  setup(props, { emit }) {
    const selectedId = ref(0)
    const filteredUsers = computed(() => (props.users || mockUsers).filter((u) => u.active))

    const renderUser = (user: User) => (
      <div
        key={user.id}
        class={{ 'user-item': true, selected: selectedId.value === user.id }}
        onClick={() => {selectedId.value = user.id; emit('select', user)}}
      >
        {user.name} - {user.age}
      </div>
    )

    return () => (
      <Fragment>
        <h2>Active Users ({filteredUsers.value.length})</h2>
        {filteredUsers.value.map(renderUser)}
      </Fragment>
    )
  },
})
