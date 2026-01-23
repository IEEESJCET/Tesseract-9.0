
export interface Speaker {
    name: string;
    designation: string;
}

export interface Workshop {
    id: string;
    title: string;
    description: string;
    speakers: Speaker[];
    image: string; // URL to the image
}

export const workshops: Workshop[] = [
    {
        id: "hack-the-system",
        title: "HACK THE SYSTEM - LEGALLY",
        description: "“Security is not a product, it’s a process.” ~ Bruce Schneier\n\n🔐 HACK THE SYSTEM — LEGALLY 🔐\nAn Ethical Hacking Workshop\n\nStep into the world of cybersecurity with a power-packed workshop under TESSERACT 9.0. \n\nDiscover how vulnerabilities are found, attacks are prevented, and systems are secured  ethically and effectively.\n\nDecode threats. Defend smart. Hack responsibly. ⚡",
        speakers: [
            {
                name: "Zaina Ameer",
                designation: "Cybersecurity Analyst, Purple Nexus"
            },
            {
                name: "Muhammed Ashique",
                designation: "CEO, SkillMerge Hackers Academy"
            }
        ],
        image: "/hack-the-system.jpg"
    },
    {
        id: "ai-made-simple",
        title: "AI MADE SIMPLE",
        description: "“Artificial intelligence is not a substitute for human intelligence, but a powerful tool to amplify it.” ~ Fei-Fei Li\n\n🤖 AI MADE SIMPLE 🤖\nAutomating Arduino with Machine Learning\n\nAs part of TESSERACT 9.0, the flagship event of IEEE SB SJCET, this hands-on workshop breaks down AI into practical, real-world applications. Learn how machine learning can seamlessly integrate with Arduino to build smarter, automated systems.",
        speakers: [
            {
                name: "Pravitha P",
                designation: "STEM & AI Educator, HowNWhy Education"
            }
        ],
        image: "/ai-made-simple.jpeg"
    }
];
