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

    // Set up SSE connection
    const eventSource = new EventSource(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/events/threads`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      //console.log("event data ",updatedThread);
      data.operationType === "insert"&&setThreads((prevThreads)=> [data.fullDocument,...prevThreads])
      data.fullDocument.id&&alert(`New Thread Added => ${data.fullDocument.id}`);
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close(); // Clean up the event source when the component unmounts
    };
  }, []);

  return { threads, loading, fetchThreads };
};
