let navigate;

export const setNavigate = (nav) => {
    navigate = nav;
};

export const globalNavigate = (...args) => {
    if (navigate) {
        navigate(...args);
    }
};
