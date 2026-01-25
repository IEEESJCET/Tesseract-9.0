
import { Toaster } from "@/components/ui/toaster";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PixelArtScene } from "@/components/PixelArtScene";
import { Link, useNavigate } from "react-router-dom";
import { workshops } from "@/data/workshops";

const Workshops = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-background text-foreground font-display selection:bg-primary/30 selection:text-primary scanlines flex flex-col">
            <Navigation hideOnMobile />

            <div className="container mx-auto px-4 py-8 relative flex-grow">
                <div className="flex justify-center md:justify-between items-center mb-12">
                    <Link to="/" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <img src="/tesseractlogo.png" alt="Tesseract Logo" className="w-12 h-12 object-contain" />
                        <span className="text-2xl font-bold tracking-wider hidden md:block">TESSERACT 9.0</span>
                    </Link>
                </div>

                <div className="flex flex-col items-center justify-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4 text-center tracking-widest">
                        <span className="text-primary/80">&gt;</span> WORKSHOPS
                    </h1>
                    <p className="text-lg md:text-xl text-primary/70 mb-12 text-center tracking-wider font-medium">
                        February 1st, 2026
                    </p>

                    <div className="w-full max-w-3xl space-y-6">
                        {workshops.map((workshop, index) => (
                            <div
                                key={index}
                                className="group relative border border-primary/20 bg-card/30 p-8 hover:bg-primary/5 hover:border-primary/50 transition-all duration-300 backdrop-blur-sm cursor-pointer"
                                onClick={() => navigate(`/workshops/${workshop.id}`)}
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 bg-primary/20 flex items-center justify-center shrink-0 rounded transition-colors group-hover:bg-primary/30">
                                        <div className="w-6 h-6 bg-primary" />
                                    </div>
                                    <h2 className="text-2xl md:text-3xl text-primary font-bold tracking-wide group-hover:text-primary/100">
                                        {workshop.title}
                                    </h2>
                                </div>
                                {/* Decorative corner accents on hover */}
                                <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-2 h-2 border-t border-r border-primary"></div>
                                </div>
                                <div className="absolute bottom-0 left-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-2 h-2 border-b border-l border-primary"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <Footer />
                <PixelArtScene />
            </div>
            <Toaster />
        </div>
    );
};

export default Workshops;
