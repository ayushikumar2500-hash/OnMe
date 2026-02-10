import { useEffect, useState } from "react";

const API = "http://localhost:8080";

export default function App() {
  // ---------- Users ----------
  const [users, setUsers] = useState([]);
  const [userError, setUserError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // ---------- Groups ----------
  const [groups, setGroups] = useState([]);
  const [groupError, setGroupError] = useState("");
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState(new Set());
  const [selectedGroupId, setSelectedGroupId] = useState("");

  // ---------- Expenses / Balances ----------
  const [expenseError, setExpenseError] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [paidByUserId, setPaidByUserId] = useState("");

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);

  function loadUsers() {
    setUserError("");
    fetch(`${API}/users`)
      .then((res) => {
        if (!res.ok) throw new Error("GET /users failed: " + res.status);
        return res.json();
      })
      .then((data) => {
        setUsers(data);
        // default payer if not set
        if (!paidByUserId && data.length > 0) setPaidByUserId(String(data[0].id));
      })
      .catch((e) => setUserError(String(e)));
  }

  function loadGroups() {
    setGroupError("");
    fetch(`${API}/groups`)
      .then((res) => {
        if (!res.ok) throw new Error("GET /groups failed: " + res.status);
        return res.json();
      })
      .then((data) => {
        setGroups(data);
        // default selected group if not set
        if (!selectedGroupId && data.length > 0) setSelectedGroupId(String(data[0].id));
      })
      .catch((e) => setGroupError(String(e)));
  }

  function loadExpensesAndBalances(groupId) {
    if (!groupId) return;

    setExpenseError("");

    fetch(`${API}/groups/${groupId}/expenses`)
      .then((res) => {
        if (!res.ok) throw new Error("GET /expenses failed: " + res.status);
        return res.json();
      })
      .then(setExpenses)
      .catch((e) => setExpenseError(String(e)));

    fetch(`${API}/groups/${groupId}/balances`)
      .then((res) => {
        if (!res.ok) throw new Error("GET /balances failed: " + res.status);
        return res.json();
      })
      .then(setBalances)
      .catch((e) => setExpenseError(String(e)));
  }

  useEffect(() => {
    loadUsers();
    loadGroups();
  }, []);

  // whenever selectedGroupId changes, refresh expenses + balances
  useEffect(() => {
    if (selectedGroupId) loadExpensesAndBalances(selectedGroupId);
  }, [selectedGroupId]);

  function createUser(e) {
    e.preventDefault();
    setUserError("");

    fetch(`${API}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("POST /users failed: " + res.status);
        return res.json();
      })
      .then(() => {
        setName("");
        setEmail("");
        loadUsers();
      })
      .catch((e) => setUserError(String(e)));
  }

  function toggleUser(userId) {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function createGroup(e) {
    e.preventDefault();
    setGroupError("");

    const memberUserIds = Array.from(selectedUserIds);

    fetch(`${API}/groups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: groupName, memberUserIds }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("POST /groups failed: " + res.status);
        return res.json();
      })
      .then((created) => {
        setGroupName("");
        setSelectedUserIds(new Set());
        loadGroups();
        setSelectedGroupId(String(created.id));
      })
      .catch((e) => setGroupError(String(e)));
  }

  function addExpenseEqual(e) {
    e.preventDefault();
    setExpenseError("");

    if (!selectedGroupId) {
      setExpenseError("Pick a group first.");
      return;
    }

    const amt = Number(amount);
    if (!description || !amt || amt <= 0) {
      setExpenseError("Enter a description and a positive amount.");
      return;
    }

    fetch(`${API}/groups/${selectedGroupId}/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paidByUserId: Number(paidByUserId),
        amount: amt,
        description,
        splitType: "EQUAL",
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("POST /expenses failed: " + res.status);
        return res.json();
      })
      .then(() => {
        setDescription("");
        setAmount("");
        loadExpensesAndBalances(selectedGroupId);
      })
      .catch((e) => setExpenseError(String(e)));
  }

  function userName(id) {
    const u = users.find((x) => String(x.id) === String(id));
    return u ? u.name : `User ${id}`;
  }

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h1>Expense Tracker</h1>

      {/* ---------- USERS ---------- */}
      <h2>Create User</h2>
      <form onSubmit={createUser} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ padding: 8, width: 260 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8, width: 260 }}
          />
        </div>

        <button type="submit" style={{ padding: "8px 12px" }}>
          Add User
        </button>

        {userError ? (
          <div style={{ color: "red", marginTop: 10 }}>{userError}</div>
        ) : null}
      </form>

      <h2>Users</h2>
      <ul style={{ marginBottom: 24 }}>
        {users.map((u) => (
          <li key={u.id}>
            {u.name} — {u.email} (id: {u.id})
          </li>
        ))}
      </ul>

      <hr style={{ margin: "24px 0" }} />

      {/* ---------- GROUPS ---------- */}
      <h2>Create Group</h2>
      <form onSubmit={createGroup} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Group name (ex: Roommates)"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            style={{ padding: 8, width: 320 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ marginBottom: 6 }}>Select members:</div>
          {users.length === 0 ? (
            <div style={{ color: "#555" }}>Create users first.</div>
          ) : (
            users.map((u) => (
              <label key={u.id} style={{ display: "block", marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={selectedUserIds.has(u.id)}
                  onChange={() => toggleUser(u.id)}
                  style={{ marginRight: 8 }}
                />
                {u.name} (id: {u.id})
              </label>
            ))
          )}
        </div>

        <button type="submit" style={{ padding: "8px 12px" }}>
          Create Group
        </button>

        {groupError ? (
          <div style={{ color: "red", marginTop: 10 }}>{groupError}</div>
        ) : null}
      </form>

      <h2>Groups</h2>
      <div style={{ marginBottom: 8 }}>
        <label>
          Selected group:{" "}
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
          >
            <option value="">-- choose --</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} (id: {g.id})
              </option>
            ))}
          </select>
        </label>
      </div>

      <ul style={{ marginBottom: 24 }}>
        {groups.map((g) => (
          <li key={g.id}>
            <b>{g.name}</b> (id: {g.id}) — members:{" "}
            {g.memberUserIds && g.memberUserIds.length > 0
              ? g.memberUserIds.join(", ")
              : "(none)"}
          </li>
        ))}
      </ul>

      <hr style={{ margin: "24px 0" }} />

      {/* ---------- EXPENSES ---------- */}
      <h2>Add Expense (Equal Split)</h2>
      <form onSubmit={addExpenseEqual} style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Description (ex: Dinner)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ padding: 8, width: 320 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="Amount (ex: 60)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ padding: 8, width: 140 }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <label>
            Paid by:{" "}
            <select
              value={paidByUserId}
              onChange={(e) => setPaidByUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} (id: {u.id})
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" style={{ padding: "8px 12px" }}>
          Add Expense (EQUAL)
        </button>

        {expenseError ? (
          <div style={{ color: "red", marginTop: 10 }}>{expenseError}</div>
        ) : null}
      </form>

      <h2>Expenses</h2>
      {expenses.length === 0 ? (
        <div style={{ color: "#555", marginBottom: 16 }}>No expenses yet.</div>
      ) : (
        <ul style={{ marginBottom: 16 }}>
          {expenses.map((e) => (
            <li key={e.id}>
              <b>{e.description}</b> — ${e.amount} paid by {userName(e.paidByUserId)}
            </li>
          ))}
        </ul>
      )}

      <h2>Balances</h2>
      {balances.length === 0 ? (
        <div style={{ color: "#555" }}>No balances (or everyone is settled).</div>
      ) : (
        <ul>
          {balances.map((d, idx) => (
            <li key={idx}>
              {userName(d.fromUserId)} owes {userName(d.toUserId)} ${d.amount}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
