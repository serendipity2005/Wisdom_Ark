import './index.scss';

interface PromptProps {
  timePeriod: string;
  userName: string;
}
function Prompt({ timePeriod, userName }: PromptProps) {
  return (
    <div>
      <h1 className="promptText">
        {timePeriod}好，{userName}
      </h1>
    </div>
  );
}
export default Prompt;
