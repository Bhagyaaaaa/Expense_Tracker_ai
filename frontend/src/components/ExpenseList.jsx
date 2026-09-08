import { api } from '../api.js';

function formatDate(iso) {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });
}

export default function ExpenseList({ expenses, onDeleted }) {
  async function handleDelete(id) {
    await api.deleteExpense(id);
    onDeleted(id);
  }

  if (expenses.length === 0) {
    return (
      <div>
        <h2 className="panel-title">Your expenses</h2>
        <div className="empty-state">No expenses yet — add your first one on the left.</div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="panel-title">Your expenses</h2>
      <table className="ledger-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Category</th>
            <th>Note</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((exp) => (
            <tr key={exp.id}>
              <td>{formatDate(exp.expense_date)}</td>
              <td>
                <span className="category-tag">{exp.category}</span>
              </td>
              <td className="desc-cell">{exp.description || '—'}</td>
              <td className="amount-cell">{exp.amount.toFixed(2)}</td>
              <td>
                <button className="icon-btn" onClick={() => handleDelete(exp.id)} aria-label="Delete expense">
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
