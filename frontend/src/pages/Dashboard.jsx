import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import Navbar from '../components/Navbar.jsx';
import ExpenseForm from '../components/ExpenseForm.jsx';
import ExpenseList from '../components/ExpenseList.jsx';
import AiChat from '../components/AiChat.jsx';

export default function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getExpenses()
      .then(setExpenses)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => {
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const thisMonthKey = new Date().toISOString().slice(0, 7); // "YYYY-MM"
    const thisMonth = expenses
      .filter((e) => e.expense_date.startsWith(thisMonthKey))
      .reduce((sum, e) => sum + e.amount, 0);

    const byCategory = {};
    expenses.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
    });
    const topCategory = Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0];

    return { total, thisMonth, topCategory: topCategory ? topCategory[0] : '—' };
  }, [expenses]);

  function handleAdded(newExpense) {
    setExpenses((prev) => [newExpense, ...prev]);
  }

  function handleDeleted(id) {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <div className="app-shell">
      <Navbar />
      <div className="main">
        {error && <div className="error-banner">{error}</div>}

        <div className="stats-row">
          <div className="stat">
            <div className="stat-label">Total spent</div>
            <div className="stat-value">{stats.total.toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">This month</div>
            <div className="stat-value accent">{stats.thisMonth.toFixed(2)}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Top category</div>
            <div className="stat-value">{stats.topCategory}</div>
          </div>
        </div>

        {loading ? (
          <p>Loading your expenses…</p>
        ) : (
          <>
            <div className="dashboard-grid">
              <ExpenseForm onAdded={handleAdded} />
              <ExpenseList expenses={expenses} onDeleted={handleDeleted} />
            </div>

            <AiChat />
          </>
        )}
      </div>
    </div>
  );
}
