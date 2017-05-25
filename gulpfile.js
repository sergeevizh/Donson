var
    gulp            = require('gulp'), // Подключаем Gulp
    browserSync     = require('browser-sync'), // Подключаем Browser Sync
    concat          = require('gulp-concat'), // Подключаем gulp-concat (для конкатенации файлов)
    rename          = require('gulp-rename'), // Подключаем библиотеку для переименования файлов
    del             = require('del'), // Подключаем библиотеку для удаления файлов и папок
    plumber         = require('gulp-plumber'), // Отлавливаем ошибки
    size            = require('gulp-size'), // Подключаем вывод размера файла

    sass            = require('gulp-sass'), // Подключаем Sass
    autoprefixer    = require('gulp-autoprefixer'), // Подключаем автопрефиксер
    csso            = require('gulp-csso'), // Подключаем пакет для минификации CSS
    combineMq       = require('gulp-combine-mq'), // Группируем media запросы

    imagemin        = require('gulp-imagemin'), // Подключаем библиотеку для сжатия изображений
    spritesmith     = require('gulp.spritesmith'), // Подключаем генерацию спрайтов
    pngquant        = require('imagemin-pngquant'), // Подключаем библиотеку для минификации png

    uglify          = require('gulp-uglifyjs'); // Подключаем минификатор для JS

var $ = {
    gutil: require('gulp-util'),
    svgSprite: require('gulp-svg-sprite'),
    size: require('gulp-size')
};

// Настройка SASS
gulp.task('sass', function () { // Создаем таск SASS
    return gulp.src('src/sass/main.scss') // Берем источник
        .pipe(plumber()) // отлавливаем ошибки при компиляции из SASS в CSS
        .pipe(sass().on('error', sass.logError)) // Преобразуем SASS в CSS
        .pipe(autoprefixer(
            ['last 15 versions', '> 1%', 'ie 8', 'ie 7'], {
                cascade: true
            }
        )) // Создаем префиксы
        .pipe(combineMq({
            beautify: false
        })) // Группируем медиа запросы
        .pipe(size({ // Вывод в консоль размер CSS
            showFiles: true
        }))
        .pipe(gulp.dest('src/css/'))
        .pipe(csso()) // Сжимаем
        .pipe(rename({
            suffix: '.min'
        })) // Добавляем суффикс .min
        .pipe(size({ // Вывод в консоль размер CSS после минификации
            showFiles: true
        }))
        .pipe(size({ // Вывод в консоль размер CSS после gzip
            showFiles: true,
            gzip: true
        }))
        .pipe(gulp.dest('src/css/')) // Выгружаем минифицированный css
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Создание SVG спрайта
gulp.task('svgSprite', function () {
    return gulp.src('src/img/icons-svg/*.svg')
        .pipe($.svgSprite({
            shape: {
                spacing: {
                    padding: 5
                }
            },
            mode: {
                css: {
                    dest: "./",
                    layout: "diagonal",
                    sprite: "../img/sprite.svg",
                    bust: false,
                    render: {
                        scss: {
                            dest: "../sass/global/sprite-svg.scss",
                            template: "src/sass/templates/_sprite_template.scss"
                        }
                    }
                }
            },
            variables: {
                mapname: "icons"
            }
        }))
        .pipe(gulp.dest('src/img/'))
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Настройка Browser-sync (автоперезагрузка)
gulp.task('browser-sync', function () { // Создаем таск browser-sync
    browserSync({ // Выполняем browserSync
        server: { // Определяем параметры сервера
            baseDir: 'src' // Директория для сервера - src
        },
        notify: false // Отключаем уведомления
    });
});

// Минификация JS
gulp.task('scripts', function () {
    return gulp.src([ // Берем JS файлы для минификации
            'src/js/modules/*.js'
        ])
        .pipe(size({ // Вывод в консоль размер JS
            showFiles: true
        }))
        .pipe(concat('main.js'))
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(size({ // Вывод в консоль размер JS после минификации
            showFiles: true
        }))
        .pipe(size({ // Вывод в консоль размер CSS после gzip
            showFiles: true,
            gzip: true
        }))
        .pipe(gulp.dest('src/js')) // Выгружаем результат
        .pipe(browserSync.reload({
            stream: true
        }));
});

// Вся работа в фоне
gulp.task('watch', ['browser-sync', 'sass', 'scripts', 'svgSprite'], function () {
    gulp.watch('src/sass/**/*.scss', ['sass']); // Наблюдение за sass файлами в папке sass
    gulp.watch('src/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта
    gulp.watch('src/js/modules/*.js', ['scripts']); // Наблюдение за JS файлами в папке js
    gulp.watch('src/img/icons-svg/*.svg', ['svgSprite']); // Наблюдение за SVG файлами в папке img
});

// --> Перенос проекта в продакшн --> //
// Очистка папки build
gulp.task('clean', function () {
    return del.sync('build'); // Удаляем папку build перед сборкой
});


//Сжатие загружаемых изображений
gulp.task('img', function () {
    return gulp.src('src/img/**/*.{png,svg,jpg,gif}') // Берем все изображения из src
        .pipe(cache(imagemin({ // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            optimizationlevel: 3,
            progressive: true,
            svgoPlugins: [{
                removeViewBox: false
            }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('build/img')) // Выгружаем на продакшен
        .pipe(gulp.dest('docs/img'));
});


// Перенос файлов в продакшн
gulp.task('build', ['clean', 'sass', 'scripts'], function () { // таск 'img'  удалён из массива build

    gulp.src([ // Переносим библиотеки в продакшен
            'src/css/main.min.css'
        ])
        .pipe(gulp.dest('build/css'));

    gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
        .pipe(gulp.dest('build/fonts'));

    gulp.src('src/js/**/*') // Переносим скрипты в продакшен
        .pipe(gulp.dest('build/js'));

    gulp.src('src/*.html') // Переносим HTML в продакшен
        .pipe(gulp.dest('build'));

    gulp.src('src/img/**/*.svg') // Переносим SVG в продакшен
        .pipe(gulp.dest('build/img'));
});


gulp.task('git', ['clean', 'sass', 'scripts'], function () {   // таск 'img'  удалён из массива git

    gulp.src([ // Переносим библиотеки в продакшен
            'src/css/main.min.css',
            'src/css/main.css'
        ])
        .pipe(gulp.dest('docs/css'));

    gulp.src('src/fonts/**/*') // Переносим шрифты в продакшен
        .pipe(gulp.dest('docs/fonts'));

    gulp.src('src/js/**/*') // Переносим скрипты в продакшен
        .pipe(gulp.dest('docs/js'));

    gulp.src('src/*.html') // Переносим HTML в продакшен
        .pipe(gulp.dest('docs'));

    gulp.src('src/img/**/*.svg') // Переносим SVG в продакшен
        .pipe(gulp.dest('docs/img'));
});


// Task по умолчнаию
gulp.task('default', ['watch']);