import react from "react"
import {createRoot} from 'react-dom/client'

const App = () => {
  return <div>Hello, React!</div>
}

createRoot(document.getElementById('root')).render(<App />)