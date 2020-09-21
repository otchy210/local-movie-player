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
}