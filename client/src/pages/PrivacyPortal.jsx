import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import Button from '../components/atoms/Button';

const PrivacyPortal = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    type: 'access',
    details: '',
  });
  const [submitStatus, setSubmitStatus] = useState(null);

  const requestTypes = ['access', 'rectification', 'cancellation', 'opposition'];

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const endpoint = user?.role === 'admin' ? '/api/compliance/requests' : '/api/compliance/my-requests';
      const response = await api.get(endpoint);
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');
    try {
      await api.post('/api/compliance/request', {
        request_type: formData.type,
        details: formData.details,
      });
      setSubmitStatus('success');
      setFormData({ type: 'access', details: '' });
      fetchRequests();
      setTimeout(() => setSubmitStatus(null), 3000);
    } catch (error) {
      console.error('Error submitting request:', error);
      setSubmitStatus('error');
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await api.put(`/api/compliance/request/${requestId}`, {
        status: newStatus,
      });
      fetchRequests();
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">{t('privacy.title')}</h1>
        <p className="text-slate-400">{t('privacy.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Submit Form */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4">New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('privacy.request_type')}
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {requestTypes.map((type) => (
                    <option key={type} value={type}>
                      {t(`privacy.types.${type}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">
                  {t('privacy.description')}
                </label>
                <textarea
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder={t('privacy.description_placeholder')}
                  rows="4"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitStatus === 'submitting'}
                className="w-full justify-center"
              >
                {submitStatus === 'submitting' ? '...' : t('privacy.submit')}
              </Button>

              {submitStatus === 'success' && (
                <p className="text-green-400 text-sm text-center mt-2">
                  {t('privacy.success_message')}
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Requests List */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 rounded-xl p-6 border border-slate-800">
            <h2 className="text-lg font-semibold text-white mb-4">
              {user?.role === 'admin' ? t('privacy.admin_view') : t('privacy.history')}
            </h2>
            
            {loading ? (
              <div className="text-center py-8 text-slate-400">{t('common.loading')}</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-slate-400">{t('privacy.no_requests')}</div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-md bg-blue-900/50 text-blue-200 mb-2">
                          {t(`privacy.types.${req.request_type}`)}
                        </span>
                        <p className="text-slate-300 text-sm mt-1">{req.details}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(req.status)}`}>
                        {t(`privacy.statuses.${req.status}`)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs text-slate-500 mt-4 border-t border-slate-700/50 pt-3">
                      <span>{new Date(req.created_at).toLocaleDateString()}</span>
                      {user?.role === 'admin' && req.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'rejected')}
                            className="px-3 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded transition-colors"
                          >
                            {t('privacy.reject')}
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(req.id, 'approved')}
                            className="px-3 py-1 bg-green-900/30 hover:bg-green-900/50 text-green-300 rounded transition-colors"
                          >
                            {t('privacy.approve')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPortal;