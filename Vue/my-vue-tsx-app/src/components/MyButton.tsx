import { defineComponent } from 'vue'
import type { PropType } from 'vue'

interface ButtonProps {
  type?: 'primary' | 'default'
  disabled?: boolean
}

export default defineComponent({
  props: {
    type: {
      type: String as PropType<ButtonProps['type']>,
      default: 'default',
    },
    disabled: Boolean,
  },
  emits: ['click'],

  setup(props, { emit }) {
    const handleClick = (e: MouseEvent) => {
      if (!props.disabled) {
        emit('click', e)
      }
    }

    return () => (
      <button class={`btn btn-${props.type}`} disabled={props.disabled} onClick={handleClick}>
        Click me
      </button>
    )
  },
})
