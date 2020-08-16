const init = (ws, req) => {
    ws.on('message', function(msg) {
        let count = 1;
        const check = () => {
            if (count >= 5) {
                ws.send(JSON.stringify({status: 'finished', db: {data: 'data'}}));
                return;
            }
            ws.send(JSON.stringify({status: 'loading', message: `count: ${count++}`}));
            setTimeout(check, 1000);
        };
        check();
    });
};

module.exports = {
    init
};
