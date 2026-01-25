import { Lock, Laptop, ArrowRight, BrainCircuit, Brain, Wand } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const events = [
  {
    title: 'TECHNICAL WORKSHOPS',
    locked: false,
    path: '/workshops',
    description: 'Explore our hands-on technical workshops.',
    image: '/technical-workshop.png'
  },
  {
    title: 'MENTALISM',
    locked: false,
    path: '/mentalism',
    description: 'Think youre in control? Think again',
    image: '/mentalism-frame.png'
  },
  { title: 'SPECIAL GUEST', locked: true, icon: Lock },
  {
    title: 'CULTURAL NIGHT',
    locked: false,
    path: '/cultural',
    description: 'Expect chaos. Experience culture.',
    image: '/cultural.png'
  },
];

export const EventsSection = () => {
  const navigate = useNavigate();

  return (
    <section id="events" className="py-20 px-4 relative">

      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-20 pointer-events-none" />

      <div className="container mx-auto max-w-4xl relative z-10">
        {/* Section Title */}
        <h2 className="section-title font-display">EVENTS</h2>
        <div className="section-underline mb-8" />

        {/* Loading Indicator */}
        <p className="section-subtitle mb-12">
          <span className="text-primary">&gt;</span> Plans loading
          <span className="animate-blink">...</span>
        </p>

        {/* Event Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {events.map((event, index) => {
            const Icon = event.icon;

            return (
              <div
                key={index}
                className={`group transition-all duration-300 border border-border relative overflow-hidden
                  ${event.locked
                    ? 'event-card-locked hover:border-primary/50'
                    : 'glass-card p-6 cursor-pointer hover:border-primary hover:shadow-glow'
                  }`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => !event.locked && event.path && navigate(event.path)}
              >
                {/* Icon or Large Image */}
                {event.image ? (
                  <div className="mb-4 relative z-10 -mx-6 -mt-6">
                    <div className="border border-primary/30 overflow-hidden">
                      <img
                        src={event.image}
                        alt={event.title}
                        className="w-full h-48 object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center mb-4 relative z-10">
                    <div className={`p-4 rounded-xl border transition-colors
                      ${event.locked
                        ? 'bg-secondary/80 border-border group-hover:border-primary/50'
                        : 'bg-primary/10 border-primary/30 group-hover:bg-primary/20 group-hover:border-primary'
                      }`}>
                      <Icon className={`w-8 h-8 transition-colors
                        ${event.locked ? 'text-primary/70' : 'text-primary'}`}
                      />
                    </div>
                  </div>
                )}

                {/* Event Title */}
                <h3 className="text-lg font-display font-semibold text-primary tracking-wide mb-2 relative z-10 text-center">
                  {event.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground text-sm relative z-10 text-center">
                  {event.locked ? 'Event details will be revealed soon...' : event.description}
                </p>

                {/* Action Indicator */}
                {!event.locked && (
                  <div className="mt-4 flex justify-center relatives z-10">
                    <div className="flex items-center gap-2 text-xs font-mono text-primary/80 group-hover:text-primary transition-colors">
                      [ ACCESS GRANTED ] <ArrowRight className="w-3 h-3 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Progress Line for Locked */}
                {event.locked && (
                  <div className="mt-4 relative z-10">
                    <div className="h-0.5 bg-border rounded-full overflow-hidden">
                      <div className="h-full w-1/4 bg-primary rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
