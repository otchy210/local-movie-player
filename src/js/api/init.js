const init = (req, res) => {
    res.send(JSON.stringify({message: 'init'}));
};

module.exports = {
    init
};