import { useState, useEffect } from "react";
import { fetchNostrProfile } from "../utils/nostrUtils";
import { nip19 } from 'nostr-tools';

export function NostrProfile({ nostrProfile, setNostrProfile}) {
    const [npub, setNpub] = useState('');
  
     useEffect(() => {
        async function getProfile() {

            const publicKey = await window.nostr.getPublicKey();
            const bech32 = nip19.npubEncode(publicKey)
            setNpub(bech32)
            console.log('publicKey', publicKey)
            // retrieve and set profile
            const profile = await fetchNostrProfile(publicKey);
            setNostrProfile(profile);
            console.log('profile', profile)
        }
        getProfile()
     }, [])

    return (
        <div className="profile-info">
                {nostrProfile?.picture && (
                    <img 
                        src={nostrProfile.picture} 
                        alt="Profile" 
                        className="profile-picture"
                        onError={(e) => e.target.style.display = 'none'}
                    />
                )}
                <h3 className="welcome-message">
                    Welcome, {nostrProfile?.display_name || nostrProfile?.name || 'Nostrich'}!
                </h3>
              
                {nostrProfile?.about && (
                    <p className="profile-about">{nostrProfile.about}</p>
                )}
                <p className="profile-pubkey">
                    {npub && npub.slice(0, 8)}...{npub.slice(-8)}
                </p>
            </div>
         
            )
}

