export default class DB {
    constructor(db) {
        this.db = db;
    }

    list(query) {
        if (!query) {
            return this.db;
        }
        const filteredList = this.db.filter(movie => {
            return movie.name.includes(query);
        });
        return filteredList;
    }

    selectThumbnail(m, index) {
        const movie = this._getDbData(m);
        movie.selectedThumbnail = index;
        const params = {
            path: m.path,
            index
        };
        this._postApi('selectThumbnail', params);
    }

    _getDbData(movie) {
        for (let m of this.db) {
            if (m.path === movie.path) {
                return m;
            }
        }
        return false;
    }

    _postApi(action, params = {}) {
        const { context } = globalThis;
        const url = `http://localhost:${context.LMP_PORT}/api/${action}`;
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        });
    };
}