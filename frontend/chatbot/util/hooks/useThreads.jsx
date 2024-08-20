import { useState, useEffect } from 'react';
import axios from 'axios';

export const useThreads = () => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/threads`;
      const response = await axios.get(url);
      setThreads(Array.isArray(response.data) ? response.data.reverse() : []);
    } catch (error) {
      console.error("Error fetching threads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThreads();
  }, []);

  return { threads, loading, fetchThreads };
};
