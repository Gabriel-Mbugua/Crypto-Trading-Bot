export const createControllerWrapper = (serviceFn, errorCode) => async (req, res, next) => {
    try {
        const input = { ...req.body, ...req.query, ...req.params };
        console.log(`L-API-${errorCode}`, JSON.stringify(input));

        res.locals.responseBody = await serviceFn(input);

        if (typeof res.locals.responseBody === "string") {
            res.send(res.locals.responseBody);
        } else if (res?.locals?.responseBody?.type) {
            res.set(res.locals.responseBody.type);
            res.send(res.locals.responseBody.buffer);
        } else {
            res.status(200).json(res.locals.responseBody);
        }
    } catch (err) {
        if (!err?.errorCode) err.errorCode = `E-API-${errorCode}`;
        next(err);
    }
};
