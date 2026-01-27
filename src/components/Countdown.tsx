import { useState, useEffect, memo } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const TARGET_DATE = new Date('2026-01-31T00:00:00');

const RegistrationClosedPopup = memo(({ onClose }: { onClose: () => void }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in"
    onClick={onClose}
  >
    <div
      className="bg-[#1a1a2e] border border-primary/30 rounded-lg relative max-w-md mx-4 overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Terminal Header */}
      <div className="bg-[#0d0d1a] px-4 py-3 flex items-center gap-2 border-b border-primary/20">
        {/* Terminal Buttons */}
        <button
          onClick={onClose}
          className="w-3 h-3 rounded-full bg-[#ff5f56] hover:bg-[#ff5f56]/80 transition-colors cursor-pointer"
          aria-label="Close popup"
        />
        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
        <div className="w-3 h-3 rounded-full bg-[#27ca3f]" />
        <span className="ml-4 text-primary/60 text-sm font-mono">tesseract@registration</span>
      </div>

      {/* Terminal Content */}
      <div className="p-8 text-center font-mono">
        <div className="mb-4 text-primary/60 text-left">
          <span className="text-[#27ca3f]">$</span> ./check_registration --status
        </div>

        <div className="mb-6">
          <span className="text-6xl">🔒</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary glow-text mb-4">
          REGISTRATION CLOSED
        </h2>

        <p className="text-primary/80 font-display tracking-wide mb-2">
          Thank you for your interest in Tesseract 9.0!
        </p>
        <p className="text-primary/60 text-sm mb-6">
          <span className="text-[#ff5f56]">[ERROR]</span> Registration period has ended.
        </p>

        <button
          onClick={onClose}
          className="bg-primary text-background px-6 py-2 rounded font-mono font-bold tracking-wider hover:scale-105 transition-transform"
        >
          $ exit
        </button>
      </div>
    </div>
  </div>
));

export const Countdown = () => {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [showPopup, setShowPopup] = useState(false);
  const [showInitialPopup, setShowInitialPopup] = useState(false);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = TARGET_DATE.getTime() - new Date().getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialPopup(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  const timeBlocks = [
    { value: timeLeft.days, label: 'DAYS' },
    { value: timeLeft.hours, label: 'HOURS' },
    { value: timeLeft.minutes, label: 'MINS' },
    { value: timeLeft.seconds, label: 'SECS' },
  ];

  const handleButtonClick = () => {
    setShowPopup(true);
  };

  const closePopup = () => {
    setShowPopup(false);
  };

  const closeInitialPopup = () => {
    setShowInitialPopup(false);
  };



  return (
    <>
      {showInitialPopup && <RegistrationClosedPopup onClose={closeInitialPopup} />}

      {showPopup && <RegistrationClosedPopup onClose={closePopup} />}

      <div className="flex flex-col items-center gap-12 w-full max-w-5xl mx-auto px-4">
        {/* Date and Register Section */}
        <div className="flex flex-row items-center justify-center w-full gap-4 md:gap-12">
          {/* Left Date */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-2xl text-primary font-display tracking-widest mb-1 md:mb-2">JANUARY</span>
            <div className="flex gap-1">
              <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
                <span className="text-2xl md:text-8xl font-bold font-display">3</span>
              </div>
              <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
                <span className="text-2xl md:text-8xl font-bold font-display">1</span>
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-primary rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <button
              onClick={handleButtonClick}
              className="relative glow-button bg-primary text-background px-3 py-2 md:px-8 md:py-4 text-xs md:text-2xl font-bold font-display tracking-wider rounded-lg hover:scale-105 transition-transform flex items-center gap-2 whitespace-nowrap cursor-pointer"
            >
              REGISTRATION CLOSED
            </button>
          </div>

          {/* Right Date */}
          <div className="flex flex-col items-center">
            <span className="text-[10px] md:text-2xl text-primary font-display tracking-widest mb-1 md:mb-2">FEBRUARY</span>
            <div className="flex gap-1">
              <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
                <span className="text-2xl md:text-8xl font-bold font-display">0</span>
              </div>
              <div className="bg-primary text-background p-1 md:p-2 rounded w-8 h-12 md:w-24 md:h-32 flex items-center justify-center">
                <span className="text-2xl md:text-8xl font-bold font-display">1</span>
              </div>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="flex gap-2 md:gap-8 justify-center w-full">
          {timeBlocks.map((block, index) => (
            <div key={block.label} className="countdown-box glow-border">
              <span className="countdown-number font-display">
                {formatNumber(block.value)}
              </span>
              <span className="countdown-label">{block.label}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
