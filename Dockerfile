FROM node:carbon

ENV NPM_CONFIG_LOGLEVEL warn
ARG app_env
ENV APP_ENV $app_env

RUN mkdir -p /poster
WORKDIR /poster
COPY ./poster ./

RUN npm install

CMD if [ ${APP_ENV} = production ]; \
	then \
	npm run start-all-prod \
	else \
	npm run start-all-dev \
	fi

EXPOSE 7700
