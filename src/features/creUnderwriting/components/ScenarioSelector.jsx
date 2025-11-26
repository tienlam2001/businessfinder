import React from 'react';
import { Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

const labels = {
  base: { label: 'Base', icon: Sparkles },
  downside: { label: 'Downside', icon: TrendingDown },
  upside: { label: 'Upside', icon: TrendingUp },
};

export default function ScenarioSelector({ scenarios, onChange }) {
  const { activeKey } = scenarios;
  const activeScenario = scenarios[activeKey] || {};

  const setActive = (key) => {
    onChange({ activeKey: key });
  };

  const handleChange = (field) => (e) => {
    onChange({
      [activeKey]: {
        ...activeScenario,
        [field]: e.target.value,
      },
    });
  };

  return (
    <div className="glass-card">
      <div className="section-header">
        <div>
          <h3 className="section-title">Scenario Controls</h3>
          <p className="section-subtitle">Toggle between sensitivities and edit adjustments.</p>
        </div>
        <div className="scenario-tabs">
          {['base', 'downside', 'upside'].map((key) => {
            const Icon = labels[key].icon;
            return (
              <button
                key={key}
                type="button"
                className={`btn-modern-subtle ${activeKey === key ? 'active' : ''}`}
                onClick={() => setActive(key)}
              >
                <Icon size={16} />
                {labels[key].label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="cre-grid">
        <div className="input-group">
          <label className="input-label">Rent Growth Adj (%)</label>
          <input
            className="modern-input"
            type="number"
            value={activeScenario.rentGrowthAdjPct}
            onChange={handleChange('rentGrowthAdjPct')}
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Expense Growth Adj (%)</label>
          <input
            className="modern-input"
            type="number"
            value={activeScenario.expenseGrowthAdjPct}
            onChange={handleChange('expenseGrowthAdjPct')}
            step="0.1"
          />
        </div>
        <div className="input-group">
          <label className="input-label">Vacancy Adj (%)</label>
          <input
            className="modern-input"
            type="number"
            value={activeScenario.vacancyAdjPct}
            onChange={handleChange('vacancyAdjPct')}
            step="0.1"
          />
        </div>
      </div>
    </div>
  );
}
