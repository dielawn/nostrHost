import { useEffect, useState } from 'react'
const API_BASE_URL = import.meta.env.VITE_SERVER_URL;

export function AdminDb({ setMessage }) {
    const [dbUsers, setDbUsers] = useState([]);
    const [updatedEmail, setUpdatedEmail] = useState('');
    const [updatedKey, setUpdatedKey] = useState('');
    const [selectedId, setSelectedId] = useState(null);

    async function handleDelete(userId) {
        try {
            if (confirm(`Delete user: ${userId}`)) {
                const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                setMessage(data.message);
                listCustomers(); // Refresh the list
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
            
            const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updatedData)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setMessage(data.message);
            setSelectedId(null);
            listCustomers(); // Refresh the list
        } catch (error) {
            console.error('Error:', error.message);
            setMessage(`Error: ${error.message}`);
        } 
    }

    async function listCustomers() {
        try {            
            const response = await fetch(`${API_BASE_URL}/customers`, {
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            setDbUsers(data);
        } catch (error) {
            console.error('Error:', error.message);
            setMessage(`Error: ${error.message}`);
        }
    }
     
    useEffect(() => {
        listCustomers();
    }, []);

    return (
        <div className="admin-container">
            <h2>User Management</h2>
            {dbUsers && dbUsers.map((user, index) => (
                <div key={index} className="user-card">
                    <div className="user-info">
                        <p><strong>Public Key:</strong> {user.publicKey}</p>
                        <p><strong>ID:</strong> {user.id}</p>
                        {user.id === selectedId ? (
                            <div className="edit-form">
                                <div className="form-group">
                                    <label>Public Key:</label>
                                    <input 
                                        value={updatedKey}
                                        onChange={(e) => setUpdatedKey(e.target.value)}
                                        placeholder="Enter new public key"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email:</label>
                                    <input 
                                        value={updatedEmail}
                                        onChange={(e) => setUpdatedEmail(e.target.value)}
                                        placeholder="Enter new email"
                                    />
                                </div>
                                <div className="button-group">
                                    <button onClick={() => handleUpdate(user.id)}>Save</button>
                                    <button onClick={() => setSelectedId(null)}>Cancel</button>
                                </div>
                            </div>
                        ) : (
                            <div className="user-details">
                                <p><strong>Email:</strong> {user.email}</p>
                                <div className="button-group">
                                    <button onClick={() => {
                                        setSelectedId(user.id);
                                        setUpdatedEmail(user.email);
                                        setUpdatedKey(user.publicKey);
                                    }}>Edit</button>
                                    <button onClick={() => handleDelete(user.id)}>Delete</button>
                                </div>
                            </div>
                        )}
                    </div>
                    <hr />
                </div>
            ))}
        </div>
    );
};