import { Button } from "./ui/button";

export default function AssessmentLink() {
  const handleStartAssessment = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSfuKxxqApOXCZmQh5hO9V5-_4bWHgTsA-mxEtCmXHmQCscCdw/viewform', '_blank');
  };

  return (
    <Button 
      onClick={handleStartAssessment}
      className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-6 px-6 rounded-xl border-2 border-blue-400 transform transition duration-200 ease-in-out hover:scale-105"
    >
      <div className="flex items-center justify-center">
        <span className="mr-2 text-white text-lg">🧠</span>
        <span className="text-white text-sm tracking-wider">ASSESSMENT CHALLENGE</span>
        <span className="ml-2 text-white text-lg">🏆</span>
      </div>
    </Button>
  );
}