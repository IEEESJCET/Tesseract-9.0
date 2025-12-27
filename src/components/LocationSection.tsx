import { MapPin, Navigation } from 'lucide-react';

export const LocationSection = () => {
  const embedSrc =
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3932.462339742505!2d76.7260948!3d9.7268467!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3b07cc024cb7c83f%3A0xc8944aaebb3ba492!2sSt.%20Joseph%27s%20College%20of%20Engineering%20and%20Technology%2C%20Palai%20(Autonomous)!5e0!3m2!1sen!2sin!4v1766851408365!5m2!1sen!2sin';

  const handleGetDirections = () => {
    window.open(
      'https://www.google.com/maps/place/St.+Joseph\'s+College+of+Engineering+and+Technology,+Palai',
      '_blank'
    );
  };

  return (
    <section className="py-20 px-4 relative">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">LOCATION</h2>
        <div className="section-underline mb-8" />

        {/* Subtitle */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Find us here
        </p>

        {/* Map */}
        <div className="terminal-card mb-6 relative">
          {/* Coordinates Badge */}
          <div className="absolute top-4 left-4 z-10">
            <div className="glass-card px-4 py-2 backdrop-blur-md">
              <span className="font-mono text-sm text-muted-foreground">
                St. Joseph's College of Engineering and Technology, Palai
              </span>
            </div>
          </div>

          <div className="aspect-video bg-secondary/30 flex items-center justify-center relative overflow-hidden">
            <iframe
              title="SJCET Palai - map"
              src={embedSrc}
              className="absolute inset-0 w-full h-full border-0"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />

            <div className="absolute bottom-4 right-4 z-20">
              <button
                onClick={handleGetDirections}
                className="glass-card px-3 py-2 font-mono text-xs text-primary hover:border-primary/50"
                type="button"
              >
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* Venue Info Card */}
        <div className="terminal-card">
          {/* Terminal Header */}
          <div className="terminal-header">
            <span className="terminal-dot-red" />
            <span className="terminal-dot-yellow" />
            <span className="terminal-dot-green" />
            <span className="text-muted-foreground text-sm ml-2 font-mono">
              location_data.txt
            </span>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Venue */}
            <div>
              <span className="text-muted-foreground text-sm block">&gt; VENUE</span>
              <h3 className="text-lg md:text-xl font-display font-semibold text-primary tracking-wide">
                ST. JOSEPH'S COLLEGE OF ENGINEERING AND TECHNOLOGY
              </h3>
              <p className="text-foreground mt-1">Palai, Kerala</p>
            </div>

            {/* Address */}
            <div>
              <span className="text-muted-foreground text-sm block">&gt; ADDRESS</span>
              <p className="text-foreground">
                Choondacherry P.O.
                <br />
                Palai, Kottayam
                <br />
                Kerala - 686579
              </p>
            </div>
          </div>
        </div>

        {/* Get Directions Button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={handleGetDirections}
            className="glass-card glow-button px-8 py-4 flex items-center gap-3 font-mono text-primary hover:border-primary/50 transition-all duration-300 group"
            type="button"
          >
            <Navigation className="w-5 h-5 group-hover:animate-pulse" />
            <span>GET DIRECTIONS</span>
          </button>
        </div>
      </div>
    </section>
  );
};
