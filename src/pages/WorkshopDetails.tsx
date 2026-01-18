
import { useParams, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { PixelArtScene } from "@/components/PixelArtScene";
import { workshops } from "@/data/workshops";
import NotFound from "@/pages/NotFound";
import { User, Tag } from "lucide-react";

const WorkshopDetails = () => {
    const { id } = useParams();
    const workshop = workshops.find((w) => w.id === id);

    if (!workshop) {
        // Return a simple Not Found or redirect
        return <NotFound />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-display selection:bg-primary/30 selection:text-primary flex flex-col">
            <Navigation hideOnMobile />

            <div className="container mx-auto px-4 py-8 relative flex-grow">
                {/* Header / Breadcrumb */}
                <div className="flex justify-center md:justify-between items-center mb-8">
                    <Link to="/workshops" className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
                        <img src="/tesseractlogo.png" alt="Tesseract Logo" className="w-12 h-12 object-contain" />
                        <span className="text-2xl font-bold tracking-wider hidden md:block">TESSERACT 9.0</span>
                    </Link>
                </div>

                {/* Title Section with Underline */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl text-primary font-bold uppercase tracking-wide mb-2">
                        {workshop.title}
                    </h1>
                    <div className="w-24 h-1 bg-primary rounded-full shadow-[0_0_10px_rgba(34,197,94,0.6)]"></div>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                    {/* Image Column */}
                    <div className="border border-primary/30 p-4 rounded-none bg-card/10 backdrop-blur-sm relative group">
                        {/* Decorative corners */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

                        <div className="aspect-square bg-gradient-to-b from-primary/20 to-transparent flex items-center justify-center overflow-hidden relative">
                            {/* Display actual image from workshop data */}
                            <img
                                src={workshop.image}
                                alt={workshop.title}
                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                            />
                            <div className="absolute inset-0 bg-primary/10 mix-blend-overlay group-hover:bg-transparent transition-colors"></div>
                        </div>
                        <div className="mt-2 text-center text-primary/40 font-mono text-xs">
                            {workshop.title.toLowerCase().replace(/ /g, '')}.png
                        </div>
                    </div>

                    {/* Text Column */}
                    <div className="flex flex-col justify-center">
                        <p className="font-mono text-primary/80 leading-relaxed text-lg text-justify whitespace-pre-wrap">
                            {workshop.description}
                        </p>
                    </div>
                </div>

                {/* Speaker Info Box */}
                <div className="terminal-card rounded-none mt-8 relative overflow-hidden">
                    {/* Terminal Header */}
                    <div className="terminal-header">
                        <span className="terminal-dot-red" />
                        <span className="terminal-dot-yellow" />
                        <span className="terminal-dot-green" />
                        <span className="text-muted-foreground text-sm ml-2 font-mono">
                            {workshop.title.toLowerCase().replace(/ /g, '')}.txt
                        </span>
                    </div>

                    <div className="p-5 space-y-8">
                        {workshop.speakers.map((speaker, index) => (
                            <div key={index} className={index !== 0 ? "pt-6 border-t border-primary/20" : ""}>
                                {/* Speaker Name */}
                                <div className="flex items-start gap-3 mb-4">
                                    <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <span className="text-muted-foreground text-sm block">
                                            &gt; SPEAKER {workshop.speakers.length > 1 ? `#${index + 1}` : ''}
                                        </span>
                                        <span className="text-foreground font-semibold text-lg">
                                            {speaker.name}
                                        </span>
                                    </div>
                                </div>

                                {/* Designation */}
                                <div className="flex items-start gap-3">
                                    <Tag className="w-5 h-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <span className="text-muted-foreground text-sm block">
                                            &gt; DESIGNATION
                                        </span>
                                        <span className="text-foreground font-semibold text-lg">
                                            {speaker.designation}
                                        </span>
                                    </div>
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
        </div>
    );
};

export default WorkshopDetails;
