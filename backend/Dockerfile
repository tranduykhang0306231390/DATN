# Giai đoạn 1: Cài dependency PHP bằng Composer
FROM composer:2 AS vendor

WORKDIR /app

COPY composer.json composer.lock ./

RUN composer install \
    --no-dev \
    --no-scripts \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-reqs

# Giai đoạn 2: Image chạy ứng dụng Laravel
FROM php:8.2-cli

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libzip-dev \
    zip \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install \
        pdo \
        pdo_mysql \
        mbstring \
        xml \
        bcmath \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

COPY . .

COPY --from=vendor /app/vendor/ vendor/

EXPOSE 10000

CMD sh -c "php artisan migrate --force && php artisan config:cache && php artisan serve --host 0.0.0.0 --port ${PORT:-10000}"
