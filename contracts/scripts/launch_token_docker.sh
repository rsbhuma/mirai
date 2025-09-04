docker run --rm -it \
    --net=host \
    -v $PWD:/code \
    --ulimit nofile=1000000:1000000 \
    community_coin:latest bash