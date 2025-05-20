import React, { useEffect, useState } from 'react';
import SimpleAssessment from '@/components/SimpleAssessment';
import { Redirect } from 'wouter';
import axios from 'axios';

const SimpleAssessmentPage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check if user is authenticated
    axios.get('/api/auth/me')
      .then(response => {
        setUser(response.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);
  
  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }
  
  if (!user) {
    return <Redirect to="/login" />;
  }
  
  return (
    <div className="py-6">
      <SimpleAssessment />
    </div>
  );
};

export default SimpleAssessmentPage;