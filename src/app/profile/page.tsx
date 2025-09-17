"use client";
import React, { useEffect, useState } from 'react';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(()=> {
    (async ()=>{
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
      setLoading(false);
    })();
  },[]);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Not logged in</p>;
  return (
    <div>
      <h1>Profile</h1>
      <p>Name: {user.name}</p>
      <p>Email: {user.email}</p>
      <p>Role: {user.role}</p>
      <a href="/my-books">My Books</a>
    </div>
  );
}
