import { createContext, useState } from 'react';
import './App.css';
import UsePeer from './components/usePeer'
// import fetch from 'dva/fetch'

export const MyContext = createContext()

function App() {
  const urlParams = new URLSearchParams(window.location.search).get('userId')
  const toId = new URLSearchParams(window.location.search).get('toId')
  return (

    <div style={{ width: '100vw', height: '100vh' }}>
      <div>
        <UsePeer user={urlParams ? urlParams : 'th'} toId={toId} />
      </div>
    </div>
  );
}

export default App;
