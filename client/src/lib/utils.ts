import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
// https://peerjs.com/docs.html#peer-id
export const sanitizeUserIdForVideoCalling = (userId: string) => {
    return userId.replace(/[^0-9a-z]/gi, "X");
};

// PeerJS throws invalid_id error if it contains some characters such as that colyseus generates.
// https://peerjs.com/docs.html#peer-id
// appending '-ss' at the end of the id. It is for screen sharing.
export const sanitizeUserIdForScreenSharing = (userId: string) => {
    return `${userId.replace(/[^0-9a-z]/gi, "X")}-ss`;
};

