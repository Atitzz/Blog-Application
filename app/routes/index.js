const blogRouter = require('./blog');
const usersRouter = require('./users');

function route(app) {
    app.get('*', function (req, res, next) {
        res.locals.user = req.user || null
        next()
    })
    app.use('/', blogRouter);
    app.use('/users', usersRouter);
}

module.exports = route;
