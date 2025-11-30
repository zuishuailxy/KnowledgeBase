import { use, useEffect, useState } from "react";

interface UserData {
  name: string;
  email: string;
  username: string;
  phone: string;
  website: string;
}

export default function Effect() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState("1");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
      .then((response) => response.json())
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
        setLoading(false);
      });
  }, [userId]);

  return (
    <div>
      <label htmlFor="id">User ID:</label>
      <input
        name="id"
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        type="text"
        placeholder="Type something..."
      />
      <div>
        {loading ? (
          <p>Loading...</p>
        ) : userData?.name ? (
          <div>
            <h2>{userData.name}</h2>
            <p>Email: {userData.email}</p>
            <p>Username: {userData.username}</p>
            <p>Phone: {userData.phone}</p>
            <p>Website: {userData.website}</p>
          </div>
        ) : (
          <p>No user data available.</p>
        )}
      </div>
    </div>
  );
}
