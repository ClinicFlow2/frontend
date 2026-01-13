import { useEffect, useState } from "react";
import { getPatients, createPatient } from "../api/patients";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  // form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [sex, setSex] = useState("M"); // backend expects: sex
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");

  async function loadPatients() {
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.log(err);
      alert("❌ Failed to fetch patients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();

    try {
      await createPatient({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        sex: sex, // ✅ required by backend
        phone: phone.trim(),
        date_of_birth: dateOfBirth, // ✅ required if backend has it as required
        address: address.trim(), // ✅ backend says it cannot be blank
      });

      alert("✅ Patient created!");

      // clear form
      setFirstName("");
      setLastName("");
      setSex("M");
      setPhone("");
      setDateOfBirth("");
      setAddress("");

      // reload list
      setLoading(true);
      await loadPatients();
    } catch (err) {
      console.log("CREATE PATIENT ERROR:", err?.response?.data || err);
      alert(
        "❌ Failed to create patient:\n" +
          JSON.stringify(err?.response?.data || err, null, 2)
      );
    }
  };

  if (loading) return <p>Loading patients...</p>;

  return (
    <div style={{ marginTop: 20 }}>
      <h2>Patients</h2>

      {/* CREATE PATIENT FORM */}
      <form
        onSubmit={handleCreate}
        style={{
          marginBottom: 20,
          padding: 15,
          border: "1px solid #ddd",
          maxWidth: 450,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <h3>Add Patient</h3>

        <input
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <input
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />

        <select value={sex} onChange={(e) => setSex(e.target.value)} required>
          <option value="M">Male</option>
          <option value="F">Female</option>
        </select>

        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          required
        />

        <input
          placeholder="Address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />

        <button type="submit">Create Patient</button>
      </form>

      {/* LIST */}
      {patients.length === 0 ? (
        <p>No patients found.</p>
      ) : (
        <ul>
          {patients.map((p) => (
            <li key={p.id}>
              <b>
                {p.first_name} {p.last_name}
              </b>{" "}
              — {p.phone} — {p.sex}{" "}
              {p.address ? `— ${p.address}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}