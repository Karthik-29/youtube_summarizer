import React from 'react';

const SummaryRenderer = ({ summary, theme = 'light' }) => {
  // If no summary is provided, show a placeholder message
  if (!summary) return <p className={`text-gray-500 ${theme === 'dark' ? 'text-gray-400' : ''}`}>No summary available.</p>;
  
  // Function to parse and render the summary content
  const renderContent = () => {
    // If summary is an object (structured data), render it as formatted JSON
    if (typeof summary === 'object') {
      return <p>{JSON.stringify(summary)}</p>;
    }
    
    // Handle text summaries with markdown-like formatting
    const paragraphs = summary.split("\n\n").map((para, index) => {
      // Support for bold text via ** markdown syntax
      const formattedPara = para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n/g, "<br />");
      
      return (
        <p 
          key={index} 
          className="mb-3" 
          dangerouslySetInnerHTML={{ __html: formattedPara }}
        />
      );
    });
    
    return paragraphs;
  };

  return (
    <div className={`summary-container ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
      <h4 className={`text-lg font-semibold mb-3 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
        Video Summary
      </h4>
      <div className={`summary-content prose prose-blue max-w-none ${theme === 'dark' ? 'text-gray-300 prose-invert' : 'text-gray-700'}`}>
        {renderContent()}
      </div>
    </div>
  );
};

export default SummaryRenderer;