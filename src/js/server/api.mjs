import { loadDat, saveDat, } from './common.mjs';

const selectThumbnail = (params) => {
    const {path, index} = params;
    const dat = loadDat(path);
    dat.selectedThumbnail = index;
    saveDat(path, dat);
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

export default api;
