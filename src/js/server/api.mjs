let context;

const selectThumbnail = (params) => {
    const {path, index} = params;
    console.log(path, index, context);
};

const api = (req, res) => {
    const { action } = req.params;
    const params = req.body;
    switch (action) {
        case 'selectThumbnail':
            selectThumbnail(params);
            break;
    }
    res.send();
};

export default (_context) => {
    context = _context;
    return api;
};
