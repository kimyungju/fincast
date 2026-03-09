const SentimentBreakdown = ({
  hawkish,
  dovish,
  neutral,
}: {
  hawkish: number;
  dovish: number;
  neutral: number;
}) => {
  const total = hawkish + dovish + neutral;
  if (total === 0) {
    return (
      <p className="text-12 text-white-4 font-serif italic">No sentiment data yet</p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Bar */}
      <div className="flex h-3 w-full border-2 border-mid-gray overflow-hidden">
        {hawkish > 0 && (
          <div
            className="bg-red-500 h-full"
            style={{ width: `${hawkish}%` }}
          />
        )}
        {neutral > 0 && (
          <div
            className="bg-yellow-400 h-full"
            style={{ width: `${neutral}%` }}
          />
        )}
        {dovish > 0 && (
          <div
            className="bg-blue-400 h-full"
            style={{ width: `${dovish}%` }}
          />
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between text-10 font-bold uppercase tracking-wider">
        <span className="text-red-400">Hawkish {hawkish}%</span>
        <span className="text-yellow-400">Neutral {neutral}%</span>
        <span className="text-blue-400">Dovish {dovish}%</span>
      </div>
    </div>
  );
};

export default SentimentBreakdown;
