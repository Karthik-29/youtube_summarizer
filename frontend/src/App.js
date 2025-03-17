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

  const extractVideoId = (url) => {     
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);     
    return match ? match[1] : null;   
  };    

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
      videoId: vId  // Only pass videoId, no need for URL
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
    <div className="p-6 w-full h-full bg-white">       
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {loading ? 
        <div className="text-center">
          <p>Summarizing video...</p>
          <div className="mt-2 w-full h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        </div> 
        : 
        summary ? 
          <SummaryRenderer summary={summary} /> 
          : 
          !error ? <p>Open a YouTube video to summarize.</p> : null
      }     
    </div>   
  ); 
}