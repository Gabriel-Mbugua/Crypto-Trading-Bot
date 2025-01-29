import crypto from "crypto";

export const generateUniqueId = () => {
    const timestamp = Date.now().toString(36); // convert timestamp to base36
    const random = crypto.randomBytes(10).toString("hex"); // generate 10 random hex characters

    return (timestamp + random).substring(0, 20); // concatenate and limit to 20 characters
};

export const cleanAndSortData = (data) => {
    const cleanOrderParams = {};
    Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
            cleanOrderParams[key] = data[key];
        }
    });
    return cleanOrderParams;
};
