const SummaryRenderer = ({ summary }) => {
    if (!summary) return <p className="text-gray-500">No summary available.</p>;
    
    const paragraphs = summary.split("\n\n").map((para, index) => {
      const formattedPara = para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                                .replace(/\n/g, "<br />");
      return <p key={index} className="mb-3" dangerouslySetInnerHTML={{ __html: formattedPara }} />;
    });
  
    return (
      <div className="prose prose-blue max-w-none">
        {paragraphs}
      </div>
    );
  };
  export default SummaryRenderer;