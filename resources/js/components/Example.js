import React, { useEffect, useState } from "react";

export default function Example() {
  const [fname, setFirstname] = useState("");
  const [lname, setLastname] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const fetchProfiles = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch("/api/profiles", { headers: { Accept: "application/json" } });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Failed to fetch");
      setProfiles(Array.isArray(json.data) ? json.data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();
    if (!fname.trim() || !lname.trim()) {
      setError("Firstname and Lastname are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ fname: fname.trim(), lname: lname.trim() }),
      });
      const json = await res.json();
      if (!res.ok || json.success === false) throw new Error(json.message || "Create failed");
      setMessage("Profile created successfully.");
      setFirstname("");
      setLastname("");
      await fetchProfiles();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="container">
        {error && <div className="alert alert-danger py-2">{error}</div>}
        {message && <div className="alert alert-success py-2">{message}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Firstname"
            value={fname}
            onChange={(e) => setFirstname(e.target.value)}
          />
          <input
            type="text"
            placeholder="Lastname"
            value={lname}
            onChange={(e) => setLastname(e.target.value)}
          />
          <input type="submit" disabled={loading} />
        </form>
        <table>
          <thead>
            <tr>
              <th>Firstname</th>
              <th>Lastname</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id}>
                <td>{profile.fname}</td>
                <td>{profile.lname}</td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan="2">{loading ? "Loading..." : "No profiles yet."}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

