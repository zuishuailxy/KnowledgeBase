import { defineComponent, ref, h } from 'vue'

export default defineComponent({
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      default: 'Hello TSX!',
    },
  },

  setup(props) {
    const count = ref(0)
    return () => (
      <div>
        <h1>Hello {props.msg}</h1>
        <button onClick={() => count.value++}>Count: {count.value}</button>
      </div>
    )
  },
})
