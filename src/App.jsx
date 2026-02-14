import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import AuthCard from './Components/Auth'

function App() {
  const [count, setCount] = useState(0)

  return (
   <>
  <AuthCard/>
   </>
  )
}

export default App
