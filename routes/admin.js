'use strict';

/**
 * Module dependencies.
 */

var CP_get   = require('../lib/CP_get');
var CP_text  = require('../lib/CP_text');
var CP_save  = require('../lib/CP_save');
var CP_cache = require('../lib/CP_cache');

/**
 * Configuration dependencies.
 */

var config  = require('../config/config');
var modules = require('../config/modules');
var texts   = require('../config/texts');

/**
 * Node dependencies.
 */

var express = require('express');
var exec    = require('child_process').exec;
var async   = require('async');
var router  = express.Router();

/**
 * Callback.
 *
 * @callback Callback
 * @param {Object} err
 * @param {Object} [result]
 */

router.get('/:type?', function(req, res) {

    var c = JSON.stringify(config);
    var m = JSON.stringify(modules);
    var t = JSON.stringify(texts);

    var render = {
        "config"  : JSON.parse(c),
        "modules" : JSON.parse(m),
        "texts"   : JSON.parse(t),
        "type"    : req.params.type || 'admin'
    };

    var kp_id = (req.query.movie)
        ? req.query.movie
        : null;
    var mass = (req.query.movies)
        ? req.query.movies
        : null;
    var collection_url = (req.query.collection)
        ? req.query.collection
        : null;

    switch (req.params.type) {
        case 'index':
            render.title = 'Главная страница';
            res.render('admin/index', render);
            break;
        case 'movies':
            render.title = 'Фильмы';
            getMovie(function (err, render) {
                res.render('admin/movies', render);
            });
            break;
        case 'main':
            render.title = 'Настройки';
            res.render('admin/main', render);
            break;
        case 'urls':
            render.title = 'URL ссылки сайта';
            res.render('admin/urls', render);
            break;
        case 'display':
            render.title = 'Отображение';
            res.render('admin/display', render);
            break;
        case 'titles':
            render.title = 'Названия';
            res.render('admin/titles', render);
            break;
        case 'descriptions':
            render.title = 'Описания';
            res.render('admin/descriptions', render);
            break;
        case 'codes':
            render.title = 'Коды';
            res.render('admin/codes', render);
            break;
        case 'cache':
            render.title = 'Кэширование';
            res.render('admin/cache', render);
            break;
        case 'load':
            render.title = 'Распределение нагрузки';
            res.render('admin/load', render);
            break;
        case 'publish':
            render.title = 'Публикация';
            getCountMovies(function (err, render) {
                CP_get.publishIds(function (err, ids) {
                    if (err) console.log(err);
                    render.soon_id = (ids && ids.soon_id) ? ids.soon_id : [];
                    render.soon_id = render.soon_id.filter(function(id) {
                        return texts.ids.indexOf(id) < 0;
                    });
                    res.render('admin/publish', render);
                });
            });
            break;
        case 'collections':
            render.title = 'Коллекции';
            getCollection(function (err, render) {
                res.render('admin/modules/collections', render);
            });
            break;
        case 'comments':
            render.title = 'Комментарии';
            res.render('admin/modules/comments', render);
            break;
        case 'related':
            render.title = 'Связанные';
            res.render('admin/modules/related', render);
            break;
        case 'slider':
            render.title = 'Слайдер';
            res.render('admin/modules/slider', render);
            break;
        case 'abuse':
            render.title = 'Скрыть';
            res.render('admin/modules/abuse', render);
            break;
        case 'top':
            render.title = 'Топ';
            res.render('admin/modules/top', render);
            break;
        case 'social':
            render.title = 'Социальные сети';
            res.render('admin/modules/social', render);
            break;
        case 'schema':
            render.title = 'Микроразметка';
            res.render('admin/modules/schema', render);
            break;
        case 'soon':
            render.title = 'Скоро';
            res.render('admin/modules/soon', render);
            break;
        case 'continue':
            render.title = 'Продолжить';
            res.render('admin/modules/continue', render);
            break;
        case 'viewed':
            render.title = 'Просмотренные';
            res.render('admin/modules/viewed', render);
            break;
        case 'player':
            render.title = 'Плеер';
            res.render('admin/modules/player', render);
            break;
        case 'blocking':
            render.title = 'Блокировка';
            res.render('admin/modules/blocking', render);
            break;
        case 'mobile':
            render.title = 'Мобильная версия';
            res.render('admin/modules/mobile', render);
            break;
        case 'episode':
            render.title = 'Серии';
            res.render('admin/modules/episode', render);
            break;
        case 'adv':
            render.title = 'Реклама';
            res.render('admin/modules/adv', render);
            break;
        default:
            render.title = 'Панель администратора';
            getCountMovies(function (err, render) {
                res.render('admin/admin', render);
            });
            break;
    }

    /**
     * Get movie.
     *
     * @param {Callback} callback
     */

    function getMovie(callback) {

        render.movie = null;
        render.movies = null;

        if (kp_id) {
            kp_id = parseInt(kp_id);
            CP_get.movies({"query_id": kp_id, "certainly": true}, function (err, movies) {
                if (err) {
                    console.log(err);
                }

                render.movie = {};
                render.movie.kp_id = kp_id;

                if (movies && movies.length) {
                    render.movie = movies[0];
                    render.movie.title = CP_text.formatting(config.titles.movie.single, movies[0]);
                }

                if (texts.ids.indexOf(kp_id)+1) {
                    render.movie.title = render.texts.movies[kp_id].title;
                    render.movie.description = render.texts.movies[kp_id].description;
                }

                callback(null, render);
            });
        }
        else if (mass) {
            render.movies = true;
            callback(null, render);
        }
        else {
            callback(null, render);
        }

    }

    /**
     * Get collection.
     *
     * @param {Callback} callback
     */

    function getCollection(callback) {

        render.collection = null;

        if (collection_url) {
            if (render.modules.collections.data.collections[collection_url]) {
                render.collection = render.modules.collections.data.collections[collection_url];
                render.collection.url = collection_url;
            }
            else {
                render.collection = {};
            }
        }

        return callback(null, render);

    }

    /**
     * Get count all and publish movies in website.
     *
     * @param {Callback} callback
     */

    function getCountMovies(callback) {

        async.series({
                "all": function (callback) {
                    CP_get.count({"all_movies": "_all_", "certainly": true}, function (err, count) {
                        if (err) return callback(err);

                        callback(null, count);

                    });
                },
                "publish": function (callback) {
                    CP_get.count({"all_movies": "_all_"}, function (err, count) {
                        if (err) return callback(err);

                        callback(null, count);

                    });
                }
            },
            function(err, result) {

                if (err) {
                    console.log(err);
                    result = {"all": 0, "publish": 0};
                }

                render.counts = result;
                render.counts.percent = Math.round((100 * result.publish) / result.all);
                render.counts.days = ((result.all - result.publish) && config.publish.every.movies && config.publish.every.hours)
                    ? Math.round((result.all - result.publish)/Math.round((24 * config.publish.every.movies) / config.publish.every.hours))
                    : 0;

                callback(null, render);

            });

    }

});

