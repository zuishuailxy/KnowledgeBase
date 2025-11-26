import { defineComponent, computed } from 'vue'

export default defineComponent({
  props: {
    modelValue: String,
    placeholder: String,
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const handleInput = (e: InputEvent) => {
      const value = (e.target as HTMLInputElement).value
      emit('update:modelValue', value)
    }

    return () => (
      <>
        <p>{props.modelValue}</p>
        <input
          name="input"
          value={props.modelValue}
          placeholder={props.placeholder}
          onInput={handleInput}
        />
      </>
    )
  },
})
