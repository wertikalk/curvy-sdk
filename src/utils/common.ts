export const jsonStringify = (obj: any): string => {
    return JSON.stringify(obj, (_, v) =>
        typeof v === "bigint" ? v.toString() : v
    );
};
