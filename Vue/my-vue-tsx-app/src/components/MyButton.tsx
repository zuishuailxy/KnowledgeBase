import { defineComponent } from 'vue'
import type { PropType } from 'vue'

interface ButtonProps {
  type?: 'primary' | 'default'
  disabled?: boolean
  onClick?: (e: MouseEvent) => void
}

export default defineComponent({
  props: {
    type: {
      type: String as PropType<ButtonProps['type']>,
      default: 'default',
    },
    disabled: Boolean,
    onClick: Function as PropType<ButtonProps['onClick']>,
  },

  setup(props, { emit }) {
    const handleClick = (e: MouseEvent) => {
      if (!props.disabled && props.onClick) {
        props.onClick(e)
      }
      emit('click', e)
    }

    return () => (
      <button class={`btn btn-${props.type}`} disabled={props.disabled} onClick={handleClick}>
        Click me
      </button>
    )
  },
})
