import { useEffect, useState } from 'react'
import { NostrProfile } from './NostrProfile';
import { AdminDb } from './AdminDb';
import './App.css'


function App() {
  const [message, setMessage] = useState('Welcome')
  const [hostUserData, setHostUserData] = useState(null);
  const [nostrProfile, setNostrProfile] = useState(null); 
 
  const messages = [
    'Welcome',
    'Loged Out',
    'Loged In',
    'Register',
  ]

 function handleLogout() {
    setMessage(messages[1])
    setNostrProfile(null)
    setHostUserData(null)
    //Remove JWT from local storage
 };

 function handleLogin() {
    setMessage(messages[2])
    //JWT
 };

 
 

  return (
    <div>
      <p>{message}</p>
      <NostrProfile 
        nostrProfile={nostrProfile} 
        setNostrProfile={setNostrProfile}
      />
      <button onClick={handleLogout} className="secondary-button logout-button">
        Logout
      </button>

      <p>Protected routes</p>
      <AdminDb 
        setMessage={setMessage}  
      />
    </div>
    
  )
}

export default App
