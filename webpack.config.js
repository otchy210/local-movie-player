const path = require('path');

module.exports = {
    mode: 'production',
    entry: {
        app: './src/js/app.js',
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader"
                }
            }
        ]
    },
    output: {
        filename: '[name].js',
        path: path.resolve('./dist/js')
    },
};
