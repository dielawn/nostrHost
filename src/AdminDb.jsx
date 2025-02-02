import { useEffect, useState } from 'react'

export function AdminDb({ setMessage }) {
    const [dbUsers, setDbUsers] = useState([]);
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [updatedKey, setUpdatedKey] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    async function handleDelete(userId) {
        try {
            if (confirm(`Delete user: ${userId}`)) {
                const response = await fetch(`/api/admin/customers/${userId}`, {
                    method: 'DELETE',
                });
                const data = await response.json();
                if (response.ok) {
                    setMessage(data.message);
                    listCustomers(); // Refresh the list
                } else {
                    throw new Error(data.error);
                }
            }
        } catch (error) {
            console.error('Error:', error.message);
            setMessage(`Error: ${error.message}`);
        }        
    }

    async function handleUpdate(userId) {
        try {
            const updatedData = {
                email: updatedEmail,
                publicKey: updatedKey
            };
            
            const response = await fetch(`/api/admin/customers/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            });
            
            const data = await response.json();
            if (response.ok) {
                setMessage(data.message);
                setSelectedId(null);
                listCustomers(); // Refresh the list
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error.message);
            setMessage(`Error: ${error.message}`);
        } 
    }

    async function listCustomers() {
        try {            
            const response = await fetch('/api/admin/customers');
            const data = await response.json();
            if (response.ok) {
                setDbUsers(data);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error.message);
            setMessage(`Error: ${error.message}`);
        }
    };
     
    useEffect(() => {
        listCustomers();
    }, []);

    return (
        <div>
            {dbUsers && dbUsers.map((user, index) => (
                <div key={index}>
                    <p>Public Key: {user.publicKey}</p>
                    <p>ID: {user.id}</p>
                    {user.id === selectedId ? 
                    <>
                        <div>
                            <label>Public Key:</label>
                            <input 
                                value={updatedKey}
                                onChange={(e) => setUpdatedKey(e.target.value)}
                                placeholder="Enter new public key"
                            />
                        </div>
                        <div>
                            <label>Email:</label>
                            <input 
                                value={updatedEmail}
                                onChange={(e) => setUpdatedEmail(e.target.value)}
                                placeholder="Enter new email"
                            />
                        </div>
                        <button onClick={() => handleUpdate(user.id)}>Save</button>
                        <button onClick={() => setSelectedId(null)}>Cancel</button>
                    </>
                    :
                    <>
                        <p>Email: {user.email}</p>
                        <button onClick={() => {
                            setSelectedId(user.id);
                            setUpdatedEmail(user.email);
                            setUpdatedKey(user.publicKey);
                        }}>Edit</button>
                    </>
                    }                    
                    <button onClick={() => handleDelete(user.id)}>Delete</button>
                    <hr />
                </div>
            ))}
        </div>
    )
};