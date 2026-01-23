
export interface Speaker {
    name: string;
    designation: string;
}

export interface Mentalism {
    id: string;
    title: string;
    description: string;
    speakers: Speaker[];
    image: string; // URL to the image
}

export const mentalism: Mentalism[] = [
    {
        id: "mentalism-show",
        title: "MENTALISM SHOW",
        description: "“The mind is not a vessel to be filled, but a fire to be ignited.” ~ Plutarch\n\n🧠🔥 Think you’re in control? Think again. 🔥🧠\n\nReality will blur, thoughts will betray you, and secrets won’t stay hidden for long. As part of TESSERACT 9.0, IEEE SB SJCET presents a jaw-dropping Mentalism Show that will challenge everything you believe about the human mind.",
        speakers: [
            {
                name: "hypnotist.anandhuuu",
                designation: "Mentalist"
            }
        ],
        image: "/mentalism.jpeg"
    }
];
