for dialect in mysql mariadb postgres sqlite; do
    npx sequelize-cli db:migrate --env "$dialect" || exit 1
done