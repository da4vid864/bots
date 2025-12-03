import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const ScoringRulesManager = ({ botId }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    keyword: '',
    match_type: 'contains',
    points: 10,
    response_message: '',
    tag_to_add: ''
  });

  useEffect(() => {
    if (botId) {
      fetchRules();
    }
  }, [botId]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/scoring-rules/${botId}`);
      if (!response.ok) throw new Error('Failed to fetch rules');
      const data = await response.json();
      setRules(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? parseInt(value) || 0 : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/scoring-rules/${botId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to create rule');
      
      const newRule = await response.json();
      setRules([...rules, newRule]);
      setShowForm(false);
      setFormData({
        keyword: '',
        match_type: 'contains',
        points: 10,
        response_message: '',
        tag_to_add: ''
      });
    } catch (err) {
      alert('Error creating rule: ' + err.message);
    }
  };

  const handleDelete = async (ruleId) => {
    if (!window.confirm(t('scoring.confirm_delete'))) return;
    
    try {
      const response = await fetch(`/api/scoring-rules/${ruleId}?botId=${botId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete rule');
      
      setRules(rules.filter(r => r.id !== ruleId));
    } catch (err) {
      alert('Error deleting rule: ' + err.message);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading rules...</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 mt-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">{t('scoring.title', 'Lead Scoring Rules')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {showForm ? t('scoring.cancel', 'Cancel') : t('scoring.add_rule', 'Add Rule')}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scoring.keyword', 'Keyword / Pattern')}
              </label>
              <input
                type="text"
                name="keyword"
                value={formData.keyword}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scoring.match_type', 'Match Type')}
              </label>
              <select
                name="match_type"
                value={formData.match_type}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="contains">Contains</option>
                <option value="exact">Exact Match</option>
                <option value="regex">Regular Expression</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scoring.points', 'Points')}
              </label>
              <input
                type="number"
                name="points"
                value={formData.points}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('scoring.tag', 'Tag to Add (Optional)')}
              </label>
              <input
                type="text"
                name="tag_to_add"
                value={formData.tag_to_add}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md"
                placeholder="e.g., interested, pricing"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('scoring.response', 'Auto Response (Optional)')}
            </label>
            <textarea
              name="response_message"
              value={formData.response_message}
              onChange={handleInputChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded-md"
              placeholder="Message to send automatically when matched"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium"
            >
              {t('scoring.save_rule', 'Save Rule')}
            </button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('scoring.keyword', 'Keyword')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('scoring.type', 'Type')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('scoring.points', 'Points')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('scoring.actions', 'Actions')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  {t('scoring.no_rules', 'No scoring rules defined yet.')}
                </td>
              </tr>
            ) : (
              rules.map((rule) => (
                <tr key={rule.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {rule.keyword}
                    {rule.tag_to_add && (
                      <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800">
                        +{rule.tag_to_add}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.match_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`font-bold ${rule.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {rule.points > 0 ? '+' : ''}{rule.points}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('scoring.delete', 'Delete')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScoringRulesManager;