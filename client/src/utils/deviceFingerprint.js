// Generate a browser/device fingerprint
export const generateDeviceFingerprint = async () => {
    const components = [
        navigator.userAgent,
        navigator.language,
        navigator.platform,
        navigator.hardwareConcurrency || "",
        navigator.deviceMemory || "",
        `${screen.width}x${screen.height}`,
        `${screen.colorDepth}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        navigator.cookieEnabled,
        navigator.doNotTrack || ""
    ];

    const fingerprintString = components.join("|");

    // Convert string into SHA-256 hash
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);

    const hashBuffer = await crypto.subtle.digest("SHA-256", data);

    const hashArray = Array.from(new Uint8Array(hashBuffer));

    const fingerprint = hashArray
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");

    return fingerprint;
};


// Get browser name
export const getBrowserName = () => {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Edg/")) {
        return "Microsoft Edge";
    }

    if (userAgent.includes("Chrome")) {
        return "Google Chrome";
    }

    if (userAgent.includes("Firefox")) {
        return "Mozilla Firefox";
    }

    if (userAgent.includes("Safari")) {
        return "Safari";
    }

    if (userAgent.includes("OPR/")) {
        return "Opera";
    }

    return "Unknown Browser";
};


// Get operating system
export const getOSName = () => {
    const userAgent = navigator.userAgent;

    if (userAgent.includes("Windows")) {
        return "Windows";
    }

    if (userAgent.includes("Mac OS")) {
        return "macOS";
    }

    if (userAgent.includes("Android")) {
        return "Android";
    }

    if (userAgent.includes("iPhone") || userAgent.includes("iPad")) {
        return "iOS";
    }

    if (userAgent.includes("Linux")) {
        return "Linux";
    }

    return "Unknown OS";
};


// Get device name
export const getDeviceName = () => {
    const platform = navigator.platform || "Unknown";

    if (/Win/i.test(platform)) {
        return "Windows Device";
    }

    if (/Mac/i.test(platform)) {
        return "Mac Device";
    }

    if (/Linux/i.test(platform)) {
        return "Linux Device";
    }

    return "Web Device";
};