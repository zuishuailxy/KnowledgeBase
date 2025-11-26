import { defineComponent, Fragment } from 'vue'

export default defineComponent({
  props: {
    modelValue: String,
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleInput = (e: Event) => {
      const value = (e.target as HTMLInputElement).value
      emit('update:modelValue', value)
    }

    return () => (
      <Fragment>
        <p>{props.modelValue}</p>
        <input
          name="input"
          value={props.modelValue || ''}
          placeholder={props.placeholder}
          onInput={handleInput}
        />
      </Fragment>
    )
  },
})
