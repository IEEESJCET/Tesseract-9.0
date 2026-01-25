import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PixelArtScene } from "@/components/PixelArtScene";
import { Link } from "react-router-dom";
import { cultural } from "@/data/cultural";

const Cultural = () => {
    const event = cultural[0];

    return (
        <div className="min-h-screen bg-background text-foreground font-display selection:bg-primary/30 selection:text-primary flex flex-col">
            <Navigation hideOnMobile />

            <div className="container mx-auto px-4 py-8 relative flex-grow">
                <div className="flex justify-center md:justify-between items-center mb-8">
                    <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <img src="/tesseractlogo.png" alt="Tesseract Logo" className="w-12 h-12 object-contain" />
                        <span className="text-2xl font-bold tracking-wider hidden md:block">TESSERACT 9.0</span>
                    </Link>
                </div>

                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl text-primary font-bold uppercase tracking-wide mb-2">
                        {event.title}
                    </h1>
                    <div className="w-24 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)] mb-3"></div>
                    <p className="text-lg md:text-xl text-primary/70 tracking-wider font-medium">
                        January 31st, 2026
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                    <div className="border border-primary/30 p-4 rounded-none bg-card/10 backdrop-blur-sm relative group">

                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

                        <div className="aspect-square bg-gradient-to-b from-primary/20 to-transparent flex items-center justify-center overflow-hidden relative">
                            <img
                                src={event.image}
                                alt={event.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="mt-2 text-center text-primary/40 font-mono text-xs">
                            {event.title.toLowerCase().replace(/ /g, '')}.png
                        </div>
                    </div>

                    <div className="flex flex-col justify-center">
                        <p className="font-mono text-primary/80 leading-relaxed text-lg text-justify whitespace-pre-wrap">
                            {event.description}
                        </p>
                    </div>
                </div>

            </div>

            <div className="mt-auto">
                <Footer />
                <PixelArtScene />
            </div>
        </div>
    );
};

export default Cultural;
