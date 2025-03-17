/* global chrome */ 
import React, { useState, useEffect, useRef } from "react"; 
import SummaryRenderer from "./components/SummaryRenderer";  

export default function App() {   
  const [videoUrl, setVideoUrl] = useState("");   
  const [videoId, setVideoId] = useState("");   
  const [summary, setSummary] = useState("");   
  const [loading, setLoading] = useState(false);   
  const [error, setError] = useState("");   
  const pollingRef = useRef(null);    
  const [theme, setTheme] = useState("light");

  const extractVideoId = (url) => {     
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);     
    return match ? match[1] : null;   
  };    

  useEffect(() => {
    // Detect theme preference
    const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(isDarkMode ? 'dark' : 'light');
    
    // Listen for theme changes
    const themeChangeHandler = (e) => setTheme(e.matches ? 'dark' : 'light');
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChangeHandler);
    
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', themeChangeHandler);
    };
  }, []);

  useEffect(() => {     
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {       
      const activeTab = tabs[0];        
      
      if (activeTab?.url && activeTab.url.includes("youtube.com/watch")) {         
        const url = activeTab.url;         
        const vId = extractVideoId(url);          
        
        setVideoUrl(url);         
        setVideoId(vId);         
        
        if (vId) {
          checkSummaryStatus(vId);
        } else {
          setError("Could not extract video ID from URL");
        }       
      } else {         
        chrome.storage.local.get(["currentVideoUrl"], (result) => {           
          if (result.currentVideoUrl) {             
            const url = result.currentVideoUrl;             
            const vId = extractVideoId(url);              
            
            setVideoUrl(url);             
            setVideoId(vId);             
            
            if (vId) {
              checkSummaryStatus(vId);
            } else {
              setError("Could not extract video ID from stored URL");
            }
          } else {             
            setError("Please navigate to a YouTube video first.");           
          }         
        });       
      }     
    });      
    
    return () => clearInterval(pollingRef.current);   
  }, []);    

  const checkSummaryStatus = (vId) => {     
    setLoading(true);     
    chrome.runtime.sendMessage({ 
      action: "checkStatus", 
      videoId: vId
    }, (response) => {       
      if (response.status === "complete") {         
        setSummary(response.summary);         
        setLoading(false);       
      } else if (response.status === "pending") {         
        startPolling(vId);       
      } else if (response.status === "error") {    
        setLoading(false);       
        setError(response.message || "An error occurred");
        console.error(response.message);              
      } else {         
        startSummarization(vId);       
      }     
    });   
  };    

  const startPolling = (vId) => {     
    pollingRef.current = setInterval(() => {       
      chrome.runtime.sendMessage({ 
        action: "checkStatus", 
        videoId: vId
      }, (response) => {         
        if (response.status === "complete") {           
          setSummary(response.summary);           
          setLoading(false);           
          clearInterval(pollingRef.current);         
        } else if (response.status === "error") {
          setError(response.message || "An error occurred");
          setLoading(false);
          clearInterval(pollingRef.current);
          console.error(response.message);
        }      
      });     
    }, 2000);   
  };    

  const startSummarization = (vId) => {     
    setLoading(true);     
    chrome.runtime.sendMessage({ 
      action: "summarizeVideo", 
      videoId: vId
    }, (response) => {       
      if (response.status === "started" || response.status === "pending") {         
        startPolling(vId);       
      } else if (response.status === "error") {
        setLoading(false);
        setError(response.message || "An error occurred");
        console.error(response.message);
      }    
    });   
  };    

  return (     
    <div className={`p-6 w-full h-full rounded-lg ${theme === 'dark' ? 'bg-gray-800 text-gray-200' : 'bg-white text-gray-800'}`}>       
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? 
      <div className="text-center space-y-4">
      <p className="text-lg font-medium">Summarizing video...</p>
      {/* Skeleton loader */}
      <div className="space-y-2">
        <div className={`h-6 w-2/3 mx-auto rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        <div className={`h-4 w-5/6 mx-auto rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
        <div className={`h-4 w-4/6 mx-auto rounded-md ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
      </div>
    </div> 
        : 
        summary ? 
          <SummaryRenderer summary={summary} theme={theme} /> 
          : 
          !error ? <p>Open a YouTube video to summarize.</p> : null
      }     
    </div>   
  ); 
}