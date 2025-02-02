import React, { useEffect, useState } from 'react';
import { fetchProfile } from './nostr';
import { checkExistingUser } from './nostr';
const baseURL = import.meta.env.VITE_SERVER_URL;

const NostrRegistration = ({ onRegister, onLogin, onError, userData, setUserData, profile, setProfile }) => {
  const [step, setStep] = useState('verify');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    package: '',
    email: '',
    publicKey: ''
  });

  // Check if user already exists and handle login 
   const checkForUser = async (publicKey) => {
    try {
      console.log('check existing', publicKey)
      const result =  await checkExistingUser(publicKey)
      if (result === false) {
        setError('No matching accounts. Please register.')
        return false
      } else {

        const customer = await fetchProfile(publicKey);
        const updatedData = {
          publicKey,
          ...customer
        };
        setUserData(updatedData);        
        setError('Account found! Logging you in...');
        return true;
      }     
      
    } catch (error) {
      console.error('Error checking existing user:', error);
      return false;
    }
   };


  const verifyNostr = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!window.nostr) {
        throw new Error('Please install a Nostr extension');
      }

      const publicKey = await window.nostr.getPublicKey();
      
      // Check if user already exists
      const userExists = await checkExistingUser(publicKey);
      if (userExists) {
        setError('User exists in customer db')
      }

      const event = {
        kind: 27235,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'Hosting account registration verification',
        pubkey: publicKey
      };

      const signedEvent = await window.nostr.signEvent(event);
      console.log('signed event', signedEvent);

      setFormData(prev => ({ ...prev, publicKey }));
      setStep('details');

    } catch (error) {
      setError(error.message);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const event = {
        kind: 27235,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ['package', formData.package],
          ['email', formData.email]
        ],
        content: 'Hosting account registration',
        pubkey: formData.publicKey
      };

      const signedEvent = await window.nostr.signEvent(event);

      const response = await fetch(`${baseURL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          signedEvent,
          formData
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.error?.includes('already exists')) {
          // Handle existing user
          const userExists = await checkExistingUser(formData.publicKey);
          if (userExists) return;
        }
        throw new Error(result.error || 'Registration failed');
      }

      onRegister(result);
      setStep('confirm');

    } catch (error) {
      setError(error.message);
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="registration-form">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {step === 'verify' && (
        <div className="verify-step">
          <h2>Verify your Nostr identity</h2>
          <p>First, let's connect your Nostr identity to your new hosting account.</p>
          <button 
            onClick={verifyNostr}
            disabled={loading}
            className="nostr-button"
          >
            {loading ? 'Verifying...' : 'Connect with Nostr'}
          </button>
        </div>
      )}

      {step === 'details' && (
        <form onSubmit={handleSubmit} className="registration-details">
          <h2>Account Details</h2>
          
          <div className="form-group">
            <label>Public Key:</label>
            <input
              type="text"
              value={formData.publicKey}
              readOnly
              className="public-key-input"
            />
            <small>Hex nostr public key.</small>
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                email: e.target.value
              }))}
              required
              className="email-input"
            />
          </div>

          <div className="form-group">
            <label>Package:</label>
            <select
              value={formData.package}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                package: e.target.value
              }))}
              required
              className="package-select"
            >
              <option value="">Select a package</option>
              <option value="basic">Basic Hosting</option>
              <option value="premium">Premium Hosting</option>
            </select>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="register-button"
          >
            {loading ? 'Processing...' : 'Register'}
          </button>
        </form>
      )}

      {step === 'confirm' && (
        <div className="confirmation">
          <h2>Account Created Successfully!</h2>
          <p>Auto login</p>
          <p>Your hosting account is now ready to use.</p>          
          <p>List cPanel accounts.</p>
        </div>
      )}
    </div>
  );
};

export default NostrRegistration;