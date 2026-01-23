FROM node:latest

WORKDIR /app

# Kopiuj pliki package
COPY package*.json ./

# Zainstaluj zależności
RUN npm install

# Kopiuj resztę plików
COPY . .

# Expose port Vite
EXPOSE 5173

# Uruchom dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