router.post('/change', function(req, res) {

    var form = req.body;

    var configs = {
        "config"  : config,
        "modules" : modules,
        "texts"   : texts
    };

    var change = {
        "config"  : false,
        "modules" : false,
        "texts"   : false,
        "restart" : false
    };

    if (form.config) {

        if ((form.config.urls && form.config.urls.admin && form.config.urls.admin != configs.config.urls.admin) || (form.config.theme && form.config.theme != configs.config.theme)) {
            change.restart = true;
        }

        change.config  = true;
        configs.config = parseData(configs.config, form.config);

    }

    if (form.modules) {

        change.modules  = true;
        configs.modules = parseData(configs.modules, form.modules);

    }

    if (form.collection) {

        if (form.collection.url) {

            if (form.delete) {
                if (configs.modules.collections.data.collections[form.collection.url]) {
                    delete configs.modules.collections.data.collections[form.collection.url];
                }
            }
            else {
                var movies = [];
                form.collection.movies = form.collection.movies.split(',');
                for (var i = 0; i < form.collection.movies.length; i++) {
                    if (parseInt(form.collection.movies[i])) {
                        movies.push(parseInt(form.collection.movies[i]));
                    }
                }
                if (movies.length) {
                    change.modules = true;
                    form.collection.movies = movies;
                    configs.modules.collections.data.collections[form.collection.url] = form.collection;
                }
            }

        }

    }

    if (form.movie) {

        form.movie.kp_id = (parseInt(form.movie.kp_id)) ? parseInt(form.movie.kp_id) : 0;

        if (form.movie.kp_id)
            addMovie(form.movie);

    }

    if (form.movies) {

        var reg = new RegExp('\\s*\\(\\s*([0-9]{3,7})\\s*\\)\\s*\\{([^]*?)\\}\\s*', 'gi');

        var parts = form.movies.match(reg);

        parts.forEach(function (part) {

            var r = new RegExp('\\s*\\(\\s*([0-9]{3,7})\\s*\\)\\s*\\{([^]*?)\\}\\s*', 'gi');

            var p = r.exec(part);

            if (p && p.length) {

                var movie = {};

                movie.kp_id = parseInt(p[1]);

                var td = p[2].split('|');
                if (td.length == 2) {
                    movie.title = td[0].replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
                    movie.description = td[1].replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
                }
                else {
                    movie.description = td[0].replace(/\s+/g, ' ').replace(/(^\s*)|(\s*)$/g, '');
                }

                addMovie(movie);

            }

        });

    }

    if (form.switch && form.switch.module && modules[form.switch.module]) {

        change.modules = true;
        configs.modules[form.switch.module].status = (form.switch.status === 'true');

    }

    if (form.restart) {

        CP_save.restart(function (err, result) {
            console.log('Type:', 'restart', 'Error:', err, 'Result:', result);
            return (err)
                ? res.status(404).send(err)
                : res.send(result)
        });

    }
    else if (form.flush) {

        CP_cache.flush(function(err) {
            console.log('Type:', 'flush', 'Error:', err);
            return (err)
                ? res.status(404).send(err)
                : res.send('Flush.')
        });

    }
    else if (form.image) {

        exec('/home/' + config.domain + '/config/i 9', function (err, out, stderr) {
            console.log('Type:', 'image', 'Error:', err);
            return (err)
                ? res.status(404).send(err)
                : res.send('Image.')
        });

    }
    else if (form.database) {

        exec('/home/' + config.domain + '/config/i 4 ' + config.domain + ' ' + form.database + ' Yes', function (err, out, stderr) {
            console.log('Type:', 'database', 'Error:', err);
            return (err)
                ? res.status(404).send(err)
                : res.send('Database.')
        });

    }
    else if (change.config || change.modules || change.texts) {

        async.series({
                "config": function (callback) {
                    return (change.config)
                        ? CP_save.save(
                        configs.config,
                        'config',
                        function (err, result) {
                            return (err)
                                ? callback(err)
                                : callback(null, result)
                        })
                        : callback(null, null);
                },
                "modules": function (callback) {
                    return (change.modules)
                        ? CP_save.save(
                        configs.modules,
                        'modules',
                        function (err, result) {
                            return (err)
                                ? callback(err)
                                : callback(null, result)
                        })
                        : callback(null, null);
                },
                "texts": function (callback) {
                    return (change.texts)
                        ? CP_save.save(
                        configs.texts,
                        'texts',
                        function (err, result) {
                            return (err)
                                ? callback(err)
                                : callback(null, result)
                        })
                        : callback(null, null);
                }
            },
            function(err, result) {

                console.log('Type:', 'save', 'Result:', result, 'Error:', err);
                return (err)
                    ? res.status(404).send(err)
                    : (change.restart)
                    ? CP_save.restart(
                    function (err, result) {
                        console.log('Type:', 'restart', 'Error:', err, 'Result:', result);
                        return (err)
                            ? res.status(404).send(err)
                            : res.send(result)
                    })
                    : res.send(result);

            });

    }
    else {

        res.send('Nothing to form.');

    }

    /**
     * Determine what the configuration settings have been changed.
     *
     * @param {Object} config
     * @param {Object} changes
     * @return {Object}
     */

    function parseData(config, changes) {

        var originals = config;

        for (var key in originals) {
            if (originals.hasOwnProperty(key) && changes.hasOwnProperty(key)) {

                if (Array.isArray(originals[key])) {
                    var arr = (changes[key])
                        ? changes[key].split(',')
                        : [];
                    var clear_arr = [];
                    arr.forEach(function (text) {
                        text = text.replace(/(^\s*)|(\s*)$/g, '')
                            .replace(/\u2028/g, '')
                            .replace(/\u2029/g, '');
                        if (text) {
                            clear_arr.push(text);
                        }
                    });
                    originals[key] = clear_arr;
                }
                else if (typeof originals[key] === 'string') {
                    originals[key] = changes[key].toString()
                        .replace(/\u2028/g, '')
                        .replace(/\u2029/g, '');
                }
                else if (typeof originals[key] === 'number') {
                    originals[key] = parseInt(changes[key]);
                }
                else if (typeof originals[key] === 'boolean') {
                    originals[key] = (changes[key] === 'true');
                }
                else if (typeof originals[key] === 'object') {
                    originals[key] = parseData(originals[key], changes[key]);
                }

            }
        }

        return originals;

    }

    /**
     * Add movie in texts.
     *
     * @param {Object} movie
     */

    function addMovie(movie) {

        var id = movie.kp_id;

        if (form.delete) {
            change.texts = true;
            while (configs.texts.ids.indexOf(id) !== -1)
                configs.texts.ids.splice(configs.texts.ids.indexOf(id), 1);
            delete configs.texts.movies[id];

            if (configs.modules.collections.data.collections.choice) {
                change.modules = true;
                configs.modules.collections.data.collections.choice.movies.unshift(id);
                while (configs.modules.collections.data.collections.choice.movies.indexOf(id) !== -1)
                    configs.modules.collections.data.collections.choice.movies.splice(configs.modules.collections.data.collections.choice.movies.indexOf(id), 1);
            }
        }
        else {
            change.texts = true;
            if (configs.texts.ids.indexOf(id) === -1) {
                configs.texts.ids.push(id);
            }
            configs.texts.movies[id] = movie;

            if (configs.modules.collections.data.collections.choice) {
                change.modules = true;
                if (configs.modules.collections.data.collections.choice.movies.indexOf(id) === -1) {
                    if (configs.modules.collections.data.collections.choice.movies.length > 500) {
                        configs.modules.collections.data.collections.choice.movies.shift();
                    }
                    configs.modules.collections.data.collections.choice.movies.unshift(id);
                }
            }
        }

    }

});

module.exports = router;