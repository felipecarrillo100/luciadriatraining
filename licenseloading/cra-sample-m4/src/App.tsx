import React from 'react'
import './App.css'
import {LuciadMap} from "./components/LuciadMap/LuciadMap";

const App: React.FC = () => {
  return (
      <>
        <div className="MainApp">
          <LuciadMap />
        </div>
      </>
  )
}

export default App
