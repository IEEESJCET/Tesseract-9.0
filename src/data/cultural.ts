
export interface Speaker {
    name: string;
    designation: string;
}

export interface Cultural {
    id: string;
    title: string;
    description: string;
    speakers: Speaker[];
    image: string;
}

export const cultural: Cultural[] = [
    {
        id: "campfire",
        title: "Campfire Night",
        description: "\"Sometimes the best ideas spark away from screens.\" 🔥\n\nTESSERACT 9.0 - CAMPFIRE NIGHT\n\nThis is your sign to log out, step outside, and feel the fire.\n\n🗓️ Date: January 31st\n\nCome for the fire.\nStay for the moments.\nLeave with memories you'll talk about long after Tesseract ends.",
        speakers: [],
        image: "/campfire-night.jpeg"
    }
];
