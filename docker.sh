#!/bin/sh

case $1 in
    start)
        docker container run --name weppo-postgres \
            -e POSTGRES_PASSWORD=weppo \
            -e POSTGRES_USER=weppo \
            -e POSTGRES_DB=weppo \
            -p 5432:5432 \
            -d postgres
        ;;
    stop)
        docker container stop weppo-postgres
        docker container rm weppo-postgres
        ;;
    psql)
        docker container exec -it weppo-postgres psql -U weppo -d weppo
        ;;
    init)
        cat db/weppo.sql | docker container exec -i weppo-postgres psql -U weppo -d weppo -a
        ;;
esac
