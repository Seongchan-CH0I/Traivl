# 아래의 Docker 배포용 빌드 설정은 나중에 실제 프로덕션 서버에 올릴 때만 주석을 해제하고 사용

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]