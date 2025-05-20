import React from 'react';

interface AssessmentButtonProps {
  className?: string;
}

const AssessmentButton: React.FC<AssessmentButtonProps> = ({ className }) => {
  const handleAssessmentClick = () => {
    // Direct link to Google Forms assessment
    const url = 'https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform';
    window.open(url, '_blank');
  };

  return (
    <div 
      onClick={handleAssessmentClick}
      className={`group relative overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-3 px-6 rounded-xl border-2 border-blue-400 transform transition duration-200 ease-in-out hover:scale-105 cursor-pointer ${className}`}
    >
      {/* Corner decorations */}
      <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
      <div className="absolute -top-1 -left-1 w-3 h-3 bg-white/70 rounded"></div>
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-white/70 rounded"></div>
      
      <div className="relative flex items-center justify-center">
        <span className="mr-2 text-white text-lg">🧠</span>
        <span className="text-white text-sm tracking-wider pb-1">ASSESSMENT CHALLENGE</span>
        <span className="ml-2 text-white text-lg">🏆</span>
      </div>
      
      <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-blue-400 text-blue-900 text-xs font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">NEW!</div>
    </div>
  );
};

export default AssessmentButton;